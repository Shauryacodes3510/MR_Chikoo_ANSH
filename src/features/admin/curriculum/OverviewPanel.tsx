import React from 'react';
import { Sparkles, Cpu } from 'lucide-react';
import { OverviewPanelProps } from './types';
import { getChallengePacks, getPuzzlePacks, getBattlePools } from '../../../lib/practiceStoreNew';
import { getRewards } from '../../../lib/rewardsStore';

export const OverviewPanel: React.FC<OverviewPanelProps> = ({
  modulesList,
  practiceModulesList,
  isSupabaseConfigured,
  isGeneratingAllImages,
  onBulkGenerateImages,
  triggerConfirm
}) => {
  return (
    <div className="space-y-6 animate-fade-in animate-duration-200">
      <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-2xs text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md transform rotate-6 hover:rotate-12 transition-transform duration-300">
          <Sparkles size={28} className="animate-pulse-slow" />
        </div>
        
        <div className="space-y-1.5 max-w-sm mx-auto font-sans">
          <h3 className="text-base font-black text-slate-900 tracking-tight">Studio Designer Map</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            Click any Unit Chapter or Lesson node inside the side outline map to view stats, manage slides, re-sequence steps, or configure titles!
          </p>
        </div>

        <div className="text-[10px] text-slate-404 font-mono uppercase tracking-widest font-black">
          🪐 Courseware Trail • 🌿 Practice Arena
        </div>
      </div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans">
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-3xs text-left">
          <span className="text-[10px] font-black uppercase text-slate-404 tracking-wider block font-mono">Cosmic Trail</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {modulesList.length} <span className="text-xs text-slate-400 font-semibold">Units</span>
          </span>
          <span className="text-[10px] text-indigo-600 font-bold block mt-1">
            {modulesList.reduce((acc, m) => acc + m.lessons.length, 0)} Total Lesson nodes
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-3xs text-left">
          <span className="text-[10px] font-black uppercase text-slate-404 tracking-wider block font-mono">Practice Arena</span>
          <span className="text-2xl font-black text-emerald-850 mt-1 block">
            {practiceModulesList.length} <span className="text-xs text-slate-400 font-semibold">Playgrounds</span>
          </span>
          <span className="text-[10px] text-emerald-650 font-bold block mt-1">
            {practiceModulesList.reduce((acc, m) => acc + m.lessons.length, 0)} Active zones
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-3xs text-left">
          <span className="text-[10px] font-black uppercase text-slate-404 tracking-wider block font-mono">Interactive Screens</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {[...modulesList, ...practiceModulesList].reduce((acc, m) => acc + m.lessons.reduce((lAcc, l) => lAcc + (l.challenges?.length || 0), 0), 0)} <span className="text-xs text-slate-400 font-semibold font-sans">Screens</span>
          </span>
          <span className="text-[10px] text-slate-404 font-semibold block mt-1">
            Live simulated responses
          </span>
        </div>
      </div>

      {/* Data Source Inspector */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left font-sans space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu size={14} className="text-indigo-600" />
            <span>Data Source Inspector</span>
          </h4>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-mono font-bold flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            Source: {isSupabaseConfigured ? 'Supabase' : 'Local Storage Cache'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-3xs">
            <div className="text-[8.5px] font-mono font-black text-slate-400 uppercase tracking-wider leading-none">Lessons Loaded</div>
            <div className="text-lg font-black text-slate-850 mt-1 block leading-none">
              {[...modulesList, ...practiceModulesList].reduce((acc, m) => acc + m.lessons.length, 0)}
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-3xs">
            <div className="text-[8.5px] font-mono font-black text-slate-400 uppercase tracking-wider leading-none">Challenges Loaded</div>
            <div className="text-lg font-black text-slate-850 mt-1 block leading-none">
              {getChallengePacks().length}
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-3xs">
            <div className="text-[8.5px] font-mono font-black text-slate-400 uppercase tracking-wider leading-none">Puzzles Loaded</div>
            <div className="text-lg font-black text-slate-850 mt-1 block leading-none">
              {getPuzzlePacks().length}
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-3xs">
            <div className="text-[8.5px] font-mono font-black text-slate-400 uppercase tracking-wider leading-none">Battle Qs Loaded</div>
            <div className="text-lg font-black text-slate-850 mt-1 block leading-none">
              {getBattlePools().reduce((acc, p) => acc + p.questions.length, 0)}
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-3xs">
            <div className="text-[8.5px] font-mono font-black text-slate-400 uppercase tracking-wider leading-none">Rewards Loaded</div>
            <div className="text-lg font-black text-slate-850 mt-1 block leading-none">
              {getRewards().length}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Generate Missing Images card */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 p-5 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div className="space-y-0.5 font-sans">
          <h4 className="text-xs font-black text-indigo-900 uppercase flex items-center gap-1.5">
            <Sparkles size={14} className="text-indigo-600 animate-pulse-slow" />
            <span>Bulk Generate Missing Screen Images</span>
          </h4>
          <p className="text-[11px] text-indigo-950 leading-snug font-medium">
            Automatically scan all lesson content/visual screens on the platform and generate styled AI illustrations for any screens currently missing a media URL.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {isGeneratingAllImages && (
            <span className="text-xs text-indigo-600 font-bold animate-pulse">
              ⚙️ Processing... This may take a minute
            </span>
          )}
          <button
            type="button"
            disabled={isGeneratingAllImages}
            onClick={onBulkGenerateImages}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs px-4 py-2 rounded-xl transition duration-300 cursor-pointer shadow-3xs flex items-center gap-1.5 animate-fadeIn"
          >
            <Sparkles size={13} />
            <span>{isGeneratingAllImages ? 'Generating...' : 'Scan & Generate Missing'}</span>
          </button>
        </div>
      </div>

      {/* Reset Default course content */}
      <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div className="space-y-0.5 font-sans">
          <h4 className="text-xs font-black text-rose-900 uppercase">Clear Local Cache & Reload</h4>
          <p className="text-[11px] text-rose-550 leading-snug font-medium">
            Discard local browser cache and reload fresh curriculum from database.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            triggerConfirm(
              "Clear Local Cache & Reload",
              "Are you sure you want to clear your local curriculum cache and reload fresh data from the database? This will discard unsaved local edits and fetch the latest live curriculum.",
              () => {
                localStorage.removeItem('CHIKOO_AI_CURRICULUM');
                localStorage.removeItem('CHIKOO_PRACTICE_CURRICULUM');
                window.location.reload();
              }
            );
          }}
          className="bg-rose-100 hover:bg-rose-200 text-rose-700 hover:text-rose-900 font-black text-xs px-4 py-2 rounded-xl transition duration-300 cursor-pointer shadow-3xs shrink-0"
        >
          Clear local cache & reload from database
        </button>
      </div>
    </div>
  );
};

export default OverviewPanel;
