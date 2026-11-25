import { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, CheckCircle2, Cookie, Zap, Trophy, Flame, MousePointer2, Sparkles, X, ArrowLeft, Lock } from 'lucide-react';
import ChestIcon from './ui/ChestIcon';
import { soundManager } from '../lib/sounds';
import { useTranslation } from '../lib/translation/TranslationContext';
import cookiesIcon from '@/cookies.webp';
import CookieWheel from './CookieWheel';
import AIMissions from './AIMissions';
import { rewardService, generateSpinReference } from '../lib/rewardService';
import { progressService } from '../lib/progressService';

interface Quest {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  rewardGems: number;
  icon: any;
  color: string;
}

// Spin wheel rewards only award cookies and strictly do NOT increment weekly XP
export const SPIN_XP = 0;

interface QuestsViewProps {
  gems: number;
  streak: number;
  completedCount: number;
  accuracy: number;
  bestAnswerStreak: number;
  lastChestClaimedAt: string | null;
  onClaimGems: (amount: number, newBalance?: number) => void;
  onClaimChest?: () => Promise<any>;
  onQuestDetailsToggle?: (isOpen: boolean) => void;
  onNavigateTab?: (tab: string) => void;
}

function QuestsView({ 
  gems, 
  streak, 
  completedCount, 
  accuracy, 
  bestAnswerStreak,
  lastChestClaimedAt,
  onClaimGems,
  onClaimChest,
  onQuestDetailsToggle,
  onNavigateTab
 }: QuestsViewProps) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [showCookieWheel, setShowCookieWheel] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Quest | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);

  // Sync completed task / quest ids from progress profile
  useEffect(() => {
    const profile = progressService.getProfile();
    if (profile?.completed_daily_challenges) {
      setCompletedTaskIds(prev => Array.from(new Set([...prev, ...profile.completed_daily_challenges!])));
    }
    const unsub = progressService.subscribe((p) => {
      if (p.completed_daily_challenges) {
        setCompletedTaskIds(prev => Array.from(new Set([...prev, ...p.completed_daily_challenges!])));
      }
    });
    return () => unsub();
  }, []);

  // Notify parent component when full-screen Task Mission page opens or closes
  useEffect(() => {
    if (onQuestDetailsToggle) {
      onQuestDetailsToggle(!!selectedTask);
    }
    return () => {
      if (onQuestDetailsToggle) {
        onQuestDetailsToggle(false);
      }
    };
  }, [selectedTask, onQuestDetailsToggle]);

  const claimCooldownMs = 24 * 60 * 60 * 1000; // 24 hours

  const isClaimed = useMemo(() => {
    if (!lastChestClaimedAt) return false;
    const claimTime = new Date(lastChestClaimedAt).getTime();
    return (Date.now() - claimTime) < claimCooldownMs;
  }, [lastChestClaimedAt]);

  useEffect(() => {
    if (!lastChestClaimedAt) {
      setTimeLeft('');
      return;
    }

    const updateTimer = () => {
      const claimTime = new Date(lastChestClaimedAt).getTime();
      const targetTime = claimTime + claimCooldownMs;
      const difference = targetTime - Date.now();

      if (difference <= 0) {
        setTimeLeft('');
      } else {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference / (1000 * 60)) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        const hStr = hours > 0 ? `${hours}h ` : '';
        const mStr = `${minutes}m `.padStart(4, '0');
        const sStr = `${seconds}s`.padStart(3, '0');

        setTimeLeft(`${hStr}${mStr}${sStr}`);
      }
    };

    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastChestClaimedAt]);
  const quests: Quest[] = [
    {
      id: 'q1',
      title: 'AI Novice',
      description: 'Complete 3 lessons',
      target: 3,
      current: completedCount,
      rewardGems: 50,
      icon: Target,
      color: 'bg-chikoo-blue-500'
    },
    {
      id: 'q2',
      title: 'Cookie Enthusiast',
      description: 'Earn 250 Cookies total',
      target: 250,
      current: gems,
      rewardGems: 100,
      icon: Cookie,
      color: 'bg-amber-500'
    },
    {
      id: 'q3',
      title: 'Consistency King',
      description: 'Maintain a 3-day streak',
      target: 3,
      current: streak,
      rewardGems: 75,
      icon: Flame,
      color: 'bg-chikoo-red-500'
    },
    {
      id: 'q4',
      title: 'Sharp Mind',
      description: 'Keep accuracy above 90%',
      target: 90,
      current: Math.round(accuracy * 100),
      rewardGems: 60,
      icon: Zap,
      color: 'bg-duo-green'
    },
    {
      id: 'q5',
      title: 'Focus Master',
      description: 'Get a 10-answer streak',
      target: 10,
      current: bestAnswerStreak,
      rewardGems: 80,
      icon: MousePointer2,
      color: 'bg-purple-500'
    }
  ];

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
              rotate: isClaimed ? 0 : [0, -5, 5, -5, 0],
              scale: isClaimed ? 1 : [1, 1.1, 1]
            }}
            transition={{ repeat: isClaimed ? 0 : Infinity, duration: 4 }}
          >
            <ChestIcon isCurrent={!isClaimed} isOpen={isClaimed} className="w-24 h-24 mb-2 drop-shadow-2xl" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-display font-black leading-tight">{t('quests.daily_chest', 'Daily Mystery Chest')}</h2>
            <p className="text-amber-100/80 text-sm font-medium">
              {isClaimed ? t('quests.come_back_tomorrow', 'Come back tomorrow for a new chest') : t('quests.chest_reward_desc', 'Open your daily cosmic chest for surprise Cookies and XP!')}
            </p>
          </div>
          <button 
            disabled={isClaimed}
            onClick={async () => {
              if (!isClaimed) {
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
              isClaimed 
                ? 'bg-amber-800/40 text-amber-400 cursor-not-allowed border-2 border-amber-900/45' 
                : 'bg-white dark:bg-[#243149] text-amber-700 dark:text-amber-300 shadow-[0_4px_0_#d1d5db] dark:shadow-[0_4px_0_#172033] active:translate-y-1 active:shadow-none'
            }`}
          >
            {isClaimed ? (
              <div className="flex flex-col items-center justify-center leading-tight">
                <span className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold mb-0.5">Next Chest In</span>
                <span className="text-lg font-black font-mono text-white tracking-widest">{timeLeft || '24h 00m 00s'}</span>
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
          if (onNavigateTab) {
            onNavigateTab('practice');
          } else {
            setShowCookieWheel(true);
          }
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
                  if (onNavigateTab) {
                    onNavigateTab('practice');
                  } else {
                    setShowCookieWheel(true);
                  }
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
                onClaimReward={async (amount) => {
                  const spinRef = generateSpinReference();
                  // Wheel rewards only award cookies and strictly do NOT increment weekly XP (SPIN_XP = 0)
                  const claimRes = await rewardService.claimWheelSpin(spinRef, amount);
                  if (claimRes.granted) {
                    onClaimGems(amount, claimRes.newBalance);
                    soundManager.play('complete');
                  }
                  setShowCookieWheel(false);
                  if (onNavigateTab) {
                    onNavigateTab('practice');
                  }
                }}
                onSpinStart={() => {
                  setShowCookieWheel(false);
                  if (onNavigateTab) {
                    onNavigateTab('practice');
                  }
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-left">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
          Complete Challenges every day earn bonus cookie
        </h3>
      </div>

      <div className="space-y-4">
        {quests.map((quest, idx) => {
          const isClaimed = completedTaskIds.includes(quest.id) || rewardService.isClaimed('quest_' + quest.id);
          const isReadyToClaim = quest.current >= quest.target && !isClaimed;
          const isCompleted = isClaimed || isReadyToClaim;
          const progress = Math.min(100, (quest.current / quest.target) * 100);
          const Icon = quest.icon;

          return (
            <motion.div 
              layout
              key={`quest-item-${quest.id || 'quest'}-${idx}`} 
              onClick={() => {
                soundManager.play('click');
                setSelectedTask(quest);
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                scale: isCompleted ? [1, 1.01, 1] : 1,
                boxShadow: isCompleted ? '0 12px 24px -5px rgba(16, 185, 129, 0.12)' : '0 4px 12px -1px rgba(148, 163, 184, 0.05)'
              }}
              transition={{ 
                delay: idx * 0.08,
                scale: { duration: 0.4, ease: "easeOut" }
              }}
              className={`relative overflow-hidden glass-panel glass-panel-hover p-5 sm:p-6 flex flex-col gap-3.5 border border-white/60 dark:border-[rgba(226,232,240,0.14)] dark:bg-[#172033]/90 transition-all duration-300 cursor-pointer ${
                isClaimed ? 'border-[#10b981]/30 bg-emerald-50/10 dark:bg-emerald-950/20' : isReadyToClaim ? 'border-amber-400/40 bg-amber-50/10 dark:bg-amber-950/20' : ''
              }`}
            >
              {isClaimed && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.5 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 + idx * 0.08 }}
                  className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden animate-in fade-in"
                >
                  <div className="absolute top-[-10px] right-[-30px] w-[80px] h-[30px] bg-[#10b981] rotate-45 flex items-center justify-center shadow-sm">
                    <CheckCircle2 size={11} className="text-white" />
                  </div>
                </motion.div>
              )}

              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-white/40 dark:border-white/10 ${
                    isClaimed ? 'bg-[#10b981] text-white' : isReadyToClaim ? 'bg-amber-500 text-white animate-pulse' : `${quest.color} text-white`
                  }`}>
                    {Icon === Cookie ? (
                      <img src={cookiesIcon} alt="Cookies" className={`w-6 h-6 object-contain shrink-0 ${isCompleted ? 'animate-bounce' : ''}`} />
                    ) : (
                      <Icon size={24} className={isCompleted ? 'animate-bounce' : ''} />
                    )}
                  </div>
                  <div className="min-w-0 text-left">
                    <h4 className="font-bold text-base text-slate-900 dark:text-white leading-tight truncate">{quest.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5 leading-snug">{quest.description}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1.5 justify-end">
                    <img src={cookiesIcon} alt="Cookies" className="w-4 h-4 object-contain shrink-0" />
                    <p className="text-base font-bold text-amber-600 dark:text-amber-400 font-mono leading-none">+{quest.rewardGems}</p>
                  </div>
                  <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1 leading-none">Reward</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-0.5">
                  <span className={`text-xs font-semibold ${isClaimed ? 'text-[#10b981]' : isReadyToClaim ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}`}>
                    {quest.current} / {quest.target}
                  </span>
                  {isClaimed ? (
                    <span className="text-xs font-semibold text-[#10b981]">
                      Completed ✓
                    </span>
                  ) : isReadyToClaim ? (
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 animate-pulse">
                      Ready to Claim!
                    </span>
                  ) : null}
                </div>
                <div className="h-2.5 w-full bg-slate-200/50 dark:bg-slate-800 rounded-full border border-white/40 dark:border-slate-700/60 overflow-hidden p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: "spring", stiffness: 50, damping: 15 }}
                    className={`h-full rounded-full shadow-inner ${
                      isClaimed ? 'bg-[#10b981]' : isReadyToClaim ? 'bg-amber-500' : quest.color
                    }`}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ULTRA-MINIMAL DUOLINGO-STYLE MISSION PAGE */}
      <AnimatePresence>
        {selectedTask && (() => {
          const isClaimed = completedTaskIds.includes(selectedTask.id) || rewardService.isClaimed('quest_' + selectedTask.id);
          const isRequirementMet = selectedTask.current >= selectedTask.target;
          const progressPercent = Math.min(100, Math.round((selectedTask.current / selectedTask.target) * 100));

          return (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed inset-0 z-[999999] bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-white flex flex-col justify-between items-center font-sans select-none overflow-y-auto pt-4 pb-5 px-4 sm:px-6"
            >
              {/* ---------------- TOP NAVIGATION BAR ---------------- */}
              <div className="w-full max-w-md flex items-center justify-between shrink-0 py-2.5 z-10">
                <button
                  onClick={() => {
                    soundManager.play('click');
                    setSelectedTask(null);
                  }}
                  className="w-11 h-11 rounded-full bg-white dark:bg-[#172033] border border-slate-200/80 dark:border-slate-700/70 shadow-xs flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#243149] transition-all active:scale-95 cursor-pointer"
                  title="Back to Quests"
                >
                  <ArrowLeft size={22} />
                </button>

                <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 font-mono">
                  MISSION
                </span>

                <div className="w-11 h-11" />
              </div>

              {/* ---------------- CENTERED DUOLINGO-STYLE CARD ---------------- */}
              <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center text-center my-auto py-6 px-1">
                <div className="w-full bg-white dark:bg-[#172033] border border-slate-200/80 dark:border-slate-700/60 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl shadow-slate-200/60 dark:shadow-none flex flex-col items-center text-center space-y-6 my-auto">
                  
                  {/* Large Mission Illustration */}
                  <motion.div
                    initial={{ scale: 0.85, rotate: -4 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="relative"
                  >
                    <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-[2.25rem] flex items-center justify-center text-7xl sm:text-8xl shadow-2xl ${selectedTask.color} text-white border-4 border-white dark:border-slate-700`}>
                      {selectedTask.icon === Cookie ? (
                        <img src={cookiesIcon} alt="Cookies" className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-md" />
                      ) : (
                        <selectedTask.icon size={64} />
                      )}
                    </div>
                  </motion.div>

                  {/* Title & Short Description */}
                  <div className="space-y-2 pt-2">
                    <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-slate-900 dark:text-white leading-tight">
                      {selectedTask.title}
                    </h1>

                    <p className="text-sm sm:text-base font-semibold text-slate-500 dark:text-slate-300 max-w-xs mx-auto leading-relaxed">
                      {selectedTask.description}
                    </p>
                  </div>

                  {/* Live Progress Bar */}
                  <div className="w-full space-y-2 pt-2">
                    <div className="flex justify-between text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 font-mono">
                      <span>Requirement Progress</span>
                      <span>{selectedTask.current} / {selectedTask.target}</span>
                    </div>
                    <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isRequirementMet ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Reward Badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-700/60 text-amber-900 dark:text-amber-300 font-black text-xs sm:text-sm">
                    <img src={cookiesIcon} alt="Cookies" className="w-5 h-5 object-contain" />
                    <span>Reward: +{selectedTask.rewardGems} Cookies</span>
                  </div>

                </div>
              </div>

              {/* ---------------- STICKY / BOTTOM PRIMARY BUTTON ---------------- */}
              <div className="w-full max-w-md shrink-0 pt-4 pb-3 px-1 z-10 mt-auto">
                {isClaimed ? (
                  <button
                    disabled
                    className="w-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-700 font-black py-4 px-6 rounded-2xl text-base uppercase tracking-wider flex items-center justify-center gap-2 font-sans cursor-default shadow-xs"
                  >
                    <CheckCircle2 size={22} className="stroke-[3]" />
                    <span>Completed & Claimed ✓</span>
                  </button>
                ) : isRequirementMet ? (
                  <button
                    onClick={async () => {
                      const claimRes = await rewardService.claimQuest(selectedTask.id, selectedTask.rewardGems);
                      if (claimRes.granted) {
                        soundManager.play('complete');
                        onClaimGems(selectedTask.rewardGems, claimRes.newBalance);
                        const updated = Array.from(new Set([...completedTaskIds, selectedTask.id]));
                        setCompletedTaskIds(updated);
                        progressService.updateProfileData({ completed_daily_challenges: updated });
                        setSelectedTask(null);
                      }
                    }}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 active:bg-emerald-700 text-white font-black py-4 px-6 rounded-2xl text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_5px_0_#047857] active:translate-y-1 active:shadow-none transition-all cursor-pointer font-sans"
                  >
                    <CheckCircle2 size={22} className="stroke-[3]" />
                    <span>Claim +{selectedTask.rewardGems} Cookies 🍪</span>
                  </button>
                ) : (
                  <div className="space-y-2 w-full">
                    <button
                      disabled
                      className="w-full bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-black py-4 px-6 rounded-2xl text-base uppercase tracking-wider flex items-center justify-center gap-2 font-sans cursor-not-allowed shadow-none border border-slate-300 dark:border-slate-700"
                    >
                      <Lock size={18} />
                      <span>In Progress ({selectedTask.current}/{selectedTask.target})</span>
                    </button>
                    {onNavigateTab && (
                      <button
                        onClick={() => {
                          setSelectedTask(null);
                          onNavigateTab('learn');
                        }}
                        className="w-full text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 py-2 underline transition-colors cursor-pointer text-center"
                      >
                        Go to Lessons to complete this task →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </motion.div>
  );
}

export default memo(QuestsView);
