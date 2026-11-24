import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RivalProfile, VehicleMotionState } from '../types/arena.types';
import { Bot, MessageSquare } from 'lucide-react';

interface RivalRacerVehicleProps {
  rival: RivalProfile;
  motionState: VehicleMotionState;
  position: 1 | 2;
  gapMeters: number;
  activeQuote: string | null;
}

export function RivalRacerVehicle({
  rival,
  motionState,
  activeQuote
}: RivalRacerVehicleProps) {
  const isAttacking = motionState === 'boost';

  return (
    <div className="relative flex flex-col items-center justify-center select-none pointer-events-none">
      
      {/* RIVAL TAUNT BUBBLE */}
      <AnimatePresence>
        {activeQuote && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.85 }}
            animate={{ opacity: 1, y: -45, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.85 }}
            transition={{ duration: 0.4 }}
            className="absolute z-30 px-3 py-1.5 rounded-2xl bg-purple-950/90 border border-purple-400/60 text-purple-200 text-xs font-bold shadow-xl backdrop-blur-md flex items-center gap-1.5 max-w-[200px] text-center"
          >
            <MessageSquare size={13} className="text-purple-300 shrink-0" />
            <span className="leading-tight truncate">{activeQuote}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RIVAL CYBER BOSS CONTAINER */}
      <motion.div
        animate={{
          y: isAttacking ? [-10, 10, -10] : [0, 6, 0],
          scale: isAttacking ? [1, 1.1, 1] : [1, 1, 1],
          rotate: isAttacking ? [2, -2, 2] : [0, 0, 0]
        }}
        transition={{
          y: { duration: 2.1, repeat: Infinity, ease: 'easeInOut' },
          scale: { duration: 0.3 },
          rotate: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
        }}
        className="relative flex flex-col items-center"
      >
        {/* RIVAL DRIVER HEAD / AVATAR */}
        <div className="relative z-10 w-24 h-24 sm:w-30 sm:h-30 flex items-center justify-center">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-slate-900 via-purple-950 to-slate-950 border-2 border-purple-400/70 flex items-center justify-center shadow-xl shadow-purple-950/60">
            <span className="text-4xl sm:text-5xl filter drop-shadow-md">{rival.avatar}</span>
            <div className="absolute top-3 inset-x-3 h-2 rounded-full bg-rose-500/90 animate-pulse shadow-[0_0_12px_#f43f5e]" />
          </div>
        </div>

        {/* CYBER MATRIX PEDESTAL BASE */}
        <div className="relative -mt-5 z-0 flex flex-col items-center">
          <div className="w-26 sm:w-32 h-8 rounded-[50%] bg-gradient-to-r from-purple-600/40 via-rose-500/60 to-purple-800/40 border border-purple-400/60 shadow-[0_0_20px_rgba(168,85,247,0.6)] flex items-center justify-center">
            <div className="w-18 sm:w-24 h-4 rounded-[50%] bg-purple-300/50 blur-xs" />
          </div>
          <div className="w-22 h-4 rounded-full blur-md -mt-1 bg-purple-500/30" />
        </div>

        {/* RIVAL BOSS NAME BADGE */}
        <div className="mt-1 px-3 py-1 rounded-full bg-slate-950/90 border border-purple-400/50 text-[11px] font-black text-purple-200 tracking-wider shadow-xl backdrop-blur-md flex items-center gap-1.5">
          <Bot size={12} className="text-purple-400" />
          <span>{rival.name.toUpperCase()} (BOSS)</span>
        </div>

      </motion.div>
    </div>
  );
}
