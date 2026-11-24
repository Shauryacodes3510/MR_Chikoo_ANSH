import { motion } from 'framer-motion';
import { Lock, Check, Sparkles } from 'lucide-react';
import { soundManager } from '../lib/sounds';

interface EnvironmentLessonCardProps {
  biomeIdx: number;
  state: 'locked' | 'active' | 'completed';
  title: string;
  lessonLabel: string;
  xpReward?: number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export default function EnvironmentLessonCard({
  biomeIdx,
  state,
  title,
  lessonLabel,
  xpReward = 100,
  className = '',
  style,
  onClick
}: EnvironmentLessonCardProps) {
  const currentBiome = biomeIdx % 3; // 0: Snow Valley, 1: Emerald Forest, 2: Alpine Mountains
  const cleanTitle = title.replace(/^(Module|Lesson)\s+\d+(\.\d+)*:\s*/i, '');

  const handleClick = () => {
    soundManager.play('click');
    if (onClick) onClick();
  };

  // Determine type icon & label
  const getBadgeDetails = () => {
    const l = (lessonLabel || '').toLowerCase();
    const t = (title || '').toLowerCase();
    if (l.includes('treasure') || t.includes('treasure') || t.includes('chest')) {
      return { icon: '🎁', label: 'Treasure', colorBg: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
    if (l.includes('challenge') || t.includes('challenge') || t.includes('arena') || t.includes('guardian')) {
      return { icon: '🏆', label: 'Challenge', colorBg: 'bg-purple-100 text-purple-800 border-purple-300' };
    }
    if (t.includes('quiz') || t.includes('test') || t.includes('exam')) {
      return { icon: '🧠', label: 'Quiz', colorBg: 'bg-rose-100 text-rose-800 border-rose-300' };
    }
    if (t.includes('story') || t.includes('intro') || t.includes('concept') || t.includes('about')) {
      return { icon: '📖', label: 'Story', colorBg: 'bg-sky-100 text-sky-800 border-sky-300' };
    }
    return { icon: '🧭', label: 'Lesson', colorBg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  };

  const badge = getBadgeDetails();

  return (
    <div style={style} className={`select-none ${className}`}>
      <motion.div
        onClick={handleClick}
        whileHover={state !== 'locked' ? { scale: 1.04, y: -3 } : {}}
        whileTap={state !== 'locked' ? { scale: 0.97 } : {}}
        className={`rounded-2xl py-1.5 px-2 relative overflow-hidden transition-all duration-300 border-2 text-center flex flex-col items-center justify-center cursor-pointer shadow-md min-h-[52px] ${
          state === 'active'
            ? 'bg-white border-sky-400 shadow-[0_8px_20px_rgba(14,165,233,0.18)] animate-[card-gentle-breathe_4s_infinite_ease-in-out]'
            : state === 'completed'
              ? 'bg-gradient-to-br from-emerald-500 to-teal-500 border-emerald-500 text-white shadow-[0_6px_15px_rgba(16,185,129,0.2)]'
              : 'bg-slate-100/90 border-slate-200 text-slate-400 cursor-not-allowed shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]'
        }`}
      >
        {/* Style tag for custom badge animations */}
        <style>{`
          @keyframes card-gentle-breathe {
            0%, 100% { transform: scale(1); filter: brightness(1); }
            50% { transform: scale(1.02); filter: brightness(1.03); }
          }
        `}</style>

        {/* Category Label Pin on top */}
        {state !== 'locked' && (
          <div className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 flex items-center gap-0.5 border ${
            state === 'completed' 
              ? 'bg-white/20 text-white border-white/30' 
              : badge.colorBg
          }`}>
            <span>{badge.icon}</span>
            <span>{badge.label}</span>
          </div>
        )}

        {/* Locked padlock symbol on top */}
        {state === 'locked' && (
          <div className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 flex items-center gap-0.5 bg-slate-200/60 text-slate-500 border border-slate-300/40">
            <Lock size={8} className="stroke-[3px]" />
            <span>LOCKED</span>
          </div>
        )}

        {/* Main Title text */}
        <div className="relative z-10 flex items-center justify-center gap-1 w-full px-1">
          {state === 'completed' && (
            <Check size={11} className="text-white stroke-[4px] shrink-0" />
          )}
          <span className={`text-[10.5px] font-bold leading-tight line-clamp-2 tracking-tight ${
            state === 'locked' ? 'text-slate-400' : state === 'completed' ? 'text-white' : 'text-slate-800'
          }`}>
            {cleanTitle}
          </span>
        </div>

        {/* Subtle Sparkles on Completed or Active */}
        {state === 'active' && (
          <div className="absolute top-1 right-1 opacity-45 pointer-events-none">
            <Sparkles size={8} className="text-sky-400 animate-pulse" />
          </div>
        )}
      </motion.div>
    </div>
  );
}
