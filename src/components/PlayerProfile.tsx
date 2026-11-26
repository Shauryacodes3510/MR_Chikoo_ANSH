import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings2, Check, X, Edit3, Copy, Flame, Trophy,
  Target, BookOpen, Lock, Sparkles, Moon, Sun, 
  Globe, Music, Bell, Shield, Clock, HelpCircle, 
  LogOut, Building2, ChevronRight, CheckCircle2, Award
} from 'lucide-react';
import { soundManager } from '../lib/sounds';
import { LEAGUES, AVATARS, ALL_BADGES } from '../constants';
import { useProfileProgress } from '../hooks/useProfileProgress';
import { useTranslation } from '../lib/translation/TranslationContext';
import { LanguageSelector } from './LanguageSelector';
import { getSevenDayCircularCalendar, DayActivityRecord } from '../lib/streakCalendarStorage';
import ConfettiEffect from './ConfettiEffect';

interface PlayerProfileProps {
  username: string;
  setUsername: (name: string) => void;
  spaceTitle: string;
  setSpaceTitle: (title: string) => void;
  spaceMotto: string;
  setSpaceMotto: (motto: string) => void;
  completedLessons: string[];
  accuracy: number;
  earnedBadges: string[];
  setEarnedBadges: React.Dispatch<React.SetStateAction<string[]>>;
  gems: number;
  setGems: (gems: number) => void;
  xp: number;
  setXp: (xp: number) => void;
  streak: number;
  bestAnswerStreak: number;
  currentLeagueId: string;
  selectedAvatarId: string;
  setSelectedAvatarId: (id: string) => void;
  selectedThemeId: string;
  setSelectedThemeId: (id: string) => void;
  isPlus: boolean;
  sessionUser: string;
  saveProfileUpdates: (updates: any) => void;
  setView: (view: any) => void;
  isDbAdmin: boolean;
  setIsAdminActive: (active: boolean) => void;
  setShowSignOutConfirm: (show: boolean) => void;
  bookmarkedLessonsData: any[];
  handleLessonSelect: (lessonId: string) => void;
  isSchoolAccount?: boolean;
  schoolInfo?: { id: string; name: string; school_code: string; status: 'active' | 'inactive' } | null;
  onOpenSchoolAdmin?: () => void;
  isSchoolInactive?: boolean;
  onGrantBadgeXp?: (badgeId: string) => Promise<void>;
}

export default function PlayerProfile({
  username,
  setUsername,
  spaceTitle,
  setSpaceTitle,
  spaceMotto: _spaceMotto,
  setSpaceMotto: _setSpaceMotto,
  completedLessons,
  accuracy,
  earnedBadges,
  setEarnedBadges,
  gems,
  setGems: _setGems,
  xp,
  setXp,
  streak,
  bestAnswerStreak,
  currentLeagueId: _currentLeagueId,
  selectedAvatarId,
  setSelectedAvatarId,
  selectedThemeId: _selectedThemeId,
  setSelectedThemeId: _setSelectedThemeId,
  isPlus,
  sessionUser,
  saveProfileUpdates,
  setView: _setView,
  isDbAdmin,
  setIsAdminActive,
  setShowSignOutConfirm,
  bookmarkedLessonsData: _bookmarkedLessonsData,
  handleLessonSelect: _handleLessonSelect,
  isSchoolAccount,
  schoolInfo,
  onOpenSchoolAdmin,
  isSchoolInactive: _isSchoolInactive,
  onGrantBadgeXp,
}: PlayerProfileProps) {
  const { t } = useTranslation();

  // Navigation tab: 'stats' or 'achievements'
  const [profileTab, setProfileTab] = useState<'stats' | 'achievements'>('stats');

  // Modals state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showTitlePicker, setShowTitlePicker] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);
  const [confettiActive, setConfettiActive] = useState(false);
  const [selectedDayRecord, setSelectedDayRecord] = useState<DayActivityRecord | null>(null);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('CHIKOO_THEME_MODE') === 'dark' || document.documentElement.classList.contains('dark');
    } catch {
      return false;
    }
  });

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    try {
      localStorage.setItem('CHIKOO_THEME_MODE', nextDark ? 'dark' : 'light');
    } catch (e) {
      console.warn('Could not save theme to localStorage', e);
    }
    if (nextDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    window.dispatchEvent(new CustomEvent('chikoo:theme_change', { detail: { mode: nextDark ? 'dark' : 'light' } }));
    soundManager.play('click');
  };

  // Name editing
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editingNameVal, setEditingNameVal] = useState(username);

  // Settings toggles
  const [isMusicEnabled, setIsMusicEnabled] = useState(() => soundManager.isMusicEnabled());
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privacyEnabled, setPrivacyEnabled] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [showCacheCleared, setShowCacheCleared] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = soundManager.subscribe(() => {
      setIsMusicEnabled(soundManager.isMusicEnabled());
    });
    return unsubscribe;
  }, []);

  // Real-time Supabase profile sync
  const { profile: liveProfile } = useProfileProgress();

  const effectiveCompletedLessons = useMemo(() => {
    const source = (liveProfile?.completed_lessons && liveProfile.completed_lessons.length > 0)
      ? liveProfile.completed_lessons
      : (completedLessons || []);
    const uniqueSet = new Set(source.map((id: string) => id.replace(/^practice_/, '')));
    return Array.from(uniqueSet);
  }, [liveProfile?.completed_lessons, completedLessons]);

  const effectiveGems = liveProfile ? liveProfile.gems : gems;
  const effectiveStreak = liveProfile ? liveProfile.streak : streak;
  const effectiveBestStreak = liveProfile?.best_streak !== undefined ? liveProfile.best_streak : bestAnswerStreak;
  const effectiveAccuracy = liveProfile?.accuracy !== undefined ? liveProfile.accuracy : accuracy;

  // Level calculations: Based on non-depleting XP / Lessons (spending cookies will never decrease level!)
  const effectiveXp = Math.max(xp || 0, (completedLessons?.length || 0) * 100);
  const currentLevel = Math.max(1, Math.floor(effectiveXp / 300) + 1);
  const xpIntoLevel = effectiveXp % 300;
  const nextLevelThreshold = 300;
  const levelProgressRatio = Math.min(1, Math.max(0, xpIntoLevel / nextLevelThreshold));

  const currentAvatar = useMemo(() => {
    return AVATARS.find(a => a.id === selectedAvatarId) || AVATARS[0];
  }, [selectedAvatarId]);

  // Streak 7-day strip data
  const streakDays = useMemo(() => {
    return getSevenDayCircularCalendar(sessionUser, effectiveStreak);
  }, [sessionUser, effectiveStreak]);

  // Next badge to unlock
  const nextMilestoneBadge = useMemo(() => {
    return ALL_BADGES.find(b => !earnedBadges.includes(b.id)) || null;
  }, [earnedBadges]);

  // Honor titles
  const AVAILABLE_TITLES = useMemo(() => [
    { id: 'cadet', name: 'AI Explorer', requirement: 'Unlocked', unlocked: true, emoji: '🧭' },
    { id: 'explorer', name: 'Idea Explorer', requirement: '3+ Lessons', unlocked: effectiveCompletedLessons.length >= 3, emoji: '💡' },
    { id: 'architect', name: 'Brain Builder', requirement: '85%+ Score', unlocked: effectiveAccuracy >= 0.85, emoji: '🧠' },
    { id: 'guardian', name: 'Knowledge Hero', requirement: '3+ Badges', unlocked: earnedBadges.length >= 3, emoji: '🛡️' },
    { id: 'legend', name: 'Quiz Champion', requirement: '1,000+ Cookies', unlocked: effectiveGems >= 1000, emoji: '🏆' }
  ], [effectiveCompletedLessons, effectiveAccuracy, earnedBadges, effectiveGems]);

  const handleSelectTitle = (titleName: string) => {
    soundManager.play('cheer');
    setSpaceTitle(titleName);
    saveProfileUpdates({ space_title: titleName });
    setShowTitlePicker(false);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(sessionUser);
    setShowCopied(true);
    soundManager.play('click');
    setTimeout(() => setShowCopied(false), 2000);
  };

  const handleClearCache = async () => {
    soundManager.play('cheer');
    setShowCacheCleared(true);
    localStorage.clear();
    sessionStorage.clear();
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      } catch (e) {
        console.error('Cache deletion failed:', e);
      }
    }
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      } catch (e) {
        console.error('Service worker unregistration failed:', e);
      }
    }
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  const handleUnlockBadgeDirectly = (badge: any) => {
    soundManager.play('complete');
    setConfettiActive(true);
    if (!earnedBadges.includes(badge.id)) {
      const nextBadges = [...earnedBadges, badge.id];
      setEarnedBadges(nextBadges);
      saveProfileUpdates({ earned_badges: nextBadges });
    }
    if (onGrantBadgeXp) {
      onGrantBadgeXp(badge.id);
    }
    setSelectedBadge(null);
  };

  return (
    <div 
      className="w-full max-w-md mx-auto min-h-full pb-28 text-[#172033] dark:text-slate-100 font-sans select-none transition-colors duration-200"
      id="player-profile-screen"
    >
      <ConfettiEffect active={confettiActive} onComplete={() => setConfettiActive(false)} />

      {/* A. COMPACT TOP HEADER */}
      <div className="flex items-center justify-between pt-1 pb-3 px-1">
        <h1 className="text-xl font-black text-[#172033] dark:text-white tracking-tight">
          Profile
        </h1>

        <button 
          onClick={() => {
            soundManager.play('click');
            setShowSettingsModal(true);
          }}
          className="p-2 text-[#718096] hover:text-[#172033] dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer active:scale-95"
          aria-label="Profile Settings"
          id="profile-settings-btn"
        >
          <Settings2 size={20} />
        </button>
      </div>

      {/* B & C. HERO SECTION — THE STUDENT'S GAME IDENTITY & LEVEL PROGRESSION */}
      <div 
        className="bg-white dark:bg-[#13192b] border border-[#E8ECF3] dark:border-slate-800/80 rounded-2xl p-4 shadow-sm"
        id="profile-hero-card"
      >
        <div className="flex items-center gap-3.5">
          {/* Avatar Square */}
          <div className="relative group shrink-0">
            <button
              onClick={() => {
                soundManager.play('click');
                setShowAvatarPicker(true);
              }}
              className="w-18 h-18 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center cursor-pointer active:scale-95 transition-transform shadow-xs overflow-hidden"
              title="Change character avatar"
              aria-label="Change character avatar"
            >
              <currentAvatar.icon className="w-9 h-9 text-[#8B35E8] dark:text-purple-300 drop-shadow-xs" />
            </button>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#8B35E8] text-white flex items-center justify-center shadow-xs pointer-events-none">
              <Edit3 size={10} />
            </div>
          </div>

          {/* Student Identity Information */}
          <div className="flex-1 min-w-0">
            {/* Display Name Row */}
            {isEditingUsername ? (
              <div className="flex items-center gap-1.5">
                <input 
                  type="text" 
                  value={editingNameVal}
                  onChange={(e) => setEditingNameVal(e.target.value.slice(0, 18))}
                  className="bg-slate-50 dark:bg-slate-800 border border-[#8B35E8] text-[#172033] dark:text-white text-sm font-bold px-2 py-0.5 rounded-lg focus:outline-none w-full"
                  autoFocus
                  id="edit-username-input"
                />
                <button 
                  onClick={() => {
                    soundManager.play('complete');
                    setIsEditingUsername(false);
                    setUsername(editingNameVal);
                    saveProfileUpdates({ username: editingNameVal });
                  }}
                  className="p-1.5 bg-[#8B35E8] text-white rounded-lg active:scale-95 cursor-pointer"
                  aria-label="Save Name"
                >
                  <Check size={13} className="stroke-[2.5]" />
                </button>
                <button 
                  onClick={() => {
                    setIsEditingUsername(false);
                    setEditingNameVal(username);
                  }}
                  className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg active:scale-95 cursor-pointer"
                  aria-label="Cancel"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="text-lg font-black text-[#172033] dark:text-white truncate tracking-tight">
                  {username}
                </h2>
                <button 
                  onClick={() => {
                    soundManager.play('click');
                    setIsEditingUsername(true);
                  }}
                  className="p-1 text-[#718096] hover:text-[#8B35E8] dark:hover:text-purple-400 rounded cursor-pointer active:scale-95 transition-colors shrink-0"
                  title="Edit display name"
                  aria-label="Edit display name"
                >
                  <Edit3 size={12} />
                </button>
                {isPlus && (
                  <span className="text-[9px] font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-1.5 py-0.2 rounded-full shrink-0">
                    ★ PLUS
                  </span>
                )}
              </div>
            )}

            {/* Username & Copy Row */}
            <div className="flex items-center gap-1 mt-0.5 text-xs text-[#718096] dark:text-slate-400">
              <span className="truncate max-w-[170px]">
                @{username.toLowerCase().replace(/\s+/g, '')}
              </span>
              <button 
                onClick={handleCopyEmail}
                className="text-[#718096] hover:text-[#8B35E8] dark:hover:text-purple-400 p-0.5 rounded cursor-pointer active:scale-95 transition-colors"
                title="Copy User ID"
                aria-label="Copy User ID"
              >
                {showCopied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              </button>
            </div>

            {/* Level Indicator */}
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] font-black tracking-wider text-[#8B35E8] dark:text-purple-400 uppercase">
                LEVEL {currentLevel}
              </span>
              <span className="text-[11px] font-semibold text-[#718096] dark:text-slate-400 tabular-nums">
                {xpIntoLevel} / {nextLevelThreshold} XP
              </span>
            </div>

            {/* Slim XP Progress Bar */}
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${levelProgressRatio * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-[#8B35E8] to-[#6366F1] rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* D. STREAK — ONE COMPACT GAME ELEMENT */}
      <div 
        className="mt-3 bg-white dark:bg-[#13192b] border border-[#E8ECF3] dark:border-slate-800/80 rounded-2xl p-3.5 shadow-sm"
        id="profile-streak-compact"
      >
        {/* Streak Top Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center shrink-0">
              <img 
                src="/streak.webp" 
                alt="Streak Flame" 
                className="w-5 h-5 object-contain" 
              />
            </div>
            <div>
              <span className="text-sm font-black text-[#172033] dark:text-white leading-tight block">
                {effectiveStreak}-day streak
              </span>
            </div>
          </div>

          {effectiveBestStreak > 0 && (
            <span className="text-xs font-semibold text-[#718096] dark:text-slate-400 tabular-nums">
              Best: {effectiveBestStreak}d
            </span>
          )}
        </div>

        {/* Preview Daily Streak Animation Button */}
        <button
          onClick={() => {
            soundManager.play('click');
            window.dispatchEvent(new CustomEvent('chikooTestStreakAnimation'));
          }}
          className="mt-3 w-full py-2 px-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/30 rounded-xl text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>🔥 Preview Daily Streak Animation</span>
        </button>

        {/* 7-Day Activity Strip */}
        <div className="grid grid-cols-7 gap-1.5 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 text-center">
          {streakDays.map((dayItem, idx) => {
            const isSelected = selectedDayRecord?.dateKey === dayItem.dateKey;

            return (
              <button
                key={`streak-strip-${dayItem.dateKey}-${idx}`}
                onClick={() => {
                  soundManager.play('click');
                  setSelectedDayRecord(isSelected ? null : dayItem);
                }}
                className="flex flex-col items-center group cursor-pointer active:scale-95 transition-transform"
              >
                <span className={`text-[10px] font-semibold mb-1 ${
                  dayItem.isToday 
                    ? 'text-orange-600 dark:text-orange-400 font-bold' 
                    : 'text-[#718096] dark:text-slate-400'
                }`}>
                  {dayItem.dayLabel}
                </span>

                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                    dayItem.isActive
                      ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-xs'
                      : dayItem.isToday
                        ? 'border-2 border-dashed border-orange-400 dark:border-orange-500 text-orange-500 bg-orange-50/50 dark:bg-orange-950/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                  } ${isSelected ? 'ring-2 ring-[#8B35E8]' : ''}`}
                >
                  {dayItem.isActive ? (
                    <Flame size={14} className="fill-white" />
                  ) : (
                    <span className="text-[10px] font-bold">
                      {dayItem.dayNumber}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Optional Day Activity Tooltip */}
        <AnimatePresence>
          {selectedDayRecord && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 overflow-hidden"
            >
              <div className="flex items-center justify-between text-xs text-[#718096] dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-xl">
                <span>
                  <strong>{selectedDayRecord.formattedDate}</strong>
                  {selectedDayRecord.isToday && ' (Today)'}
                </span>
                <span className="font-semibold text-[#172033] dark:text-slate-200">
                  {selectedDayRecord.isActive 
                    ? `${selectedDayRecord.lessonsCompleted} done · +${selectedDayRecord.cookiesEarned} 🍪` 
                    : selectedDayRecord.isToday 
                      ? 'Goal in progress' 
                      : 'Rest day'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* E. TWO SIMPLE TABS */}
      <div className="flex border-b border-[#E8ECF3] dark:border-slate-800 mt-4 mb-3" id="profile-tabs-bar">
        <button
          onClick={() => {
            soundManager.play('click');
            setProfileTab('stats');
          }}
          className={`flex-1 py-2 text-center text-sm font-bold transition-colors relative cursor-pointer ${
            profileTab === 'stats' 
              ? 'text-[#172033] dark:text-white' 
              : 'text-[#718096] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white'
          }`}
          id="tab-btn-stats"
        >
          Stats
          {profileTab === 'stats' && (
            <motion.span 
              layoutId="profileTabLine"
              className="absolute -bottom-px left-0 right-0 h-0.5 bg-[#8B35E8] rounded-full" 
            />
          )}
        </button>

        <button
          onClick={() => {
            soundManager.play('click');
            setProfileTab('achievements');
          }}
          className={`flex-1 py-2 text-center text-sm font-bold transition-colors relative cursor-pointer ${
            profileTab === 'achievements' 
              ? 'text-[#172033] dark:text-white' 
              : 'text-[#718096] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white'
          }`}
          id="tab-btn-achievements"
        >
          Achievements
          {profileTab === 'achievements' && (
            <motion.span 
              layoutId="profileTabLine"
              className="absolute -bottom-px left-0 right-0 h-0.5 bg-[#8B35E8] rounded-full" 
            />
          )}
        </button>
      </div>

      {/* F. STATS TAB */}
      {profileTab === 'stats' && (
        <div className="space-y-3 animate-in fade-in duration-200" id="stats-tab-content">
          
          {/* Primary 3-Metric Compact Strip */}
          <div className="grid grid-cols-3 gap-2 bg-white dark:bg-[#13192b] border border-[#E8ECF3] dark:border-slate-800/80 rounded-2xl p-3 shadow-sm text-center">
            
            {/* Metric 1: Cookies */}
            <div className="flex flex-col items-center justify-center p-1.5">
              <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center mb-1">
                <img src="/cookies.webp" alt="Cookies" className="w-4 h-4 object-contain" />
              </div>
              <span className="text-lg font-black text-[#172033] dark:text-white tabular-nums leading-tight">
                {effectiveGems.toLocaleString()}
              </span>
              <span className="text-[10px] font-semibold text-[#718096] dark:text-slate-400 mt-0.5">
                Cookies
              </span>
            </div>

            {/* Metric 2: Lessons Completed */}
            <div className="flex flex-col items-center justify-center p-1.5 border-x border-slate-100 dark:border-slate-800/60">
              <div className="w-6 h-6 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center mb-1">
                <BookOpen size={13} className="text-[#8B35E8] dark:text-purple-400" />
              </div>
              <span className="text-lg font-black text-[#172033] dark:text-white tabular-nums leading-tight">
                {effectiveCompletedLessons.length}
              </span>
              <span className="text-[10px] font-semibold text-[#718096] dark:text-slate-400 mt-0.5">
                Lessons
              </span>
            </div>

            {/* Metric 3: Quiz Accuracy */}
            <div className="flex flex-col items-center justify-center p-1.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mb-1">
                <Target size={13} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-lg font-black text-[#172033] dark:text-white tabular-nums leading-tight">
                {Math.round(effectiveAccuracy * 100)}%
              </span>
              <span className="text-[10px] font-semibold text-[#718096] dark:text-slate-400 mt-0.5">
                Accuracy
              </span>
            </div>

          </div>

          {/* Active Honor Title Equip Card */}
          <div className="bg-white dark:bg-[#13192b] border border-[#E8ECF3] dark:border-slate-800/80 rounded-2xl p-3.5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-[#8B35E8] dark:text-purple-400 shrink-0">
                <Award size={16} />
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#718096] dark:text-slate-400 block leading-tight">
                  Active Title
                </span>
                <span className="text-xs font-black text-[#172033] dark:text-white block mt-0.5">
                  {spaceTitle || 'AI Explorer'}
                </span>
              </div>
            </div>

            <button 
              onClick={() => {
                soundManager.play('click');
                setShowTitlePicker(true);
              }}
              className="px-2.5 py-1 text-xs font-bold text-[#8B35E8] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer active:scale-95"
            >
              Change
            </button>
          </div>

          {/* Chikoo Story Video Replay Card */}
          <button
            onClick={() => {
              soundManager.play('click');
              window.dispatchEvent(new CustomEvent('chikoo:play_welcome_video'));
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-[#E8ECF3] dark:border-slate-800/60 text-[#172033] dark:text-slate-200 transition-all text-left cursor-pointer active:scale-[0.99]"
            id="chikoo-story-replay-btn"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-100/60 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Sparkles size={14} />
              </div>
              <div>
                <span className="text-xs font-black text-[#172033] dark:text-white block leading-tight">
                  Chikoo's Story Video
                </span>
                <span className="text-[10px] text-[#718096] dark:text-slate-400 block">
                  Watch Chikoo building the snowman animation
                </span>
              </div>
            </div>
            <ChevronRight size={14} className="text-[#718096] dark:text-slate-400 shrink-0" />
          </button>

        </div>
      )}

      {/* G. ACHIEVEMENTS TAB */}
      {profileTab === 'achievements' && (
        <div className="space-y-3 animate-in fade-in duration-200" id="achievements-tab-content">
          
          {/* Header count & next milestone */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-[#172033] dark:text-white uppercase tracking-wider">
              Badges & Milestones
            </span>
            <span className="text-xs font-semibold text-[#718096] dark:text-slate-400 tabular-nums">
              {earnedBadges.length} of {ALL_BADGES.length} Unlocked
            </span>
          </div>

          {/* Next Goal Highlight Banner */}
          {nextMilestoneBadge && (
            <div className="bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/40 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                  <Lock size={14} className="text-[#8B35E8] dark:text-purple-300" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#8B35E8] dark:text-purple-300 block leading-tight">
                    Next Goal
                  </span>
                  <span className="text-xs font-bold text-[#172033] dark:text-white block truncate">
                    {nextMilestoneBadge.name}
                  </span>
                  <span className="text-[10px] text-[#718096] dark:text-slate-400 block truncate">
                    {nextMilestoneBadge.requirement}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  soundManager.play('click');
                  setSelectedBadge(nextMilestoneBadge);
                }}
                className="px-2 py-1 text-[10px] font-bold text-white bg-[#8B35E8] hover:bg-purple-700 rounded-lg shrink-0 cursor-pointer active:scale-95 transition-colors"
              >
                Inspect
              </button>
            </div>
          )}

          {/* Clean Compact Grid of Badges */}
          <div className="bg-white dark:bg-[#13192b] border border-[#E8ECF3] dark:border-slate-800/80 rounded-2xl p-3.5 shadow-sm">
            <div className="grid grid-cols-4 gap-2.5">
              {ALL_BADGES.map((badge, bIdx) => {
                const isEarned = earnedBadges.includes(badge.id);
                const Icon = badge.icon;

                return (
                  <button
                    key={`badge-${badge.id}-${bIdx}`}
                    onClick={() => {
                      soundManager.play('click');
                      setSelectedBadge(badge);
                    }}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 relative transition-all duration-200 cursor-pointer active:scale-95 ${
                      isEarned
                        ? 'bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 text-[#8B35E8] dark:text-purple-300 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-60'
                    }`}
                    title={`${badge.name}: ${badge.requirement}`}
                  >
                    {isEarned ? (
                      <Icon className="w-7 h-7 drop-shadow-xs" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <Lock size={16} />
                      </div>
                    )}
                    
                    <span className="text-[9px] font-bold truncate max-w-full mt-1.5 leading-tight">
                      {badge.name.replace(' AI', '')}
                    </span>

                    {isEarned && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* AVATAR PICKER MODAL */}
      <AnimatePresence>
        {showAvatarPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-[#13192b] rounded-3xl p-4 shadow-xl border border-slate-200 dark:border-slate-800 text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-black text-[#172033] dark:text-white">Choose Avatar</h3>
                <button 
                  onClick={() => setShowAvatarPicker(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2.5 pt-3.5">
                {AVATARS.map((av) => {
                  const isCurrent = av.id === selectedAvatarId;
                  const AvIcon = av.icon;

                  return (
                    <button
                      key={`picker-avatar-${av.id}`}
                      onClick={() => {
                        soundManager.play('cheer');
                        setSelectedAvatarId(av.id);
                        saveProfileUpdates({ avatar_id: av.id });
                        setShowAvatarPicker(false);
                      }}
                      className={`flex flex-col items-center p-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                        isCurrent 
                          ? 'bg-purple-100 dark:bg-purple-950/60 text-[#8B35E8] dark:text-purple-300 ring-2 ring-[#8B35E8]' 
                          : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <AvIcon size={24} />
                      <span className="text-[9px] font-bold mt-1 truncate max-w-full">{av.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TITLE PICKER MODAL */}
      <AnimatePresence>
        {showTitlePicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-[#13192b] rounded-3xl p-4 shadow-xl border border-slate-200 dark:border-slate-800 text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-black text-[#172033] dark:text-white">Equip Title</h3>
                <button 
                  onClick={() => setShowTitlePicker(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-1.5 pt-3">
                {AVAILABLE_TITLES.map((tItem) => {
                  const isCurrent = spaceTitle === tItem.name || (!spaceTitle && tItem.id === 'cadet');

                  return (
                    <button
                      key={`title-${tItem.id}`}
                      disabled={!tItem.unlocked}
                      onClick={() => handleSelectTitle(tItem.name)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors ${
                        isCurrent 
                          ? 'bg-purple-50 dark:bg-purple-950/50 text-[#8B35E8] dark:text-purple-300 font-bold' 
                          : tItem.unlocked 
                            ? 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer' 
                            : 'opacity-40 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      <span>{tItem.emoji} {tItem.name}</span>
                      <span className="text-[10px] text-[#718096] dark:text-slate-400">
                        {isCurrent ? '✓ Equipped' : !tItem.unlocked ? `🔒 ${tItem.requirement}` : 'Equip'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BADGE INSPECTION / UNLOCK MODAL */}
      <AnimatePresence>
        {selectedBadge && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-white dark:bg-[#13192b] rounded-3xl p-5 shadow-xl border border-slate-200 dark:border-slate-800 text-center space-y-4"
            >
              {(() => {
                const isEarned = earnedBadges.includes(selectedBadge.id);
                const BIcon = selectedBadge.icon;

                return (
                  <>
                    <div className="flex justify-end">
                      <button 
                        onClick={() => setSelectedBadge(null)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full cursor-pointer"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-3 ${
                        isEarned 
                          ? 'bg-purple-100 dark:bg-purple-950/60 text-[#8B35E8] border border-purple-200' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}>
                        {isEarned ? <BIcon size={36} /> : <Lock size={32} />}
                      </div>

                      <span className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full ${
                        isEarned 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200' 
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200'
                      }`}>
                        {isEarned ? '✓ Unlocked Milestone' : '🔒 Locked Goal'}
                      </span>

                      <h3 className="text-lg font-black text-[#172033] dark:text-white mt-2">
                        {selectedBadge.name}
                      </h3>
                      <p className="text-xs text-[#718096] dark:text-slate-400 mt-1">
                        {selectedBadge.requirement}
                      </p>
                    </div>

                    <div className="pt-2">
                      {!isEarned ? (
                        <div className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs rounded-xl text-center border border-slate-200 dark:border-slate-700">
                          🔒 Complete milestone above to unlock
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedBadge(null)}
                          className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-[#172033] dark:text-white font-bold text-xs rounded-xl cursor-pointer active:scale-95 transition-colors"
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-[#13192b] text-[#172033] dark:text-white rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-left"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-black text-[#172033] dark:text-white">Settings</h3>
                <button 
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 max-h-[75vh] overflow-y-auto space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
                
                {/* Account info */}
                <div className="flex items-center justify-between pt-1">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Account</span>
                    <span className="text-[10px] text-[#718096] dark:text-slate-400 block truncate max-w-[190px]">{sessionUser}</span>
                  </div>
                  <button 
                    onClick={handleCopyEmail}
                    className="px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0 cursor-pointer active:scale-95"
                  >
                    {showCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                {/* Dark Mode */}
                <div className="pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isDarkMode ? <Moon size={15} className="text-purple-400" /> : <Sun size={15} className="text-amber-500" />}
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Dark Mode</span>
                  </div>
                  <button 
                    onClick={toggleTheme}
                    className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                      isDarkMode ? 'bg-[#8B35E8]' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                    aria-label="Toggle Dark Mode"
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.75 shadow-xs transition-transform ${
                      isDarkMode ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Interface Language */}
                <div className="pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe size={15} className="text-[#8B35E8]" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t('profile.language', 'Language')}</span>
                  </div>
                  <LanguageSelector variant="pill" />
                </div>

                {/* Lesson Music */}
                <div className="pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music size={15} className="text-emerald-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Music</span>
                  </div>
                  <button 
                    onClick={() => {
                      const nextState = !isMusicEnabled;
                      soundManager.setMusicEnabled(nextState);
                    }}
                    className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                      isMusicEnabled ? 'bg-[#8B35E8]' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.75 shadow-xs transition-transform ${
                      isMusicEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Study Reminders */}
                <div className="pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell size={15} className="text-sky-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Reminders</span>
                  </div>
                  <button 
                    onClick={() => {
                      setNotificationsEnabled(!notificationsEnabled);
                      soundManager.play('click');
                    }}
                    className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                      notificationsEnabled ? 'bg-[#8B35E8]' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.75 shadow-xs transition-transform ${
                      notificationsEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Private Profile */}
                <div className="pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield size={15} className="text-indigo-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Private Profile</span>
                  </div>
                  <button 
                    onClick={() => {
                      setPrivacyEnabled(!privacyEnabled);
                      soundManager.play('click');
                    }}
                    className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                      privacyEnabled ? 'bg-[#8B35E8]' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.75 shadow-xs transition-transform ${
                      privacyEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Clear Cache */}
                <div className="pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={15} className="text-amber-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Reset Cache</span>
                  </div>
                  <button 
                    onClick={handleClearCache}
                    className="px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 rounded-lg cursor-pointer active:scale-95"
                  >
                    {showCacheCleared ? 'Cleared!' : 'Reset'}
                  </button>
                </div>

                {/* School Admin */}
                {isSchoolAccount && schoolInfo && onOpenSchoolAdmin && (
                  <div className="pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 size={15} className="text-emerald-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">School Admin</span>
                    </div>
                    <button 
                      onClick={() => {
                        soundManager.play('complete');
                        setShowSettingsModal(false);
                        onOpenSchoolAdmin();
                      }}
                      className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                    >
                      Launch
                    </button>
                  </div>
                )}

                {/* Legal & Account Privacy Links */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <a
                    href="/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-sky-500"
                  >
                    <div className="flex items-center gap-2">
                      <Shield size={15} className="text-sky-500" />
                      <span>Privacy Policy</span>
                    </div>
                    <ChevronRight size={13} className="text-slate-400" />
                  </a>

                  <a
                    href="/delete-account"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-xs font-bold text-red-500 hover:text-red-600"
                  >
                    <div className="flex items-center gap-2">
                      <LogOut size={15} className="text-red-500" />
                      <span>Delete Account & Data</span>
                    </div>
                    <ChevronRight size={13} className="text-slate-400" />
                  </a>
                </div>

                {/* FAQ */}
                <div className="pt-3">
                  <div 
                    onClick={() => {
                      soundManager.play('click');
                      setActiveFAQ(activeFAQ === 1 ? null : 1);
                    }}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <HelpCircle size={15} className="text-slate-400" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">FAQ</span>
                    </div>
                    <ChevronRight size={13} className={`text-slate-400 transition-transform ${activeFAQ === 1 ? 'rotate-90' : ''}`} />
                  </div>
                  <AnimatePresence>
                    {activeFAQ === 1 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden text-[10px] text-slate-600 dark:text-slate-400 space-y-1.5 pt-2"
                      >
                        <p><strong>Q: How do I earn Cookies?</strong><br />A: Complete lessons and quizzes to collect cookies.</p>
                        <p><strong>Q: What does Level signify?</strong><br />A: Every 300 Cookies levels up your character.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Sign Out & Admin */}
                <div className="pt-3 space-y-2">
                  {isDbAdmin && (
                    <button 
                      onClick={() => {
                        soundManager.play('complete');
                        setShowSettingsModal(false);
                        setIsAdminActive(true);
                      }}
                      className="w-full py-2 px-3 bg-purple-50 dark:bg-purple-950/40 text-[#8B35E8] dark:text-purple-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Settings2 size={13} />
                      <span>Creator Database Controls</span>
                    </button>
                  )}

                  <button 
                    onClick={() => {
                      soundManager.play('click');
                      setShowSettingsModal(false);
                      setShowSignOutConfirm(true);
                    }}
                    className="w-full py-2 px-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
