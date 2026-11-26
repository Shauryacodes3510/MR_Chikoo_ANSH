import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertTriangle, Play, LogOut } from 'lucide-react';
import authMascot from '@/auth_mascot.webp';
import { soundManager } from '../lib/sounds';

interface QuitLessonConfirmationModalProps {
  isOpen: boolean;
  currentQuestionIndex: number;
  totalQuestions: number;
  onResume: () => void;
  onQuit: () => void;
}

export const QuitLessonConfirmationModal: React.FC<QuitLessonConfirmationModalProps> = ({
  isOpen,
  currentQuestionIndex,
  totalQuestions,
  onResume,
  onQuit
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            soundManager.play('click');
            onResume();
          }}
          className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-sm rounded-[28px] bg-white dark:bg-[#151c2e] border-2 border-orange-200/80 dark:border-slate-700/80 p-6 shadow-2xl text-center overflow-hidden"
        >
          {/* Ambient Warm Gradient Spots */}
          <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-red-400/15 rounded-full blur-2xl pointer-events-none" />

          {/* Chikoo Mascot with gentle bobbing */}
          <div className="relative mx-auto w-24 h-24 mb-3 flex items-center justify-center">
            <motion.img
              src={authMascot}
              alt="Chikoo Mascot"
              className="w-full h-full object-contain drop-shadow-md"
              animate={{ rotate: [-2, 2, -2], y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
            />
            <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md">
              <AlertTriangle size={14} className="stroke-[2.5]" />
            </span>
          </div>

          {/* Heading */}
          <h3 className="font-display font-black text-2xl text-slate-900 dark:text-white tracking-tight mb-1">
            Quit this Lesson?
          </h3>

          {/* Current Progress Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/60 text-orange-700 dark:text-amber-400 text-xs font-black mb-3">
            <span>Question {currentQuestionIndex + 1} of {totalQuestions} in progress</span>
          </div>

          {/* Body Text */}
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 font-medium leading-relaxed mb-6">
            If you leave right now, your progress in this level won't be saved and you will need to restart from the beginning!
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Primary: Keep Learning */}
            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                onResume();
              }}
              className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:brightness-105 active:scale-98 text-white font-display font-black text-base shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Play size={18} className="fill-white" />
              <span>Keep Learning</span>
            </button>

            {/* Secondary: Leave / Quit Lesson */}
            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                onQuit();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800/80 dark:hover:bg-rose-950/30 text-slate-500 dark:text-slate-400 dark:hover:text-rose-400 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <LogOut size={13} />
              <span>Quit & Exit Level</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
