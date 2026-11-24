import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Wifi, WifiOff } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { World, UserWorldProgress } from '../lib/supabase';
import { soundManager } from '../lib/sounds';
import { useTranslation } from '../lib/translation/TranslationContext';
import worldIcon from '@/world.webp';
import streakIcon from '@/streak.webp';
import cookiesIcon from '@/cookies.webp';

interface TopStatusBarProps {
  streak: number;
  gems: number; // cookies
  energy?: number; // lives
  selectedAvatarId?: string;
  onProfileClick?: () => void;
  className?: string;
  worlds?: World[];
  selectedWorldId?: string;
  userWorldProgress?: UserWorldProgress[];
  onSelectWorld?: (worldId: string) => void;
  isOffline?: boolean;
  isSlowConnection?: boolean;
}

// Sparkle animated element with smooth physics
interface SparkleParticle {
  id: string | number;
  x: number;
  y: number;
  scale: number;
}

function ResourceHUDItem({
  id,
  icon,
  value,
  label,
  colorClass,
  sparkleColor = "text-amber-400",
  isStreakItem = false
}: {
  id?: string;
  icon: React.ReactNode;
  value: number;
  label: string;
  colorClass: string;
  sparkleColor?: string;
  isStreakItem?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const [bounce, setBounce] = useState(false);
  const [isFlameGrowing, setIsFlameGrowing] = useState(false);
  const [particles, setParticles] = useState<SparkleParticle[]>([]);
  const isInitialMount = useRef(true);

  const triggerFlameGrowth = useCallback(() => {
    setBounce(true);
    setIsFlameGrowing(true);

    // Spawn 8 rising flame ember particles
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    const newParticles = angles.map((angle, i) => {
      const rad = (angle * Math.PI) / 180;
      const dist = 22 + Math.random() * 12;
      return {
        id: `flame-ember-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
        x: Math.cos(rad) * dist,
        y: Math.sin(rad) * dist - 12,
        scale: 0.6 + Math.random() * 0.6,
      };
    });
    setParticles(newParticles);

    setTimeout(() => setIsFlameGrowing(false), 1400);
    setTimeout(() => setParticles([]), 900);
  }, []);

  useEffect(() => {
    if (isStreakItem) {
      const handleLessonComplete = () => {
        triggerFlameGrowth();
      };
      window.addEventListener('CHIKOO_LESSON_COMPLETED', handleLessonComplete);
      window.addEventListener('LESSON_COMPLETED', handleLessonComplete);
      return () => {
        window.removeEventListener('CHIKOO_LESSON_COMPLETED', handleLessonComplete);
        window.removeEventListener('LESSON_COMPLETED', handleLessonComplete);
      };
    }
  }, [isStreakItem, triggerFlameGrowth]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (value > displayValue && isStreakItem) {
      triggerFlameGrowth();
    } else {
      setBounce(true);

      if (value > displayValue) {
        const angles = [0, 60, 120, 180, 240, 300];
        const newParticles = angles.map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const dist = 18 + Math.random() * 8;
          return {
            id: `sparkle-${label || 'stat'}-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
            x: Math.cos(rad) * dist,
            y: Math.sin(rad) * dist,
            scale: 0.5 + Math.random() * 0.5,
          };
        });
        setParticles(newParticles);
        setTimeout(() => setParticles([]), 700);
      }
    }

    setDisplayValue(value);
  }, [value, displayValue, isStreakItem, label, triggerFlameGrowth]);

  return (
    <motion.div
      id={id}
      animate={
        isStreakItem && isFlameGrowing
          ? { scale: [1, 1.2, 0.95, 1.05, 1] }
          : bounce 
          ? { scale: [1, 1.25, 0.95, 1.03, 1] } 
          : { scale: 1 }
      }
      transition={{ duration: 0.5, ease: "easeInOut" }}
      onAnimationComplete={() => setBounce(false)}
      className="relative flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none py-1"
      title={label}
    >
      {/* Particle sparkles / flame embers layer */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
            animate={{ x: p.x, y: p.y, opacity: 0, scale: p.scale }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className={`absolute pointer-events-none select-none z-50 ${isStreakItem ? 'text-orange-500 font-extrabold text-sm' : sparkleColor + ' font-sans text-sm'}`}
          >
            {isStreakItem ? '🔥' : '✦'}
          </motion.span>
        ))}
      </AnimatePresence>

      {/* Main Icon container with smooth growing flame animation */}
      <motion.div 
        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
        animate={
          isStreakItem && isFlameGrowing
            ? { 
                scale: [1, 1.85, 1.2, 1.45, 1],
                rotate: [0, -12, 12, -6, 0]
              }
            : { scale: 1 }
        }
        transition={{ duration: isFlameGrowing ? 0.9 : 0.35, ease: "easeInOut" }}
        className="relative shrink-0 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7"
      >
        {/* Expanding Fiery Aura / Glow on lesson completion */}
        {isStreakItem && (
          <AnimatePresence>
            {isFlameGrowing && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0.9 }}
                animate={{ scale: [0.6, 2.6, 1.8], opacity: [0.9, 0.75, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="absolute inset-0 -m-2 rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-red-500 blur-md pointer-events-none z-0"
              />
            )}
          </AnimatePresence>
        )}

        {/* Base Icon */}
        <div className="relative z-10 w-full h-full flex items-center justify-center overflow-visible">
          {icon}
        </div>
      </motion.div>

      {/* Large Premium Count + Animated Growing Flame Icon Badge */}
      <div className="flex items-center gap-1">
        <span className={`text-base sm:text-lg font-black tracking-tight leading-none ${colorClass} pt-[1.5px]`}>
          {displayValue}
        </span>
      </div>
    </motion.div>
  );
}

function TopStatusBar({
  streak,
  gems,
  className = "",
  worlds,
  selectedWorldId,
  userWorldProgress,
  onSelectWorld,
  isOffline = false,
  isSlowConnection = false
}: TopStatusBarProps) {
  const { t } = useTranslation();
  // Shared spring physics for satisfying micro-interactions
  const springTransition = { type: "spring" as const, stiffness: 450, damping: 24 };

  const [showWorldDropdown, setShowWorldDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showWorldDropdown) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowWorldDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showWorldDropdown]);

  // Find currently active world title if loaded
  const currentWorldTitle = worlds?.find(w => w.id === selectedWorldId)?.title || "AI";

  return (
    <div 
      className={`w-full flex items-center justify-center select-none sticky top-0 z-[200] pointer-events-none px-3 pt-3.5 pb-1 ${className}`}
    >
      <div className="flex items-center max-w-lg w-full justify-center pointer-events-auto relative" ref={dropdownRef}>
        
        {/* Floating Glass Resources HUD Container */}
        <div className="w-full h-12 sm:h-13 px-3.5 sm:px-5 rounded-[26px] bg-white/75 dark:bg-[#172033]/95 backdrop-blur-xl border border-white/60 dark:border-[rgba(226,232,240,0.14)] shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.45)] flex items-center justify-between gap-1 sm:gap-2 relative">
          
          {/* 1. World Flag / Globe (AI - Blue) - Toggleable dropdown */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={springTransition}
            onClick={() => {
              if (worlds && worlds.length > 0) {
                setShowWorldDropdown(!showWorldDropdown);
                soundManager.play('click');
              }
            }}
            className="flex items-center gap-1.5 cursor-pointer select-none"
            title={t('header.switch_world', 'Switch Learning World')}
          >
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.15 }}
              transition={{ duration: 0.3 }}
              className="relative shrink-0 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7"
            >
              <img 
                src={worldIcon} 
                alt="AI World" 
                className="w-full h-full object-contain" 
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <span className="text-base sm:text-lg font-black tracking-tight leading-none text-blue-600 dark:text-blue-400 pt-[1.5px] max-w-[80px] truncate">
              {currentWorldTitle.includes("Artificial Intelligence") ? "AI" : currentWorldTitle.split(" ")[0] || "AI"}
            </span>
            {worlds && worlds.length > 0 && (
              <span className="text-[9px] text-blue-400 dark:text-blue-300 font-bold ml-0.5">▼</span>
            )}
          </motion.div>

          {/* Delicate Vertical Separator */}
          <div className="h-4.5 w-[1.5px] bg-slate-200/45 dark:bg-white/10 self-center rounded-full" />

          {/* 2. Daily Streak Item (Streak - Orange) */}
          <ResourceHUDItem 
            id="tour-streak"
            isStreakItem={true}
            icon={
              <img 
                src={streakIcon} 
                alt="Streak" 
                className="w-full h-full object-contain filter drop-shadow-[0_1.5px_3px_rgba(249,115,22,0.25)]" 
                referrerPolicy="no-referrer"
              />
            }
            value={streak}
            label={t('header.daily_streak', 'Daily Streak')}
            colorClass="text-orange-500 dark:text-orange-400"
            sparkleColor="text-orange-400"
          />

          {/* Delicate Vertical Separator */}
          <div className="h-4.5 w-[1.5px] bg-slate-200/45 dark:bg-white/10 self-center rounded-full" />

          {/* 3. Cookies Item (Cookies - Gold) */}
          <ResourceHUDItem 
            id="tour-coins"
            icon={
              <img 
                src={cookiesIcon} 
                alt="Cookies" 
                className="w-full h-full object-contain filter drop-shadow-[0_1.5px_3px_rgba(205,139,60,0.2)]" 
                referrerPolicy="no-referrer"
              />
            }
            value={gems}
            label={t('header.cookies', 'Cookies')}
            colorClass="text-amber-600 dark:text-amber-400"
            sparkleColor="text-yellow-400"
          />

          {/* Delicate Vertical Separator */}
          <div className="h-4.5 w-[1.5px] bg-slate-200/45 dark:bg-white/10 self-center rounded-full" />

          {/* 4. Embedded Global Language Selector */}
          <LanguageSelector variant="embedded" />

          {/* 5. Subtle Non-Intrusive Offline / Slow Connection Banner */}
          {(isOffline || isSlowConnection) && (
            <>
              <div className="h-4.5 w-[1.5px] bg-slate-200/45 dark:bg-white/10 self-center rounded-full" />
              <div 
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl select-none cursor-default transition-all animate-pulse ${
                  isOffline 
                    ? 'text-amber-800 dark:text-amber-200 bg-amber-500/20 border border-amber-500/40 shadow-xs' 
                    : 'text-amber-700 dark:text-amber-300 bg-amber-400/20 border border-amber-400/40 shadow-xs'
                }`}
                title={isOffline ? "Working offline (lessons and progress saved locally)" : "Slow internet connection detected"}
              >
                {isOffline ? (
                  <WifiOff size={13} className="stroke-[2.5] shrink-0 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Wifi size={13} className="stroke-[2.5] animate-pulse shrink-0 text-amber-500 dark:text-amber-400" />
                )}
                <span className="text-[9.5px] font-black uppercase tracking-wider">
                  {isOffline ? 'Working Offline' : 'Slow Internet'}
                </span>
              </div>
            </>
          )}

        </div>

        {/* Worlds Floating Dropdown Menu */}
        <AnimatePresence>
          {showWorldDropdown && worlds && worlds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-[54px] left-0 right-0 mx-auto w-[94%] bg-white/95 dark:bg-[#172033]/98 backdrop-blur-xl border border-slate-200/80 dark:border-[rgba(226,232,240,0.14)] rounded-2xl shadow-[0_16px_36px_rgba(0,0,0,0.15)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.55)] p-3.5 flex flex-col gap-1.5 z-[210] pointer-events-auto"
            >
              <div className="flex items-center justify-between px-1.5 pb-1 border-b border-slate-100 dark:border-white/10 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-300">{t('header.switch_world', 'Switch Learning World')}</span>
                <span className="text-[9px] font-black bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded-md">{t('header.w1_to_wn', { count: worlds.length })}</span>
              </div>
              <div className="max-h-[220px] overflow-y-auto pr-1 flex flex-col gap-1.5 scrollbar-hide">
                {worlds.map((world) => {
                  const isWorld1 = world.world_number === 1 || world.id === 'world_1';
                  const progressRecord = userWorldProgress?.find(p => p.world_id === world.id);
                  const isUnlocked = isWorld1 || (progressRecord ? !!progressRecord.unlocked : false);
                  const isSelected = selectedWorldId === world.id;

                  return (
                    <button
                      key={world.id}
                      type="button"
                      onClick={() => {
                        if (onSelectWorld) {
                          onSelectWorld(world.id);
                          setShowWorldDropdown(false);
                          soundManager.play('click');
                        }
                      }}
                      className={`w-full px-3 py-2 rounded-xl border flex items-center justify-between text-left transition-all relative cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 border-indigo-600 text-white font-extrabold shadow-sm'
                          : isUnlocked
                          ? 'bg-slate-50 dark:bg-[#243149] hover:bg-slate-100 dark:hover:bg-[#2e3e5c] border-slate-100 dark:border-slate-700/60 text-slate-800 dark:text-slate-100'
                          : 'bg-slate-50/50 dark:bg-[#172033]/60 border-slate-100/50 dark:border-slate-800/40 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 font-black text-[10px] ${
                          isSelected
                            ? 'bg-white/25 text-white border border-white/20'
                            : isUnlocked
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          {isUnlocked ? `W${world.world_number || 1}` : '🔒'}
                        </div>
                        <span className="text-xs font-black truncate">{world.title}</span>
                      </div>
                      {isSelected && (
                        <span className="text-[9px] font-black bg-white/20 text-white px-1.5 py-0.5 rounded">{t('common.active', 'Active')}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default memo(TopStatusBar);
