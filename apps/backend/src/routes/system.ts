import { Router } from 'express';
import { dockerService } from '../services/docker.service.js';
import { containerService } from '../services/container.service.js';
import { detectPublicIp } from '../utils/ip-detect.js';
import { config } from '../config.js';

export const systemRouter = Router();

// Health check
systemRouter.get('/health', async (_req, res) => {
  try {
    const dockerAvailable = await dockerService.isDockerAvailable();
    res.json({
      success: true,
      data: {
        status: dockerAvailable ? 'ok' : 'error',
        docker: dockerAvailable,
        database: true,
        uptime: process.uptime(),
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      data: { status: 'error', docker: false, database: false, uptime: 0 },
      error: err.message,
    });
  }
});

// System info
systemRouter.get('/info', async (_req, res) => {
  try {
    const publicIp = await detectPublicIp();
    const stats = await containerService.getStats();

    res.json({
      success: true,
      data: {
        publicIp,
        customDomain: config.customDomain,
        dbClient: config.dbClient,
        portRangeStart: config.portRangeStart,
        totalContainers: stats.totalContainers,
        runningContainers: stats.runningContainers,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dashboard stats
systemRouter.get('/stats', async (_req, res) => {
  try {
    const stats = await containerService.getStats();
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
