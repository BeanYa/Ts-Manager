import { dockerService } from './docker.service.js';
import type { Response } from 'express';

export const backupService = {
  async exportContainer(containerId: string, res: Response): Promise<void> {
    const stream = await dockerService.exportContainer(containerId);
    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', `attachment; filename="${containerId.slice(0, 12)}.tar"`);
    stream.pipe(res);
  },

  async importContainer(
    containerName: string,
    image: string,
    voicePort: number,
    queryPort: number,
  ): Promise<string> {
    // Import is done by creating a fresh container (TS3 doesn't support volume import easily)
    // For a full solution, we'd use docker commit + create from committed image
    const container = await dockerService.createContainer({
      name: containerName,
      image,
      voicePort,
      queryPort,
    });
    await dockerService.startContainer(container.id);
    return container.id;
  },
};
