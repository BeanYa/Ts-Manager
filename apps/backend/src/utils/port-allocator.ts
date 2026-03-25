import { db } from '../db/connection.js';
import { config } from '../config.js';

/**
 * Allocate the next available port pair (voice UDP + query TCP).
 * Each container uses 2 consecutive ports starting from PORT_RANGE_START.
 * Recycled port pairs are reused.
 */
export async function allocatePortPair(): Promise<{ voicePort: number; queryPort: number }> {
  const usedPorts = await db('containers')
    .whereNot('status', 'removed')
    .select('voice_port', 'query_port');

  const usedSet = new Set<number>();
  for (const row of usedPorts) {
    usedSet.add(row.voice_port);
    usedSet.add(row.query_port);
  }

  let port = config.portRangeStart;
  while (usedSet.has(port) || usedSet.has(port + 1)) {
    port += 2;
  }

  return { voicePort: port, queryPort: port + 1 };
}
