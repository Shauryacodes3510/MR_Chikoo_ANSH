import React, { useState } from 'react';
import { User } from 'lucide-react';
import { RaceTelemetry, RivalProfile } from '../types/arena.types';

interface RaceHUDProps {
  telemetry: RaceTelemetry;
  rival: RivalProfile;
  currentLap: number;
  totalLaps: number;
}

const CHIKOO_AVATAR_URL = '/avatar.webp';

export function RaceHUD({
  telemetry,
  rival,
  currentLap,
  totalLaps,
}: RaceHUDProps) {
  const [avatarError, setAvatarError] = useState(false);

  const {
    playerDistance,
    opponentDistance,
    targetDistance,
    playerStreak,
    position,
  } = telemetry;

  const isLeading = position === 1;
  const playerPct = Math.min(100, Math.max(0, (playerDistance / targetDistance) * 100));
  const opponentPct = Math.min(100, Math.max(0, (opponentDistance / targetDistance) * 100));

  return (
    <div className="w-full flex flex-col gap-2 select-none font-sans">
      {/* Minimal 3-Column Match Header */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: Player */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-900 border border-white/15 flex items-center justify-center overflow-hidden shrink-0">
            {!avatarError ? (
              <img
                src={CHIKOO_AVATAR_URL}
                alt="You"
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={15} className="text-slate-300" aria-hidden="true" />
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-white leading-tight truncate">
              You
            </span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5 leading-tight tabular-nums">
              <span className={isLeading ? 'text-emerald-400 font-medium' : 'text-amber-300 font-medium'}>
                {isLeading ? '1st' : '2nd'}
              </span>
              {playerStreak >= 2 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-sky-300">{playerStreak}x streak</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Center: Simple Question Counter */}
        <div className="text-xs font-medium text-slate-300 tabular-nums shrink-0">
          Question {currentLap} / {totalLaps}
        </div>

        {/* Right: Rival */}
        <div className="flex items-center gap-2.5 min-w-0 justify-end text-right">
          <div className="flex flex-col min-w-0 items-end">
            <span className="text-xs sm:text-sm font-semibold text-slate-200 leading-tight truncate max-w-[110px] sm:max-w-[160px]">
              {rival.name}
            </span>
            <span className="text-[11px] text-slate-400 leading-tight">
              {!isLeading ? '1st' : '2nd'}
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-slate-900 border border-white/15 flex items-center justify-center shrink-0">
            <span className="text-base leading-none" role="img" aria-label={rival.name}>
              {rival.avatar || '🤖'}
            </span>
          </div>
        </div>
      </div>

      {/* Slim Dual Race Progress Line */}
      <div
        className="relative w-full h-1.5 rounded-full bg-white/10 overflow-hidden"
        aria-label={`Race progress: You at ${Math.round(playerPct)}%, ${rival.name} at ${Math.round(opponentPct)}%`}
      >
        {/* Rival progress bar */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-violet-400/55 transition-transform duration-300 ease-out origin-left"
          style={{ width: '100%', transform: `scaleX(${opponentPct / 100})` }}
        />
        {/* Player progress bar */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-sky-400 transition-transform duration-300 ease-out origin-left"
          style={{ width: '100%', transform: `scaleX(${playerPct / 100})` }}
        />
      </div>
    </div>
  );
}

export default RaceHUD;
