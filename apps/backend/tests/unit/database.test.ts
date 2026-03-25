import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import knex, { type Knex } from 'knex';

describe('Database Schema', () => {
  let db: Knex;

  beforeEach(async () => {
    db = knex({
      client: 'better-sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
    });

    await db.schema.createTable('orders', (table) => {
      table.increments('id').primary();
      table.string('order_number', 255).unique().notNullable();
      table.string('purchase_channel', 50).notNullable().defaultTo('custom');
      table.string('buyer_name', 255).notNullable();
      table.string('buyer_contact', 255).defaultTo('');
      table.integer('duration_days').notNullable().defaultTo(30);
      table.text('notes').defaultTo('');
      table.string('status', 20).notNullable().defaultTo('pending');
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });

    await db.schema.createTable('containers', (table) => {
      table.increments('id').primary();
      table.integer('order_id').unsigned().unique().references('id').inTable('orders').onDelete('SET NULL');
      table.string('container_id', 64).notNullable();
      table.string('container_name', 255).notNullable();
      table.integer('voice_port').notNullable();
      table.integer('query_port').notNullable();
      table.string('admin_username', 255).defaultTo('serveradmin');
      table.string('admin_password', 255).defaultTo('');
      table.text('admin_token').defaultTo('');
      table.string('server_address', 255).defaultTo('');
      table.string('status', 20).notNullable().defaultTo('running');
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('expires_at').nullable();
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
  });

  afterEach(async () => {
    await db.destroy();
  });

  it('should create and retrieve an order', async () => {
    await db('orders').insert({
      order_number: 'TEST-001',
      buyer_name: 'TestBuyer',
      purchase_channel: 'taobao',
      duration_days: 30,
    });

    const orders = await db('orders').select('*');
    expect(orders).toHaveLength(1);
    expect(orders[0].order_number).toBe('TEST-001');
    expect(orders[0].status).toBe('pending');
  });

  it('should enforce unique order_number', async () => {
    await db('orders').insert({
      order_number: 'TEST-002',
      buyer_name: 'Buyer1',
    });

    await expect(
      db('orders').insert({
        order_number: 'TEST-002',
        buyer_name: 'Buyer2',
      })
    ).rejects.toThrow();
  });

  it('should create container linked to order', async () => {
    const [orderId] = await db('orders').insert({
      order_number: 'TEST-003',
      buyer_name: 'Buyer3',
    });

    await db('containers').insert({
      order_id: orderId,
      container_id: 'abc123',
      container_name: 'ts3-order-1',
      voice_port: 20000,
      query_port: 20001,
    });

    const containers = await db('containers').select('*');
    expect(containers).toHaveLength(1);
    expect(containers[0].order_id).toBe(orderId);
    expect(containers[0].voice_port).toBe(20000);
  });
});
