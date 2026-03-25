import { Router } from 'express';
import { containerService } from '../services/container.service.js';
import { backupService } from '../services/backup.service.js';

export const containersRouter = Router();

// List all containers
containersRouter.get('/', async (_req, res) => {
  try {
    const containers = await containerService.list();
    res.json({ success: true, data: containers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get container by id
containersRouter.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const container = await containerService.getById(id);
    if (!container) {
      res.status(404).json({ success: false, error: 'Container not found' });
      return;
    }
    res.json({ success: true, data: container });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Export container
containersRouter.post('/:id/export', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const container = await containerService.getById(id);
    if (!container) {
      res.status(404).json({ success: false, error: 'Container not found' });
      return;
    }
    await backupService.exportContainer(container.container_id, res);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Import / restore container
containersRouter.post('/:id/import', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const container = await containerService.getById(id);
    if (!container) {
      res.status(404).json({ success: false, error: 'Container not found' });
      return;
    }
    // Re-create with same ports
    const result = await containerService.reset(id);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reset container
containersRouter.post('/:id/reset', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const container = await containerService.reset(id);
    res.json({ success: true, data: container });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Recycle container
containersRouter.post('/:id/recycle', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await containerService.recycle(id);
    res.json({ success: true, message: 'Container recycled' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Refresh container time
containersRouter.post('/:id/refresh', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const container = await containerService.refresh(id);
    res.json({ success: true, data: container });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
