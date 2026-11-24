import { useState, useMemo, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { assertUniqueKeys } from '../lib/errorUtils';
import { Star, Check, Lock, Filter, X, Gift, Trophy, Sparkles, Zap, Award, Bookmark, Heart, ChevronRight, Play, Orbit, Rocket, Cpu, Mountain, Snowflake } from 'lucide-react';
import cookiesIcon from '@/cookies.webp';
import ChestIcon from './ui/ChestIcon';
import FrozenLockedNode from './FrozenLockedNode';
import EnvironmentalLockedCard from './EnvironmentalLockedCard';
import EnvironmentLessonNode from './EnvironmentLessonNode';
import { Module, Lesson } from '../lib/content';
import { soundManager } from '../lib/sounds';
import { MAX_ENERGY } from '../constants';
import { getPuzzlePacksAsync, getPuzzlePacks, PuzzlePack, getChallengePacks } from '../lib/practiceStoreNew';

// @ts-ignore
import { getBiomeImage, preloadNextBiomes, getUnitChikooImage } from '../lib/biomeImages';
import { preloadLessonAssets } from '../lib/lessonPreloader';

const getBiomeColors = (mIdx: number) => {
  switch (mIdx % 5) {
    case 0: // Space/Cosmic (Bright sky blue to cosmic purple)
      return {
        activeStart: "#38bdf8", // sky-400
        activeEnd: "#6366f1",   // indigo-500
        upcoming: "#94a3b8",   // slate-400
        glow: "rgba(56, 189, 248, 0.35)",
        pulse: "#E0F2FE",
        sparkle: "#FFFFFF"
      };
    case 1: // AI/Smart Puppy (Emerald green to minty cyan)
      return {
        activeStart: "#34d399", // emerald-400
        activeEnd: "#059669",   // emerald-600
        upcoming: "#a7f3d0",   // emerald-200
        glow: "rgba(52, 211, 153, 0.35)",
        pulse: "#D1FAE5",
        sparkle: "#E6FDF4"
      };
    case 2: // Ethics Guard/Glacier (Frosty cyan/blue to deep royal blue)
      return {
        activeStart: "#06b6d4", // cyan-500
        activeEnd: "#4f46e5",   // indigo-600
        upcoming: "#bae6fd",   // sky-200
        glow: "rgba(6, 182, 212, 0.35)",
        pulse: "#E0F2FE",
        sparkle: "#F0FDFF"
      };
    case 3: // Nature/Bioluminescent (Sunlit gold to warm orange amber)
      return {
        activeStart: "#fbbf24", // amber-400
        activeEnd: "#ea580c",   // orange-600
        upcoming: "#fef3c7",   // amber-100
        glow: "rgba(251, 191, 36, 0.35)",
        pulse: "#FEF3C7",
        sparkle: "#FFFDF5"
      };
    default: // Frosty Glacier/Ice
      return {
        activeStart: "#38bdf8", // sky-400
        activeEnd: "#0284c7",   // sky-700
        upcoming: "#cbd5e1",   // slate-300
        glow: "rgba(56, 189, 248, 0.3)",
        pulse: "#F0F9FF",
        sparkle: "#F8FAFC"
      };
  }
};

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

const getModuleDescription = (moduleTitle: string, mIdx: number) => {
  const lowerTitle = moduleTitle.toLowerCase();
  if (lowerTitle.includes('cosmic') || lowerTitle.includes('space') || lowerTitle.includes('star') || lowerTitle.includes('orbit')) {
    return 'Embark on an interactive journey across starry biomes, decoding cosmic codes and celestial mechanics.';
  }
  if (lowerTitle.includes('robot') || lowerTitle.includes('pattern') || lowerTitle.includes('ai') || lowerTitle.includes('neural') || lowerTitle.includes('model')) {
    return 'Train your smart puppy sidekick and understand neural networks through hands-on pattern puzzles.';
  }
  if (lowerTitle.includes('ethics') || lowerTitle.includes('safety') || lowerTitle.includes('guard') || lowerTitle.includes('bias') || lowerTitle.includes('fair')) {
    return 'Become an Ethics Guard! Tackle moral machine questions and champion fairness for all digital minds.';
  }
  if (lowerTitle.includes('nature') || lowerTitle.includes('plant') || lowerTitle.includes('bio') || lowerTitle.includes('eco')) {
    return 'Discover bioluminescent forests and find repeating mathematical shapes hidden in physical nature.';
  }
  
  // Default fallbacks based on index
  const fallbacks = [
    'Embark on an adventure of discovery, decoding patterns and training your smart AI assistant companion.',
    'Traverse the frozen peak of AI algorithms, learning how models perceive spatial vectors and images.',
    'Dive deep into the ethical code, training neural boundaries to secure privacy and guarantee fairness.',
    'Journey across celestial orbits to understand machine learning and the language of modern space exploration.',
    'Explore bioluminescent networks where code and nature synthesize into a beautiful, magical playground.'
  ];
  return fallbacks[mIdx % fallbacks.length];
};

const getCubicBezierInfo = (
  t: number,
  p0: {x: number; y: number},
  p1: {x: number; y: number},
  p2: {x: number; y: number},
  p3: {x: number; y: number}
) => {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;
  
  const x = mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x;
  const y = mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y;
  
  const dx = 3 * mt2 * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t2 * (p3.x - p2.x);
  const dy = 3 * mt2 * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t2 * (p3.y - p2.y);
  
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  return { x, y, angle };
};

interface ModuleCobblestonesProps {
  module: Module;
  mIdx: number;
  completedLessons: string[];
  currentLessonId?: string;
  allLessons: Lesson[];
  lessonYCoords: number[];
  startOffset: number;
}

const ModuleCobblestones = memo(function ModuleCobblestones({
  module,
  mIdx,
  completedLessons,
  currentLessonId,
  allLessons,
  lessonYCoords,
  startOffset
}: ModuleCobblestonesProps) {
  const stones = useMemo(() => {
    const list: Array<{
      x: number;
      y: number;
      angle: number;
      state: 'completed' | 'active' | 'upcoming' | 'locked';
    }> = [];

    const isLesson0Completed = module.lessons[0] ? completedLessons.includes(module.lessons[0].id) : false;
    const isLesson0Current = module.lessons[0] ? (module.lessons[0].id === currentLessonId) : false;
    let startState: 'completed' | 'active' | 'upcoming' | 'locked' = 'upcoming';
    if (isLesson0Completed) {
      startState = 'completed';
    } else if (isLesson0Current) {
      startState = 'active';
    } else if (module.lessons[0]) {
      const globalIdx = allLessons.findIndex(al => al && al.id === module.lessons[0].id);
      const isFirstLocked = globalIdx > 0 && allLessons[globalIdx - 1] && !completedLessons.includes(allLessons[globalIdx - 1]?.id || '');
      if (isFirstLocked) {
        startState = 'locked';
      } else {
        startState = 'upcoming';
      }
    }

    if (mIdx === 0 && module.lessons.length > 0) {
      const p0 = { x: 150, y: 8 };
      const cp0 = { x: 170, y: 8 + (startOffset - 8) * 0.35 };
      const cp1 = { x: 130, y: 8 + (startOffset - 8) * 0.65 };
      const p1 = { x: 150, y: startOffset };
      
      const numStartStones = 4;
      for (let s = 0; s < numStartStones; s++) {
        const t = 0.15 + (s / (numStartStones - 1)) * 0.7;
        const info = getCubicBezierInfo(t, p0, cp0, cp1, p1);
        list.push({
          ...info,
          state: startState
        });
      }
    }

    for (let i = 0; i < module.lessons.length - 1; i++) {
      const lessonPrev = module.lessons[i];
      const lessonNext = module.lessons[i + 1];
      const isNextCompleted = completedLessons.includes(lessonNext.id);
      const globalIdx = allLessons.findIndex(al => al && al.id === lessonNext.id);
      const isNextLocked = !isNextCompleted && globalIdx > 0 && allLessons[globalIdx - 1] && !completedLessons.includes(allLessons[globalIdx - 1]?.id || '');
      
      const isPrevCompleted = completedLessons.includes(lessonPrev.id);
      const isNextCurrent = lessonNext.id === currentLessonId;
      const isNextActive = isNextCurrent || (isPrevCompleted && !isNextCompleted && !isNextLocked);

      let segmentState: 'completed' | 'active' | 'upcoming' | 'locked' = 'upcoming';
      if (isNextCompleted) {
        segmentState = 'completed';
      } else if (isNextLocked) {
        segmentState = 'locked';
      } else if (isNextActive) {
        segmentState = 'active';
      } else {
        segmentState = 'upcoming';
      }
          
      const angle0 = (i * Math.PI) / 2;
      const angle1 = ((i + 1) * Math.PI) / 2;
      const x0 = 150 + 55 * Math.sin(angle0);
      const y0 = lessonYCoords[i];
      const x1 = 150 + 55 * Math.sin(angle1);
      const y1 = lessonYCoords[i + 1];
      
      const p0 = { x: x0, y: y0 };
      const cp0 = { x: x0, y: y0 + (y1 - y0) * 0.5 };
      const cp1 = { x: x1, y: y1 - (y1 - y0) * 0.5 };
      const p1 = { x: x1, y: y1 };
      
      const numCurveStones = 6;
      for (let s = 0; s < numCurveStones; s++) {
        const t = 0.14 + (s / (numCurveStones - 1)) * 0.72;
        const info = getCubicBezierInfo(t, p0, cp0, cp1, p1);
        list.push({
          ...info,
          state: segmentState
        });
      }
    }

    return list;
  }, [module.lessons, mIdx, completedLessons, currentLessonId, allLessons, lessonYCoords, startOffset]);

  let activeStoneRunningIdx = 0;

  return (
    <>
      {stones.map((stone, sIdx) => {
        const isCompleted = stone.state === 'completed';
        const isLocked = stone.state === 'locked';
        const isActive = stone.state === 'active';
        const isUpcoming = stone.state === 'upcoming';
        
        const activeIdx = isActive ? activeStoneRunningIdx++ : 0;
        
        let mainColor = "#C8DDF5";
        let shadowColor = "#A4BFDF";
        let opacity = 1;

        if (isCompleted) {
          mainColor = "#3DDC97";
          shadowColor = "#2ebc7e";
        } else if (isActive) {
          mainColor = "#3B82F6";
          shadowColor = "#2563EB";
        } else if (isUpcoming) {
          mainColor = "#C8DDF5";
          shadowColor = "#9bbfe6";
          opacity = 1.0;
        } else if (isLocked) {
          mainColor = "#E5EDF4";
          shadowColor = "#ccd7e0";
          opacity = 0.85;
        }

        return (
          <g 
            key={`stone-${mIdx}-${sIdx}`}
            transform={`translate(${stone.x}, ${stone.y}) rotate(${stone.angle})`}
            style={{ opacity, willChange: 'transform' }}
          >
            {/* Under shadow */}
            <rect 
              x={-11} 
              y={-2} 
              width={22} 
              height={9} 
              rx={4.5} 
              fill={shadowColor} 
            />
            
            {/* Main Capsule Body */}
            <rect 
              x={-11} 
              y={-4.5} 
              width={22} 
              height={9} 
              rx={4.5} 
              fill={mainColor} 
            />

            {/* Glossy top highlight */}
            <path 
              d="M -8 -3.2 C -4 -4, 4 -4, 8 -3.2" 
              fill="none" 
              stroke="#FFFFFF" 
              strokeWidth={0.8} 
              strokeLinecap="round" 
              opacity={isActive ? 0.6 : isCompleted ? 0.5 : isUpcoming ? 0.35 : 0.15} 
            />

            {/* Animated reflection sheen */}
            {isActive && (
              <svg 
                x={-11} 
                y={-4.5} 
                width={22} 
                height={9} 
                viewBox="-11 -4.5 22 9" 
                style={{ overflow: 'hidden', willChange: 'transform' }}
              >
                <rect
                  x={-5}
                  y={-10}
                  width={4}
                  height={25}
                  fill="#FFFFFF"
                  opacity={0.3}
                  style={{
                    transformOrigin: '0px 0px',
                    animation: 'ice-sheen 3.2s ease-in-out infinite',
                    animationDelay: `${activeIdx * 0.12}s`,
                  }}
                />
              </svg>
            )}
          </g>
        );
      })}
    </>
  );
});

interface LearningPathProps {
  modules: Module[];
  onLessonSelect: (lessonId: string) => void;
  completedLessons: string[];
  bookmarkedLessons: string[];
  onToggleBookmark: (lessonId: string) => void;
  currentLessonId?: string;
  charging: number;
  lastRechargeQuestDate?: string | null;
}

type FilterType = 'All' | 'Easy' | 'Medium' | 'Hard' | 'Bookmarks';

interface ModuleWindingSectionProps {
  module: Module;
  mIdx: number;
  completedLessons: string[];
  currentLessonId?: string;
  allLessons: Lesson[];
  bookmarkedLessons: string[];
  selectedDifficulty: FilterType;
  isMobile: boolean;
  puzzlePacks: PuzzlePack[];
  onLessonSelect: (lessonId: string) => void;
}

const ModuleWindingSection = memo(function ModuleWindingSection({
  module,
  mIdx,
  completedLessons,
  currentLessonId,
  allLessons,
  bookmarkedLessons,
  selectedDifficulty,
  isMobile,
  puzzlePacks,
  onLessonSelect
}: ModuleWindingSectionProps) {
  const [isNearViewport, setIsNearViewport] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const sortedLessons = useMemo(() => {
    return [...(module.lessons || [])].sort((a, b) => {
      if (a.order_index !== undefined && b.order_index !== undefined && a.order_index !== b.order_index) {
        return a.order_index - b.order_index;
      }
      return (a.id || '').localeCompare(b.id || '', undefined, { numeric: true });
    });
  }, [module.lessons]);

  const START_OFFSET = mIdx === 0 ? 55 : 70;
  const VERTICAL_GAP = isMobile ? 73 : 93;

  const lessonYCoords = useMemo(() => {
    const coords: number[] = [];
    let currentY = START_OFFSET;
    coords.push(currentY);
    for (let i = 1; i < sortedLessons.length; i++) {
      currentY += VERTICAL_GAP;
      coords.push(currentY);
    }
    return coords;
  }, [sortedLessons.length, START_OFFSET, VERTICAL_GAP]);

  // Memoized path definition string for background connector
  const pathD = useMemo(() => {
    if (sortedLessons.length === 0) return "";
    let d = "";
    if (mIdx === 0) {
      d = `M 150 8 C 170 ${8 + (START_OFFSET - 8) * 0.35}, 130 ${8 + (START_OFFSET - 8) * 0.65}, 150 ${START_OFFSET}`;
    } else {
      const startPt = {
        x: 150 + 55 * Math.sin(0),
        y: lessonYCoords[0]
      };
      d = `M ${startPt.x} ${startPt.y}`;
    }
    
    for (let i = 0; i < sortedLessons.length - 1; i++) {
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
  }, [sortedLessons.length, mIdx, START_OFFSET, lessonYCoords]);

  const containerHeight = useMemo(() => {
    return sortedLessons.length > 0 ? lessonYCoords[sortedLessons.length - 1] + 110 : 110;
  }, [sortedLessons.length, lessonYCoords]);

  return (
    <div 
      className="relative w-[300px] mx-auto overflow-visible select-none" 
      style={{ 
        height: containerHeight, 
        contain: 'layout paint'
      }}
    >
      {(() => {
            assertUniqueKeys(module.lessons, l => l.id, `LearningPath.Module(${module.id})`);
            return null;
          })()}
          {/* SVG Connector Track */}
          <svg 
            className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible"
            style={{ zIndex: 1, willChange: 'transform', transform: 'translateZ(0)' }}
          >
            {/* Subtle, thin dashed path line to visually reinforce the zig-zag progression rhythm */}
            {pathD && (
              <path 
                d={pathD} 
                style={{ 
                  strokeDasharray: '6 6', 
                  stroke: 'rgba(148, 163, 184, 0.85)', 
                  strokeWidth: 2.2, 
                  strokeLinecap: 'round', 
                  fill: 'none',
                  willChange: 'transform'
                }}
              />
            )}

            <style>{`
              @keyframes ice-sheen {
                0% {
                  transform: translateX(-24px) skewX(-25deg);
                  opacity: 0;
                }
                15% {
                  opacity: 0.45;
                }
                30% {
                  transform: translateX(24px) skewX(-25deg);
                  opacity: 0;
                }
                100% {
                  transform: translateX(24px) skewX(-25deg);
                  opacity: 0;
                }
              }
            `}</style>

            <ModuleCobblestones
              module={module}
              mIdx={mIdx}
              completedLessons={completedLessons}
              currentLessonId={currentLessonId}
              allLessons={allLessons}
              lessonYCoords={lessonYCoords}
              startOffset={START_OFFSET}
            />
          </svg>

          {/* Nodes and Description Cards */}
          {sortedLessons.map((lesson, lIdx) => {
            const isCompleted = completedLessons.includes(lesson.id);
            const globalIdx = allLessons.findIndex(al => al && al.id === lesson.id);
            const isLocked = !isCompleted && globalIdx > 0 && allLessons[globalIdx - 1] && !completedLessons.includes(allLessons[globalIdx - 1]?.id || '');
            const isCurrent = lesson.id === currentLessonId;

            const angle = (lIdx * Math.PI) / 2;
            const x = 150 + 55 * Math.sin(angle);
            const y = lessonYCoords[lIdx];

            const matchedPack = lesson.isChest ? puzzlePacks.find(p => p.linked_unit_id === module.id || p.linkedUnitId === module.id) : null;
            const customChestUrl = matchedPack?.chest_image_url || matchedPack?.chestImageUrl || matchedPack?.chest_icon_url || matchedPack?.chestIconUrl;

            return (
              <div key={`lp-node-${module.id}-${lesson.id || lIdx}`}>
                {/* Node Wrapper Container */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${x}px`,
                    top: `${y}px`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 20,
                    willChange: 'transform, opacity',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden'
                  }}
                >
                  {/* Next Lesson Premium Floating Speech Bubble Indicator */}
                  {isCurrent && !isCompleted && !isLocked && !lesson.isChest && !lesson.isChallenge && !lesson.isBonus && !lesson.isPuzzle && !lesson.isCheckpoint && !lesson.isStory && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.85, y: 10 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        y: [0, -3, 0],
                      }}
                      transition={{
                        y: {
                          repeat: Infinity,
                          duration: 2.2,
                          ease: "easeInOut"
                        },
                        default: {
                          type: "spring",
                          stiffness: 300,
                          damping: 22
                        }
                      }}
                      className="absolute bottom-[44px] left-1/2 -translate-x-1/2 whitespace-nowrap z-40 pointer-events-none"
                      style={{
                        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(220, 240, 255, 0.88))',
                        border: '1px solid rgba(14, 165, 233, 0.3)',
                        borderRadius: '14px',
                        boxShadow: 'inset 0 1px 1.5px rgba(255, 255, 255, 0.95), 0 6px 16px rgba(14, 165, 233, 0.08)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        padding: '6px 14px',
                      }}
                    >
                      <span className="font-display font-black text-sky-700 uppercase text-[10px] tracking-wider block text-center leading-none">
                        {globalIdx === 0 ? "START" : "CONTINUE"}
                      </span>
                      <div 
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45"
                        style={{
                          background: 'rgba(220, 240, 255, 0.88)',
                          borderRight: '1px solid rgba(14, 165, 233, 0.3)',
                          borderBottom: '1px solid rgba(14, 165, 233, 0.3)',
                        }}
                      />
                    </motion.div>
                  )}
                  <EnvironmentLessonNode
                    biomeIdx={mIdx}
                    state={isLocked ? 'locked' : isCurrent && !isCompleted ? 'active' : 'completed'}
                    size="md"
                    isChest={lesson.isChest}
                    isChallenge={lesson.isChallenge}
                    isBonus={lesson.isBonus}
                    bookmarked={bookmarkedLessons.includes(lesson.id)}
                    difficulty={lesson.difficulty}
                    selectedDifficulty={selectedDifficulty}
                    chestIconUrl={customChestUrl || lesson.chest_icon_url || lesson.chestIconUrl}
                    onClick={() => {
                      console.log(`[LearningPath] Node clicked: ID="${lesson.id}", Title="${lesson.title}", Module="${module.title}" (${module.id}), isLocked=${isLocked}, isCurrent=${isCurrent}`);
                      if (isLocked) {
                        soundManager.play('pop');
                      } else {
                        soundManager.play('click');
                        onLessonSelect(lesson.id);
                      }
                    }}
                  />
                </div>
              </div>
            );
          })}
    </div>
  );
});

interface LazyBiomeBackgroundProps {
  idx: number;
  layout: { top: number; height: number };
  modulesCount: number;
}

const LazyBiomeBackground = memo(function LazyBiomeBackground({
  idx,
  layout,
  modulesCount,
}: LazyBiomeBackgroundProps) {
  const img = getBiomeImage(idx);
  if (!img) return null;

  // Compute bounds with generous, professional overlapping blending regions
  const baseTop = layout.top;
  const baseHeight = layout.height;
  const blendHeight = 120;
  const isFirst = idx === 0;
  const isLast = idx === modulesCount - 1;

  // We start Unit 1 from 0 to cover the full top area, and blend subsequent biomes
  const top = isFirst ? 0 : Math.max(0, baseTop - blendHeight);

  // We extend the rendering ending position down by blendHeight for all biomes except the last one.
  const bottom = isLast ? undefined : baseTop + baseHeight + blendHeight;
  const height = isLast ? undefined : Math.max(140, (bottom ?? 0) - top);

  // Build a long vertical alpha gradient mask to support seamless cross-fading
  let maskGradient = 'none';
  if (idx > 0 && idx < modulesCount - 1) {
    maskGradient = `linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,1) ${blendHeight}px, rgba(0,0,0,1) calc(100% - ${blendHeight}px), rgba(0,0,0,0) 100%)`;
  } else if (idx > 0) {
    // Last biome: only fades in at top, remains solid at bottom
    maskGradient = `linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,1) ${blendHeight}px)`;
  } else if (idx < modulesCount - 1) {
    // First biome: remains solid at top, fades out at bottom
    maskGradient = `linear-gradient(to bottom, rgba(0,0,0,1) calc(100% - ${blendHeight}px), rgba(0,0,0,0) 100%)`;
  }

  return (
    <div
      className="absolute left-0 right-0 overflow-hidden pointer-events-none"
      style={{
        top: `${top}px`,
        ...(isLast ? { bottom: 0 } : { height: `${height}px` }),
        maskImage: maskGradient,
        WebkitMaskImage: maskGradient,
        contain: 'paint'
      }}
    >
          {/* Background Image itself, scrolling with the camera */}
          <img
            src={img}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-top opacity-95 pointer-events-none select-none"
            decoding="async"
            loading="eager"
            style={{ transform: 'translateZ(0)' }}
          />

          {/* Ambient Living-World Weather Layer Overlay */}
          {(() => {
            switch (idx % 5) {
              case 0: // Space/Cosmic (Twinkling space sparkles and shooting stars)
                return (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Space Sparkles */}
                    {Array.from({ length: 15 }).map((_, i) => {
                      const top = (i * 7 + 13) % 100;
                      const left = (i * 13 + 17) % 100;
                      const size = ((i * 3 + 5) % 3) + 1.5;
                      const duration = ((i * 7) % 3) + 2;
                      const delay = (i * 1.5) % 5;
                      return (
                        <motion.div
                          key={`space-sparkle-${i}`}
                          className="absolute rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                          style={{
                            top: `${top}%`,
                            left: `${left}%`,
                            width: `${size}px`,
                            height: `${size}px`,
                          }}
                          animate={{
                            opacity: [0.15, 0.95, 0.15],
                            scale: [0.85, 1.25, 0.85],
                          }}
                          transition={{
                            duration,
                            repeat: Infinity,
                            delay,
                            ease: "easeInOut"
                          }}
                        />
                      );
                    })}
                    {/* Shooting Stars */}
                    {Array.from({ length: 3 }).map((_, i) => {
                      const delay = i * 4.5 + 1;
                      const top = (i * 25 + 15) % 40;
                      const left = (i * 20 - 5) % 20;
                      return (
                        <motion.div
                          key={`shooting-star-${i}`}
                          className="absolute w-[80px] h-[1px] bg-gradient-to-r from-white to-transparent"
                          style={{
                            top: `${top}%`,
                            left: `${left}%`,
                            transform: 'rotate(-35deg)',
                          }}
                          animate={{
                            x: [0, 500],
                            y: [0, 350],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatDelay: 7 + i * 3,
                            delay,
                            ease: "easeOut"
                          }}
                        />
                      );
                    })}
                  </div>
                );
              case 1: // AI/Cyber Jungle (Floating glowing neon nodes and rising code bits)
                const binaryChars = ['0', '1', '{', '}', '[', ']', '+', '=', 'AI', 'cpu'];
                return (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Digital pulses / binary characters rising */}
                    {Array.from({ length: 12 }).map((_, i) => {
                      const char = binaryChars[i % binaryChars.length];
                      const left = (i * 8 + 9) % 100;
                      const fontSize = ((i * 3) % 6) + 10;
                      const duration = ((i * 5) % 6) + 7;
                      const delay = -((i * 1.8) % 5);
                      return (
                        <motion.div
                          key={`ai-bit-${i}`}
                          className="absolute font-mono text-[#34d399] select-none opacity-20 font-bold"
                          style={{
                            left: `${left}%`,
                            bottom: `-20px`,
                            fontSize: `${fontSize}px`,
                          }}
                          animate={{
                            y: ['0px', '-550px'],
                            opacity: [0, 0.35, 0.35, 0],
                            x: [0, Math.sin(i) * 35, 0],
                          }}
                          transition={{
                            duration,
                            repeat: Infinity,
                            delay,
                            ease: "linear"
                          }}
                        >
                          {char}
                        </motion.div>
                      );
                    })}
                    {/* Digital cyber nodes pulsing */}
                    {Array.from({ length: 10 }).map((_, i) => {
                      const top = (i * 9 + 11) % 100;
                      const left = (i * 11 + 13) % 100;
                      const size = ((i * 3) % 4) + 2.5;
                      return (
                        <motion.div
                          key={`ai-node-${i}`}
                          className="absolute rounded-full bg-[#10b981]"
                          style={{
                            top: `${top}%`,
                            left: `${left}%`,
                            width: `${size}px`,
                            height: `${size}px`,
                            boxShadow: '0 0 10px rgba(16, 185, 129, 0.6)'
                          }}
                          animate={{
                            opacity: [0.15, 0.55, 0.15],
                            scale: [1, 1.35, 1],
                          }}
                          transition={{
                            duration: ((i * 2) % 4) + 3,
                            repeat: Infinity,
                            delay: (i * 0.7) % 3,
                            ease: "easeInOut"
                          }}
                        />
                      );
                    })}
                  </div>
                );
              case 2: // Glacier/Ethics (Drifting snow particles)
                return (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Gentle Snowflakes drifting down */}
                    {Array.from({ length: 22 }).map((_, i) => {
                      const left = (i * 4.7 + 3) % 100;
                      const size = ((i * 2) % 4) + 2;
                      const duration = ((i * 3) % 5) + 6;
                      const delay = -((i * 1.5) % 10);
                      return (
                        <motion.div
                          key={`snow-flake-${i}`}
                          className="absolute rounded-full bg-white opacity-40"
                          style={{
                            left: `${left}%`,
                            top: `-20px`,
                            width: `${size}px`,
                            height: `${size}px`,
                            filter: 'blur(0.5px)'
                          }}
                          animate={{
                            y: ['0px', '550px'],
                            x: [0, Math.cos(i) * 20, Math.cos(i) * -20],
                            rotate: [0, 360],
                            opacity: [0, 0.65, 0.65, 0],
                          }}
                          transition={{
                            duration,
                            repeat: Infinity,
                            delay,
                            ease: "linear"
                          }}
                        />
                      );
                    })}
                  </div>
                );
              case 3: // Nature/Bioluminescent (Golden glowing fireflies)
                return (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Golden Glowing Fireflies drifting lazily in waves */}
                    {Array.from({ length: 15 }).map((_, i) => {
                      const top = (i * 7 + 19) % 100;
                      const left = (i * 11 + 7) % 100;
                      const size = ((i * 2) % 3) + 2.5;
                      const duration = ((i * 2) % 4) + 5;
                      const delay = -((i * 1.2) % 5);
                      return (
                        <motion.div
                          key={`firefly-${i}`}
                          className="absolute rounded-full bg-[#fbbf24] shadow-[0_0_12px_#ea580c]"
                          style={{
                            top: `${top}%`,
                            left: `${left}%`,
                            width: `${size}px`,
                            height: `${size}px`,
                          }}
                          animate={{
                            opacity: [0.1, 0.85, 0.1],
                            scale: [0.8, 1.35, 0.8],
                            x: [0, Math.sin(i) * 35, Math.cos(i) * 20, 0],
                            y: [0, Math.cos(i) * 35, Math.sin(i) * 25, 0],
                          }}
                          transition={{
                            duration,
                            repeat: Infinity,
                            delay,
                            ease: "easeInOut"
                          }}
                        />
                      );
                    })}
                  </div>
                );
              default: // Mountain Peak (Drifting wisps of horizontal wind gusts/mist)
                return (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Horizontal Wind Gust lines */}
                    {Array.from({ length: 5 }).map((_, i) => {
                      const top = 15 + i * 18 + ((i * 7) % 10);
                      const duration = ((i * 3) % 5) + 10;
                      const delay = -((i * 2.3) % 8);
                      return (
                        <motion.div
                          key={`wind-gust-${i}`}
                          className="absolute h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          style={{
                            top: `${top}%`,
                            left: `-300px`,
                            width: '350px',
                          }}
                          animate={{
                            x: ['0px', '1100px'],
                            opacity: [0, 0.45, 0.45, 0],
                          }}
                          transition={{
                            duration,
                            repeat: Infinity,
                            delay,
                            ease: "easeInOut"
                          }}
                        />
                      );
                    })}
                  </div>
                );
            }
          })()}
    </div>
  );
});

interface LazyTransitionOverlayProps {
  idx: number;
  layout: { top: number; height: number };
}

const LazyTransitionOverlay = memo(function LazyTransitionOverlay({
  idx,
  layout,
}: LazyTransitionOverlayProps) {
  const [isNearViewport, setIsNearViewport] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const transitionHeight = 400;
  // Positioned centered at the boundary of this unit (top of unit idx)
  const transitionTop = layout.top - transitionHeight / 2;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsNearViewport(entry.isIntersecting);
        });
      },
      {
        rootMargin: '600px 0px 600px 0px', // Loads content 600px before scrolling into viewport
      }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute left-0 right-0 flex flex-col justify-center items-center pointer-events-none"
      style={{
        top: `${transitionTop}px`,
        height: `${transitionHeight}px`,
        zIndex: 2, // Sits above the background images but under the content (which is z-10 / z-20)
        contentVisibility: 'auto',
        containIntrinsicSize: `100% ${transitionHeight}px`
      }}
    >
      {isNearViewport ? (
        <>
          {/* 1. Atmospheric Fog Gradient */}
          <div 
            className="absolute inset-0 bg-gradient-to-b from-transparent via-white/70 to-transparent blur-md mix-blend-overlay"
            style={{ opacity: 0.95 }}
          />
          <div 
            className="absolute inset-0 bg-gradient-to-b from-transparent via-sky-100/55 to-transparent blur-xl"
            style={{ opacity: 0.8 }}
          />

          {/* 2. Soft Volumetric Clouds drifting slowly */}
          <div className="absolute inset-x-0 h-full overflow-hidden flex flex-col justify-around opacity-60">
            {/* Cloud layer 1 */}
            <motion.div
              className="w-[200%] h-24 bg-gradient-to-r from-transparent via-white/80 to-transparent blur-2xl will-change-transform"
              animate={{ x: ['-50%', '0%'] }}
              transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
              style={{ transform: 'translateY(-15px) translateZ(0)' }}
            />
            {/* Cloud layer 2 */}
            <motion.div
              className="w-[250%] h-32 bg-gradient-to-r from-transparent via-sky-50/70 to-transparent blur-3xl will-change-transform"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 48, repeat: Infinity, ease: "linear" }}
              style={{ transform: 'translateY(15px) translateZ(0)' }}
            />
            {/* Cloud layer 3 - soft wispy mist */}
            <motion.div
              className="w-[300%] h-16 bg-gradient-to-r from-transparent via-white/90 to-transparent blur-xl will-change-transform"
              animate={{ x: ['-33%', '0%'] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              style={{ transform: 'translateZ(0)' }}
            />
          </div>

          {/* 3. Soft Ambient Light Rays */}
          <div className="absolute inset-0 flex justify-center overflow-hidden">
            <div className="w-[120%] h-full bg-radial-gradient from-white/20 to-transparent transform rotate-12 blur-2xl opacity-40 scale-x-150" />
            <div className="w-[80%] h-[150%] bg-gradient-to-tr from-transparent via-sky-200/15 to-transparent transform -rotate-45 blur-3xl opacity-30" />
          </div>

          {/* 4. Ambient Floating Mist / Particles */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 8 }).map((_, pIdx) => {
              const size = 3 + (pIdx % 3) * 2.5;
              const duration = 12 + (pIdx % 4) * 5;
              const delay = -(pIdx * 1.5);
              const startX = 10 + (pIdx * 12) % 80;
              return (
                <motion.div
                  key={`mist-part-${idx}-${pIdx}`}
                  className="absolute rounded-full bg-white/45 blur-[1.5px]"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    left: `${startX}%`,
                    top: `${20 + (pIdx * 10) % 60}%`,
                  }}
                  animate={{
                    y: [-15, 15, -15],
                    x: [-10, 10, -10],
                    opacity: [0.1, 0.55, 0.1],
                    scale: [0.8, 1.25, 0.8]
                  }}
                  transition={{
                    duration,
                    repeat: Infinity,
                    delay,
                    ease: "easeInOut"
                  }}
                />
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
});

function LearningPath({ 
  modules, 
  onLessonSelect, 
  completedLessons, 
  bookmarkedLessons,
  onToggleBookmark,
  currentLessonId, 
  charging,
  lastRechargeQuestDate
}: LearningPathProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<FilterType>('All');
  const [isMobile, setIsMobile] = useState(false);
  const [puzzlePacks, setPuzzlePacks] = useState<PuzzlePack[]>([]);

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

  // Determine current active level idx for preloading and memory-release
  const activeLevelIdx = useMemo(() => {
    const idx = modules.findIndex(m => !m.lessons.every(l => completedLessons.includes(l.id)));
    return idx === -1 ? modules.length - 1 : idx;
  }, [modules, completedLessons]);

  // Smart preloading: prefetch next biomes silently when idle
  useEffect(() => {
    preloadNextBiomes();
  }, []);

  const filteredModules = useMemo(() => {
    if (selectedDifficulty === 'All') return modules;
    
    return modules
      .map(module => ({
        ...module,
        lessons: module.lessons.filter(lesson => 
          selectedDifficulty === 'Bookmarks' 
            ? bookmarkedLessons.includes(lesson.id)
            : lesson.difficulty === selectedDifficulty
        )
      }))
      .filter(module => module.lessons.length > 0);
  }, [modules, selectedDifficulty, bookmarkedLessons]);

  const containerRef = useRef<HTMLDivElement>(null);
  const cachedOffsetsRef = useRef<{ index: number; top: number; height: number }[] | null>(null);
  
  // Deterministic estimated initial layout so biomes render immediately on frame 1 without flashing
  const [unitLayouts, setUnitLayouts] = useState<Array<{ index: number; top: number; height: number }>>(() => {
    let accTop = 60;
    const verticalGap = isMobile ? 73 : 93;
    return filteredModules.map((m, mIdx) => {
      const startOffset = mIdx === 0 ? 55 : 70;
      const numLessons = m.lessons?.length || 0;
      const windingH = numLessons > 0 ? (startOffset + (numLessons - 1) * verticalGap + 110) : 110;
      const cardH = mIdx === 0 ? 150 : 200;
      const totalH = cardH + windingH;
      const top = accTop;
      accTop += totalH;
      return { index: mIdx, top, height: totalH };
    });
  });

  useEffect(() => {
    const measureLayouts = () => {
      if (!containerRef.current) return;
      const parentRect = containerRef.current.getBoundingClientRect();
      const parentAbsoluteTop = parentRect.top + (window.scrollY || document.documentElement.scrollTop);

      const elements = document.querySelectorAll('[data-module-index]');
      if (elements.length === 0) return;

      const offsets: { index: number; top: number; height: number }[] = [];
      const layouts: { index: number; top: number; height: number }[] = [];

      elements.forEach((child) => {
        const hEl = child as HTMLElement;
        const rect = hEl.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const absoluteTop = rect.top + scrollTop;
        
        offsets.push({
          index: parseInt(hEl.getAttribute('data-module-index') || '0', 10),
          top: absoluteTop,
          height: hEl.offsetHeight,
        });

        layouts.push({
          index: parseInt(hEl.getAttribute('data-module-index') || '0', 10),
          top: absoluteTop - parentAbsoluteTop,
          height: hEl.offsetHeight,
        });
      });

      offsets.sort((a, b) => a.index - b.index);
      layouts.sort((a, b) => a.index - b.index);

      cachedOffsetsRef.current = offsets;

      setUnitLayouts(prev => {
        if (prev.length === layouts.length && prev.every((val, idx) => Math.abs(val.top - layouts[idx].top) < 2 && Math.abs(val.height - layouts[idx].height) < 2)) {
          return prev;
        }
        return layouts;
      });
    };

    measureLayouts();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        measureLayouts();
      });
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', measureLayouts, { passive: true });
    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', measureLayouts);
    };
  }, [filteredModules]);

  // Create a flat list of all lessons to determine global locking
  const allLessons = useMemo(() => {
    return modules.flatMap(m => m?.lessons || []).filter(Boolean);
  }, [modules]);

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-5 w-full relative">
      {/* SEAMLESS VERTICAL SCROLLING BIOME SYSTEM */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-3xl">
        {filteredModules.map((m, idx) => {
          const layout = unitLayouts[idx] || { index: idx, top: idx === 0 ? 0 : 600 * idx, height: 600 };
          return (
            <LazyBiomeBackground 
              key={`biome-bg-${idx}`}
              idx={idx}
              layout={layout}
              modulesCount={filteredModules.length}
            />
          );
        })}

        {/* Transition overlays between units */}
        {unitLayouts.map((layout, idx) => {
          if (idx === 0) return null;
          return (
            <LazyTransitionOverlay
              key={`transition-overlay-${idx}`}
              idx={idx}
              layout={layout}
            />
          );
        })}
      </div>

      {/* Header with Filter */}
      <div className="w-full bg-white/80 backdrop-blur-md px-2 py-3.5 flex flex-col gap-3 rounded-2xl border border-white/50 shadow-sm relative z-20">

        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center gap-3 bg-gray-50/50 p-1 rounded-2xl border border-gray-100">
            <div className="pl-3 py-2 text-gray-400">
              <Filter size={14} className="opacity-50" />
            </div>
            {(['All', 'Easy', 'Medium', 'Hard', 'Bookmarks'] as const).map((diff) => {
              const bgColors = {
                All: 'bg-chikoo-blue-500 text-white',
                Easy: 'bg-duo-green text-white',
                Medium: 'bg-yellow-500 text-white',
                Hard: 'bg-red-500 text-white',
                Bookmarks: 'bg-pink-500 text-white'
              };
              
              const isActive = selectedDifficulty === diff;

              return (
                <motion.button
                  key={diff}
                  onClick={() => {
                    setSelectedDifficulty(diff);
                    soundManager.play('click');
                  }}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-1 py-1.5 rounded-xl font-display font-black text-[10px] uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1 ${
                    isActive
                      ? `${bgColors[diff]} shadow-lg shadow-black/10`
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {diff === 'Bookmarks' && <Bookmark size={10} className={isActive ? 'fill-current' : ''} />}
                  {diff}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {filteredModules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="relative mb-6">
            <Filter className="w-16 h-16 opacity-10" />
            <X className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-300" />
          </div>
          <p className="font-display font-black text-lg text-gray-500">
            {selectedDifficulty === 'Bookmarks' ? "No bookmarked lessons yet" : `No ${selectedDifficulty.toLowerCase()} lessons here`}
          </p>
          <p className="text-xs font-medium mt-1">
            {selectedDifficulty === 'Bookmarks' ? "Bookmark lessons to find them later" : "Try switching back to 'All'"}
          </p>
          <button 
            onClick={() => setSelectedDifficulty('All')}
            className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-display font-black text-xs uppercase tracking-widest transition-colors"
          >
            Clear Filter
          </button>
        </div>
      ) : (
        filteredModules.map((module, mIdx) => {
          // A module is locked if its first lesson is locked
          const firstLesson = module.lessons[0];
          const globalIdx = allLessons.findIndex(al => al && al.id === firstLesson?.id);
          const isModuleLocked = globalIdx > 0 && allLessons[globalIdx - 1] && !completedLessons.includes(allLessons[globalIdx - 1]?.id || '');

          return (
            <div key={`lp-mod-${module.id || 'mod'}-${mIdx}`} className="w-full flex flex-col items-center">
              {/* Subtle atmospheric chapter transition separator */}
              {mIdx > 0 && (
                <div 
                  id={`unit-transition-separator-${mIdx}`}
                  className="w-full max-w-[700px] flex flex-col items-center justify-center my-4 relative overflow-visible px-4"
                >
                  {/* Ambient light glow behind the separator */}
                  <div className="absolute w-[280px] h-[80px] bg-gradient-to-r from-sky-400/10 via-indigo-500/15 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  {/* Subtle gradient divider line */}
                  <div className="w-full flex items-center justify-center gap-4 relative z-10">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-300/40 to-indigo-400/50" />
                    
                    {/* Decorative center glowing orb/badge */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: "-100px" }}
                      className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-indigo-100/50 shadow-[0_12px_30px_rgba(15,23,42,0.12),_0_4px_12px_rgba(99,102,241,0.08)] relative overflow-hidden group"
                    >
                      {/* Shine highlight */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                      
                      {/* Soft glowing particle */}
                      <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 animate-pulse" />
                      
                      <span className="font-display font-black text-[10px] uppercase tracking-[0.2em] text-slate-500/80">
                        Chapter Transition
                      </span>
                      
                      <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 animate-pulse" />
                    </motion.div>
                    
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-slate-300/40 to-indigo-400/50" />
                  </div>

                  {/* Elegant subtle descriptive label below line */}
                  <motion.p 
                    initial={{ opacity: 0, y: 4 }}
                    whileInView={{ opacity: 0.7, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: 0.1 }}
                    className="text-[11px] font-medium text-slate-400 mt-2 tracking-wide text-center"
                  >
                    Ascending to Chapter {mIdx + 1}: {module.title}
                  </motion.p>
                </div>
              )}

              <div 
                data-module-index={mIdx}
                className="w-full max-w-[700px] px-4 transition-all duration-500 relative z-10 opacity-100"
              >
              {/* Module Header - Redesigned premium, minimal Unit Card */}
              <motion.div 
                whileHover={{
                  y: -2,
                  transition: { duration: 0.2, ease: "easeOut" }
                }}
                style={{
                  background: mIdx === 3
                    ? 'linear-gradient(135deg, rgba(251, 207, 232, 0.96), rgba(244, 114, 182, 0.88))'
                    : (mIdx === 1 || mIdx === 4)
                      ? 'linear-gradient(135deg, rgba(254, 243, 199, 0.96), rgba(251, 191, 36, 0.88))' 
                      : 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: mIdx === 3 
                    ? '1px solid rgba(244, 114, 182, 0.7)'
                    : (mIdx === 1 || mIdx === 4)
                      ? '1px solid rgba(252, 211, 77, 0.7)' 
                      : '1px solid rgba(255, 255, 255, 0.45)',
                  borderRadius: '18px',
                  boxShadow: mIdx === 3
                    ? 'inset 0 1.5px 3px rgba(255, 255, 255, 0.9), 0 10px 24px rgba(219, 39, 119, 0.18)'
                    : (mIdx === 1 || mIdx === 4)
                      ? 'inset 0 1.5px 3px rgba(255, 255, 255, 0.9), 0 10px 24px rgba(245, 158, 11, 0.18)' 
                      : '0 10px 24px rgba(15, 23, 42, 0.08)'
                }}
                className={`w-full p-5 relative overflow-hidden transition-all duration-500 group ${mIdx === 0 ? 'mb-6 mt-2' : 'mb-8'} flex flex-row items-center justify-start text-left`}
              >
                {/* Left Side Image */}
                <img 
                  src={getUnitChikooImage(mIdx, module)}
                  alt="Unit Character"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://i.postimg.cc/8C36gk1q/e4eafdae-c092-4272-8f8a-6b03d9b903dc.webp'; }}
                  className="h-28 sm:h-34 w-auto object-contain pointer-events-none flex-shrink-0 mr-4 -my-3"
                  referrerPolicy="no-referrer"
                  decoding="async"
                  loading="lazy"
                />

                {/* Content Container */}
                <div className="flex-1 min-w-0 flex flex-col items-start justify-center select-none text-left">
                  {/* Title */}
                  <h2 
                    style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: mIdx === 3 ? '#831843' : (mIdx === 1 || mIdx === 4) ? '#78350f' : '#1D2939'
                    }}
                    className="leading-none tracking-tight mb-2 truncate font-sans text-left"
                  >
                    {module.title}
                  </h2>

                  {/* Description */}
                  <p 
                    style={{
                      fontSize: '14px',
                      color: mIdx === 3 ? '#9d174d' : (mIdx === 1 || mIdx === 4) ? '#92400e' : '#667085'
                    }}
                    className="line-clamp-2 leading-snug font-medium text-left"
                  >
                    {getModuleDescription(module.title, mIdx)}
                  </p>
                </div>
              </motion.div>

              {/* Curved Gamified Winding Path */}
              <ModuleWindingSection
                module={module}
                mIdx={mIdx}
                completedLessons={completedLessons}
                currentLessonId={currentLessonId}
                allLessons={allLessons}
                bookmarkedLessons={bookmarkedLessons}
                selectedDifficulty={selectedDifficulty}
                isMobile={isMobile}
                puzzlePacks={puzzlePacks}
                onLessonSelect={onLessonSelect}
              />
            </div>
          </div>
          );
        })
      )}
    </div>
  );
}

export default memo(LearningPath);
