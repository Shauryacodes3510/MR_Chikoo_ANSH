import { useState, memo } from 'react';
import { Sparkles, Lock } from 'lucide-react';
import { soundManager } from '../lib/sounds';

interface FrozenLockedNodeProps {
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  biomeIdx?: number;
}

function FrozenLockedNode({ 
  onClick, 
  className = '', 
  size = 'md',
  biomeIdx = 0 
}: FrozenLockedNodeProps) {
  const [isHovered, setIsHovered] = useState(false);

  const currentBiome = biomeIdx % 5;

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const handlePress = () => {
    soundManager.play('pop');
    if (onClick) onClick();
  };

  // -----------------------------------------------------------------
  // UNIT 2 — EMERALD FOREST (biomeIdx === 1)
  // -----------------------------------------------------------------
  if (currentBiome === 1) {
    return (
      <div
        className={`relative rounded-full select-none cursor-pointer flex items-center justify-center bg-gradient-to-br from-emerald-950/30 via-emerald-900/20 to-emerald-950/30 border border-emerald-600/35 transition-transform duration-150 ease-out hover:scale-105 active:scale-95 ${sizeClasses[size]} ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handlePress}
        style={{
          willChange: 'transform',
          transform: 'translateZ(0)',
          boxShadow: isHovered
            ? '0 8px 24px rgba(4, 120, 87, 0.25), inset 0 2px 6px rgba(255, 255, 255, 0.15)'
            : '0 4px 14px rgba(4, 120, 87, 0.12), inset 0 1.5px 4px rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Soft background green glow */}
        <div className="absolute -inset-3 bg-emerald-500/10 rounded-full blur-md opacity-60 pointer-events-none" />

        {/* Clean organic nature ring SVG */}
        <div className="absolute inset-[-3px] pointer-events-none z-10 opacity-70">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full overflow-visible">
            <path
              d="M 12 50 C 12 25, 35 12, 50 12 C 65 12, 88 25, 88 50 C 88 75, 65 88, 50 88 C 35 88, 12 75, 12 50 Z"
              stroke="#047857"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Leaves */}
            <path d="M 15 30 Q 8 20 22 18 Q 24 28 15 30 Z" fill="#10b981" stroke="#047857" strokeWidth="0.8" />
            <path d="M 85 45 Q 94 38 88 28 Q 80 34 85 45 Z" fill="#34d399" stroke="#047857" strokeWidth="0.8" />
            <path d="M 30 85 Q 20 90 24 76 Q 32 78 30 85 Z" fill="#059669" stroke="#047857" strokeWidth="0.8" />
          </svg>
        </div>

        {/* Lock Icon */}
        <div className="relative z-30 opacity-85 text-emerald-200">
          <Lock size={size === 'sm' ? 14 : size === 'md' ? 20 : 26} className="stroke-[2.2px] drop-shadow-sm" />
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
        className={`relative rounded-full select-none cursor-pointer flex items-center justify-center bg-gradient-to-br from-sky-200/25 via-sky-300/15 to-teal-100/20 border border-sky-300/35 transition-transform duration-150 ease-out hover:scale-105 active:scale-95 ${sizeClasses[size]} ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handlePress}
        style={{
          willChange: 'transform',
          transform: 'translateZ(0)',
          boxShadow: isHovered
            ? '0 8px 20px rgba(14, 165, 233, 0.25), inset 0 2px 6px rgba(255, 255, 255, 0.35)'
            : '0 4px 12px rgba(14, 165, 233, 0.12), inset 0 1.5px 4px rgba(255, 255, 255, 0.25)'
        }}
      >
        {/* Soft mountain mist background cloud */}
        <div className="absolute -inset-2 bg-sky-200/15 rounded-full blur-md pointer-events-none" />

        {/* Facet details */}
        <div className="absolute inset-0 pointer-events-none z-10 opacity-60">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <polygon points="50,12 76,28 70,50 50,35" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
            <polygon points="50,12 24,28 30,50 50,35" fill="rgba(224,242,254,0.15)" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
            <polygon points="30,50 50,88 24,72" fill="rgba(186,230,253,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
            <polygon points="70,50 50,88 76,72" fill="rgba(224,242,254,0.12)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
          </svg>
        </div>

        {/* Lock Icon */}
        <div className="relative z-30 opacity-80 text-sky-200">
          <Lock size={size === 'sm' ? 14 : size === 'md' ? 19 : 25} className="stroke-[2.2px] drop-shadow-sm" />
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // DEFAULT / FALLBACK (UNIT 1 — COSMOS / SNOW VALLEY)
  // -----------------------------------------------------------------
  return (
    <div
      className={`relative rounded-full select-none cursor-pointer flex items-center justify-center bg-gradient-to-br from-white/30 via-white/15 to-white/20 border border-white/40 transition-transform duration-150 ease-out hover:scale-105 active:scale-95 ${sizeClasses[size]} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handlePress}
      style={{
        willChange: 'transform',
        transform: 'translateZ(0)',
        boxShadow: isHovered
          ? '0 8px 24px rgba(15, 23, 42, 0.25), inset 0 2px 6px rgba(255, 255, 255, 0.6)'
          : '0 4px 14px rgba(15, 23, 42, 0.15), inset 0 1.5px 4px rgba(255, 255, 255, 0.5)'
      }}
    >
      {/* Soft Glow */}
      <div className="absolute -inset-3 bg-white/25 rounded-full blur-md opacity-70 pointer-events-none" />
      
      {/* Subtle outer frosted ring */}
      <div className="absolute -inset-1.5 rounded-full border border-white/30 pointer-events-none" />

      {/* Lock Icon */}
      <div className="relative z-30 opacity-80 text-slate-700 dark:text-slate-200">
        <Lock size={size === 'sm' ? 14 : size === 'md' ? 19 : 25} className="stroke-[2.2px] drop-shadow-sm" />
      </div>
    </div>
  );
}

export default memo(FrozenLockedNode);
