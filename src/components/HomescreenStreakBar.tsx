import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Flame, Calendar, Zap, ChevronRight } from 'lucide-react';
import { soundManager } from '../lib/sounds';
import {
  fetchUserDailyActivityRecords,
  subscribeToUserDailyActivity,
  buildCircularCalendarFromActivityRecords,
  UserDailyActivityRecord,
  DayActivityDisplayRecord
} from '../lib/userDailyActivityService';
import {
  getSevenDayCircularCalendar,
  DayActivityRecord
} from '../lib/streakCalendarStorage';

export interface HomescreenStreakBarProps {
  streak: number;
  username?: string;
  userId?: string;
  visibleModuleIdx?: number;
  onFocusActiveLesson?: () => void;
  className?: string;
}

interface EmberParticle {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
}

/**
 * Multi-layered Animated Fire Flame SVG Component with organic flickering,
 * inner core glow, and rising ember particles.
 */
export const AnimatedFireFlame = memo(function AnimatedFireFlame({
  isActive = true,
  isBursting = false,
  size = 'md'
}: {
  isActive?: boolean;
  isBursting?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dimensions = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-11 h-11' : 'w-8 h-8 sm:w-9 sm:h-9';

  return (
    <div className={`relative flex items-center justify-center select-none ${dimensions}`}>
      {/* Ambient Radial Heat Glow */}
      <motion.div
        animate={
          isActive
            ? {
                scale: isBursting ? [1, 1.9, 1.3] : [1, 1.18, 0.96, 1.12, 1],
                opacity: isBursting ? [0.7, 1, 0.65] : [0.55, 0.8, 0.5, 0.75, 0.55]
              }
            : { scale: 1, opacity: 0.2 }
        }
        transition={{
          duration: isBursting ? 0.65 : 2.2,
          repeat: isBursting ? 0 : Infinity,
          ease: 'easeInOut'
        }}
        className="absolute inset-0 rounded-full bg-gradient-to-t from-orange-600 via-amber-400 to-yellow-300 blur-md pointer-events-none"
      />

      {/* Rising Continuous Micro-Embers when active */}
      {isActive && size !== 'sm' && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={`ambient-ember-${i}`}
              className="absolute left-1/2 bottom-1/2 w-1 h-1 rounded-full bg-yellow-300 shadow-[0_0_4px_#f59e0b]"
              initial={{ x: (i - 1) * 5, y: 2, opacity: 0, scale: 0.4 }}
              animate={{
                y: [-2, -16 - i * 3],
                x: [(i - 1) * 4, (i - 1) * 8 + (i % 2 === 0 ? 3 : -3)],
                opacity: [0, 0.95, 0],
                scale: [0.4, 1, 0.2]
              }}
              transition={{
                duration: 1.5 + i * 0.35,
                repeat: Infinity,
                delay: i * 0.45,
                ease: 'easeOut'
              }}
            />
          ))}
        </div>
      )}

      {/* Multi-layered Animated Fire SVG */}
      <motion.svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 overflow-visible drop-shadow-[0_2px_6px_rgba(249,115,22,0.55)]"
        animate={
          isActive
            ? {
                scaleY: isBursting ? [1, 1.32, 0.92, 1.15, 1] : [1, 1.07, 0.96, 1.05, 1],
                scaleX: isBursting ? [1, 1.22, 0.95, 1.08, 1] : [1, 0.96, 1.04, 0.98, 1],
                rotate: isBursting ? [0, -8, 8, -4, 0] : [0, -2.5, 2, -1.5, 0]
              }
            : { scale: 0.95, opacity: 0.55 }
        }
        transition={{
          duration: isBursting ? 0.6 : 1.8,
          repeat: isBursting ? 0 : Infinity,
          ease: 'easeInOut'
        }}
        style={{ originX: '50%', originY: '85%' }}
      >
        <defs>
          <linearGradient id="flameOuterGrad" x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="40%" stopColor="#F97316" />
            <stop offset="85%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
          <linearGradient id="flameMidGrad" x1="32" y1="14" x2="32" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
          <linearGradient id="flameCoreGrad" x1="32" y1="28" x2="32" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#FDE047" />
          </linearGradient>
        </defs>

        {/* Outer Roaring Flame Tongue */}
        <motion.path
          d="M33.5 4C33.5 4 47 16.5 49.5 31C51.6 43.2 43.8 56.5 32 58C20.2 56.5 11.8 44.5 14.5 31.5C16.2 23.3 21.5 18.5 21.5 18.5C21.5 18.5 19.8 25.5 23.5 28C22 17.5 28.5 9.5 33.5 4Z"
          fill="url(#flameOuterGrad)"
          animate={
            isActive
              ? {
                  d: [
                    'M33.5 4C33.5 4 47 16.5 49.5 31C51.6 43.2 43.8 56.5 32 58C20.2 56.5 11.8 44.5 14.5 31.5C16.2 23.3 21.5 18.5 21.5 18.5C21.5 18.5 19.8 25.5 23.5 28C22 17.5 28.5 9.5 33.5 4Z',
                    'M31.5 3.5C31.5 3.5 48.5 17.5 50 31.5C51.3 43.7 43.2 56.5 32 58C20.8 56.5 12.5 44 14 31C15.5 22.8 22.5 17.5 22.5 17.5C22.5 17.5 20.5 24.5 24 27.5C23 16.8 27.5 9 31.5 3.5Z',
                    'M34.5 4.5C34.5 4.5 46 16 49 30.5C51.5 42.8 44 56.5 32 58C20 56.5 12 45 15 32C16.8 23.8 21 19 21 19C21 19 19.5 26 23 28.5C21.5 18 29.5 10 34.5 4.5Z'
                  ]
                }
              : undefined
          }
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Middle Golden Dancing Flame */}
        <motion.path
          d="M32.5 16C32.5 16 42.5 25.5 43.5 36.5C44.4 45.8 38.8 54.8 32 56C25.2 54.8 19.5 46.5 21 37C22.2 29.5 27 25 27 25C27 25 26 30 28.5 32C27.5 24.5 30 19.5 32.5 16Z"
          fill="url(#flameMidGrad)"
          animate={
            isActive
              ? {
                  scaleY: [1, 1.08, 0.94, 1.04, 1],
                  rotate: [0, 3, -3, 1.5, 0]
                }
              : undefined
          }
          transition={{ duration: 1.15, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '50%', originY: '85%' }}
        />

        {/* Inner White-Hot Core */}
        <motion.path
          d="M32 30C32 30 38 36.5 38.5 43.5C39 49.5 35.8 54.5 32 55.5C28.2 54.5 25 49.5 25.5 43.5C26 36.5 32 30 32 30Z"
          fill="url(#flameCoreGrad)"
          animate={
            isActive
              ? {
                  scale: [1, 1.12, 0.92, 1.08, 1],
                  opacity: [0.9, 1, 0.85, 1, 0.9]
                }
              : undefined
          }
          transition={{ duration: 0.95, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '50%', originY: '90%' }}
        />
      </motion.svg>
    </div>
  );
});

const HomescreenStreakBar = memo(function HomescreenStreakBar({
  streak,
  username = 'Shaurya Talks',
  userId,
  visibleModuleIdx = 0,
  onFocusActiveLesson,
  className = ''
}: HomescreenStreakBarProps) {
  const [selectedDay, setSelectedDay] = useState<DayActivityDisplayRecord | DayActivityRecord | null>(null);
  const [dbActivityRecords, setDbActivityRecords] = useState<UserDailyActivityRecord[]>([]);
  const [isBursting, setIsBursting] = useState(false);
  const [burstEmbers, setBurstEmbers] = useState<EmberParticle[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);

  const triggerFlameCelebration = useCallback(() => {
    setIsBursting(true);
    const colors = ['#FBBF24', '#F97316', '#FEF08A', '#FB923C', '#EF4444'];
    const angles = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];
    const particles: EmberParticle[] = angles.map((deg, idx) => {
      const rad = (deg * Math.PI) / 180;
      const dist = 20 + (idx % 3) * 10;
      return {
        id: `ember-${Date.now()}-${idx}`,
        x: Math.cos(rad) * dist,
        y: Math.sin(rad) * dist - 8,
        size: 4 + (idx % 3) * 2,
        color: colors[idx % colors.length]
      };
    });
    setBurstEmbers(particles);
    setTimeout(() => setIsBursting(false), 750);
    setTimeout(() => setBurstEmbers([]), 850);
  }, []);

  // Fetch and subscribe to real-time daily activity
  useEffect(() => {
    let isMounted = true;
    async function loadActivity() {
      const records = await fetchUserDailyActivityRecords(userId, 14);
      if (isMounted && records && records.length > 0) {
        setDbActivityRecords(records);
      }
    }
    loadActivity();

    let unsubscribe: (() => void) | null = null;
    if (userId) {
      unsubscribe = subscribeToUserDailyActivity(userId, (updatedRecord) => {
        if (!isMounted) return;
        setDbActivityRecords((prev) => {
          const idx = prev.findIndex((r) => r.activity_date === updatedRecord.activity_date);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = updatedRecord;
            return copy;
          }
          return [updatedRecord, ...prev];
        });
      });
    }

    const handleLessonCompleted = () => {
      setRefreshTick((t) => t + 1);
      triggerFlameCelebration();
      loadActivity();
    };

    window.addEventListener('CHIKOO_LESSON_COMPLETED', handleLessonCompleted);
    window.addEventListener('LESSON_COMPLETED', handleLessonCompleted);

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
      window.removeEventListener('CHIKOO_LESSON_COMPLETED', handleLessonCompleted);
      window.removeEventListener('LESSON_COMPLETED', handleLessonCompleted);
    };
  }, [userId, triggerFlameCelebration]);

  // Trigger burst animation when streak prop increases
  useEffect(() => {
    if (streak > 0) {
      triggerFlameCelebration();
    }
  }, [streak, triggerFlameCelebration]);

  // Compute the 7-day calendar bar records
  const days = useMemo(() => {
    const localCalendar = getSevenDayCircularCalendar(username, streak);
    if (dbActivityRecords.length > 0) {
      const realtimeCalendar = buildCircularCalendarFromActivityRecords(dbActivityRecords);
      if (realtimeCalendar.some((d) => d.isActive)) {
        // Merge realtime DB with local streak sync so active streak days are always accurate
        return realtimeCalendar.map((rtDay, idx) => {
          const localDay = localCalendar[idx];
          const mergedActive = rtDay.isActive || (localDay?.isActive ?? false);
          return {
            ...rtDay,
            isActive: mergedActive,
            lessonsCompleted: Math.max(rtDay.lessonsCompleted, localDay?.lessonsCompleted || 0),
            cookiesEarned: Math.max(rtDay.cookiesEarned, localDay?.cookiesEarned || 0)
          };
        });
      }
    }
    return localCalendar;
  }, [dbActivityRecords, username, streak, refreshTick]);

  const activeDaysCount = useMemo(() => days.filter((d) => d.isActive).length, [days]);
  const todayRecord = useMemo(() => days.find((d) => d.isToday), [days]);
  const isTodayActive = todayRecord?.isActive ?? streak > 0;

  const handleFlameClick = () => {
    soundManager.play('click');
    triggerFlameCelebration();
  };

  const handleDayClick = (dayItem: DayActivityDisplayRecord | DayActivityRecord) => {
    soundManager.play('click');
    setSelectedDay((prev) => (prev?.dateKey === dayItem.dateKey ? null : dayItem));
  };

  return (
    <div
      id="homescreen-streak-calendar-bar"
      data-testid="homescreen-streak-widget"
      className={`w-[calc(100%-32px)] sm:w-[calc(100%-40px)] max-w-lg mx-auto select-none relative transition-all duration-300 ${className}`}
    >
      {/* Main Glassmorphic Streak & 7-Day Calendar Bar Container */}
      <div
        className="relative rounded-[20px] px-3 sm:px-4 py-2.5 bg-white/92 dark:bg-[#151e31]/95 backdrop-blur-xl border border-white/80 dark:border-slate-700/70 shadow-[0_10px_28px_rgba(15,23,42,0.12),_inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.45)] overflow-visible"
      >
        {/* Subtle Warm Flame Ambient Gradient on Left Edge */}
        <div className="absolute top-0 left-0 bottom-0 w-28 bg-gradient-to-r from-orange-500/12 via-amber-500/5 to-transparent rounded-l-[20px] pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-2.5 sm:gap-3.5">
          {/* LEFT: Animated Fire Flame Icon + Current User Streak Count */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleFlameClick}
            className="flex items-center gap-2 sm:gap-2.5 pr-2.5 sm:pr-3.5 border-r border-slate-200/80 dark:border-slate-700/70 shrink-0 cursor-pointer group text-left relative"
            title="Tap to stoke your streak flame!"
          >
            {/* Burst Ember Particles on Tap / Streak Up */}
            <AnimatePresence>
              {burstEmbers.map((ember) => (
                <motion.span
                  key={ember.id}
                  initial={{ x: 14, y: 14, opacity: 1, scale: 0.3 }}
                  animate={{ x: 14 + ember.x, y: 14 + ember.y, opacity: 0, scale: 1.1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  style={{
                    width: `${ember.size}px`,
                    height: `${ember.size}px`,
                    backgroundColor: ember.color
                  }}
                  className="absolute rounded-full pointer-events-none z-50 shadow-[0_0_6px_#f97316]"
                />
              ))}
            </AnimatePresence>

            {/* Flame Badge Housing */}
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-orange-500/15 via-amber-500/15 to-red-500/10 dark:from-orange-500/25 dark:to-amber-500/15 border border-orange-400/35 dark:border-orange-500/40 flex items-center justify-center shadow-inner group-hover:border-orange-400/70 transition-colors">
              <AnimatedFireFlame isActive={streak > 0 || isTodayActive} isBursting={isBursting} size="md" />
            </div>

            {/* Streak Count & Label */}
            <div className="flex flex-col justify-center">
              <div className="flex items-baseline gap-1">
                <motion.span
                  key={streak}
                  initial={{ scale: 1.25, color: '#f97316' }}
                  animate={{ scale: 1 }}
                  className="font-display font-black text-lg sm:text-xl leading-none tracking-tight bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 dark:from-amber-300 dark:via-orange-400 dark:to-orange-500 bg-clip-text text-transparent"
                >
                  {streak}
                </motion.span>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 leading-none">
                  {streak === 1 ? 'Day' : 'Days'}
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-orange-600/90 dark:text-amber-400/90 flex items-center gap-0.5 mt-0.5 leading-none">
                <span>Streak</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
              </span>
            </div>
          </motion.button>

          {/* RIGHT: 7-Day Calendar Bar Showing Activity Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1 px-0.5">
              <span className="text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1">
                <span>7-Day Activity</span>
              </span>
              <span className="text-[9px] sm:text-[9.5px] font-extrabold text-orange-600 dark:text-amber-400">
                {activeDaysCount}/7 Active
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 items-center relative">
              {/* Connecting subtle horizontal activity track line behind nodes */}
              <div className="absolute left-3 right-3 bottom-[13px] sm:bottom-[14px] h-[2px] bg-slate-200/75 dark:bg-slate-700/70 -z-0 rounded-full pointer-events-none" />

              {days.map((dayItem, idx) => {
                const isSelected = selectedDay?.dateKey === dayItem.dateKey;

                return (
                  <button
                    key={`home-streak-day-${dayItem.dateKey}-${idx}`}
                    type="button"
                    onClick={() => handleDayClick(dayItem)}
                    className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none"
                    title={`${dayItem.formattedDate}: ${dayItem.isActive ? 'Active' : dayItem.isToday ? 'Today (In Progress)' : 'No Activity'}`}
                  >
                    {/* Day Label (M, T, W or Mon, Tue...) */}
                    <span
                      className={`text-[8.5px] sm:text-[9.5px] font-extrabold uppercase tracking-tight mb-1 leading-none transition-colors ${
                        dayItem.isToday
                          ? 'text-orange-600 dark:text-amber-400 font-black'
                          : dayItem.isActive
                          ? 'text-slate-700 dark:text-slate-200'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {dayItem.dayLabel.slice(0, 3)}
                    </span>

                    {/* Day Status Node */}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.92 }}
                      className={`w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center relative transition-all duration-200 ${
                        dayItem.isActive
                          ? 'bg-gradient-to-tr from-orange-500 via-amber-500 to-yellow-400 text-white shadow-[0_3px_10px_rgba(249,115,22,0.38)] ring-2 ring-orange-200 dark:ring-orange-500/40'
                          : dayItem.isToday
                          ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-amber-400 border-2 border-dashed border-orange-400 dark:border-amber-400 shadow-[0_0_10px_rgba(249,115,22,0.2)]'
                          : 'bg-slate-100/95 dark:bg-slate-800/90 text-slate-400 dark:text-slate-500 border border-slate-200/90 dark:border-slate-700/80'
                      } ${
                        isSelected
                          ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 scale-110'
                          : ''
                      }`}
                    >
                      {dayItem.isActive ? (
                        <AnimatedFireFlame isActive={true} size="sm" />
                      ) : dayItem.isToday ? (
                        <span className="w-2 h-2 rounded-full bg-orange-500 dark:bg-amber-400 animate-ping" />
                      ) : (
                        <span className="text-[9.5px] font-bold leading-none">
                          {dayItem.dayNumber}
                        </span>
                      )}

                      {/* Verified Mini Checkmark Badge on Active Days */}
                      {dayItem.isActive && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-1 ring-white dark:ring-[#151e31] shadow-2xs">
                          <Check size={7} className="stroke-[3.5]" />
                        </span>
                      )}
                    </motion.div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* EXPANDABLE DAY ACTIVITY DETAIL POPOVER */}
        <AnimatePresence>
          {selectedDay && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      selectedDay.isActive
                        ? 'bg-orange-500/15 text-orange-600 dark:text-amber-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Flame size={13} className={selectedDay.isActive ? 'fill-orange-500 text-orange-500' : ''} />
                  </div>
                  <div className="truncate">
                    <span className="font-black text-slate-800 dark:text-white text-[11px] sm:text-xs">
                      {selectedDay.formattedDate}
                      {selectedDay.isToday ? ' (Today)' : ''}
                    </span>
                    <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                      {selectedDay.isActive
                        ? `${selectedDay.lessonsCompleted || 1} lesson${(selectedDay.lessonsCompleted || 1) > 1 ? 's' : ''} completed • +${selectedDay.cookiesEarned || 15} Cookies 🍪`
                        : selectedDay.isToday
                        ? 'Complete a lesson today to keep your flame burning!'
                        : 'No lesson activity recorded on this day.'}
                    </span>
                  </div>
                </div>

                {selectedDay.isActive ? (
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/50 shrink-0">
                    Flame Lit 🔥
                  </span>
                ) : selectedDay.isToday && onFocusActiveLesson ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDay(null);
                      onFocusActiveLesson();
                    }}
                    className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs hover:brightness-105 active:scale-95 transition-all flex items-center gap-0.5 shrink-0 cursor-pointer"
                  >
                    <span>Start Now</span>
                    <ChevronRight size={11} />
                  </button>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-400 shrink-0">
                    {selectedDay.isToday ? 'Pending' : 'Rest Day'}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default HomescreenStreakBar;
