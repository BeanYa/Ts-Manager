import { db } from '../db/connection.js';
import type { Order, CreateOrderInput, UpdateOrderInput } from '@ts-manager/shared';

export const orderService = {
  async list(): Promise<Order[]> {
    return db('orders').select('*').orderBy('created_at', 'desc');
  },

  async getById(id: number): Promise<Order | undefined> {
    return db('orders').where({ id }).first();
  },

  async create(input: CreateOrderInput): Promise<Order> {
    const [insertedId] = await db('orders').insert({
      order_number: input.order_number,
      purchase_channel: input.purchase_channel,
      buyer_name: input.buyer_name,
      buyer_contact: input.buyer_contact || '',
      duration_days: input.duration_days,
      notes: input.notes || '',
      status: 'pending',
    });

    // For SQLite, insertedId is the row id; for MySQL it's the auto-increment id
    const id = typeof insertedId === 'number' ? insertedId : (insertedId as any);
    return db('orders').where({ id }).first() as Promise<Order>;
  },

  async update(id: number, input: UpdateOrderInput): Promise<Order | undefined> {
    await db('orders').where({ id }).update({
      ...input,
      updated_at: db.fn.now(),
    });
    return db('orders').where({ id }).first();
  },

  async delete(id: number): Promise<boolean> {
    const order = await db('orders').where({ id }).first();
    if (!order || order.status !== 'pending') return false;
    await db('orders').where({ id }).delete();
    return true;
  },

  async updateStatus(id: number, status: Order['status']): Promise<void> {
    await db('orders').where({ id }).update({ status, updated_at: db.fn.now() });
  },
};
