import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User } from 'lucide-react';
import { soundManager } from '../../../lib/sounds';
import { RivalProfile } from '../types/arena.types';

interface ArenaMatchmakingProps {
  rival: RivalProfile;
  onMatchFound: () => void;
  onCancel?: () => void;
}

const SEARCH_SECONDS = 3;
const REVEAL_DURATION_MS = 1400;

const DIFFICULTY_LABELS: Record<RivalProfile['difficulty'], string> = {
  easy: 'Rookie',
  medium: 'Intermediate',
  hard: 'Advanced',
  boss: 'Champion',
};

export default function ArenaMatchmaking({
  rival,
  onMatchFound,
  onCancel,
}: ArenaMatchmakingProps) {
  const [seconds, setSeconds] = useState(SEARCH_SECONDS);
  const [isFound, setIsFound] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const onMatchFoundRef = useRef(onMatchFound);

  useEffect(() => {
    onMatchFoundRef.current = onMatchFound;
  }, [onMatchFound]);

  useEffect(() => {
    soundManager.play('cms_tick');

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsFound(true);
          soundManager.play('charge');

          timeouts.push(
            setTimeout(() => {
              soundManager.play('clash');
              soundManager.play('turbo_boost');
            }, 300)
          );

          timeouts.push(
            setTimeout(() => {
              onMatchFoundRef.current();
            }, REVEAL_DURATION_MS)
          );

          return 0;
        }
        soundManager.play('cms_tick');
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      timeouts.forEach(clearTimeout);
    };
  }, []);

  const difficultyLabel = DIFFICULTY_LABELS[rival.difficulty] ?? 'Standard';
  const searchProgress = ((SEARCH_SECONDS - seconds) / SEARCH_SECONDS) * 100;

  return (
    <div className="relative w-full min-h-[100dvh] flex-1 flex flex-col items-center justify-center bg-slate-950/92 backdrop-blur-md px-6 py-8 text-center select-none text-white font-sans">
      {/* Top Cancel Action */}
      {onCancel && !isFound && (
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
          <button
            type="button"
            onClick={() => {
              soundManager.play('click');
              onCancel();
            }}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <X size={16} aria-hidden="true" />
            <span>Cancel</span>
          </button>
        </div>
      )}

      {/* Main Centered Matchup Stack */}
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Player vs Opponent Row */}
        <div className="flex items-center justify-center gap-6 sm:gap-8 mb-8">
          {/* Player */}
          <div className="flex flex-col items-center gap-2.5 w-24">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-900 border border-white/15 flex items-center justify-center overflow-hidden">
              {!avatarError ? (
                <img
                  src="/avatar.webp"
                  alt="You"
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={28} className="text-slate-300" aria-hidden="true" />
              )}
            </div>
            <span className="text-sm font-medium text-slate-200 truncate w-full">
              You
            </span>
          </div>

          {/* Center VS Divider */}
          <span className="text-xs font-medium text-slate-500 pb-6 shrink-0">
            vs
          </span>

          {/* Opponent Slot */}
          <div className="flex flex-col items-center gap-2.5 w-24">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
              {!isFound && (
                <div
                  aria-hidden="true"
                  className="absolute -inset-1 rounded-full border-2 border-white/10 border-t-sky-400 animate-spin motion-reduce:animate-none"
                />
              )}

              <AnimatePresence mode="wait">
                {!isFound ? (
                  <motion.div
                    key="unknown"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-full rounded-full bg-slate-900 border border-white/10 flex items-center justify-center"
                  >
                    <span className="text-xl font-semibold text-slate-400">?</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="rival"
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-full rounded-full bg-slate-900 border border-emerald-400/60 flex items-center justify-center"
                  >
                    <span className="text-3xl sm:text-4xl leading-none" role="img" aria-label={rival.name}>
                      {rival.avatar || '🤖'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <span className={`text-sm font-medium truncate w-full ${isFound ? 'text-white' : 'text-slate-400'}`}>
              {isFound ? rival.name : 'Searching'}
            </span>
          </div>
        </div>

        {/* Status Heading & Quiet Unboxed Metadata */}
        <AnimatePresence mode="wait">
          {!isFound ? (
            <motion.div
              key="searching-copy"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center gap-2"
            >
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white text-balance">
                Finding an opponent
              </h2>
              <p className="text-sm text-slate-400 flex items-center gap-2 tabular-nums">
                <span>1v1 Race</span>
                <span aria-hidden="true">·</span>
                <span>{seconds}s</span>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="found-copy"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center gap-2"
            >
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white text-balance">
                Opponent found
              </h2>
              <p className="text-sm text-slate-400 flex items-center gap-2">
                <span>{rival.title}</span>
                <span aria-hidden="true">·</span>
                <span>{difficultyLabel}</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Minimal Linear Progress Line */}
        <div className="w-48 mt-8 flex flex-col items-center gap-3">
          <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
            {!isFound ? (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: Math.max(0.15, searchProgress / 100) }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full origin-left bg-sky-400 rounded-full"
              />
            ) : (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: REVEAL_DURATION_MS / 1000, ease: 'linear' }}
                className="w-full h-full origin-left bg-emerald-400 rounded-full"
              />
            )}
          </div>

          <span className="text-xs text-slate-400">
            {isFound ? 'Starting race...' : 'Matching you with a racer'}
          </span>
        </div>
      </div>
    </div>
  );
}
