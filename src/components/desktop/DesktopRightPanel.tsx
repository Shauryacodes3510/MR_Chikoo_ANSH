import React, { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Sparkles, 
  Target, 
  Gift, 
  Flame, 
  Heart, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  Zap,
  ArrowRight,
  Cookie
} from 'lucide-react';
import ChestIcon from '../ui/ChestIcon';
import { LanguageSelector } from '../LanguageSelector';
import { useTranslation } from '../../lib/translation/TranslationContext';
import { soundManager } from '../../lib/sounds';
import { rewardService } from '../../lib/rewardService';
import { progressService } from '../../lib/progressService';
import {
  fetchUserDailyActivityRecords,
  recordUserDailyActivity,
  subscribeToUserDailyActivity,
  UserDailyActivityRecord
} from '../../lib/userDailyActivityService';
import {
  DAILY_QUESTS,
  WEEKLY_QUESTS,
  DAILY_BONUS_QUEST,
  getISTDateString,
  getISTWeekStart,
  isSameISTDay,
  msUntilISTMidnight,
  formatCountdown,
  periodicClaimKey
} from '../../lib/questConfig';

// WebP icons
import cookiesIcon from '@/cookies.webp';
import streakIcon from '@/streak.webp';

interface DesktopRightPanelProps {
  gems: number;
  streak: number;
  energy: number;
  xp?: number;
  weeklyXp?: number;
  userRank?: number;
  leaderboardData?: Array<{
    id: string;
    name: string;
    xp: number;
    weekly_xp?: number;
    rank?: number;
    isCurrentUser?: boolean;
  }>;
  accuracy?: number;
  completedCount?: number;
  bestAnswerStreak?: number;
  lastChestClaimedAt: string | null;
  onClaimGems: (amount: number, newBalance?: number) => void;
  onClaimChest?: () => Promise<any>;
  setView: (view: any) => void;
  onOpenCookieWheel: () => void;
  onRefillEnergy?: () => void;
  className?: string;
}

export const DesktopRightPanel = memo(function DesktopRightPanel({
  gems,
  streak,
  energy,
  xp = 0,
  weeklyXp,
  userRank,
  leaderboardData = [],
  accuracy = 0.85,
  completedCount = 0,
  bestAnswerStreak = 0,
  lastChestClaimedAt,
  onClaimGems,
  onClaimChest,
  setView,
  onOpenCookieWheel,
  onRefillEnergy,
  className = ''
}: DesktopRightPanelProps) {
  const { t } = useTranslation();
  // 1. CHEST STATUS — same IST-midnight reset as QuestsView, so both screens always agree
  const [now, setNow] = useState<number>(Date.now());
  const [isClaimingChest, setIsClaimingChest] = useState<boolean>(false);

  // One ticking clock drives the chest timer AND the midnight rollover of the quests
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const isClaimed = isSameISTDay(lastChestClaimedAt, new Date(now));
  const timeLeft = formatCountdown(msUntilISTMidnight(now));

  const handleChestClick = async () => {
    if (isClaimed || isClaimingChest) return;
    try {
      setIsClaimingChest(true);
      soundManager.play('click');
      if (onClaimChest) {
        await onClaimChest();
      } else {
        const res = await rewardService.claimDailyChest(50);
        if (res.granted) {
          onClaimGems(50, res.newBalance);
        }
      }
    } catch (err) {
      console.error('Failed to claim chest:', err);
    } finally {
      setIsClaimingChest(false);
    }
  };

  // 2. REAL DAILY QUESTS — same data source as QuestsView (user_daily_activity rows + claim keys)
  const [rows, setRows] = useState<UserDailyActivityRecord[]>([]);
  const [claimedKeys, setClaimedKeys] = useState<string[]>(() => {
    const prof = progressService.getProfile();
    const profId = prof?.id || prof?.email;
    const fromProfile = prof?.claimed_rewards || [];
    let fromStorage: string[] = [];
    if (profId && typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(`CHIKOO_CLAIMED_QUEST_KEYS_${profId}`);
        if (raw) fromStorage = JSON.parse(raw);
      } catch (_) {}
    }
    return Array.from(new Set([...fromProfile, ...fromStorage]));
  });
  const [claimingKey, setClaimingKey] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  const todayKey = getISTDateString(new Date(now));

  const loadRows = useCallback(async () => {
    const prof = progressService.getProfile();
    const userId = prof?.id || prof?.email;
    if (userId && typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(`CHIKOO_CLAIMED_QUEST_KEYS_${userId}`);
        const fromStorage: string[] = raw ? JSON.parse(raw) : [];
        const fromProfile: string[] = prof?.claimed_rewards || [];
        setClaimedKeys(prev => Array.from(new Set([...prev, ...fromStorage, ...fromProfile])));
      } catch (_) {}
    }
    const data = await fetchUserDailyActivityRecords(prof?.id, 8);
    setRows(data);
  }, []);

  // Refetch on mount, when the IST day changes, after any reward, and on realtime activity updates
  useEffect(() => { loadRows(); }, [loadRows, todayKey]);

  useEffect(() => {
    const onReward = () => { loadRows(); };
    window.addEventListener('chikooRewardGranted', onReward);
    const userId = progressService.getProfile()?.id;
    const unsub = userId ? subscribeToUserDailyActivity(userId, () => { loadRows(); }) : null;
    return () => {
      window.removeEventListener('chikooRewardGranted', onReward);
      unsub?.();
    };
  }, [loadRows]);

  const todayRows = useMemo(
    () => rows.filter(r => String(r.activity_date).slice(0, 10) === todayKey),
    [rows, todayKey]
  );

  const isKeyClaimed = (key: string) =>
    claimedKeys.includes(key) ||
    claimedKeys.includes(`quest_${key}`) ||
    rewardService.isClaimed(`quest_${key}`) ||
    rewardService.isClaimed(key);

  const persistClaimedKey = (key: string) => {
    const fullKey = key.startsWith('quest_') ? key : `quest_${key}`;
    const bareKey = key.replace(/^quest_/, '');
    setClaimedKeys(prev => Array.from(new Set([...prev, key, fullKey, bareKey])));
    const prof = progressService.getProfile();
    const profId = prof?.id || prof?.email;
    if (profId && typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(`CHIKOO_CLAIMED_QUEST_KEYS_${profId}`);
        const list: string[] = raw ? JSON.parse(raw) : [];
        const next = Array.from(new Set([...list, key, fullKey, bareKey]));
        localStorage.setItem(`CHIKOO_CLAIMED_QUEST_KEYS_${profId}`, JSON.stringify(next));
      } catch (_) {}
    }
  };

  const claimQuest = async (q: (typeof DAILY_QUESTS)[number]) => {
    const key = periodicClaimKey(q, new Date(now));
    if (claimingKey || isKeyClaimed(key)) return;
    setClaimingKey(key);
    try {
      const res = await rewardService.claimQuest(key, q.rewardCookies, q.rewardXp);
      if (res.granted) {
        soundManager.play('complete');
        onClaimGems(q.rewardCookies, res.newBalance);
        persistClaimedKey(key);
        const xpUpdates: any = {};
        if (res.xp !== undefined) xpUpdates.xp = res.xp;
        if (res.weekly_xp !== undefined) xpUpdates.weekly_xp = res.weekly_xp;
        if (Object.keys(xpUpdates).length) progressService.updateProfileLocally(xpUpdates);
        try { await recordUserDailyActivity({ questsDelta: 1, userId: progressService.getProfile()?.id }); } catch (_) {}
      } else if (res.alreadyClaimed) {
        persistClaimedKey(key);
      } else {
        const msgs: Record<string, string> = {
          daily_cap_reached: 'Daily cookie limit reached. Try again after midnight.',
          daily_limit_for_type: 'Daily quest claim limit reached. Try again tomorrow.',
          unknown_claim: "This quest can't be claimed right now."
        };
        setClaimError(msgs[res.reason || ''] || "Couldn't claim this reward. Please try again.");
        setTimeout(() => setClaimError(null), 4000);
      }
    } finally {
      setClaimingKey(null);
    }
  };

  const weekKey = getISTWeekStart(new Date(now));
  const weekRows = useMemo(
    () => rows.filter(r => String(r.activity_date).slice(0, 10) >= weekKey),
    [rows, weekKey]
  );

  // Daily quests mapping
  const dailyQuests = useMemo(() => {
    return DAILY_QUESTS.map(q => {
      const key = periodicClaimKey(q, new Date(now));
      const claimed = isKeyClaimed(key);
      const current = Math.min(q.target, q.progress(todayRows));
      const ready = !claimed && current >= q.target;
      return { q, key, claimed, current, ready, period: 'daily' as const };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayRows, claimedKeys, todayKey, now]);

  const claimedDailyCount = useMemo(() => dailyQuests.filter(x => x.claimed).length, [dailyQuests]);
  const allDailyDone = claimedDailyCount >= DAILY_QUESTS.length;

  // Bonus quest ("Perfect Day")
  const bonusQuestItem = useMemo(() => {
    const key = periodicClaimKey(DAILY_BONUS_QUEST as any, new Date(now));
    const claimed = isKeyClaimed(key);
    const current = claimedDailyCount;
    const ready = allDailyDone && !claimed;
    return {
      q: { ...DAILY_BONUS_QUEST, progress: () => current },
      key,
      claimed,
      current,
      ready,
      period: 'bonus' as const
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimedDailyCount, allDailyDone, claimedKeys, now]);

  // Weekly quests mapping
  const weeklyQuests = useMemo(() => {
    return WEEKLY_QUESTS.map(q => {
      const key = periodicClaimKey(q, new Date(now));
      const claimed = isKeyClaimed(key);
      const current = Math.min(q.target, q.progress(weekRows));
      const ready = !claimed && current >= q.target;
      return { q, key, claimed, current, ready, period: 'weekly' as const };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekRows, claimedKeys, now]);

  const claimedWeeklyCount = useMemo(() => weeklyQuests.filter(x => x.claimed).length, [weeklyQuests]);

  // Window of at most 3 missions:
  // - Completed/claimed quests are removed from the active view with exit animation
  // - Ready to claim quests appear first
  // - Once daily quests are completed, weekly quests slide in to fill the 3 slots
  const visibleQuests = useMemo(() => {
    const unclaimedDaily = dailyQuests.filter(x => !x.claimed);
    const unclaimedBonus = allDailyDone && !bonusQuestItem.claimed ? [bonusQuestItem] : [];
    const unclaimedWeekly = weeklyQuests.filter(x => !x.claimed);

    const pool = [...unclaimedDaily, ...unclaimedBonus, ...unclaimedWeekly];

    const sorted = [...pool].sort((a, b) => {
      if (a.ready && !b.ready) return -1;
      if (!a.ready && b.ready) return 1;
      return 0;
    });

    return sorted.slice(0, 3);
  }, [dailyQuests, allDailyDone, bonusQuestItem, weeklyQuests]);

  // 3. FEATURED STORE ITEMS SPOTLIGHT
  const featuredRewards = [
    {
      id: 'macbook-pro',
      title: 'Apple MacBook Pro M3',
      price: 12000,
      tag: 'Tech Hardware',
      bgGradient: 'from-slate-900 to-slate-800',
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'chatgpt-plus',
      title: 'ChatGPT Plus (1 Month)',
      price: 1800,
      tag: 'AI Tools',
      bgGradient: 'from-emerald-900 to-teal-800',
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'smart-watch',
      title: 'Galaxy Smart Watch Ultra',
      price: 4500,
      tag: 'Wearables',
      bgGradient: 'from-indigo-950 to-blue-900',
      badgeColor: 'bg-indigo-100 text-indigo-800'
    }
  ];

  return (
    <aside
      aria-label="Rewards and Quests Sidebar"
      className={`flex flex-col h-full bg-white dark:bg-[#0c101d] select-none border-l border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 z-20 overflow-y-auto scrollbar-hide ${className}`}
    >
      <div className="p-4.5 space-y-5">
        {/* 1. TOP PLAYER HUD & STATUS PILLS */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {t('quests.title', 'Player Stats')} & {t('settings.language', 'Language')}
            </div>
            <LanguageSelector variant="compact" />
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {/* Cookies Pill */}
            <div 
              onClick={() => {
                soundManager.play('click');
                setView('rewards_store');
              }}
              className="p-2 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 hover:border-amber-300 dark:hover:border-amber-600 transition-all cursor-pointer group flex flex-col items-center justify-center text-center shadow-xs hover:shadow-sm"
              title="Click to visit Rewards Store"
            >
              <img 
                src={cookiesIcon} 
                alt="Cookies" 
                className="w-5 h-5 sm:w-6 sm:h-6 object-contain mb-1 group-hover:scale-110 transition-transform duration-150"
              />
              <span className="font-display font-black text-xs text-amber-900 dark:text-amber-200 leading-tight">
                {gems.toLocaleString()}
              </span>
              <span className="text-[9px] font-bold text-amber-700/80 dark:text-amber-400 uppercase tracking-tight">
                {t('common.cookies', 'Cookies')}
              </span>
            </div>

            {/* Weekly XP / XP Pill (Competitive League Progress - Zap Icon, distinct from Cookies) */}
            <div 
              onClick={() => {
                soundManager.play('click');
                setView('leaderboard');
              }}
              className="p-2 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all cursor-pointer group flex flex-col items-center justify-center text-center shadow-xs hover:shadow-sm"
              title="Click to view Cosmic Leaderboard"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-1 group-hover:scale-110 transition-transform duration-150">
                <Zap size={13} className="fill-indigo-500 text-indigo-500" />
              </div>
              <span className="font-display font-black text-xs text-indigo-900 dark:text-indigo-200 leading-tight">
                {(weeklyXp !== undefined ? weeklyXp : xp).toLocaleString()}
              </span>
              <span className="text-[9px] font-bold text-indigo-700/80 dark:text-indigo-400 uppercase tracking-tight">
                {weeklyXp !== undefined ? t('common.weekly_xp', 'Weekly XP') : t('common.xp', 'XP')}
              </span>
            </div>

            {/* Streak Pill */}
            <div className="p-2 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 transition-all flex flex-col items-center justify-center text-center shadow-xs">
              <img 
                src={streakIcon} 
                alt="Streak" 
                className="w-5 h-5 sm:w-6 sm:h-6 object-contain mb-1"
              />
              <span className="font-display font-black text-xs text-rose-900 dark:text-rose-200 leading-tight">
                {streak} {streak === 1 ? t('common.day', 'Day') : t('common.days', 'Days')}
              </span>
              <span className="text-[9px] font-bold text-rose-700/80 dark:text-rose-400 uppercase tracking-tight">
                {t('common.streak', 'Streak')}
              </span>
            </div>

            {/* Energy / Lives Pill */}
            <div 
              onClick={() => onRefillEnergy?.()}
              role="button"
              tabIndex={0}
              title="Click to view or refill hearts"
              className="p-2 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 transition-all flex flex-col items-center justify-center text-center shadow-xs cursor-pointer hover:scale-105 active:scale-95 group"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-1 group-hover:scale-110 transition-transform">
                <Heart size={13} className="fill-rose-500 text-rose-500" />
              </div>
              <span className="font-display font-black text-xs text-rose-900 dark:text-rose-200 leading-tight">
                {Math.min(5, Math.ceil(energy / 5))}/5
              </span>
              <span className="text-[9px] font-bold text-rose-700/80 dark:text-rose-400 uppercase tracking-tight">
                {t('common.hearts', 'Hearts')}
              </span>
            </div>
          </div>
        </div>

        {/* CHEST + QUESTS ORDER: unclaimed -> big chest first. Claimed -> quests first, chest shrinks to a strip. */}
        {!isClaimed && (
        <div className="relative rounded-3xl p-4.5 bg-gradient-to-br from-amber-50 via-amber-50/50 to-orange-50/30 dark:from-[#243149] dark:via-[#1e293b] dark:to-[#172033] border-2 border-amber-200/70 dark:border-amber-500/30 shadow-sm overflow-hidden text-center">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            {/* Chest Graphic */}
            <div className="mb-2">
              <ChestIcon
                className="w-16 h-16 drop-shadow-md"
                isCurrent={!isClaimed}
                isOpen={false}
              />
            </div>

            <h3 className="font-display font-black text-slate-800 dark:text-slate-100 text-base leading-tight mb-0.5">
              {t('quests.daily_chest', 'Daily Mystery Chest')}
            </h3>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-3 max-w-[220px]">
              {isClaimed
                ? t('quests.claimed_desc', 'Treasure claimed for today! Check back tomorrow.')
                : t('quests.claim_desc', 'Unlock your daily bounty to win 50 bonus cookies!')}
            </p>

            {/* Button / Timer */}
            {isClaimed ? (
              <div className="w-full py-2.5 px-3 rounded-xl bg-amber-100/70 border border-amber-200 text-amber-800 flex items-center justify-center gap-1.5 text-xs font-black">
                <Clock size={13} className="text-amber-600" />
                <span>{t('quests.next_in', 'Next in {time}', { time: timeLeft || '24h' })}</span>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleChestClick}
                disabled={isClaimingChest}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 active:from-amber-700 text-white font-display font-black text-xs uppercase tracking-wider shadow-[0_3px_10px_rgba(245,158,11,0.28)] hover:shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles size={14} className="text-yellow-200 animate-pulse" />
                <span>{t('quests.claim_button', 'Claim 50 Cookies 🍪')}</span>
              </motion.button>
            )}
          </div>
        </div>

        )}

        {/* 4. ACTIVE QUESTS (Window of max 3 missions, auto-backfilled by weekly quests) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Target size={15} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              <h3 className="font-display font-black text-sm text-slate-800 dark:text-white">
                {allDailyDone ? t('quests.weekly_quests', 'Weekly Quests') : t('quests.daily_quests', 'Daily Quests')}
              </h3>
              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-black font-mono text-slate-500 dark:text-slate-300">
                {allDailyDone
                  ? `${claimedWeeklyCount}/${WEEKLY_QUESTS.length}`
                  : `${claimedDailyCount}/${DAILY_QUESTS.length}`}
              </span>
            </div>

            <button
              onClick={() => {
                soundManager.play('click');
                setView('quests');
              }}
              className="min-h-[44px] px-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-0.5 cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <span>{t('quests.view_all', 'View All')}</span>
              <ChevronRight size={12} aria-hidden="true" />
            </button>
          </div>

          {claimError && (
            <p role="alert" className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 px-1">
              {claimError}
            </p>
          )}

          <div className="space-y-2 relative">
            <AnimatePresence mode="popLayout" initial={false}>
              {visibleQuests.length > 0 ? (
                visibleQuests.map(({ q, key, current, ready, period }) => {
                  const percent = Math.min(100, Math.round((current / q.target) * 100));
                  return (
                    <motion.div
                      layout
                      key={key}
                      initial={{ opacity: 0, y: 16, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, y: -16, transition: { duration: 0.25 } }}
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      className={`p-3 rounded-2xl border flex flex-col gap-2 transition-colors duration-200 ${
                        ready
                          ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300/70 dark:border-amber-600/40 shadow-xs'
                          : 'bg-slate-50 dark:bg-[#172033] border-slate-200/70 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-[#1c273e]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${ready ? 'bg-amber-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-display font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                                {q.title}
                              </span>
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded leading-none ${
                                period === 'weekly'
                                  ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                                  : period === 'bonus'
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                  : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                              }`}>
                                {period === 'weekly' ? 'Weekly' : period === 'bonus' ? 'Bonus' : 'Daily'}
                              </span>
                            </div>
                            <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                              {q.description}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 font-mono leading-tight">
                          <div className="text-[10px] font-black text-amber-800 dark:text-amber-300">+{q.rewardCookies} 🍪</div>
                          <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-300">+{q.rewardXp} XP</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div
                          className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden"
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={q.target}
                          aria-valuenow={current}
                          aria-label={q.title}
                        >
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              ready ? 'bg-amber-500' : period === 'weekly' ? 'bg-purple-500' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono shrink-0">
                          {current}/{q.target}
                        </span>
                      </div>

                      {ready && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={claimingKey === key}
                          onClick={() => claimQuest(q)}
                          className="w-full min-h-[40px] rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-display font-black text-xs uppercase tracking-wider shadow-[0_3px_0_#047857] active:translate-y-0.5 active:shadow-none transition-all duration-150 cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 flex items-center justify-center gap-1.5"
                        >
                          <Sparkles size={13} className="text-emerald-100" />
                          <span>{claimingKey === key ? 'Claiming...' : `Claim +${q.rewardCookies} 🍪 +${q.rewardXp} XP`}</span>
                        </motion.button>
                      )}
                    </motion.div>
                  );
                })
              ) : (
                <motion.div
                  key="all-cleared"
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-emerald-50/30 dark:from-emerald-950/30 dark:via-[#1e293b] dark:to-[#172033] border-2 border-emerald-300/60 dark:border-emerald-600/40 text-center space-y-1.5 shadow-xs"
                >
                  <div className="w-9 h-9 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-300">
                    <CheckCircle2 size={20} />
                  </div>
                  <h4 className="font-display font-black text-xs text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                    All Missions Completed! 🎉
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Awesome job! Check back at midnight for fresh daily quests.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {isClaimed && (
        <div className="flex items-center gap-3 rounded-2xl p-2.5 bg-amber-50/70 dark:bg-[#243149] border border-amber-200/80 dark:border-amber-500/30">
          <ChestIcon className="w-10 h-10 shrink-0" isCurrent={false} isOpen={true} />
          <div className="min-w-0 flex-1 text-left">
            <h3 className="font-display font-black text-xs text-slate-800 dark:text-slate-100 leading-tight truncate">
              {t('quests.daily_chest', 'Daily Mystery Chest')}
            </h3>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
              {t('quests.claimed_short', 'Claimed today ✓')}
            </p>
          </div>
          <div className="flex items-center gap-1 px-2.5 min-h-[32px] rounded-xl bg-amber-100/80 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-[11px] font-black font-mono shrink-0">
            <Clock size={12} aria-hidden="true" />
            <span>{timeLeft}</span>
          </div>
        </div>

        )}

        {/* 3. LUCKY COOKIE WHEEL BANNER */}
        <div className="relative rounded-3xl p-4 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 border border-indigo-400/30 text-white shadow-sm overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-sky-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] font-black tracking-widest uppercase font-mono mb-1">
                <Sparkles size={10} className="text-amber-300" />
                <span>AAA LUCKY SPIN</span>
              </div>
              <h4 className="font-display font-black text-sm text-white leading-tight">
                {t('rewards.wheel_title', 'Cookie Wheel 🎡')}
              </h4>
              <p className="text-[10px] text-indigo-200/80 font-medium truncate mt-0.5">
                {t('rewards.wheel_desc', 'Spin & win up to 250 Cookies!')}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                soundManager.play('click');
                onOpenCookieWheel();
              }}
              className="py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-black text-[11px] uppercase tracking-wider shrink-0 cursor-pointer shadow-md transition-all"
            >
              {t('rewards.spin_button', 'Spin Now')}
            </motion.button>
          </div>
        </div>

        {/* 4. WEEKLY LEAGUE / MINI-LEADERBOARD PREVIEW */}
        {leaderboardData && leaderboardData.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Trophy size={15} className="text-amber-500" />
                <h3 className="font-display font-black text-sm text-slate-800 dark:text-white">
                  {t('leaderboard.weekly_league', 'Weekly League')}
                </h3>
              </div>

              <button
                onClick={() => {
                  soundManager.play('click');
                  setView('leaderboard');
                }}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-0.5 cursor-pointer"
              >
                <span>{t('quests.view_all', 'View All')}</span>
                <ChevronRight size={12} />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#172033] border border-slate-200/70 dark:border-slate-800 space-y-1.5">
              {leaderboardData.slice(0, 3).map((player, idx) => {
                const playerXp = Number(player.weekly_xp !== undefined ? player.weekly_xp : (player.xp ?? 0));
                const rankNumber = player.rank || idx + 1;
                return (
                  <div
                    key={player.id || `mini-rank-${idx}`}
                    className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl transition-colors ${
                      player.isCurrentUser ? 'bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-600/40' : 'hover:bg-slate-100/60 dark:hover:bg-[#1f2b45]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        rankNumber === 1
                          ? 'bg-amber-400 text-slate-950 shadow-2xs'
                          : rankNumber === 2
                          ? 'bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-100'
                          : rankNumber === 3
                          ? 'bg-amber-700/80 text-amber-100'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {rankNumber}
                      </span>
                      <span className="font-display font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                        {player.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                      <Zap size={11} className="fill-amber-500 text-amber-500" />
                      <span>{playerXp.toLocaleString()} XP</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. REWARDS STORE SPOTLIGHT */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Gift size={15} className="text-purple-600 dark:text-purple-400" />
              <h3 className="font-display font-black text-sm text-slate-800 dark:text-white">
                {t('rewards.title', 'Rewards Vault')}
              </h3>
            </div>

            <button
              onClick={() => {
                soundManager.play('click');
                setView('rewards_store');
              }}
              className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-0.5 cursor-pointer"
            >
              <span>{t('rewards.visit_store', 'Visit Store')}</span>
              <ChevronRight size={12} />
            </button>
          </div>

          <div className="space-y-2">
            {featuredRewards.map((reward, rIdx) => (
              <div
                key={`featured-reward-${reward.id || 'rew'}-${rIdx}`}
                onClick={() => {
                  soundManager.play('click');
                  setView('rewards_store');
                }}
                className="group p-3 rounded-2xl bg-slate-50 dark:bg-[#172033] hover:bg-purple-50/50 dark:hover:bg-[#1f2b45] border border-slate-200/70 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-500/40 transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wider ${reward.badgeColor}`}>
                      {reward.tag}
                    </span>
                  </div>
                  <h4 className="font-display font-black text-xs text-slate-800 dark:text-slate-100 truncate group-hover:text-purple-900 dark:group-hover:text-purple-300 transition-colors">
                    {reward.title}
                  </h4>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-display font-black text-xs text-amber-600 flex items-center gap-0.5 justify-end">
                    <span>{reward.price.toLocaleString()}</span>
                    <span>🍪</span>
                  </div>
                  <span className="text-[9px] font-semibold text-slate-400 group-hover:text-purple-600 transition-colors flex items-center gap-0.5 justify-end">
                    <span>{t('rewards.inspect', 'Inspect')}</span>
                    <ArrowRight size={10} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
});
