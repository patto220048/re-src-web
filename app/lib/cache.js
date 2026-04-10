/**
 * Simple in-memory cache with TTL for Firestore queries.
 * Avoids re-fetching the same data on navigation between pages.
 */

const cache = new Map();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache(key, data, ttl = DEFAULT_TTL) {
  cache.set(key, {
    data,
    expiry: Date.now() + ttl,
  });
}

export function invalidateCache(keyPrefix) {
  for (const key of cache.keys()) {
    if (key.startsWith(keyPrefix)) {
      cache.delete(key);
    }
  }
}

export function clearCache() {
  cache.clear();
}
