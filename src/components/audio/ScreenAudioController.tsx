import React from 'react';
import { Volume2, VolumeX, Play, Pause, RotateCcw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ScreenAudioControllerProps {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  hasAudio: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  isMuted: boolean;
  dbLang: 'en' | 'hinglish' | 'mr';
  uiLang: 'english' | 'hinglish' | 'marathi';
  onTogglePlay: () => void;
  onReplay: () => void;
  onToggleMute: () => void;
  className?: string;
  variant?: 'floating' | 'bar' | 'minimal';
}

export const ScreenAudioController: React.FC<ScreenAudioControllerProps> = ({
  isPlaying,
  isPaused,
  isLoading,
  hasAudio,
  progress,
  currentTime,
  duration,
  isMuted,
  dbLang,
  uiLang,
  onTogglePlay,
  onReplay,
  onToggleMute,
  className = '',
  variant = 'bar'
}) => {
  // Gracefully render nothing if this screen doesn't have an approved audio record
  if (!hasAudio && !isLoading) {
    return null;
  }

  const formatTime = (secs: number) => {
    const s = Math.floor(secs || 0);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const langBadge = dbLang === 'en' ? 'EN' : dbLang === 'mr' ? 'MR' : 'HI';

  if (variant === 'minimal') {
    return (
      <div className={`inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-200/80 shadow-xs text-xs ${className}`}>
        <button
          type="button"
          onClick={onTogglePlay}
          disabled={isLoading}
          className="p-1 rounded-full text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
          title={isPlaying ? "Pause Narration" : "Play Narration"}
        >
          {isLoading ? (
            <Loader2 size={13} className="animate-spin text-indigo-500" />
          ) : isPlaying ? (
            <Pause size={13} />
          ) : (
            <Play size={13} />
          )}
        </button>
        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{langBadge}</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-indigo-150 shadow-sm transition-all select-none ${
        isPlaying ? 'ring-2 ring-indigo-400/30' : ''
      } ${className}`}
    >
      {/* Animated Voice Equalizer / Sound Icon */}
      <button
        type="button"
        onClick={onToggleMute}
        className="text-slate-400 hover:text-indigo-600 transition cursor-pointer p-0.5"
        title={isMuted ? "Unmute Voice" : "Mute Voice"}
      >
        {isMuted ? (
          <VolumeX size={14} className="text-rose-400" />
        ) : (
          <Volume2 size={14} className={isPlaying ? "text-indigo-600" : "text-slate-400"} />
        )}
      </button>

      {/* Language Badge */}
      <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
        {langBadge}
      </span>

      {/* Animated Sound Bars when playing */}
      {isPlaying && (
        <div className="flex items-center gap-0.5 h-3.5 px-0.5">
          <span className="w-0.5 bg-indigo-500 rounded-full animate-bounce h-2" style={{ animationDelay: '0ms' }} />
          <span className="w-0.5 bg-indigo-600 rounded-full animate-bounce h-3.5" style={{ animationDelay: '150ms' }} />
          <span className="w-0.5 bg-indigo-400 rounded-full animate-bounce h-2.5" style={{ animationDelay: '300ms' }} />
          <span className="w-0.5 bg-indigo-500 rounded-full animate-bounce h-1.5" style={{ animationDelay: '200ms' }} />
        </div>
      )}

      {/* Play / Pause Toggle Button */}
      <button
        type="button"
        onClick={onTogglePlay}
        disabled={isLoading}
        className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white flex items-center justify-center transition shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
        title={isPlaying ? "Pause Narration" : "Play Narration"}
      >
        {isLoading ? (
          <Loader2 size={11} className="animate-spin" />
        ) : isPlaying ? (
          <Pause size={11} />
        ) : (
          <Play size={11} className="translate-x-0.5" />
        )}
      </button>

      {/* Replay Button */}
      <button
        type="button"
        onClick={onReplay}
        disabled={isLoading}
        className="p-1 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition cursor-pointer disabled:opacity-30"
        title="Replay from start"
      >
        <RotateCcw size={12} />
      </button>

      {/* Progress / Duration Display (if duration available) */}
      {duration > 0 && (
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 font-bold pl-0.5">
          <span>{formatTime(currentTime)}</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-400">{formatTime(duration)}</span>
        </div>
      )}
    </div>
  );
};

export default ScreenAudioController;
