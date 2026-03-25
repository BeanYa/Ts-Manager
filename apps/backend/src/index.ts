import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { authMiddleware } from './middleware/auth.js';
import { ordersRouter } from './routes/orders.js';
import { containersRouter } from './routes/containers.js';
import { systemRouter } from './routes/system.js';
import { runMigrations } from './db/connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use('/api', authMiddleware);
app.use('/api/orders', ordersRouter);
app.use('/api/containers', containersRouter);
app.use('/api/system', systemRouter);

// Auth verify endpoint
app.post('/api/auth/verify', (_req, res) => {
  res.json({ success: true, message: 'Token is valid' });
});

// Serve frontend static files in production
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

async function start() {
  if (!config.authToken) {
    console.error('ERROR: AUTH_TOKEN environment variable is required');
    process.exit(1);
  }

  await runMigrations();
  console.log('Database migrations complete');

  app.listen(config.port, () => {
    console.log(`TS Manager API running on http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { app };
