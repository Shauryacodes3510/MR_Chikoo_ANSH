import { supabase, isSupabaseConfigured, isValidUuid } from './supabase';
import { format, subDays, startOfDay, parseISO, isValid, eachDayOfInterval } from 'date-fns';

export interface UserDailyActivityRecord {
  id: string;
  user_id: string;
  activity_date: string; // YYYY-MM-DD
  lessons_completed: number;
  challenges_completed: number;
  battles_played: number;
  battles_won: number;
  quests_completed: number;
  cookies_earned: number;
  xp_earned: number;
  time_spent_seconds: number;
  streak_counted: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DayActivityDisplayRecord {
  date: Date;
  dateKey: string;      // YYYY-MM-DD
  dayLabel: string;     // Mon, Tue, etc.
  dayInitial: string;   // M, T, W, etc.
  dayNumber: string;    // 1..31
  formattedDate: string;// e.g. "Wednesday, Oct 21"
  isActive: boolean;
  isToday: boolean;
  isFuture: boolean;
  lessonsCompleted: number;
  cookiesEarned: number;
  source: 'realtime_db' | 'cookie' | 'localStorage' | 'none';
}

/**
 * Record or increment user daily activity atomically via RPC `record_user_daily_activity`.
 */
export async function recordUserDailyActivity(deltas: {
  lessonsDelta?: number;
  challengesDelta?: number;
  battlesPlayedDelta?: number;
  battlesWonDelta?: number;
  questsDelta?: number;
  cookiesDelta?: number;
  xpDelta?: number;
  timeSpentDelta?: number;
  activityDate?: string; // YYYY-MM-DD
  userId?: string;
}): Promise<UserDailyActivityRecord | null> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('[UserDailyActivity] Supabase not configured for recordUserDailyActivity');
    return null;
  }

  try {
    let targetUserId = deltas.userId;
    if (!targetUserId || !isValidUuid(targetUserId)) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        targetUserId = session.user.id;
      }
    }

    if (!targetUserId || !isValidUuid(targetUserId)) {
      console.warn('[UserDailyActivity] No valid UUID user_id available for record_user_daily_activity RPC');
      return null;
    }

    const payload = {
      p_lessons_delta: deltas.lessonsDelta ?? 0,
      p_challenges_delta: deltas.challengesDelta ?? 0,
      p_battles_played_delta: deltas.battlesPlayedDelta ?? 0,
      p_battles_won_delta: deltas.battlesWonDelta ?? 0,
      p_quests_delta: deltas.questsDelta ?? 0,
      p_cookies_delta: deltas.cookiesDelta ?? 0,
      p_xp_delta: deltas.xpDelta ?? 0,
      p_time_spent_delta: deltas.timeSpentDelta ?? 0,
      p_activity_date: deltas.activityDate || format(new Date(), 'yyyy-MM-dd'),
      p_user_id: targetUserId
    };

    console.log('[UserDailyActivity] Calling record_user_daily_activity RPC', payload);
    const { data, error } = await supabase.rpc('record_user_daily_activity', payload);

    if (error) {
      console.warn('[UserDailyActivity] RPC record_user_daily_activity error:', error.message);
      // Fallback to direct upsert if RPC fails
      return await fallbackUpsertDailyActivity(targetUserId, deltas);
    }

    const record = Array.isArray(data) ? data[0] : data;
    return record as UserDailyActivityRecord;
  } catch (err) {
    console.warn('[UserDailyActivity] recordUserDailyActivity exception:', err);
    return null;
  }
}

/**
 * Fallback direct upsert if RPC is unavailable
 */
async function fallbackUpsertDailyActivity(userId: string, deltas: {
  lessonsDelta?: number;
  challengesDelta?: number;
  cookiesDelta?: number;
  xpDelta?: number;
  activityDate?: string;
}): Promise<UserDailyActivityRecord | null> {
  if (!supabase) return null;
  const activityDate = deltas.activityDate || format(new Date(), 'yyyy-MM-dd');
  
  try {
    // 1. Fetch existing row for today
    const { data: existing } = await supabase
      .from('user_daily_activity')
      .select('*')
      .eq('user_id', userId)
      .eq('activity_date', activityDate)
      .maybeSingle();

    const newLessons = (existing?.lessons_completed || 0) + (deltas.lessonsDelta || 0);
    const newChallenges = (existing?.challenges_completed || 0) + (deltas.challengesDelta || 0);
    const newCookies = (existing?.cookies_earned || 0) + (deltas.cookiesDelta || 0);
    const newXp = (existing?.xp_earned || 0) + (deltas.xpDelta || 0);

    const { data, error } = await supabase
      .from('user_daily_activity')
      .upsert({
        user_id: userId,
        activity_date: activityDate,
        lessons_completed: Math.max(0, newLessons),
        challenges_completed: Math.max(0, newChallenges),
        cookies_earned: Math.max(0, newCookies),
        xp_earned: Math.max(0, newXp),
        streak_counted: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,activity_date' })
      .select()
      .single();

    if (error) {
      console.warn('[UserDailyActivity] Fallback upsert error:', error.message);
      return null;
    }
    return data as UserDailyActivityRecord;
  } catch (e) {
    console.warn('[UserDailyActivity] Fallback upsert exception:', e);
    return null;
  }
}

/**
 * Fetch daily activity records for a user over a date range (default last 30 days) from Supabase.
 */
export async function fetchUserDailyActivityRecords(userId?: string, limitDays = 30): Promise<UserDailyActivityRecord[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    let targetUserId = userId;
    if (!targetUserId || !isValidUuid(targetUserId)) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        targetUserId = session.user.id;
      }
    }

    if (!targetUserId || !isValidUuid(targetUserId)) return [];

    const startDate = format(subDays(new Date(), limitDays), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('user_daily_activity')
      .select('*')
      .eq('user_id', targetUserId)
      .gte('activity_date', startDate)
      .order('activity_date', { ascending: false });

    if (error) {
      console.warn('[UserDailyActivity] Error fetching user daily activity:', error.message);
      return [];
    }

    return (data || []) as UserDailyActivityRecord[];
  } catch (err) {
    console.warn('[UserDailyActivity] fetchUserDailyActivityRecords exception:', err);
    return [];
  }
}

/**
 * Subscribe to Supabase Realtime changes on `user_daily_activity` for cross-device live sync.
 */
export function subscribeToUserDailyActivity(userId: string, onUpdate: (record: UserDailyActivityRecord) => void): (() => void) | null {
  if (!isSupabaseConfigured || !supabase || !isValidUuid(userId)) return null;

  try {
    const channelName = `public:user_daily_activity:${userId}:${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_daily_activity',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('[UserDailyActivity] Realtime activity update received:', payload);
          if (payload.new && typeof payload.new === 'object') {
            onUpdate(payload.new as UserDailyActivityRecord);
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  } catch (err) {
    console.warn('[UserDailyActivity] Failed to subscribe to realtime activity:', err);
    return null;
  }
}

/**
 * Get 7-day circular calendar representation backed by Supabase `user_daily_activity` realtime DB.
 */
export function buildCircularCalendarFromActivityRecords(
  activityRecords: UserDailyActivityRecord[]
): DayActivityDisplayRecord[] {
  const today = startOfDay(new Date());
  const startDate = subDays(today, 6);
  const daysInterval = eachDayOfInterval({ start: startDate, end: today });

  const recordMap = new Map<string, UserDailyActivityRecord>();
  for (const rec of activityRecords) {
    if (rec && rec.activity_date) {
      const dateKey = rec.activity_date.slice(0, 10);
      recordMap.set(dateKey, rec);
    }
  }

  return daysInterval.map((currentDate) => {
    const dateKey = format(currentDate, 'yyyy-MM-dd');
    const isCurrentDay = format(currentDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    const isFutureDay = currentDate > today;
    const rec = recordMap.get(dateKey);

    // Consider active if lessons_completed > 0, challenges_completed > 0, or cookies_earned > 0, or streak_counted is true
    const isActive = !!rec && (rec.lessons_completed > 0 || rec.challenges_completed > 0 || rec.cookies_earned > 0 || rec.streak_counted);

    return {
      date: currentDate,
      dateKey,
      dayLabel: format(currentDate, 'EEE'),
      dayInitial: format(currentDate, 'EEEEE'),
      dayNumber: format(currentDate, 'd'),
      formattedDate: format(currentDate, 'EEEE, MMM d'),
      isActive,
      isToday: isCurrentDay,
      isFuture: isFutureDay,
      lessonsCompleted: rec ? rec.lessons_completed : 0,
      cookiesEarned: rec ? rec.cookies_earned : 0,
      source: rec ? 'realtime_db' : 'none'
    };
  });
}
