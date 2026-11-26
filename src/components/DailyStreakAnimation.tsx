import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sparkles, Trophy, ArrowRight, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../lib/sounds';

interface DailyStreakAnimationProps {
  streakCount: number;
  onClose: () => void;
}

export const DailyStreakAnimation: React.FC<DailyStreakAnimationProps> = ({ streakCount, onClose }) => {
  const targetStreak = Math.max(1, Number(streakCount) || 1);
  const [displayStreak, setDisplayStreak] = useState(1);

  const nextMilestone = targetStreak <= 5 ? 5 : targetStreak <= 10 ? 10 : Math.ceil(targetStreak / 5) * 5;
  const progressPercent = Math.min(100, Math.round((targetStreak / nextMilestone) * 100));

  useEffect(() => {
    // Play cozy celebratory sound safely
    try {
      soundManager.play('cheer');
    } catch (_) {}

    // Tasteful cozy confetti burst
    try {
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.55 },
        colors: ['#f97316', '#fbbf24', '#ffedd5', '#f59e0b', '#ea580c']
      });
    } catch (_) {}

    // Count up animation to target streak
    if (targetStreak > 1) {
      let current = 1;
      const stepTime = Math.max(70, Math.min(220, 900 / targetStreak));
      const counterTimer = setInterval(() => {
        current++;
        if (current <= targetStreak) {
          setDisplayStreak(current);
          try {
            soundManager.play('click');
          } catch (_) {}
        } else {
          clearInterval(counterTimer);
        }
      }, stepTime);

      return () => {
        clearInterval(counterTimer);
      };
    } else {
      setDisplayStreak(1);
    }
  }, [targetStreak]);

  const handleContinue = () => {
    try {
      soundManager.play('click');
    } catch (_) {}
    onClose();
  };

  const streakQuote = targetStreak === 1
    ? "Awesome start! You took the first step today. Come back tomorrow to keep your flame burning!"
    : targetStreak < 5
    ? `${targetStreak} days of showing up! You're building a rock-solid learning habit!`
    : targetStreak < 10
    ? `${targetStreak} days on fire! Your learning streak is becoming unstoppable!`
    : `Legendary dedication! ${targetStreak} days straight! You're an AI learning master!`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[500] flex items-center justify-center bg-gradient-to-b from-amber-50/90 via-orange-50/90 to-amber-100/95 dark:from-slate-950 dark:via-amber-950/60 dark:to-slate-950 backdrop-blur-md px-4 overflow-hidden"
      >
        {/* Warm ambient glowing light particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(16)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2.5 h-2.5 rounded-full bg-amber-300/60 shadow-[0_0_12px_#f59e0b]"
              initial={{
                x: `${(i * 7) % 100}vw`,
                y: `${(i * 13) % 100}vh`,
                scale: 0.6,
                opacity: 0.3
              }}
              animate={{
                y: [null, '-=55vh'],
                x: [null, `${(i % 2 === 0 ? 1 : -1) * 18}vw`],
                opacity: [0.3, 0.8, 0]
              }}
              transition={{
                duration: 4.5 + (i % 4),
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.25
              }}
            />
          ))}
        </div>

        {/* Cozy Adventure Game Achievement Card */}
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative z-10 max-w-md w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-2 border-amber-200/90 dark:border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_24px_60px_rgba(245,158,11,0.25)] text-center flex flex-col items-center"
        >
          {/* Top Dismiss Button */}
          <button
            onClick={handleContinue}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top Header Tag */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100/90 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs font-black tracking-wider uppercase mb-5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Cozy Adventure Achievement</span>
          </motion.div>

          {/* Central Environment: Campfire & Chikoo Mascot */}
          <div className="relative w-full h-40 sm:h-44 flex items-center justify-center mb-5 bg-gradient-to-b from-orange-50 via-amber-100/60 to-orange-100/80 dark:from-amber-950/30 dark:via-slate-900/60 dark:to-slate-900/80 rounded-2xl border-2 border-amber-200/70 dark:border-amber-800/50 overflow-hidden shadow-inner">
            
            {/* Soft glowing campfire warm radial glow */}
            <div className="absolute inset-0 bg-radial from-amber-400/25 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-3 w-32 h-10 bg-orange-500/25 rounded-full blur-xl pointer-events-none" />

            {/* Central Animated Campfire Flame */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 15 }}
              className="relative flex flex-col items-center z-10"
            >
              <motion.div
                animate={{
                  scale: [1, 1.08, 0.98, 1.06, 1],
                  rotate: [-1.5, 1.5, -1, 1.5, -1.5]
                }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-300 flex items-center justify-center shadow-[0_0_35px_rgba(249,115,22,0.65)] border-3 border-yellow-200/90"
              >
                <Flame className="w-12 h-12 sm:w-14 sm:h-14 text-yellow-50 fill-yellow-100 drop-shadow-md animate-pulse" />
              </motion.div>
            </motion.div>

            {/* Chikoo Mascot sitting beside the campfire */}
            <motion.div
              initial={{ x: -25, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 220, damping: 18 }}
              className="absolute left-4 sm:left-7 bottom-2 z-20 flex items-center"
            >
              <div className="relative">
                <img
                  src="/heading_aibo.webp"
                  alt="Chikoo Mascot"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (target.src !== '/auth_mascot.webp') {
                      target.src = '/auth_mascot.webp';
                    }
                  }}
                  className="w-18 h-18 sm:w-22 sm:h-22 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.2)] select-none pointer-events-none"
                />
                {/* Happy reaction speech bubble */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 14 }}
                  className="absolute -top-2.5 -right-3 bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 text-[11px] font-black px-2 py-0.5 rounded-full shadow-md border border-amber-200 dark:border-amber-700 whitespace-nowrap"
                >
                  🎉 Yay!
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Streak Hero Presentation */}
          <motion.div 
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 240, damping: 18 }}
            className="mb-2"
          >
            <div className="flex items-center justify-center gap-2 text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              <span className="text-orange-500 text-4xl sm:text-5xl filter drop-shadow-sm">🔥</span>
              <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                {displayStreak} {displayStreak === 1 ? 'DAY' : 'DAYS'}
              </span>
            </div>

            <div className="text-xs sm:text-sm font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 mt-1">
              Your Learning Streak
            </div>
          </motion.div>

          {/* Encouraging Cozy Message */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mb-5 leading-relaxed max-w-sm px-2"
          >
            "{streakQuote}"
          </motion.p>

          {/* Gamified Milestone Indicator */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="w-full bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 rounded-2xl p-3.5 mb-5 text-left shadow-xs"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Next Milestone: {nextMilestone} Days</span>
              </div>
              <span className="text-amber-600 dark:text-amber-400 font-black">{progressPercent}%</span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-3 bg-amber-200/60 dark:bg-amber-900/50 rounded-full overflow-hidden p-0.5 border border-amber-300/40">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 rounded-full shadow-xs"
              />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between font-medium">
              <span>{Math.max(0, nextMilestone - targetStreak)} more day{nextMilestone - targetStreak === 1 ? '' : 's'} to bonus rewards 🎁</span>
              <span className="font-bold">{targetStreak}/{nextMilestone}</span>
            </div>
          </motion.div>

          {/* Continue Learning Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleContinue}
            className="w-full py-3.5 sm:py-4 px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm sm:text-base uppercase tracking-wider rounded-2xl shadow-lg shadow-orange-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 border border-orange-400/40 active:translate-y-0.5 font-display"
          >
            <span>Continue Learning</span>
            <ArrowRight className="w-5 h-5 stroke-[3]" />
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DailyStreakAnimation;
