import React from 'react';
import { motion } from 'framer-motion';

export interface ChikooReachingLoaderProps {
  text?: string;
  className?: string;
  fullScreen?: boolean;
  variant?: 'default' | 'lesson_skeleton';
}

export const LessonSkeletonLoader: React.FC<{ text?: string; fullScreen?: boolean; className?: string }> = ({
  text = "Fetching authentic lesson from database...",
  fullScreen = true,
  className = ""
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className={`w-full flex flex-col justify-between p-4 sm:p-6 bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 select-none overflow-hidden ${
        fullScreen ? 'fixed inset-0 z-[999990] w-full h-[100dvh]' : 'w-full h-full min-h-[420px]'
      } ${className}`}
    >
      {/* 1. Header Skeleton Bar */}
      <div className="w-full max-w-2xl mx-auto flex items-center justify-between gap-3 pt-2 pb-4">
        {/* Back / Close button skeleton */}
        <div className="w-10 h-10 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 animate-pulse shrink-0 border border-slate-300/40 dark:border-slate-700/40" />

        {/* Central Progress Bar Skeleton */}
        <div className="flex-1 max-w-md h-3.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-full overflow-hidden relative border border-slate-300/40 dark:border-slate-700/40">
          <div className="h-full w-1/3 bg-gradient-to-r from-amber-300/40 via-yellow-400/60 to-amber-300/40 rounded-full animate-shimmer" />
        </div>

        {/* Energy badge skeleton */}
        <div className="w-16 h-8 rounded-full bg-slate-200/80 dark:bg-slate-800/80 animate-pulse shrink-0 border border-slate-300/40 dark:border-slate-700/40" />
      </div>

      {/* 2. Main Question Card & Mascot Skeleton */}
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-center gap-5 my-2">
        {/* Mascot Banner Card Placeholder */}
        <div className="w-full bg-white dark:bg-[#111827] rounded-3xl p-5 border-2 border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0 animate-pulse flex items-center justify-center">
            <img
              src="https://myimgs.org/storage/images/43214/ezgifcom-gif-to-svg-converter1.gif"
              alt="Loading"
              className="w-12 h-12 object-contain opacity-70"
            />
          </div>
          <div className="flex-1 space-y-2.5">
            <div className="h-5 w-2/3 bg-slate-200/90 dark:bg-slate-800/90 rounded-lg animate-pulse" />
            <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800/60 rounded-md animate-pulse" />
            <div className="h-3.5 w-4/5 bg-slate-100 dark:bg-slate-800/60 rounded-md animate-pulse" />
          </div>
        </div>

        {/* Question Text Box Skeleton */}
        <div className="w-full bg-white/70 dark:bg-[#111827]/70 rounded-2xl p-4 sm:p-5 border border-slate-200/60 dark:border-slate-800/60 space-y-3">
          <div className="h-4 w-1/3 bg-amber-200/60 dark:bg-amber-900/40 rounded-md animate-pulse" />
          <div className="h-6 w-full bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-6 w-4/5 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        </div>

        {/* Option Cards Skeleton */}
        <div className="w-full space-y-3">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="w-full h-14 sm:h-16 bg-white dark:bg-[#111827] rounded-2xl p-4 border-2 border-slate-200/80 dark:border-slate-800 flex items-center gap-3 animate-pulse shadow-xs"
            >
              <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
              <div className={`h-4 bg-slate-200 dark:bg-slate-800 rounded-md ${idx === 1 ? 'w-3/4' : idx === 2 ? 'w-4/5' : 'w-2/3'}`} />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Bottom CTA Footer Skeleton */}
      <div className="w-full max-w-2xl mx-auto pt-2 pb-4">
        <div className="w-full h-13 rounded-2xl bg-amber-400/40 dark:bg-amber-500/30 border border-amber-300/50 dark:border-amber-600/40 flex items-center justify-center text-amber-900 dark:text-amber-200 font-extrabold text-xs sm:text-sm tracking-wide animate-pulse">
          {text}
        </div>
      </div>
    </motion.div>
  );
};

export const ChikooReachingLoader: React.FC<ChikooReachingLoaderProps> = ({
  text = "Chikoo is reaching...",
  className = "",
  fullScreen = true,
  variant = 'default'
}) => {
  if (variant === 'lesson_skeleton') {
    return <LessonSkeletonLoader text={text} fullScreen={fullScreen} className={className} />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex flex-col items-center justify-center p-6 bg-white dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 select-none ${
        fullScreen ? 'fixed inset-0 z-[999999] w-full h-[100dvh]' : 'w-full h-full min-h-[350px]'
      } ${className}`}
    >
      {/* Centered GIF Animation (Smaller Size) */}
      <div className="relative flex items-center justify-center mb-4">
        <img
          src="https://myimgs.org/storage/images/43214/ezgifcom-gif-to-svg-converter1.gif"
          alt="Chikoo is reaching..."
          className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 object-contain select-none pointer-events-none drop-shadow-sm"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Fade Animation Text */}
      <motion.div 
        initial={{ opacity: 0.3 }}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="font-display font-extrabold text-base sm:text-lg md:text-xl text-slate-800 dark:text-slate-200 tracking-tight text-center h-8 flex items-center justify-center"
      >
        {text}
      </motion.div>
    </motion.div>
  );
};

export default ChikooReachingLoader;
