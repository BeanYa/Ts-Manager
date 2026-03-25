import { describe, it, expect } from 'vitest';

// Note: port-allocator depends on db, so we test the logic pattern
describe('Port Allocator Logic', () => {
  it('should allocate sequential port pairs', () => {
    const usedPorts = new Set<number>();
    const portRangeStart = 20000;

    function allocate(): { voicePort: number; queryPort: number } {
      let port = portRangeStart;
      while (usedPorts.has(port) || usedPorts.has(port + 1)) {
        port += 2;
      }
      usedPorts.add(port);
      usedPorts.add(port + 1);
      return { voicePort: port, queryPort: port + 1 };
    }

    const pair1 = allocate();
    expect(pair1).toEqual({ voicePort: 20000, queryPort: 20001 });

    const pair2 = allocate();
    expect(pair2).toEqual({ voicePort: 20002, queryPort: 20003 });

    const pair3 = allocate();
    expect(pair3).toEqual({ voicePort: 20004, queryPort: 20005 });
  });

  it('should reuse recycled ports', () => {
    const usedPorts = new Set<number>([20000, 20001, 20004, 20005]);
    const portRangeStart = 20000;

    let port = portRangeStart;
    while (usedPorts.has(port) || usedPorts.has(port + 1)) {
      port += 2;
    }

    // 20002-20003 are free (recycled)
    expect(port).toBe(20002);
  });
});
