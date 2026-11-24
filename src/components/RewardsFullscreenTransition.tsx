import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';

interface RewardsFullscreenTransitionProps {
  onComplete: () => void;
  title?: string;
  subtitle?: string;
}

export const RewardsFullscreenTransition: React.FC<RewardsFullscreenTransitionProps> = ({
  onComplete
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleUnlock = useCallback(() => {
    if (isUnlocked) return;
    setIsUnlocked(true);

    try {
      // Synthesize high-energy cinematic vault opening chime
      // @ts-ignore
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (_) {}

    // Complete transition after door slide animation
    setTimeout(() => {
      onComplete();
    }, 700);
  }, [isUnlocked, onComplete]);

  // Automatically initiate unlock after 1.4s if not tapped manually
  useEffect(() => {
    const timer = setTimeout(() => {
      handleUnlock();
    }, 1400);
    return () => clearTimeout(timer);
  }, [handleUnlock]);

  if (!mounted || typeof document === 'undefined') return null;

  const content = (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleUnlock}
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950 overflow-hidden select-none cursor-pointer"
      style={{ touchAction: 'manipulation' }}
    >
      {/* 1. Left Vault Door */}
      <motion.div
        animate={{ x: isUnlocked ? '-100%' : '0%' }}
        transition={{ duration: 0.65, ease: [0.77, 0, 0.175, 1] }}
        className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-slate-950 via-[#172033] to-[#243149] border-r-2 border-amber-400/60 shadow-2xl z-20 flex items-center justify-end pr-4 sm:pr-8"
      />

      {/* 2. Right Vault Door */}
      <motion.div
        animate={{ x: isUnlocked ? '100%' : '0%' }}
        transition={{ duration: 0.65, ease: [0.77, 0, 0.175, 1] }}
        className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-slate-950 via-[#172033] to-[#243149] border-l-2 border-amber-400/60 shadow-2xl z-20 flex items-center justify-start pl-4 sm:pl-8"
      />

      {/* 3. Central Unlock Prompt (Before Click) */}
      <AnimatePresence>
        {!isUnlocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="relative z-30 flex flex-col items-center gap-3 text-center px-6"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/20 border-2 border-amber-400/80 flex items-center justify-center text-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-pulse">
              <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300" />
            </div>

            <div className="px-5 py-2.5 rounded-full bg-slate-900/90 border border-amber-400/50 text-amber-300 font-extrabold text-xs sm:text-sm uppercase tracking-widest shadow-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              <span>TAP TO UNLOCK VAULT</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Light Burst behind doors when unlocked */}
      {isUnlocked && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 2 }}
          transition={{ duration: 0.6 }}
          className="absolute w-96 h-96 rounded-full bg-amber-400/30 blur-3xl pointer-events-none z-10"
        />
      )}
    </motion.div>
  );

  return createPortal(content, document.body);
};

export default RewardsFullscreenTransition;
