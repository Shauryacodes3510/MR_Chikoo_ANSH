import { useState, useMemo, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Module, Lesson } from '../lib/content';
import { soundManager } from '../lib/sounds';
import { getPuzzlePacksAsync, getPuzzlePacks, PuzzlePack } from '../lib/practiceStoreNew';
import ChestIcon from './ui/ChestIcon';
import FrozenLockedNode from './FrozenLockedNode';
import EnvironmentalLockedCard from './EnvironmentalLockedCard';
import EnvironmentLessonNode from './EnvironmentLessonNode';
import { Bookmark, Lock, Check, Sparkles, Trophy, ArrowLeft, ChevronRight, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { getBiomeImage, getUnitChikooImage } from '../lib/biomeImages';

const bgImage = 'https://i.postimg.cc/brjPWjG3/bg1.webp';
const introBg = '/intro_bg.webp';

interface UnitLearningPathProps {
  module: Module;
  onClose: () => void;
  onLessonSelect: (lessonId: string) => void;
  completedLessons: string[];
  bookmarkedLessons: string[];
  currentLessonId?: string;
  streak?: number;
  gems?: number;
  modules: Module[];
}

function AmbientAIEffects() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Soft gradient lighting blurs */}
      <div className="glow-spot-blue top-[8%] left-[-20px]" />
      <div className="glow-spot-gold top-[25%] right-[-30px]" />
      <div className="glow-spot-blue top-[55%] left-[10%]" />
      <div className="glow-spot-gold bottom-[15%] right-[5%]" />
      
      {/* Floating particles */}
      <div className="absolute top-[6%] left-[10%] w-1.5 h-1.5 bg-sky-400/40 rounded-full blur-xs animate-pulse" style={{ animationDuration: '3.2s' }} />
      <div className="absolute top-[18%] right-[15%] w-1 h-1 bg-amber-400/30 rounded-full blur-xs animate-pulse" style={{ animationDuration: '4.8s' }} />
      <div className="absolute top-[38%] left-[20%] w-2 h-2 bg-indigo-400/30 rounded-full blur-xs animate-pulse" style={{ animationDuration: '5.2s' }} />
      <div className="absolute top-[52%] right-[10%] w-1.5 h-1.5 bg-sky-400/35 rounded-full blur-xs animate-pulse" style={{ animationDuration: '3.6s' }} />
      <div className="absolute top-[68%] left-[12%] w-1 h-1 bg-amber-400/40 rounded-full blur-xs animate-pulse" style={{ animationDuration: '4.2s' }} />
      <div className="absolute bottom-[10%] right-[18%] w-2.5 h-2.5 bg-indigo-400/25 rounded-full blur-xs animate-pulse" style={{ animationDuration: '6.4s' }} />
    </div>
  );
}

function getLessonIconEmoji(moduleIdx: number, title: string): string {
  const t = title.toLowerCase();
  if (t.includes('intro') || t.includes('welcome')) return '👋';
  if (t.includes('notic') || t.includes('see')) return '👁️';
  if (t.includes('ai') || t.includes('prompt') || t.includes('llm')) return '🤖';
  if (t.includes('data') || t.includes('chart') || t.includes('visual')) return '📊';
  if (t.includes('code') || t.includes('program') || t.includes('javascript') || t.includes('python')) return '⚡';
  if (t.includes('image') || t.includes('art') || t.includes('generation')) return '🎨';
  if (t.includes('future') || t.includes('trend')) return '🚀';
  if (t.includes('history') || t.includes('past')) return '📚';
  
  const emojis = ['🌱', '❄️', '🔥', '🚀', '⚡', '🤖', '🎨', '🧩', '💎'];
  return emojis[(moduleIdx + title.length) % emojis.length];
}

function UnitLearningPath({
  module,
  onClose,
  onLessonSelect,
  completedLessons,
  bookmarkedLessons,
  currentLessonId,
  streak = 12,
  gems = 450,
  modules
}: UnitLearningPathProps) {
  const [shakeNodeIndex, setShakeNodeIndex] = useState<number | null>(null);
  const [isDossierCollapsed, setIsDossierCollapsed] = useState(false);
  const [puzzlePacks, setPuzzlePacks] = useState<PuzzlePack[]>([]);
  const mascotRotation = 0;

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

  const translateClasses = [
    'translate-x-0',
    'translate-x-4',
    'translate-x-8',
    'translate-x-4',
    'translate-x-0',
    '-translate-x-4',
    '-translate-x-8',
    '-translate-x-4',
  ];

  // Set scroll style on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [module]);

  const activeModuleNextLesson = useMemo(() => {
    return module.lessons.find(lesson => {
      const isCompleted = completedLessons.includes(lesson.id);
      const allLessons = modules.flatMap(m => m.lessons);
      const globalIdx = allLessons.findIndex(al => al.id === lesson.id);
      const isLocked = !isCompleted && globalIdx > 0 && !completedLessons.includes(allLessons[globalIdx - 1].id);
      return !isCompleted && !isLocked;
    });
  }, [module, completedLessons, modules]);

  const mIdx = useMemo(() => {
    return modules.findIndex(m => m.id === module.id);
  }, [modules, module]);
  const mIndex = mIdx !== -1 ? mIdx : 0;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  
  const START_OFFSET = 90;
  const VERTICAL_GAP = isMobile ? 73 : 93;

  const sortedLessons = useMemo(() => {
    return [...(module.lessons || [])].sort((a, b) => {
      if (a.order_index !== undefined && b.order_index !== undefined && a.order_index !== b.order_index) {
        return a.order_index - b.order_index;
      }
      return (a.id || '').localeCompare(b.id || '', undefined, { numeric: true });
    });
  }, [module.lessons]);

  const { lessonYCoords, containerHeight } = useMemo(() => {
    const numLessons = sortedLessons.length;
    const yCoords: number[] = [];
    
    let currentY = START_OFFSET;
    yCoords.push(currentY);
    for (let i = 1; i < numLessons; i++) {
      currentY += VERTICAL_GAP;
      yCoords.push(currentY);
    }
    
    const height = numLessons > 0 ? yCoords[numLessons - 1] + 130 : 160;
    return { lessonYCoords: yCoords, containerHeight: height };
  }, [sortedLessons, isMobile, VERTICAL_GAP]);

  const lessonXCoords = useMemo(() => {
    return sortedLessons.map((_, idx) => {
      // Elegant, smooth Duolingo-inspired curving path with smooth left-center-right rhythm
      const angle = (idx * Math.PI) / 2;
      return 160 + 55 * Math.sin(angle);
    });
  }, [sortedLessons]);

  const pathD = useMemo(() => {
    let d = "";
    if (sortedLessons.length > 0) {
      const startX = lessonXCoords[0] ?? 160;
      d = `M ${startX} ${START_OFFSET}`;
      for (let i = 0; i < sortedLessons.length - 1; i++) {
        const x0 = lessonXCoords[i];
        const y0 = lessonYCoords[i];
        const x1 = lessonXCoords[i + 1];
        const y1 = lessonYCoords[i + 1];
        
        const currentGap = y1 - y0;
        const halfGapI = currentGap / 2;
        
        d += ` C ${x0} ${y0 + halfGapI}, ${x1} ${y1 - halfGapI}, ${x1} ${y1}`;
      }
    }
    return d;
  }, [sortedLessons, lessonYCoords, lessonXCoords]);

  return (
    <motion.div 
       id="unit-learning-path-root"
       initial={{ opacity: 0, y: 15 }}
       animate={{ opacity: 1, y: 0 }}
       exit={{ opacity: 0, y: 15 }}
       transition={{ duration: 0.35, ease: 'easeOut' }}
       className="w-full h-full relative overflow-hidden bg-slate-50 text-slate-800 font-sans flex flex-col isolate"
    >
      <AmbientAIEffects />

      {/* Scrollable container for all unit path content */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide relative z-10 w-full"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="relative min-h-full w-full pb-32 isolate">
          {/* Background covering the entire unit path scroll height */}
          <div className="absolute inset-0 w-full h-full min-h-full pointer-events-none z-0 overflow-hidden opacity-85">
            <img
              src={module.title.includes('Noticer') || module.id === 'm1' ? introBg : (modules && modules.length > 0 ? getBiomeImage(Math.max(0, modules.findIndex(m => m.id === module.id))) : bgImage)}
              alt="Unit Biome Background"
              className="absolute inset-0 w-full h-full min-h-full object-cover object-top pointer-events-none select-none"
              decoding="async"
              loading="eager"
              onError={(e) => {
                if (e.currentTarget.src !== bgImage) {
                  e.currentTarget.src = bgImage;
                }
              }}
            />
          </div>

      {/* Floating High-End Glass Header Panel */}
      <div className="w-full max-w-3xl mx-auto px-4 pt-6 relative z-50">
        <header id="unit-header" className="bg-[#FCFCFC] border-t border-white shadow-[0_6px_18px_rgba(0,0,0,0.06)] border-b border-slate-200/40 rounded-[20px] px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              id="unit-back-btn"
              onClick={() => {
                soundManager.play('click');
                onClose();
              }}
              className="w-10 h-10 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-slate-800 shadow-sm border border-slate-200 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft size={18} className="stroke-[2.5px]" />
            </button>
            <img 
              src={getUnitChikooImage(mIndex, module)}
              alt={`Unit ${mIndex + 1} Chikoo Mascot`}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/heading_aibo.webp'; }}
              className="h-10 w-auto object-contain pointer-events-none shrink-0 drop-shadow-2xs"
            />
            <div className="flex flex-col items-start select-none min-w-0 pr-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-[#0ea5e9]">
                {module.difficulty} Chapter
              </span>
              <h1 className="font-display text-slate-800 text-sm font-black tracking-tight leading-none mt-0.5 max-w-[220px] truncate">
                {module.title}
              </h1>
            </div>
          </div>

          <div className="text-slate-800 font-extrabold bg-slate-50 border border-slate-100/60 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs font-display">
            <span className="flex items-center gap-1">
              <img src="/streak.webp" alt="Streak" className="w-4 h-4 object-contain inline-block" />
              <span>{streak}</span>
            </span> 
            <span className="text-slate-200 mx-0.5">|</span> 
            <span>⚡ {gems}</span>
          </div>
        </header>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-5 space-y-6 sm:space-y-8 relative z-10">
        
        {/* Unit Dossier Info Banner - Storybook guidebook page aesthetic */}
        <section id="unit-dossier" className="relative overflow-hidden rounded-[24px] bg-[#FCFCFC] border-t border-white p-4 sm:p-5 shadow-[0_6px_18px_rgba(0,0,0,0.08)] border-b border-slate-200/40 space-y-3 sm:space-y-4">
          <div 
            onClick={() => {
              soundManager.play('click');
              setIsDossierCollapsed(!isDossierCollapsed);
            }}
            className="relative z-10 flex items-start justify-between gap-4 cursor-pointer select-none group"
          >
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-[#0369a1]">CHAPTER STATS</span>
                <span className="text-[9px] text-slate-400 font-bold group-hover:text-slate-600 transition-colors ml-1">
                  ({isDossierCollapsed ? 'click to expand' : 'click to collapse'})
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-800 leading-none flex items-center gap-2 font-display">
                {module.id === 'm1' || module.title.includes('Noticer') ? (
                  <>Level 1: <span className="shimmer-text-ai font-extrabold pr-1">The Noticer</span></>
                ) : module.title} 🎓
                {isDossierCollapsed ? <ChevronDown size={18} className="text-slate-400 inline" /> : <ChevronUp size={18} className="text-slate-400 inline" />}
              </h2>
            </div>
          </div>
          
          <AnimatePresence initial={false}>
            {!isDossierCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden space-y-3 sm:space-y-4"
              >
                <div className="relative z-10">
                  <p className="text-slate-500 font-medium text-xs leading-normal">
                    Finish lessons and learn new topics to complete this chapter!
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <div className="bg-white border-t border-slate-100 p-4 rounded-[16px] flex flex-col gap-0.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-b border-slate-200/20 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-300">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Lessons</span>
                      <span className="text-xs">📚</span>
                    </div>
                    <span className="text-base font-black text-slate-800 leading-none">
                      {module.lessons.length} Lessons
                    </span>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">Fun lessons</p>
                  </div>
                  
                  <div className="bg-white border-t border-slate-100 p-4 rounded-[16px] flex flex-col gap-0.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-b border-slate-200/20 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-300">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Value</span>
                      <span className="text-xs">⭐</span>
                    </div>
                    <span className="text-base font-black text-slate-800 leading-none font-display">
                      {module.lessons.reduce((total, les) => total + les.xpReward, 0)} Cookies
                    </span>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">Bonus Points</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Course Journey Map - Extracted fully to be full width mobile-style with no nested bounding box card */}
        <section id="unit-journey-landscape" className="pb-8 overflow-visible relative">
          <div className="text-center py-2 relative z-10">
            <h3 className="text-slate-400/90 font-display font-black text-[9.5px] uppercase tracking-widest leading-none">
              ✦ YOUR JOURNEY CHART ✦
            </h3>
          </div>
          
          <div className="relative journey-path overflow-visible flex justify-center" style={{ minHeight: `${containerHeight + 6}px` }}>
            
            {/* Winding Adventure SVG Line - Dynamic and perfectly sized */}
            <svg 
              className="winding-path-svg w-[320px] absolute left-1/2 -translate-x-1/2 overflow-visible pointer-events-none" 
              style={{ height: `${containerHeight}px`, zIndex: 0, top: '6px' }}
              viewBox={`0 0 320 ${containerHeight}`}
            >
              <defs>
                <linearGradient id="glowing-path-grad-inner-page" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <filter id="glow-filter-inner-page" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <path 
                d={pathD} 
                style={{ strokeDasharray: '6 6', stroke: 'rgba(148, 163, 184, 0.85)', strokeWidth: 2.2, strokeLinecap: 'round', fill: 'none' }}
              />
            </svg>

            {/* Nodes Container */}
            <div className="relative z-10 w-[320px]" style={{ height: `${containerHeight}px`, top: '6px' }}>
              {/* Loop and render lessons dynamically with correct locking and active state */}
              {sortedLessons.map((lesson, idx) => {
                const isLessonCompleted = completedLessons.includes(lesson.id);
                const allLessons = modules.flatMap(m => m.lessons);
                const globalIdx = allLessons.findIndex(al => al.id === lesson.id);
                
                const isLocked = !isLessonCompleted && globalIdx > 0 && !completedLessons.includes(allLessons[globalIdx - 1]?.id || '');
                const isCurrentLesson = lesson.id === currentLessonId || (!completedLessons.includes(lesson.id) && (idx === 0 || completedLessons.includes(sortedLessons[idx - 1]?.id)));

                const x = lessonXCoords[idx];
                const y = lessonYCoords[idx];

                const matchedPack = lesson.isChest ? puzzlePacks.find(p => p.linked_unit_id === module.id || p.linkedUnitId === module.id) : null;
                const customChestUrl = matchedPack?.chest_image_url || matchedPack?.chestImageUrl || matchedPack?.chest_icon_url || matchedPack?.chestIconUrl;

                return (
                  <div 
                    key={lesson.id} 
                    className="absolute"
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: isCurrentLesson ? 30 : 20
                    }}
                  >
                    <div className="relative font-sans">
                      {isCurrentLesson && !isLessonCompleted && (
                        <>
                           {/* Target Marker floating up top if it's the current lesson and not completed */}
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white border-2 border-slate-200 px-3 py-1 rounded-xl shadow-md whitespace-nowrap animate-bounce z-40 text-slate-800">
                            <span className="font-display font-black text-blue-600 uppercase text-[9px] tracking-wider">Start</span>
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r border-b border-slate-200 rotate-45" />
                          </div>

                          <div className="absolute inset-0 bg-sky-200/55 rounded-full node-pulse pointer-events-none scale-125"></div>
                        </>
                      )}

                      <EnvironmentLessonNode
                        biomeIdx={mIndex}
                        state={isLocked ? 'locked' : isLessonCompleted ? 'completed' : 'active'}
                        size="md"
                        isChest={lesson.isChest}
                        isChallenge={lesson.isChallenge}
                        isBonus={lesson.isBonus}
                        isPuzzle={lesson.isPuzzle}
                        isCheckpoint={lesson.isCheckpoint}
                        isStory={lesson.isStory}
                        bookmarked={bookmarkedLessons.includes(lesson.id)}
                        difficulty={lesson.difficulty}
                        chestIconUrl={customChestUrl || (lesson as any).chest_image_url || (lesson as any).chestImageUrl || (lesson as any).chest_icon_url || (lesson as any).chestIconUrl}
                        onClick={() => {
                          console.log(`[UnitLearningPath] Node clicked: ID="${lesson.id}", Title="${lesson.title}", Module="${module.title}" (${module.id}), isLocked=${isLocked}, isCurrent=${isCurrentLesson}`);
                          if (isLocked) {
                            setShakeNodeIndex(idx + 100);
                            setTimeout(() => setShakeNodeIndex(null), 500);
                          } else {
                            soundManager.play('click');
                            onLessonSelect(lesson.id);
                          }
                        }}
                        className={shakeNodeIndex === idx + 100 ? 'animate-shake' : ''}
                      />
                    </div>
                  </div>
                );
              })}



              {/* Destination flag */}
              <div 
                style={{
                  position: 'absolute',
                  left: '160px',
                  top: `${lessonYCoords[module.lessons.length - 1] + 110}px`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 25
                }}
                className="flex flex-col items-center"
              >
                <div className="w-18 h-18 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center border-4 border-white shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
                  <span className="material-symbols-outlined text-white text-3.5xl font-black">flag</span>
                </div>
                <div className="mt-3 text-center bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 rounded-2xl border border-indigo-400 shadow-md whitespace-nowrap">
                  <p className="font-display text-white font-black text-[10px] uppercase tracking-widest">Chapter Complete!</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Floating Companion Chat with start CTA */}
        {(() => {
          if (!activeModuleNextLesson) {
            return (
              <section className="flex items-end gap-3 py-4 max-w-xl mx-auto">
                <div className="w-24 h-24 flex-shrink-0 animate-float">
                  <img 
                    alt="Chikoo Mascot" 
                    className="w-full h-full object-contain drop-shadow-md" 
                    src="https://lh3.googleusercontent.com/aida/AP1WRLu4Y74u7LiIw905r3c09lNfyiOFECewKTKScLuglkcEduCAqBsb5LRwYjK3ACf44v04rnxPaJteIxsnZ844iVXj1RQfuinuqXvZOy_9yajRnCaXHCd3HY2sKXKrwGxgtR2bi8Nw88JQ8AdaqN9-IW4Eytwey-kPypekvBLLSw7sk720O5ApP2vHhwBJfQp_05xk-ZNBqU1D4cMIdqXzu4bGodDr17oZR8cPj-1KbROwJpiSZMqm8XBKW3IT" 
                    style={{ transform: `rotate(${mascotRotation}deg)` }}
                  />
                </div>
                <div className="relative bg-white p-4 rounded-2xl rounded-bl-none shadow-sm border border-emerald-100 flex-grow mb-4">
                  <p className="font-body-md text-slate-800 font-extrabold text-sm">
                    You finished this chapter! 🎉
                  </p>
                  <p className="text-xs text-[#3b6447] mt-1 leading-snug font-medium">
                    Awesome job, friend! You completed every lesson here. Tap the back arrow top to pick another chapter!
                  </p>
                  <div className="absolute -left-2 bottom-0 w-4 h-4 bg-white border-l border-b border-emerald-100 transform rotate-45 -mb-2"></div>
                </div>
              </section>
            );
          }

          return (
            <section className="flex items-end gap-3 py-4 max-w-xl mx-auto">
              <div className="w-24 h-24 flex-shrink-0 animate-float">
                <img 
                  alt="Chikoo Mascot" 
                  className="w-full h-full object-contain drop-shadow-lg" 
                  src="https://lh3.googleusercontent.com/aida/AP1WRLu4Y74u7LiIw905r3c09lNfyiOFECewKTKScLuglkcEduCAqBsb5LRwYjK3ACf44v04rnxPaJteIxsnZ844iVXj1RQfuinuqXvZOy_9yajRnCaXHCd3HY2sKXKrwGxgtR2bi8Nw88JQ8AdaqN9-IW4Eytwey-kPypekvBLLSw7sk720O5ApP2vHhwBJfQp_05xk-ZNBqU1D4cMIdqXzu4bGodDr17oZR8cPj-1KbROwJpiSZMqm8XBKW3IT" 
                  style={{ transform: `rotate(${mascotRotation}deg)` }}
                />
              </div>
              <div 
                onClick={() => {
                  console.log(`[UnitLearningPath] Companion CTA clicked for lesson ID="${activeModuleNextLesson.id}", Title="${activeModuleNextLesson.title}"`);
                  soundManager.play('click');
                  onLessonSelect(activeModuleNextLesson.id);
                }}
                className="relative bg-white cursor-pointer hover:bg-slate-50 p-4 rounded-2xl rounded-bl-none shadow-md border border-emerald-100 flex-grow mb-4 transition-all hover:scale-101 active:scale-99"
              >
                <p className="font-body-md text-slate-800 font-black text-sm leading-tight flex items-center gap-1.5">
                  Next Lesson: {activeModuleNextLesson.title.replace(/^(Module|Lesson)\s+\d+(\.\d+)*:\s*/i, '')} ⚡
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-normal font-medium">
                  {activeModuleNextLesson.description} — Earn +{activeModuleNextLesson.xpReward} Cookies!
                </p>
                <div className="absolute -left-2 bottom-0 w-4 h-4 bg-white border-l border-b border-emerald-200 transform rotate-45 -mb-2"></div>
              </div>
            </section>
          );
        })()}

      </div>
      </div>
      </div>
    </motion.div>
  );
}

export default memo(UnitLearningPath);
