import { db } from '../db/connection.js';
import { dockerService } from './docker.service.js';
import { orderService } from './order.service.js';
import { parseTS3Logs } from './log-parser.service.js';
import { allocatePortPair } from '../utils/port-allocator.js';
import { detectPublicIp } from '../utils/ip-detect.js';
import { config } from '../config.js';
import type { Container } from '@ts-manager/shared';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const containerService = {
  async list(): Promise<(Container & { order?: any })[]> {
    const containers = await db('containers')
      .select('containers.*')
      .orderBy('containers.created_at', 'desc');

    // Attach order info
    const orderIds = containers.map((c: any) => c.order_id).filter(Boolean);
    const orders = orderIds.length > 0
      ? await db('orders').whereIn('id', orderIds)
      : [];
    const orderMap = new Map(orders.map((o: any) => [o.id, o]));

    return containers.map((c: any) => ({
      ...c,
      order: orderMap.get(c.order_id) || null,
    }));
  },

  async getById(id: number): Promise<(Container & { order?: any }) | undefined> {
    const container = await db('containers').where({ id }).first();
    if (!container) return undefined;

    let order = null;
    if (container.order_id) {
      order = await db('orders').where({ id: container.order_id }).first();
    }
    return { ...container, order };
  },

  async deliver(orderId: number): Promise<Container> {
    const order = await orderService.getById(orderId);
    if (!order) throw new Error('Order not found');
    if (order.status !== 'pending') throw new Error('Order is not in pending status');

    // Check if already delivered
    const existing = await db('containers').where({ order_id: orderId }).first();
    if (existing) throw new Error('Order already has a container');

    const { voicePort, queryPort } = await allocatePortPair();
    const containerName = `ts3-order-${orderId}`;

    // Create and start Docker container
    const container = await dockerService.createContainer({
      name: containerName,
      image: config.tsImage,
      voicePort,
      queryPort,
    });

    const containerId = container.id;
    await dockerService.startContainer(containerId);

    // Wait for TS3 to initialize and write logs
    await sleep(5000);

    // Parse logs for credentials
    const logs = await dockerService.getContainerLogs(containerId);
    const credentials = parseTS3Logs(logs);

    // Detect public IP
    const publicIp = await detectPublicIp();
    const host = config.customDomain || publicIp;
    const serverAddress = `ts3server://${host}:${voicePort}`;

    // Calculate expiry
    const now = new Date();
    const expiresAt = new Date(now.getTime() + order.duration_days * 24 * 60 * 60 * 1000);

    // Save to database
    const [insertedId] = await db('containers').insert({
      order_id: orderId,
      container_id: containerId,
      container_name: containerName,
      voice_port: voicePort,
      query_port: queryPort,
      admin_username: 'serveradmin',
      admin_password: credentials.password,
      admin_token: credentials.token,
      server_address: serverAddress,
      status: 'running',
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    // Update order status
    await orderService.updateStatus(orderId, 'delivered');

    return db('containers').where({ id: insertedId }).first() as Promise<Container>;
  },

  async reset(id: number): Promise<Container> {
    const record = await db('containers').where({ id }).first();
    if (!record) throw new Error('Container not found');

    // Remove old container
    await dockerService.removeContainer(record.container_id).catch(() => {});

    // Recreate
    const container = await dockerService.createContainer({
      name: record.container_name + '-reset-' + Date.now(),
      image: config.tsImage,
      voicePort: record.voice_port,
      queryPort: record.query_port,
    });

    await dockerService.startContainer(container.id);
    await sleep(5000);

    const logs = await dockerService.getContainerLogs(container.id);
    const credentials = parseTS3Logs(logs);

    const publicIp = await detectPublicIp();
    const host = config.customDomain || publicIp;

    // Recalculate expiry from order
    const order = record.order_id
      ? await db('orders').where({ id: record.order_id }).first()
      : null;
    const durationDays = order?.duration_days || 30;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await db('containers').where({ id }).update({
      container_id: container.id,
      container_name: record.container_name + '-reset-' + Date.now(),
      admin_password: credentials.password,
      admin_token: credentials.token,
      server_address: `ts3server://${host}:${record.voice_port}`,
      status: 'running',
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      updated_at: now.toISOString(),
    });

    return db('containers').where({ id }).first() as Promise<Container>;
  },

  async recycle(id: number): Promise<void> {
    const record = await db('containers').where({ id }).first();
    if (!record) throw new Error('Container not found');

    // Remove Docker container
    await dockerService.removeContainer(record.container_id).catch(() => {});

    // Update container status
    await db('containers').where({ id }).update({
      status: 'removed',
      updated_at: new Date().toISOString(),
    });

    // Update order status
    if (record.order_id) {
      await orderService.updateStatus(record.order_id, 'recycled');
    }
  },

  async refresh(id: number): Promise<Container> {
    const record = await db('containers').where({ id }).first();
    if (!record) throw new Error('Container not found');

    const order = record.order_id
      ? await db('orders').where({ id: record.order_id }).first()
      : null;
    const durationDays = order?.duration_days || 30;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await db('containers').where({ id }).update({
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      updated_at: now.toISOString(),
    });

    return db('containers').where({ id }).first() as Promise<Container>;
  },

  async getStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    deliveredOrders: number;
    totalContainers: number;
    runningContainers: number;
    expiringSoon: any[];
  }> {
    const totalOrders = await db('orders').count('* as count').first();
    const pendingOrders = await db('orders').where({ status: 'pending' }).count('* as count').first();
    const deliveredOrders = await db('orders').where({ status: 'delivered' }).count('* as count').first();
    const totalContainers = await db('containers').count('* as count').first();
    const runningContainers = await db('containers').where({ status: 'running' }).count('* as count').first();

    // Containers expiring within 3 days
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const expiringSoon = await db('containers')
      .where('status', 'running')
      .where('expires_at', '<=', threeDaysFromNow)
      .orderBy('expires_at', 'asc')
      .limit(10);

    return {
      totalOrders: Number(totalOrders?.count || 0),
      pendingOrders: Number(pendingOrders?.count || 0),
      deliveredOrders: Number(deliveredOrders?.count || 0),
      totalContainers: Number(totalContainers?.count || 0),
      runningContainers: Number(runningContainers?.count || 0),
      expiringSoon,
    };
  },
};
