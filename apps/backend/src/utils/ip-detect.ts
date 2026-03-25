import { config } from '../config.js';

/**
 * Detect public IP address. Uses config override if set,
 * otherwise queries external services.
 */
export async function detectPublicIp(): Promise<string> {
  if (config.publicIp) return config.publicIp;
  if (config.customDomain) return config.customDomain;

  const services = [
    'https://api.ipify.org',
    'https://ifconfig.me/ip',
    'https://icanhazip.com',
  ];

  for (const url of services) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const ip = (await res.text()).trim();
        if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return ip;
      }
    } catch {
      continue;
    }
  }

  return '127.0.0.1';
}
