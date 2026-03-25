import { db } from './connection.js';
import { runMigrations } from './connection.js';

async function seed() {
  await runMigrations();

  const existingOrders = await db('orders').count('* as count').first();
  if (existingOrders && Number(existingOrders.count) > 0) {
    console.log('Database already has data, skipping seed');
    process.exit(0);
  }

  await db('orders').insert([
    {
      order_number: 'TB-20260325-001',
      purchase_channel: 'taobao',
      buyer_name: '测试买家A',
      buyer_contact: '旺旺: test_buyer_a',
      duration_days: 30,
      notes: '测试订单',
      status: 'pending',
    },
    {
      order_number: 'XY-20260325-002',
      purchase_channel: 'xianyu',
      buyer_name: '测试买家B',
      buyer_contact: '闲鱼: test_buyer_b',
      duration_days: 90,
      notes: '',
      status: 'pending',
    },
  ]);

  console.log('Seed data inserted');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
