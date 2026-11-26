import type { UserDailyActivityRecord } from './userDailyActivityService';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export type QuestPeriod = 'daily' | 'weekly';
export type QuestIconKey = 'lesson' | 'lessons' | 'practice' | 'challenge' | 'xp' | 'streak' | 'bonus';

export interface QuestDefinition {
  id: string;
  period: QuestPeriod;
  title: string;
  description: string;
  target: number;
  rewardCookies: number;
  rewardXp: number;
  icon: QuestIconKey;
  color: string;
  /** Computes progress from the activity rows of the current period (today / this IST week). */
  progress: (rows: UserDailyActivityRecord[]) => number;
}

/** 'YYYY-MM-DD' for the current moment in IST (UTC+5:30). */
export function getISTDateString(date: Date = new Date()): string {
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Monday of the current IST week as 'YYYY-MM-DD'. */
export function getISTWeekStart(date: Date = new Date()): string {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  const diffToMonday = (ist.getUTCDay() + 6) % 7;
  return new Date(ist.getTime() - diffToMonday * DAY_MS).toISOString().slice(0, 10);
}

/** Milliseconds until the next IST midnight. */
export function msUntilISTMidnight(now: number = Date.now()): number {
  const ist = now + IST_OFFSET_MS;
  return DAY_MS - (ist % DAY_MS);
}

/** Milliseconds until the next IST Monday 00:00. */
export function msUntilISTWeekEnd(now: number = Date.now()): number {
  const ist = new Date(now + IST_OFFSET_MS);
  const daysLeft = 7 - ((ist.getUTCDay() + 6) % 7); // 1..7 days incl. today
  return msUntilISTMidnight(now) + (daysLeft - 1) * DAY_MS;
}

/** True if the ISO timestamp falls on the current IST calendar day. */
export function isSameISTDay(iso: string | null | undefined, now: Date = new Date()): boolean {
  if (!iso) return false;
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return false;
  return getISTDateString(t) === getISTDateString(now);
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const hms = `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  return d > 0 ? `${d}d ${hms}` : hms;
}

const sum = (rows: UserDailyActivityRecord[], pick: (r: UserDailyActivityRecord) => number) =>
  rows.reduce((acc, r) => acc + (Number(pick(r)) || 0), 0);

const activeDays = (rows: UserDailyActivityRecord[]) =>
  rows.filter(r => (r.lessons_completed || 0) + (r.challenges_completed || 0) + (r.battles_played || 0) > 0).length;

// NOTE: rewardXp below is what the UI shows. The server is authoritative: the XP actually
// granted comes from the quest_ branch of public.weekly_xp_for_claim (see
// supabase/migrations/20261126_quest_xp_and_unverified_cap.sql). Keep both tables in sync.
// XP budget: daily quests = 130 XP (incl. Perfect Day), weekly quests = 260 XP (daily cap 1000, weekly cap 5000).
export const DAILY_QUESTS: QuestDefinition[] = [
  {
    id: 'lesson_1', period: 'daily', title: 'Warm Up', description: 'Complete 1 lesson today',
    target: 1, rewardCookies: 20, rewardXp: 15, icon: 'lesson', color: 'bg-chikoo-blue-500',
    progress: rows => sum(rows, r => r.lessons_completed)
  },
  {
    id: 'lesson_3', period: 'daily', title: 'On a Roll', description: 'Complete 3 lessons today',
    target: 3, rewardCookies: 40, rewardXp: 30, icon: 'lessons', color: 'bg-purple-500',
    progress: rows => sum(rows, r => r.lessons_completed)
  },
  {
    id: 'practice_1', period: 'daily', title: 'Arena Time', description: 'Play 1 Practice Arena session',
    target: 1, rewardCookies: 25, rewardXp: 15, icon: 'practice', color: 'bg-chikoo-red-500',
    progress: rows => sum(rows, r => r.battles_played)
  },
  {
    id: 'xp_50', period: 'daily', title: 'XP Hunter', description: 'Earn 50 XP today',
    target: 50, rewardCookies: 30, rewardXp: 20, icon: 'xp', color: 'bg-amber-500',
    progress: rows => sum(rows, r => r.xp_earned)
  }
];

/** Bonus quest: unlocked once every daily quest above is claimed. Progress is computed in the view. */
export const DAILY_BONUS_QUEST: Omit<QuestDefinition, 'progress'> = {
  id: 'all_done', period: 'daily', title: 'Perfect Day', description: 'Claim all daily quests',
  target: DAILY_QUESTS.length, rewardCookies: 50, rewardXp: 50, icon: 'bonus', color: 'bg-amber-600'
};

export const WEEKLY_QUESTS: QuestDefinition[] = [
  {
    id: 'streak_5', period: 'weekly', title: 'Consistency King', description: 'Learn on 5 different days this week',
    target: 5, rewardCookies: 150, rewardXp: 100, icon: 'streak', color: 'bg-chikoo-red-500',
    progress: rows => activeDays(rows)
  },
  {
    id: 'xp_500', period: 'weekly', title: 'XP Machine', description: 'Earn 500 XP this week',
    target: 500, rewardCookies: 200, rewardXp: 50, icon: 'xp', color: 'bg-amber-500',
    progress: rows => sum(rows, r => r.xp_earned)
  },
  {
    id: 'lessons_10', period: 'weekly', title: 'Lesson Marathon', description: 'Complete 10 lessons this week',
    target: 10, rewardCookies: 120, rewardXp: 60, icon: 'lessons', color: 'bg-chikoo-blue-500',
    progress: rows => sum(rows, r => r.lessons_completed)
  },
  {
    id: 'practice_5', period: 'weekly', title: 'Arena Regular', description: 'Play 5 Practice Arena sessions this week',
    target: 5, rewardCookies: 100, rewardXp: 50, icon: 'practice', color: 'bg-purple-500',
    progress: rows => sum(rows, r => r.battles_played)
  }
];

/** Claim ids are stamped with the period so they are unique per day / per week and reset automatically. */
export function periodicClaimKey(q: { id: string; period: QuestPeriod }, now: Date = new Date()): string {
  return q.period === 'daily'
    ? `daily_${q.id}_${getISTDateString(now)}`
    : `weekly_${q.id}_${getISTWeekStart(now)}`;
}
