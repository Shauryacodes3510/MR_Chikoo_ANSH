/**
 * Centralized Data Cache & Resilient Sync Layer for Chikoo
 * 
 * Provides:
 * 1. Request Deduplication: Merges concurrent identical in-flight requests into a single promise.
 * 2. Stale-While-Revalidate (SWR): Returns cached/storage data instantly, revalidates in background.
 * 3. Strict Sensible Timeouts & Safe Retries: Prevents hanging Supabase/network calls from freezing the UI.
 * 4. Offline Mutation Queue: Buffers user progress/reward writes when offline and drains them safely on reconnection.
 * 5. Event-Driven Cache Synchronization: Broadcasts cache update events to keep all UI components reactive.
 */

export interface CacheOptions<T> {
  ttlMs?: number;               // Memory cache TTL in ms (default: 60,000ms for dynamic, 15m for static)
  storageKey?: string;          // LocalStorage key for cross-session persistence
  timeoutMs?: number;           // Max time before falling back to cache/seed (default: 3500ms)
  retries?: number;             // Transient retry count (default: 1)
  fallback?: T;                 // Hard fallback value if network & cache are both unavailable
  isEqual?: (a: T, b: T) => boolean; // Custom comparator to prevent duplicate event dispatches
  forceFresh?: boolean;         // Bypass cache and force network fetch
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

// In-memory cache map
const memoryCache = new Map<string, CacheEntry<any>>();

// In-flight request deduplication map
const inFlightPromises = new Map<string, Promise<any>>();

// Background revalidation debounce tracker
const revalidationTimestamps = new Map<string, number>();

// Registry of storage keys associated with each cacheKey
const cacheStorageKeyRegistry = new Map<string, Set<string>>();

/**
 * Timeout wrapper that rejects if the promise does not resolve within the specified limit.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number = 3500, label = 'Operation'): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`[Timeout] ${label} exceeded ${ms}ms limit`));
    }, ms);
  });

  return Promise.race([
    promise.then((res) => {
      clearTimeout(timer);
      return res;
    }),
    timeoutPromise
  ]);
}

/**
 * Reads directly from memory cache, falling back to localStorage synchronously.
 */
export function getCachedSync<T>(cacheKey: string, storageKey?: string, fallback?: T): T | null {
  // 1. Check memory cache
  const mem = memoryCache.get(cacheKey);
  if (mem) {
    return mem.data as T;
  }

  // 2. Check localStorage
  const key = storageKey || `CHIKOO_CACHE_${cacheKey}`;
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Populate memory cache for future instant synchronous reads
        memoryCache.set(cacheKey, {
          data: parsed,
          timestamp: Date.now(),
          ttlMs: 60 * 1000
        });
        return parsed as T;
      }
    } catch {
      // Ignore parse error
    }
  }

  return fallback !== undefined ? fallback : null;
}

/**
 * Explicitly sets a value in memory and storage cache.
 */
export function setCachedData<T>(cacheKey: string, data: T, ttlMs = 60 * 1000, storageKey?: string): void {
  memoryCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttlMs
  });

  const key = storageKey || `CHIKOO_CACHE_${cacheKey}`;
  if (!cacheStorageKeyRegistry.has(cacheKey)) {
    cacheStorageKeyRegistry.set(cacheKey, new Set<string>());
  }
  cacheStorageKeyRegistry.get(cacheKey)!.add(key);
  if (storageKey) {
    cacheStorageKeyRegistry.get(cacheKey)!.add(storageKey);
  }

  if (typeof localStorage !== 'undefined' && data !== undefined) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.warn(`[DataCache] Storage write error for ${key}:`, err);
    }
  }

  // Dispatch cache update notification event
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('chikooDataCacheUpdated', {
        detail: { key: cacheKey, storageKey: key, data }
      }));
    } catch {
      // Ignore event dispatch errors
    }
  }
}

/**
 * Invalidates a specific cache entry from memory, local storage, and resets in-flight trackers.
 */
export function invalidateCache(cacheKey: string, storageKey?: string): void {
  memoryCache.delete(cacheKey);
  inFlightPromises.delete(cacheKey);
  revalidationTimestamps.delete(cacheKey);

  const keysToDelete = new Set<string>();
  keysToDelete.add(cacheKey);
  keysToDelete.add(`CHIKOO_CACHE_${cacheKey}`);
  if (storageKey) {
    keysToDelete.add(storageKey);
  }

  const registered = cacheStorageKeyRegistry.get(cacheKey);
  if (registered) {
    registered.forEach(k => keysToDelete.add(k));
    cacheStorageKeyRegistry.delete(cacheKey);
  }

  if (typeof localStorage !== 'undefined') {
    keysToDelete.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });
  }

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('chikooDataCacheUpdated', {
        detail: { key: cacheKey, storageKey: storageKey || `CHIKOO_CACHE_${cacheKey}`, data: null, invalidated: true }
      }));
    } catch {}
  }
}

/**
 * Fetches data with request deduplication and Stale-While-Revalidate caching.
 * 
 * - If cached data is fresh: returns cached data immediately.
 * - If cached data is stale: returns cached data immediately and revalidates in the background.
 * - If no cached data exists: awaits network fetch with timeout, falls back to provided fallback on error.
 */
export async function fetchWithCache<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  options: CacheOptions<T> = {}
): Promise<T> {
  const {
    ttlMs = 60 * 1000,
    storageKey,
    timeoutMs = 3500,
    retries = 1,
    fallback,
    isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b),
    forceFresh = false
  } = options;

  const cachedValue = getCachedSync<T>(cacheKey, storageKey, undefined);
  const memEntry = memoryCache.get(cacheKey);
  const isFresh = !forceFresh && memEntry && (Date.now() - memEntry.timestamp < memEntry.ttlMs);

  // 1. If fresh in memory, return immediately
  if (isFresh && cachedValue !== null && cachedValue !== undefined) {
    return cachedValue;
  }

  // Helper to execute network fetch with retries and timeout
  const executeFetch = async (): Promise<T> => {
    let lastError: any;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await withTimeout(fetcher(), timeoutMs, `fetch:${cacheKey}`);
        if (result !== undefined && result !== null) {
          // If we had cached value, check if changed
          const hasChanged = !cachedValue || !isEqual(cachedValue, result);
          setCachedData(cacheKey, result, ttlMs, storageKey);
          
          if (hasChanged && cachedValue) {
            console.log(`[DataCache SWR] Revalidated ${cacheKey} with fresh data from database`);
          }
          return result;
        }
      } catch (err: any) {
        lastError = err;
        if (attempt < retries) {
          await new Promise(res => setTimeout(res, 200 * Math.pow(2, attempt)));
        }
      }
    }

    // Network fetch failed or timed out
    console.warn(`[DataCache] Network fetch for '${cacheKey}' failed/timed out:`, lastError?.message || lastError);

    // Fall back to stale cache if available
    if (cachedValue !== null && cachedValue !== undefined) {
      console.log(`[DataCache] Serving stale cached data for '${cacheKey}'`);
      return cachedValue;
    }

    // Fall back to default fallback if provided
    if (fallback !== undefined) {
      console.log(`[DataCache] Serving verified fallback seed for '${cacheKey}'`);
      return fallback;
    }

    throw lastError;
  };

  // 2. Stale-While-Revalidate: If we have stale cached data, trigger background fetch and return cache instantly
  if (!forceFresh && cachedValue !== null && cachedValue !== undefined) {
    const lastReval = revalidationTimestamps.get(cacheKey) || 0;
    const now = Date.now();
    // Throttle background revalidation to at most once every 10 seconds per key
    if (now - lastReval > 10 * 1000) {
      revalidationTimestamps.set(cacheKey, now);

      if (!inFlightPromises.has(cacheKey)) {
        const bgPromise = executeFetch()
          .catch(err => {
            console.warn(`[DataCache SWR] Background revalidation failed for '${cacheKey}':`, err?.message);
          })
          .finally(() => {
            inFlightPromises.delete(cacheKey);
          });
        inFlightPromises.set(cacheKey, bgPromise);
      }
    }
    return cachedValue;
  }

  // 3. No cache available: Deduplicate concurrent in-flight requests and wait for result
  if (inFlightPromises.has(cacheKey)) {
    return inFlightPromises.get(cacheKey)!;
  }

  const requestPromise = executeFetch().finally(() => {
    inFlightPromises.delete(cacheKey);
  });

  inFlightPromises.set(cacheKey, requestPromise);
  return requestPromise;
}

// -------------------------------------------------------------
// OFFLINE PROGRESS MUTATION QUEUE
// -------------------------------------------------------------

export interface OfflineMutation {
  id: string;             // Unique idempotency key (e.g., 'lesson_les_123', 'profile_sync')
  type: 'lesson_completion' | 'challenge_completion' | 'profile_update';
  email: string;
  payload: any;
  createdAt: string;
  attempts: number;
}

const OFFLINE_QUEUE_KEY_PREFIX = 'CHIKOO_OFFLINE_MUTATION_QUEUE_';

function getQueueStorageKey(email: string): string {
  const clean = email.toLowerCase().trim() || 'guest';
  return `${OFFLINE_QUEUE_KEY_PREFIX}${clean}`;
}

/**
 * Enqueues a pending progress mutation when offline or when a network write fails.
 */
export function enqueueOfflineMutation(email: string, mutation: Omit<OfflineMutation, 'createdAt' | 'attempts'>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const key = getQueueStorageKey(email);
    const existing: OfflineMutation[] = JSON.parse(localStorage.getItem(key) || '[]');
    
    // Deduplicate by mutation.id to prevent duplicate writes
    const filtered = existing.filter(m => m.id !== mutation.id);
    filtered.push({
      ...mutation,
      createdAt: new Date().toISOString(),
      attempts: 0
    });

    localStorage.setItem(key, JSON.stringify(filtered));
    console.log(`[OfflineQueue] Enqueued offline mutation '${mutation.id}' for ${email} (Queue size: ${filtered.length})`);
  } catch (err) {
    console.error('[OfflineQueue] Failed enqueuing offline mutation:', err);
  }
}

/**
 * Retrieves all pending offline mutations for a user.
 */
export function getPendingOfflineMutations(email: string): OfflineMutation[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const key = getQueueStorageKey(email);
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

/**
 * Clears specific mutations from the queue once successfully synced to the database.
 */
export function dequeueOfflineMutations(email: string, mutationIds: string[]): void {
  if (typeof localStorage === 'undefined' || mutationIds.length === 0) return;
  try {
    const key = getQueueStorageKey(email);
    const existing: OfflineMutation[] = JSON.parse(localStorage.getItem(key) || '[]');
    const idSet = new Set(mutationIds);
    const remaining = existing.filter(m => !idSet.has(m.id));
    if (remaining.length > 0) {
      localStorage.setItem(key, JSON.stringify(remaining));
    } else {
      localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn('[OfflineQueue] Failed dequeuing offline mutations:', err);
  }
}

/**
 * Subscribes to window online event to trigger queue synchronization automatically.
 */
export function setupAutoOnlineSync(onSyncRequested: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => {
    console.log('[OfflineQueue] Connectivity restored. Triggering offline queue sync...');
    onSyncRequested();
  };

  window.addEventListener('online', handleOnline);
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
