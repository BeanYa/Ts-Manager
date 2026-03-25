import knex, { type Knex } from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createKnexConfig(): Knex.Config {
  if (config.dbClient === 'mysql2') {
    return {
      client: 'mysql2',
      connection: {
        host: config.dbHost,
        port: config.dbPort,
        user: config.dbUser,
        password: config.dbPass,
        database: config.dbName,
      },
      pool: { min: 2, max: 10 },
    };
  }

  return {
    client: 'better-sqlite3',
    connection: {
      filename: path.resolve(__dirname, '../../data/tsmanager.db'),
    },
    useNullAsDefault: true,
  };
}

export const db: Knex = knex(createKnexConfig());

export async function runMigrations(): Promise<void> {
  // Ensure data directory for SQLite
  if (config.dbClient === 'better-sqlite3') {
    const fs = await import('fs');
    const dataDir = path.resolve(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  // Run migrations inline
  const hasOrders = await db.schema.hasTable('orders');
  if (!hasOrders) {
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
    console.log('Created orders table');
  }

  const hasContainers = await db.schema.hasTable('containers');
  if (!hasContainers) {
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
    console.log('Created containers table');
  }
}
