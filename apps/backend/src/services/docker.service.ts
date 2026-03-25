import Dockerode from 'dockerode';

const docker = new Dockerode({ socketPath: '/var/run/docker.sock' });

export const dockerService = {
  async createContainer(opts: {
    name: string;
    image: string;
    voicePort: number;
    queryPort: number;
  }): Promise<Dockerode.Container> {
    // Ensure image exists
    try {
      await docker.getImage(opts.image).inspect();
    } catch {
      console.log(`Pulling image ${opts.image}...`);
      await new Promise<void>((resolve, reject) => {
        docker.pull(opts.image, (err: Error | null, stream: NodeJS.ReadableStream) => {
          if (err) return reject(err);
          docker.modem.followProgress(stream, (err2: Error | null) => {
            if (err2) return reject(err2);
            resolve();
          });
        });
      });
    }

    const container = await docker.createContainer({
      name: opts.name,
      Image: opts.image,
      Env: ['TS3SERVER_LICENSE=accept'],
      ExposedPorts: {
        '9987/udp': {},
        '10011/tcp': {},
      },
      HostConfig: {
        PortBindings: {
          '9987/udp': [{ HostPort: String(opts.voicePort) }],
          '10011/tcp': [{ HostPort: String(opts.queryPort) }],
        },
        RestartPolicy: { Name: 'unless-stopped' },
      },
    });

    return container;
  },

  async startContainer(containerId: string): Promise<void> {
    const container = docker.getContainer(containerId);
    await container.start();
  },

  async stopContainer(containerId: string): Promise<void> {
    const container = docker.getContainer(containerId);
    await container.stop().catch(() => {});
  },

  async removeContainer(containerId: string): Promise<void> {
    const container = docker.getContainer(containerId);
    await container.stop().catch(() => {});
    await container.remove({ force: true });
  },

  async getContainerLogs(containerId: string): Promise<string> {
    const container = docker.getContainer(containerId);
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      follow: false,
      tail: 100,
    });
    return logs.toString('utf-8');
  },

  async inspectContainer(containerId: string): Promise<Dockerode.ContainerInspectInfo> {
    const container = docker.getContainer(containerId);
    return container.inspect();
  },

  async exportContainer(containerId: string): Promise<NodeJS.ReadableStream> {
    const container = docker.getContainer(containerId);
    return container.export();
  },

  async isDockerAvailable(): Promise<boolean> {
    try {
      await docker.ping();
      return true;
    } catch {
      return false;
    }
  },

  async listContainers(): Promise<Dockerode.ContainerInfo[]> {
    return docker.listContainers({ all: true });
  },

  getDocker(): Dockerode {
    return docker;
  },
};
