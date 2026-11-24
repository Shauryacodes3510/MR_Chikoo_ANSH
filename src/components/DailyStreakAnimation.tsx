import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sparkles, Trophy, ArrowRight, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../lib/sounds';
import authMascot from '@/auth_mascot.webp';
import streakIcon from '@/streak.webp';
import chestIcon from '@/Chest.webp';

interface DailyStreakAnimationProps {
  streakCount: number;
  onClose: () => void;
}

export const DailyStreakAnimation: React.FC<DailyStreakAnimationProps> = ({ streakCount, onClose }) => {
  const [displayStreak, setDisplayStreak] = useState(1);
  const [animationStage, setAnimationStage] = useState(0);

  const targetStreak = Math.max(1, streakCount);
  const nextMilestone = targetStreak <= 5 ? 5 : targetStreak <= 10 ? 10 : Math.ceil(targetStreak / 5) * 5;
  const progressPercent = Math.min(100, Math.round((targetStreak / nextMilestone) * 100));

  useEffect(() => {
    // Play cozy celebratory sound
    soundManager.play('cheer');

    // Tasteful cozy confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.55 },
        colors: ['#f97316', '#fbbf24', '#ffedd5', '#f59e0b']
      });
    } catch (e) {}

    // Staged animation sequence
    const t1 = setTimeout(() => setAnimationStage(1), 300); // Flame lights up
    const t2 = setTimeout(() => setAnimationStage(2), 900); // Chikoo reacts
    const t3 = setTimeout(() => {
      setAnimationStage(3); // Streak counter enters
      // Count up animation
      let current = 1;
      const stepTime = Math.max(80, Math.min(250, 800 / targetStreak));
      const counterTimer = setInterval(() => {
        current++;
        if (current <= targetStreak) {
          setDisplayStreak(current);
          soundManager.play('click');
        } else {
          clearInterval(counterTimer);
        }
      }, stepTime);
    }, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [targetStreak]);

  const handleContinue = () => {
    soundManager.play('click');
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-amber-50/90 via-orange-50/90 to-amber-100/95 dark:from-slate-950 dark:via-amber-950/60 dark:to-slate-950 backdrop-blur-md px-4 overflow-hidden"
      >
        {/* Warm evening ambient fireflies / soft glowing light particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2.5 h-2.5 rounded-full bg-amber-300/60 shadow-[0_0_10px_#f59e0b]"
              initial={{
                x: `${(i * 7) % 100}vw`,
                y: `${(i * 13) % 100}vh`,
                scale: Math.random() * 0.6 + 0.4,
                opacity: Math.random() * 0.5 + 0.2
              }}
              animate={{
                y: [null, '-=60vh'],
                x: [null, `${(i % 2 === 0 ? 1 : -1) * 20}vw`],
                opacity: [0.4, 0.8, 0]
              }}
              transition={{
                duration: Math.random() * 5 + 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3
              }}
            />
          ))}
        </div>

        {/* Cozy Adventure Game Achievement Card */}
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10 max-w-md w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-amber-200/80 dark:border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(245,158,11,0.2)] text-center flex flex-col items-center"
        >
          {/* Top Header Tag */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300/60 dark:border-amber-500/40 text-amber-800 dark:text-amber-200 text-xs font-bold tracking-wider uppercase mb-5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Cozy Adventure Achievement</span>
          </motion.div>

          {/* Central Environment: Campfire & Chikoo Mascot */}
          <div className="relative w-full h-36 sm:h-40 flex items-center justify-center mb-6 bg-gradient-to-b from-orange-50/60 to-amber-100/40 dark:from-amber-950/20 dark:to-slate-900/50 rounded-2xl border border-amber-200/50 dark:border-amber-800/40 overflow-hidden">
            
            {/* Soft glowing campfire base */}
            <div className="absolute bottom-4 w-28 h-10 bg-amber-500/20 rounded-full blur-xl" />

            {/* Campfire Flame */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={animationStage >= 1 ? { scale: [0, 1.1, 1], opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
              className="relative flex flex-col items-center z-10"
            >
              <motion.div
                animate={{
                  scale: [1, 1.08, 1],
                  rotate: [-1, 1, -1]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-300 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.6)] border-2 border-yellow-200"
              >
                <Flame className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-50 fill-yellow-100 drop-shadow-md" />
              </motion.div>
            </motion.div>

            {/* Chikoo Mascot sitting beside the campfire */}
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={animationStage >= 2 ? { x: 0, opacity: 1 } : { x: -30, opacity: 0 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 250 }}
              className="absolute left-6 bottom-2 z-20 flex items-center"
            >
              <div className="relative">
                <img
                  src={authMascot}
                  alt="Chikoo Mascot"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-md"
                />
                {/* Happy reaction bubble */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                  className="absolute -top-3 -right-4 bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 text-xs font-black px-2 py-0.5 rounded-full shadow border border-amber-200 dark:border-amber-700"
                >
                  🎉 Yay!
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Streak Hero Presentation */}
          <div className="mb-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={animationStage >= 3 ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.4, type: "spring" }}
              className="flex items-center justify-center gap-2 text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight"
            >
              <span className="text-orange-500 text-3xl sm:text-4xl">🔥</span>
              <span>{displayStreak} {displayStreak === 1 ? 'DAY' : 'DAYS'}</span>
            </motion.div>

            <div className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 mt-1">
              Your Learning Streak
            </div>
          </div>

          {/* Encouraging Cozy Message */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={animationStage >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium mb-6 leading-relaxed"
          >
            "{displayStreak} days of showing up. Keep that spark alive!"
          </motion.p>

          {/* Gamified Milestone Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={animationStage >= 3 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/50 rounded-2xl p-3.5 mb-6 text-left"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Next Milestone: {nextMilestone} Days</span>
              </div>
              <span className="text-amber-600 dark:text-amber-400 font-extrabold">{progressPercent}%</span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-2.5 bg-amber-200/60 dark:bg-amber-900/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
              />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center justify-between font-medium">
              <span>{nextMilestone - targetStreak} more days to bonus rewards 🎁</span>
              <span>{targetStreak}/{nextMilestone}</span>
            </div>
          </motion.div>

          {/* Continue Learning Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleContinue}
            className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-orange-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 border border-orange-400/40"
          >
            <span>Continue Learning</span>
            <ArrowRight className="w-5 h-5 stroke-[3]" />
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
