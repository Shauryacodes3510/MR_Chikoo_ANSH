import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ArrowLeft, Flame, Sparkles } from 'lucide-react';
import authMascot from '@/auth_mascot.webp';
import { soundManager } from '../lib/sounds';

interface AppExitConfirmationModalProps {
  isOpen: boolean;
  streak: number;
  onStay: () => void;
  onExit: () => void;
}

export const AppExitConfirmationModal: React.FC<AppExitConfirmationModalProps> = ({
  isOpen,
  streak,
  onStay,
  onExit
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            soundManager.play('click');
            onStay();
          }}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#151c2e] border border-orange-200/60 dark:border-slate-700/80 p-6 shadow-2xl shadow-orange-950/20 text-center overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-16 -left-16 w-36 h-36 bg-orange-400/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />

          {/* Chikoo Mascot */}
          <div className="relative mx-auto w-24 h-24 mb-3 flex items-center justify-center">
            <motion.img
              src={authMascot}
              alt="Chikoo Mascot"
              className="w-full h-full object-contain drop-shadow-md"
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            />
            {streak > 0 && (
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black flex items-center gap-1 shadow-md">
                <Flame size={11} className="fill-white" />
                {streak}d
              </span>
            )}
          </div>

          {/* Title & Description */}
          <h3 className="font-display font-black text-xl text-slate-800 dark:text-white tracking-tight mb-1">
            Leaving already, Explorer?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6">
            Your progress and cookies are safely saved! Complete another quick lesson anytime to grow your streak.
          </p>

          {/* Actions */}
          <div className="space-y-2.5">
            {/* Primary: Keep Learning / Stay */}
            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                onStay();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-white font-black text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles size={16} />
              <span>Keep Learning</span>
            </button>

            {/* Secondary: Exit App */}
            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                onExit();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 active:scale-98 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <LogOut size={13} />
              <span>Exit App</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
