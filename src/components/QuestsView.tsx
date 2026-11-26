import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, CheckCircle2, Cookie, Zap, Trophy, Flame, MousePointer2, Sparkles, X, Swords, Gift, BookOpen, Clock } from 'lucide-react';
import ChestIcon from './ui/ChestIcon';
import { soundManager } from '../lib/sounds';
import { useTranslation } from '../lib/translation/TranslationContext';
import cookiesIcon from '@/cookies.webp';
import CookieWheel from './CookieWheel';
import { rewardService, generateSpinReference } from '../lib/rewardService';
import { progressService } from '../lib/progressService';
import {
  fetchUserDailyActivityRecords,
  recordUserDailyActivity,
  subscribeToUserDailyActivity,
  UserDailyActivityRecord
} from '../lib/userDailyActivityService';
import {
  DAILY_QUESTS,
  DAILY_BONUS_QUEST,
  WEEKLY_QUESTS,
  QuestDefinition,
  QuestIconKey,
  QuestPeriod,
  getISTDateString,
  getISTWeekStart,
  isSameISTDay,
  msUntilISTMidnight,
  msUntilISTWeekEnd,
  formatCountdown,
  periodicClaimKey
} from '../lib/questConfig';

// Spin wheel rewards only award cookies and strictly do NOT increment weekly XP
export const SPIN_XP = 0;

const ICONS: Record<QuestIconKey, any> = {
  lesson: BookOpen,
  lessons: Target,
  practice: Swords,
  challenge: Zap,
  xp: Cookie,
  streak: Flame,
  bonus: Gift
};

interface QuestsViewProps {
  lastChestClaimedAt: string | null;
  onClaimGems: (amount: number, newBalance?: number) => void;
  onClaimChest?: () => Promise<any>;
  onQuestDetailsToggle?: (isOpen: boolean) => void;
  onNavigateTab?: (tab: string) => void;
}

function QuestsView({
  lastChestClaimedAt,
  onClaimGems,
  onClaimChest,
  onQuestDetailsToggle,
  onNavigateTab
}: QuestsViewProps) {
  const { t } = useTranslation();
  const [showCookieWheel, setShowCookieWheel] = useState(false);
  const [tab, setTab] = useState<QuestPeriod>('daily');
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
  const [now, setNow] = useState<number>(Date.now());

  // This view has no full-screen detail page anymore; keep parent flag cleared.
  useEffect(() => {
    onQuestDetailsToggle?.(false);
  }, [onQuestDetailsToggle]);

  // Ticking clock drives both the countdowns and the midnight rollover (todayKey/weekKey change).
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const todayKey = getISTDateString(new Date(now));
  const weekKey = getISTWeekStart(new Date(now));

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

  // Refetch on mount, whenever the IST day changes, on rewards, and on realtime activity updates.
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

  const todayRows = useMemo(() => rows.filter(r => String(r.activity_date).slice(0, 10) === todayKey), [rows, todayKey]);
  const weekRows = useMemo(() => rows.filter(r => String(r.activity_date).slice(0, 10) >= weekKey), [rows, weekKey]);

  const isKeyClaimed = (key: string) =>
    claimedKeys.includes(key) ||
    claimedKeys.includes(`quest_${key}`) ||
    rewardService.isClaimed(`quest_${key}`) ||
    rewardService.isClaimed(key);

  // Daily chest now resets at IST midnight (same as spin wheel & quests).
  const isChestClaimed = isSameISTDay(lastChestClaimedAt, new Date(now));
  const chestTimeLeft = formatCountdown(msUntilISTMidnight(now));
  const periodTimeLeft = formatCountdown(tab === 'daily' ? msUntilISTMidnight(now) : msUntilISTWeekEnd(now));

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

  const claim = async (q: Omit<QuestDefinition, 'progress'>) => {
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
          daily_cap_reached: "Daily cookie limit reached. Try again after midnight.",
          daily_limit_for_type: "Daily quest claim limit reached. Try again tomorrow.",
          unknown_claim: "This quest can't be claimed right now."
        };
        setClaimError(msgs[res.reason || ''] || "Couldn't claim this reward. Please try again.");
        setTimeout(() => setClaimError(null), 4000);
      }
    } finally {
      setClaimingKey(null);
    }
  };

  const dailyClaimedCount = DAILY_QUESTS.filter(q => isKeyClaimed(periodicClaimKey(q, new Date(now)))).length;
  const bonusQuest = { ...DAILY_BONUS_QUEST };

  const renderQuest = (q: Omit<QuestDefinition, 'progress'>, current: number, idx: number) => {
    const key = periodicClaimKey(q, new Date(now));
    const claimed = isKeyClaimed(key);
    const current_ = Math.min(current, q.target);
    const ready = current >= q.target && !claimed;
    const pct = Math.min(100, (current_ / q.target) * 100);
    const Icon = ICONS[q.icon];

    return (
      <motion.div
        layout
        key={key}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.06 }}
        className={`relative overflow-hidden glass-panel p-5 flex flex-col gap-3.5 border border-white/60 dark:border-[rgba(226,232,240,0.14)] dark:bg-[#172033]/90 ${
          claimed ? 'border-[#10b981]/30 bg-emerald-50/10 dark:bg-emerald-950/20' : ready ? 'border-amber-400/40 bg-amber-50/10 dark:bg-amber-950/20' : ''
        }`}
      >
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-white ${
              claimed ? 'bg-[#10b981]' : ready ? 'bg-amber-500 animate-pulse' : q.color
            }`}>
              {claimed ? <CheckCircle2 size={24} /> : Icon === Cookie
                ? <img src={cookiesIcon} alt="XP" className="w-6 h-6 object-contain" />
                : <Icon size={24} />}
            </div>
            <div className="min-w-0 text-left">
              <h4 className="font-bold text-base text-slate-900 dark:text-white leading-tight truncate">{q.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{q.description}</p>
            </div>
          </div>
          <div className="text-right shrink-0 space-y-1">
            <div className="flex items-center gap-1.5 justify-end">
              <img src={cookiesIcon} alt="Cookies" className="w-4 h-4 object-contain" />
              <p className="text-base font-bold text-amber-600 dark:text-amber-400 font-mono leading-none">+{q.rewardCookies}</p>
            </div>
            <p className="text-[11px] font-bold text-indigo-500 dark:text-indigo-300 font-mono leading-none">+{q.rewardXp} XP</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center px-0.5">
            <span className={`text-xs font-semibold ${claimed ? 'text-[#10b981]' : ready ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}`}>
              {current_} / {q.target}
            </span>
            {claimed && <span className="text-xs font-semibold text-[#10b981]">Claimed ✓</span>}
          </div>
          <div className="h-2.5 w-full bg-slate-200/50 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ type: 'spring', stiffness: 50, damping: 15 }}
              className={`h-full rounded-full ${claimed ? 'bg-[#10b981]' : ready ? 'bg-amber-500' : q.color}`}
            />
          </div>
        </div>

        {ready && (
          <button
            disabled={claimingKey === key}
            onClick={() => claim(q)}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black py-3 rounded-2xl text-sm uppercase tracking-wider shadow-[0_4px_0_#047857] active:translate-y-1 active:shadow-none transition-all cursor-pointer disabled:opacity-60"
          >
            Claim +{q.rewardCookies} 🍪 +{q.rewardXp} XP
          </button>
        )}
        {!ready && !claimed && onNavigateTab && (
          <button
            onClick={() => { soundManager.play('click'); onNavigateTab(q.icon === 'practice' ? 'practice' : 'learn'); }}
            className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline text-left cursor-pointer"
          >
            {q.icon === 'practice' ? 'Go to Practice Arena →' : 'Go to Lessons →'}
          </button>
        )}
      </motion.div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="pt-28 px-6 pb-28 space-y-8 max-w-md mx-auto h-full overflow-y-auto scrollbar-hide"
    >
      {/* Daily Reward Section */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl border-b-4 border-amber-900 group cursor-pointer"
      >
        <div className="relative z-10 flex flex-col items-center text-center gap-4">
          <motion.div
            animate={{ 
              rotate: isChestClaimed ? 0 : [0, -5, 5, -5, 0],
              scale: isChestClaimed ? 1 : [1, 1.1, 1]
            }}
            transition={{ repeat: isChestClaimed ? 0 : Infinity, duration: 4 }}
          >
            <ChestIcon isCurrent={!isChestClaimed} isOpen={isChestClaimed} className="w-24 h-24 mb-2 drop-shadow-2xl" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-display font-black leading-tight">{t('quests.daily_chest', 'Daily Mystery Chest')}</h2>
            <p className="text-amber-100/80 text-sm font-medium">
              {isChestClaimed ? t('quests.come_back_tomorrow', 'Come back tomorrow for a new chest') : t('quests.chest_reward_desc', 'Open your daily cosmic chest for surprise Cookies and XP!')}
            </p>
          </div>
          <button 
            disabled={isChestClaimed}
            onClick={async () => {
              if (!isChestClaimed) {
                if (onClaimChest) {
                  await onClaimChest();
                } else {
                  const res = await rewardService.claimDailyChest(50);
                  if (res.granted) {
                    onClaimGems(50, res.newBalance);
                    soundManager.play('complete');
                  }
                }
              }
            }}
            className={`px-8 py-3.5 rounded-2xl font-display font-black text-base uppercase tracking-wider transition-all w-full select-none ${
              isChestClaimed 
                ? 'bg-amber-800/40 text-amber-400 cursor-not-allowed border-2 border-amber-900/45' 
                : 'bg-white dark:bg-[#243149] text-amber-700 dark:text-amber-300 shadow-[0_4px_0_#d1d5db] dark:shadow-[0_4px_0_#172033] active:translate-y-1 active:shadow-none'
            }`}
          >
            {isChestClaimed ? (
              <div className="flex flex-col items-center justify-center leading-tight">
                <span className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold mb-0.5">Resets At Midnight In</span>
                <span className="text-lg font-black font-mono text-white tracking-widest">{chestTimeLeft}</span>
              </div>
            ) : (
              `${t('common.claim', 'Claim')} 50 ${t('header.cookies', 'Cookies')}`
            )}
          </button>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] -z-0 pointer-events-none animate-pulse" />
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Trophy size={80} />
        </div>
      </motion.div>

      {/* Lucky Cookie Wheel High-Impact Banner Card */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          soundManager.play('click');
          setShowCookieWheel(true);
        }}
        className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 rounded-[2.5rem] p-7 text-white relative overflow-hidden shadow-2xl border-2 border-amber-400/50 group cursor-pointer"
      >
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="space-y-2 text-left min-w-0 flex-1">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-widest font-mono">
              <Sparkles size={12} className="animate-spin text-amber-400" />
              <span>AAA LUCKY SPIN</span>
            </div>
            <h2 className="text-2xl font-display font-black leading-tight text-white">
              Cookie Wheel 🍪
            </h2>
            <p className="text-amber-200/80 text-xs font-semibold">
              Spin to win up to 1,000 Cookie rewards & bonus multipliers!
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundManager.play('click');
                  setShowCookieWheel(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black font-display text-xs uppercase tracking-wider shadow-[0_4px_12px_rgba(245,158,11,0.4)] group-hover:brightness-110 cursor-pointer"
              >
                SPIN WHEEL NOW <Sparkles size={14} />
              </button>
            </div>
          </div>

          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 relative flex items-center justify-center p-2 rounded-full bg-gradient-to-tr from-amber-500/30 to-purple-500/30 border-2 border-amber-400/40 shadow-inner"
          >
            <img src={cookiesIcon} alt="Cookie Wheel" className="w-16 h-16 object-contain drop-shadow-xl" />
          </motion.div>
        </div>

        {/* Atmosphere ambient background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </motion.div>

      {/* COOKIE WHEEL POPUP MODAL */}
      <AnimatePresence>
        {showCookieWheel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className="relative w-full max-w-lg bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-amber-400/60 shadow-[0_25px_60px_rgba(0,0,0,0.8)] my-auto"
            >
              {/* Close Modal Button */}
              <button
                type="button"
                onClick={() => setShowCookieWheel(false)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition-colors z-50 cursor-pointer"
              >
                <X size={20} />
              </button>

              <CookieWheel
                title="AAA Lucky Spin"
                subtitle="Spin to win bonus rewards!"
                showInternalModal={true}
                onClaimReward={async (amount) => {
                  const spinRef = generateSpinReference();
                  // Wheel rewards only award cookies and strictly do NOT increment weekly XP (SPIN_XP = 0)
                  const claimRes = await rewardService.claimWheelSpin(spinRef, amount);
                  if (claimRes.granted) {
                    onClaimGems(amount, claimRes.newBalance);
                    soundManager.play('complete');
                  }
                  setShowCookieWheel(false);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DAILY / WEEKLY QUEST SECTIONS */}
      <div className="space-y-4">
        <div className="flex p-1 rounded-2xl bg-slate-200/60 dark:bg-slate-800/80 gap-1">
          {(['daily', 'weekly'] as QuestPeriod[]).map(p => (
            <button
              key={p}
              onClick={() => { soundManager.play('click'); setTab(p); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all cursor-pointer ${
                tab === p
                  ? 'bg-white dark:bg-[#243149] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {p === 'daily' ? 'Daily' : 'Weekly'}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {tab === 'daily' ? "Today's Quests" : "This Week's Quests"}
          </h3>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold font-mono text-slate-500 dark:text-slate-400">
            <Clock size={13} /> {periodTimeLeft}
          </span>
        </div>

        {claimError && (
          <div className="px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold">
            {claimError}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {tab === 'daily' ? (
              <>
                {DAILY_QUESTS.map((q, i) => renderQuest(q, q.progress(todayRows), i))}
                {renderQuest(bonusQuest, dailyClaimedCount, DAILY_QUESTS.length)}
              </>
            ) : (
              WEEKLY_QUESTS.map((q, i) => renderQuest(q, q.progress(weekRows), i))
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default memo(QuestsView);
