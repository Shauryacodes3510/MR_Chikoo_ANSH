import { updateLessonProgress } from './lessonService';
import { supabase } from './supabase';
/**
 * Chikoo Platform Local Storage & Cache for User Lesson Progress
 * Provides resilient, offline-first local persistence and memory caching
 * for completed lessons, scores, timestamps, and progress records.
 */

export interface StoredLessonProgressRecord {
  lessonId: string;
  completed: boolean;
  completedAt: string;
  score?: number;        // Percentage 0-100 or accuracy
  stars?: number;        // 1 to 3 stars
  xpEarned?: number;
  cookiesEarned?: number;
  attempts?: number;
  updatedAt: string;
}

export interface UserLessonProgressCache {
  email: string;
  completedLessons: string[];
  records: Record<string, StoredLessonProgressRecord>;
  lastUpdated: string;
  lastActiveLessonId?: string;
  lastActiveModuleId?: string;
}

// In-memory cache map keyed by normalized email for instant zero-latency retrieval
const memoryCache = new Map<string, UserLessonProgressCache>();

/**
 * Normalizes email address and resolves active session email from localStorage if omitted.
 */
export function normalizeProgressEmail(email?: string | null): string {
  if (email && typeof email === 'string' && email.trim().length > 0) {
    return email.toLowerCase().trim();
  }
  if (typeof localStorage !== 'undefined') {
    const sessionEmail = localStorage.getItem('CHIKOO_SESSION_USER');
    if (sessionEmail && sessionEmail.trim().length > 0) {
      return sessionEmail.toLowerCase().trim();
    }
  }
  return 'guest';
}

function getStorageKeys(email: string) {
  const cleanEmail = normalizeProgressEmail(email);
  return {
    progressMapKey: `CHIKOO_LESSON_PROGRESS_V1_${cleanEmail}`,
    completedListKey: `CHIKOO_USER_COMPLETED_LESSONS_${cleanEmail}`,
    lastActiveKey: `CHIKOO_LAST_ACTIVE_LESSON_${cleanEmail}`,
    legacyProfileKey: `CHIKOO_SUPABASE_DB_USER_PROFILE_${cleanEmail}`,
    cleanEmail
  };
}

/**
 * Hydrates the user cache from local storage, merging legacy sources if needed.
 */
function hydrateUserCache(email?: string | null): UserLessonProgressCache {
  const { progressMapKey, completedListKey, lastActiveKey, legacyProfileKey, cleanEmail } = getStorageKeys(email || '');

  if (memoryCache.has(cleanEmail)) {
    return memoryCache.get(cleanEmail)!;
  }

  let completedLessons: string[] = [];
  let records: Record<string, StoredLessonProgressRecord> = {};
  let lastUpdated = new Date().toISOString();
  let lastActiveLessonId: string | undefined = undefined;
  let lastActiveModuleId: string | undefined = undefined;

  if (typeof localStorage !== 'undefined') {
    try {
      // 1. Check primary detailed progress cache
      const storedProgress = localStorage.getItem(progressMapKey);
      if (storedProgress) {
        const parsed = JSON.parse(storedProgress);
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.completedLessons)) {
            completedLessons = parsed.completedLessons;
          }
          if (parsed.records && typeof parsed.records === 'object') {
            records = parsed.records;
          }
          if (parsed.lastUpdated) {
            lastUpdated = parsed.lastUpdated;
          }
          if (parsed.lastActiveLessonId) {
            lastActiveLessonId = parsed.lastActiveLessonId;
          }
          if (parsed.lastActiveModuleId) {
            lastActiveModuleId = parsed.lastActiveModuleId;
          }
        }
      }

      // 2. Check dedicated last active position key
      if (!lastActiveLessonId) {
        const storedLastActive = localStorage.getItem(lastActiveKey);
        if (storedLastActive) {
          try {
            const parsedActive = JSON.parse(storedLastActive);
            lastActiveLessonId = parsedActive.lessonId;
            lastActiveModuleId = parsedActive.moduleId;
          } catch {
            lastActiveLessonId = storedLastActive;
          }
        }
      }

      // 3. Merge fast completed list cache if present
      const storedList = localStorage.getItem(completedListKey);
      if (storedList) {
        try {
          const parsedList = JSON.parse(storedList);
          if (Array.isArray(parsedList)) {
            completedLessons = Array.from(new Set([...completedLessons, ...parsedList]));
          }
        } catch {
          // ignore parsing error
        }
      }

      // 4. Fallback to profile cache if primary caches are empty
      if (completedLessons.length === 0) {
        const profileData = localStorage.getItem(legacyProfileKey);
        if (profileData) {
          try {
            const parsedProfile = JSON.parse(profileData);
            if (Array.isArray(parsedProfile.completed_lessons)) {
              completedLessons = Array.from(new Set(parsedProfile.completed_lessons));
            }
          } catch {
            // ignore parsing error
          }
        }
      }

      // Ensure every completed lesson ID has at least a baseline record
      const nowIso = new Date().toISOString();
      for (const id of completedLessons) {
        if (!records[id]) {
          records[id] = {
            lessonId: id,
            completed: true,
            completedAt: nowIso,
            updatedAt: nowIso
          };
        }
      }
    } catch (err) {
      console.warn('[LessonProgressStorage] Failed loading from localStorage:', err);
    }
  }

  const cacheEntry: UserLessonProgressCache = {
    email: cleanEmail,
    completedLessons: Array.from(new Set(completedLessons)),
    records,
    lastUpdated,
    lastActiveLessonId,
    lastActiveModuleId
  };

  memoryCache.set(cleanEmail, cacheEntry);
  return cacheEntry;
}

/**
 * Persists user cache into localStorage.
 */
function persistUserCache(cache: UserLessonProgressCache): void {
  const { progressMapKey, completedListKey, lastActiveKey, cleanEmail } = getStorageKeys(cache.email);

  // Update in-memory cache
  memoryCache.set(cleanEmail, cache);

  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(progressMapKey, JSON.stringify({
      email: cache.email,
      completedLessons: cache.completedLessons,
      records: cache.records,
      lastUpdated: cache.lastUpdated,
      lastActiveLessonId: cache.lastActiveLessonId,
      lastActiveModuleId: cache.lastActiveModuleId
    }));

    localStorage.setItem(completedListKey, JSON.stringify(cache.completedLessons));

    if (cache.lastActiveLessonId) {
      localStorage.setItem(lastActiveKey, JSON.stringify({
        lessonId: cache.lastActiveLessonId,
        moduleId: cache.lastActiveModuleId,
        timestamp: cache.lastUpdated
      }));
    }
  } catch (err) {
    console.error('[LessonProgressStorage] Failed writing to localStorage:', err);
  }
}

/**
 * Saves and updates the student's exact learning position.
 */
export function saveStoredLastActiveLesson(
  lessonId: string,
  moduleId?: string,
  email?: string | null
): void {
  if (!lessonId) return;
  const cache = hydrateUserCache(email);
  cache.lastActiveLessonId = lessonId;
  if (moduleId) {
    cache.lastActiveModuleId = moduleId;
  }
  cache.lastUpdated = new Date().toISOString();
  persistUserCache(cache);
}

/**
 * Retrieves the student's exact learning position from local cache.
 */
export function getStoredLastActiveLesson(
  email?: string | null
): { lessonId: string; moduleId?: string; timestamp: string } | null {
  const cache = hydrateUserCache(email);
  if (cache.lastActiveLessonId) {
    return {
      lessonId: cache.lastActiveLessonId,
      moduleId: cache.lastActiveModuleId,
      timestamp: cache.lastUpdated
    };
  }
  return null;
}

export function saveLastActiveLessonId(lessonId: string, email?: string | null): void {
  saveStoredLastActiveLesson(lessonId, undefined, email);
}

export function getLastActiveLessonId(email?: string | null): string | null {
  const active = getStoredLastActiveLesson(email);
  return active ? active.lessonId : null;
}

export function saveLastActiveModuleId(moduleId: string, email?: string | null): void {
  const cache = hydrateUserCache(email);
  saveStoredLastActiveLesson(cache.lastActiveLessonId || '', moduleId, email);
}

export function getLastActiveModuleId(email?: string | null): string | null {
  const active = getStoredLastActiveLesson(email);
  return active ? (active.moduleId || null) : null;
}

/**
 * Dispatches an event across the window so all UI modules react instantly.
 */
function notifyProgressUpdated(cleanEmail: string, completedLessons: string[], lessonId?: string, record?: StoredLessonProgressRecord): void {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('chikooLessonProgressUpdated', {
        detail: {
          email: cleanEmail,
          completedLessons,
          lessonId,
          record
        }
      }));
    } catch {
      // ignore event dispatch errors
    }
  }
}

/**
 * Retrieves the list of all completed lesson/node IDs from local storage cache.
 */
export function getStoredCompletedLessonIds(email?: string | null): string[] {
  const cache = hydrateUserCache(email);
  return [...cache.completedLessons];
}

/**
 * Checks if a given lesson or node ID is marked completed in local storage.
 */
export function isLessonCompletedInStorage(lessonId: string, email?: string | null): boolean {
  if (!lessonId) return false;
  const cache = hydrateUserCache(email);
  return cache.completedLessons.includes(lessonId) || !!cache.records[lessonId]?.completed;
}

/**
 * Retrieves the full progress record for a single lesson.
 */
export function getStoredLessonProgress(lessonId: string, email?: string | null): StoredLessonProgressRecord | null {
  if (!lessonId) return null;
  const cache = hydrateUserCache(email);
  const rec = cache.records[lessonId];
  return rec ? { ...rec } : null;
}

/**
 * Retrieves all stored lesson progress records for the user.
 */
export function getAllStoredLessonProgress(email?: string | null): Record<string, StoredLessonProgressRecord> {
  const cache = hydrateUserCache(email);
  return { ...cache.records };
}

/**
 * Saves a lesson's completion and metadata to local storage and memory cache.
 */

export async function saveStoredLessonCompletion(
  lessonId: string,
  details?: Partial<StoredLessonProgressRecord>,
  email?: string | null
): Promise<StoredLessonProgressRecord> {
  const cache = hydrateUserCache(email);
  const nowIso = new Date().toISOString();

  const existing = cache.records[lessonId];
  const updatedRecord: StoredLessonProgressRecord = {
    lessonId,
    completed: true,
    completedAt: existing?.completedAt || details?.completedAt || nowIso,
    updatedAt: nowIso,
    score: details?.score !== undefined ? details.score : existing?.score,
    stars: details?.stars !== undefined ? details.stars : existing?.stars,
    xpEarned: details?.xpEarned !== undefined ? details.xpEarned : existing?.xpEarned,
    cookiesEarned: details?.cookiesEarned !== undefined ? details.cookiesEarned : existing?.cookiesEarned,
    attempts: (existing?.attempts || 0) + (details?.attempts !== undefined ? details.attempts : 1)
  };

  cache.records[lessonId] = updatedRecord;

  // Persist to Supabase
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await updateLessonProgress(user.id, lessonId, {
        completed: true,
        score: updatedRecord.score,
        stars: updatedRecord.stars,
        xpEarned: updatedRecord.xpEarned,
        cookiesEarned: updatedRecord.cookiesEarned,
        attempts: updatedRecord.attempts
    });
  }

  persistUserCache(cache);
  notifyProgressUpdated(cache.email, cache.completedLessons, lessonId, updatedRecord);

  return updatedRecord;
}

/**
 * Batch merges an array of completed lesson IDs into local storage cache.
 */
export function saveStoredCompletedLessonsBatch(
  lessonIds: string[],
  email?: string | null
): string[] {
  if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
    return getStoredCompletedLessonIds(email);
  }

  const cache = hydrateUserCache(email);
  const nowIso = new Date().toISOString();
  const currentSet = new Set(cache.completedLessons);

  let hasChanges = false;
  for (const id of lessonIds) {
    if (!id || typeof id !== 'string') continue;
    if (!currentSet.has(id)) {
      currentSet.add(id);
      hasChanges = true;
    }
    if (!cache.records[id]) {
      cache.records[id] = {
        lessonId: id,
        completed: true,
        completedAt: nowIso,
        updatedAt: nowIso
      };
      hasChanges = true;
    }
  }

  if (hasChanges) {
    cache.completedLessons = Array.from(currentSet);
    cache.lastUpdated = nowIso;
    persistUserCache(cache);
    notifyProgressUpdated(cache.email, cache.completedLessons);
  }

  return [...cache.completedLessons];
}

/**
 * Subscribes to real-time lesson progress updates emitted within the app window.
 */
export function onLessonProgressUpdated(
  listener: (detail: { email: string; completedLessons: string[]; lessonId?: string; record?: StoredLessonProgressRecord }) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (evt: Event) => {
    const customEvt = evt as CustomEvent;
    if (customEvt.detail) {
      listener(customEvt.detail);
    }
  };

  window.addEventListener('chikooLessonProgressUpdated', handler);
  return () => {
    window.removeEventListener('chikooLessonProgressUpdated', handler);
  };
}

/**
 * Clears local storage lesson progress for a given user, or all users if email is not provided.
 */
export function clearStoredLessonProgress(email?: string | null): void {
  const { progressMapKey, completedListKey, cleanEmail } = getStorageKeys(email || '');
  memoryCache.delete(cleanEmail);

  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(progressMapKey);
    localStorage.removeItem(completedListKey);
  }
}
