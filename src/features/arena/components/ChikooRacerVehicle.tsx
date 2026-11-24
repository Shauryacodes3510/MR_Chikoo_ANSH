import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VehicleMotionState } from '../types/arena.types';
import { Zap, Shield, AlertTriangle } from 'lucide-react';

interface ChikooRacerVehicleProps {
  motionState: VehicleMotionState;
  isOverdrive: boolean;
  streakCount: number;
  currentSpeed: number;
  gapMeters: number;
  position: 1 | 2;
  lastAnswerResult: {
    isCorrect: boolean;
    speedDelta: number;
    xpEarned: number;
    boostLabel: string;
  } | null;
}

export function ChikooRacerVehicle({
  motionState,
  isOverdrive,
  streakCount,
  lastAnswerResult
}: ChikooRacerVehicleProps) {
  const isAttacking = motionState === 'boost' || motionState === 'hyper';
  const isHurt = motionState === 'stall';

  return (
    <div className="relative flex flex-col items-center justify-center select-none pointer-events-none">
      
      {/* FLOATING PLASMA IMPACT NOTIFICATION */}
      <AnimatePresence>
        {lastAnswerResult && (
          <motion.div
            key={`feedback-${lastAnswerResult.boostLabel}-${Date.now()}`}
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: -42, scale: 1 }}
            exit={{ opacity: 0, y: -65, scale: 0.8 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className={`absolute z-30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xl whitespace-nowrap ${
              lastAnswerResult.isCorrect
                ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white border border-cyan-300 shadow-cyan-500/40'
                : 'bg-gradient-to-r from-rose-600 to-amber-600 text-white border border-amber-300 shadow-rose-500/40'
            }`}
          >
            {lastAnswerResult.isCorrect ? (
              <>
                <Zap size={13} className="text-yellow-300 animate-bounce" />
                <span>{lastAnswerResult.boostLabel.replace('NITRO BOOST', 'PLASMA STRIKE')}</span>
              </>
            ) : (
              <>
                <AlertTriangle size={13} className="text-amber-200" />
                <span>SHIELD DAMAGED!</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERDRIVE AURA RING */}
      {isOverdrive && (
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -inset-4 rounded-full bg-gradient-to-r from-cyan-400/30 via-sky-500/40 to-indigo-500/30 blur-xl -z-10"
        />
      )}

      {/* CHIKOO BATTLE HERO CONTAINER */}
      <motion.div
        animate={{
          y: isHurt 
            ? [0, -6, 8, 0] 
            : isAttacking ? [-10, 10, -10] : [0, -5, 0],
          scale: isAttacking ? [1, 1.12, 1] : [1, 1, 1],
          rotate: isHurt ? [-4, 5, -2, 0] : isAttacking ? [-2, 2, -2] : [0, 0, 0]
        }}
        transition={{
          y: { duration: isHurt ? 0.35 : 1.8, repeat: Infinity, ease: 'easeInOut' },
          scale: { duration: 0.3 },
          rotate: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
        }}
        className="relative flex flex-col items-center"
      >
        {/* CHIKOO HERO MASCOT */}
        <div className="relative z-10 w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
          <img
            src="https://i.postimg.cc/26s9wx65/fd6286db-33fd-4145-9a55-4ca196446b6d-removebg-preview.png"
            alt="Chikoo Battle Hero"
            referrerPolicy="no-referrer"
            className={`w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.7)] transition-all duration-300 ${
              isAttacking ? 'brightness-125 scale-105' : isHurt ? 'brightness-75' : ''
            }`}
          />
        </div>

        {/* COSMIC PLASMA PEDESTAL BASE */}
        <div className="relative -mt-6 z-0 flex flex-col items-center">
          <div className="w-28 sm:w-36 h-8 rounded-[50%] bg-gradient-to-r from-sky-500/40 via-cyan-400/60 to-indigo-500/40 border border-cyan-300/60 shadow-[0_0_20px_rgba(56,189,248,0.6)] flex items-center justify-center">
            <div className="w-20 sm:w-28 h-4 rounded-[50%] bg-cyan-300/50 blur-xs" />
          </div>
          <div className="w-24 h-4 rounded-full blur-md -mt-1 bg-cyan-400/30" />
        </div>

        {/* HERO NAME & COMBO BADGE */}
        <div className="mt-1 px-3 py-1 rounded-full bg-slate-950/90 border border-sky-400/50 text-[11px] font-black text-sky-200 tracking-wider shadow-xl backdrop-blur-md flex items-center gap-1.5">
          <Shield size={12} className="text-cyan-400" />
          <span>CHIKOO</span>
          {streakCount >= 2 && (
            <span className="text-amber-300 font-mono font-black ml-1">🔥 {streakCount}x COMBO</span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
