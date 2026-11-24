import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Check, Play, Bookmark, Leaf, Lock, Puzzle, Flag, BookOpen, Gift, Zap, Star, HelpCircle, Bot, Crown } from 'lucide-react';
import { soundManager } from '../lib/sounds';
import chestImg from '@/Chest.webp';

interface EnvironmentLessonNodeProps {
  biomeIdx: number;
  state: 'locked' | 'active' | 'completed';
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  isChest?: boolean;
  isChallenge?: boolean;
  isBonus?: boolean;
  isPuzzle?: boolean;
  isCheckpoint?: boolean;
  isStory?: boolean;
  bookmarked?: boolean;
  difficulty?: string;
  selectedDifficulty?: string;
  chestIconUrl?: string;
  chest_icon_url?: string;
}

const EnvironmentLessonNode = memo(function EnvironmentLessonNode({
  biomeIdx,
  state,
  onClick,
  className = '',
  size = 'md',
  isChest = false,
  isChallenge = false,
  isBonus = false,
  isPuzzle = false,
  isCheckpoint = false,
  isStory = false,
  bookmarked = false,
  difficulty = 'All',
  selectedDifficulty = 'All',
  chestIconUrl,
  chest_icon_url
}: EnvironmentLessonNodeProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isSpaceBiome = biomeIdx === 3;
  const currentBiome = biomeIdx % 3; // 0: Snow Valley, 1: Emerald Forest, 2: Alpine Mountains
  const actualBiomeIdx = biomeIdx % 5;
  const DEFAULT_DATABASE_CHEST_URL = '/Chest.webp';
  const currentChestImg = chestIconUrl || chest_icon_url || DEFAULT_DATABASE_CHEST_URL;

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const handlePress = () => {
    console.log(`[EnvironmentLessonNode] Press/Click triggered: biomeIdx=${biomeIdx}, state="${state}", isChest=${isChest}, isChallenge=${isChallenge}, isBonus=${isBonus}`);
    soundManager.play('click');
    if (onClick) onClick();
  };

  // Helper to render the inner icon based on lesson type & state
  const renderInnerIcon = () => {
    if (isChest) {
      return (
        <div className="relative flex items-center justify-center">
          <img 
            src={currentChestImg} 
            alt="Chest" 
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/Chest.webp'; }}
            className={`w-10 h-10 object-contain drop-shadow-[0_2.5px_5px_rgba(0,0,0,0.25)] ${state === 'locked' ? 'opacity-40 grayscale' : 'animate-bounce'}`}
            style={{ animationDuration: state === 'locked' ? '0s' : '3.5s' }}
            referrerPolicy="no-referrer"
          />
          {state === 'completed' && (
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border border-white shadow-sm flex items-center justify-center z-20">
              <Check className="w-3.5 h-3.5 text-white stroke-[4px]" />
            </div>
          )}
          {state === 'locked' && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <Lock className="w-4.5 h-4.5 text-slate-800 fill-slate-600/20 stroke-[3px] drop-shadow-sm" />
            </div>
          )}
        </div>
      );
    }

    if (state === 'completed') {
      return <Check className="w-8 h-8 text-white stroke-[4.5px] drop-shadow-[0_1.5px_3px_rgba(255,255,255,0.15)]" />;
    }

    if (isChallenge) {
      const iconClass = size === 'sm' ? "w-6 h-6 text-white stroke-[2.5px]" : size === 'md' ? "w-8 h-8 text-white stroke-[2.5px]" : "w-11 h-11 text-white stroke-[2.5px]";
      return <Zap className={`${iconClass} fill-white`} />;
    }

    if (state === 'locked') {
      const lockSize = size === 'sm' ? "w-4.5 h-4.5" : size === 'md' ? "w-5.5 h-5.5" : "w-6.5 h-6.5";
      const isWhiteLock = actualBiomeIdx === 1 || actualBiomeIdx === 2 || actualBiomeIdx === 3 || actualBiomeIdx === 4;
      return (
        <Lock 
          className={`${lockSize} ${
            isWhiteLock 
              ? 'text-white/95 fill-white/25' 
              : 'text-slate-700/95 dark:text-slate-200 fill-slate-600/40 dark:fill-slate-300/30'
          } stroke-[2.5px] drop-shadow-sm`} 
        />
      );
    }

    // Centered, large, minimal, and highly legible icons for active nodes
    const iconClass = size === 'sm' ? "w-6 h-6 text-white stroke-[2.5px]" : size === 'md' ? "w-8 h-8 text-white stroke-[2.5px]" : "w-11 h-11 text-white stroke-[2.5px]";

    if (isBonus) {
      return <Crown className={`${iconClass} fill-white/20`} />;
    }

    if (isCheckpoint) {
      return <HelpCircle className={`${iconClass} fill-white/20`} />;
    }

    if (isPuzzle || isStory) {
      return <Bot className={`${iconClass} fill-white/10`} />;
    }

    // Default: Play icon for active lesson
    return <Play className={`${iconClass} fill-white translate-x-0.5 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]`} />;
  };



  if (isChest) {
    return (
      <div className={`relative flex items-center justify-center select-none ${className}`}>
        <motion.div
          whileHover={{ scale: 1.10 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClick ? handlePress : undefined}
          className="relative flex items-center justify-center cursor-pointer"
        >
          {/* Render the chest image: increased size (w-28 h-28) without any pedestal base */}
          <div className="relative flex items-center justify-center">
            <img 
              src={currentChestImg} 
              alt="Chest" 
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/Chest.webp'; }}
              className={`w-28 h-28 object-contain transition-transform duration-300 ${
                state === 'locked' ? 'opacity-40 grayscale' : ''
              }`}
              referrerPolicy="no-referrer"
            />
            {state === 'completed' && (
              <div className="absolute bottom-2 right-2 bg-emerald-500 rounded-full p-1 border-2 border-white shadow-md flex items-center justify-center z-20">
                <Check className="w-4 h-4 text-white stroke-[4.5px]" />
              </div>
            )}
            {state === 'locked' && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="bg-slate-900/60 rounded-full p-2 backdrop-blur-[1.5px] border border-white/20 shadow-lg">
                  <Lock className="w-5 h-5 text-white stroke-[3px]" />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Bookmark Ribbon Widget (Shared across all biomes) */}
        {bookmarked && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 z-30 w-6 h-6 bg-pink-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg"
          >
            <Bookmark size={11} className="text-white fill-current animate-pulse" />
          </motion.div>
        )}
      </div>
    );
  }

  if (isChallenge) {
    const isCompleted = state === 'completed';
    return (
      <div className={`relative flex items-center justify-center select-none ${className}`}>
        {/* Dynamic Keyframes for Custom Premium Effects */}

        <motion.div
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          onTap={handlePress}
          onClick={handlePress}
          className={`relative rounded-full flex items-center justify-center ${sizeClasses[size]} ${state === 'active' ? 'animate-env-breathe-slow' : ''}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
        >
          {isCompleted ? (
            <>
              {/* Clean golden completion glow */}
              <div className="absolute -inset-4 bg-amber-400/25 rounded-full blur-xl -z-10 pointer-events-none" />
              <div className="absolute -inset-2.5 rounded-full border border-amber-300/40 pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-full rounded-full bg-slate-300/40 translate-y-[6px] blur-[1px] -z-20 pointer-events-none" />
              <div className="absolute inset-0 rounded-full translate-y-[5px] -z-10 transition-colors duration-300 bg-amber-700" />
              <button
                onClick={onClick ? handlePress : undefined}
                className="w-full h-full rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 relative overflow-hidden border-2 active:translate-y-[4px] border-amber-200 bg-gradient-to-b from-amber-300 via-amber-400 to-yellow-500 text-white shadow-[0_6px_20px_rgba(245,158,11,0.45),inset_0_2px_6px_rgba(255,255,255,0.75)]"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <Check className={`${size === 'sm' ? "w-6 h-6" : size === 'md' ? "w-8 h-8" : "w-11 h-11"} text-white stroke-[4.5px] drop-shadow-[0_2px_4px_rgba(180,83,9,0.5)]`} />
                </span>
              </button>
            </>
          ) : (
            <>
              {/* Active & Inactive/Locked State for Challenge Pack Node:
                  Keep active state design (strike icon + golden yellow color + energetic aura) even when locked */}
              {/* Soft Rotating Energy Ring */}
              <div 
                className="absolute -inset-4 rounded-full border-2 border-amber-400/50 border-dashed pointer-events-none animate-env-rotate-clockwise"
              />
              <div 
                className="absolute -inset-6 rounded-full border border-amber-300/30 pointer-events-none animate-env-rotate-counter"
              />
              {/* Soft breathing background glow */}
              <div className="absolute -inset-8 bg-amber-400/25 rounded-full blur-2xl -z-10 pointer-events-none animate-pulse" />
              {/* Orbiting particles - GPU CSS accelerated */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div 
                  className="absolute w-1.5 h-1.5 bg-amber-200 rounded-full shadow-xs"
                  style={{ animation: 'cosmic-orbit-1 6s linear infinite' }}
                />
                <div 
                  className="absolute w-1 h-1 bg-white rounded-full shadow-xs"
                  style={{ animation: 'cosmic-orbit-2 8s linear infinite' }}
                />
              </div>

              {/* Base Container Button Structure with 3D physical checkpoint style */}
              <div className="absolute inset-x-0 bottom-0 h-full rounded-full bg-slate-300/40 translate-y-[6px] blur-[1px] -z-20 pointer-events-none" />
              <div className="absolute inset-0 rounded-full translate-y-[5px] -z-10 transition-colors duration-300 bg-amber-700" />
              <button
                onClick={onClick ? handlePress : undefined}
                className="w-full h-full rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 relative overflow-hidden border-2 active:translate-y-[4px] border-white bg-gradient-to-b from-amber-300 via-amber-400 to-yellow-500 text-white shadow-[0_8px_24px_rgba(245,158,11,0.4),inset_0_2px_6px_rgba(255,255,255,0.7)]"
              >
                {/* Shimmer sweep */}
                <div 
                  className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-20 pointer-events-none"
                  style={{
                    animation: 'env-shimmer-sweep 4s ease-in-out infinite',
                    animationDelay: '1.5s'
                  }}
                />

                {/* Inner Content Icon: Strike (Zap) */}
                <span className="relative z-10 flex items-center justify-center">
                  <Zap className={`${size === 'sm' ? "w-6 h-6" : size === 'md' ? "w-8 h-8" : "w-11 h-11"} text-white stroke-[2.5px] fill-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]`} />
                </span>
              </button>
            </>
          )}
        </motion.div>

        {/* Bookmark Ribbon Widget */}
        {bookmarked && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 z-30 w-6 h-6 bg-pink-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg"
          >
            <Bookmark size={11} className="text-white fill-current animate-pulse" />
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Dynamic Keyframes for Custom Premium Effects */}
      <style>{`
        @keyframes env-rotate-clockwise {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes env-rotate-counter {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes env-breathe-slow {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.04); filter: brightness(1.08); }
        }
        @keyframes env-leaf-sway {
          0%, 100% { transform: rotate(-6deg); }
          50% { transform: rotate(6deg); }
        }
        @keyframes env-butterfly-flight {
          0%, 100% { transform: translate(0, 0) scaleX(1); opacity: 0.8; }
          25% { transform: translate(25px, -15px) scaleX(-1); opacity: 0.9; }
          50% { transform: translate(10px, 20px) scaleX(1); opacity: 0.7; }
          75% { transform: translate(-20px, -10px) scaleX(-1); opacity: 0.9; }
        }
        @keyframes env-feather-drift {
          0%, 100% { transform: translate(-10px, -20px) rotate(-15deg); opacity: 0; }
          10% { opacity: 0.8; }
          50% { transform: translate(15px, 10px) rotate(15deg); opacity: 0.7; }
          90% { opacity: 0.8; }
          100% { transform: translate(-10px, 30px) rotate(-10deg); opacity: 0; }
        }
        @keyframes env-shimmer-sweep {
          0% { left: -150%; }
          100% { left: 150%; }
        }
        @keyframes env-waterfall-mist {
          0%, 100% { opacity: 0.3; transform: scaleY(0.9) translateY(0); }
          50% { opacity: 0.65; transform: scaleY(1.1) translateY(4px); }
        }
        @keyframes cosmic-halo-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes cosmic-breathe {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 6px rgba(34, 211, 238, 0.45)); }
          50% { transform: scale(1.04); filter: drop-shadow(0 0 14px rgba(34, 211, 238, 0.75)); }
        }
        @keyframes cosmic-sparkle {
          0%, 100% { opacity: 0.3; transform: scale(0.7); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes cosmic-orbit-1 {
          0% { transform: rotate(0deg) translateX(36px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(36px) rotate(-360deg); }
        }
        @keyframes cosmic-orbit-2 {
          0% { transform: rotate(180deg) translateX(42px) rotate(-180deg); }
          100% { transform: rotate(540deg) translateX(42px) rotate(-540deg); }
        }
      `}</style>

      {/* -----------------------------------------------------------------
          UNIT 1 — SNOW VALLEY (currentBiome === 0)
          ----------------------------------------------------------------- */}
      {!isSpaceBiome && currentBiome === 0 && (
        <motion.div
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          onTap={handlePress}
          onClick={handlePress}
          className={`relative rounded-full flex items-center justify-center ${sizeClasses[size]}`}
          style={{
            animation: state === 'active' ? 'env-breathe-slow 3.5s ease-in-out infinite' : 'none'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
        >
          {/* Active Specific Elements */}
          {state === 'active' && (
            <>
              {/* Soft Rotating Energy Ring */}
              <div 
                className="absolute -inset-4 rounded-full border-2 border-sky-400/40 border-dashed pointer-events-none"
                style={{ animation: 'env-rotate-clockwise 22s linear infinite' }}
              />
              <div 
                className="absolute -inset-6 rounded-full border border-sky-300/20 pointer-events-none"
                style={{ animation: 'env-rotate-counter 30s linear infinite' }}
              />
              {/* Soft breathing background glow */}
              <div className="absolute -inset-8 bg-sky-400/25 rounded-full blur-2xl -z-10 pointer-events-none animate-pulse" />
              {/* Orbiting snow particles - GPU CSS accelerated */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div 
                  className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-xs"
                  style={{ animation: 'cosmic-orbit-1 7s linear infinite' }}
                />
                <div 
                  className="absolute w-1 h-1 bg-sky-200 rounded-full shadow-xs"
                  style={{ animation: 'cosmic-orbit-2 9s linear infinite' }}
                />
              </div>
            </>
          )}

          {/* Locked Specific Elements */}
          {state === 'locked' && (
            <>
              {/* Winter fog wrapper & frost background */}
              <div className="absolute -inset-5 bg-white/10 rounded-full blur-md -z-10 pointer-events-none" />
              {/* Static clean outer frost ring */}
              <div className="absolute -inset-3 rounded-full border border-white/25 pointer-events-none" />
            </>
          )}

          {/* Completed Specific Elements */}
          {state === 'completed' && (
            <>
              {/* Clean completion glow */}
              <div className="absolute -inset-4 bg-emerald-400/10 rounded-full blur-xl -z-10 pointer-events-none" />
            </>
          )}

          {/* Base Container Button Structure with 3D physical checkpoint style */}
          <div className="absolute inset-x-0 bottom-0 h-full rounded-full bg-slate-300/40 dark:bg-slate-800/40 translate-y-[6px] blur-[1px] -z-20 pointer-events-none" />
          <div className={`absolute inset-0 rounded-full translate-y-[5px] -z-10 transition-colors duration-300 ${
            state === 'completed'
              ? 'bg-emerald-600'
              : state === 'active'
                ? 'bg-sky-700'
                : 'bg-slate-300/80 dark:bg-[#151c2e]'
          }`} />
          <button
            onClick={onClick ? handlePress : undefined}
            className={`w-full h-full rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 relative overflow-hidden border-2 active:translate-y-[4px] ${
              state === 'completed' 
                ? 'border-emerald-300 bg-gradient-to-b from-emerald-400 to-teal-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3),inset_0_2px_4px_rgba(255,255,255,0.6)]' 
                : state === 'active'
                  ? 'border-white bg-gradient-to-b from-sky-400 via-sky-500 to-blue-600 text-white shadow-[0_8px_24px_rgba(14,165,233,0.35),inset_0_2px_6px_rgba(255,255,255,0.65)]'
                  : 'border-slate-200 dark:border-slate-700/60 bg-gradient-to-b from-slate-100 to-slate-200/95 dark:from-[#243149] dark:to-[#172033] text-slate-400 dark:text-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]'
            }`}
          >
            {/* Ice Shimmer effect for Active only */}
            {state === 'active' && (
              <div 
                className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-20 pointer-events-none"
                style={{
                  animation: 'env-shimmer-sweep 4s ease-in-out infinite',
                  animationDelay: '1.5s'
                }}
              />
            )}

            {/* Frost on Edges for Locked State */}
            {state === 'locked' && (
              <div className="absolute inset-0 border border-sky-200/25 rounded-full pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,rgba(224,242,254,0.2)_100%)]" />
            )}

            {/* Inner Content Icon */}
            <span className="relative z-10 flex items-center justify-center">
              {renderInnerIcon()}
            </span>

            {/* Custom Snowflake Vector embedded inside Snow node */}
            {state === 'completed' && !isChest && !isChallenge && !isBonus && (
              <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
                <svg className="w-12 h-12 text-sky-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2v20M17 5L7 19M19 12H5M19 17L5 7" strokeLinecap="round" />
                </svg>
              </div>
            )}
          </button>
        </motion.div>
      )}

      {/* -----------------------------------------------------------------
          UNIT 2 — SAKURA FOREST (actualBiomeIdx === 1)
          ----------------------------------------------------------------- */}
      {actualBiomeIdx === 1 && (
        <motion.div
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          onTap={handlePress}
          onClick={handlePress}
          className={`relative rounded-full flex items-center justify-center ${sizeClasses[size]}`}
          style={{
            animation: state === 'active' ? 'env-breathe-slow 3.8s ease-in-out infinite' : 'none'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
        >
          {/* Active Specific Elements */}
          {state === 'active' && (
            <>
              {/* Soft Rotating Cherry Ring */}
              <div 
                className="absolute -inset-4 rounded-full border border-pink-400/35 pointer-events-none"
                style={{ animation: 'env-rotate-clockwise 26s linear infinite' }}
              />
              <div 
                className="absolute -inset-6 rounded-full border border-pink-300/15 pointer-events-none"
                style={{ animation: 'env-rotate-counter 32s linear infinite' }}
              />
              {/* Glowing blossom energy ring */}
              <div className="absolute -inset-8 bg-pink-500/15 rounded-full blur-2xl -z-10 pointer-events-none" />
              {/* Orbiting glowing cherry blossoms - GPU CSS accelerated */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div 
                  className="absolute text-[11px] select-none"
                  style={{ animation: 'cosmic-orbit-1 7s linear infinite' }}
                >
                  🌸
                </div>
                <div 
                  className="absolute w-1 h-1 bg-pink-200 rounded-full shadow-[0_0_4px_#ec4899]"
                  style={{ animation: 'cosmic-orbit-2 9s linear infinite' }}
                />
              </div>
            </>
          )}

          {/* Locked Specific Elements */}
          {state === 'locked' && (
            <>
              <div className="absolute -inset-5 bg-pink-950/5 rounded-full blur-md -z-10 pointer-events-none" />
              <div className="absolute inset-[-4px] pointer-events-none z-20">
                <svg viewBox="0 0 100 100" fill="none" className="w-full h-full overflow-visible">
                  <path
                    d="M 15 50 C 15 30, 30 15, 50 15 C 70 15, 85 30, 85 50 C 85 70, 70 85, 50 85 Z"
                    stroke="#db2777"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </>
          )}

          {/* Completed Specific Elements */}
          {state === 'completed' && (
            <>
              <div className="absolute inset-[-6px] pointer-events-none z-10">
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                  <circle cx="50" cy="8" r="3.5" fill="#db2777" />
                  <circle cx="50" cy="8" r="1" fill="#fbcfe8" />
                  <circle cx="20" cy="20" r="3" fill="#ec4899" />
                  <circle cx="80" cy="20" r="3" fill="#f472b6" />
                </svg>
              </div>
            </>
          )}

          {/* Base Container Button Structure with 3D physical checkpoint style */}
          <div className="absolute inset-x-0 bottom-0 h-full rounded-full bg-pink-950/20 translate-y-[6px] blur-[1px] -z-20 pointer-events-none" />
          <div className={`absolute inset-0 rounded-full translate-y-[5px] -z-10 transition-colors duration-300 ${
            state === 'completed'
              ? 'bg-emerald-700'
              : state === 'active'
                ? 'bg-pink-700'
                : 'bg-pink-900/40'
          }`} />
          <button
            onClick={onClick ? handlePress : undefined}
            className={`w-full h-full rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 relative overflow-hidden border-2 active:translate-y-[4px] ${
              state === 'completed' 
                ? 'border-emerald-300 bg-gradient-to-b from-emerald-400 to-teal-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3),inset_0_2px_4px_rgba(255,255,255,0.6)]' 
                : state === 'active'
                  ? 'border-white bg-gradient-to-b from-pink-400 via-pink-500 to-rose-600 text-white shadow-[0_8px_24px_rgba(236,72,153,0.35),inset_0_2px_6px_rgba(255,255,255,0.65)]'
                  : 'border-pink-950/60 bg-gradient-to-b from-pink-900/40 to-pink-950/50 text-pink-700/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]'
            }`}
          >
            {state === 'active' && (
              <div 
                className="absolute inset-y-0 w-2/3 bg-gradient-to-r from-transparent via-pink-200/20 to-transparent -skew-x-12 pointer-events-none"
                style={{
                  animation: 'env-shimmer-sweep 5s ease-in-out infinite'
                }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center">
              {renderInnerIcon()}
            </span>
          </button>
        </motion.div>
      )}

      {/* -----------------------------------------------------------------
          UNIT 3 — LOST DESERT (actualBiomeIdx === 2)
          ----------------------------------------------------------------- */}
      {actualBiomeIdx === 2 && (
        <motion.div
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          onTap={handlePress}
          onClick={handlePress}
          className={`relative rounded-full flex items-center justify-center ${sizeClasses[size]}`}
          style={{
            animation: state === 'active' ? 'env-breathe-slow 3.6s ease-in-out infinite' : 'none'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
        >
          {/* Active Specific Elements */}
          {state === 'active' && (
            <>
              <div 
                className="absolute -inset-4 rounded-full border border-yellow-400/35 pointer-events-none"
                style={{ animation: 'env-rotate-clockwise 24s linear infinite' }}
              />
              <div 
                className="absolute -inset-6 rounded-full border border-amber-300/15 pointer-events-none"
                style={{ animation: 'env-rotate-counter 28s linear infinite' }}
              />
              <div className="absolute -inset-8 bg-amber-500/15 rounded-full blur-2xl -z-10 pointer-events-none animate-pulse" />
              {/* Orbiting glowing dust - GPU CSS accelerated */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div 
                  className="absolute text-[10px] select-none"
                  style={{ animation: 'cosmic-orbit-1 7s linear infinite' }}
                >
                  🌵
                </div>
              </div>
            </>
          )}

          {/* Locked Specific Elements */}
          {state === 'locked' && (
            <>
              <div className="absolute -inset-5 bg-amber-950/5 rounded-full blur-md -z-10 pointer-events-none" />
              <div className="absolute inset-[-4px] pointer-events-none z-20 opacity-60">
                <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                  <polygon points="50,15 75,30 70,52 50,38" fill="rgba(251,191,36,0.1)" stroke="rgba(251,191,36,0.3)" strokeWidth="0.8" />
                  <polygon points="50,15 25,30 30,52 50,38" fill="rgba(251,191,36,0.12)" stroke="rgba(251,191,36,0.3)" strokeWidth="0.8" />
                </svg>
              </div>
            </>
          )}

          {/* Completed Specific Elements */}
          {state === 'completed' && (
            <>
              <div className="absolute -inset-4 bg-amber-900/5 rounded-full blur-xl -z-10 pointer-events-none" />
            </>
          )}

          {/* Base Container Button Structure with 3D physical checkpoint style */}
          <div className="absolute inset-x-0 bottom-0 h-full rounded-full bg-amber-950/25 translate-y-[6px] blur-[1px] -z-20 pointer-events-none" />
          <div className={`absolute inset-0 rounded-full translate-y-[5px] -z-10 transition-colors duration-300 ${
            state === 'completed'
              ? 'bg-emerald-600'
              : state === 'active'
                ? 'bg-yellow-700'
                : 'bg-yellow-950/40'
          }`} />
          <button
            onClick={onClick ? handlePress : undefined}
            className={`w-full h-full rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 relative overflow-hidden border-2 active:translate-y-[4px] ${
              state === 'completed' 
                ? 'border-emerald-300 bg-gradient-to-b from-emerald-400 to-teal-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3),inset_0_2px_4px_rgba(255,255,255,0.6)]' 
                : state === 'active'
                  ? 'border-white bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-600 text-white shadow-[0_8px_24px_rgba(245,158,11,0.35),inset_0_2px_6px_rgba(255,255,255,0.65)]'
                  : 'border-yellow-900/60 bg-gradient-to-b from-yellow-900/40 to-yellow-950/50 text-yellow-700/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]'
            }`}
          >
            {state === 'active' && (
              <div 
                className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-25 pointer-events-none"
                style={{
                  animation: 'env-shimmer-sweep 4.5s ease-in-out infinite'
                }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center">
              {renderInnerIcon()}
            </span>
          </button>
        </motion.div>
      )}

      {/* -----------------------------------------------------------------
          UNIT 4 — MAGMA FORGE (actualBiomeIdx === 3)
          ----------------------------------------------------------------- */}
      {actualBiomeIdx === 3 && (
        <motion.div
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          onTap={handlePress}
          onClick={handlePress}
          className={`relative rounded-full flex items-center justify-center ${sizeClasses[size]}`}
          style={{
            animation: state === 'active' ? 'env-breathe-slow 3.4s ease-in-out infinite' : 'none'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
        >
          {/* Active Specific Elements */}
          {state === 'active' && (
            <>
              <div 
                className="absolute -inset-4 rounded-full border border-red-500/30 border-dashed pointer-events-none"
                style={{ animation: 'env-rotate-clockwise 18s linear infinite' }}
              />
              <div 
                className="absolute -inset-6 rounded-full border border-orange-500/15 pointer-events-none"
                style={{ animation: 'env-rotate-counter 24s linear infinite' }}
              />
              <div className="absolute -inset-8 bg-red-600/20 rounded-full blur-2xl -z-10 pointer-events-none animate-pulse" />
              {/* Hot ash sparks - GPU CSS accelerated */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div 
                  className="absolute w-1.5 h-1.5 bg-orange-400 rounded-full shadow-[0_0_6px_#ea580c]"
                  style={{ animation: 'cosmic-orbit-1 6s linear infinite' }}
                />
              </div>
            </>
          )}

          {/* Locked Specific Elements */}
          {state === 'locked' && (
            <>
              <div className="absolute -inset-4 bg-red-950/10 rounded-full blur-xl -z-10 pointer-events-none" />
            </>
          )}

          {/* Completed Specific Elements */}
          {state === 'completed' && (
            <>
              <div className="absolute -inset-4 bg-red-500/10 rounded-full blur-xl -z-10 pointer-events-none shadow-[0_0_12px_rgba(239,68,68,0.2)]" />
            </>
          )}

          {/* Base Container Button Structure with 3D physical checkpoint style */}
          <div className="absolute inset-x-0 bottom-0 h-full rounded-full bg-stone-950/60 translate-y-[6px] blur-[1px] -z-20 pointer-events-none" />
          <div className={`absolute inset-0 rounded-full translate-y-[5px] -z-10 transition-colors duration-300 ${
            state === 'completed'
              ? 'bg-emerald-600'
              : state === 'active'
                ? 'bg-red-950'
                : 'bg-stone-900/80'
          }`} />
          <button
            onClick={onClick ? handlePress : undefined}
            className={`w-full h-full rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 relative overflow-hidden border-2 active:translate-y-[4px] ${
              state === 'completed' 
                ? 'border-emerald-300 bg-gradient-to-b from-emerald-400 to-teal-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3),inset_0_2px_4px_rgba(255,255,255,0.6)]' 
                : state === 'active'
                  ? 'border-red-500 bg-gradient-to-tr from-stone-950 via-red-900 to-orange-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4),inset_0_2px_6px_rgba(255,255,255,0.45)]'
                  : 'border-stone-850 bg-gradient-to-tr from-stone-900 via-stone-850 to-stone-900 text-stone-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]'
            }`}
          >
            {state === 'active' && (
              <div 
                className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-red-400/20 to-transparent -skew-x-25 pointer-events-none"
                style={{
                  animation: 'env-shimmer-sweep 4.5s ease-in-out infinite'
                }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center">
              {renderInnerIcon()}
            </span>
          </button>
        </motion.div>
      )}

      {/* -----------------------------------------------------------------
          UNIT 5 — GALAXY NEXUS (actualBiomeIdx === 4)
          ----------------------------------------------------------------- */}
      {actualBiomeIdx === 4 && (
        <motion.div
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          onTap={handlePress}
          onClick={handlePress}
          className={`relative rounded-full flex items-center justify-center ${sizeClasses[size]}`}
          style={{
            animation: state === 'active' ? 'cosmic-breathe 4s ease-in-out infinite' : 'none'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
        >
          {/* Active Specific Elements */}
          {state === 'active' && (
            <>
              <div 
                className="absolute -inset-4 rounded-full border border-purple-400/30 border-dashed pointer-events-none"
                style={{ animation: 'cosmic-halo-rotate 16s linear infinite' }}
              />
              <div 
                className="absolute -inset-5 rounded-full border border-cyan-400/15 pointer-events-none"
                style={{ animation: 'env-rotate-counter 24s linear infinite' }}
              />
              <div className="absolute -inset-8 bg-purple-500/20 rounded-full blur-2xl -z-10 pointer-events-none" />
              {/* Orbiting sparkles */}
              <div className="absolute inset-0 pointer-events-none">
                <div 
                  className="absolute w-1.5 h-1.5 bg-cyan-300 rounded-full blur-[0.5px]" 
                  style={{ animation: 'cosmic-orbit-1 6s linear infinite' }} 
                />
                <div 
                  className="absolute w-1 h-1 bg-purple-300 rounded-full blur-[0.5px]" 
                  style={{ animation: 'cosmic-orbit-2 8s linear infinite' }} 
                />
              </div>
            </>
          )}

          {/* Locked Specific Elements */}
          {state === 'locked' && (
            <>
              <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-xl -z-10 pointer-events-none" />
            </>
          )}

          {/* Completed Specific Elements */}
          {state === 'completed' && (
            <>
              <div className="absolute -inset-2.5 rounded-full border border-purple-400/20 pointer-events-none" />
              <div className="absolute -inset-4 bg-purple-500/10 rounded-full blur-xl -z-10 pointer-events-none shadow-[0_0_16px_rgba(168,85,247,0.35)]" />
              <div className="absolute -top-1.5 -right-1.5 z-20 pointer-events-none" style={{ animation: 'cosmic-sparkle 7s ease-in-out infinite' }}>
                <Sparkles className="w-4 h-4 text-purple-300" />
              </div>
            </>
          )}

          {/* Base Container Button Structure with 3D physical checkpoint style */}
          <div className="absolute inset-x-0 bottom-0 h-full rounded-full bg-indigo-950/50 translate-y-[6px] blur-[1px] -z-20 pointer-events-none" />
          <div className={`absolute inset-0 rounded-full translate-y-[5px] -z-10 transition-colors duration-300 ${
            state === 'completed'
              ? 'bg-emerald-600'
              : state === 'active'
                ? 'bg-indigo-900'
                : 'bg-indigo-950/80'
          }`} />
          <button
            onClick={onClick ? handlePress : undefined}
            className={`w-full h-full rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 relative overflow-hidden border-2 active:translate-y-[4px] ${
              state === 'completed' 
                ? 'border-emerald-300 bg-gradient-to-b from-emerald-400 to-teal-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3),inset_0_2px_4px_rgba(255,255,255,0.6)]' 
                : state === 'active'
                  ? 'border-purple-400 bg-gradient-to-tr from-indigo-950 via-purple-900 to-indigo-700 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.5),inset_0_2px_8px_rgba(255,255,255,0.55)]'
                  : 'border-indigo-900/50 bg-gradient-to-tr from-indigo-950/40 via-slate-900/40 to-indigo-950/30 text-indigo-500/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)]'
            }`}
          >
            {state === 'active' && (
              <div 
                className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-25 pointer-events-none"
                style={{
                  animation: 'env-shimmer-sweep 4.5s ease-in-out infinite'
                }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center">
              {renderInnerIcon()}
            </span>
          </button>
        </motion.div>
      )}

      {/* Bookmark Ribbon Widget (Shared across all biomes) */}
      {bookmarked && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 z-30 w-6 h-6 bg-pink-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg"
        >
          <Bookmark size={11} className="text-white fill-current animate-pulse" />
        </motion.div>
      )}


    </div>
  );
});

export default EnvironmentLessonNode;
