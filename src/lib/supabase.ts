import { logProductionError } from './errorUtils';
import { createClient } from '@supabase/supabase-js';
import { LeaderboardEntry } from '../types';
import { 
  getStoredCompletedLessonIds, 
  saveStoredCompletedLessonsBatch 
} from './lessonProgressStorage';
import { 
  fetchWithCache, 
  withTimeout, 
  setCachedData, 
  getCachedSync, 
  enqueueOfflineMutation, 
  invalidateCache 
} from './dataCache';

// Safely resolve environment variables in Vite (browser), Node.js (server), and preview environments
const getMetaEnv = (): Record<string, any> | undefined => {
  try {
    return (new Function('try { return import.meta.env; } catch (_) { return undefined; }'))();
  } catch (_) {
    return undefined;
  }
};

const resolveEnv = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      const val = (import.meta as any).env[key];
      if (typeof val === 'string' && val.trim().length > 0) return val.trim();
    }
  } catch (_) {}
  if (typeof process !== 'undefined' && process.env && (process.env as any)[key]) {
    const val = (process.env as any)[key];
    if (typeof val === 'string' && val.trim().length > 0) return val.trim();
  }
  return '';
};

const supabaseUrl = (
  resolveEnv('VITE_SUPABASE_URL') ||
  resolveEnv('SUPABASE_URL') ||
  (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL)) ||
  ''
).trim();

const supabaseAnonKey = (
  resolveEnv('VITE_SUPABASE_ANON_KEY') ||
  resolveEnv('SUPABASE_ANON_KEY') ||
  (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.SUPABASE_ANON_KEY)) ||
  ''
).trim();

// Determine if we have real configured keys
export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key' &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon-key')
);

// Initialize the Supabase client safely
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

console.log('[Supabase Client] Config status:', {
  isSupabaseConfigured,
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey
});

// Clean email for key-value index matching fallback
const getSafeKey = (email: string, key: string) => `CHIKOO_SUPABASE_FALLBACK_${email.replace(/[^a-zA-Z0-9]/g, '_')}_${key}`;

export const WORLD_1_UUID = '256e5b30-e5ec-45ba-a024-7318c96eb623';
export const WORLD_2_UUID = 'e58dae0a-90e2-4e57-be26-234593fc00be';
export const WORLD_3_UUID = 'a80e6d6a-eea3-4582-a53c-dc5048baf4a5';

/**
 * Utility to validate that a string is a correctly formatted UUID.
 */
export function isValidUuid(id: any): boolean {
  if (typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Interface representing a student's profile synchronized with Supabase or fallback storage.
 */
export interface SupabaseUserProfile {
  id?: string;
  email: string;
  username: string;
  xp: number;
  weekly_xp: number;
  weekly_xp_week?: string | null;
  gems: number;
  streak: number;
  energy: number;
  accuracy: number;
  avatar_id: string;
  theme_id: string;
  best_streak: number;
  completed_lessons: string[];
  bookmarked_lessons: string[];
  completed_daily_challenges: string[];
  is_admin: boolean;
  total_chests_claimed: number;
  total_steps_claimed: number;
  trophies: number;
  created_at: string;
  last_chest_claimed_at?: string | null;
  last_streak_date?: string | null;
  claimed_rewards?: string[];
  welcome_video_seen?: boolean;
  onboarding_completed?: boolean;
}

export type UserProfile = SupabaseUserProfile;

/**
 * Calculates current IST (Indian Standard Time, UTC+5:30) week Monday as 'YYYY-MM-DD'.
 */
export function getCurrentISTWeekMonday(): string {
  const now = new Date();
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + IST_OFFSET_MS);

  // In IST, day of week: 0 = Sun, 1 = Mon, ..., 6 = Sat
  const istDay = istDate.getUTCDay();
  // Days since Monday: if Sun (0), 6 days ago. If Mon (1), 0 days ago. If Tue (2), 1 day ago, etc.
  const diffToMonday = (istDay + 6) % 7;

  const mondayDate = new Date(istDate.getTime() - diffToMonday * 24 * 60 * 60 * 1000);
  const year = mondayDate.getUTCFullYear();
  const month = String(mondayDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(mondayDate.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Calculates time remaining until the next Monday 12:00 AM IST (Sunday 18:30 UTC).
 */
export function getNextMondayIST(): Date {
  const now = new Date();
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + IST_OFFSET_MS);

  const istDay = istDate.getUTCDay();
  const daysUntilMonday = ((7 - istDay + 1) % 7) || 7;

  const targetYear = istDate.getUTCFullYear();
  const targetMonth = istDate.getUTCMonth();
  const targetDate = istDate.getUTCDate() + daysUntilMonday;

  const targetUtcMs = Date.UTC(targetYear, targetMonth, targetDate, 0, 0, 0, 0) - IST_OFFSET_MS;
  return new Date(targetUtcMs);
}

/**
 * Checks if a given week string matches the current IST week Monday.
 */
export function isCurrentISTWeek(weekValue: string | null | undefined): boolean {
  if (!weekValue) return false;
  const currentMonday = getCurrentISTWeekMonday();
  const cleanWeek = String(weekValue).trim().slice(0, 10);
  return cleanWeek === currentMonday;
}

/**
 * Computes effective weekly XP with lazy-reset support:
 * If profile.weekly_xp_week is not equal to current IST week Monday, effective weekly_xp is 0.
 */
export function computeEffectiveWeeklyXp(weekly_xp: number | null | undefined, weekly_xp_week: string | null | undefined): number {
  if (!isCurrentISTWeek(weekly_xp_week)) {
    return 0;
  }
  return Number(weekly_xp ?? 0);
}

/**
 * Active celebratory trigger overrides from Supabase tables
 */
export interface CelebrationConfig {
  id: string;
  name: string;
  category: string;
  animation: string;
  asset_url: string;
  is_active: boolean;
}

/**
 * Custom dynamic lessons database
 */
export interface SupabaseLesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  xp_reward: number;
  challenges: any[]; // JSON array of challenges
  order_index?: number;
}

/**
 * Worlds schema interface
 */
export interface World {
  id: string;
  world_number: number;
  title: string;
  description?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * User world progress interface
 */
export interface UserWorldProgress {
  id?: string;
  user_id: string;
  world_id: string;
  unlocked: boolean;
  entry_test_score?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Custom dynamic modules database
 */
export interface SupabaseModule {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  order: number;
  sort_order?: number;
  world_id?: string | null;
  created_at?: string;
  updated_at?: string;
  is_practice?: boolean;
  metadata?: any;
}

/**
 * DB learning path node storing ordered elements along the winding unit trail
 */
export interface ModuleLearningPathNode {
  id?: string;
  module_id: string;
  node_type: 'lesson' | 'challenge' | 'treasure';
  node_id: string;
  lane: 'left' | 'center' | 'right';
  sort_order: number;
}

/**
 * Custom dynamic puzzle packs database
 */
export interface SupabasePuzzlePack {
  id: string;
  title: string;
  category: string;
  cost_xp: number;
  xp_reward: number;
  questions_count: number;
  unlocked: boolean;
  completed: boolean;
  badge_reward?: string;
  questions: any[];
  chest_image_url?: string;
  chest_icon_url?: string;
  linked_unit_id?: string;
  created_at?: string;
}

// -------------------------------------------------------------
// SECURE fallback datasets used when Supabase is not connected
// -------------------------------------------------------------
const STORAGE_PREFIX = 'CHIKOO_SUPABASE_DB_';

export function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(STORAGE_PREFIX + key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setLocalStorageItem<T>(key: string, value: T): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    }
  } catch (error) {
    console.error('Local storage persist error:', error);
  }
}

// -------------------------------------------------------------
// CORE SUPABASE API WRAPPERS
// -------------------------------------------------------------

// Simple high-performance in-memory cache to prevent duplicate database SELECTs on rapid updates
export const profileCache: { [email: string]: { data: SupabaseUserProfile; timestamp: number } } = {};
const inFlightProfileRequests = new Map<string, Promise<SupabaseUserProfile>>();

export function clearProfileCache(email?: string) {
  if (email) {
    const cleanEmail = email.toLowerCase().trim();
    delete profileCache[cleanEmail];
    inFlightProfileRequests.delete(cleanEmail);
  } else {
    Object.keys(profileCache).forEach(key => delete profileCache[key]);
    inFlightProfileRequests.clear();
  }
}

/**
 * Wipes local session markers and cached onboarding/profile keys for the given email (or all users)
 */
export function clearUserSessionData(email?: string) {
  clearProfileCache(email);

  if (typeof localStorage === 'undefined') return;
  
  localStorage.removeItem('CHIKOO_SESSION_USER');
  
  if (email) {
    const cleanEmail = email.toLowerCase().trim();
    delete profileCache[cleanEmail];
    const userKeys = [
      `CHIKOO_USER_NICKNAME_${cleanEmail}`,
      `CHIKOO_USER_GRADE_${cleanEmail}`,
      `CHIKOO_USER_SCHOOL_${cleanEmail}`,
      `CHIKOO_USER_LEARNING_STYLE_${cleanEmail}`,
      `CHIKOO_USER_MOTTO_${cleanEmail}`,
      `CHIKOO_USER_TITLE_${cleanEmail}`,
      `CHIKOO_USER_PASSWORD_${cleanEmail}`,
      `CHIKOO_ACCESSORY_${cleanEmail}`,
      `CHIKOO_UNLOCKED_ACCESSORIES_${cleanEmail}`,
      `CHIKOO_PREFERENCE_LEARNING_STYLE_${cleanEmail}`,
      `chikoo_celebrated_milestones_${cleanEmail}`,
      `chikoo_just_registered_${cleanEmail}`,
      `chikoo_onboarding_completed_${cleanEmail}`,
      `chikoo_new_signup_${cleanEmail}`,
      `chikoo_welcome_video_seen_${cleanEmail}`,
      `CHIKOO_USER_REASON_${cleanEmail}`,
      `CHIKOO_USER_KNOWLEDGE_${cleanEmail}`,
      `CHIKOO_USER_DAILY_TIME_${cleanEmail}`,
      `CHIKOO_USER_INTERESTS_${cleanEmail}`,
      `CHIKOO_USER_GOAL_${cleanEmail}`,
      `CHIKOO_ONBOARDING_DATA_${cleanEmail}`,
      `CHIKOO_ONBOARDING_DRAFT_${cleanEmail}`,
      `USER_PROFILE_${cleanEmail}`,
      `CHALLENGE_PROGRESS_${cleanEmail}`
    ];
    userKeys.forEach(k => localStorage.removeItem(k));
  } else {
    localStorage.removeItem('CHIKOO_SESSION_USER');
    Object.keys(profileCache).forEach(k => delete profileCache[k]);
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (
        key.startsWith('CHIKOO_USER_') ||
        key.startsWith('USER_PROFILE_') ||
        key.startsWith('CHALLENGE_PROGRESS_') ||
        key.startsWith('CHIKOO_ONBOARDING_') ||
        key.startsWith('chikoo_')
      ) {
        localStorage.removeItem(key);
      }
    });
  }
}

/**
 * Creates or ensures that a user profile exists in Supabase public.profiles.
 * Called immediately during the SIGNUP flow:
 * Sign Up -> Auth User Created -> Session/User ID Available -> Profile Creation -> Initial User Data -> UI
 * Uses idempotent UPSERT to guarantee profile creation without duplicate errors.
 */
export async function createOrEnsureProfile(
  userId: string,
  email: string,
  initialData?: {
    username?: string;
    avatar_id?: string;
    theme_id?: string;
    school_id?: string | null;
    school_class_id?: string | null;
  }
): Promise<SupabaseUserProfile> {
  const cleanEmail = email.toLowerCase().trim();
  const cachedCompleted = getStoredCompletedLessonIds(cleanEmail);
  const cachedProfile = getLocalStorageItem<SupabaseUserProfile | null>(`USER_PROFILE_${cleanEmail}`, null);

  const initialUsername = (initialData?.username || cachedProfile?.username || cleanEmail.split('@')[0]).trim();

  const profilePayload: SupabaseUserProfile = {
    id: userId,
    email: cleanEmail,
    username: initialUsername,
    xp: 0,
    weekly_xp: cachedProfile?.weekly_xp ?? 0,
    gems: cachedProfile?.gems ?? 50,
    streak: cachedProfile?.streak ?? 0,
    energy: cachedProfile?.energy ?? 25,
    accuracy: cachedProfile?.accuracy ?? 1.0,
    avatar_id: initialData?.avatar_id || cachedProfile?.avatar_id || 'user',
    theme_id: initialData?.theme_id || cachedProfile?.theme_id || 'blue',
    best_streak: cachedProfile?.best_streak ?? 0,
    completed_lessons: Array.from(new Set([...cachedCompleted, ...(cachedProfile?.completed_lessons || [])])),
    bookmarked_lessons: cachedProfile?.bookmarked_lessons || [],
    completed_daily_challenges: cachedProfile?.completed_daily_challenges || [],
    is_admin: cleanEmail === 'shaurya@leapstartup.com' || cleanEmail === 'shauryagaikwad514@gmail.com',
    total_chests_claimed: cachedProfile?.total_chests_claimed ?? 0,
    total_steps_claimed: cachedProfile?.total_steps_claimed ?? 0,
    trophies: cachedProfile?.trophies ?? 45,
    created_at: cachedProfile?.created_at || new Date().toISOString(),
    last_chest_claimed_at: cachedProfile?.last_chest_claimed_at ?? null,
    claimed_rewards: cachedProfile?.claimed_rewards || [],
    welcome_video_seen: cachedProfile?.welcome_video_seen ?? false
  };

  // Immediate cache priming
  profileCache[cleanEmail] = { data: profilePayload, timestamp: Date.now() };
  setLocalStorageItem(`USER_PROFILE_${cleanEmail}`, profilePayload);

  if (isSupabaseConfigured && supabase) {
    try {
      console.log("[Supabase Intent] UPSERT on table: 'profiles' for user:", { id: userId, email: cleanEmail });

      const dbRow: any = {
        id: userId,
        email: cleanEmail,
        username: initialUsername,
        xp: 0,
        weekly_xp: profilePayload.weekly_xp,
        gems: profilePayload.gems,
        streak: profilePayload.streak,
        energy: profilePayload.energy,
        accuracy: profilePayload.accuracy,
        avatar_id: profilePayload.avatar_id,
        theme_id: profilePayload.theme_id,
        best_streak: profilePayload.best_streak,
        is_admin: profilePayload.is_admin,
        trophies: profilePayload.trophies,
        total_chests_claimed: profilePayload.total_chests_claimed,
        total_steps_claimed: profilePayload.total_steps_claimed,
        completed_lessons: profilePayload.completed_lessons,
        bookmarked_lessons: profilePayload.bookmarked_lessons
      };

      if (initialData?.school_id) dbRow.school_id = initialData.school_id;
      if (initialData?.school_class_id) dbRow.school_class_id = initialData.school_class_id;

      const { data, error } = await supabase
        .from('profiles')
        .upsert(dbRow, { onConflict: 'id' })
        .select('*')
        .maybeSingle();

      if (error) {
        console.warn("[Supabase Warning] Full profile upsert warning, attempting minimal upsert:", error.message);
        const minimalRow = {
          id: userId,
          email: cleanEmail,
          username: initialUsername,
          gems: 50,
          energy: 25,
          accuracy: 1.0,
          trophies: 45
        };
        const { data: retryData, error: retryError } = await supabase
          .from('profiles')
          .upsert(minimalRow, { onConflict: 'id' })
          .select('*')
          .maybeSingle();

        if (retryData) {
          console.log("[Supabase Success] Minimal profile created in database:", retryData.id);
          const synced: SupabaseUserProfile = {
            ...profilePayload,
            ...retryData,
            completed_lessons: Array.isArray(retryData.completed_lessons) ? retryData.completed_lessons : profilePayload.completed_lessons,
            bookmarked_lessons: Array.isArray(retryData.bookmarked_lessons) ? retryData.bookmarked_lessons : profilePayload.bookmarked_lessons,
          };
          profileCache[cleanEmail] = { data: synced, timestamp: Date.now() };
          setLocalStorageItem(`USER_PROFILE_${cleanEmail}`, synced);
          return synced;
        }
        if (retryError) {
          console.error("[Supabase Error] Profile creation failed:", retryError);
        }
      } else if (data) {
        console.log("[Supabase Success] Profile created / confirmed in database:", data.id);
        const synced: SupabaseUserProfile = {
          ...profilePayload,
          ...data,
          completed_lessons: Array.isArray(data.completed_lessons) ? data.completed_lessons : profilePayload.completed_lessons,
          bookmarked_lessons: Array.isArray(data.bookmarked_lessons) ? data.bookmarked_lessons : profilePayload.bookmarked_lessons,
        };
        profileCache[cleanEmail] = { data: synced, timestamp: Date.now() };
        setLocalStorageItem(`USER_PROFILE_${cleanEmail}`, synced);
        return synced;
      }
    } catch (e) {
      logProductionError('createOrEnsureProfile', 'supabase.ts', 'server', e, { userId, email });
      console.error("[Supabase Error] Exception in createOrEnsureProfile:", e);
    }
  }

  return profilePayload;
}

/**
 * Fetches user profile matching clean registered email address.
 * Implements true Stale-While-Revalidate with resilient mobile timeouts and deduplication.
 * Distinguishes failed requests from legitimate empty data and preserves existing cached data on failure.
 */
export async function getProfile(email: string, forceFresh = false, knownAuthUserId?: string | null): Promise<SupabaseUserProfile> {
  const cleanEmail = email.toLowerCase().trim();
  const memoryEntry = profileCache[cleanEmail];
  const localEntry = getLocalStorageItem<SupabaseUserProfile | null>(`USER_PROFILE_${cleanEmail}`, null);
  const cached = memoryEntry?.data || localEntry;

  const now = Date.now();
  const cachedTime = memoryEntry ? memoryEntry.timestamp : 0;
  const isFresh = cached && (now - cachedTime < 30000); // 30s fresh window

  // Always merge with locally stored completed lessons so client progress is preserved
  if (cached) {
    const localCompleted = getStoredCompletedLessonIds(cleanEmail);
    if (localCompleted.length > 0) {
      cached.completed_lessons = Array.from(new Set([...localCompleted, ...(cached.completed_lessons || [])]));
    }
    if (!profileCache[cleanEmail]) {
      profileCache[cleanEmail] = { data: cached, timestamp: now };
    }
  }

  // If we have a fresh cache and not forced to refresh, return immediately
  if (!forceFresh && isFresh && cached) {
    return cached;
  }

  // Revalidation function with mobile-safe timeout and deduplication
  const fetchFreshProfile = async (): Promise<SupabaseUserProfile> => {
    try {
      // Allow 8500ms on mobile cellular connections
      const freshResult = await withTimeout(getProfileNoCache(cleanEmail, knownAuthUserId), 8500);
      
      // Safety check: Never overwrite an existing populated cache with empty zero data if request had an issue
      if (cached && (cached.gems > 0 || (cached.completed_lessons && cached.completed_lessons.length > 0))) {
        if (freshResult.gems === 0 && (!freshResult.completed_lessons || freshResult.completed_lessons.length === 0)) {
          console.warn('[Supabase Profile] Revalidation returned empty data while valid cached data exists. Retaining cached truth.');
          return cached;
        }
      }

      profileCache[cleanEmail] = { data: freshResult, timestamp: Date.now() };
      setLocalStorageItem(`USER_PROFILE_${cleanEmail}`, freshResult);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('chikooProfileUpdated', { detail: freshResult }));
      }
      return freshResult;
    } catch (err: any) {
      console.warn('[DATA_INIT] error: Network/Timeout fetching profile:', err?.message || err);
      if (cached) {
        console.log('[Supabase Profile] Retaining existing cached profile after network failure.');
        return cached;
      }
      throw err; // Let caller distinguish network failure from valid empty data
    }
  };

  // If in-flight request already exists, return or track it
  if (inFlightProfileRequests.has(cleanEmail)) {
    const inFlight = inFlightProfileRequests.get(cleanEmail)!;
    if (cached && !forceFresh) {
      return cached;
    }
    return inFlight;
  }

  // If we have stale cache and not forceFresh, trigger background revalidation and return stale cache immediately
  if (cached && !forceFresh) {
    const backgroundPromise = (async () => {
      try {
        return await fetchFreshProfile();
      } catch (e) {
        return cached;
      } finally {
        inFlightProfileRequests.delete(cleanEmail);
      }
    })();
    inFlightProfileRequests.set(cleanEmail, backgroundPromise);
    return cached;
  }

  // No cache or forceFresh requested: execute full fetch
  const reqPromise = (async () => {
    try {
      return await fetchFreshProfile();
    } catch (err) {
      if (cached) return cached;
      // If truly no cache exists, generate initial fallback profile
      return getProfileNoCache(cleanEmail, knownAuthUserId);
    } finally {
      inFlightProfileRequests.delete(cleanEmail);
    }
  })();

  inFlightProfileRequests.set(cleanEmail, reqPromise);
  return reqPromise;
}

async function getProfileNoCache(email: string, knownAuthUserId?: string | null): Promise<SupabaseUserProfile> {
  const cleanEmail = email.toLowerCase().trim();
  const cachedCompleted = getStoredCompletedLessonIds(cleanEmail);
  const cachedProfile = getLocalStorageItem<SupabaseUserProfile | null>(`USER_PROFILE_${cleanEmail}`, null);

  const defaultProfile: SupabaseUserProfile = {
    email: cleanEmail,
    username: cachedProfile?.username || cleanEmail.split('@')[0],
    xp: 0,
    weekly_xp: cachedProfile?.weekly_xp ?? 0,
    gems: cachedProfile?.gems ?? 0,
    streak: cachedProfile?.streak ?? 0,
    energy: cachedProfile?.energy ?? 25,
    accuracy: cachedProfile?.accuracy ?? 1.0,
    avatar_id: cachedProfile?.avatar_id ?? 'user',
    theme_id: cachedProfile?.theme_id ?? 'blue',
    best_streak: cachedProfile?.best_streak ?? 0,
    completed_lessons: Array.from(new Set([...cachedCompleted, ...(cachedProfile?.completed_lessons || [])])),
    bookmarked_lessons: cachedProfile?.bookmarked_lessons || [],
    completed_daily_challenges: cachedProfile?.completed_daily_challenges || [],
    is_admin: cleanEmail === 'shaurya@leapstartup.com' || cleanEmail === 'shauryagaikwad514@gmail.com',
    total_chests_claimed: cachedProfile?.total_chests_claimed ?? 0,
    total_steps_claimed: cachedProfile?.total_steps_claimed ?? 0,
    trophies: cachedProfile?.trophies ?? 0,
    created_at: cachedProfile?.created_at || new Date().toISOString(),
    last_chest_claimed_at: cachedProfile?.last_chest_claimed_at ?? null,
    claimed_rewards: cachedProfile?.claimed_rewards || [],
    welcome_video_seen: cachedProfile?.welcome_video_seen !== undefined 
      ? cachedProfile.welcome_video_seen 
      : (typeof localStorage !== 'undefined' ? localStorage.getItem(`chikoo_welcome_video_seen_${cleanEmail}`) === 'true' : false)
  };

  if (supabase) {
    const startTime = Date.now();
    try {
      // Obtain authenticated user ID: prefer knownAuthUserId, fallback to session or getUser
      let authUserId: string | null = knownAuthUserId || null;
      if (!authUserId) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.id) {
            authUserId = session.user.id;
          } else {
            const timeoutPromise = new Promise<{ data: { user: null }; error: Error }>((resolve) =>
              setTimeout(() => resolve({ data: { user: null }, error: new Error('TIMEOUT') }), 2500)
            );
            const { data: authData } = await Promise.race([
              supabase.auth.getUser(),
              timeoutPromise
            ]);
            if (authData?.user) {
              authUserId = authData.user.id;
            }
          }
        } catch (err: any) {
          console.warn("[Supabase Auth] Failed retrieving authenticated user session:", err);
        }
      }

      if (!authUserId) {
        console.log(`[DATA_INIT] bootstrap blocked: reason=AUTH_USER_ID_MISSING`);
        throw new Error('AUTH_USER_ID_MISSING');
      }

      console.log(`[DATA_INIT] query: getProfile started for ${cleanEmail} (authUserId/session.user.id: ${authUserId})`);

      // Helper to query profiles table by authenticated user ID (never email alone)
      const fetchFromProfiles = async () => {
        const { data: joinData, error: joinError } = await supabase!
          .from('profiles')
          .select(`
            id,
            email,
            username,
            xp,
            weekly_xp,
            weekly_xp_week,
            gems,
            streak,
            energy,
            accuracy,
            avatar_id,
            theme_id,
            best_streak,
            is_admin,
            total_chests_claimed,
            total_steps_claimed,
            created_at,
            trophies,
            last_chest_claimed_at,
            last_streak_date,
            completed_lessons,
            bookmarked_lessons,
            user_bookmarks ( lesson_id ),
            user_lesson_progress ( lesson_id, completed )
          `)
          .eq('id', authUserId)
          .maybeSingle();

        if (joinError) {
          console.warn("[Supabase Warning] Relational join query failed, falling back to simple select:", joinError);
          const { data: fbData, error: fbError } = await supabase!
            .from('profiles')
            .select('id, email, username, xp, weekly_xp, weekly_xp_week, gems, streak, energy, accuracy, avatar_id, theme_id, best_streak, is_admin, total_chests_claimed, total_steps_claimed, created_at, trophies, last_chest_claimed_at, last_streak_date, completed_lessons, bookmarked_lessons')
            .eq('id', authUserId)
            .maybeSingle();
          if (fbError) {
            console.error("[DATA_INIT] error: Simple select fallback failed:", fbError);
            throw fbError;
          }
          return { data: fbData, mode: 'fallback' };
        }

        return { data: joinData, mode: 'join' };
      };

      let result = await fetchFromProfiles();

      // If profile is not found immediately, wait and retry
      if (!result?.data && supabase) {
        for (let attempt = 1; attempt <= 3; attempt++) {
          console.log(`[Supabase Profile Sync] Waiting for profile creation attempt ${attempt}/3...`);
          await new Promise(resolve => setTimeout(resolve, 300));
          result = await fetchFromProfiles();
          if (result?.data) break;
        }
      }

      if (result?.data) {
        const rowData = result.data as any;
        if (!rowData.id || rowData.id !== authUserId) {
          console.log(`[DATA_INIT] bootstrap blocked: reason=AUTH_USER_ID_MISSING (profile id mismatch: profiles.id=${rowData.id}, authUserId=${authUserId})`);
          throw new Error('AUTH_USER_ID_MISSING');
        }
        const uId = rowData.id;

        let bookmarkedList: string[] = [];
        let completedList: string[] = [];
        let completedChallengesList: string[] = [];

        const directBookmarks: string[] = Array.isArray(rowData.bookmarked_lessons) ? rowData.bookmarked_lessons : [];
        const directCompleted: string[] = Array.isArray(rowData.completed_lessons) ? rowData.completed_lessons : [];

        let relationalBookmarks: string[] = [];
        let relationalCompleted: string[] = [];

        if (result.mode === 'join') {
          relationalBookmarks = Array.isArray(rowData.user_bookmarks)
            ? rowData.user_bookmarks.map((b: any) => b.lesson_id)
            : [];
          relationalCompleted = Array.isArray(rowData.user_lesson_progress)
            ? rowData.user_lesson_progress.filter((p: any) => p.completed).map((p: any) => p.lesson_id)
            : [];
        } else {
          const { data: bRows } = await supabase.from('user_bookmarks').select('lesson_id').eq('user_id', uId);
          if (bRows) relationalBookmarks = bRows.map((r: any) => r.lesson_id);

          const { data: pRows } = await supabase.from('user_lesson_progress').select('lesson_id').eq('user_id', uId).eq('completed', true);
          if (pRows) relationalCompleted = pRows.map((r: any) => r.lesson_id);
        }

        bookmarkedList = Array.from(new Set([...directBookmarks, ...relationalBookmarks]));
        completedList = Array.from(new Set([...directCompleted, ...relationalCompleted, ...cachedCompleted]));
        saveStoredCompletedLessonsBatch(completedList, cleanEmail);

        const { data: cpRows } = await supabase.from('user_challenge_progress').select('challenge_id').eq('user_id', uId).eq('status', 'completed');
        if (cpRows) completedChallengesList = cpRows.map((r: any) => r.challenge_id);

        const loadedProfile: SupabaseUserProfile = {
          id: rowData.id || authUserId,
          email: rowData.email || cleanEmail,
          username: rowData.username || cleanEmail.split('@')[0],
          xp: Number(rowData.xp ?? 0),
          weekly_xp: computeEffectiveWeeklyXp(rowData.weekly_xp, rowData.weekly_xp_week),
          weekly_xp_week: rowData.weekly_xp_week ?? null,
          gems: Number(rowData.gems ?? 0),
          streak: Number(rowData.streak ?? 0),
          energy: Number(rowData.energy ?? 25),
          accuracy: Number(rowData.accuracy ?? 1.0),
          avatar_id: rowData.avatar_id ?? 'user',
          theme_id: rowData.theme_id ?? 'blue',
          best_streak: Number(rowData.best_streak ?? 0),
          completed_lessons: completedList,
          bookmarked_lessons: bookmarkedList,
          completed_daily_challenges: completedChallengesList,
          is_admin: !!rowData.is_admin,
          total_chests_claimed: Number(rowData.total_chests_claimed ?? 0),
          total_steps_claimed: Number(rowData.total_steps_claimed ?? 0),
          trophies: Number(rowData.trophies ?? 0),
          created_at: rowData.created_at || defaultProfile.created_at,
          last_chest_claimed_at: rowData.last_chest_claimed_at ?? null,
          last_streak_date: rowData.last_streak_date ?? null,
          claimed_rewards: Array.isArray(rowData.claimed_rewards) ? rowData.claimed_rewards : [],
          welcome_video_seen: rowData.welcome_video_seen !== undefined 
            ? Boolean(rowData.welcome_video_seen) 
            : (typeof localStorage !== 'undefined' && localStorage.getItem(`chikoo_welcome_video_seen_${cleanEmail}`) === 'true')
        };

        // Hydrate claimed_rewards from public.reward_claims and local storage
        try {
          const profileClaimed: string[] = Array.isArray(rowData.claimed_rewards) ? [...rowData.claimed_rewards] : [];
          const profId = loadedProfile.id || cleanEmail;
          let storedKeys: string[] = [];
          if (typeof localStorage !== 'undefined' && profId) {
            try {
              const raw = localStorage.getItem(`CHIKOO_CLAIMED_QUEST_KEYS_${profId}`);
              if (raw) storedKeys = JSON.parse(raw);
            } catch (_) {}
          }
          let serverClaims: string[] = [];
          if (loadedProfile.id) {
            try {
              const { data: claimsData } = await supabase
                .from('reward_claims')
                .select('claim_key')
                .eq('user_id', loadedProfile.id);
              if (claimsData && Array.isArray(claimsData)) {
                serverClaims = claimsData.map((c: any) => c.claim_key).filter(Boolean);
              }
            } catch (_) {}
          }
          loadedProfile.claimed_rewards = Array.from(new Set([...profileClaimed, ...storedKeys, ...serverClaims]));
        } catch (_) {}

        const duration = Date.now() - startTime;
        console.log(`[DATA_INIT] query: getProfile completed`);
        console.log(`[DATA_INIT] duration: ${duration}ms`);
        console.log(`[DATA_INIT] response: row found: true | profiles.id: ${loadedProfile.id} | matches authUserId: ${loadedProfile.id === authUserId} | gems: ${loadedProfile.gems} | completedLessons: ${completedList.length}`);

        setLocalStorageItem(`USER_PROFILE_${cleanEmail}`, loadedProfile);
        return loadedProfile;
      } else {
        console.log("[Supabase Profile Sync] Profile row not yet found in public.profiles. Ensuring profile creation in database...");
        if (authUserId) {
          const created = await createOrEnsureProfile(authUserId, cleanEmail, {
            username: cachedProfile?.username || cleanEmail.split('@')[0]
          });
          const duration = Date.now() - startTime;
          console.log(`[DATA_INIT] query: getProfile completed (created fresh)`);
          console.log(`[DATA_INIT] duration: ${duration}ms`);
          console.log(`[DATA_INIT] response: fresh profile created for ${cleanEmail}`);
          return created;
        }
        const duration = Date.now() - startTime;
        console.log(`[DATA_INIT] query: getProfile completed (empty initial account)`);
        console.log(`[DATA_INIT] duration: ${duration}ms`);
        return {
          ...defaultProfile,
          id: authUserId || undefined
        };
      }
    } catch (e: any) {
      const duration = Date.now() - startTime;
      console.error(`[DATA_INIT] error: getProfile failed:`, e?.message || e);
      console.log(`[DATA_INIT] duration: ${duration}ms`);
      throw e;
    }
  }

  // Fallback only if Supabase connection fails
  return defaultProfile;
}

// In-memory cache for valid lesson IDs to eliminate redundant SELECT queries on every progress write
let cachedValidLessonIds: Set<string> | null = null;
let lastLessonIdsFetchTime = 0;

async function getValidLessonIds(): Promise<Set<string>> {
  const now = Date.now();
  if (cachedValidLessonIds && (now - lastLessonIdsFetchTime < 15 * 60 * 1000)) {
    return cachedValidLessonIds;
  }
  const ids = new Set<string>();

  if (supabase) {
    try {
      const { data: dbLessons, error } = await supabase.from('lessons').select('id');
      if (!error && dbLessons) {
        dbLessons.forEach((l: any) => ids.add(l.id));
      }
    } catch (e) {
      console.warn('[Supabase Warning] Failed to fetch valid lesson IDs from DB:', e);
    }
  }
  cachedValidLessonIds = ids;
  lastLessonIdsFetchTime = now;
  return ids;
}

/**
 * Saves/Updates profile records back into Supabase or simulated client storage.
 */
export async function updateProfile(email: string, updates: Partial<SupabaseUserProfile>): Promise<SupabaseUserProfile> {
  const cleanEmail = email.toLowerCase().trim();
  const current = await getProfile(cleanEmail);
  const safeUpdates = { ...updates };
  delete safeUpdates.is_admin;
  const updatedInstance = { ...current, ...safeUpdates, is_admin: current.is_admin };

  // Synchronously cache completed lessons in platform local storage
  if (updates.completed_lessons && Array.isArray(updates.completed_lessons)) {
    saveStoredCompletedLessonsBatch(updates.completed_lessons, cleanEmail);
  }

  // Update memory cache and local storage immediately
  profileCache[cleanEmail] = { data: updatedInstance, timestamp: Date.now() };
  setLocalStorageItem(`USER_PROFILE_${cleanEmail}`, updatedInstance);

  if (supabase) {
    try {
      let userId = current.id;
      if (!userId || !isValidUuid(userId)) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.id) {
            userId = session.user.id;
          }
        } catch (_) {}
      }

      // Fetch list of valid lessons cached in-memory to prevent foreign key constraint rejections (23503)
      const needValidLessons = !!(updates.completed_lessons || updates.bookmarked_lessons);
      const validLessonIds = needValidLessons ? await getValidLessonIds() : new Set<string>();

      // Helper to check if an ID is a dynamic adventure node or custom practice pack
      const isDynamicNode = (id: string): boolean => {
        return id.startsWith('challenge_') || 
               id.startsWith('treasure_') || 
               id.startsWith('guardian_') || 
               id.startsWith('practice_');
      };

      // 1. If bookmarked_lessons array is supplied, record the relational changes
      if (updates.bookmarked_lessons && userId && isValidUuid(userId)) {
        const currentBookmarks = current.bookmarked_lessons;
        const targetBookmarks = updates.bookmarked_lessons;

        const added = targetBookmarks.filter(id => !currentBookmarks.includes(id));
        const removed = currentBookmarks.filter(id => !targetBookmarks.includes(id));

        for (const addedId of added) {
          // Prevent foreign key constraint rejection for dynamic or invalid IDs
          if (isDynamicNode(addedId) || (validLessonIds.size > 0 && !validLessonIds.has(addedId))) {
            console.log(`[Supabase Skip] Skipping bookmark tracking on relational DB for non-standard node: ${addedId}`);
            continue;
          }

          console.log("[Supabase Intent] UPDATE on table: 'user_bookmarks'", { user_id: userId, lesson_id: addedId });
          const { error: err } = await supabase
            .from('user_bookmarks')
            .upsert([{
              user_id: userId,
              lesson_id: addedId
            }], { onConflict: 'user_id,lesson_id' });
          if (err) {
            console.error("[Supabase Error] Failed operation on 'user_bookmarks':", err);
          } else {
            console.log("[Supabase Success] 'user_bookmarks' operation completed.", { user_id: userId, lesson_id: addedId });
          }
        }
        for (const removedId of removed) {
          console.log("[Supabase Intent] DELETE on table: 'user_bookmarks'", { user_id: userId, lesson_id: removedId });
          const { error: err } = await supabase
            .from('user_bookmarks')
            .delete()
            .eq('user_id', userId)
            .eq('lesson_id', removedId);
          if (err) {
            console.error("[Supabase Error] Failed operation on 'user_bookmarks':", err);
          } else {
            console.log("[Supabase Success] 'user_bookmarks' operation completed.", { user_id: userId, lesson_id: removedId });
          }
        }
      }

      // 2. If completed_lessons array is supplied, record progress changes
      if (updates.completed_lessons && userId && isValidUuid(userId)) {
        const currentCompleted = current.completed_lessons;
        const targetCompleted = updates.completed_lessons;

        const newlyCompleted = targetCompleted.filter(id => !currentCompleted.includes(id));
        for (const completedId of newlyCompleted) {
          // Record completion in user_challenge_progress (relational table without foreign key restrictions)
          console.log(`[Supabase Challenge Progress] Saving completion for: ${completedId}`);
          const { error: cpErr } = await supabase
            .from('user_challenge_progress')
            .upsert({
              user_id: userId,
              challenge_id: completedId,
              status: 'completed',
              score: 100,
              xp_earned: completedId.startsWith('guardian_') ? 300 : completedId.startsWith('treasure_') ? 200 : 100,
              completed_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,challenge_id'
            });
          if (cpErr) {
            console.warn(`[Supabase Warning] user_challenge_progress log for ${completedId}:`, cpErr);
          } else {
            console.log(`[Supabase Success] Logged ${completedId} in user_challenge_progress successfully.`);
          }

          if (isDynamicNode(completedId) || (validLessonIds.size > 0 && !validLessonIds.has(completedId))) {
            continue;
          }

          if (validLessonIds.size > 0 && validLessonIds.has(completedId)) {
            const progressPayload = {
              user_id: userId,
              lesson_id: completedId,
              completed: true,
              completion_percentage: 100,
              completed_at: new Date().toISOString()
            };
            console.log("[Supabase Intent] UPDATE on table: 'user_lesson_progress'", progressPayload);
            const { error: err } = await supabase
              .from('user_lesson_progress')
              .upsert([progressPayload], { onConflict: 'user_id,lesson_id' });
            if (err) {
              console.warn("[Supabase Warning] Operation on 'user_lesson_progress':", err);
            } else {
              console.log("[Supabase Success] 'user_lesson_progress' operation completed.", progressPayload);
            }
          }
        }
      }

      // 3. Update the profiles table with scalar attributes and array columns
      const payload: any = {
        updated_at: new Date().toISOString()
      };
      if (updates.username !== undefined) payload.username = updates.username;
      if (updates.xp !== undefined) payload.xp = updates.xp;
      if (updates.weekly_xp !== undefined) payload.weekly_xp = updates.weekly_xp;
      if (updates.gems !== undefined) payload.gems = updates.gems;
      if (updates.streak !== undefined) payload.streak = updates.streak;
      if (updates.energy !== undefined) payload.energy = updates.energy;
      if (updates.accuracy !== undefined) payload.accuracy = updates.accuracy;
      if (updates.avatar_id !== undefined) payload.avatar_id = updates.avatar_id;
      if (updates.theme_id !== undefined) payload.theme_id = updates.theme_id;
      if (updates.best_streak !== undefined) payload.best_streak = updates.best_streak;
      // Explicitly disallow client-side modification of is_admin (privilege escalation prevention)
      delete payload.is_admin;
      if (updates.total_chests_claimed !== undefined) payload.total_chests_claimed = updates.total_chests_claimed;
      if (updates.total_steps_claimed !== undefined) payload.total_steps_claimed = updates.total_steps_claimed;
      if (updates.trophies !== undefined) payload.trophies = updates.trophies;
      if (updates.last_chest_claimed_at !== undefined) payload.last_chest_claimed_at = updates.last_chest_claimed_at;
      if (updates.last_streak_date !== undefined) payload.last_streak_date = updates.last_streak_date;
      if (updates.completed_lessons !== undefined) payload.completed_lessons = updates.completed_lessons;
      if (updates.bookmarked_lessons !== undefined) payload.bookmarked_lessons = updates.bookmarked_lessons;
      if (updates.onboarding_completed !== undefined) {
        payload.onboarding_completed = Boolean(updates.onboarding_completed);
        updatedInstance.onboarding_completed = Boolean(updates.onboarding_completed);
      }
      if (updates.welcome_video_seen !== undefined) {
        updatedInstance.welcome_video_seen = Boolean(updates.welcome_video_seen);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(`chikoo_welcome_video_seen_${cleanEmail}`, String(updates.welcome_video_seen));
        }
        // Also persist in Supabase Auth user_metadata so it's guaranteed persistent per user account
        if (supabase) {
          try {
            await supabase.auth.updateUser({
              data: { welcome_video_seen: Boolean(updates.welcome_video_seen) }
            });
          } catch (authMetaErr) {
            console.warn("[Supabase Warning] Could not persist welcome_video_seen to auth user_metadata:", authMetaErr);
          }
        }
      }

      console.log("[Supabase Intent] UPSERT/UPDATE on table: 'profiles'", { email: cleanEmail, updates: payload });
      let updateQuery;
      if (current.id) {
        updateQuery = supabase.from('profiles').upsert({ id: current.id, email: cleanEmail, ...payload }, { onConflict: 'id' });
      } else {
        updateQuery = supabase.from('profiles').update(payload).eq('email', cleanEmail);
      }
      let { data: updatedRows, error } = await updateQuery.select('*');

      if (error) {
        // If welcome_video_seen column does not exist in remote table yet, retry without it
        if (payload.welcome_video_seen !== undefined && (error.message?.includes('welcome_video_seen') || error.details?.includes('welcome_video_seen') || error.code === '42703')) {
          console.warn("[Supabase Warning] 'welcome_video_seen' column not yet in remote public.profiles table. Retrying update without it (persisted via auth metadata & cache):", error.message);
          const safePayload = { ...payload };
          delete safePayload.welcome_video_seen;
          let retryQuery;
          if (current.id) {
            retryQuery = supabase.from('profiles').upsert({ id: current.id, email: cleanEmail, ...safePayload }, { onConflict: 'id' });
          } else {
            retryQuery = supabase.from('profiles').update(safePayload).eq('email', cleanEmail);
          }
          const retryRes = await retryQuery.select('*');
          if (!retryRes.error) {
            updatedRows = retryRes.data;
            error = null;
          }
        }
      }

      if (error) {
        console.error("[Supabase Error] Failed operation on 'profiles':", error);
        throw new Error(error.message || "Failed operation on 'profiles'");
      } else {
        console.log("[Supabase Success] 'profiles' operation completed.", payload);
        if (updatedRows && updatedRows.length > 0) {
          const row = updatedRows[0];
          updatedInstance.gems = Number(row.gems ?? updatedInstance.gems);
          updatedInstance.streak = Number(row.streak ?? updatedInstance.streak);
          updatedInstance.best_streak = Number(row.best_streak ?? updatedInstance.best_streak);
          updatedInstance.xp = Number(row.xp ?? updatedInstance.xp);
          updatedInstance.weekly_xp = Number(row.weekly_xp ?? updatedInstance.weekly_xp);
          updatedInstance.energy = Number(row.energy ?? updatedInstance.energy);
          updatedInstance.accuracy = Number(row.accuracy ?? updatedInstance.accuracy);
          updatedInstance.trophies = Number(row.trophies ?? updatedInstance.trophies);
          updatedInstance.total_chests_claimed = Number(row.total_chests_claimed ?? updatedInstance.total_chests_claimed);
          updatedInstance.total_steps_claimed = Number(row.total_steps_claimed ?? updatedInstance.total_steps_claimed);
          updatedInstance.last_chest_claimed_at = row.last_chest_claimed_at ?? updatedInstance.last_chest_claimed_at;
          updatedInstance.last_streak_date = row.last_streak_date ?? updatedInstance.last_streak_date;
          if (Array.isArray(row.completed_lessons)) {
            updatedInstance.completed_lessons = row.completed_lessons;
          }
          if (Array.isArray(row.bookmarked_lessons)) {
            updatedInstance.bookmarked_lessons = row.bookmarked_lessons;
          }
          if (Array.isArray(row.claimed_rewards)) {
            updatedInstance.claimed_rewards = row.claimed_rewards;
          }
          if (row.welcome_video_seen !== undefined) {
            updatedInstance.welcome_video_seen = Boolean(row.welcome_video_seen);
          }
        }
      }
    } catch (err) {
      console.warn('Supabase exception on save Profile, enqueuing for offline sync:', err);
      enqueueOfflineMutation(cleanEmail, {
        id: `profile_sync_${Date.now()}`,
        type: 'profile_update',
        email: cleanEmail,
        payload: updates
      });
    }
  }

  // Update memory cache and local storage with confirmed instance
  profileCache[cleanEmail] = { data: updatedInstance, timestamp: Date.now() };
  setLocalStorageItem(`USER_PROFILE_${cleanEmail}`, updatedInstance);
  if (updatedInstance.completed_lessons && Array.isArray(updatedInstance.completed_lessons)) {
    saveStoredCompletedLessonsBatch(updatedInstance.completed_lessons, cleanEmail);
  }
  return updatedInstance;
}

/**
 * Log challenge completion in user_challenge_progress table
 */
export async function logChallengeCompletion(
  email: string,
  challengeId: string,
  finalScore: number,
  xpReward: number
): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  const profile = await getProfile(cleanEmail);
  const userId = profile?.id;

  if (supabase && userId) {
    try {
      console.log("[Supabase Intent] UPSERT on table: 'user_challenge_progress'", {
        user_id: userId,
        challenge_id: challengeId,
        status: 'completed',
        score: finalScore,
        xp_earned: xpReward
      });
      const { data, error } = await supabase
        .from('user_challenge_progress')
        .upsert({
          user_id: userId,
          challenge_id: challengeId,
          status: 'completed',
          score: finalScore,
          xp_earned: xpReward,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,challenge_id'
        })
        .select();

      if (error) {
        console.error("❌ Error updating challenge progress:", error.message);
      } else {
        console.log("🚀 Challenge completion tracked successfully:", data);
      }
    } catch (e) {
      console.error("❌ Supabase exception logging challenge completion:", e);
    }
  }

  // Fallback to local storage
  try {
    const key = `CHALLENGE_PROGRESS_${cleanEmail}`;
    const saved = getLocalStorageItem<Record<string, any>>(key, {});
    saved[challengeId] = {
      status: 'completed',
      score: finalScore,
      xp_earned: xpReward,
      completed_at: new Date().toISOString()
    };
    setLocalStorageItem(key, saved);
  } catch (err) {
    console.error("Failed saving challenge completion locally:", err);
  }
}

/**
 * Fetch all registered profiles for user management inside the Admin Panel.
 */
/**
 * Fetch all registered profiles for user management inside the Admin Panel.
 * Uses fetchWithCache to deduplicate requests, apply SWR, and prevent slow loads.
 */
export async function getAllUserProfiles(): Promise<SupabaseUserProfile[]> {
  return fetchWithCache<SupabaseUserProfile[]>('CHIKOO_ALL_USER_PROFILES_V2', async () => {
    // First try concrete server database endpoint
    try {
      const apiRes = await fetch('/api/database/leaderboard');
      if (apiRes.ok) {
        const json = await apiRes.json();
        if (json && json.success && Array.isArray(json.leaderboard) && json.leaderboard.length > 0) {
          const mapped = json.leaderboard.map((item: any, idx: number) => ({
            id: item.id || `leaderboard_${idx + 1}`,
            email: '',
            username: item.username || item.name || 'Explorer',
            xp: Number(item.xp ?? item.gems ?? 0),
            weekly_xp: item.weekly_xp_week !== undefined
              ? computeEffectiveWeeklyXp(item.weekly_xp, item.weekly_xp_week)
              : Number(item.weekly_xp ?? 0),
            weekly_xp_week: item.weekly_xp_week ?? null,
            gems: Number(item.gems ?? 0),
            streak: Number(item.streak ?? 0),
            energy: Number(item.energy ?? 25),
            accuracy: Number(item.accuracy ?? 1.0),
            avatar_id: item.avatar_id ?? 'user',
            theme_id: item.theme_id ?? 'blue',
            best_streak: Number(item.best_streak ?? item.streak ?? 0),
            completed_lessons: [],
            bookmarked_lessons: [],
            completed_daily_challenges: [],
            is_admin: false,
            total_chests_claimed: Number(item.total_chests_claimed ?? 0),
            total_steps_claimed: Number(item.total_steps_claimed ?? 0),
            trophies: Number(item.trophies ?? 45),
            created_at: item.created_at || new Date().toISOString(),
            last_chest_claimed_at: item.last_chest_claimed_at ?? null
          }));
          return mapped;
        }
      }
    } catch (apiErr) {
      console.warn("Server leaderboard fetch error, falling back to direct Supabase:", apiErr);
    }

    if (supabase) {
      try {
        let rawProfiles: any[] = [];
        
        console.log("[Supabase Intent] FETCH on table: 'profiles'", { order: 'gems desc' });
        const { data: simpleData, error: simpleError } = await supabase
          .from('profiles')
          .select('id, email, username, xp, weekly_xp, weekly_xp_week, gems, streak, energy, accuracy, avatar_id, theme_id, best_streak, is_admin, total_chests_claimed, total_steps_claimed, trophies, created_at, last_chest_claimed_at, completed_lessons, bookmarked_lessons')
          .order('gems', { ascending: false });

        if (!simpleError && simpleData && simpleData.length > 0) {
          rawProfiles = simpleData;
        }

        if (rawProfiles.length > 0) {
          const mapped = rawProfiles.map(item => ({
            id: item.id,
            email: item.email,
            username: item.username || (item.email ? item.email.split('@')[0] : 'Explorer'),
            xp: Number(item.xp ?? 0),
            weekly_xp: computeEffectiveWeeklyXp(item.weekly_xp, item.weekly_xp_week),
            weekly_xp_week: item.weekly_xp_week ?? null,
            gems: Number(item.gems ?? 0),
            streak: Number(item.streak ?? 0),
            energy: Number(item.energy ?? 25),
            accuracy: Number(item.accuracy ?? 1.0),
            avatar_id: item.avatar_id ?? 'user',
            theme_id: item.theme_id ?? 'blue',
            best_streak: Number(item.best_streak ?? 0),
            completed_lessons: Array.isArray(item.completed_lessons) ? item.completed_lessons : [],
            bookmarked_lessons: Array.isArray(item.bookmarked_lessons) ? item.bookmarked_lessons : [],
            completed_daily_challenges: [],
            is_admin: !!item.is_admin,
            total_chests_claimed: Number(item.total_chests_claimed ?? 0),
            total_steps_claimed: Number(item.total_steps_claimed ?? 0),
            trophies: Number(item.trophies ?? 45),
            created_at: item.created_at || new Date().toISOString(),
            last_chest_claimed_at: item.last_chest_claimed_at ?? null
          }));
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase getAllUserProfiles exception, using offline lists:', err);
      }
    }

    return getLocalStorageItem<SupabaseUserProfile[]>('ALL_PROFILES', []);
  }, {
    ttlMs: 60 * 1000,
    storageKey: 'ALL_PROFILES',
    timeoutMs: 3500,
    fallback: []
  });
}

// -------------------------------------------------------------
// WEEKLY LEADERBOARD RPC & CACHING (Task P2 & C14)
// -------------------------------------------------------------

export interface WeeklyLeaderboardResponse {
  entries: LeaderboardEntry[];
  resetsAt: string | null;
}

interface WeeklyLeaderboardCacheEntry {
  data: WeeklyLeaderboardResponse;
  timestamp: number;
}

const weeklyLeaderboardCache: { [limit: number]: WeeklyLeaderboardCacheEntry } = {};
const LEADERBOARD_CACHE_TTL = 30000; // 30 seconds

/**
 * Invalidate the in-memory weekly leaderboard cache.
 */
export function invalidateWeeklyLeaderboardCache(): void {
  for (const key of Object.keys(weeklyLeaderboardCache)) {
    delete weeklyLeaderboardCache[Number(key)];
  }
}

/**
 * Fetches the weekly leaderboard via the `get_weekly_leaderboard` RPC.
 * - In-memory cache with 30s TTL (`cacheTime = 30000`)
 * - Returns `{ entries: LeaderboardEntry[], resetsAt: string | null }`
 * - Maps:
 *     r_weekly_xp -> xp and weekly_xp
 *     r_name -> name
 *     r_is_me -> isCurrentUser
 *     r_rank -> rank
 *     r_avatar_id -> avatar
 *     r_streak -> streak
 * - Graceful fallback to `/api/database/leaderboard` on RPC failure
 */
export async function getWeeklyLeaderboard(
  limit: number = 100
): Promise<{ entries: LeaderboardEntry[]; resetsAt: string | null }> {
  const now = Date.now();
  const cached = weeklyLeaderboardCache[limit];

  // Return cached result if valid within 30 seconds TTL
  if (cached && (now - cached.timestamp < LEADERBOARD_CACHE_TTL)) {
    return cached.data;
  }

  const resetsAt = getNextMondayIST().toISOString();

  // 1. Try Supabase RPC get_weekly_leaderboard
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('get_weekly_leaderboard', { p_limit: limit });

      if (error) {
        throw error;
      }

      if (Array.isArray(data)) {
        const entries: LeaderboardEntry[] = data.map((row: any, idx: number) => {
          const weeklyXp = Number(row.r_weekly_xp ?? row.weekly_xp ?? 0);
          return {
            id: row.id || row.r_user_id || row.user_id || `leaderboard_${row.r_rank ?? (idx + 1)}`,
            name: row.r_name || row.username || `Explorer ${idx + 1}`,
            xp: weeklyXp,
            weekly_xp: weeklyXp,
            rank: Number(row.r_rank ?? (idx + 1)),
            isCurrentUser: Boolean(row.r_is_me),
            avatar: row.r_avatar_id ?? row.avatar_id ?? 'user',
            streak: Number(row.r_streak ?? row.streak ?? 0),
            joinedDate: Date.now()
          };
        });

        const result: WeeklyLeaderboardResponse = { entries, resetsAt };
        weeklyLeaderboardCache[limit] = { data: result, timestamp: now };
        return result;
      }
    } catch (rpcErr) {
      console.warn('[Leaderboard] RPC get_weekly_leaderboard failed, falling back to server API endpoint:', rpcErr);
    }
  }

  // 2. Fallback gracefully to /api/database/leaderboard
  try {
    const apiRes = await fetch('/api/database/leaderboard');
    const contentType = apiRes.headers.get('content-type') || '';
    if (apiRes.ok && contentType.includes('application/json')) {
      const json = await apiRes.json();
      if (json && json.success && Array.isArray(json.leaderboard)) {
        const entries: LeaderboardEntry[] = json.leaderboard.slice(0, limit).map((item: any, idx: number) => {
          const weeklyXp = Number(item.weekly_xp ?? item.xp ?? 0);
          return {
            id: item.id || `leaderboard_${idx + 1}`,
            name: item.name || item.username || `Explorer ${idx + 1}`,
            xp: weeklyXp,
            weekly_xp: weeklyXp,
            rank: Number(item.rank ?? (idx + 1)),
            isCurrentUser: Boolean(item.isCurrentUser),
            avatar: item.avatar_id || item.avatar || 'user',
            streak: Number(item.streak ?? 0),
            joinedDate: item.created_at ? new Date(item.created_at).getTime() : Date.now()
          };
        });

        const result: WeeklyLeaderboardResponse = { entries, resetsAt };
        weeklyLeaderboardCache[limit] = { data: result, timestamp: now };
        return result;
      }
    }
  } catch (apiErr) {
    console.warn('[Leaderboard] Fallback API fetch failed:', apiErr);
  }

  // 3. If both RPC and API fail, return stale cache if present
  if (cached) {
    return cached.data;
  }

  return { entries: [], resetsAt };
}

// -------------------------------------------------------------
// DYNAMIC CELEBRATION DATA PERSISTENCE
// -------------------------------------------------------------

/**
 * Fetches dynamic celebrations configurations with SWR caching.
 */
export async function getCelebrationsList(): Promise<CelebrationConfig[]> {
  const defaults: CelebrationConfig[] = [
    { id: 'confetti', name: 'Confetti Shower Mini', category: 'achievement', animation: 'confetti', asset_url: 'default', is_active: true },
    { id: 'fireworks', name: 'Neon Space Fireworks', category: 'special_day', animation: 'fireworks', asset_url: 'default', is_active: true },
    { id: 'star_shower', name: 'Golden Shooting Stars', category: 'streak_milestone', animation: 'star_shower', asset_url: 'default', is_active: true },
    { id: 'glow_burst', name: 'Circular Solar Sunbeam', category: 'badge_unlock', animation: 'glow_burst', asset_url: 'default', is_active: true },
    { id: 'badge_reveal', name: 'Spinning Crest Medals', category: 'major_unlock', animation: 'badge_reveal', asset_url: 'https://images.unsplash.com/photo-1548345680-f5475ea5df84?w=120&auto=format&fit=crop&q=60', is_active: true }
  ];

  return fetchWithCache<CelebrationConfig[]>('CHIKOO_CELEBRATIONS_V2', async () => {
    if (supabase) {
      try {
        console.log("[Supabase Intent] FETCH on table: 'celebrations'", { order: 'name' });
        const { data, error } = await supabase
          .from('celebrations')
          .select('*')
          .order('name');
        if (error) {
          console.error("[Supabase Error] Failed operation on 'celebrations':", error);
          throw error;
        }
        console.log("[Supabase Success] 'celebrations' operation completed.", data);
        if (data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('Database celebrations fetch error:', err);
      }
    }

    return getLocalStorageItem<CelebrationConfig[]>('CELEBRATIONS', defaults);
  }, {
    ttlMs: 15 * 60 * 1000,
    storageKey: 'CELEBRATIONS',
    timeoutMs: 3500,
    fallback: defaults
  });
}

/**
 * Saves a dynamic Celebration Configuration to Supabase.
 */
export async function saveCelebrationConfig(item: CelebrationConfig): Promise<void> {
  if (supabase) {
    try {
      const payload = [{
        id: item.id,
        name: item.name,
        category: item.category,
        animation: item.animation,
        asset_url: item.asset_url,
        is_active: item.is_active
      }];
      console.log("[Supabase Intent] UPDATE on table: 'celebrations'", payload);
      const { error } = await supabase
        .from('celebrations')
        .upsert(payload);
      if (error) {
        console.error("[Supabase Error] Failed operation on 'celebrations':", error);
        throw error;
      }
      console.log("[Supabase Success] 'celebrations' operation completed.", payload);
      return;
    } catch (err) {
      console.warn('Supabase exception on saveCelebration:', err);
    }
  }

  // Fallback
  const list = await getCelebrationsList();
  const idx = list.findIndex(c => c.id === item.id);
  if (idx !== -1) {
    list[idx] = item;
  } else {
    list.push(item);
  }
  setLocalStorageItem('CELEBRATIONS', list);
  invalidateCache('CHIKOO_CELEBRATIONS_V2');
}

/**
 * Deletes dynamic celebration.
 */
export async function deleteCelebrationConfig(id: string): Promise<void> {
  if (supabase) {
    try {
      console.log("[Supabase Intent] DELETE on table: 'celebrations'", { id });
      const { error } = await supabase
        .from('celebrations')
        .delete()
        .eq('id', id);
      if (error) {
        console.error("[Supabase Error] Failed operation on 'celebrations':", error);
        throw error;
      }
      console.log("[Supabase Success] 'celebrations' operation completed. Deleted ID:", id);
      invalidateCache('CHIKOO_CELEBRATIONS_V2');
      return;
    } catch (err) {
      console.warn('Supabase exception delete celebration:', err);
    }
  }

  const list = await getCelebrationsList();
  setLocalStorageItem('CELEBRATIONS', list.filter(c => c.id !== id));
  invalidateCache('CHIKOO_CELEBRATIONS_V2');
}

// -------------------------------------------------------------
// DYNAMIC CURRICULUM PERSISTENCE (LESSONS & MODULES)
// -------------------------------------------------------------

/**
 * Unified Curriculum Loader: Fetches modules and lessons atomically.
 * Optimized with fetchWithCache: SWR cached, deduplicated across components,
 * and resilient to slow networks.
 */
export async function getCustomCurriculum(forceFresh = false): Promise<{ modules: SupabaseModule[]; lessons: SupabaseLesson[] }> {
  if (forceFresh) {
    invalidateCache('CHIKOO_CUSTOM_CURRICULUM_V2', 'CHIKOO_CUSTOM_CURRICULUM_CACHE');
  }

  return fetchWithCache<{ modules: SupabaseModule[]; lessons: SupabaseLesson[] }>('CHIKOO_CUSTOM_CURRICULUM_V2', async () => {
    // 1. Try server curriculum endpoint (which runs with full database credentials)
    try {
      const apiRes = await fetch(forceFresh ? '/api/database/curriculum?fresh=true' : '/api/database/curriculum');
      if (apiRes.ok) {
        const json = await apiRes.json();
        if (json && json.success && Array.isArray(json.modules) && json.modules.length > 0) {
          const mappedLessons: SupabaseLesson[] = Array.isArray(json.lessons) && json.lessons.length > 0
            ? json.lessons.map((item: any) => ({
                id: item.id,
                module_id: item.module_id,
                title: item.title,
                description: item.description,
                difficulty: item.difficulty || 'Easy',
                xp_reward: Number(item.xp_reward ?? 100),
                challenges: Array.isArray(item.challenges) ? item.challenges : [],
                order_index: item.order_index ?? 0
              }))
            : [];

          setLocalStorageItem('CUSTOM_MODULES', json.modules);
          if (mappedLessons.length > 0) {
            setLocalStorageItem('CUSTOM_LESSONS', mappedLessons);
          }

          const effectiveLessons = mappedLessons.length > 0
            ? mappedLessons
            : getLocalStorageItem<SupabaseLesson[]>('CUSTOM_LESSONS', []);

          return {
            modules: json.modules,
            lessons: effectiveLessons
          };
        }
      }
    } catch (apiErr) {
      console.warn("Server curriculum API fetch error, checking bootstrap endpoint:", apiErr);
    }

    // 1b. Try server bootstrap endpoint
    try {
      const bootRes = await fetch('/api/database/bootstrap');
      if (bootRes.ok) {
        const json = await bootRes.json();
        if (json && json.success && Array.isArray(json.modules) && json.modules.length > 0) {
          const mappedLessons: SupabaseLesson[] = Array.isArray(json.lessons) && json.lessons.length > 0
            ? json.lessons.map((item: any) => ({
                id: item.id,
                module_id: item.module_id,
                title: item.title,
                description: item.description,
                difficulty: item.difficulty || 'Easy',
                xp_reward: Number(item.xp_reward ?? 100),
                challenges: Array.isArray(item.challenges) ? item.challenges : [],
                order_index: item.order_index ?? 0
              }))
            : [];

          setLocalStorageItem('CUSTOM_MODULES', json.modules);
          if (mappedLessons.length > 0) {
            setLocalStorageItem('CUSTOM_LESSONS', mappedLessons);
          }

          return {
            modules: json.modules,
            lessons: mappedLessons.length > 0 ? mappedLessons : getLocalStorageItem<SupabaseLesson[]>('CUSTOM_LESSONS', [])
          };
        }
      }
    } catch (bootErr) {
      console.warn("Server bootstrap fetch error, checking direct Supabase/localStorage:", bootErr);
    }

    // 2. Direct Supabase if configured and available
    if (supabase) {
      try {
        let mData: any[] | null = null;
        let lData: any[] | null = null;

        const mRes = await supabase.from('modules').select('*').order('order', { ascending: true });
        mData = mRes.data;
        if (!mData || mData.length === 0) {
          const mRetry = await supabase.from('modules').select('*');
          mData = mRetry.data;
        }

        let lRes = await supabase.from('lessons').select('*').order('order_index', { ascending: true });
        if (lRes.error) {
          lRes = await supabase.from('lessons').select('*');
        }
        lData = lRes.data;

        if (mData && mData.length > 0) {
          setLocalStorageItem('CUSTOM_MODULES', mData);
          const mapped = (lData && lData.length > 0)
            ? lData.map((item: any) => ({
                id: item.id,
                module_id: item.module_id,
                title: item.title,
                description: item.description,
                difficulty: item.difficulty || 'Easy',
                xp_reward: Number(item.xp_reward ?? 100),
                challenges: Array.isArray(item.challenges) ? item.challenges : [],
                order_index: item.order_index ?? 0
              }))
            : getLocalStorageItem<SupabaseLesson[]>('CUSTOM_LESSONS', []);

          if (mapped.length > 0) {
            setLocalStorageItem('CUSTOM_LESSONS', mapped);
          }

          return {
            modules: mData,
            lessons: mapped
          };
        }
      } catch (dbErr) {
        console.warn("Direct Supabase curriculum fetch error:", dbErr);
      }
    }

    // 3. Fallback to localStorage (Real previously synced DB-backed modules)
    const cachedModules = getLocalStorageItem<SupabaseModule[]>('CUSTOM_MODULES', []);
    const cachedLessons = getLocalStorageItem<SupabaseLesson[]>('CUSTOM_LESSONS', []);

    if (cachedModules.length > 0) {
      return {
        modules: cachedModules,
        lessons: cachedLessons
      };
    }

    return {
      modules: [],
      lessons: []
    };
  }, {
    ttlMs: 15 * 60 * 1000,
    storageKey: 'CHIKOO_CUSTOM_CURRICULUM_CACHE',
    timeoutMs: 12000,
    forceFresh: forceFresh,
    fallback: {
      modules: [],
      lessons: []
    }
  });
}

/**
 * Fetches dynamic custom modules.
 */
export async function getCustomModules(): Promise<SupabaseModule[]> {
  const curriculum = await getCustomCurriculum();
  return curriculum.modules;
}

/**
 * Securely resolves headers containing the active Supabase JWT Bearer token
 * for administrative and authenticated backend API requests.
 */
export async function getAdminAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (supabase) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.access_token) {
        headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
      }
    } catch (_) {}
  }
  return headers;
}

/**
 * Saves or updates custom modules.
 */
export async function saveCustomModule(item: SupabaseModule): Promise<SupabaseModule> {
  let cleanDesc = item.description || '';
  if (cleanDesc.includes('|metadata:')) {
    cleanDesc = cleanDesc.split('|metadata:')[0];
  }
  if (item.metadata) {
    cleanDesc = `${cleanDesc}|metadata:${JSON.stringify(item.metadata)}`;
  }

  const payloadWithMetadata = {
    id: item.id,
    title: item.title,
    description: cleanDesc,
    icon: item.icon || 'Sparkles',
    order: item.order ?? 0,
    is_practice: !!item.is_practice,
    world_id: item.world_id || null,
    metadata: item.metadata || null
  };

  const payloadWithoutMetadata = {
    id: item.id,
    title: item.title,
    description: cleanDesc,
    icon: item.icon || 'Sparkles',
    order: item.order ?? 0,
    is_practice: !!item.is_practice,
    world_id: item.world_id || null
  };

  let savedRow: any = null;

  // 1. Try server backend endpoint first (with service credentials)
  try {
    const headers = await getAdminAuthHeaders();
    const apiRes = await fetch('/api/database/modules/save', {
      method: 'POST',
      headers,
      body: JSON.stringify(payloadWithMetadata)
    });
    if (apiRes.ok) {
      const json = await apiRes.json();
      if (json && json.success && json.module) {
        savedRow = json.module;
        console.log("[Database API Success] Module saved via backend API:", savedRow.id);
      }
    }
  } catch (apiErr) {
    console.warn("Backend module save API warning, trying direct Supabase client:", apiErr);
  }

  // 2. Direct Supabase client if not already saved via backend endpoint
  if (!savedRow && supabase) {
    try {
      console.log("[Supabase Intent] UPDATE on table: 'modules'", [payloadWithMetadata]);
      const { data, error } = await supabase
        .from('modules')
        .upsert([payloadWithMetadata])
        .select()
        .single();
      if (error) {
        if (error.message?.includes('column "metadata" of relation "modules" does not exist') || error.code === 'PGRST111') {
          console.log("[Supabase Fallback] 'metadata' column doesn't exist, retrying without it...");
          const { data: retryData, error: retryError } = await supabase
            .from('modules')
            .upsert([payloadWithoutMetadata])
            .select()
            .single();
          if (retryError) throw retryError;
          savedRow = retryData;
        } else {
          throw error;
        }
      } else {
        savedRow = data;
      }
      console.log("[Supabase Success] 'modules' operation completed.", savedRow || payloadWithMetadata);
    } catch (err) {
      console.error('Supabase exception save module:', err);
      // Don't throw if we have local storage fallback
    }
  }

  const finalSavedModule: SupabaseModule = {
    id: item.id,
    title: item.title,
    description: cleanDesc,
    icon: item.icon || 'Sparkles',
    order: item.order ?? 0,
    is_practice: !!item.is_practice,
    world_id: item.world_id || null,
    metadata: item.metadata || null,
    ...(savedRow || {})
  };

  const list = getLocalStorageItem<SupabaseModule[]>('CUSTOM_MODULES', []);
  const idx = list.findIndex(m => m.id === item.id);
  if (idx !== -1) {
    list[idx] = finalSavedModule;
  } else {
    list.push(finalSavedModule);
  }
  setLocalStorageItem('CUSTOM_MODULES', list);
  invalidateCache('CHIKOO_CUSTOM_CURRICULUM_V2', 'CHIKOO_CUSTOM_CURRICULUM_CACHE');
  fetch('/api/database/invalidate-cache', { method: 'POST' }).catch(() => {});
  return finalSavedModule;
}

/**
 * Batched update for modules.
 */
export async function batchUpdateModules(modules: SupabaseModule[]): Promise<void> {
  const payload = modules.map((m, idx) => ({
    id: m.id,
    title: m.title,
    description: m.description || '',
    icon: m.icon || 'Sparkles',
    order: m.order ?? m.sort_order ?? idx,
    sort_order: m.sort_order ?? m.order ?? idx,
    is_practice: !!m.is_practice,
    world_id: m.world_id || null,
    metadata: m.metadata || null
  }));

  // 1. Try server backend batch save endpoint first
  try {
    let headers: any = { 'Content-Type': 'application/json' };
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    }
    const res = await fetch('/api/database/modules/batch-save', {
      method: 'POST',
      headers,
      body: JSON.stringify({ modules: payload })
    });
    if (res.ok) {
      console.log("[Database API Success] Modules batch saved via server API:", payload.length);
    }
  } catch (apiErr) {
    console.warn("[Database API Warning] Failed calling backend batch save for modules:", apiErr);
  }

  // 2. Direct Supabase if configured
  if (supabase) {
    try {
      console.log("[Supabase Intent] BATCH UPSERT on table: 'modules'", payload);
      const { error } = await supabase
        .from('modules')
        .upsert(payload);
      if (error) console.error("[Supabase Error] batch update modules:", error);
      else console.log("[Supabase Success] 'modules' batch operation completed.");
    } catch (err) {
      console.error('Supabase exception batch update modules:', err);
    }
  }

  // 3. Invalidate caches and broadcast
  invalidateCache('CHIKOO_CUSTOM_CURRICULUM_V2', 'CHIKOO_CUSTOM_CURRICULUM_CACHE');
  fetch('/api/database/invalidate-cache', { method: 'POST' }).catch(() => {});

  // 4. Update local storage cache
  const list = getLocalStorageItem<SupabaseModule[]>('CUSTOM_MODULES', []);
  const newList = list.map(m => {
    const updated = payload.find(u => u.id === m.id);
    return updated ? { ...m, ...updated } : m;
  });
  setLocalStorageItem('CUSTOM_MODULES', newList);
}

/**
 * Deletes modules with complete cascade cleanup.
 */
export async function deleteCustomModule(id: string): Promise<void> {
  // 1. Try server endpoint first (runs with database service credentials and cascades)
  try {
    const apiRes = await fetch(`/api/database/modules/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    if (apiRes.ok) {
      console.log(`[Database API Success] Module ${id} deleted via backend service.`);
    }
  } catch (apiErr) {
    console.warn(`[Database API Warning] Failed calling backend delete for module ${id}:`, apiErr);
  }

  // 2. Direct Supabase if configured and available
  if (supabase) {
    try {
      console.log("[Supabase Intent] DELETE cascade on module:", { id });

      // First delete all child lessons for this module to satisfy foreign key constraints
      try {
        const { error: lesErr } = await supabase
          .from('lessons')
          .delete()
          .eq('module_id', id);
        if (lesErr) {
          console.warn("[Supabase Cascade Warning] lessons deletion:", lesErr);
        }
      } catch (_) {}

      // Delete module learning path if exists
      try {
        await supabase
          .from('module_learning_path')
          .delete()
          .eq('module_id', id);
      } catch (_) {}

      // Delete the module
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', id);
      if (error) {
        console.error("[Supabase Error] Failed operation on 'modules':", error);
        throw error;
      }
      console.log("[Supabase Success] 'modules' operation completed. Deleted ID:", id);
    } catch (err) {
      console.error('Supabase exception delete module:', err);
      // continue to clean local caches even if db delete threw
    }
  }

  // 3. Clean up all local storage caches
  const currentMods = getLocalStorageItem<SupabaseModule[]>('CUSTOM_MODULES', []);
  setLocalStorageItem('CUSTOM_MODULES', currentMods.filter(m => m.id !== id));

  const currentLessons = getLocalStorageItem<SupabaseLesson[]>('CUSTOM_LESSONS', []);
  setLocalStorageItem('CUSTOM_LESSONS', currentLessons.filter(l => l.module_id !== id));

  // Also clean local curriculum storage keys
  try {
    const rawAi = getLocalStorageItem<any[]>('CHIKOO_AI_CURRICULUM', []);
    if (rawAi.length > 0) {
      setLocalStorageItem('CHIKOO_AI_CURRICULUM', rawAi.filter((m: any) => m.id !== id));
    }
    const rawPrac = getLocalStorageItem<any[]>('CHIKOO_PRACTICE_CURRICULUM', []);
    if (rawPrac.length > 0) {
      setLocalStorageItem('CHIKOO_PRACTICE_CURRICULUM', rawPrac.filter((m: any) => m.id !== id));
    }
  } catch (_) {}

  // 4. Invalidate all curriculum caches
  invalidateCache('CHIKOO_CUSTOM_CURRICULUM_V2');
  invalidateCache('CHIKOO_CUSTOM_CURRICULUM_CACHE');
  invalidateCache(`CHIKOO_MODULE_PATH_${id}`);
}

/**
 * Fetches active worlds.
 */
export async function getWorlds(): Promise<World[]> {
  return fetchWithCache<World[]>('CHIKOO_WORLDS_V1', async () => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('worlds')
          .select('*')
          .order('world_number', { ascending: true });
        if (!error && data && data.length > 0) {
          const normalizedData = data.map(w => {
            let id = w.id;
            if (id === 'world_1' || w.world_number === 1) id = WORLD_1_UUID;
            else if (id === 'world_2' || w.world_number === 2) id = WORLD_2_UUID;
            else if (id === 'world_3' || w.world_number === 3) id = WORLD_3_UUID;
            return { ...w, id };
          });
          const hasW2 = normalizedData.some(w => w.world_number === 2 || w.id === WORLD_2_UUID);
          const finalWorlds = hasW2 ? normalizedData : [...normalizedData, {
            id: WORLD_2_UUID,
            world_number: 2,
            title: 'Intermediate AI & STEM',
            description: 'Take on intermediate decision trees, advanced ML pipelines, and custom AI tools.',
            status: 'active'
          }];
          setLocalStorageItem('CUSTOM_WORLDS', finalWorlds);
          return finalWorlds;
        }
      } catch (err) {
        console.warn('Error fetching worlds from Supabase:', err);
      }
    }
    const cached = getLocalStorageItem<World[]>('CUSTOM_WORLDS', []);
    if (cached && cached.length > 0) {
      const normalizedCached = cached.map(w => {
        let id = w.id;
        if (id === 'world_1' || w.world_number === 1) id = WORLD_1_UUID;
        else if (id === 'world_2' || w.world_number === 2) id = WORLD_2_UUID;
        else if (id === 'world_3' || w.world_number === 3) id = WORLD_3_UUID;
        return { ...w, id };
      });
      const hasW2 = normalizedCached.some(w => w.world_number === 2 || w.id === WORLD_2_UUID);
      if (hasW2) return normalizedCached;
      return [...normalizedCached, {
        id: WORLD_2_UUID,
        world_number: 2,
        title: 'Intermediate AI & STEM',
        description: 'Take on intermediate decision trees, advanced ML pipelines, and custom AI tools.',
        status: 'active'
      }];
    }
    
    // Default World 1 & 2 fallback
    return [
      {
        id: WORLD_1_UUID,
        world_number: 1,
        title: 'AI Foundations',
        description: 'Master core AI logic, models, and generative concepts.',
        status: 'active'
      },
      {
        id: WORLD_2_UUID,
        world_number: 2,
        title: 'Intermediate AI & STEM',
        description: 'Take on intermediate decision trees, advanced ML pipelines, and custom AI tools.',
        status: 'active'
      },
      {
        id: WORLD_3_UUID,
        world_number: 3,
        title: 'Build with AI',
        description: 'Move from understanding AI to using AI tools, building useful things, testing them, and creating an AI-powered product.',
        status: 'active'
      }
    ];
  }, {
    ttlMs: 10 * 60 * 1000,
    storageKey: 'CHIKOO_WORLDS_CACHE',
    fallback: [
      {
        id: WORLD_1_UUID,
        world_number: 1,
        title: 'AI Foundations',
        description: 'Master core AI logic, models, and generative concepts.',
        status: 'active'
      },
      {
        id: WORLD_2_UUID,
        world_number: 2,
        title: 'Intermediate AI & STEM',
        description: 'Take on intermediate decision trees, advanced ML pipelines, and custom AI tools.',
        status: 'active'
      },
      {
        id: WORLD_3_UUID,
        world_number: 3,
        title: 'Build with AI',
        description: 'Move from understanding AI to using AI tools, building useful things, testing them, and creating an AI-powered product.',
        status: 'active'
      }
    ]
  });
}

/**
 * Fetches user world access & progress for user.
 * Uses cached SWR pattern to prevent redundant SELECT queries on route changes.
 */
export async function getUserWorldProgress(userId?: string, forceFresh = false): Promise<UserWorldProgress[]> {
  let targetUserId = userId;
  if (!targetUserId && supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      targetUserId = session?.user?.id;
      if (!targetUserId) {
        const { data: authData } = await supabase.auth.getUser();
        targetUserId = authData?.user?.id;
      }
    } catch (_) {}
  }

  const cacheKey = `CHIKOO_WORLD_PROG_${targetUserId || 'anon'}`;
  return fetchWithCache<UserWorldProgress[]>(cacheKey, async () => {
    if (supabase && targetUserId && isValidUuid(targetUserId)) {
      try {
        const { data, error } = await supabase
          .from('user_world_progress')
          .select('*')
          .eq('user_id', targetUserId);
        if (!error && data && data.length > 0) {
          const normalized = data.map(p => {
            let wid = p.world_id;
            if (wid === 'world_1' || wid === '1') wid = WORLD_1_UUID;
            else if (wid === 'world_2' || wid === '2') wid = WORLD_2_UUID;
            else if (wid === 'world_3' || wid === '3') wid = WORLD_3_UUID;
            return { ...p, world_id: wid };
          });
          return normalized;
        }
      } catch (err) {
        console.warn('Error fetching user_world_progress from Supabase:', err);
      }
    }

    // World 1 should appear unlocked for existing users according to default rules
    return [
      {
        user_id: targetUserId || 'default_user',
        world_id: WORLD_1_UUID,
        unlocked: true
      }
    ];
  }, {
    ttlMs: 5 * 60 * 1000,
    storageKey: cacheKey,
    forceFresh,
    fallback: [
      {
        user_id: targetUserId || 'default_user',
        world_id: WORLD_1_UUID,
        unlocked: true
      }
    ]
  });
}

/**
 * Saves/Upserts user world progress (unlock status) in Supabase and updates local storage cache.
 */
export async function saveUserWorldProgress(
  userId: string,
  worldId: string,
  unlocked: boolean
): Promise<UserWorldProgress> {
  const cacheKey = `CHIKOO_WORLD_PROG_${userId || 'anon'}`;
  
  // Extremely robust mapping of legacy world_id values to their proper UUIDs
  let cleanWorldId = String(worldId || '').trim();
  if ((cleanWorldId.startsWith('"') && cleanWorldId.endsWith('"')) ||
      (cleanWorldId.startsWith("'") && cleanWorldId.endsWith("'"))) {
    cleanWorldId = cleanWorldId.substring(1, cleanWorldId.length - 1).trim();
  }
  const cleanLower = cleanWorldId.toLowerCase();

  let targetWorldId = WORLD_1_UUID; // default fallback if invalid
  if (cleanLower === 'world_1' || cleanLower === '1' || cleanLower === WORLD_1_UUID.toLowerCase()) {
    targetWorldId = WORLD_1_UUID;
  } else if (cleanLower === 'world_2' || cleanLower === '2' || cleanLower === WORLD_2_UUID.toLowerCase()) {
    targetWorldId = WORLD_2_UUID;
  } else if (cleanLower === 'world_3' || cleanLower === '3' || cleanLower === WORLD_3_UUID.toLowerCase()) {
    targetWorldId = WORLD_3_UUID;
  } else if (isValidUuid(cleanWorldId)) {
    targetWorldId = cleanWorldId;
  }

  // REQUIRED TEMPORARY LOGS TO AUDIT THE PAYLOAD FOR THE USER
  const payload = {
    user_id: userId,
    world_id: targetWorldId,
    unlocked,
    updated_at: new Date().toISOString()
  };
  console.log("WORLD PROGRESS PAYLOAD", payload);
  console.log("WORLD ID", payload.world_id);
  console.log("WORLD ID TYPE", typeof payload.world_id);

  if (supabase && userId && userId !== 'default_user' && userId !== 'anon' && isValidUuid(userId)) {
    try {
      console.log("[Supabase Intent] UPSERT on table: 'user_world_progress'", {
        user_id: userId,
        world_id: targetWorldId,
        unlocked
      });
      const { data, error } = await supabase
        .from('user_world_progress')
        .upsert({
          user_id: userId,
          world_id: targetWorldId,
          unlocked,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,world_id'
        })
        .select()
        .single();

      if (!error && data) {
        invalidateCache(cacheKey);
        // Also update local cache
        const currentProgressList = getLocalStorageItem<UserWorldProgress[]>(cacheKey, []);
        const normalizedList = currentProgressList.map(p => {
          let wid = p.world_id;
          if (wid === 'world_1' || wid === '1') wid = WORLD_1_UUID;
          else if (wid === 'world_2' || wid === '2') wid = WORLD_2_UUID;
          else if (wid === 'world_3' || wid === '3') wid = WORLD_3_UUID;
          return { ...p, world_id: wid };
        });
        const idx = normalizedList.findIndex(p => p.world_id === targetWorldId);
        if (idx !== -1) {
          normalizedList[idx] = {
            ...data,
            world_id: targetWorldId
          };
        } else {
          normalizedList.push({
            ...data,
            world_id: targetWorldId
          });
        }
        setLocalStorageItem(cacheKey, normalizedList);
        return {
          ...data,
          world_id: targetWorldId
        } as UserWorldProgress;
      } else if (error) {
        console.error("❌ Error saving user world progress to Supabase:", error.message);
      }
    } catch (e) {
      console.error("❌ Exception saving user world progress:", e);
    }
  }

  // Fallback/Local progress update
  const defaultProgress: UserWorldProgress = {
    user_id: userId || 'default_user',
    world_id: targetWorldId,
    unlocked,
    updated_at: new Date().toISOString()
  };
  
  const currentProgressList = getLocalStorageItem<UserWorldProgress[]>(cacheKey, [
    { user_id: userId || 'default_user', world_id: WORLD_1_UUID, unlocked: true }
  ]);
  const normalizedList = currentProgressList.map(p => {
    let wid = p.world_id;
    if (wid === 'world_1' || wid === '1') wid = WORLD_1_UUID;
    else if (wid === 'world_2' || wid === '2') wid = WORLD_2_UUID;
    else if (wid === 'world_3' || wid === '3') wid = WORLD_3_UUID;
    return { ...p, world_id: wid };
  });
  const idx = normalizedList.findIndex(p => p.world_id === targetWorldId);
  if (idx !== -1) {
    normalizedList[idx] = defaultProgress;
  } else {
    normalizedList.push(defaultProgress);
  }
  setLocalStorageItem(cacheKey, normalizedList);
  invalidateCache(cacheKey);
  return defaultProgress;
}

/**
 * Saves or updates a world.
 */
export async function saveWorld(world: Omit<World, 'id'> & { id?: string }): Promise<World> {
  const worldPayload = {
    id: world.id,
    world_number: Number(world.world_number),
    title: world.title,
    description: world.description || '',
    status: world.status || 'active'
  };

  // 1. Try server backend endpoint first (with service credentials)
  try {
    let headers: any = { 'Content-Type': 'application/json' };
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    }
    const apiRes = await fetch('/api/database/worlds/save', {
      method: 'POST',
      headers,
      body: JSON.stringify(worldPayload)
    });
    if (apiRes.ok) {
      const json = await apiRes.json();
      if (json && json.success && json.world) {
        console.log("[Database API Success] World saved via backend API:", json.world.id);
        invalidateCache('CHIKOO_WORLDS_V1');
        return json.world as World;
      }
    }
  } catch (apiErr) {
    console.warn("Backend world save API warning, trying direct Supabase client:", apiErr);
  }

  if (supabase) {
    try {
      if (world.id) {
        // UPDATE existing world with specified ID
        const { data, error } = await supabase
          .from('worlds')
          .update({
            world_number: Number(world.world_number),
            title: world.title,
            description: world.description || '',
            status: world.status || 'active'
          })
          .eq('id', world.id)
          .select()
          .single();

        if (error) throw error;
        invalidateCache('CHIKOO_WORLDS_V1');
        return data as World;
      } else {
        // INSERT new world without sending id (lets Postgres gen_random_uuid() handle ID)
        const payload = {
          world_number: Number(world.world_number),
          title: world.title,
          description: world.description || '',
          status: world.status || 'active'
        };
        const { data, error } = await supabase
          .from('worlds')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        invalidateCache('CHIKOO_WORLDS_V1');
        return data as World;
      }
    } catch (err) {
      console.error('Failed to save world in Supabase:', err);
    }
  }

  // Offline or local fallback
  const cached = await getWorlds();
  const finalWorld: World = {
    id: world.id || `world_${Date.now()}`,
    world_number: Number(world.world_number),
    title: world.title,
    description: world.description || '',
    status: world.status || 'active'
  };
  const idx = cached.findIndex(w => w.id === finalWorld.id);
  if (idx !== -1) {
    cached[idx] = finalWorld;
  } else {
    cached.push(finalWorld);
  }
  setLocalStorageItem('CUSTOM_WORLDS', cached);
  invalidateCache('CHIKOO_WORLDS_V1');
  return finalWorld;
}

/**
 * Deletes a world.
 */
export async function deleteWorld(id: string): Promise<void> {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('worlds')
        .delete()
        .eq('id', id);
      if (error) throw error;
      invalidateCache('CHIKOO_WORLDS_V1');
      return;
    } catch (err) {
      console.error('Failed to delete world from Supabase:', err);
      throw err;
    }
  }
  const cached = await getWorlds();
  setLocalStorageItem('CUSTOM_WORLDS', cached.filter(w => w.id !== id));
  invalidateCache('CHIKOO_WORLDS_V1');
}

/**
 * Fetches dynamic custom lessons.
 */
export async function getCustomLessons(): Promise<SupabaseLesson[]> {
  const curriculum = await getCustomCurriculum();
  return curriculum.lessons;
}

/**
 * Saves dynamic custom lesson to Supabase (Source of Truth), updates caches, and returns latest row.
 */
export async function saveCustomLesson(item: SupabaseLesson): Promise<SupabaseLesson> {
  const payload: any = {
    id: item.id,
    module_id: item.module_id,
    title: item.title || 'Untitled Lesson',
    description: item.description || '',
    difficulty: item.difficulty || 'Easy',
    xp_reward: item.xp_reward ?? 100,
    challenges: Array.isArray(item.challenges) ? item.challenges : []
  };

  if (typeof item.order_index === 'number') {
    payload.order_index = item.order_index;
  }

  let savedRow: any = null;

  // 1. Try server backend endpoint first (with service credentials)
  try {
    let headers: any = { 'Content-Type': 'application/json' };
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    }
    const apiRes = await fetch('/api/database/lessons/save', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (apiRes.ok) {
      const json = await apiRes.json();
      if (json && json.success && json.lesson) {
        savedRow = json.lesson;
        console.log("[Database API Success] Lesson saved via backend API:", savedRow.id);
      }
    }
  } catch (apiErr) {
    console.warn("Backend lesson save API warning, trying direct Supabase client:", apiErr);
  }

  // 2. Direct Supabase client if not already saved via backend endpoint
  if (!savedRow && supabase) {
    try {
      console.log("[Supabase Intent] UPDATE on table: 'lessons'", [payload]);
      // Fetch existing lesson to preserve content and video_url
      const { data: existingLesson } = await supabase
        .from('lessons')
        .select('content, video_url')
        .eq('id', payload.id)
        .maybeSingle();

      const upsertPayload = {
        ...payload,
        content: existingLesson?.content || null,
        video_url: existingLesson?.video_url || null
      };

      const { data, error } = await supabase
        .from('lessons')
        .upsert([upsertPayload])
        .select()
        .single();

      if (error) {
        console.error("[Supabase Error] Failed operation on 'lessons':", error);
        throw error;
      }
      console.log("[Supabase Success] 'lessons' operation completed.", data || upsertPayload);
      savedRow = data;
    } catch (err) {
      console.error('Supabase exception save lesson:', err);
      throw err;
    }
  }

  const finalSavedLesson: SupabaseLesson = {
    id: item.id,
    module_id: item.module_id,
    title: item.title,
    description: item.description || '',
    difficulty: item.difficulty || 'Easy',
    xp_reward: item.xp_reward ?? 100,
    challenges: item.challenges || [],
    order_index: item.order_index ?? 0,
    ...(savedRow || {})
  };

  // 3. Update localStorage CUSTOM_LESSONS with authoritative returned row
  const list = getLocalStorageItem<SupabaseLesson[]>('CUSTOM_LESSONS', []);
  const idx = list.findIndex(l => l.id === item.id);
  if (idx !== -1) {
    list[idx] = finalSavedLesson;
  } else {
    list.push(finalSavedLesson);
  }
  setLocalStorageItem('CUSTOM_LESSONS', list);

  // 4. Invalidate all curriculum caches and server memory cache
  invalidateCache('CHIKOO_CUSTOM_CURRICULUM_V2', 'CHIKOO_CUSTOM_CURRICULUM_CACHE');
  fetch('/api/database/invalidate-cache', { method: 'POST' }).catch(() => {});

  return finalSavedLesson;
}

/**
 * Deletes custom lesson.
 */
export async function deleteCustomLesson(id: string): Promise<void> {
  // 1. Try server endpoint first
  try {
    let headers: any = { 'Content-Type': 'application/json' };
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    }
    const apiRes = await fetch(`/api/database/lessons/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers
    });
    if (apiRes.ok) {
      console.log(`[Database API Success] Lesson ${id} deleted via backend service.`);
    }
  } catch (apiErr) {
    console.warn(`[Database API Warning] Failed calling backend delete for lesson ${id}:`, apiErr);
  }

  // 2. Direct Supabase if configured and available
  if (supabase) {
    try {
      console.log("[Supabase Intent] DELETE on table: 'lessons'", { id });
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);
      if (error) {
        console.error("[Supabase Error] Failed operation on 'lessons':", error);
      } else {
        console.log("[Supabase Success] 'lessons' operation completed. Deleted ID:", id);
      }
    } catch (err) {
      console.error('Supabase exception delete lesson:', err);
    }
  }

  // 3. Clean up local storage caches
  const list = getLocalStorageItem<SupabaseLesson[]>('CUSTOM_LESSONS', []);
  setLocalStorageItem('CUSTOM_LESSONS', list.filter(l => l.id !== id));

  // Invalidate client caches
  invalidateCache('CHIKOO_CUSTOM_CURRICULUM_V2');
  invalidateCache('CHIKOO_CUSTOM_CURRICULUM_CACHE');
}

/**
 * Fetches dynamic learning path nodes for a given module/unit with SWR caching.
 */
export async function getModuleLearningPath(moduleId: string): Promise<ModuleLearningPathNode[]> {
  return fetchWithCache<ModuleLearningPathNode[]>(`CHIKOO_MODULE_PATH_${moduleId}`, async () => {
    if (supabase) {
      try {
        console.log("[Supabase Intent] FETCH on table: 'module_learning_path'", { moduleId });
        const { data, error } = await supabase
          .from('module_learning_path')
          .select('*')
          .eq('module_id', moduleId)
          .order('sort_order', { ascending: true });

        if (error) {
          console.error("[Supabase Error] Failed operation on 'module_learning_path':", error);
          throw error;
        }
        console.log("[Supabase Success] 'module_learning_path' operation completed.", data);
        if (data) {
          return data.map(item => ({
            id: item.id,
            module_id: item.module_id,
            node_type: item.node_type as 'lesson' | 'challenge' | 'treasure',
            node_id: item.node_id,
            lane: item.lane || 'center',
            sort_order: item.sort_order ?? 0
          }));
        }
      } catch (err) {
        console.warn('Database module_learning_path fetch error:', err);
      }
    }
    return getLocalStorageItem<ModuleLearningPathNode[]>(`MODULE_LEARNING_PATH_${moduleId}`, []);
  }, {
    ttlMs: 15 * 60 * 1000,
    storageKey: `MODULE_LEARNING_PATH_${moduleId}`,
    timeoutMs: 3500,
    fallback: []
  });
}

/**
 * Saves/Replaces dynamic learning path nodes for a given module/unit.
 */
export async function saveModuleLearningPath(moduleId: string, nodes: ModuleLearningPathNode[]): Promise<void> {
  if (supabase) {
    try {
      console.log("[Supabase Intent] DELETE existing on table: 'module_learning_path' for module:", moduleId);
      // Delete old nodes to make replacement clean
      await supabase
        .from('module_learning_path')
        .delete()
        .eq('module_id', moduleId);

      if (nodes.length > 0) {
        const payload = nodes.map((node, index) => ({
          module_id: moduleId,
          node_type: node.node_type,
          node_id: node.node_id,
          lane: node.lane || 'center',
          sort_order: index
        }));

        console.log("[Supabase Intent] INSERT on table: 'module_learning_path'", payload);
        const { error } = await supabase
          .from('module_learning_path')
          .insert(payload);

        if (error) {
          console.error("[Supabase Error] Failed operation on 'module_learning_path':", error);
          throw error;
        }
        console.log("[Supabase Success] 'module_learning_path' insert completed.", payload);
      }
      invalidateCache(`CHIKOO_MODULE_PATH_${moduleId}`);
      return;
    } catch (err) {
      console.error('Supabase exception save module learning path:', err);
      throw err;
    }
  }

  // Offline fallback only when Supabase is not configured
  const processedNodes = nodes.map((n, idx) => ({ ...n, sort_order: idx }));
  setLocalStorageItem(`MODULE_LEARNING_PATH_${moduleId}`, processedNodes);
  invalidateCache(`CHIKOO_MODULE_PATH_${moduleId}`);
}

/**
 * Deletes user profile.
 */
export async function deleteUserProfile(email: string): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  if (supabase) {
    try {
      console.log("[Supabase Intent] DELETE on table: 'profiles'", { email: cleanEmail });
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('email', cleanEmail);
      if (error) {
        console.error("[Supabase Error] Failed operation on 'profiles':", error);
        throw error;
      }
      console.log("[Supabase Success] 'profiles' operation completed. Deleted email:", cleanEmail);
    } catch (err) {
      console.warn('Supabase exception delete profile:', err);
    }
  }
  localStorage.removeItem(`CHIKOO_SUPABASE_DB_USER_PROFILE_${cleanEmail}`);
  localStorage.removeItem(`CHIKOO_SUPABASE_DB_INTEL_METRICS_${cleanEmail}`);
}

/**
 * Interface representing a student's intelligence metrics in the Live DB.
 */
export interface SupabaseIntelligenceMetrics {
  id?: string;
  user_id?: string;
  accuracy_rate: number;
  retention_score: number;
  risk_score: number;
  favorite_feature: string;
  traits: string[];
  total_sessions: number;
  last_active_at: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetches user intelligence metrics from Live DB or falls back to simulated metrics.
 */
export async function getStudentIntelligenceMetrics(email: string): Promise<SupabaseIntelligenceMetrics> {
  const cleanEmail = email.toLowerCase().trim();
  const profile = await getProfile(cleanEmail);
  const defaultMetrics: SupabaseIntelligenceMetrics = {
    accuracy_rate: profile.accuracy,
    retention_score: 85,
    risk_score: 15,
    favorite_feature: 'None',
    traits: ['Daytime Learner'],
    total_sessions: Math.max(1, profile.streak),
    last_active_at: new Date().toISOString()
  };

  if (supabase && profile.id) {
    try {
      console.log("[Supabase Intent] FETCH on table: 'user_intelligence_metrics'", { user_id: profile.id });
      const { data, error } = await supabase
        .from('user_intelligence_metrics')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (error) {
        console.error("[Supabase Error] Failed operation on 'user_intelligence_metrics':", error);
        throw error;
      }
      console.log("[Supabase Success] 'user_intelligence_metrics' operation completed.", data);

      if (data) {
        return {
          id: data.id,
          user_id: data.user_id,
          accuracy_rate: Number(data.accuracy_rate ?? defaultMetrics.accuracy_rate),
          retention_score: Number(data.retention_score ?? defaultMetrics.retention_score),
          risk_score: Number(data.risk_score ?? defaultMetrics.risk_score),
          favorite_feature: data.favorite_feature ?? defaultMetrics.favorite_feature,
          traits: Array.isArray(data.traits) ? data.traits : defaultMetrics.traits,
          total_sessions: Number(data.total_sessions ?? defaultMetrics.total_sessions),
          last_active_at: data.last_active_at || defaultMetrics.last_active_at,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
      } else {
        // Initialize metrics row
        const payload = {
          user_id: profile.id,
          accuracy_rate: defaultMetrics.accuracy_rate,
          retention_score: defaultMetrics.retention_score,
          risk_score: defaultMetrics.risk_score,
          favorite_feature: defaultMetrics.favorite_feature,
          traits: defaultMetrics.traits,
          total_sessions: defaultMetrics.total_sessions,
          last_active_at: defaultMetrics.last_active_at
        };
        console.log("[Supabase Intent] INSERT on table: 'user_intelligence_metrics'", payload);
        const { error: insError } = await supabase
          .from('user_intelligence_metrics')
          .insert([payload]);

        if (insError) {
          console.error("[Supabase Error] Failed initializing metrics row in DB:", insError);
        }
      }
    } catch (err) {
      console.warn('Database metrics fetch error, fallback active:', err);
    }
  }

  return getLocalStorageItem<SupabaseIntelligenceMetrics>(`INTEL_METRICS_${cleanEmail}`, defaultMetrics);
}

/**
 * Saves or updates user intelligence metrics in Supabase or local simulation.
 */
export async function updateStudentIntelligenceMetrics(email: string, updates: Partial<SupabaseIntelligenceMetrics>): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  const profile = await getProfile(cleanEmail);
  const current = await getStudentIntelligenceMetrics(cleanEmail);
  const merged = { ...current, ...updates };

  if (supabase && profile.id) {
    try {
      const payload = {
        user_id: profile.id,
        accuracy_rate: merged.accuracy_rate,
        retention_score: merged.retention_score,
        risk_score: merged.risk_score,
        favorite_feature: merged.favorite_feature,
        traits: merged.traits,
        total_sessions: merged.total_sessions,
        last_active_at: merged.last_active_at
      };
      console.log("[Supabase Intent] UPSERT on table: 'user_intelligence_metrics'", payload);
      const { error } = await supabase
        .from('user_intelligence_metrics')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) {
        console.error("[Supabase Error] Failed operation on 'user_intelligence_metrics':", error);
        throw error;
      }
      console.log("[Supabase Success] 'user_intelligence_metrics' update completed.", payload);
    } catch (err) {
      console.warn('Database metrics update error, fallback local storage:', err);
    }
  }

  setLocalStorageItem(`INTEL_METRICS_${cleanEmail}`, merged);
}
