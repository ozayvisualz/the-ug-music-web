/**
 * Lightweight in-memory TTL cache for read-heavy intelligence queries.
 * Keeps low-latency inference under concurrent load. Falls back to
 * recomputation on eviction / expiry / cache miss.
 */
interface Entry {
  value: any;
  expiresAt: number;
}

const store = new Map<string, Entry>();
let hits = 0;
let misses = 0;

export const IntelligenceCache = {
  async getOrSet<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const hit = store.get(key);
    if (hit && hit.expiresAt > now) {
      hits++;
      return hit.value as T;
    }
    misses++;
    const value = await fn();
    if (value !== null && value !== undefined) {
      store.set(key, { value, expiresAt: now + ttlMs });
      if (store.size > 1000) this.prune();
    }
    return value;
  },

  get<T>(key: string): T | undefined {
    const hit = store.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.value as T;
    return undefined;
  },

  set(key: string, value: any, ttlMs: number) {
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
  },

  invalidate(prefix: string) {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) store.delete(key);
    }
  },

  clear() {
    store.clear();
  },

  prune() {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.expiresAt <= now) store.delete(key);
    }
  },

  stats() {
    return { size: store.size, hits, misses };
  },
};
