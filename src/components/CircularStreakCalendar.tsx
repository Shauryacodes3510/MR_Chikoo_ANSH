import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, Check, Flame, Info, Calendar } from 'lucide-react';
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

interface CircularStreakCalendarProps {
  sessionUser: string;
  streak: number;
  bestStreak: number;
  topThreeFinishes: number;
  gems: number;
  userId?: string;
  onSelectDay?: (day: DayActivityDisplayRecord | DayActivityRecord) => void;
}

export default function CircularStreakCalendar({
  sessionUser,
  streak,
  bestStreak,
  topThreeFinishes,
  gems,
  userId,
  onSelectDay
}: CircularStreakCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<DayActivityDisplayRecord | DayActivityRecord | null>(null);
  const [dbActivityRecords, setDbActivityRecords] = useState<UserDailyActivityRecord[]>([]);

  // Fetch from main realtime DB on mount or userId change
  useEffect(() => {
    let isMounted = true;
    async function loadActivity() {
      const records = await fetchUserDailyActivityRecords(userId, 30);
      if (isMounted && records && records.length > 0) {
        setDbActivityRecords(records);
      }
    }
    loadActivity();

    // Subscribe to real-time changes on user_daily_activity
    let unsubscribe: (() => void) | null = null;
    if (userId) {
      unsubscribe = subscribeToUserDailyActivity(userId, (updatedRecord) => {
        if (!isMounted) return;
        setDbActivityRecords(prev => {
          const idx = prev.findIndex(r => r.activity_date === updatedRecord.activity_date);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = updatedRecord;
            return copy;
          }
          return [updatedRecord, ...prev];
        });
      });
    }

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [userId]);

  // Compute 7 days: prefer Supabase realtime DB activity if available, else fallback to localStorage/cookies
  const days = useMemo(() => {
    if (dbActivityRecords.length > 0) {
      const realtimeCalendar = buildCircularCalendarFromActivityRecords(dbActivityRecords);
      if (realtimeCalendar.some(d => d.isActive)) {
        return realtimeCalendar;
      }
    }
    // Fallback to local storage / cookies / streak sync
    return getSevenDayCircularCalendar(sessionUser, streak);
  }, [dbActivityRecords, sessionUser, streak]);

  const activeDaysCount = useMemo(() => {
    return days.filter(d => d.isActive).length;
  }, [days]);

  const todayRecord = useMemo(() => {
    return days.find(d => d.isToday);
  }, [days]);

  const isTodayActive = todayRecord?.isActive ?? false;

  const handleDayClick = (dayItem: DayActivityDisplayRecord | DayActivityRecord) => {
    soundManager.play('click');
    setSelectedDay(prev => prev?.dateKey === dayItem.dateKey ? null : dayItem);
    if (onSelectDay) onSelectDay(dayItem);
  };

  return (
    <div 
      className="w-full my-3 bg-white dark:bg-[#172033] border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-3.5 sm:p-4 shadow-xs transition-colors duration-200 text-left relative overflow-hidden"
      id="profile-streak-calendar"
      data-testid="profile-stats-row"
    >
      {/* Background soft ambient glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-500/10 dark:bg-orange-500/15 rounded-full blur-2xl pointer-events-none" />

      {/* TOP HEADER: Streak Badge + Best Streak + Stats Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800/70">
        
        {/* Left: Streak icon and count */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 p-0.5 shadow-sm flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-white/10 dark:bg-black/20 rounded-[14px] flex items-center justify-center backdrop-blur-2xs">
              <img 
                src="/streak.webp" 
                alt="Streak Flame" 
                className="w-6 h-6 object-contain drop-shadow-sm animate-pulse" 
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                {streak} Day Streak!
              </h3>
              {streak > 0 && (
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70 border border-amber-300/80 dark:border-amber-700/60 px-1.5 py-0.2 rounded-full">
                  Realtime Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium leading-none">
              {isTodayActive 
                ? "You completed your goal for today! Flame protected." 
                : "Complete a lesson today to maintain your fire!"}
            </p>
          </div>
        </div>

        {/* Right: Compact stats pills (Top 3 & Cookies) */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          {/* Trophy (Top 3 finishes) */}
          <div 
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100/90 dark:bg-[#243149] border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200"
            title="Top 3 finishes in League"
          >
            <Trophy size={13} className="text-amber-500 fill-amber-500 shrink-0" />
            <span className="text-xs font-black leading-none">{topThreeFinishes}</span>
            <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-400">Top 3</span>
          </div>

          {/* Cookies count */}
          <div 
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100/90 dark:bg-[#243149] border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200"
            title="Cosmic Cookies collected"
          >
            <img src="/cookies.webp" alt="Cookies" className="w-3.5 h-3.5 object-contain shrink-0" />
            <span className="text-xs font-black leading-none">{gems.toLocaleString()}</span>
          </div>

          {/* Best Streak */}
          <div 
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-800/50 text-orange-700 dark:text-orange-300"
            title="Your personal best streak"
          >
            <Flame size={12} className="text-orange-500 shrink-0" />
            <span className="text-[10px] font-black leading-none">Best: {bestStreak}d</span>
          </div>
        </div>

      </div>

      {/* 7-DAY CIRCULAR STREAK CALENDAR SECTION */}
      <div className="pt-3 pb-1">
        <div className="flex items-center justify-between mb-2 px-0.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Calendar size={12} className="text-orange-500" />
            <span>7-Day Realtime Streak Calendar</span>
          </span>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
            {activeDaysCount} of 7 days active
          </span>
        </div>

        {/* 7 Circular Nodes Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center pt-1" id="streak-calendar-circles">
          {days.map((dayItem, idx) => {
            const isSelected = selectedDay?.dateKey === dayItem.dateKey;

            return (
              <div 
                key={`streak-circle-${dayItem.dateKey}-${idx}`}
                className="flex flex-col items-center group relative cursor-pointer"
                onClick={() => handleDayClick(dayItem)}
              >
                {/* Day Abbreviation: Mon, Tue, etc. */}
                <span className={`text-[10px] font-bold tracking-tight mb-1 transition-colors ${
                  dayItem.isToday 
                    ? 'text-orange-600 dark:text-orange-400 font-black' 
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {dayItem.dayLabel}
                </span>

                {/* The Circular Node */}
                <div 
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center relative transition-all duration-200 active:scale-95 ${
                    dayItem.isActive
                      ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 text-white shadow-xs ring-2 ring-orange-300 dark:ring-orange-500/50 shadow-orange-500/20'
                      : dayItem.isToday
                        ? 'bg-white dark:bg-[#243149] text-orange-500 border-2 border-dashed border-orange-400 dark:border-orange-500 ring-2 ring-orange-400/20'
                        : 'bg-slate-100 dark:bg-[#243149]/60 text-slate-400 dark:text-slate-500 border border-slate-200/80 dark:border-slate-700/60'
                  } ${isSelected ? 'ring-3 ring-purple-500 dark:ring-purple-400 scale-105' : ''}`}
                >
                  {dayItem.isActive ? (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="flex items-center justify-center"
                    >
                      <img 
                        src="/streak.webp" 
                        alt="Active Day" 
                        className="w-4.5 h-4.5 object-contain drop-shadow-xs" 
                      />
                    </motion.div>
                  ) : dayItem.isToday ? (
                    <span className="text-[8.5px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-tighter leading-none">
                      TODAY
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                      {dayItem.dayInitial}
                    </span>
                  )}

                  {/* Tiny checkmark badge if active */}
                  {dayItem.isActive && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center border border-white dark:border-[#172033] shadow-2xs">
                      <Check size={8} className="stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Day of Month number (e.g. 21) */}
                <span className={`text-[10px] font-semibold mt-1 transition-colors ${
                  dayItem.isToday
                    ? 'text-orange-600 dark:text-orange-400 font-extrabold'
                    : isSelected
                      ? 'text-purple-600 dark:text-purple-400 font-bold'
                      : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {dayItem.dayNumber}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* INTERACTIVE DAY DETAILS POPOVER / TOOLTIP */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div 
            initial={{ opacity: 0, y: 4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 4, height: 0 }}
            className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200"
          >
            <div className="bg-slate-50 dark:bg-[#243149] p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-xl ${
                  selectedDay.isActive 
                    ? 'bg-orange-500/20 text-orange-500' 
                    : 'bg-slate-200/60 dark:bg-slate-800 text-slate-400'
                }`}>
                  <Flame size={14} />
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white block leading-tight">
                    {selectedDay.formattedDate} {selectedDay.isToday && '(Today)'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    {selectedDay.isActive 
                      ? `${selectedDay.lessonsCompleted} lesson${selectedDay.lessonsCompleted > 1 ? 's' : ''} completed • +${selectedDay.cookiesEarned} Cookies` 
                      : selectedDay.isToday 
                        ? 'Finish a lesson today to ignite this day!' 
                        : 'No activity logged on this day.'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {selectedDay.isActive ? (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/50">
                    Realtime Active
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {selectedDay.isToday ? 'Pending' : 'Missed'}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER NOTICE / MOTIVATIONAL PROGRESS BAR */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Sparkles size={11} className="text-amber-500" />
          <span>Synced with Supabase Realtime DB</span>
        </span>
        <span className="font-bold text-slate-700 dark:text-slate-300">
          {Math.round((activeDaysCount / 7) * 100)}% weekly habit score
        </span>
      </div>

    </div>
  );
}
