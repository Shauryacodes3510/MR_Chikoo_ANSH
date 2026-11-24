import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';
import { RivalProfile } from '../types/arena.types';

interface RaceCountdownOverlayProps {
  rival: RivalProfile;
  onComplete: () => void;
}

export function RaceCountdownOverlay({
  rival,
  onComplete,
}: RaceCountdownOverlayProps) {
  const [count, setCount] = useState<number>(3);
  const [isGo, setIsGo] = useState<boolean>(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    soundManager.play('race_countdown');

    const timer1 = setTimeout(() => {
      setCount(2);
      soundManager.play('race_countdown');
    }, 1000);

    const timer2 = setTimeout(() => {
      setCount(1);
      soundManager.play('race_countdown');
    }, 2000);

    const timer3 = setTimeout(() => {
      setIsGo(true);
      soundManager.play('race_go');
      soundManager.play('turbo_boost');
    }, 3000);

    const timer4 = setTimeout(() => {
      onCompleteRef.current();
    }, 3900);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/88 backdrop-blur-md px-6 text-center select-none font-sans text-white"
      role="status"
      aria-live="assertive"
    >
      {/* Minimal 3-step countdown indicator */}
      <div className="flex items-center gap-3 mb-8" aria-hidden="true">
        {[1, 2, 3].map((step) => {
          const isLit = isGo || count <= 4 - step;
          return (
            <span
              key={step}
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-150 ${
                isGo
                  ? 'bg-emerald-400'
                  : isLit
                  ? 'bg-white'
                  : 'bg-white/15'
              }`}
            />
          );
        })}
      </div>

      {/* Focal Countdown Numeral / Go */}
      <div className="h-32 sm:h-40 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {!isGo ? (
            <motion.span
              key={count}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.08 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="text-8xl sm:text-9xl font-bold tracking-tight tabular-nums text-white leading-none"
            >
              {count}
            </motion.span>
          ) : (
            <motion.span
              key="go"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.08 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="text-7xl sm:text-8xl font-bold tracking-tight text-emerald-400 leading-none"
            >
              Go!
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Simple Status Line */}
      <p className={`text-base font-medium mt-4 transition-colors duration-150 ${isGo ? 'text-emerald-300' : 'text-slate-300'}`}>
        {isGo ? 'Race started' : 'Get ready'}
      </p>

      {/* Quiet Unboxed Match Context */}
      <p className="mt-10 text-sm text-slate-400 flex items-center gap-2 tabular-nums">
        <span>vs {rival.name}</span>
        <span aria-hidden="true">·</span>
        <span>1,000 m</span>
      </p>
    </div>
  );
}
