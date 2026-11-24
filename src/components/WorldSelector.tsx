import React from 'react';
import { Lock, Globe } from 'lucide-react';
import { World, UserWorldProgress } from '../lib/supabase';

interface WorldSelectorProps {
  worlds: World[];
  selectedWorldId: string;
  userWorldProgress: UserWorldProgress[];
  onSelectWorld: (worldId: string) => void;
  isLoading?: boolean;
}

export function WorldSelector({
  worlds,
  selectedWorldId,
  userWorldProgress,
  onSelectWorld,
  isLoading = false
}: WorldSelectorProps) {
  if (isLoading && worlds.length === 0) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-3 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 animate-pulse">
        <Globe size={16} className="animate-spin text-amber-500" />
        <span>Loading worlds...</span>
      </div>
    );
  }

  if (worlds.length === 0) return null;

  return (
    <div className="w-full max-w-xl mx-auto px-4 pt-3 pb-2 relative z-30 select-none">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <Globe size={18} className="text-amber-500 stroke-[2.5]" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">
            Select World
          </span>
        </div>
        <span className="text-[11px] font-extrabold text-slate-400">
          {worlds.length} World{worlds.length > 1 ? 's' : ''} Available
        </span>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide py-1 px-0.5">
        {worlds.map((world) => {
          // World 1 is unlocked by default for existing and new users
          const isWorld1 = world.world_number === 1 || world.id === 'world_1';
          const progressRecord = userWorldProgress.find(p => p.world_id === world.id);
          const isUnlocked = isWorld1 || (progressRecord ? !!progressRecord.unlocked : false);
          const isSelected = selectedWorldId === world.id;

          return (
            <button
              key={world.id}
              type="button"
              onClick={() => {
                if (onSelectWorld) {
                  onSelectWorld(world.id);
                }
              }}
              className={`px-4 py-2.5 rounded-2xl border-2 text-left shrink-0 transition-all cursor-pointer flex items-center gap-3 relative ${
                isSelected
                  ? 'bg-amber-500 border-amber-600 text-white shadow-md scale-[1.02] ring-4 ring-amber-300/40'
                  : isUnlocked
                  ? 'bg-white hover:bg-amber-50/60 border-slate-200 text-slate-800 shadow-3xs hover:border-amber-300'
                  : 'bg-slate-100/80 border-slate-200/80 text-slate-400 cursor-not-allowed opacity-75'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-xs ${
                isSelected
                  ? 'bg-white/20 text-white border border-white/30'
                  : isUnlocked
                  ? 'bg-amber-100 text-amber-900 border border-amber-300/70'
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {isUnlocked ? (
                  <span>W{world.world_number || 1}</span>
                ) : (
                  <Lock size={14} className="stroke-[2.5]" />
                )}
              </div>

              <div className="flex flex-col min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-black truncate max-w-[140px] ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                    World {world.world_number}: {world.title}
                  </span>
                </div>
                <span className={`text-[10px] font-bold ${isSelected ? 'text-amber-100' : isUnlocked ? 'text-slate-500' : 'text-slate-400'}`}>
                  {isUnlocked ? (isSelected ? 'Active World' : 'Unlocked') : 'Locked World'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default WorldSelector;
