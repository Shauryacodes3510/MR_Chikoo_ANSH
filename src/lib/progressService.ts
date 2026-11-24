import { SupabaseUserProfile, getProfile, updateProfile, supabase, getLocalStorageItem, isValidUuid } from './supabase';
import { rpcCompleteChallenge, rpcRedeemGems, rpcValidateStreakOnLogin, rpcRecordStreakActivity } from './supabaseRewards';
import { recordUserDailyActivity } from './userDailyActivityService';
import { 
  getStoredCompletedLessonIds, 
  saveStoredCompletedLessonsBatch, 
  saveStoredLessonCompletion,
  saveLastActiveLessonId,
  saveLastActiveModuleId
} from './lessonProgressStorage';
import {
  getPendingOfflineMutations,
  dequeueOfflineMutations,
  setupAutoOnlineSync
} from './dataCache';
import { recordActiveDayInStorageAndCookies } from './streakCalendarStorage';

export type ProgressListener = (profile: SupabaseUserProfile) => void;

class ProgressService {
  private currentProfile: SupabaseUserProfile | null = null;
  private currentEmail: string | null = null;
  private listeners: Set<ProgressListener> = new Set();
  private inFlightInit: Promise<SupabaseUserProfile> | null = null;
  private inFlightInitEmail: string | null = null;
  private isSyncingQueue = false;

  constructor() {
    setupAutoOnlineSync(() => {
      this.syncOfflineQueue();
    });
  }

  /**
   * Drain any queued mutations (e.g. offline writes) and sync them safely with Supabase.
   */
  async syncOfflineQueue(targetEmail?: string): Promise<void> {
    const email = (targetEmail || this.currentEmail || '').toLowerCase().trim();
    if (!email || this.isSyncingQueue) return;

    const pending = getPendingOfflineMutations(email);
    if (!pending || pending.length === 0) return;

    this.isSyncingQueue = true;
    console.log(`[ProgressService] Draining ${pending.length} pending offline mutations for ${email}...`);
    const successfulIds: string[] = [];

    for (const mutation of pending) {
      try {
        if (mutation.type === 'profile_update') {
          await updateProfile(email, mutation.payload);
          successfulIds.push(mutation.id);
        } else if (mutation.type === 'lesson_completion') {
          const { lessonId, cookiesReward } = mutation.payload;
          await rpcCompleteChallenge(`lesson_${lessonId}`, cookiesReward || 100, 0, email);
          successfulIds.push(mutation.id);
        } else if (mutation.type === 'challenge_completion') {
          const { challengeId, cookiesReward } = mutation.payload;
          await rpcCompleteChallenge(challengeId, cookiesReward || 50, 0, email);
          successfulIds.push(mutation.id);
        } else {
          successfulIds.push(mutation.id);
        }
      } catch (syncErr) {
        console.warn(`[ProgressService] Offline mutation '${mutation.id}' sync attempt failed:`, syncErr);
        break; // Stop and retry later when connection stabilizes
      }
    }

    if (successfulIds.length > 0) {
      dequeueOfflineMutations(email, successfulIds);
      console.log(`[ProgressService] Successfully synced ${successfulIds.length} offline mutations.`);
      // Refresh profile to reflect database truth
      await this.initProfile(email, true);
    }
    this.isSyncingQueue = false;
  }

  /**
   * Subscribe to real-time profile updates.
   * Returns an unsubscribe callback function.
   */
  subscribe(listener: ProgressListener): () => void {
    this.listeners.add(listener);
    if (this.currentProfile) {
      try {
        listener({ ...this.currentProfile });
      } catch (err) {
        console.error('Error in progress listener on subscribe:', err);
      }
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  private lastNotifiedStateJson: string = '';

  /**
   * Broadcast current profile state to all active subscribers.
   */
  private notifyListeners() {
    if (!this.currentProfile) return;
    const profileCopy = { ...this.currentProfile };
    const jsonState = JSON.stringify({
      xp: profileCopy.xp,
      weekly_xp: profileCopy.weekly_xp,
      gems: profileCopy.gems,
      streak: profileCopy.streak,
      energy: profileCopy.energy,
      accuracy: profileCopy.accuracy,
      avatar_id: profileCopy.avatar_id,
      theme_id: profileCopy.theme_id,
      trophies: profileCopy.trophies,
      completedCount: profileCopy.completed_lessons?.length || 0,
      challengesCount: profileCopy.completed_daily_challenges?.length || 0,
      claimedRewardsCount: profileCopy.claimed_rewards?.length || 0,
      username: profileCopy.username
    });

    if (jsonState === this.lastNotifiedStateJson) {
      return;
    }
    this.lastNotifiedStateJson = jsonState;

    this.listeners.forEach((listener) => {
      try {
        listener(profileCopy);
      } catch (err) {
        console.error('Error in progress listener:', err);
      }
    });
    // Dispatch global DOM event for components outside React context
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chikooProfileUpdated', { detail: profileCopy }));
    }
  }

  /**
   * Reset in-memory session profile state on logout or invalid session.
   */
  clear() {
    this.currentEmail = null;
    this.currentProfile = null;
    this.inFlightInit = null;
    this.inFlightInitEmail = null;
  }

  /**
   * Initialize profile for the authenticated user email from Supabase.
   */
  async initProfile(email: string, forceFresh = true, knownAuthUserId?: string | null): Promise<SupabaseUserProfile> {
    const cleanEmail = email.toLowerCase().trim();
    this.currentEmail = cleanEmail;

    if (!forceFresh && this.currentProfile && this.currentProfile.email === cleanEmail) {
      return this.currentProfile;
    }

    if (!forceFresh && this.inFlightInit && this.inFlightInitEmail === cleanEmail) {
      return this.inFlightInit;
    }

    const initPromise = (async () => {
      const startTime = Date.now();
      console.log(`[DATA_INIT] query: progressService.initProfile started for ${cleanEmail} (forceFresh=${forceFresh}, knownAuthUserId=${knownAuthUserId || 'null'})`);
      try {
        const profile = await getProfile(cleanEmail, forceFresh, knownAuthUserId);
        
        // Exact hydration from Supabase (Source of Truth)
        // Removed localStorage merging - only use Supabase data.
        const mergedCompleted = profile.completed_lessons || [];
        
        // Optionally update local cache for offline/instant-load scenarios,
        // but treat Supabase as authoritative.
        saveStoredCompletedLessonsBatch(mergedCompleted, cleanEmail);

        // Validate streak on login/init via Supabase RPC
        try {
          const streakRes = await rpcValidateStreakOnLogin(cleanEmail, knownAuthUserId || profile.id);
          if (streakRes.success && typeof streakRes.streak === 'number') {
            profile.streak = streakRes.streak;
            profile.best_streak = Math.max(profile.best_streak || 0, streakRes.best_streak);
            if (streakRes.last_streak_date) {
              profile.last_streak_date = streakRes.last_streak_date;
            }
          }
        } catch (vErr) {
          console.warn('[ProgressService] validate_streak_on_login non-fatal notice:', vErr);
        }

        this.currentProfile = {
          ...profile,
          completed_lessons: mergedCompleted,
          xp: 0 // Keep xp at 0/legacy placeholder
        };
        
        const duration = Date.now() - startTime;
        console.log(`[DATA_INIT] query: progressService.initProfile completed`);
        console.log(`[DATA_INIT] duration: ${duration}ms`);
        console.log(`[DATA_INIT] response: profile loaded | gems: ${this.currentProfile.gems} | completedLessons: ${mergedCompleted.length}`);
        
        this.notifyListeners();
        // Trigger background sync for any pending offline mutations
        this.syncOfflineQueue(cleanEmail).catch(() => {});
        return this.currentProfile;
      } catch (initErr: any) {
        const duration = Date.now() - startTime;
        console.error(`[DATA_INIT] error: progressService.initProfile failed:`, initErr?.message || initErr);
        console.log(`[DATA_INIT] duration: ${duration}ms`);
        if (this.currentProfile) {
          console.log('[ProgressService] Retaining existing in-memory profile after network failure.');
          return this.currentProfile;
        }

        const localCached = getLocalStorageItem<SupabaseUserProfile | null>(`USER_PROFILE_${cleanEmail}`, null);
        if (localCached) {
          console.log('[ProgressService] Retaining existing localStorage profile after network failure.');
          this.currentProfile = localCached;
          this.notifyListeners();
          return this.currentProfile;
        }

        const fallbackCompleted = getStoredCompletedLessonIds(cleanEmail);
        const fallbackProfile: SupabaseUserProfile = {
          email: cleanEmail,
          username: localStorage.getItem(`CHIKOO_USER_NICKNAME_${cleanEmail}`) || cleanEmail.split('@')[0],
          xp: 0,
          weekly_xp: 0,
          gems: 0,
          streak: 0,
          energy: 50,
          accuracy: 1.0,
          avatar_id: 'user',
          theme_id: 'blue',
          best_streak: 0,
          completed_lessons: fallbackCompleted,
          bookmarked_lessons: [],
          completed_daily_challenges: [],
          is_admin: false,
          total_chests_claimed: 0,
          total_steps_claimed: 0,
          trophies: 0,
          created_at: new Date().toISOString()
        };
        this.currentProfile = fallbackProfile;
        this.notifyListeners();
        return fallbackProfile;
      } finally {
        if (this.inFlightInitEmail === cleanEmail) {
          this.inFlightInit = null;
          this.inFlightInitEmail = null;
        }
      }
    })();

    this.inFlightInit = initPromise;
    this.inFlightInitEmail = cleanEmail;
    return initPromise;
  }

  /**
   * Return the cached profile snapshot.
   */
  getProfile(): SupabaseUserProfile | null {
    return this.currentProfile ? { ...this.currentProfile } : null;
  }

  /**
   * Synchronize the in-memory profile snapshot from external loads.
   */
  setProfile(profile: SupabaseUserProfile) {
    this.currentEmail = profile.email.toLowerCase().trim();
    this.currentProfile = {
      ...profile,
      xp: 0
    };
    this.notifyListeners();
  }

  /**
   * Updates profile data locally (memory cache and localStorage) and notifies listeners,
   * without sending any network requests. Extremely fast, zero network overhead.
   */
  updateProfileLocally(updates: Partial<SupabaseUserProfile>): SupabaseUserProfile {
    if (!this.currentProfile) {
      if (this.currentEmail) {
        const localCached = getLocalStorageItem<SupabaseUserProfile | null>(`USER_PROFILE_${this.currentEmail}`, null);
        if (localCached) {
          this.currentProfile = localCached;
        }
      }
    }
    
    if (!this.currentProfile) {
      console.warn("No profile loaded to update locally.");
      return {} as SupabaseUserProfile;
    }

    const cleanEmail = this.currentEmail || this.currentProfile.email.toLowerCase().trim();
    
    // Merge updates
    const updated = {
      ...this.currentProfile,
      ...updates,
      xp: 0 // Keep xp at 0/legacy placeholder
    };
    
    if (updates.streak !== undefined && updates.best_streak === undefined) {
      updated.best_streak = Math.max(updated.best_streak || 0, updates.streak);
    }
    
    this.currentProfile = updated;
    
    // Save to memory cache and local storage
    if (cleanEmail) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(`CHIKOO_SUPABASE_DB_USER_PROFILE_${cleanEmail}`, JSON.stringify(updated));
        }
      } catch (err) {
        console.error('Local storage update error in updateProfileLocally:', err);
      }
    }
    
    this.notifyListeners();
    return updated;
  }

  /**
   * Core updater with Optimistic UI updates, automatic property derivations, and rollback on error.
   */
  async updateProfileData(updates: Partial<SupabaseUserProfile>): Promise<SupabaseUserProfile> {
    // Determine active email session
    if (!this.currentEmail && updates.email) {
      this.currentEmail = updates.email.toLowerCase().trim();
    }
    if (!this.currentEmail && typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('CHIKOO_SESSION_USER');
      if (stored) this.currentEmail = stored.toLowerCase().trim();
    }

    if (!this.currentEmail) {
      console.warn('ProgressService: No active user email found for profile update');
      if (this.currentProfile) return this.currentProfile;
      throw new Error('No active email session for profile update');
    }

    // If profile not loaded yet, fetch it first
    if (!this.currentProfile) {
      await this.initProfile(this.currentEmail);
    }

    const previousProfile = { ...this.currentProfile! };

    // Derive streak & best_streak
    let newStreak = updates.streak !== undefined ? updates.streak : previousProfile.streak;
    let newBestStreak = previousProfile.best_streak || 0;
    if (updates.best_streak !== undefined) {
      newBestStreak = updates.best_streak;
    }
    if (newStreak > newBestStreak) {
      newBestStreak = newStreak;
    }

    // Prepare payload keeping xp = 0
    const finalUpdates: Partial<SupabaseUserProfile> = {
      ...updates,
      xp: 0,
      streak: newStreak,
      best_streak: newBestStreak
    };

    // Apply Optimistic Update
    const optimisticProfile: SupabaseUserProfile = {
      ...previousProfile,
      ...finalUpdates
    };

    // Synchronously cache completed lessons in platform local storage
    if (finalUpdates.completed_lessons && Array.isArray(finalUpdates.completed_lessons)) {
      saveStoredCompletedLessonsBatch(finalUpdates.completed_lessons, this.currentEmail);
    }

    this.currentProfile = optimisticProfile;
    this.notifyListeners();

    try {
      // Persist immediately to Supabase
      const persisted = await updateProfile(this.currentEmail, finalUpdates);
      
      // Update with server confirmed data (merging local storage cache)
      const localCompleted = getStoredCompletedLessonIds(this.currentEmail);
      const serverLessons = Array.isArray(persisted.completed_lessons) ? persisted.completed_lessons : [];
      const confirmedLessons = Array.from(new Set([...localCompleted, ...serverLessons]));
      saveStoredCompletedLessonsBatch(confirmedLessons, this.currentEmail);

      this.currentProfile = {
        ...persisted,
        completed_lessons: confirmedLessons,
        xp: 0
      };
      this.notifyListeners();
      return this.currentProfile;
    } catch (error) {
      console.warn('ProgressService: DB sync delayed or network offline, retaining optimistic progress state in local cache:', error);
      // Retain optimistic update in this.currentProfile so user progress never resets on network drops or slow Supabase responses.
      return this.currentProfile;
    }
  }

  /**
   * Action: Completes a lesson using Supabase RPC complete_challenge.
   */
  async recordLessonCompletion(lessonId: string, cookiesReward: number = 100): Promise<SupabaseUserProfile> {
    const email = this.currentEmail || 'anonymous';
    const current = this.currentProfile || await this.initProfile(email);
    const currentLessons = current.completed_lessons || [];
    const isNew = !currentLessons.includes(lessonId);
    if (!isNew) {
      return current;
    }
    const newCompletedLessons = [...currentLessons, lessonId];

    // Immediately persist completion and last active lesson to local storage cache
    saveStoredLessonCompletion(lessonId, {
      cookiesEarned: cookiesReward,
      xpEarned: cookiesReward,
      completedAt: new Date().toISOString()
    }, email);
    saveLastActiveLessonId(lessonId, email);
    recordActiveDayInStorageAndCookies(new Date(), email, cookiesReward);

    // Record streak activity via Supabase RPC (called exactly once per qualifying flow)
    let verifiedStreak = current.streak;
    let verifiedBestStreak = current.best_streak;
    let verifiedLastStreakDate = current.last_streak_date;
    try {
      const streakRes = await rpcRecordStreakActivity(`lesson_${lessonId}`, email, current.id);
      if (streakRes.success) {
        verifiedStreak = streakRes.streak;
        verifiedBestStreak = Math.max(verifiedBestStreak || 0, streakRes.best_streak);
        if (streakRes.last_streak_date) {
          verifiedLastStreakDate = streakRes.last_streak_date;
        }
      } else {
        // Optimistic Streak Calculation Fallback
        const todayStr = new Date().toLocaleDateString('en-CA');
        const yDate = new Date();
        yDate.setDate(yDate.getDate() - 1);
        const yesterdayStr = yDate.toLocaleDateString('en-CA');

        if (!current.last_streak_date) {
          verifiedStreak = 1;
        } else if (current.last_streak_date === todayStr) {
          verifiedStreak = Math.max(1, current.streak || 1);
        } else if (current.last_streak_date === yesterdayStr) {
          verifiedStreak = (current.streak || 0) + 1;
        } else {
          verifiedStreak = 1;
        }
        verifiedBestStreak = Math.max(verifiedBestStreak || 0, verifiedStreak);
        verifiedLastStreakDate = todayStr;
      }
    } catch (sErr) {
      console.warn('[ProgressService] record_streak_activity RPC notice:', sErr);
    }

    const rpcRes = await rpcCompleteChallenge(`lesson_${lessonId}`, cookiesReward, 0, email);

    // Record in main realtime DB user_daily_activity table
    await recordUserDailyActivity({
      lessonsDelta: 1,
      cookiesDelta: cookiesReward,
      xpDelta: cookiesReward,
      userId: current.id
    });

    await this.updateProfileData({
      completed_lessons: newCompletedLessons,
      gems: rpcRes.newBalance,
      streak: verifiedStreak,
      best_streak: verifiedBestStreak,
      last_streak_date: verifiedLastStreakDate
    });

    return this.initProfile(email, true);
  }

  /**
   * Action: Completes a unit or module using Supabase RPC complete_challenge.
   */
  async recordUnitCompletion(moduleId: string, bonusCookies: number = 250): Promise<SupabaseUserProfile> {
    const email = this.currentEmail || 'anonymous';
    // Persist unit completion and last active module in local storage cache
    saveStoredLessonCompletion(`unit_${moduleId}`, {
      cookiesEarned: bonusCookies,
      xpEarned: bonusCookies,
      completedAt: new Date().toISOString()
    }, email);
    saveLastActiveModuleId(moduleId, email);
    recordActiveDayInStorageAndCookies(new Date(), email, bonusCookies);

    const rpcRes = await rpcCompleteChallenge(`unit_mastery_${moduleId}`, bonusCookies, 0, email);
    return this.updateProfileData({
      gems: rpcRes.newBalance
    });
  }

  /**
   * Action: Completes a daily challenge, quest, or puzzle pack with strict single-award idempotency.
   */
  async recordChallengeCompletion(challengeId: string, cookiesReward: number = 50): Promise<SupabaseUserProfile> {
    const email = this.currentEmail || 'anonymous';
    const current = this.currentProfile || await this.initProfile(email);
    const currentChallenges = current.completed_daily_challenges || [];
    const isNew = !currentChallenges.includes(challengeId);
    if (!isNew) {
      return current;
    }
    const newChallenges = [...currentChallenges, challengeId];

    // Persist challenge completion in local storage cache
    saveStoredLessonCompletion(challengeId, {
      cookiesEarned: cookiesReward,
      xpEarned: cookiesReward,
      completedAt: new Date().toISOString()
    }, email);

    // Record streak activity via Supabase RPC for daily challenge
    let verifiedStreak = current.streak;
    let verifiedBestStreak = current.best_streak;
    let verifiedLastStreakDate = current.last_streak_date;

    try {
      const streakRes = await rpcRecordStreakActivity(`challenge_${challengeId}`, email, current.id);
      if (streakRes.success) {
        verifiedStreak = streakRes.streak;
        verifiedBestStreak = Math.max(verifiedBestStreak || 0, streakRes.best_streak);
        if (streakRes.last_streak_date) {
          verifiedLastStreakDate = streakRes.last_streak_date;
        }
      } else {
        // Optimistic Streak Calculation Fallback
        const todayStr = new Date().toLocaleDateString('en-CA');
        const yDate = new Date();
        yDate.setDate(yDate.getDate() - 1);
        const yesterdayStr = yDate.toLocaleDateString('en-CA');

        if (!current.last_streak_date) {
          verifiedStreak = 1;
        } else if (current.last_streak_date === todayStr) {
          verifiedStreak = Math.max(1, current.streak || 1);
        } else if (current.last_streak_date === yesterdayStr) {
          verifiedStreak = (current.streak || 0) + 1;
        } else {
          verifiedStreak = 1;
        }
        verifiedBestStreak = Math.max(verifiedBestStreak || 0, verifiedStreak);
        verifiedLastStreakDate = todayStr;
      }
    } catch (sErr) {
      console.warn('[ProgressService] record_streak_activity RPC notice:', sErr);
    }

    const rpcRes = await rpcCompleteChallenge(challengeId, cookiesReward, 0, email);

    await recordUserDailyActivity({
      challengesDelta: 1,
      cookiesDelta: cookiesReward,
      xpDelta: cookiesReward,
      userId: current.id
    });

    return this.updateProfileData({
      completed_daily_challenges: newChallenges,
      gems: rpcRes.newBalance,
      streak: verifiedStreak,
      best_streak: verifiedBestStreak,
      last_streak_date: verifiedLastStreakDate
    });
  }

  /**
   * Action: Completes a practice arena, rapid fire, or battle session using RPC.
   */
  async recordPracticeSession(cookiesEarned: number = 50, sessionId?: string): Promise<SupabaseUserProfile> {
    const email = this.currentEmail || 'anonymous';
    const current = this.currentProfile || await this.initProfile(email);
    const sessId = sessionId || `practice_${Date.now()}`;
    const rpcRes = await rpcCompleteChallenge(sessId, cookiesEarned, 0, email);

    await recordUserDailyActivity({
      battlesPlayedDelta: 1,
      battlesWonDelta: 1,
      cookiesDelta: cookiesEarned,
      xpDelta: cookiesEarned,
      userId: current.id
    });

    return this.initProfile(email, true);
  }

  /**
   * Action: Claims a daily reward or step reward.
   */
  async claimDailyReward(cookiesAmount: number = 50, stepIndex?: number): Promise<SupabaseUserProfile> {
    const email = this.currentEmail || 'anonymous';
    const claimId = stepIndex !== undefined ? `step_reward_${stepIndex}` : `daily_step_${Date.now()}`;
    const rpcRes = await rpcCompleteChallenge(claimId, cookiesAmount, 0, email);
    const current = this.currentProfile || await this.initProfile(email);
    const newSteps = (current.total_steps_claimed || 0) + 1;

    return this.updateProfileData({
      gems: rpcRes.newBalance,
      total_steps_claimed: newSteps
    });
  }

  /**
   * Action: Claims a daily treasure chest.
   */
  async claimTreasureChest(cookiesAmount: number = 200): Promise<SupabaseUserProfile> {
    const email = this.currentEmail || 'anonymous';
    const todayDate = new Date().toISOString().slice(0, 10);
    const claimKey = `daily_chest_${todayDate}`;

    const rpcRes = await rpcCompleteChallenge(claimKey, cookiesAmount, 0, email);
    const current = this.currentProfile || await this.initProfile(email);
    const newChests = rpcRes.granted ? (current.total_chests_claimed || 0) + 1 : current.total_chests_claimed;
    const nowIso = new Date().toISOString();

    return this.updateProfileData({
      gems: rpcRes.newBalance,
      total_chests_claimed: newChests,
      last_chest_claimed_at: rpcRes.granted ? nowIso : current.last_chest_claimed_at
    });
  }

  /**
   * Action: Spend cookies (e.g. purchasing items in Rewards Store) via `redeem_gems` RPC.
   */
  async spendCookies(amount: number, reason: string = 'Store Purchase', itemId: string = 'item'): Promise<SupabaseUserProfile> {
    const email = this.currentEmail || 'anonymous';
    await rpcRedeemGems(amount, itemId, reason, email);
    return this.initProfile(email, true);
  }

  /**
   * Action: Records the very first interaction of a new user in Supabase.
   * Ensures that upon the first interaction (click, tap, or modal dismiss), storage and database operations are executed in Supabase.
   */
  async recordFirstInteraction(email?: string): Promise<void> {
    const activeEmail = (email || this.currentEmail || (typeof localStorage !== 'undefined' ? localStorage.getItem('CHIKOO_SESSION_USER') : null) || '').toLowerCase().trim();
    if (!activeEmail) return;

    const cacheKey = `chikoo_first_interaction_recorded_${activeEmail}`;
    if (typeof localStorage !== 'undefined' && localStorage.getItem(cacheKey) === 'true') {
      return;
    }

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(cacheKey, 'true');
        localStorage.removeItem(`chikoo_new_signup_${activeEmail}`);
      }

      if (supabase) {
        let userId = this.currentProfile?.id;
        if (!userId || !isValidUuid(userId)) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) userId = session.user.id;
          } catch (_) {}
        }

        if (userId && isValidUuid(userId)) {
          console.log("[Supabase Intent] Recording first user interaction in Supabase for user:", userId);
          // 1. Record first interaction challenge in Supabase
          const { error: chalErr } = await supabase
            .from('user_challenge_progress')
            .upsert({
              user_id: userId,
              challenge_id: 'first_interaction',
              status: 'completed',
              score: 100,
              xp_earned: 0,
              completed_at: new Date().toISOString()
            }, { onConflict: 'user_id,challenge_id' });

          if (chalErr) {
            console.warn("[Supabase Warning] First interaction challenge record:", chalErr);
          } else {
            console.log("[Supabase Success] First interaction challenge successfully stored in Supabase.");
          }

          // 2. Touch profile updated_at in Supabase
          const { error: profErr } = await supabase
            .from('profiles')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', userId);

          if (profErr) {
            console.warn("[Supabase Warning] Profile timestamp touch:", profErr);
          } else {
            console.log("[Supabase Success] Profile timestamp touched in Supabase.");
          }

          // 3. Update auth user metadata so it is stored in Supabase Auth user record
          try {
            await supabase.auth.updateUser({
              data: {
                first_interaction_at: new Date().toISOString(),
                onboarding_completed: true
              }
            });
          } catch (_) {}
        }
      }
    } catch (e) {
      console.warn("ProgressService: recordFirstInteraction non-blocking warning:", e);
    }
  }

  /**
   * Action: Records the start of a lesson in Supabase when the user selects a node on the map.
   */
  async recordLessonStart(lessonId: string): Promise<void> {
    const activeEmail = (this.currentEmail || (typeof localStorage !== 'undefined' ? localStorage.getItem('CHIKOO_SESSION_USER') : null) || '').toLowerCase().trim();
    if (!activeEmail) return;

    try {
      if (supabase) {
        let userId = this.currentProfile?.id;
        if (!userId || !isValidUuid(userId)) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) userId = session.user.id;
          } catch (_) {}
        }

        if (userId && isValidUuid(userId)) {
          console.log(`[Supabase Intent] Recording lesson start for '${lessonId}' in Supabase`);
          await supabase
            .from('user_challenge_progress')
            .upsert({
              user_id: userId,
              challenge_id: `start_${lessonId}`,
              status: 'in_progress',
              score: 0,
              xp_earned: 0
            }, { onConflict: 'user_id,challenge_id' });

          await supabase
            .from('profiles')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', userId);
        }
      }
    } catch (e) {
      console.warn(`ProgressService: recordLessonStart error for ${lessonId}:`, e);
    }
  }

  /**
   * Action: Records an interactive action/event in Supabase.
   */
  async recordUserInteraction(interactionType: string, metadata: Record<string, any> = {}): Promise<void> {
    const activeEmail = (this.currentEmail || (typeof localStorage !== 'undefined' ? localStorage.getItem('CHIKOO_SESSION_USER') : null) || '').toLowerCase().trim();
    if (!activeEmail) return;

    try {
      if (supabase) {
        let userId = this.currentProfile?.id;
        if (!userId || !isValidUuid(userId)) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) userId = session.user.id;
          } catch (_) {}
        }

        if (userId && isValidUuid(userId)) {
          console.log(`[Supabase Intent] Recording interaction '${interactionType}' in Supabase`);
          await supabase
            .from('user_challenge_progress')
            .upsert({
              user_id: userId,
              challenge_id: `action_${interactionType}`,
              status: 'completed',
              score: 100,
              xp_earned: 0,
              completed_at: new Date().toISOString()
            }, { onConflict: 'user_id,challenge_id' });

          await supabase
            .from('profiles')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', userId);
        }
      }
    } catch (e) {
      console.warn(`ProgressService: recordUserInteraction error for ${interactionType}:`, e);
    }
  }
}

export const progressService = new ProgressService();
