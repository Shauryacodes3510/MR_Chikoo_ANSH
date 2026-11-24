import React, { useState } from 'react';
import { RotateCcw, Sparkles, ChevronDown, ChevronUp, AlertCircle, ShieldAlert } from 'lucide-react';
import { soundManager } from '../../lib/sounds';

interface ErrorViewProps {
  title?: string;
  subtitle?: string;
  message?: string;
  error?: Error | string | null;
  onRetry?: () => void;
  buttonText?: string;
  isFullScreen?: boolean;
}

export const ErrorView: React.FC<ErrorViewProps> = ({
  title = "Chikoo failed to Load!",
  subtitle,
  message,
  error,
  onRetry,
  buttonText = "RELOAD APPLICATION",
  isFullScreen = true
}) => {
  const [isReloading, setIsReloading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const displaySubtitle = subtitle || message || 
    "Cosmic interference detected! Don't worry, your streaks, cookies, and learning progress are safe. Tap below to reboot Chikoo.";

  const handleReload = () => {
    try {
      soundManager.play('click');
    } catch {}
    setIsReloading(true);

    setTimeout(() => {
      if (onRetry) {
        onRetry();
      } else {
        window.location.reload();
      }
    }, 250);
  };

  const errorMessage = typeof error === 'string' 
    ? error 
    : error instanceof Error 
      ? error.message || error.stack || String(error)
      : null;

  const content = (
    <div className="relative max-w-md w-full mx-auto px-6 py-8 flex flex-col items-center text-center select-none z-10">
      {/* 1. Playful Background Ambient Aura */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-tr from-sky-400/20 via-indigo-500/15 to-amber-400/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* 2. Centered Mascot Artwork */}
      <div className="relative mb-6 group">
        <div className="absolute -inset-4 bg-sky-400/20 rounded-full blur-xl opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <img
          src="https://i.postimg.cc/tTKd8dPR/2992af35-dcb8-4f66-bb43-b8cf447bc796.png"
          alt="Chikoo failed to load"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/heading_aibo.webp'; }}
          className="relative w-44 h-44 sm:w-52 sm:h-52 object-contain drop-shadow-[0_16px_30px_rgba(15,23,42,0.2)] animate-float pointer-events-none"
          referrerPolicy="no-referrer"
        />
        {/* Subtle question/sparkle badge */}
        <div className="absolute top-1 right-2 w-9 h-9 rounded-2xl bg-amber-400 text-amber-950 font-black text-sm flex items-center justify-center shadow-lg border-2 border-white rotate-12 animate-pulse">
          ⚡
        </div>
      </div>

      {/* 3. Main Text */}
      <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-800 dark:text-white tracking-tight leading-tight mb-3">
        {title}
      </h1>

      <p className="text-sm sm:text-base font-semibold text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed mb-7">
        {displaySubtitle}
      </p>

      {/* 4. Gamified 3D Reload Button */}
      <div className="w-full max-w-xs relative mb-4">
        <button
          type="button"
          onClick={handleReload}
          disabled={isReloading}
          className="group relative w-full inline-flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-display font-black text-sm sm:text-base tracking-wider uppercase text-white bg-[#58CC02] hover:bg-[#46a302] border-2 border-[#58CC02] shadow-[0_6px_0_#46a302] active:translate-y-1.5 active:shadow-none hover:shadow-[0_8px_0_#46a302] transition-all duration-100 cursor-pointer disabled:opacity-75 disabled:cursor-wait"
        >
          <RotateCcw 
            className={`w-5 h-5 text-white stroke-[2.5px] transition-transform duration-500 ${
              isReloading ? 'animate-spin' : 'group-hover:-rotate-90'
            }`} 
          />
          <span>{isReloading ? 'REBOOTING CHIKOO...' : buttonText}</span>
          <Sparkles className="w-4 h-4 text-amber-200 fill-current animate-pulse" />
        </button>
      </div>

      {/* 5. Diagnostic / Debug Accordion (Expandable for technical details) */}
      {errorMessage && (
        <div className="w-full max-w-md mt-4 text-left">
          <button
            type="button"
            onClick={() => setShowDetails(prev => !prev)}
            className="flex items-center justify-center gap-1.5 w-full text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors py-1 cursor-pointer"
          >
            <ShieldAlert size={13} className="text-amber-500" />
            <span>{showDetails ? 'Hide technical details' : 'Show diagnostic details'}</span>
            {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {showDetails && (
            <div className="mt-2.5 p-3.5 bg-slate-900/95 text-red-300 rounded-2xl font-mono text-[11px] leading-relaxed border border-red-500/30 overflow-x-auto max-h-40 shadow-inner">
              <div className="font-bold text-red-400 mb-1 flex items-center gap-1">
                <AlertCircle size={12} />
                <span>Error Log:</span>
              </div>
              <pre className="whitespace-pre-wrap break-all font-mono">
                {errorMessage}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isFullScreen) {
    return (
      <div className="fixed inset-0 min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 overflow-y-auto p-4 z-[999999]">
        {/* Subtle background mesh grid */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(148, 163, 184, 0.25) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
        {content}
      </div>
    );
  }

  return content;
};

export default ErrorView;
