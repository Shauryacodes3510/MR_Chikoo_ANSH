import { useState, useMemo, useEffect, useRef, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Module, Lesson } from '../lib/content';
import { soundManager } from '../lib/sounds';
import { getPuzzlePacksAsync, getPuzzlePacks, PuzzlePack } from '../lib/practiceStoreNew';
import ChestIcon from './ui/ChestIcon';
import Chest3D from './ui/Chest3D';
import FrozenLockedNode from './FrozenLockedNode';
import EnvironmentalLockedCard from './EnvironmentalLockedCard';
import ExternalEnvironmentLessonNode from './EnvironmentLessonNode';
import { DAILY_CHALLENGES, getRequiredWorld1DailyChallenges } from '../lib/dailyChallenges';
import { Bookmark, Lock, Check, X, Star, Zap, Award, Sparkles, Trophy, ChevronRight, HelpCircle, Play, ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Flame, User, Plus } from 'lucide-react';
import { AVATARS } from '../constants';
import ConfettiEffect from './ConfettiEffect';
import SpaceQuestsList from './SpaceQuestsList';
import { SupabaseUserProfile, World, UserWorldProgress } from '../lib/supabase';
import { WorldSelector } from './WorldSelector';
import { useTranslation } from '../lib/translation/TranslationContext';
import { biomeChannel } from '../lib/biomeChannel';
// @ts-ignore
import { getBiomeImage, getBiomeImagesArray, getModuleBiomeImage, preloadNextBiomes, PUBLIC_BIOME_FALLBACKS, getUnitChikooImage, ALL_BIOME_IMAGES } from '../lib/biomeImages';
import { preloadLessonAssets } from '../lib/lessonPreloader';
import TopStatusBar from './TopStatusBar';
import UnitLearningPath from './UnitLearningPath';
import { AnimatedFireFlame } from './HomescreenStreakBar';

const getDecoration = (mIdx: number, lIdx: number) => {
  return null;
};

const AmbientAIEffects = memo(function AmbientAIEffects() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Soft static gradient lighting blurs for optimal initial load performance */}
      <div className="glow-spot-blue top-[8%] left-[-20px] opacity-70" />
      <div className="glow-spot-gold top-[25%] right-[-30px] opacity-70" />
      <div className="glow-spot-blue top-[55%] left-[10%] opacity-60" />
      <div className="glow-spot-gold bottom-[15%] right-[5%] opacity-60" />
      
      {/* Floating subtle ambient accents */}
      <div className="absolute top-[6%] left-[10%] w-1.5 h-1.5 bg-sky-400/30 rounded-full blur-xs" />
      <div className="absolute top-[18%] right-[15%] w-1 h-1 bg-amber-400/25 rounded-full blur-xs" />
      <div className="absolute top-[38%] left-[20%] w-2 h-2 bg-indigo-400/25 rounded-full blur-xs" />
      <div className="absolute top-[52%] right-[10%] w-1.5 h-1.5 bg-sky-400/25 rounded-full blur-xs" />
      <div className="absolute top-[68%] left-[12%] w-1 h-1 bg-amber-400/30 rounded-full blur-xs" />
      <div className="absolute bottom-[10%] right-[18%] w-2.5 h-2.5 bg-indigo-400/20 rounded-full blur-xs" />
    </div>
  );
});

const AmbientParticles = memo(function AmbientParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      x: (i * 12.5 + Math.random() * 8) % 100, // percentage
      y: (i * 12.5 + Math.random() * 8) % 100, // percentage
      size: (i % 3 === 0 ? 3 : 2), // px
      delay: i * 1.5, // s
      duration: 10 + (i % 4) * 2, // s
      type: i % 3 === 0 ? 'sparkle' : i % 3 === 1 ? 'snow' : 'glow',
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      <style>{`
        @keyframes drift-down-gpu {
          0% { transform: translate3d(-15px, -5%, 0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.7; }
          100% { transform: translate3d(15px, 105%, 0) rotate(360deg); opacity: 0; }
        }
        @keyframes drift-up-gpu {
          0% { transform: translate3d(-15px, 105%, 0) scale(0.8); opacity: 0; }
          15% { opacity: 0.6; }
          85% { opacity: 0.6; }
          100% { transform: translate3d(15px, -5%, 0) scale(1.1); opacity: 0; }
        }
      `}</style>
      {particles.map((p) => {
        const style: React.CSSProperties = {
          position: 'absolute',
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: `${p.size}px`,
          height: `${p.size}px`,
          borderRadius: '50%',
          willChange: 'transform, opacity',
          animation: p.type === 'snow' 
            ? `drift-down-gpu ${p.duration}s linear infinite` 
            : `drift-up-gpu ${p.duration + 4}s ease-in-out infinite`,
          animationDelay: `${-p.delay}s`,
        };

        if (p.type === 'snow') {
          return (
            <div 
              key={`ambient-particle-${p.id}`} 
              style={style} 
              className="bg-white/60 blur-[0.5px]" 
            />
          );
        } else if (p.type === 'sparkle') {
          return (
            <div 
              key={`ambient-particle-${p.id}`} 
              style={{ ...style, borderRadius: '0%' }} 
              className="bg-amber-200/50 rotate-45 blur-[0.5px] shadow-[0_0_6px_rgba(251,191,36,0.4)]" 
            />
          );
        } else {
          return (
            <div 
              key={`ambient-particle-${p.id}`} 
              style={style} 
              className="bg-sky-200/40 blur-[1px] shadow-[0_0_8px_rgba(186,230,253,0.3)]" 
            />
          );
        }
      })}
    </div>
  );
});

const TypewriterText = memo(function TypewriterText({ text, speed = 35, delay = 500 }: { text: string; speed?: number; delay?: number }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(false);
    
    let interval: NodeJS.Timeout;
    const startTimeout = setTimeout(() => {
      setIsTyping(true);
      let i = 0;
      interval = setInterval(() => {
        // Step in chunks of 3 characters for silky smooth presentation without dropping frame rate
        i = Math.min(text.length, i + 3);
        setDisplayedText(text.substring(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      if (interval) clearInterval(interval);
    };
  }, [text, speed, delay]);

  return (
    <span className="relative">
      {displayedText}
      {isTyping && (
        <span className="inline-block w-[2px] h-[13px] bg-sky-400 ml-0.5 animate-pulse" />
      )}
    </span>
  );
});

const BIOME_COLORS = [
  { r: 224, g: 242, b: 254, a: 0.4 }, // Snow (Cool Blue)
  { r: 209, g: 250, b: 229, a: 0.4 }, // Forest (Soft Green)
  { r: 241, g: 245, b: 249, a: 0.4 }, // Mountain (Neutral Gray)
  { r: 186, g: 230, b: 253, a: 0.4 }, // Ocean (Deep Blue)
  { r: 224, g: 231, b: 255, a: 0.4 }  // Space (Purple / Indigo)
];

const getLessonIconEmoji = (moduleIdx: number, title: string) => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('code') || lowerTitle.includes('program') || lowerTitle.includes('loop')) return '⚡';
  if (lowerTitle.includes('ai') || lowerTitle.includes('model') || lowerTitle.includes('prompt') || lowerTitle.includes('neural')) return '🤖';
  if (lowerTitle.includes('space') || lowerTitle.includes('star') || lowerTitle.includes('orbit') || lowerTitle.includes('cosmic') || lowerTitle.includes('gravity')) return '🚀';
  if (lowerTitle.includes('plant') || lowerTitle.includes('forest') || lowerTitle.includes('flower') || lowerTitle.includes('nature') || lowerTitle.includes('bioluminescent') || lowerTitle.includes('bloom')) return '🌱';
  if (lowerTitle.includes('snow') || lowerTitle.includes('ice') || lowerTitle.includes('freeze') || lowerTitle.includes('glacier') || lowerTitle.includes('winter')) return '❄️';
  
  // Fallback on module index:
  const emojis = ['❄️', '🌱', '📐', '🐙', '🚀'];
  return emojis[moduleIdx % emojis.length] || '📝';
};

const getContrastBadgeClass = (badgeBg: string) => {
  return badgeBg
    .replace('text-sky-400', 'text-sky-700')
    .replace('text-emerald-400', 'text-emerald-700')
    .replace('text-purple-400', 'text-purple-700')
    .replace('text-blue-400', 'text-blue-700')
    .replace('text-amber-400', 'text-amber-700')
    .replace('bg-sky-500/10', 'bg-sky-50')
    .replace('bg-emerald-500/10', 'bg-emerald-50')
    .replace('bg-purple-500/10', 'bg-purple-50')
    .replace('bg-blue-500/10', 'bg-blue-50')
    .replace('bg-amber-500/10', 'bg-amber-50')
    .replace('border-sky-500/30', 'border-sky-200/50')
    .replace('border-emerald-500/30', 'border-emerald-200/50')
    .replace('border-purple-500/30', 'border-purple-200/50')
    .replace('border-blue-500/30', 'border-blue-200/50')
    .replace('border-amber-500/30', 'border-amber-200/50');
};

interface LazyBiomeBackgroundProps {
  idx: number;
  layout: { top: number; height: number };
  modulesCount: number;
  customImage?: string;
}

const LazyBiomeBackground = memo(function LazyBiomeBackground({
  idx,
  layout,
  modulesCount,
  customImage,
}: LazyBiomeBackgroundProps) {
  const img = customImage || getBiomeImage(idx);
  if (!img) return null;

  // Overlapping blending regions so biomes blend seamlessly into each other
  const baseTop = layout.top;
  const baseHeight = layout.height;
  const blendHeight = 100;
  const isFirst = idx === 0;
  const isLast = idx === modulesCount - 1;

  // Unit 1 (idx === 0) starts from the very top of the world container (top: 0) so the entire upper area is fully covered
  const top = isFirst ? 0 : Math.max(0, baseTop - blendHeight);
  const bottom = isLast ? undefined : baseTop + baseHeight + blendHeight;
  const height = isLast ? undefined : Math.max(140, (bottom ?? 0) - top);

  // Vertical mask gradient for cross-fading edges between adjacent biomes
  let maskGradient = 'none';
  if (idx > 0 && idx < modulesCount - 1) {
    maskGradient = `linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,1) ${blendHeight}px, rgba(0,0,0,1) calc(100% - ${blendHeight}px), rgba(0,0,0,0) 100%)`;
  } else if (idx > 0) {
    maskGradient = `linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,1) ${blendHeight}px)`;
  } else if (idx < modulesCount - 1) {
    maskGradient = `linear-gradient(to bottom, rgba(0,0,0,1) calc(100% - ${blendHeight}px), rgba(0,0,0,0) 100%)`;
  }

  return (
    <div
      className="absolute left-0 right-0 overflow-hidden pointer-events-none select-none z-0"
      style={{
        top: `${top}px`,
        ...(isLast ? { bottom: 0 } : { height: `${height}px` }),
        maskImage: maskGradient,
        WebkitMaskImage: maskGradient,
        contain: 'paint'
      }}
    >
      <img
        src={img}
        alt={`Unit ${idx + 1} Biome`}
        className="w-full h-full object-cover object-top opacity-95 pointer-events-none select-none"
        decoding="async"
        loading="eager"
        style={{ transform: 'translateZ(0)' }}
        onError={(e) => {
          const fallback = PUBLIC_BIOME_FALLBACKS[idx % 6] || ALL_BIOME_IMAGES[idx % 6] || '/bg_image.webp';
          if (e.currentTarget.src !== fallback) {
            e.currentTarget.src = fallback;
          }
        }}
      />
    </div>
  );
});

interface UnitTheme {
  border: string;
  progressColor: string;
  badgeBg: string;
  artworkIcon: string;
  storyTeaser: string;
  ambientGlow: string;
  particles: string[];
  dividerGradient: string;
}

const UNIT_THEMES: UnitTheme[] = [
  {
    border: "border-sky-500/30",
    progressColor: "bg-sky-500",
    badgeBg: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    artworkIcon: "🚀",
    storyTeaser: "Chikoo's capsule landed on a mysterious neon orbit! Learn the secrets of stars, cosmic gravity, and code logic to repair his communications array and navigate the stars.",
    ambientGlow: "from-sky-500/20 to-transparent",
    particles: ["✨", "🪐", "⭐", "💫"],
    dividerGradient: "via-sky-500/35",
  },
  {
    border: "border-emerald-500/30",
    progressColor: "bg-emerald-500",
    badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    artworkIcon: "🌱",
    storyTeaser: "Explore the bioluminescent nature dome of Planet Gaea! Gather glowing data crystals, learn basic AI logic to talk to synthetic flora, and help Gaea's ecosystem bloom.",
    ambientGlow: "from-emerald-500/20 to-transparent",
    particles: ["🍃", "🌸", "🌿", "🦋"],
    dividerGradient: "via-emerald-500/35",
  },
  {
    border: "border-purple-500/30",
    progressColor: "bg-purple-500",
    badgeBg: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    artworkIcon: "📐",
    storyTeaser: "Decode the mathematical gate of the ancients! Harness number theories, algorithmic patterns, and geometric proofs to unlock the legendary Temple of Logical Wisdom.",
    ambientGlow: "from-purple-500/20 to-transparent",
    particles: ["📐", "🔮", "✨", "📜"],
    dividerGradient: "via-purple-500/35",
  },
  {
    border: "border-blue-500/30",
    progressColor: "bg-blue-500",
    badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    artworkIcon: "🐙",
    storyTeaser: "Dive into the deep neon oceans of Sub-aquatica! Code submersibles, identify strange ocean-dwelling artificial lifeforms, and discover lost sunken treasure archives.",
    ambientGlow: "from-blue-500/20 to-transparent",
    particles: ["🐙", "🫧", "🐠", "🌊"],
    dividerGradient: "via-blue-500/35",
  },
  {
    border: "border-amber-500/30",
    progressColor: "bg-amber-500",
    badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    artworkIcon: "✨",
    storyTeaser: "Behold the Cosmic Frontier — where Chikoo merges with the Infinite AI Core! Traverse nebulae, compile advanced neural synapses, and write your own cosmos-spanning algorithms.",
    ambientGlow: "from-amber-500/20 to-transparent",
    particles: ["🌌", "💫", "⚡", "🔮"],
    dividerGradient: "via-amber-500/35",
  },
];

const generatePathD = (count: number, yCoords: number[], moduleIdx: number = 0) => {
  let pathD = "";
  if (moduleIdx === 0) {
    const startOffset = yCoords[0] || 8;
    // Start exactly beneath the wooden post at y = 8, and make a curvy path to the first lesson node at y = startOffset
    pathD = `M 150 8 C 190 ${8 + (startOffset - 8) * 0.35}, 110 ${8 + (startOffset - 8) * 0.65}, 150 ${startOffset}`;
  } else {
    const startPt = {
      x: 150 + 70 * Math.sin(0),
      y: yCoords[0] || 95
    };
    pathD = `M ${startPt.x} ${startPt.y}`;
  }
  
  for (let i = 0; i < count - 1; i++) {
    const angle0 = (i * Math.PI) / 2;
    const angle1 = ((i + 1) * Math.PI) / 2;
    const x0 = 150 + 70 * Math.sin(angle0);
    const y0 = yCoords[i];
    const x1 = 150 + 70 * Math.sin(angle1);
    const y1 = yCoords[i + 1];
    
    const currentGap = y1 - y0;
    const halfGapI = currentGap / 2;
    
    pathD += ` C ${x0} ${y0 + halfGapI}, ${x1} ${y1 - halfGapI}, ${x1} ${y1}`;
  }
  return pathD;
};

const getBiomeTheme = (biomeIdx: number, state: 'active' | 'completed' | 'locked') => {
  const actualBiomeIdx = biomeIdx % 5;
  if (state === 'active') {
    return {
      bg: 'bg-gradient-to-b from-[#45B6FF]/85 to-[#1F8FFF]/85 backdrop-blur-md relative',
      border: 'border border-white/40',
      shadow: 'shadow-[0_8px_20px_rgba(31,143,255,0.45),_inset_0_1.5px_0_rgba(255,255,255,0.45)]',
      glowColor: 'rgba(31, 143, 255, 0.4)',
      rippleColor: '#1F8FFF',
      innerGlow: '',
    };
  }
  switch (actualBiomeIdx) {
    case 0: // Snow Valley (Soft Ice Blue)
      return {
        bg: state === 'completed' 
          ? 'bg-gradient-to-tr from-emerald-400 to-teal-500'
          : state === 'locked'
            ? 'bg-gradient-to-tr from-sky-200/30 via-sky-100/20 to-white/30'
            : 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#54c0ff] via-[#2563eb] to-[#1d4ed8]',
        border: state === 'locked' 
          ? 'border-2 border-sky-300/25' 
          : 'border-4 border-white shadow-[0_0_12px_rgba(255,255,255,0.7)]',
        shadow: state === 'completed'
          ? 'shadow-[0_12px_28px_rgba(0,0,0,0.35),_0_6px_12px_rgba(0,0,0,0.2)]'
          : state === 'locked'
            ? 'shadow-[0_6px_14px_rgba(0,0,0,0.15)]'
            : 'shadow-[0_16px_36px_rgba(0,0,0,0.45),_0_8px_16px_rgba(0,0,0,0.25)]',
        glowColor: 'rgba(37, 99, 235, 0.5)',
        rippleColor: '#2563eb',
        innerGlow: 'shadow-[inset_0_2px_8px_rgba(255,255,255,0.9)]',
      };
    case 1: // Sakura Forest (Blossom Pink)
      return {
        bg: state === 'completed'
          ? 'bg-gradient-to-tr from-emerald-600 to-teal-500'
          : state === 'locked'
            ? 'bg-gradient-to-tr from-pink-950/20 via-pink-900/10 to-pink-850/5'
            : 'bg-gradient-to-tr from-pink-500 via-rose-500 to-pink-400',
        border: state === 'locked' 
          ? 'border-2 border-pink-950/20' 
          : 'border-4 border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]',
        shadow: state === 'completed'
          ? 'shadow-[0_12px_28px_rgba(0,0,0,0.35),_0_6px_12px_rgba(0,0,0,0.2)]'
          : state === 'locked'
            ? 'shadow-[0_6px_14px_rgba(0,0,0,0.15)]'
            : 'shadow-[0_16px_36px_rgba(0,0,0,0.45),_0_8px_16px_rgba(0,0,0,0.25)]',
        glowColor: 'rgba(236,72,153,0.4)',
        rippleColor: '#ec4899',
        innerGlow: 'shadow-[inset_0_2px_8px_rgba(255,255,255,0.4)]',
      };
    case 2: // Lost Desert (Sand Gold)
      return {
        bg: state === 'completed'
          ? 'bg-gradient-to-tr from-emerald-600 to-teal-500'
          : state === 'locked'
            ? 'bg-gradient-to-tr from-amber-950/20 via-yellow-900/10 to-amber-800/5'
            : 'bg-gradient-to-tr from-amber-500 via-yellow-500 to-amber-400',
        border: state === 'locked' 
          ? 'border-2 border-amber-950/20' 
          : 'border-4 border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]',
        shadow: state === 'completed'
          ? 'shadow-[0_12px_28px_rgba(0,0,0,0.35),_0_6px_12px_rgba(0,0,0,0.2)]'
          : state === 'locked'
            ? 'shadow-[0_6px_14px_rgba(0,0,0,0.15)]'
            : 'shadow-[0_16px_36px_rgba(0,0,0,0.45),_0_8px_16px_rgba(0,0,0,0.25)]',
        glowColor: 'rgba(245,158,11,0.4)',
        rippleColor: '#f59e0b',
        innerGlow: 'shadow-[inset_0_2px_8px_rgba(255,255,255,0.4)]',
      };
    case 3: // Magma Forge (Volcanic Red/Black)
      return {
        bg: state === 'completed'
          ? 'bg-gradient-to-tr from-emerald-600 to-teal-500'
          : state === 'locked'
            ? 'bg-gradient-to-tr from-stone-900/40 via-red-950/20 to-orange-950/10'
            : 'bg-gradient-to-tr from-red-950 via-red-900 to-orange-600',
        border: state === 'locked' 
          ? 'border-2 border-stone-800/30' 
          : 'border-4 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]',
        shadow: state === 'completed'
          ? 'shadow-[0_12px_28px_rgba(0,0,0,0.35),_0_6px_12px_rgba(0,0,0,0.2)]'
          : state === 'locked'
            ? 'shadow-[0_6px_14px_rgba(0,0,0,0.15)]'
            : 'shadow-[0_16px_36px_rgba(0,0,0,0.45),_0_8px_16px_rgba(0,0,0,0.25)]',
        glowColor: 'rgba(239,68,68,0.5)',
        rippleColor: '#ef4444',
        innerGlow: 'shadow-[inset_0_2px_8px_rgba(255,255,255,0.3)]',
      };
    case 4: // Galaxy Nexus (Holographic Purple/Cyan)
      return {
        bg: state === 'completed'
          ? 'bg-gradient-to-tr from-emerald-600 to-teal-500'
          : state === 'locked'
            ? 'bg-gradient-to-tr from-indigo-950/20 via-purple-900/10 to-indigo-850/5'
            : 'bg-gradient-to-tr from-indigo-950 via-purple-900 to-indigo-700',
        border: state === 'locked' 
          ? 'border-2 border-indigo-950/20' 
          : 'border-4 border-white shadow-[0_0_12px_rgba(255,255,255,0.5)]',
        shadow: state === 'completed'
          ? 'shadow-[0_12px_28px_rgba(0,0,0,0.35),_0_6px_12px_rgba(0,0,0,0.2)]'
          : state === 'locked'
            ? 'shadow-[0_6px_14px_rgba(0,0,0,0.15)]'
            : 'shadow-[0_16px_36px_rgba(0,0,0,0.45),_0_8px_16px_rgba(0,0,0,0.25)]',
        glowColor: 'rgba(168,85,247,0.5)',
        rippleColor: '#a855f7',
        innerGlow: 'shadow-[inset_0_2px_10px_rgba(255,255,255,0.4)]',
      };
    default:
      return {
        bg: 'bg-gradient-to-tr from-sky-500 to-indigo-600',
        border: 'border-4 border-white',
        shadow: 'shadow-[0_16px_36px_rgba(0,0,0,0.4),_0_8px_16px_rgba(0,0,0,0.2)]',
        glowColor: 'rgba(14,165,233,0.5)',
        rippleColor: '#0ea5e9',
        innerGlow: 'shadow-none',
      };
  }
};

const renderParticles = (biomeIdx: number, isActive: boolean, isHovered: boolean, isLocked: boolean) => {
  if (isLocked) return null;
  const count = isHovered ? 6 : 4;
  const duration = isHovered ? 2.5 : 4.5;
  const actualBiomeIdx = biomeIdx % 5;

  switch (actualBiomeIdx) {
    case 0: // Snow Valley: Snow crystals / dots
      return Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={`snow-p-${i}`}
          className="absolute w-1.5 h-1.5 bg-white rounded-full pointer-events-none"
          initial={{ 
            x: Math.sin(i) * 32, 
            y: 30 + Math.cos(i) * 10, 
            opacity: 0.1 + Math.random() * 0.3,
            scale: 0.5 + Math.random() * 0.5
          }}
          animate={{
            y: [-10, -42],
            x: [Math.sin(i) * 32, Math.sin(i) * 32 + (Math.random() - 0.5) * 12],
            opacity: [0, 0.75, 0],
          }}
          transition={{
            duration: duration + Math.random() * 1.5,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeOut"
          }}
          style={{ zIndex: 1 }}
        />
      ));
    case 1: // Sakura Forest: Cherry blossom petals
      return Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={`cherry-p-${i}`}
          className="absolute text-[9px] pointer-events-none select-none"
          initial={{ 
            x: Math.sin(i) * 35, 
            y: 20 + Math.cos(i) * 15, 
            opacity: 0.2 + Math.random() * 0.3,
            rotate: Math.random() * 360,
            scale: 0.6 + Math.random() * 0.5
          }}
          animate={{
            y: [25, -35],
            x: [Math.sin(i) * 35, Math.sin(i) * 35 + (Math.random() - 0.5) * 15],
            rotate: [0, 360],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: duration + 1 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut"
          }}
          style={{ zIndex: 1 }}
        >
          {i % 2 === 0 ? '🌸' : '💮'}
        </motion.div>
      ));
    case 2: // Lost Desert: Golden sand dust particles
      return Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={`desert-p-${i}`}
          className="absolute pointer-events-none"
          initial={{ 
            x: Math.sin(i) * 30, 
            y: 25 + Math.cos(i) * 15, 
            opacity: 0,
            scale: 0.4 + Math.random() * 0.4
          }}
          animate={{
            y: [15, -25],
            x: [Math.sin(i) * 30, Math.sin(i) * 30 + (Math.random() - 0.5) * 8],
            opacity: [0, 0.65, 0],
          }}
          transition={{
            duration: duration + Math.random() * 1.5,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeOut"
          }}
          style={{ zIndex: 1 }}
        >
          <div className="w-1.5 h-1.5 bg-amber-200 rounded-full shadow-[0_0_2px_rgba(245,158,11,0.5)]" />
        </motion.div>
      ));
    case 3: // Magma Forge: Hot ash / sparks
      return Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={`magma-p-${i}`}
          className="absolute pointer-events-none"
          initial={{ 
            x: Math.sin(i) * 32, 
            y: 25 + Math.cos(i) * 15, 
            opacity: 0,
            scale: 0.5 + Math.random() * 0.5
          }}
          animate={{
            y: [20, -30],
            x: [Math.sin(i) * 32, Math.sin(i) * 32 + (Math.random() - 0.5) * 10],
            opacity: [0, 0.85, 0],
          }}
          transition={{
            duration: duration - 0.5 + Math.random() * 1.5,
            repeat: Infinity,
            delay: i * 0.35,
            ease: "easeOut"
          }}
          style={{ zIndex: 1 }}
        >
          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_5px_#ea580c]" />
        </motion.div>
      ));
    case 4: // Galaxy Nexus: space sparkles
      return Array.from({ length: count }).map((_, i) => {
        const radius = 36;
        const angle = (i * 2 * Math.PI) / count;
        return (
          <motion.div
            key={`galaxy-p-${i}`}
            className="absolute pointer-events-none select-none text-[8px]"
            initial={{ 
              x: Math.cos(angle) * radius, 
              y: Math.sin(angle) * radius,
              opacity: 0.3,
              scale: 0.5
            }}
            animate={{
              rotate: [0, 360],
              scale: [0.5, 0.8, 0.5],
              opacity: [0.3, 0.9, 0.3],
            }}
            transition={{
              duration: isHovered ? 3.5 : 7,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{ 
              zIndex: 1,
              transformOrigin: "center center"
            }}
          >
            {i % 2 === 0 ? '✨' : '💫'}
          </motion.div>
        );
      });
    default:
      return null;
  }
};

interface EnvironmentLessonNodeProps {
  lesson: Lesson;
  moduleIdx: number;
  lessonIdx: number;
  globalIdx: number;
  isLessonCompleted: boolean;
  isActiveLesson: boolean;
  isLocked: boolean;
  bookmarkedLessons: string[];
  onLessonSelect: (lessonId: string) => void;
  shakeNodeIndex: number | null;
  setShakeNodeIndex: (idx: number | null) => void;
  resolvedActiveIdx: number;
  customChestUrl?: string;
}

const EnvironmentLessonNode = memo(function EnvironmentLessonNode({
  lesson,
  moduleIdx,
  lessonIdx,
  globalIdx,
  isLessonCompleted,
  isActiveLesson,
  isLocked,
  bookmarkedLessons,
  onLessonSelect,
  shakeNodeIndex,
  setShakeNodeIndex,
  resolvedActiveIdx,
  customChestUrl,
}: EnvironmentLessonNodeProps) {
  const isShaking = shakeNodeIndex === globalIdx;
  return (
    <div className={isShaking ? 'animate-shake' : ''}>
      <ExternalEnvironmentLessonNode
        biomeIdx={moduleIdx}
        state={isLocked ? 'locked' : isLessonCompleted ? 'completed' : 'active'}
        size="md"
        isChest={lesson.isChest}
        isChallenge={lesson.isChallenge}
        isBonus={lesson.isBonus}
        bookmarked={bookmarkedLessons.includes(lesson.id)}
        difficulty={lesson.difficulty}
        chestIconUrl={customChestUrl || (lesson as any).chest_image_url || (lesson as any).chestImageUrl || (lesson as any).chest_icon_url || (lesson as any).chestIconUrl}
        onClick={() => {
          if (isLocked) {
            soundManager.play('pop');
            setShakeNodeIndex(globalIdx);
            setTimeout(() => setShakeNodeIndex(null), 500);
          } else {
            soundManager.play('click');
            onLessonSelect(lesson.id);
          }
        }}
      />
    </div>
  );
});

interface HomeWindingSectionProps {
  module: Module;
  moduleIdx: number;
  startIdx: number;
  completedLessons: string[];
  resolvedActiveIdx: number;
  bookmarkedLessons: string[];
  puzzlePacks: PuzzlePack[];
  isMobile: boolean;
  onLessonSelect: (lessonId: string) => void;
  shakeNodeIndex: number | null;
  setShakeNodeIndex: (idx: number | null) => void;
}

const HomeWindingSection = memo(function HomeWindingSection({
  module,
  moduleIdx,
  startIdx,
  completedLessons,
  resolvedActiveIdx,
  bookmarkedLessons,
  puzzlePacks,
  isMobile,
  onLessonSelect,
  shakeNodeIndex,
  setShakeNodeIndex
}: HomeWindingSectionProps) {
  const sortedLessons = useMemo(() => {
    return [...(module.lessons || [])].sort((a, b) => {
      if (a.order_index !== undefined && b.order_index !== undefined && a.order_index !== b.order_index) {
        return a.order_index - b.order_index;
      }
      return (a.id || '').localeCompare(b.id || '', undefined, { numeric: true });
    });
  }, [module.lessons]);

  const numLessons = sortedLessons.length;
  const START_OFFSET = moduleIdx === 0 ? 55 : 45;
  const VERTICAL_GAP = isMobile ? 73 : 93;

  const lessonYCoords = useMemo(() => {
    const coords: number[] = [];
    let currentY = START_OFFSET;
    coords.push(currentY);
    for (let i = 1; i < numLessons; i++) {
      currentY += VERTICAL_GAP;
      coords.push(currentY);
    }
    return coords;
  }, [numLessons, START_OFFSET, VERTICAL_GAP]);

  const pathD = useMemo(() => {
    if (numLessons === 0) return "";
    const startX = 150 + 55 * Math.sin(0);
    let d = `M ${startX} ${lessonYCoords[0]}`;
    for (let i = 0; i < numLessons - 1; i++) {
      const angle0 = (i * Math.PI) / 2;
      const angle1 = ((i + 1) * Math.PI) / 2;
      const x0 = 150 + 55 * Math.sin(angle0);
      const y0 = lessonYCoords[i];
      const x1 = 150 + 55 * Math.sin(angle1);
      const y1 = lessonYCoords[i + 1];
      
      const currentGap = y1 - y0;
      const halfGapI = currentGap / 2;
      
      d += ` C ${x0} ${y0 + halfGapI}, ${x1} ${y1 - halfGapI}, ${x1} ${y1}`;
    }
    return d;
  }, [numLessons, lessonYCoords]);

  const totalHeight = useMemo(() => {
    return numLessons > 0 ? lessonYCoords[numLessons - 1] + 55 : 70;
  }, [numLessons, lessonYCoords]);

  return (
    <div 
      className="relative w-[300px] mx-auto overflow-visible select-none pb-2"
      style={{ 
        height: `${totalHeight}px`, 
        contain: 'layout paint'
      }}
    >
      {/* Subtle, thin dashed path line to visually reinforce the zig-zag progression rhythm */}
      {pathD && (
        <svg 
          className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible"
          style={{ zIndex: 1 }}
        >
          <path 
            d={pathD} 
            style={{ 
              strokeDasharray: '6 6', 
              stroke: 'rgba(148, 163, 184, 0.85)', 
              strokeWidth: 2.2, 
              strokeLinecap: 'round', 
              fill: 'none'
            }}
          />
        </svg>
      )}

      {/* Lesson Nodes & Label Cards perfectly aligned to coordinates */}
      {sortedLessons.map((lesson, lessonIdx) => {
        const globalIdx = startIdx + lessonIdx;
        const isLessonCompleted = completedLessons.includes(lesson.id);
        const isActiveLesson = globalIdx === resolvedActiveIdx;
        const isLocked = globalIdx > resolvedActiveIdx;

        // Smooth flowing S-curve so the eye naturally follows progression
        const angle = (lessonIdx * Math.PI) / 2;
        const x = 150 + 55 * Math.sin(angle);
        const y = lessonYCoords[lessonIdx];

        const matchedPack = lesson.isChest ? puzzlePacks.find(p => p.linked_unit_id === module.id || p.linkedUnitId === module.id) : null;
        const customChestUrl = matchedPack?.chest_image_url || matchedPack?.chestImageUrl || matchedPack?.chest_icon_url || matchedPack?.chestIconUrl;

        return (
          <div key={`node-${module.id}-${lesson.id || 'les'}-${lessonIdx}`}>
            {/* Environment-Aware Lesson Node */}
            <div
              id={isActiveLesson ? "tour-current-lesson" : undefined}
              data-lesson-active={isActiveLesson ? "true" : undefined}
              style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                transform: 'translate(-50%, -50%)',
                zIndex: isActiveLesson ? 50 : 20,
              }}
            >
              {/* Current Lesson Floating Speech Bubble Pointer */}
              {isActiveLesson && !isLessonCompleted && !isLocked && (
                <div
                  className="absolute bottom-[48px] sm:bottom-[52px] left-1/2 -translate-x-1/2 whitespace-nowrap z-50 pointer-events-none flex flex-col items-center animate-float-bubble"
                >
                  <div 
                    className="relative px-3.5 py-1.5 rounded-2xl flex items-center gap-1.5 border border-emerald-400/70 backdrop-blur-md"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(236, 253, 245, 0.94))',
                      boxShadow: '0 8px 20px rgba(16, 185, 129, 0.22), inset 0 1px 2px rgba(255, 255, 255, 0.95)',
                    }}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block shrink-0" />
                    <span className="font-display font-black text-emerald-800 uppercase text-[11px] sm:text-[12px] tracking-wider block text-center leading-none">
                      START NOW
                    </span>
                    {/* Tail pointer of speech bubble */}
                    <div 
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-r border-b border-emerald-400/70"
                      style={{
                        background: 'rgba(236, 253, 245, 0.94)',
                      }}
                    />
                  </div>

                  {/* Subtle pointer indicator connecting bubble to lesson node */}
                  <div
                    className="mt-1 text-emerald-600 text-[10px] font-black leading-none opacity-80"
                  >
                    ▼
                  </div>
                </div>
              )}
              <EnvironmentLessonNode
                lesson={lesson}
                moduleIdx={moduleIdx}
                lessonIdx={lessonIdx}
                globalIdx={globalIdx}
                isLessonCompleted={isLessonCompleted}
                isActiveLesson={isActiveLesson}
                isLocked={isLocked}
                bookmarkedLessons={bookmarkedLessons}
                onLessonSelect={onLessonSelect}
                shakeNodeIndex={shakeNodeIndex}
                setShakeNodeIndex={setShakeNodeIndex}
                resolvedActiveIdx={resolvedActiveIdx}
                customChestUrl={customChestUrl}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
});


interface ChikooHomescreenProps {
  xp: number;
  gems: number;
  streak: number;
  rank?: number;
  energy: number;
  completedLessons: string[];
  bookmarkedLessons: string[];
  onToggleBookmark: (lessonId: string) => void;
  onLessonSelect: (lessonId: string) => void;
  currentLessonId?: string;
  setView: (view: 'home' | 'leaderboard' | 'quests' | 'profile' | 'challenges' | 'practice' | 'rewards_store') => void;
  modules: Module[];
  isAdmin?: boolean;
  onAdminClick?: () => void;
  onModuleSelect?: (module: Module) => void;
  completedDailyChallenges?: string[];
  onCompleteDailyChallenge?: (challenge: any) => void;
  profiles?: SupabaseUserProfile[];
  onBiomeChange?: (opacities: number[]) => void;
  selectedAvatarId?: string;
  username?: string;
  worlds?: World[];
  selectedWorldId?: string;
  userWorldProgress?: UserWorldProgress[];
  onSelectWorld?: (worldId: string) => void;
  isLoadingWorlds?: boolean;
}

function ChikooHomescreen({
  xp,
  gems,
  streak,
  rank,
  energy,
  completedLessons,
  bookmarkedLessons,
  onToggleBookmark,
  onLessonSelect,
  currentLessonId,
  setView,
  modules,
  isAdmin = false,
  onAdminClick,
  onModuleSelect,
  completedDailyChallenges = [],
  onCompleteDailyChallenge,
  profiles = [],
  onBiomeChange,
  selectedAvatarId = 'user',
  username = 'Shaurya Talks',
  worlds = [],
  selectedWorldId = '256e5b30-e5ec-45ba-a024-7318c96eb623',
  userWorldProgress = [],
  onSelectWorld,
  isLoadingWorlds = false
}: ChikooHomescreenProps) {
  const { t } = useTranslation();
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [puzzlePacks, setPuzzlePacks] = useState<PuzzlePack[]>([]);

  // World 2 gating play states
  const [playChallengeId, setPlayChallengeId] = useState<string | null>(null);
  const [playSelectedOption, setPlaySelectedOption] = useState<string | null>(null);
  const [playIsCorrect, setPlayIsCorrect] = useState<boolean | null>(null);
  const [playShowExplanation, setPlayShowExplanation] = useState<boolean>(false);

  const selectedWorldModules = useMemo(() => {
    let filteredModules = modules;
    if (selectedWorldId && worlds && worlds.length > 0) {
      const isFirstWorld = selectedWorldId === 'world_1' || selectedWorldId === '256e5b30-e5ec-45ba-a024-7318c96eb623' || worlds[0]?.id === selectedWorldId;
      filteredModules = modules.filter(m => {
        if (m.world_id) {
          return m.world_id === selectedWorldId;
        }
        return isFirstWorld;
      });
    }
    if (filteredModules.length === 0 && modules.length > 0) {
      filteredModules = modules;
    }
    return [...filteredModules].sort((a, b) => (a.sort_order ?? a.order ?? 0) - (b.sort_order ?? b.order ?? 0));
  }, [modules, selectedWorldId, worlds]);

  useEffect(() => {
    getPuzzlePacksAsync().then(packs => {
      if (packs) {
        setPuzzlePacks(packs);
      }
    });
    const handlePuz = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setPuzzlePacks(e.detail);
      } else {
        setPuzzlePacks(getPuzzlePacks());
      }
    };
    window.addEventListener('chikooPuzzlePacksChanged', handlePuz);
    return () => {
      window.removeEventListener('chikooPuzzlePacksChanged', handlePuz);
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Determine current active Level index
  const activeLevelIdx = useMemo(() => {
    const idx = modules.findIndex(m => !(m.lessons || []).every(l => completedLessons.includes(l.id)));
    return idx === -1 ? Math.max(0, modules.length - 1) : Math.max(0, idx);
  }, [modules, completedLessons]);

  // Smart preloading: prefetch next biome background silently when idle (3s delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      preloadNextBiomes();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Intelligent Background Preload: Preload active next lesson assets so tap -> launch is instant
  useEffect(() => {
    const idleTimer = setTimeout(() => {
      const allLessons = modules.flatMap(m => m.lessons || []);
      const nextLesson = allLessons.find(l => !completedLessons.includes(l.id));
      if (nextLesson) {
        preloadLessonAssets(nextLesson, undefined, 4000);
      }
    }, 1500);
    return () => clearTimeout(idleTimer);
  }, [modules, completedLessons]);

  // Total XP/Progress formulas
  const totalLessonsCount = useMemo(() => modules.flatMap(m => m.lessons).length, [modules]);
  const completedLessonsCount = useMemo(() => {
    const allLessonIds = modules.flatMap(m => m.lessons).map(l => l.id);
    return completedLessons.filter(id => allLessonIds.includes(id)).length;
  }, [modules, completedLessons]);

  const progressPercentage = useMemo(() => {
    if (totalLessonsCount === 0) return 43; // default fallback
    const computed = Math.round((completedLessonsCount / totalLessonsCount) * 100);
    return completedLessonsCount > 0 ? computed : 43;
  }, [totalLessonsCount, completedLessonsCount]);

  // Find next lesson for the Mascot bubble trigger
  const nextLesson = useMemo(() => {
    const flatLessons = modules.flatMap(m => m.lessons);
    return flatLessons.find(l => !completedLessons.includes(l.id)) || flatLessons[0];
  }, [modules, completedLessons]);

  // Find current active module and active lesson
  const currentActiveModule = useMemo(() => {
    const flatLessons = modules.flatMap(m => m.lessons || []);
    const currentActiveLesson = flatLessons.find(l => !completedLessons.includes(l.id)) || flatLessons[0];
    const currentActiveLessonId = currentActiveLesson?.id || '';
    return modules.find(m => m.lessons?.some(l => l.id === currentActiveLessonId)) || modules[0];
  }, [modules, completedLessons]);

  const currentActiveModuleIdx = useMemo(() => {
    return currentActiveModule ? modules.indexOf(currentActiveModule) : 0;
  }, [modules, currentActiveModule]);

  const currentActiveLesson = useMemo(() => {
    return currentActiveModule?.lessons?.find(l => !completedLessons.includes(l.id)) || currentActiveModule?.lessons?.[0];
  }, [currentActiveModule, completedLessons]);

  const numLessons = useMemo(() => {
    return currentActiveModule?.lessons?.length || 0;
  }, [currentActiveModule]);

  const completedInModule = useMemo(() => {
    return currentActiveModule?.lessons?.filter(l => completedLessons.includes(l.id)).length || 0;
  }, [currentActiveModule, completedLessons]);

  const currentStage = useMemo(() => {
    return Math.min(numLessons, completedInModule + 1);
  }, [numLessons, completedInModule]);

  const progressPercent = useMemo(() => {
    return numLessons > 0 ? Math.round((completedInModule / numLessons) * 100) : 0;
  }, [numLessons, completedInModule]);

  const unitEmoji = useMemo(() => {
    switch (currentActiveModuleIdx % 5) {
      case 0: return '❄';
      case 1: return '🌱';
      case 2: return '📐';
      case 3: return '🐙';
      default: return '✨';
    }
  }, [currentActiveModuleIdx]);
  const [isDossierCollapsed, setIsDossierCollapsed] = useState(false);
  const [visibleModuleIdx, setVisibleModuleIdx] = useState<number>(0);

  useEffect(() => {
    setVisibleModuleIdx(currentActiveModuleIdx);
  }, [currentActiveModuleIdx]);

  useEffect(() => {
    setVisibleModuleIdx(0);
  }, [modules]);

  // Derived unit metadata
  const unitCardsMetadata = useMemo(() => {
    return selectedWorldModules.map((module) => ({
      ...module,
      name: module.title,
      description: module.description || '',
      lessonCount: module.lessons?.length || 0,
    }));
  }, [selectedWorldModules]);

  const scrolledNumLessons = useMemo(() => {
    return unitCardsMetadata[visibleModuleIdx]?.lessons?.length || 0;
  }, [unitCardsMetadata, visibleModuleIdx]);

  const scrolledCompletedInModule = useMemo(() => {
    return unitCardsMetadata[visibleModuleIdx]?.lessons?.filter(l => completedLessons.includes(l.id)).length || 0;
  }, [unitCardsMetadata, visibleModuleIdx, completedLessons]);

  const isScrolledModuleLocked = useMemo(() => {
    if (visibleModuleIdx === 0) return false;
    const flatLessons = modules.flatMap(m => m.lessons || []);
    const firstLessonOfScrolled = unitCardsMetadata[visibleModuleIdx]?.lessons?.[0];
    const globalLessonIdx = firstLessonOfScrolled ? flatLessons.findIndex(al => al.id === firstLessonOfScrolled.id) : -1;
    return globalLessonIdx > 0 && !completedLessons.includes(flatLessons[globalLessonIdx - 1]?.id || '');
  }, [modules, unitCardsMetadata, completedLessons, visibleModuleIdx]);
  const [isGuideCollapsed, setIsGuideCollapsed] = useState(false);
  const [isChikooCardCollapsed, setIsChikooCardCollapsed] = useState(false);
  const [chikooStage, setChikooStage] = useState<'slide-in' | 'wave' | 'idle'>('slide-in');
  const [speechMessage, setSpeechMessage] = useState('');
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);

  useEffect(() => {
    // Determine the contextual message
    const completedCount = completedLessons?.length || 0;
    
    // Check if they just completed a lesson
    const prevCompletedCountStr = localStorage.getItem('CHIKOO_PREV_COMPLETED_COUNT');
    const prevCompletedCount = prevCompletedCountStr ? parseInt(prevCompletedCountStr, 10) : completedCount;
    localStorage.setItem('CHIKOO_PREV_COMPLETED_COUNT', completedCount.toString());

    // Check last visit for "returning after a break"
    const lastVisitStr = localStorage.getItem('CHIKOO_LAST_VISIT_TIME');
    const now = Date.now();
    localStorage.setItem('CHIKOO_LAST_VISIT_TIME', now.toString());
    const isReturningAfterBreak = lastVisitStr ? (now - parseInt(lastVisitStr, 10) > 15 * 60 * 1000) : false; // 15 mins break

    const nextLessonTitle = nextLesson?.title?.replace(/^(Module|Lesson|Unit|Chapter)\s+\d+(\.\d+)*:\s*/i, '') || 'the next lesson';

    let msg = '';
    if (completedCount === 0) {
      msg = `Oh, hey Shaurya! So thrilled you're here. Ready to blast off? 🚀 Let's start with "${nextLessonTitle}"—tap that beautiful glowing button below!`;
    } else if (completedCount > prevCompletedCount) {
      msg = `Oh my gosh, Shaurya! You absolutely crushed that! 🎉 Ready to keep this momentum going? Let's take on "${nextLessonTitle}" next!`;
    } else {
      const pathGreetings = [
        `Hey Shaurya! I'm super excited to learn with you today! 💫 Let's unlock "${nextLessonTitle}" together—tap that glowing blue node below!`,
        `Welcome back! Ready to show this map who's boss? 😎 Up next is "${nextLessonTitle}". Let's jump right in!`,
        `Ooh, check this out! The next star is waiting for us, Shaurya! ⭐ Let's master "${nextLessonTitle}" and grow our streak!`,
        `You are doing incredibly well! Let's conquer "${nextLessonTitle}" next. Tap that active path button below and let's get it! ⚡`
      ];
      const idx = (streak || 0) % pathGreetings.length;
      msg = pathGreetings[idx];
    }

    setSpeechMessage(msg);

    // Show bubble on load - stays visible permanently (do NOT auto-dismiss)
    setShowSpeechBubble(true);
  }, [completedLessons, streak, progressPercentage, nextLesson]);

  useEffect(() => {
    // Just keep the entrance slide-in animation and do not trigger wave or looping idle animations.
    setChikooStage('slide-in');
  }, []);

  // Smoothly center active progression naturally in the viewport on desktop and mobile load
  useEffect(() => {
    const timer = setTimeout(() => {
      const activeNode = document.querySelector('[data-lesson-active="true"]') || document.getElementById('tour-current-lesson');
      if (activeNode) {
        activeNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [completedLessons]);

  const [popupAnchorRect, setPopupAnchorRect] = useState<DOMRect | null>(null);
  const [shakeNodeIndex, setShakeNodeIndex] = useState<number | null>(null);

  // Helper to focus the user on the next active lesson path node (scroll & shake)
  const focusOnNextLesson = () => {
    soundManager.play('click');
    const activeNode = document.querySelector('[data-lesson-active="true"]');
    if (activeNode) {
      activeNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    const flatLessons = modules.flatMap(m => m.lessons || []);
    const currentActiveLessonId = flatLessons.find(l => !completedLessons.includes(l.id))?.id || flatLessons[0]?.id || '';
    const activeLessonFlatIdx = flatLessons.findIndex(l => l.id === currentActiveLessonId);
    const resolvedActiveIdx = activeLessonFlatIdx === -1 ? flatLessons.length : activeLessonFlatIdx;
    
    setShakeNodeIndex(resolvedActiveIdx);
    setTimeout(() => setShakeNodeIndex(null), 1000);
  };
  const popupRef = useRef<HTMLDivElement>(null);

  // Reset collapsible state when changing active level or module
  useEffect(() => {
    if (activeModule) {
      setIsDossierCollapsed(false);
    }
  }, [activeModule]);

  // Home dynamic quest tasks states
  const [cometQuestDone, setCometQuestDone] = useState(() => localStorage.getItem('comet_quest_done') === 'true');
  const [showConfetti, setShowConfetti] = useState(false);


  
  const sortedProfiles = useMemo(() => {
    return [...(profiles || [])].sort((a, b) => b.gems - a.gems);
  }, [profiles]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cachedOffsetsRef = useRef<{ index: number; top: number; height: number }[]>([]);
  const bgContainerRef = useRef<HTMLDivElement>(null);
  const blendedColorRef = useRef<string>('rgba(224, 242, 254, 0.4)');

  const computeInitialLayouts = useCallback((mods: Module[]) => {
    let accTop = isMobile ? 236 : 248;
    const verticalGap = isMobile ? 73 : 93;
    return mods.map((m, mIdx) => {
      const startOffset = mIdx === 0 ? 55 : 45;
      const numLessons = m.lessons?.length || 0;
      const windingH = numLessons > 0 ? (startOffset + (numLessons - 1) * verticalGap + 55) : 70;
      const separatorH = 0;
      const totalH = separatorH + windingH + 8;
      const top = accTop;
      accTop += totalH;
      return { index: mIdx, top, height: totalH };
    });
  }, [isMobile]);

  const [unitLayouts, setUnitLayouts] = useState<Array<{ index: number; top: number; height: number }>>(() => {
    return computeInitialLayouts(selectedWorldModules);
  });

  // Re-measure accurately when DOM nodes mount, resize, or curriculum changes
  const measureModuleOffsets = useCallback(() => {
    if (!scrollContainerRef.current) return [];
    const el = scrollContainerRef.current;
    const moduleElements = el.querySelectorAll('[data-module-index]');
    if (moduleElements.length === 0) return [];

    const bgEl = bgContainerRef.current;
    const bgRect = bgEl ? bgEl.getBoundingClientRect() : null;

    const offsets: { index: number; top: number; height: number }[] = [];
    moduleElements.forEach((child) => {
      const hEl = child as HTMLElement;
      let top = hEl.offsetTop;
      if (bgRect) {
        const childRect = hEl.getBoundingClientRect();
        top = Math.round(childRect.top - bgRect.top);
      }
      offsets.push({
        index: parseInt(hEl.dataset.moduleIndex || '0', 10),
        top,
        height: hEl.offsetHeight,
      });
    });

    offsets.sort((a, b) => a.index - b.index);
    if (offsets.length > 0) {
      setUnitLayouts(offsets);
    }
    return offsets;
  }, []);

  useEffect(() => {
    setUnitLayouts(computeInitialLayouts(selectedWorldModules));
    const timer = setTimeout(() => {
      cachedOffsetsRef.current = measureModuleOffsets();
    }, 60);
    return () => clearTimeout(timer);
  }, [selectedWorldModules, computeInitialLayouts, measureModuleOffsets]);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const ro = new ResizeObserver(() => {
      cachedOffsetsRef.current = measureModuleOffsets();
    });
    ro.observe(scrollContainerRef.current);
    return () => ro.disconnect();
  }, [measureModuleOffsets]);

  useEffect(() => {
    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!scrollContainerRef.current) return;
        const el = scrollContainerRef.current;
        const st = el.scrollTop;

        if (cachedOffsetsRef.current.length === 0) {
          cachedOffsetsRef.current = measureModuleOffsets();
        }
        const offsets = cachedOffsetsRef.current.length > 0 ? cachedOffsetsRef.current : unitLayouts;
        if (offsets.length === 0) return;

        const N = offsets.length;
        const V = el.clientHeight || 800;
        const actualV = V > 0 ? V : 1;

        let activeIndex = 0;
        let transitionRatio = 0;
        let inTransition = false;

        for (let i = 0; i < N - 1; i++) {
          const nextTop = offsets[i + 1].top;
          const transitionStart = nextTop - actualV;
          const transitionEnd = nextTop;

          if (st >= transitionStart && st <= transitionEnd) {
            activeIndex = i;
            transitionRatio = (st - transitionStart) / actualV;
            inTransition = true;
            break;
          }
        }

        if (!inTransition) {
          for (let i = 0; i < N; i++) {
            if (st + actualV * 0.45 >= offsets[i].top) {
              activeIndex = i;
            }
          }
        }

        setVisibleModuleIdx((prev) => (prev !== activeIndex ? activeIndex : prev));

        const opacities = new Array(N).fill(0);
        if (inTransition) {
          opacities[activeIndex] = 1 - transitionRatio;
          if (activeIndex + 1 < N) {
            opacities[activeIndex + 1] = transitionRatio;
          }
        } else {
          opacities[activeIndex] = 1;
        }

        if (onBiomeChange) {
          onBiomeChange(opacities);
        }

        // Adjust Unit 2 ambient audio loop (morning.mp3) volume
        if (offsets.length > 1) {
          const u2Top = offsets[1]?.top || 800;
          const u2Proximity = Math.max(0, Math.min(1, 1 - Math.abs(st - u2Top) / actualV));
          soundManager.updateUnit2Ambient(true, u2Proximity);
        }

        // Adjust Unit 3 ambient audio loop (autumn.mp3) volume
        if (offsets.length > 2) {
          const u3Top = offsets[2]?.top || 1600;
          const u3Proximity = Math.max(0, Math.min(1, 1 - Math.abs(st - u3Top) / actualV));
          soundManager.updateUnit3Ambient(true, u3Proximity);
        }

        const currentBiomeColor = BIOME_COLORS[activeIndex % BIOME_COLORS.length] || BIOME_COLORS[0];
        const nextBiomeColor = BIOME_COLORS[(activeIndex + 1) % BIOME_COLORS.length] || BIOME_COLORS[0];

        const r = Math.round(currentBiomeColor.r * (1 - transitionRatio) + nextBiomeColor.r * transitionRatio);
        const g = Math.round(currentBiomeColor.g * (1 - transitionRatio) + nextBiomeColor.g * transitionRatio);
        const b = Math.round(currentBiomeColor.b * (1 - transitionRatio) + nextBiomeColor.b * transitionRatio);
        const a = (currentBiomeColor.a * (1 - transitionRatio) + nextBiomeColor.a * transitionRatio).toFixed(2);

        const newColor = `rgba(${r}, ${g}, ${b}, ${a})`;
        if (newColor !== blendedColorRef.current) {
          blendedColorRef.current = newColor;
          if (bgContainerRef.current) {
            bgContainerRef.current.style.backgroundColor = newColor;
          }
          biomeChannel.emit(opacities, newColor);
        }
      });
    };

    const handleResize = () => {
      cachedOffsetsRef.current = [];
      measureModuleOffsets();
      handleScroll();
    };

    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleResize, { passive: true });
      handleScroll();
    }
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (el) el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [selectedWorldModules, unitLayouts, measureModuleOffsets, onBiomeChange]);



  const chikooAnimation = useMemo(() => {
    if (chikooStage === 'slide-in') {
      return {
        initial: { x: -80, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        transition: { type: "spring", stiffness: 100, damping: 14 }
      };
    } else if (chikooStage === 'wave') {
      return {
        animate: { 
          rotate: [0, -12, 10, -12, 10, 0],
        },
        transition: { duration: 1.2, ease: "easeInOut" }
      };
    } else {
      // Idle animation: 18-second loop containing breathing, ear twitch, blink, and slight head tilt
      return {
        animate: {
          // Gentle breathing (up and down)
          y: [0, -2.5, 0, -2.5, 0, -2.5, 0, -2.5, 0, -2.5, 0, -2.5, 0],
          // Occasional quick blink (brief scaleY dip) at ~4.5s and ~13.5s
          scaleY: [1, 1, 0.92, 1, 1, 1, 1, 1, 1, 0.92, 1, 1, 1],
          // Occasional ear twitch and head tilt (rotate):
          // - 3s to 6s: slight head tilt (2.5 degrees)
          // - 9s to 12s: slight opposite tilt (-2.5 degrees)
          // - 15s to 17s: rapid ear twitch (0 -> 4 -> -4 -> 4 -> 0)
          rotate: [0, 0, 2.5, 2.5, 0, 0, -2.5, -2.5, 0, 0, 4, -4, 0],
        },
        transition: {
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95, 1]
        }
      };
    }
  }, [chikooStage]);

  // Close popup on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setActiveModule(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Node Translate X Zigzag offsets
  const translateClasses = [
    'translate-x-4',
    'translate-x-10',
    '-translate-x-8',
    'translate-x-6',
    'translate-x-0'
  ];

  const getLevelInfo = (idx: number) => {
    const moduleItem = modules[idx];
    const moduleTitle = moduleItem ? moduleItem.title : "";
    const defaultInfos = [
      { title: moduleTitle || "Stars & Space Secrets", duration: "Completed • +500 Cookies" },
      { title: moduleTitle || "Plants & Natural Wonders", duration: "Playing Now • 15 mins" },
      { title: moduleTitle || "Ancient Math Riddles", duration: "🔒 Locked" },
      { title: moduleTitle || "Deep Sea Ocean Discoveries", duration: "🔒 Locked" },
      { title: moduleTitle || "The Cosmic Frontier!", duration: "🏁 Destination" }
    ];
    return defaultInfos[idx] 
      ? { ...defaultInfos[idx], title: moduleTitle || defaultInfos[idx].title }
      : { title: moduleTitle || `Chapter ${idx + 1}`, duration: "Locked" };
  };

  const handleNodeClick = (e: React.MouseEvent, module: Module, idx: number) => {
    soundManager.play('click');
    const isLocked = idx > activeLevelIdx;
    if (isLocked) {
      soundManager.play('pop');
      setShakeNodeIndex(idx);
      setTimeout(() => setShakeNodeIndex(null), 500);
      return;
    }
    
    // Store container node bounding rect to draw popup elegantly below/above
    const rect = e.currentTarget.getBoundingClientRect();
    setPopupAnchorRect(rect);
    
    if (onModuleSelect) {
      onModuleSelect(module);
    } else {
      setActiveModule(module);
    }
  };

  return (
    <div className="flex-1 relative flex flex-col overflow-hidden w-full h-full bg-transparent">
      {/* Layer 2: Subtle Ambient Glow & Particles */}
      <AmbientAIEffects />

      {/* Burst confetti on daily quest success */}
      <ConfettiEffect active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* PREMIUM COMPACT GAME-STYLE HEADER (EDGE-TO-EDGE) */}
      <div className="absolute top-0 left-0 w-full z-40 flex flex-col pointer-events-none">
        {/* Greeting Card - Stable persistent card with smooth color transition */}
        <div
          id="tour-welcome"
          className="w-[calc(100%-32px)] sm:w-[calc(100%-40px)] max-w-lg rounded-[22px] px-5 py-3.5 flex items-center justify-between select-none overflow-visible min-h-[90px] sm:min-h-[100px] mt-[58px] mx-auto relative group transition-all duration-300 pointer-events-auto"
          style={{ 
            background: visibleModuleIdx === 3
              ? 'linear-gradient(135deg, rgba(251, 207, 232, 0.96), rgba(244, 114, 182, 0.88))'
              : (visibleModuleIdx === 1 || visibleModuleIdx === 4)
                ? 'linear-gradient(135deg, rgba(254, 243, 199, 0.96), rgba(251, 191, 36, 0.88))'
                : 'linear-gradient(135deg, rgba(16, 185, 129, 0.92), rgba(4, 120, 87, 0.88))',
            backdropFilter: 'blur(28px) saturate(160%)',
            WebkitBackdropFilter: 'blur(28px) saturate(160%)',
            border: visibleModuleIdx === 3
              ? '1px solid rgba(244, 114, 182, 0.7)'
              : (visibleModuleIdx === 1 || visibleModuleIdx === 4)
                ? '1px solid rgba(252, 211, 77, 0.7)'
                : '1px solid rgba(255, 255, 255, 0.35)',
            boxShadow: visibleModuleIdx === 3
              ? 'inset 0 1.5px 3px rgba(255, 255, 255, 0.9), 0 14px 36px rgba(219, 39, 119, 0.28)'
              : (visibleModuleIdx === 1 || visibleModuleIdx === 4)
                ? 'inset 0 1.5px 3px rgba(255, 255, 255, 0.9), 0 14px 36px rgba(245, 158, 11, 0.28)'
                : 'inset 0 1.5px 3px rgba(255, 255, 255, 0.5), 0 14px 36px rgba(4, 120, 87, 0.38)'
          }}
        >
          {/* Glass Gloss Sheen Overlay */}
          <div className="absolute inset-0 rounded-[22px] bg-gradient-to-b from-white/15 via-transparent to-black/15 pointer-events-none" />
          {/* Left Column: Chikoo Character sticker */}
          <img 
            src={getUnitChikooImage(visibleModuleIdx, selectedWorldModules[visibleModuleIdx])}
            alt={`Unit ${visibleModuleIdx + 1} Character`}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/heading_aibo.webp'; }}
            className="h-22 sm:h-28 w-auto object-contain pointer-events-none flex-shrink-0 mr-3.5 -my-3 drop-shadow-sm transition-transform duration-300"
            referrerPolicy="no-referrer"
          />

          {/* Right Column: Unit + Lesson Information, Lesson Title */}
          <div className="flex flex-col text-left pr-10 flex-1 min-w-0 justify-center">
            {/* 1. Unit + Lesson Information */}
            <div className="flex items-center gap-x-2 leading-none mb-1">
              <span className={`text-[10px] sm:text-[11px] font-black tracking-wider uppercase transition-colors duration-200 ${visibleModuleIdx === 3 ? 'text-pink-950/90' : (visibleModuleIdx === 1 || visibleModuleIdx === 4) ? 'text-amber-900/90' : 'text-emerald-100'}`}>
                {t('home.unit', 'Unit')} {visibleModuleIdx + 1} • {t('home.lesson', 'Lesson')} {Math.min(scrolledNumLessons, scrolledCompletedInModule + 1)} {t('home.of', 'of')} {scrolledNumLessons}
              </span>
            </div>

            {/* 2. Lesson Title */}
            <h1 className={`text-[15px] sm:text-[17px] font-black leading-tight truncate drop-shadow-2xs transition-colors duration-200 ${visibleModuleIdx === 3 ? 'text-pink-950' : (visibleModuleIdx === 1 || visibleModuleIdx === 4) ? 'text-amber-950' : 'text-white'}`} title={unitCardsMetadata[visibleModuleIdx]?.title || "Exploring AI Horizons"}>
              {unitCardsMetadata[visibleModuleIdx]?.title || "Exploring AI Horizons"}
            </h1>
          </div>

          {/* 4. Top-Right Floating Streak Indicator (Animated fire flame with flicker glow) */}
          <div className="absolute top-3 right-3.5 flex items-center gap-1 text-[13px] sm:text-[14px] font-black select-none pointer-events-none">
            <AnimatedFireFlame isActive={(streak || 0) > 0} size="sm" />
            <span className={`font-black tracking-tight leading-none drop-shadow-2xs transition-colors duration-200 ${visibleModuleIdx === 3 ? 'text-pink-950' : (visibleModuleIdx === 1 || visibleModuleIdx === 4) ? 'text-amber-950' : 'text-white'}`}>
              {streak || 0}
            </span>
          </div>
        </div>
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide bg-transparent text-slate-800 font-body-md relative z-10 w-full h-full smooth-scroll-container"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
          transform: 'translate3d(0, 0, 0)',
          willChange: 'scroll-position',
          scrollBehavior: 'smooth'
        }}
      >
        <div className="relative min-h-full w-full pb-28 pt-[160px] sm:pt-[175px] isolate">
          {/* DYNAMIC BIOME BACKGROUND SYSTEM */}
          {/* Independent solid world backdrop layer: ensures 100% identical artwork in both light & dark themes */}
          <div className="absolute inset-0 bg-white dark:bg-[#0b0f19] pointer-events-none -z-10" />
          <div 
            ref={bgContainerRef}
            className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
            style={{ 
              backgroundColor: blendedColorRef.current,
              transition: 'background-color 0.5s ease-out',
            }}
          >
            {/* Seamless, per-unit positioned biome backgrounds */}
            {selectedWorldModules.map((mod, idx) => {
              const layout = unitLayouts[idx] || { index: idx, top: idx === 0 ? 0 : (isMobile ? 236 : 248) + 600 * idx, height: 600 };
              const customImg = (mod as any)?.metadata?.background_image || (mod as any)?.background_image || (mod as any)?.bg_image || getModuleBiomeImage(mod, idx);
              return (
                <LazyBiomeBackground
                  key={`biome-bg-${mod?.id || idx}`}
                  idx={idx}
                  layout={layout}
                  modulesCount={selectedWorldModules.length}
                  customImage={customImg}
                />
              );
            })}
          </div>

          {/* Dynamic Learning Path Section - Given More Breathing Room */}
          <section className="relative z-10 pt-0 pb-6 space-y-8">

            {(() => {
              const world2Progress = userWorldProgress.find(p => p.world_id === 'world_2' || p.world_id === 'e58dae0a-90e2-4e57-be26-234593fc00be');
              const isWorld2Locked = (selectedWorldId === 'world_2' || selectedWorldId === 'e58dae0a-90e2-4e57-be26-234593fc00be') && (!world2Progress || !world2Progress.unlocked);

              if (isWorld2Locked) {
                // Find all World 1 module IDs to fetch required daily challenges
                const world1Modules = modules.filter(m => !m.world_id || m.world_id === 'world_1' || m.world_id === '256e5b30-e5ec-45ba-a024-7318c96eb623');
                const world1ModuleIds = world1Modules.map(m => m.id);
                const requiredChallenges = getRequiredWorld1DailyChallenges(DAILY_CHALLENGES, world1ModuleIds);
                
                return (
                  <div className="w-[calc(100%-32px)] sm:w-full max-w-xl mx-auto my-6 p-6 sm:p-8 bg-white/95 dark:bg-[#172033]/95 backdrop-blur-xl rounded-[2.5rem] border-2 border-slate-200/90 dark:border-[rgba(226,232,240,0.14)] text-center shadow-2xl relative z-30 space-y-6 sm:space-y-8 select-none">
                    
                    {/* Glowing Locked Mascot Header */}
                    <div className="relative">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-full flex items-center justify-center mx-auto text-3xl sm:text-4xl shadow-lg shadow-orange-300/35 relative z-10 animate-bounce">
                        🔒
                      </div>
                      <div className="absolute inset-0 bg-orange-400/20 rounded-full blur-2xl max-w-[120px] mx-auto -translate-y-2 pointer-events-none" />
                    </div>

                    {/* Locking Messaging */}
                    <div className="space-y-2.5 max-w-md mx-auto">
                      <h2 className="text-xl sm:text-2xl font-display font-black text-slate-800 dark:text-white tracking-tight leading-tight">
                        World 2 Access Restricted
                      </h2>
                      <p className="text-sm sm:text-base font-extrabold text-slate-600 dark:text-slate-300 leading-snug">
                        "Complete all World 1 Daily Challenges to unlock World 2."
                      </p>
                      <p className="text-[11px] font-bold text-slate-400/90 dark:text-slate-400 uppercase tracking-wider">
                        Required World 1 Challenges &amp; Progress
                      </p>
                    </div>

                    {/* Gated Challenge List */}
                    <div className="space-y-3 max-w-lg mx-auto text-left">
                      {requiredChallenges.map((dc, idx) => {
                        const isCompleted = completedDailyChallenges.includes(dc.id);
                        const isSelectedToPlay = playChallengeId === dc.id;

                        return (
                          <div 
                            key={`gate-dc-${dc.id}`}
                            className={`border-2 rounded-3xl p-5 sm:p-6 transition-all duration-200 ${
                              isCompleted 
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-250 dark:border-emerald-800/60 shadow-xs' 
                                : isSelectedToPlay
                                ? 'bg-slate-50 dark:bg-[#243149] border-amber-400 shadow-md ring-4 ring-amber-100/50 dark:ring-amber-950/40'
                                : 'bg-white dark:bg-[#243149] hover:bg-slate-50/50 dark:hover:bg-[#2e3e5c] border-slate-200/90 dark:border-slate-700/60 shadow-3xs'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-sm font-extrabold border-2 transition-all ${
                                  isCompleted 
                                    ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm' 
                                    : 'bg-slate-100 dark:bg-[#172033] text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                }`}>
                                  {isCompleted ? <Check className="w-5 h-5 stroke-[3.5]" /> : <span>{idx + 1}</span>}
                                </div>
                                <div>
                                  <h4 className={`text-sm sm:text-base font-extrabold ${isCompleted ? 'text-emerald-950 dark:text-emerald-300 font-black line-through opacity-85' : 'text-slate-800 dark:text-slate-100'}`}>
                                    {dc.title}
                                  </h4>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug font-medium mt-0.5 max-w-[280px] sm:max-w-[340px] truncate">
                                    {dc.description}
                                  </p>
                                </div>
                              </div>

                              {!isCompleted && !isSelectedToPlay && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    soundManager.play('click');
                                    setPlayChallengeId(dc.id);
                                    setPlaySelectedOption(null);
                                    setPlayIsCorrect(null);
                                    setPlayShowExplanation(false);
                                  }}
                                  className="px-4 py-2 bg-amber-500 text-white font-display font-black text-xs rounded-xl shadow-[0_3px_0_#d97706] hover:brightness-105 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wide cursor-pointer shrink-0"
                                >
                                  Solve
                                </button>
                              )}

                              {isCompleted && (
                                <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                                  Done 🏆
                                </span>
                              )}
                            </div>

                            {/* INLINE CHALLENGE GAMEPLAY PANEL */}
                            {isSelectedToPlay && !isCompleted && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-5 pt-5 border-t border-dashed border-slate-200 dark:border-slate-700 space-y-4"
                              >
                                {/* Challenge Question */}
                                <div className="bg-slate-100/80 dark:bg-[#172033]/80 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 font-mono">Question</span>
                                  <p className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-200 leading-relaxed mt-1">
                                    {dc.question}
                                  </p>
                                </div>

                                {/* MCQ Option Buttons */}
                                <div className="space-y-2">
                                  {dc.options.map((option, oIdx) => {
                                    const isSel = playSelectedOption === option;
                                    const isCorrectOpt = option === dc.correctAnswer;
                                    
                                    let btnStyle = "border-slate-200 dark:border-slate-700 bg-white dark:bg-[#172033] hover:bg-slate-50/50 dark:hover:bg-[#1e293b] text-slate-700 dark:text-slate-200";
                                    if (playSelectedOption !== null) {
                                      if (isCorrectOpt) {
                                        btnStyle = "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-450 dark:border-emerald-500 text-emerald-950 dark:text-emerald-200 font-black shadow-[0_4px_0_#10b981]";
                                      } else if (isSel) {
                                        btnStyle = "bg-rose-50 dark:bg-rose-950/50 border-rose-450 dark:border-rose-500 text-rose-950 dark:text-rose-200 font-black shadow-[0_4px_0_#ef4444] animate-shake";
                                      } else {
                                        btnStyle = "bg-slate-50 dark:bg-slate-900/40 border-slate-150 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-60 cursor-not-allowed";
                                      }
                                    }

                                    return (
                                      <button
                                        key={`gate-opt-${oIdx}`}
                                        type="button"
                                        disabled={playSelectedOption !== null}
                                        onClick={() => {
                                          setPlaySelectedOption(option);
                                          const correct = option === dc.correctAnswer;
                                          setPlayIsCorrect(correct);
                                          setPlayShowExplanation(true);
                                          if (correct) {
                                            soundManager.play('correct');
                                          } else {
                                            soundManager.play('incorrect');
                                          }
                                        }}
                                        className={`w-full text-left p-3.5 rounded-xl border-2 text-xs font-bold leading-normal transition-all flex items-start gap-2.5 cursor-pointer ${btnStyle}`}
                                      >
                                        <span className="text-slate-400">{(oIdx + 10).toString(36).toUpperCase()})</span>
                                        <span>{option}</span>
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Result Feedback Explanation */}
                                {playShowExplanation && (
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`p-4 rounded-2xl border-2 text-xs leading-normal font-semibold ${
                                      playIsCorrect ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                                    }`}
                                  >
                                    <h5 className="font-black text-xs uppercase font-mono mb-0.5">
                                      {playIsCorrect ? '🎉 Correct Analysis!' : '❌ Let\'s Try Again'}
                                    </h5>
                                    <p className="opacity-90">{dc.explanation}</p>
                                    {playIsCorrect && (
                                      <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
                                        🚀 READY TO CLAIM!
                                      </p>
                                    )}
                                  </motion.div>
                                )}

                                  {/* Action Buttons (Quit / Complete) */}
                                <div className="flex items-center gap-3 pt-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      soundManager.play('click');
                                      setPlayChallengeId(null);
                                      setPlaySelectedOption(null);
                                      setPlayIsCorrect(null);
                                      setPlayShowExplanation(false);
                                    }}
                                    className="flex-1 py-3 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-350 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 font-display font-black text-xs rounded-xl uppercase tracking-wider transition-all cursor-pointer text-center bg-white dark:bg-[#172033]"
                                  >
                                    {t('common.close', 'Close')}
                                  </button>
                                  {playShowExplanation && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        soundManager.play('click');
                                        if (playIsCorrect) {
                                          if (onCompleteDailyChallenge) {
                                            onCompleteDailyChallenge(dc);
                                          }
                                        }
                                        setPlayChallengeId(null);
                                        setPlaySelectedOption(null);
                                        setPlayIsCorrect(null);
                                        setPlayShowExplanation(false);
                                      }}
                                      className={`flex-1 py-3 text-white font-display font-black text-xs rounded-xl uppercase tracking-wider transition-all cursor-pointer text-center ${
                                        playIsCorrect 
                                          ? 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_4px_0_#10b981] active:translate-y-0.5 active:shadow-none' 
                                          : 'bg-slate-800 hover:bg-slate-900 shadow-[0_4px_0_#1e293b]'
                                      }`}
                                    >
                                      {playIsCorrect ? t('common.claim', 'Claim Reward') : t('common.try_again', 'Retry')}
                                    </button>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              // Precompute lesson offsets for global index tracking
              const moduleLessonOffsets: number[] = [];
              let currentOffset = 0;
              for (let i = 0; i < selectedWorldModules.length; i++) {
                moduleLessonOffsets.push(currentOffset);
                currentOffset += selectedWorldModules[i].lessons?.length || 0;
              }

              const flatLessons = selectedWorldModules.flatMap(m => m.lessons || []);
              const currentActiveLessonId = flatLessons.find(l => !completedLessons.includes(l.id))?.id || flatLessons[0]?.id || '';
              const activeLessonFlatIdx = flatLessons.findIndex(l => l.id === currentActiveLessonId);
              const resolvedActiveIdx = activeLessonFlatIdx === -1 ? flatLessons.length : activeLessonFlatIdx;

              if (selectedWorldModules.length === 0) {
                return (
                  <div className="w-full max-w-md mx-auto my-12 p-8 bg-white/90 backdrop-blur-md rounded-3xl border-2 border-slate-200/80 text-center shadow-sm space-y-3 relative z-20">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-2xl font-black">
                      🪐
                    </div>
                    <h3 className="text-base font-black text-slate-800">No Modules in this World Yet</h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">
                      This world is being crafted. Select another world from above to continue your learning path!
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-2">
                  {selectedWorldModules.map((module, moduleIdx) => {
                  const startIdx = moduleLessonOffsets[moduleIdx] || 0;
                  const numLessons = module.lessons?.length || 0;
                  const startOffset = moduleIdx === 0 ? 8 : 0;

                  // A module is locked if its first lesson is locked
                  const firstLesson = module.lessons?.[0];
                  const globalLessonIdx = firstLesson ? flatLessons.findIndex(al => al.id === firstLesson.id) : -1;
                  const isModuleLocked = globalLessonIdx > 0 && !completedLessons.includes(flatLessons[globalLessonIdx - 1]?.id || '');

                  return (
                    <div key={`module-${module.id || 'mod'}-${moduleIdx}`} data-module-index={moduleIdx} className={`w-full flex flex-col items-center ${moduleIdx === 0 ? 'mt-0' : ''}`}>
                      
                      {/* Unit Winding Path Segment */}
                      {numLessons > 0 && (
                        <HomeWindingSection
                          module={module}
                          moduleIdx={moduleIdx}
                          startIdx={startIdx}
                          completedLessons={completedLessons}
                          resolvedActiveIdx={resolvedActiveIdx}
                          bookmarkedLessons={bookmarkedLessons}
                          puzzlePacks={puzzlePacks}
                          isMobile={isMobile}
                          onLessonSelect={onLessonSelect}
                          shakeNodeIndex={shakeNodeIndex}
                          setShakeNodeIndex={setShakeNodeIndex}
                        />
                      )}

                    </div>
                  );
                })}
              </div>
            );
          })()}
        </section>




      </div>
    </div>

    {/* Dedicated Unit Chapter Learning Path Overlay */}
    <AnimatePresence>
      {activeModule && (
        <div className="fixed inset-0 z-[500] bg-white">
          <UnitLearningPath
            module={activeModule}
            onClose={() => setActiveModule(null)}
            onLessonSelect={(lId) => {
              setActiveModule(null);
              onLessonSelect(lId);
            }}
            completedLessons={completedLessons}
            bookmarkedLessons={bookmarkedLessons}
            currentLessonId={currentLessonId}
            streak={streak}
            gems={gems}
            modules={selectedWorldModules}
          />
        </div>
      )}
    </AnimatePresence>

  </div>
  );
}

export default memo(ChikooHomescreen);
