import { memo } from 'react';
import { Lock, Leaf, Sparkles } from 'lucide-react';
import { soundManager } from '../lib/sounds';

interface EnvironmentalLockedCardProps {
  title: string;
  lessonLabel: string;
  biomeIdx: number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

function EnvironmentalLockedCard({
  title,
  lessonLabel,
  biomeIdx,
  className = '',
  style,
  onClick
}: EnvironmentalLockedCardProps) {
  const currentBiome = biomeIdx % 5;
  const cleanTitle = title.replace(/^(Module|Lesson)\s+\d+(\.\d+)*:\s*/i, '');

  const handleClick = () => {
    soundManager.play('pop');
    if (onClick) onClick();
  };

  // -----------------------------------------------------------------
  // UNIT 2 — EMERALD FOREST (biomeIdx === 1)
  // -----------------------------------------------------------------
  if (currentBiome === 1) {
    return (
      <div
        onClick={handleClick}
        style={{ ...style, willChange: 'transform', transform: 'translateZ(0)' }}
        className={`select-none rounded-2xl py-2.5 px-3.5 bg-white/80 dark:bg-[#172033]/85 backdrop-blur-xs border border-emerald-500/25 shadow-xs cursor-pointer relative overflow-hidden transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] ${className}`}
      >
        {/* Soft green ambient tint */}
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100/15 via-emerald-50/5 to-white/10 pointer-events-none" />
        
        {/* Decorative vines */}
        <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none opacity-20 text-emerald-600">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <path d="M0,0 Q30,10 40,40 T80,80" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <path d="M40,40 Q15,45 10,65" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Content container */}
        <div className="relative z-10 flex flex-col">
          <p className="text-[11px] font-medium text-emerald-800/80 dark:text-emerald-300/80 flex items-center justify-start sm:justify-center gap-1 leading-none">
            <Lock size={9} className="stroke-[2.5px] text-emerald-700/70" />
            <span>{lessonLabel}</span>
            <Leaf size={8} className="text-emerald-500 fill-emerald-500/20 ml-0.5" />
          </p>
          <p className="text-[13px] sm:text-[14px] font-semibold text-slate-800/85 dark:text-slate-200 mt-1 leading-tight tracking-tight text-left sm:text-center">
            {cleanTitle}
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // UNIT 3 — MOUNTAINS & WATERFALLS (biomeIdx === 2)
  // -----------------------------------------------------------------
  if (currentBiome === 2) {
    return (
      <div
        onClick={handleClick}
        style={{ ...style, willChange: 'transform', transform: 'translateZ(0)' }}
        className={`select-none rounded-2xl py-2.5 px-3.5 bg-white/80 dark:bg-[#172033]/85 backdrop-blur-xs border border-sky-300/30 shadow-xs cursor-pointer relative overflow-hidden transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] ${className}`}
      >
        {/* Soft icy blue tint background */}
        <div className="absolute inset-0 bg-gradient-to-tr from-sky-50/20 via-white/10 to-teal-50/15 pointer-events-none" />

        {/* Crystal sharp borders */}
        <div className="absolute inset-0 border border-sky-100/30 rounded-2xl pointer-events-none" />

        {/* Content container */}
        <div className="relative z-10 flex flex-col">
          <p className="text-[11px] font-medium text-sky-900/75 dark:text-sky-300/80 flex items-center justify-start sm:justify-center gap-1 leading-none">
            <Lock size={9} className="stroke-[2.5px] text-sky-600/75" />
            <span>{lessonLabel}</span>
            <Sparkles size={8} className="text-sky-400 ml-0.5" />
          </p>
          <p className="text-[13px] sm:text-[14px] font-semibold text-slate-800/85 dark:text-slate-200 mt-1 leading-tight tracking-tight text-left sm:text-center">
            {cleanTitle}
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // DEFAULT / FALLBACK (Snow Valley / Cosmos / Unit 1 / Other units)
  // -----------------------------------------------------------------
  return (
    <div
      onClick={handleClick}
      style={{ ...style, willChange: 'transform', transform: 'translateZ(0)' }}
      className={`select-none rounded-2xl py-2.5 px-3.5 bg-white/70 dark:bg-[#172033]/80 backdrop-blur-xs border border-slate-200/60 dark:border-slate-700/60 shadow-xs cursor-pointer relative overflow-hidden transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] ${className}`}
    >
      <div className="relative z-10 flex flex-col">
        <p className="text-[11px] font-medium text-slate-700/60 dark:text-slate-300/60 flex items-center justify-start sm:justify-center gap-1 leading-none">
          <Lock size={9} className="stroke-[2.5px] text-slate-600/60" />
          <span>{lessonLabel}</span>
        </p>
        <p className="text-[13px] sm:text-[14px] font-semibold text-slate-800/75 dark:text-slate-200 mt-1 leading-tight tracking-tight text-left sm:text-center">
          {cleanTitle}
        </p>
      </div>
    </div>
  );
}

export default memo(EnvironmentalLockedCard);
