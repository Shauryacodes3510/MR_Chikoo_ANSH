import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import { ArenaResult, RivalProfile } from '../types/arena.types';
import { soundManager } from '../../../lib/sounds';
import { VictoryRaceCanvas } from './VictoryRaceCanvas';

interface RacePodiumModalProps {
  result: ArenaResult;
  rival: RivalProfile;
  onPlayAgain: () => void;
  onBack: () => void;
}

function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    let rafId = 0;
    const duration = 500;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * value));
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [value]);

  return (
    <span className="tabular-nums">
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

export function RacePodiumModal({
  result,
  rival,
  onPlayAgain,
  onBack,
}: RacePodiumModalProps) {
  const isWinner =
    result.winnerId === 'player' || result.playerScore >= result.opponentScore;

  return (
    <div className="relative w-full min-h-[100dvh] flex-1 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md px-5 py-6 sm:px-8 sm:py-8 text-white select-none font-sans">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        {/* 1. Outcome Heading (Simple, Clean, Unboxed) */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="text-center flex flex-col items-center gap-1.5"
        >
          <p className="text-xs sm:text-sm font-medium text-slate-400 flex items-center gap-2">
            <span className={isWinner ? 'text-amber-300' : 'text-slate-300'}>
              {isWinner ? '1st Place' : '2nd Place'}
            </span>
            <span aria-hidden="true">·</span>
            <span>vs {rival.name}</span>
          </p>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white text-balance">
            {isWinner ? 'You Won!' : 'Close Race'}
          </h1>
        </motion.div>

        {/* 2. Live Animated Game Finish Scene (Unobstructed Hero Stage) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-white/10 bg-slate-900"
        >
          <VictoryRaceCanvas isWinner={isWinner} rivalName={rival.name} />
        </motion.div>

        {/* 3. Minimal Single-Row Stats Strip */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="w-full grid grid-cols-3 divide-x divide-white/10 rounded-2xl bg-slate-900/75 border border-white/10 py-3.5"
        >
          <div className="flex flex-col items-center gap-0.5 px-2">
            <span className="text-lg sm:text-xl font-semibold text-amber-300">
              <AnimatedNumber value={result.cookiesEarned} prefix="+" />
            </span>
            <span className="text-xs text-slate-400">Cookies</span>
          </div>

          <div className="flex flex-col items-center gap-0.5 px-2">
            <span className="text-lg sm:text-xl font-semibold text-sky-300">
              <AnimatedNumber value={result.trophiesEarned} prefix="+" />
            </span>
            <span className="text-xs text-slate-400">Points</span>
          </div>

          <div className="flex flex-col items-center gap-0.5 px-2">
            <span className="text-lg sm:text-xl font-semibold text-emerald-300">
              <AnimatedNumber value={Math.round(result.accuracy)} suffix="%" />
            </span>
            <span className="text-xs text-slate-400">Accuracy</span>
          </div>
        </motion.div>

        {/* 4. Clear, Minimal Action Controls */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex flex-col items-center gap-2.5"
        >
          <button
            type="button"
            onClick={() => {
              soundManager.play('turbo_boost');
              onPlayAgain();
            }}
            className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-slate-950 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw size={17} aria-hidden="true" />
            <span>Race Again</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.play('click');
              onBack();
            }}
            className="w-full min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 flex items-center justify-center gap-2 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            <span>Back to Home</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
