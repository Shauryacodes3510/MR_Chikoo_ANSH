import { useState, useEffect } from 'react';
import { SupabaseUserProfile } from '../lib/supabase';
import { progressService } from '../lib/progressService';
import { getStoredCompletedLessonIds } from '../lib/lessonProgressStorage';

export function useProfileProgress() {
  const [profile, setProfile] = useState<SupabaseUserProfile | null>(() => progressService.getProfile());

  useEffect(() => {
    const unsubscribe = progressService.subscribe((updatedProfile) => {
      setProfile(updatedProfile);
    });
    return unsubscribe;
  }, []);

  const cachedLessonIds = getStoredCompletedLessonIds(profile?.email || null);
  const effectiveCompletedLessons = (profile?.completed_lessons && profile.completed_lessons.length > 0)
    ? profile.completed_lessons
    : cachedLessonIds;

  return {
    profile,
    gems: profile?.gems ?? 0, // Cookies
    weeklyXp: profile?.weekly_xp ?? 0,
    streak: profile?.streak ?? 0,
    bestStreak: profile?.best_streak ?? 0,
    completedLessons: effectiveCompletedLessons,
    completedDailyChallenges: profile?.completed_daily_challenges ?? [],
    totalChestsClaimed: profile?.total_chests_claimed ?? 0,
    totalStepsClaimed: profile?.total_steps_claimed ?? 0,
    lastChestClaimedAt: profile?.last_chest_claimed_at ?? null,
    accuracy: profile?.accuracy ?? 1.0,
    energy: profile?.energy ?? 50,
    
    // ProgressService methods
    updateProfileData: (updates: Partial<SupabaseUserProfile>) => progressService.updateProfileData(updates),
    recordLessonCompletion: (lessonId: string, cookiesReward?: number) => progressService.recordLessonCompletion(lessonId, cookiesReward),
    recordUnitCompletion: (moduleId: string, bonusCookies?: number) => progressService.recordUnitCompletion(moduleId, bonusCookies),
    recordChallengeCompletion: (challengeId: string, cookiesReward?: number) => progressService.recordChallengeCompletion(challengeId, cookiesReward),
    recordPracticeSession: (cookiesEarned?: number) => progressService.recordPracticeSession(cookiesEarned),
    claimDailyReward: (cookiesAmount?: number) => progressService.claimDailyReward(cookiesAmount),
    claimTreasureChest: (cookiesAmount?: number) => progressService.claimTreasureChest(cookiesAmount),
    spendCookies: (amount: number) => progressService.spendCookies(amount)
  };
}
