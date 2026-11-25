import { useMemo, useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Flame, Sparkles, ChevronRight, Zap } from 'lucide-react';
import { LeaderboardEntry } from '../types';
import { soundManager } from '../lib/sounds';
import { useTranslation } from '../lib/translation/TranslationContext';

interface LeaderboardProps {
  leaderboardData: LeaderboardEntry[];
  resetsAt?: string | Date | number | null;
}

/**
 * Calculates time remaining until the next Monday 12:00 AM IST (Sunday 18:30 UTC).
 */
function getNextMondayIST(): Date {
  const now = new Date();
  // IST is UTC + 5h 30m = 330 minutes
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + IST_OFFSET_MS);

  // In IST, day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const istDay = istDate.getUTCDay();
  // Days until next Monday (if today is Monday, next Monday is 7 days away)
  const daysUntilMonday = ((7 - istDay + 1) % 7) || 7;

  // Next Monday 00:00:00.000 in IST coordinates
  const targetYear = istDate.getUTCFullYear();
  const targetMonth = istDate.getUTCMonth();
  const targetDate = istDate.getUTCDate() + daysUntilMonday;

  // Date.UTC creates timestamp as if target is UTC, then subtract IST offset to get actual UTC time
  const targetUtcMs = Date.UTC(targetYear, targetMonth, targetDate, 0, 0, 0, 0) - IST_OFFSET_MS;
  return new Date(targetUtcMs);
}

function formatCountdown(targetMs: number): string {
  const now = Date.now();
  const diff = Math.max(0, targetMs - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  return `${days}d ${hours}h ${minutes}m`;
}

function Leaderboard({ leaderboardData, resetsAt }: LeaderboardProps) {
  const { t } = useTranslation();

  // Sort competitor data cleanly and directly by confirmed Weekly XP
  const sortedData = useMemo(() => {
    const validEntries = [...leaderboardData].filter(e => e && typeof e.xp === 'number');

    return validEntries
      .sort((a, b) => b.xp - a.xp)
      .map((entry, idx) => ({
        ...entry,
        rank: idx + 1
      }));
  }, [leaderboardData]);

  // Find maximum XP to draw scaled progress bars
  const maxXp = useMemo(() => {
    const scores = sortedData.map(e => e.xp);
    return scores.length > 0 ? Math.max(...scores, 100) : 1000;
  }, [sortedData]);

  // Identify current user and rank status
  const currentUserIndex = useMemo(() => {
    return sortedData.findIndex(e => e.isCurrentUser);
  }, [sortedData]);

  const currentUser = useMemo(() => {
    const user = currentUserIndex !== -1 ? sortedData[currentUserIndex] : null;
    return user || { id: 'me', name: 'AI Explorer', xp: 0, rank: 0, isCurrentUser: true };
  }, [sortedData, currentUserIndex]);

  // Unranked state: if user has 0 XP or is not ranked on the board
  const isUnranked = useMemo(() => {
    return currentUserIndex === -1 || !currentUser || currentUser.xp <= 0;
  }, [currentUserIndex, currentUser]);

  const userRank = useMemo(() => {
    if (isUnranked) return null;
    return currentUserIndex + 1;
  }, [isUnranked, currentUserIndex]);

  // Top 3 Players for the Podium
  const topThree = useMemo(() => {
    return sortedData.slice(0, 3);
  }, [sortedData]);

  // All competitors from Rank 4 onwards
  const leaderboardList = useMemo(() => {
    return sortedData.filter(player => player.rank > 3);
  }, [sortedData]);

  // Celebration state for sparkle animations on load
  const [showConfetti, setShowConfetti] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const confettiColors = ['#eab308', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4'];
  const confettiParticles = useMemo(() => {
    return Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      x: Math.random() * 340 - 170,
      y: Math.random() * -380 - 120,
      rotate: Math.random() * 360,
      scale: Math.random() * 0.6 + 0.4,
      color: confettiColors[i % confettiColors.length],
      delay: Math.random() * 0.2
    }));
  }, []);

  // Motivation message
  const motivationMessage = useMemo(() => {
    if (isUnranked || !userRank) {
      return "Complete a lesson to join this week's board! 🚀";
    }
    if (userRank === 1) {
      return "👑 You are leading the standing! Keep solving quests to claim the ultimate crown!";
    }
    const nextPlayer = sortedData[userRank - 2];
    if (nextPlayer) {
      const diff = nextPlayer.xp - currentUser.xp;
      return `Only ${diff + 1} XP to overtake #${nextPlayer.rank} ${nextPlayer.name}! 🚀`;
    }
    if (userRank > 10) {
      return "Win one quiz to enter the Top 10! ⚡";
    }
    return "You are climbing fast! Practice arena challenges to climb higher. 🔥";
  }, [isUnranked, userRank, sortedData, currentUser.xp]);

  // Real better-than percentage (without fake 15% clamp)
  const betterThanPercent = useMemo(() => {
    if (isUnranked || !userRank) return 0;
    if (sortedData.length <= 1) return 100;
    const pct = Math.round(((sortedData.length - userRank) / (sortedData.length - 1)) * 100);
    return Math.max(0, Math.min(100, pct));
  }, [isUnranked, userRank, sortedData.length]);

  // Reset Countdown Timer: Ticking every second until next Monday 12:00 AM IST (Sunday 18:30 UTC) or resetsAt
  const targetResetMs = useMemo(() => {
    if (resetsAt) {
      const parsed = new Date(resetsAt).getTime();
      if (!isNaN(parsed) && parsed > Date.now()) {
        return parsed;
      }
    }
    return getNextMondayIST().getTime();
  }, [resetsAt]);

  const [timeRemaining, setTimeRemaining] = useState<string>(() => formatCountdown(targetResetMs));

  useEffect(() => {
    setTimeRemaining(formatCountdown(targetResetMs));
    const timer = setInterval(() => {
      setTimeRemaining(formatCountdown(targetResetMs));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetResetMs]);

  return (
    <div className="fixed inset-0 bg-[#6755E4] dark:bg-[#0b0f19] overflow-y-auto pb-10 font-sans transition-colors duration-200">
      {/* Decorative background curves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 375 812" fill="none" preserveAspectRatio="none">
          <path d="M0 100C100 0 275 0 375 100" stroke="#8173E8" strokeWidth="2" opacity="0.3" className="dark:stroke-indigo-500/20" />
          <path d="M0 200C150 100 225 100 375 200" stroke="#8173E8" strokeWidth="1" opacity="0.2" className="dark:stroke-indigo-500/10" />
        </svg>
      </div>
      
      {/* Confetti Celebration on Mount */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-x-0 top-0 pointer-events-none flex justify-center overflow-visible z-50">
            {confettiParticles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 150, opacity: 1, scale: 0, rotate: 0 }}
                animate={{
                  x: p.x,
                  y: p.y,
                  opacity: [1, 1, 0],
                  scale: p.scale,
                  rotate: p.rotate
                }}
                transition={{
                  duration: 2.2,
                  delay: p.delay,
                  ease: "easeOut"
                }}
                className="absolute w-2 h-2 rounded-full"
                style={{ backgroundColor: p.color }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* 1. GAMIFIED MODERN HEADER */}
      <header className="relative flex items-center justify-between p-4 z-10">
        <button onClick={() => soundManager.play('click')} className="p-2 text-white">
          <ChevronRight className="rotate-180" />
        </button>
        <h1 className="text-white text-xl font-bold">Leaderboard</h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* 2. TOP 3 PODIUM */}
      {topThree.length > 0 && (
        <div className="relative z-10 grid grid-cols-3 items-end gap-2 pt-8 pb-3 px-1 max-w-sm mx-auto w-full" id="leaderboard_podium">
          {/* Real Reset Countdown Timer Pill */}
          <div className="absolute top-2 right-4 bg-[#49399F] dark:bg-[#1e293b] text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 z-20 border border-white/10 dark:border-slate-700 shadow-sm font-semibold">
            <span className="text-amber-300">◷</span>
            <span>Resets in {timeRemaining}</span>
          </div>

          {/* Rank 2 (Left - Silver) */}
          {topThree[1] && (
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${topThree[1].name}`} alt={topThree[1].name} onError={(e) => (e.currentTarget.src = 'https://api.dicebear.com/7.x/pixel-art/svg?seed=fallback')} className="w-12 h-12 rounded-full border-2 border-slate-200 shadow-[0_0_15px_rgba(226,232,240,0.8)]" />
                <span className="absolute -bottom-1 -right-1 text-xs">🇮🇳</span>
              </div>
              <p className="text-white text-xs font-semibold truncate w-full text-center px-1">{topThree[1].name || 'Player'}</p>
              <div className="flex items-center gap-1 bg-slate-400/30 border border-slate-200/40 px-2 py-0.5 rounded-full mt-1.5 mb-[18px] drop-shadow-[0_2px_4px_rgba(203,213,225,0.7)] z-10">
                <Zap className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
                <span className="text-[10px] text-white font-bold">{topThree[1].xp}</span>
                <span className="text-[9px] text-slate-200 font-extrabold">XP</span>
              </div>
              {/* 3D Silver Podium Block */}
              <div className="w-full h-20 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8] rounded-t-xl border-t border-l border-white/70 shadow-[0_8px_20px_rgba(148,163,184,0.4)] overflow-hidden">
                  <motion.div animate={{ x: ['-120%', '240%'] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 0.8 }} className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-[-20deg] pointer-events-none" />
                </div>
                <div className="absolute top-0 right-0 w-3 h-full bg-gradient-to-b from-[#94A3B8] via-[#64748B] to-[#475569] rounded-t-r-xl skew-y-[-20deg]" />
                <div className="absolute -top-3 left-0 w-full h-4 bg-gradient-to-r from-[#FFFFFF] via-[#F1F5F9] to-[#CBD5E1] rounded-t-xl skew-x-[-20deg] border-t border-l border-white/80 shadow-xs" />
                <div className="absolute inset-0 flex items-center justify-center text-slate-800 font-display font-black text-xl z-10 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">2</div>
              </div>
            </div>
          )}
          {/* Rank 1 (Center - Gold) */}
          {topThree[0] && (
            <div className="flex flex-col items-center">
              <Crown className="w-8 h-8 text-[#FFD54F] mb-1 drop-shadow-md animate-bounce" style={{ animationDuration: '3s' }} />
              <div className="relative mb-2">
                <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${topThree[0].name}`} alt={topThree[0].name} onError={(e) => (e.currentTarget.src = 'https://api.dicebear.com/7.x/pixel-art/svg?seed=fallback')} className="w-16 h-16 rounded-full border-2 border-amber-300 shadow-[0_0_20px_rgba(255,215,0,0.85)] ring-2 ring-yellow-400/50" />
                <span className="absolute -bottom-1 -right-1 text-xs">🇺🇸</span>
              </div>
              <p className="text-white text-sm font-semibold truncate w-full text-center px-1">{topThree[0].name || 'Player'}</p>
              <div className="flex items-center gap-1 bg-amber-400/35 border border-amber-300/50 px-2 py-0.5 rounded-full mt-1.5 mb-[18px] drop-shadow-[0_2px_4px_rgba(255,215,0,0.9)] z-10">
                <Zap className="w-2.5 h-2.5 text-yellow-200 fill-yellow-200" />
                <span className="text-[10px] text-white font-bold">{topThree[0].xp}</span>
                <span className="text-[9px] text-yellow-200 font-extrabold">XP</span>
              </div>
              {/* 3D Gold Podium Block */}
              <div className="w-full h-28 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-[#FFD54F] via-[#FFB300] to-[#E65100] rounded-t-xl border-t border-l border-white/80 shadow-[0_12px_28px_rgba(255,179,0,0.5)] overflow-hidden">
                  <motion.div animate={{ x: ['-120%', '240%'] }} transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.2 }} className="absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 to-transparent skew-x-[-20deg] pointer-events-none" />
                </div>
                <div className="absolute top-0 right-0 w-3 h-full bg-gradient-to-b from-[#FF8F00] via-[#C62828] to-[#8E0000] rounded-t-r-xl skew-y-[-20deg]" />
                <div className="absolute -top-3 left-0 w-full h-4 bg-gradient-to-r from-[#FFFDE7] via-[#FFE082] to-[#FFCA28] rounded-t-xl skew-x-[-20deg] border-t border-l border-white/90 shadow-xs" />
                <div className="absolute inset-0 flex items-center justify-center text-amber-950 font-display font-black text-2xl z-10 drop-shadow-[0_1px_3px_rgba(255,249,196,0.9)]">1</div>
              </div>
            </div>
          )}
          {/* Rank 3 (Right - Bronze) */}
          {topThree[2] && (
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${topThree[2].name}`} alt={topThree[2].name} onError={(e) => (e.currentTarget.src = 'https://api.dicebear.com/7.x/pixel-art/svg?seed=fallback')} className="w-12 h-12 rounded-full border-2 border-amber-600 shadow-[0_0_15px_rgba(205,127,50,0.8)]" />
                <span className="absolute -bottom-1 -right-1 text-xs">🇬🇧</span>
              </div>
              <p className="text-white text-xs font-semibold truncate w-full text-center px-1">{topThree[2].name || 'Player'}</p>
              <div className="flex items-center gap-1 bg-amber-800/35 border border-amber-600/40 px-2 py-0.5 rounded-full mt-1.5 mb-[18px] drop-shadow-[0_2px_4px_rgba(205,127,50,0.8)] z-10">
                <Zap className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
                <span className="text-[10px] text-white font-bold">{topThree[2].xp}</span>
                <span className="text-[9px] text-amber-200 font-extrabold">XP</span>
              </div>
              {/* 3D Bronze Podium Block */}
              <div className="w-full h-16 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-[#E0A96D] via-[#CD7F32] to-[#8C3E10] rounded-t-xl border-t border-l border-amber-200/60 shadow-[0_8px_20px_rgba(140,62,16,0.4)] overflow-hidden">
                  <motion.div animate={{ x: ['-120%', '240%'] }} transition={{ repeat: Infinity, duration: 4.2, ease: 'easeInOut', delay: 1.2 }} className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-[-20deg] pointer-events-none" />
                </div>
                <div className="absolute top-0 right-0 w-3 h-full bg-gradient-to-b from-[#B86221] via-[#6D2808] to-[#451A03] rounded-t-r-xl skew-y-[-20deg]" />
                <div className="absolute -top-3 left-0 w-full h-4 bg-gradient-to-r from-[#FDE8D0] via-[#E8B887] to-[#CD7F32] rounded-t-xl skew-x-[-20deg] border-t border-l border-amber-100/80 shadow-xs" />
                <div className="absolute inset-0 flex items-center justify-center text-amber-950 font-display font-black text-xl z-10 drop-shadow-[0_1px_2px_rgba(253,232,208,0.8)]">3</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* White/Dark Navy Leaderboard Container */}
      <div className="relative z-10 bg-white dark:bg-[#172033] rounded-t-3xl p-5 sm:p-6 min-h-[300px] -mt-10 border-t border-transparent dark:border-[rgba(226,232,240,0.14)] shadow-2xl transition-colors duration-200">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Student Standings</h3>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-400">Total {sortedData.length} Players</span>
        </div>

        {/* User Rank Highlight Showcase Card */}
        <motion.div 
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative overflow-hidden mb-5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#B93815] via-[#C2410C] to-[#8C2808] border border-amber-500/30 shadow-[0_10px_24px_rgba(140,40,8,0.28)] select-none"
        >
          {/* Animated Light Sweep Shimmer Effect */}
          <motion.div
            animate={{ x: ['-120%', '240%'] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', repeatDelay: 1.5 }}
            className="absolute inset-y-0 w-28 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] pointer-events-none"
          />

          {/* Ambient Glow Orbs */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-orange-600/20 rounded-full blur-xl pointer-events-none" />

          <div className="relative flex items-center justify-between gap-3 z-10">
            <div className="flex items-center gap-3 min-w-0">
              {/* 3D-styled Radiant Rank Medallion */}
              <div className="relative flex-shrink-0">
                <div className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-b from-[#FFE58F] via-[#FFC043] to-[#D48806] p-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.3)] flex items-center justify-center">
                  <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-[#7C2D12] via-[#9A3412] to-[#431407] flex items-center justify-center text-white border border-amber-300/40 shadow-inner">
                    <span className="font-display font-black text-lg sm:text-2xl text-amber-200 leading-none drop-shadow-md">
                      {isUnranked ? '—' : `#${userRank}`}
                    </span>
                  </div>
                </div>

                {/* Floating Badge Accent */}
                <motion.div 
                  animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.12, 1] }}
                  transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-[#431407] shadow-sm"
                >
                  {!isUnranked && userRank && userRank <= 3 ? (
                    <Crown size={11} className="fill-[#431407]" />
                  ) : !isUnranked ? (
                    <Flame size={11} className="fill-[#431407]" />
                  ) : (
                    <Sparkles size={11} className="fill-[#431407]" />
                  )}
                </motion.div>
              </div>

              {/* Simplified, Punchy Stats */}
              <div className="min-w-0 text-white">
                {isUnranked ? (
                  <>
                    <p className="font-display font-black text-sm sm:text-base text-white leading-tight drop-shadow-sm">
                      Unranked — Complete a lesson to join this week's board! 🚀
                    </p>
                    <p className="text-xs text-amber-100/90 font-medium mt-0.5">
                      Earn weekly XP to claim your rank on the leaderboard
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-display font-black text-base sm:text-lg text-white leading-tight drop-shadow-sm flex items-center gap-1.5">
                      <span>Better than <span className="text-amber-200 font-black">{betterThanPercent}%</span> of players</span>
                      <span className="text-sm">🚀</span>
                    </p>
                    <p className="text-xs text-amber-100/90 font-medium mt-0.5">
                      {motivationMessage}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Current User Quick XP Pill */}
            <div className="flex flex-col items-end flex-shrink-0 bg-black/25 backdrop-blur-xs px-2.5 py-1.5 rounded-xl border border-white/15 shadow-inner">
              <span className="text-[9px] font-black text-amber-200/90 uppercase tracking-wider">Weekly XP</span>
              <div className="flex items-center gap-1 text-xs font-black text-white">
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 drop-shadow" />
                <span>{currentUser.xp}</span>
                <span className="text-[10px] text-amber-200 font-bold">XP</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Players List (Rank 4+) */}
        {leaderboardList.map((player) => (
          <div key={player.id} className="flex items-center gap-4 py-3 border-b border-slate-50 dark:border-slate-800/60 transition-colors">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#243149] flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-300">
              {player.rank}
            </div>
            <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${player.name}`} alt={player.name} className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <p className="font-bold text-slate-800 dark:text-white">{player.name}</p>
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>{player.xp} XP</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(Leaderboard);
