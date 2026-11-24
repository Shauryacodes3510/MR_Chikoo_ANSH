import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Module } from '../lib/content';
import { 
  getModuleLearningPath, 
  ModuleLearningPathNode 
} from '../lib/supabase';
import { 
  getChallengePacks, 
  getPuzzlePacks, 
  getChallengePacksAsync, 
  getPuzzlePacksAsync, 
  ChallengePack, 
  PuzzlePack 
} from '../lib/practiceStoreNew';
import { getCachedSync, setCachedData, invalidateCache } from '../lib/dataCache';

export interface UseLearningPathsAndPacksOptions {
  staleTime?: number;      // Stale time in milliseconds (default: 5 minutes)
  deferRemainingMs?: number; // Delay in ms before fetching non-active modules (default: 300ms)
}

export interface UseLearningPathsAndPacksResult {
  dbLearningPaths: Record<string, ModuleLearningPathNode[]>;
  challengePacks: ChallengePack[];
  puzzlePacks: PuzzlePack[];
  isLoading: boolean;
  isFetching: boolean;
  isStale: boolean;
  refetch: (options?: { forceFresh?: boolean }) => Promise<void>;
  invalidate: () => void;
}

// Global in-memory Query Cache for learning paths and packs (React Query style)
interface QueryCacheEntry {
  paths: Record<string, ModuleLearningPathNode[]>;
  challengePacks: ChallengePack[];
  puzzlePacks: PuzzlePack[];
  updatedAt: number;
}

const globalQueryCache = new Map<string, QueryCacheEntry>();
const globalInFlightFetches = new Map<string, Promise<{
  paths: Record<string, ModuleLearningPathNode[]>;
  challengePacks: ChallengePack[];
  puzzlePacks: PuzzlePack[];
}>>();

/**
 * Reads initial module paths synchronously from memory and localStorage cache
 * to provide 0ms latency on frame 0 without layout shifts.
 */
function getInitialModulePaths(modules: Module[]): Record<string, ModuleLearningPathNode[]> {
  const result: Record<string, ModuleLearningPathNode[]> = {};
  if (!modules || modules.length === 0) return result;

  for (const m of modules) {
    const cached = getCachedSync<ModuleLearningPathNode[]>(
      `CHIKOO_MODULE_PATH_${m.id}`,
      `MODULE_LEARNING_PATH_${m.id}`,
      undefined
    );
    if (cached && Array.isArray(cached) && cached.length > 0) {
      result[m.id] = cached;
    }
  }
  return result;
}

/**
 * Shallow comparator to detect if learning paths have truly changed
 * before triggering React state updates.
 */
function areLearningPathsEqual(
  a: Record<string, ModuleLearningPathNode[]>,
  b: Record<string, ModuleLearningPathNode[]>
): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    const listA = a[key] || [];
    const listB = b[key] || [];
    if (listA.length !== listB.length) return false;
    for (let i = 0; i < listA.length; i++) {
      if (listA[i].id !== listB[i]?.id || listA[i].node_id !== listB[i]?.node_id || listA[i].lane !== listB[i]?.lane) {
        return false;
      }
    }
  }
  return true;
}

/**
 * React Query-style caching and memoization hook for Learning Paths, Challenge Packs, and Puzzle Packs.
 * 
 * Key optimizations:
 * 1. Stale-While-Revalidate (SWR): Returns instant synchronous cache, revalidates only when stale.
 * 2. Deduplication: Coalesces concurrent module fetch requests into a single promise.
 * 3. Memoized Stale-Time: Avoids redundant database queries across React re-renders.
 * 4. Safe Cancellation: Cleans up timeouts and ignores outdated async responses if curriculumVersion changes.
 * 5. Event-Driven Invalidation: Automatically re-syncs when packs or curriculum change.
 */
export function useLearningPathsAndPacksQuery(
  modules: Module[],
  curriculumVersion: number = 0,
  options: UseLearningPathsAndPacksOptions = {}
): UseLearningPathsAndPacksResult {
  const {
    staleTime = 5 * 60 * 1000, // 5 minutes
    deferRemainingMs = 300
  } = options;

  const moduleIdsKey = useMemo(() => {
    return (modules || []).map(m => m.id).join(',');
  }, [modules]);

  const queryKey = useMemo(() => {
    return `learning_paths_query_${moduleIdsKey}_v${curriculumVersion}`;
  }, [moduleIdsKey, curriculumVersion]);

  // Synchronously initialize state from cache/storage
  const [dbLearningPaths, setDbLearningPaths] = useState<Record<string, ModuleLearningPathNode[]>>(() => {
    const fromCache = globalQueryCache.get(queryKey);
    if (fromCache) return fromCache.paths;
    return getInitialModulePaths(modules);
  });

  const [challengePacks, setChallengePacks] = useState<ChallengePack[]>(() => {
    const fromCache = globalQueryCache.get(queryKey);
    if (fromCache) return fromCache.challengePacks;
    return getChallengePacks();
  });

  const [puzzlePacks, setPuzzlePacks] = useState<PuzzlePack[]>(() => {
    const fromCache = globalQueryCache.get(queryKey);
    if (fromCache) return fromCache.puzzlePacks;
    return getPuzzlePacks();
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const cachedEntry = globalQueryCache.get(queryKey);
    return !cachedEntry && Object.keys(dbLearningPaths).length === 0;
  });
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<number>(() => {
    return globalQueryCache.get(queryKey)?.updatedAt || 0;
  });

  const isStale = useMemo(() => {
    if (!lastFetchedAt) return true;
    return Date.now() - lastFetchedAt > staleTime;
  }, [lastFetchedAt, staleTime]);

  const isMountedRef = useRef(true);
  const deferTimerRef = useRef<any>(null);

  /**
   * Performs the database query sequence with deduplication and caching.
   */
  const executeFetch = useCallback(async (forceFresh = false) => {
    if (!modules || modules.length === 0) return;

    // Check if fresh cache exists and not forced
    const cached = globalQueryCache.get(queryKey);
    const now = Date.now();
    if (!forceFresh && cached && (now - cached.updatedAt < staleTime)) {
      if (isMountedRef.current) {
        if (!areLearningPathsEqual(dbLearningPaths, cached.paths)) {
          setDbLearningPaths(cached.paths);
        }
        setChallengePacks(cached.challengePacks);
        setPuzzlePacks(cached.puzzlePacks);
        setIsLoading(false);
        setIsFetching(false);
      }
      return;
    }

    // Deduplicate in-flight fetch for the same queryKey
    if (globalInFlightFetches.has(queryKey)) {
      setIsFetching(true);
      try {
        const result = await globalInFlightFetches.get(queryKey)!;
        if (isMountedRef.current && result) {
          setDbLearningPaths(prev => areLearningPathsEqual(prev, result.paths) ? prev : result.paths);
          setChallengePacks(result.challengePacks);
          setPuzzlePacks(result.puzzlePacks);
          setLastFetchedAt(Date.now());
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsFetching(false);
        }
      }
      return;
    }

    if (isMountedRef.current) {
      setIsFetching(true);
    }

    const fetchPromise = (async () => {
      const pathsMap: Record<string, ModuleLearningPathNode[]> = { ...dbLearningPaths };
      const firstModule = modules[0];

      // 1. Fetch active first module path first for immediate availability
      if (firstModule) {
        try {
          const path = await getModuleLearningPath(firstModule.id);
          if (path && Array.isArray(path)) {
            pathsMap[firstModule.id] = path;
            if (isMountedRef.current) {
              setDbLearningPaths(prev => ({ ...prev, [firstModule.id]: path }));
            }
          }
        } catch (e) {
          console.warn('[useLearningPathsAndPacksQuery] Failed to load path for first module:', firstModule.id, e);
        }
      }

      // 2. Fetch remaining modules and challenge/puzzle packs in parallel
      const remainingModules = modules.slice(1);
      const [remainingPathsResults, fetchedChallengePacks, fetchedPuzzlePacks] = await Promise.all([
        Promise.all(
          remainingModules.map(async (m) => {
            try {
              const path = await getModuleLearningPath(m.id);
              return { moduleId: m.id, path };
            } catch (e) {
              console.warn('[useLearningPathsAndPacksQuery] Failed to load path for module:', m.id, e);
              return { moduleId: m.id, path: null };
            }
          })
        ),
        getChallengePacksAsync(),
        getPuzzlePacksAsync()
      ]);

      for (const item of remainingPathsResults) {
        if (item.path && Array.isArray(item.path)) {
          pathsMap[item.moduleId] = item.path;
        }
      }

      const finalChallengePacks = fetchedChallengePacks || getChallengePacks();
      const finalPuzzlePacks = fetchedPuzzlePacks || getPuzzlePacks();

      // Store in global query cache
      globalQueryCache.set(queryKey, {
        paths: pathsMap,
        challengePacks: finalChallengePacks,
        puzzlePacks: finalPuzzlePacks,
        updatedAt: Date.now()
      });

      return {
        paths: pathsMap,
        challengePacks: finalChallengePacks,
        puzzlePacks: finalPuzzlePacks
      };
    })().finally(() => {
      globalInFlightFetches.delete(queryKey);
    });

    globalInFlightFetches.set(queryKey, fetchPromise);

    try {
      const result = await fetchPromise;
      if (isMountedRef.current && result) {
        setDbLearningPaths(prev => areLearningPathsEqual(prev, result.paths) ? prev : result.paths);
        setChallengePacks(result.challengePacks);
        setPuzzlePacks(result.puzzlePacks);
        setLastFetchedAt(Date.now());
      }
    } catch (err) {
      console.warn('[useLearningPathsAndPacksQuery] Query execution error:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsFetching(false);
      }
    }
  }, [modules, queryKey, staleTime, dbLearningPaths]);

  /**
   * Refetch method exposed to consumer
   */
  const refetch = useCallback(async (opts?: { forceFresh?: boolean }) => {
    return executeFetch(opts?.forceFresh ?? true);
  }, [executeFetch]);

  /**
   * Invalidate method to mark cache stale
   */
  const invalidate = useCallback(() => {
    globalQueryCache.delete(queryKey);
    setLastFetchedAt(0);
  }, [queryKey]);

  // Main lifecycle: Load data when queryKey changes or when stale
  useEffect(() => {
    isMountedRef.current = true;

    // Check if fresh in memory cache
    const cached = globalQueryCache.get(queryKey);
    const now = Date.now();
    const hasFreshCache = cached && (now - cached.updatedAt < staleTime);

    if (hasFreshCache) {
      setDbLearningPaths(cached.paths);
      setChallengePacks(cached.challengePacks);
      setPuzzlePacks(cached.puzzlePacks);
      setIsLoading(false);
      setIsFetching(false);
      setLastFetchedAt(cached.updatedAt);
      return;
    }

    // Schedule deferred fetch to keep initial frame rendering ultra-smooth
    if (deferRemainingMs > 0) {
      deferTimerRef.current = setTimeout(() => {
        executeFetch(false);
      }, deferRemainingMs);
    } else {
      executeFetch(false);
    }

    return () => {
      if (deferTimerRef.current) {
        clearTimeout(deferTimerRef.current);
        deferTimerRef.current = null;
      }
    };
  }, [queryKey, executeFetch, deferRemainingMs, staleTime]);

  // Event listeners to handle real-time or local mutation updates
  useEffect(() => {
    const handlePuz = (e: any) => {
      const updated = (e.detail && Array.isArray(e.detail)) ? e.detail : getPuzzlePacks();
      setPuzzlePacks(updated);
      const cached = globalQueryCache.get(queryKey);
      if (cached) cached.puzzlePacks = updated;
    };

    const handleChal = (e: any) => {
      const updated = (e.detail && Array.isArray(e.detail)) ? e.detail : getChallengePacks();
      setChallengePacks(updated);
      const cached = globalQueryCache.get(queryKey);
      if (cached) cached.challengePacks = updated;
    };

    const handleCurriculum = () => {
      // Invalidate and re-fetch gracefully
      globalQueryCache.delete(queryKey);
      executeFetch(true);
    };

    window.addEventListener('chikooPuzzlePacksChanged', handlePuz);
    window.addEventListener('chikooChallengePacksChanged', handleChal);
    window.addEventListener('curriculumChanged', handleCurriculum);

    return () => {
      window.removeEventListener('chikooPuzzlePacksChanged', handlePuz);
      window.removeEventListener('chikooChallengePacksChanged', handleChal);
      window.removeEventListener('curriculumChanged', handleCurriculum);
      isMountedRef.current = false;
    };
  }, [queryKey, executeFetch]);

  return {
    dbLearningPaths,
    challengePacks,
    puzzlePacks,
    isLoading,
    isFetching,
    isStale,
    refetch,
    invalidate
  };
}
