type CacheEntry<T> = { value: T; expires: number };
const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs = 60_000) {
  store.set(key, { value, expires: Date.now() + ttlMs });
}