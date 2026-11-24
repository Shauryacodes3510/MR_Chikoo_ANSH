import { 
  format, 
  subDays, 
  isSameDay, 
  isToday, 
  parseISO, 
  isValid, 
  startOfDay,
  eachDayOfInterval,
  isAfter
} from 'date-fns';

export interface DayActivityRecord {
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
  source: 'cookie' | 'localStorage' | 'streak_sync' | 'none';
}

const COOKIE_KEY_ACTIVE_DAYS = 'chikoo_active_days';
const COOKIE_KEY_LAST_ACTIVE = 'chikoo_last_active_date';
export const COOKIE_KEY_LAST_STREAK_DATE = 'chikoo_last_streak_date';
const COOKIE_KEY_STREAK = 'chikoo_user_streak';

/**
 * Synchronize verified Supabase streak data to cookies and LocalStorage
 */
export function syncVerifiedStreakData(
  sessionUser: string | undefined,
  streak: number,
  bestStreak: number,
  lastStreakDate?: string | null
): void {
  const cleanEmail = (sessionUser || '').toLowerCase().trim();

  try {
    // 1. Sync cookies
    setCookie(COOKIE_KEY_STREAK, String(streak), 30);
    if (lastStreakDate) {
      setCookie(COOKIE_KEY_LAST_STREAK_DATE, String(lastStreakDate), 30);
      setCookie(COOKIE_KEY_LAST_ACTIVE, String(lastStreakDate), 30);
    }

    // 2. Sync LocalStorage active days record if lastStreakDate is provided
    if (lastStreakDate && typeof localStorage !== 'undefined') {
      let dateKey = lastStreakDate;
      if (lastStreakDate.includes('T')) {
        const parsed = parseISO(lastStreakDate);
        if (isValid(parsed)) dateKey = format(parsed, 'yyyy-MM-dd');
      }

      if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        const storageKey = `CHIKOO_ACTIVE_DAYS_${cleanEmail}`;
        let storedList: Array<{ date: string; lessons: number; cookies: number }> = [];
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) storedList = parsed;
          } catch (_) {}
        }
        const existingEntry = storedList.find(item => item.date === dateKey);
        if (!existingEntry) {
          storedList.push({ date: dateKey, lessons: 1, cookies: 15 });
          localStorage.setItem(storageKey, JSON.stringify(storedList));
          localStorage.setItem('chikoo_active_days', JSON.stringify(storedList));
        }
      }
    }
  } catch (err) {
    console.warn('[StreakCalendar] Error syncing verified streak data:', err);
  }
}

/**
 * Safe cookie getter
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const nameEQ = encodeURIComponent(name) + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
  } catch (err) {
    console.warn('[StreakCalendar] Error reading cookie:', err);
  }
  return null;
}

/**
 * Safe cookie setter with 30-day persistence
 */
export function setCookie(name: string, value: string, days = 30): void {
  if (typeof document === 'undefined') return;
  try {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `; expires=${date.toUTCString()}`;
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax`;
  } catch (err) {
    console.warn('[StreakCalendar] Error writing cookie:', err);
  }
}

/**
 * Retrieve active date strings from both cookies and localStorage
 */
export function getStoredActiveDates(sessionUser?: string): Map<string, { lessons: number; cookies: number; source: 'cookie' | 'localStorage' }> {
  const activeMap = new Map<string, { lessons: number; cookies: number; source: 'cookie' | 'localStorage' }>();
  const cleanEmail = (sessionUser || '').toLowerCase().trim();

  // 1. Read from Cookies
  try {
    const rawCookie = getCookie(COOKIE_KEY_ACTIVE_DAYS);
    if (rawCookie) {
      let parsed: any;
      try {
        parsed = JSON.parse(rawCookie);
      } catch {
        // May be comma-delimited string
        parsed = rawCookie.split(',').map(s => s.trim());
      }
      if (Array.isArray(parsed)) {
        parsed.forEach(item => {
          if (typeof item === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item)) {
            activeMap.set(item, { lessons: 1, cookies: 15, source: 'cookie' });
          } else if (item && typeof item === 'object' && item.date) {
            activeMap.set(item.date, { 
              lessons: item.lessons || 1, 
              cookies: item.cookies || 15, 
              source: 'cookie' 
            });
          }
        });
      }
    }

    const lastActiveCookie = getCookie(COOKIE_KEY_LAST_ACTIVE) || getCookie(COOKIE_KEY_LAST_STREAK_DATE);
    if (lastActiveCookie && /^\d{4}-\d{2}-\d{2}$/.test(lastActiveCookie)) {
      if (!activeMap.has(lastActiveCookie)) {
        activeMap.set(lastActiveCookie, { lessons: 1, cookies: 15, source: 'cookie' });
      }
    }
  } catch (err) {
    console.warn('[StreakCalendar] Error parsing active days from cookies:', err);
  }

  // 2. Read from LocalStorage
  if (typeof localStorage !== 'undefined') {
    try {
      // 2a. Direct active days array in localStorage
      const storageKeys = [
        `CHIKOO_ACTIVE_DAYS_${cleanEmail}`,
        'CHIKOO_ACTIVE_DAYS',
        'chikoo_active_days',
        `chikoo_active_days_${cleanEmail}`
      ];

      for (const key of storageKeys) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              parsed.forEach(item => {
                const dateKey = typeof item === 'string' ? item : item?.date;
                if (dateKey && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
                  const existing = activeMap.get(dateKey);
                  activeMap.set(dateKey, {
                    lessons: Math.max(existing?.lessons || 1, item?.lessons || 1),
                    cookies: Math.max(existing?.cookies || 15, item?.cookies || 15),
                    source: 'localStorage'
                  });
                }
              });
            }
          } catch {
            // ignore
          }
        }
      }

      // 2b. Lesson completion records with ISO timestamps from CHIKOO_LESSON_PROGRESS_V1_*
      const progressKey = `CHIKOO_LESSON_PROGRESS_V1_${cleanEmail}`;
      const rawProgress = localStorage.getItem(progressKey);
      if (rawProgress) {
        try {
          const parsed = JSON.parse(rawProgress);
          if (parsed?.records && typeof parsed.records === 'object') {
            Object.values(parsed.records).forEach((rec: any) => {
              if (rec?.completed && rec.completedAt) {
                const parsedDate = parseISO(rec.completedAt);
                if (isValid(parsedDate)) {
                  const dateKey = format(parsedDate, 'yyyy-MM-dd');
                  const existing = activeMap.get(dateKey);
                  activeMap.set(dateKey, {
                    lessons: (existing?.lessons || 0) + 1,
                    cookies: (existing?.cookies || 0) + (rec.cookiesEarned || 15),
                    source: 'localStorage'
                  });
                }
              }
            });
          }
        } catch {
          // ignore
        }
      }

      // 2c. Assessment quiz results timestamps
      const rawAssessments = localStorage.getItem('chikoo_assessment_results');
      if (rawAssessments) {
        try {
          const parsedAssessments = JSON.parse(rawAssessments);
          if (Array.isArray(parsedAssessments)) {
            parsedAssessments.forEach(item => {
              if (item?.timestamp) {
                const d = new Date(item.timestamp);
                if (isValid(d)) {
                  const dateKey = format(d, 'yyyy-MM-dd');
                  const existing = activeMap.get(dateKey);
                  activeMap.set(dateKey, {
                    lessons: (existing?.lessons || 0) + 1,
                    cookies: (existing?.cookies || 0) + 20,
                    source: 'localStorage'
                  });
                }
              }
            });
          }
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.warn('[StreakCalendar] Error parsing active days from localStorage:', err);
    }
  }

  return activeMap;
}

/**
 * Record an activity date into BOTH cookies and localStorage
 */
export function recordActiveDayInStorageAndCookies(
  date: Date = new Date(),
  sessionUser?: string,
  cookiesEarned: number = 20
): void {
  const dateKey = format(date, 'yyyy-MM-dd');
  const cleanEmail = (sessionUser || '').toLowerCase().trim();

  // 1. Update Cookie
  try {
    let currentCookiesDays: string[] = [];
    const raw = getCookie(COOKIE_KEY_ACTIVE_DAYS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) currentCookiesDays = parsed;
      } catch {
        currentCookiesDays = raw.split(',').map(s => s.trim());
      }
    }
    if (!currentCookiesDays.includes(dateKey)) {
      currentCookiesDays.push(dateKey);
      // Keep last 30 days
      if (currentCookiesDays.length > 30) currentCookiesDays = currentCookiesDays.slice(-30);
      setCookie(COOKIE_KEY_ACTIVE_DAYS, JSON.stringify(currentCookiesDays), 30);
    }
    setCookie(COOKIE_KEY_LAST_ACTIVE, dateKey, 30);
  } catch (e) {
    console.warn('[StreakCalendar] Failed to record active day to cookie:', e);
  }

  // 2. Update LocalStorage
  if (typeof localStorage !== 'undefined') {
    try {
      const storageKey = `CHIKOO_ACTIVE_DAYS_${cleanEmail}`;
      let storedList: Array<{ date: string; lessons: number; cookies: number }> = [];
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) storedList = parsed;
        } catch {
          // ignore
        }
      }
      const existingEntry = storedList.find(item => item.date === dateKey);
      if (existingEntry) {
        existingEntry.lessons += 1;
        existingEntry.cookies += cookiesEarned;
      } else {
        storedList.push({ date: dateKey, lessons: 1, cookies: cookiesEarned });
      }
      localStorage.setItem(storageKey, JSON.stringify(storedList));
      localStorage.setItem('chikoo_active_days', JSON.stringify(storedList));
    } catch (e) {
      console.warn('[StreakCalendar] Failed to record active day to localStorage:', e);
    }
  }
}

/**
 * Computes 7-day circular streak calendar records using date-fns
 * Ending with today (rolling 7-day window)
 */
export function getSevenDayCircularCalendar(
  sessionUser?: string,
  effectiveStreak: number = 0
): DayActivityRecord[] {
  const today = startOfDay(new Date());
  const activeMap = getStoredActiveDates(sessionUser);

  // If user has an active streak, ensure past (effectiveStreak) consecutive days leading up to today
  // are reflected and synchronized in the active days map and persisted
  if (effectiveStreak > 0) {
    for (let i = 0; i < effectiveStreak && i < 7; i++) {
      const streakDate = subDays(today, i);
      const streakKey = format(streakDate, 'yyyy-MM-dd');
      if (!activeMap.has(streakKey)) {
        activeMap.set(streakKey, {
          lessons: 1,
          cookies: 15,
          source: 'cookie'
        });
      }
    }
    // Also save to cookie for next visit
    try {
      setCookie(COOKIE_KEY_STREAK, String(effectiveStreak), 30);
    } catch {
      // ignore
    }
  }

  // Generate 7 days ending today (from subDays(today, 6) to today)
  const startDate = subDays(today, 6);
  const daysInterval = eachDayOfInterval({ start: startDate, end: today });

  const result: DayActivityRecord[] = daysInterval.map((currentDate) => {
    const dateKey = format(currentDate, 'yyyy-MM-dd');
    const isCurrentDay = isToday(currentDate);
    const isFutureDay = isAfter(currentDate, today);
    const storedData = activeMap.get(dateKey);
    const isActive = !!storedData;

    return {
      date: currentDate,
      dateKey,
      dayLabel: format(currentDate, 'EEE'),         // e.g. "Wed"
      dayInitial: format(currentDate, 'EEEEE'),     // e.g. "W"
      dayNumber: format(currentDate, 'd'),          // e.g. "21"
      formattedDate: format(currentDate, 'EEEE, MMM d'), // e.g. "Wednesday, Oct 21"
      isActive,
      isToday: isCurrentDay,
      isFuture: isFutureDay,
      lessonsCompleted: storedData ? storedData.lessons : (isActive ? 1 : 0),
      cookiesEarned: storedData ? storedData.cookies : (isActive ? 15 : 0),
      source: storedData ? storedData.source : (isActive ? 'streak_sync' : 'none')
    };
  });

  return result;
}
