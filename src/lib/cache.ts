/**
 * Lightweight Client Memory Cache Helper
 * Caches frequently accessed static data (menu categories, menu items, running offer)
 * in client browser memory to make navigation 0ms instant.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

// Default TTL: 5 minutes (300,000 ms)
const DEFAULT_TTL_MS = 5 * 60 * 1000;

export const clientCache = {
  get<T>(key: string, ttlMs: number = DEFAULT_TTL_MS): T | null {
    // Tier 1: Check high-speed in-memory Map
    const entry = memoryCache.get(key);
    if (entry) {
      if (Date.now() - entry.timestamp <= ttlMs) {
        return entry.data as T;
      }
      memoryCache.delete(key);
    }

    // Tier 2: Check localStorage fallback for multi-tab / refreshed instant hydration
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`cb_cache_${key}`);
        if (stored) {
          const parsed: CacheEntry<T> = JSON.parse(stored);
          if (Date.now() - parsed.timestamp <= ttlMs) {
            memoryCache.set(key, parsed); // populate memory map
            return parsed.data;
          }
          localStorage.removeItem(`cb_cache_${key}`);
        }
      } catch (e) {
        // localStorage disabled or invalid JSON
      }
    }

    return null;
  },

  set<T>(key: string, data: T): void {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    memoryCache.set(key, entry);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`cb_cache_${key}`, JSON.stringify(entry));
      } catch (e) {
        // storage quota exceeded or disabled
      }
    }
  },

  invalidate(keyPrefix?: string): void {
    if (!keyPrefix) {
      memoryCache.clear();
      if (typeof window !== 'undefined') {
        try {
          Object.keys(localStorage).forEach(k => {
            if (k.startsWith('cb_cache_')) localStorage.removeItem(k);
          });
        } catch (e) {}
      }
      return;
    }
    for (const key of memoryCache.keys()) {
      if (key.startsWith(keyPrefix)) {
        memoryCache.delete(key);
      }
    }
    if (typeof window !== 'undefined') {
      try {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith(`cb_cache_${keyPrefix}`)) localStorage.removeItem(k);
        });
      } catch (e) {}
    }
  }
};
