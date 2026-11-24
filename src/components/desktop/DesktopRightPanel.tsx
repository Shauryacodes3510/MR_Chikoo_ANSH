import React, { memo, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
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

// WebP icons
import cookiesIcon from '@/cookies.webp';
import streakIcon from '@/streak.webp';

interface DesktopRightPanelProps {
  gems: number;
  streak: number;
  energy: number;
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
  // 1. CHEST CLAIM STATUS & 24H COUNTDOWN TIMER
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isClaimingChest, setIsClaimingChest] = useState<boolean>(false);

  const isClaimed = useMemo(() => {
    if (!lastChestClaimedAt) return false;
    const claimTime = new Date(lastChestClaimedAt).getTime();
    const now = new Date().getTime();
    return now - claimTime < 24 * 60 * 60 * 1000;
  }, [lastChestClaimedAt]);

  useEffect(() => {
    if (!lastChestClaimedAt) {
      setTimeLeft('');
      return;
    }

    const updateTimer = () => {
      const claimTime = new Date(lastChestClaimedAt).getTime();
      const nextClaimTime = claimTime + 24 * 60 * 60 * 1000;
      const now = new Date().getTime();
      const diff = nextClaimTime - now;

      if (diff <= 0) {
        setTimeLeft('');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(
          `${hours.toString().padStart(2, '0')}h ${minutes
            .toString()
            .padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
        );
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [lastChestClaimedAt]);

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

  // 2. REAL-TIME ACTIVE QUESTS (Calculated from user stats)
  const quests = useMemo(() => {
    const accuracyPercent = Math.round(accuracy * 100);
    return [
      {
        id: 'quest-lessons',
        title: 'Complete 3 Lessons',
        current: Math.min(3, completedCount),
        total: 3,
        reward: 50,
        unit: 'lessons',
        color: 'from-sky-500 to-blue-600',
        barColor: 'bg-sky-500'
      },
      {
        id: 'quest-cookies',
        title: 'Collect 250 Cookies',
        current: Math.min(250, gems),
        total: 250,
        reward: 100,
        unit: 'cookies',
        color: 'from-amber-500 to-yellow-500',
        barColor: 'bg-amber-500'
      },
      {
        id: 'quest-streak',
        title: '3-Day Streak Hero',
        current: Math.min(3, streak),
        total: 3,
        reward: 75,
        unit: 'days',
        color: 'from-rose-500 to-orange-500',
        barColor: 'bg-rose-500'
      },
      {
        id: 'quest-accuracy',
        title: 'Sharp Mind (90%+ Accuracy)',
        current: Math.min(90, accuracyPercent),
        total: 90,
        reward: 60,
        unit: '%',
        color: 'from-emerald-500 to-green-600',
        barColor: 'bg-emerald-500'
      }
    ];
  }, [completedCount, gems, streak, accuracy]);

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

          <div className="grid grid-cols-3 gap-2">
            {/* Cookies Pill */}
            <div 
              onClick={() => {
                soundManager.play('click');
                setView('rewards_store');
              }}
              className="p-2.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 hover:border-amber-300 dark:hover:border-amber-600 transition-all cursor-pointer group flex flex-col items-center justify-center text-center shadow-xs hover:shadow-sm"
              title="Click to visit Rewards Store"
            >
              <img 
                src={cookiesIcon} 
                alt="Cookies" 
                className="w-6 h-6 object-contain mb-1 group-hover:scale-110 transition-transform duration-150"
              />
              <span className="font-display font-black text-xs text-amber-900 dark:text-amber-200 leading-tight">
                {gems.toLocaleString()}
              </span>
              <span className="text-[9px] font-bold text-amber-700/80 dark:text-amber-400 uppercase tracking-tight">
                {t('common.cookies', 'Cookies')}
              </span>
            </div>

            {/* Streak Pill */}
            <div className="p-2.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 transition-all flex flex-col items-center justify-center text-center shadow-xs">
              <img 
                src={streakIcon} 
                alt="Streak" 
                className="w-6 h-6 object-contain mb-1"
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
              className="p-2.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 transition-all flex flex-col items-center justify-center text-center shadow-xs cursor-pointer hover:scale-105 active:scale-95 group"
            >
              <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-1 group-hover:scale-110 transition-transform">
                <Heart size={14} className="fill-rose-500 text-rose-500" />
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

        {/* 2. DAILY MYSTERY CHEST (INTERACTIVE GAME CARD) */}
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

            <h3 className="font-display font-black text-slate-800 text-base leading-tight mb-0.5">
              {t('quests.daily_chest', 'Daily Mystery Chest')}
            </h3>
            <p className="text-[11px] font-medium text-slate-500 mb-3 max-w-[220px]">
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

        {/* 4. ACTIVE DAILY QUESTS */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Target size={15} className="text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-display font-black text-sm text-slate-800 dark:text-white">
                {t('quests.title', 'Daily Quests')}
              </h3>
            </div>

            <button
              onClick={() => {
                soundManager.play('click');
                setView('quests');
              }}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-0.5 cursor-pointer"
            >
              <span>{t('quests.view_all', 'View All')}</span>
              <ChevronRight size={12} />
            </button>
          </div>

          <div className="space-y-2">
            {quests.map((quest, qIdx) => {
              const isCompleted = quest.current >= quest.total;
              const percent = Math.min(100, Math.round((quest.current / quest.total) * 100));

              return (
                <div
                  key={`desktop-quest-${quest.id || 'quest'}-${qIdx}`}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-[#172033] border border-slate-200/70 dark:border-slate-800 flex flex-col gap-2 hover:bg-slate-100/50 dark:hover:bg-[#1c273e] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {isCompleted ? (
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                      )}
                      <span className="font-display font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                        {quest.title}
                      </span>
                    </div>

                    <span className="px-1.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-black shrink-0 font-mono">
                      +{quest.reward} 🍪
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-500' : quest.barColor
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 font-mono shrink-0">
                      {quest.current}/{quest.total}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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
