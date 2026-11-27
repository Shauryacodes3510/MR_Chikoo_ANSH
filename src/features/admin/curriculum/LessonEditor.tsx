import React from 'react';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import { LessonEditorProps, Challenge } from './types';
import { getChallengeLabel } from './utils';

export const LessonEditor: React.FC<LessonEditorProps> = ({
  module,
  lesson,
  modulesList,
  lesId,
  lesTitle,
  setLesTitle,
  lesDescription,
  setLesDescription,
  lesDifficulty,
  setLesDifficulty,
  lesCategory,
  setLesCategory,
  lesXpReward,
  setLesXpReward,
  lesChestIconUrl,
  setLesChestIconUrl,
  lesLinkedUnitId,
  setLesLinkedUnitId,
  screenListViewMode,
  setScreenListViewMode,
  onSaveLessonEdits,
  onBackToUnit,
  onCreateChallenge,
  onSelectChallenge,
  onDeleteChallenge,
  onReorderChallenge,
  soundManager,
  onToggleChest,
  chalId,
}) => {
  const currentChallenges = lesson.challenges || [];

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-2xs space-y-6 animate-fade-in animate-duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
        <div>
          <div className="text-[10px] uppercase font-black text-slate-400 font-mono tracking-widest flex items-center gap-1.5 mb-1 pb-0.5">
            <span>UNIT MODULE: {module?.title?.replace(/^[^\s]*\s/, '')}</span>
          </div>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="text-violet-600 animate-pulse-slow" size={18} />
            Lesson Node Editor
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onBackToUnit();
              soundManager?.play?.('click');
            }}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-150 px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            Back to Unit Overview
          </button>
        </div>
      </div>

      {/* Lesson Property Editor Form */}
      <form onSubmit={(e) => { e.preventDefault(); onSaveLessonEdits(e); }} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400">Lesson ID (Permanent)</label>
            <input 
              type="text" 
              value={lesId}
              disabled
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-400 outline-none cursor-not-allowed font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-black tracking-wider text-indigo-600 font-bold">XP Reward on Complete</label>
            <input 
              type="number" 
              value={lesXpReward}
              onChange={(e) => setLesXpReward(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-905 outline-none font-extrabold focus:border-indigo-500 transition-colors"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500">Lesson Title</label>
          <input 
            type="text" 
            value={lesTitle}
            onChange={(e) => setLesTitle(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-905 outline-none font-black focus:border-indigo-500 transition-colors"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500">Practice Area Tag</label>
            <input 
              type="text" 
              value={lesCategory}
              onChange={(e) => setLesCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-905 outline-none font-bold focus:border-indigo-500 transition-colors"
              placeholder="e.g. Celestial Mechanics"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500">Grade Focus Target</label>
            <select 
              value={lesDifficulty}
              onChange={(e) => setLesDifficulty(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-905 outline-none font-extrabold focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="Explorer">Explorer Level (Core)</option>
              <option value="Specialist">Specialist Level (Applied)</option>
              <option value="Commander">Commander Level (Advanced)</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500">Lesson Subtitle & Outcome Description</label>
          <textarea 
            value={lesDescription}
            onChange={(e) => setLesDescription(e.target.value)}
            rows={2}
            placeholder="Briefly state learning objectives or core principles for this page."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-905 outline-none font-medium focus:border-indigo-500 transition-colors resize-none"
          />
        </div>

        {/* Chest / Treasure Node Configuration section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 p-1 bg-slate-50/50 rounded-xl border border-slate-100 px-3 py-2">
            <input 
              type="checkbox"
              id="lesIsChest"
              checked={!!lesson.isChest}
              onChange={(e) => {
                onToggleChest?.(e.target.checked);
              }}
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded-sm focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="lesIsChest" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
              Is Chest / Treasure Node
            </label>
          </div>

          {lesson.isChest && (
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <span className="bg-amber-500 text-white p-1 rounded-md text-[10px]">🎁</span>
                Chest & Treasure Vault Configuration
              </h4>
              <p className="text-[10px] text-slate-500 font-semibold">
                This lesson is designated as a Chest node. You can link it to another module / learning unit and specify a custom icon URL.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-amber-900">Custom Chest Icon URL</label>
                  <input 
                    type="text"
                    value={lesChestIconUrl}
                    onChange={(e) => setLesChestIconUrl(e.target.value)}
                    placeholder="e.g. https://images.unsplash.com/... or relative path"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-905 outline-none focus:border-indigo-500"
                  />
                  <div className="flex gap-1.5 mt-1">
                    <button
                      type="button"
                      onClick={() => setLesChestIconUrl('https://i.postimg.cc/bvpyTJh1/Chest.webp')}
                      className="text-[9px] bg-white border border-slate-200 hover:bg-slate-50 px-2 py-0.5 rounded text-slate-600 font-bold"
                    >
                      Preset Gold
                    </button>
                    <button
                      type="button"
                      onClick={() => setLesChestIconUrl('')}
                      className="text-[9px] bg-white border border-slate-200 hover:bg-slate-50 px-2 py-0.5 rounded text-slate-600 font-bold"
                    >
                      Reset Default
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-amber-900">Linked Learning Unit (Module)</label>
                  <select 
                    value={lesLinkedUnitId}
                    onChange={(e) => setLesLinkedUnitId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-905 outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                  >
                    <option value="">None / Not Linked</option>
                    {modulesList.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({m.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-black text-[11px] uppercase tracking-wider px-6 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
          >
            Save Lesson Changes
          </button>
        </div>
      </form>

      {/* Lesson Screens Builder list */}
      <div className="pt-6 border-t border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
            Interactive Screens ({currentChallenges.length})
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/70 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => { soundManager?.play?.('click'); setScreenListViewMode('table'); }}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                  screenListViewMode === 'table' ? 'bg-white text-indigo-700 font-black shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📊 Table
              </button>
              <button
                type="button"
                onClick={() => { soundManager?.play?.('click'); setScreenListViewMode('cards'); }}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                  screenListViewMode === 'cards' ? 'bg-white text-indigo-700 font-black shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🗂️ Cards
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                onCreateChallenge();
                soundManager?.play?.('click');
              }}
              className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-750 text-xs font-black rounded-xl border border-violet-150 flex items-center gap-1 transition cursor-pointer"
            >
              <Plus size={12} />
              Add Step Screen
            </button>
          </div>
        </div>

        {currentChallenges.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-150 rounded-2xl bg-slate-50/50">
            <span className="text-xs text-slate-400 font-medium">This lesson has no interactive question steps yet. Close and trigger "+" to build!</span>
          </div>
        ) : screenListViewMode === 'table' ? (
          /* COMPACT SCREEN TABLE */
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[10px] uppercase font-black tracking-wider text-slate-500">
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3 min-w-[150px]">Screen & Type</th>
                    <th className="py-2.5 px-3 min-w-[260px]">Content / Question Prompt</th>
                    <th className="py-2.5 px-3 min-w-[90px]">Voice</th>
                    <th className="py-2.5 px-3 min-w-[80px]">XP</th>
                    <th className="py-2.5 px-3 min-w-[140px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentChallenges.map((chal, index, arr) => {
                    const isSelected = chalId === chal.id;
                    const narrations = chal.audioNarrations || {};
                    const hasVoice = !!(narrations.english?.url || narrations.hinglish?.url || narrations.marathi?.url);

                    return (
                      <tr
                        key={chal.id}
                        onClick={() => onSelectChallenge(chal)}
                        className={`transition-colors cursor-pointer ${
                          isSelected ? 'bg-indigo-50/80 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-[10px] font-mono font-bold bg-slate-150 text-slate-650 px-1.5 py-0.5 rounded">
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-mono text-slate-400">ID: {chal.id}</span>
                            <span className="text-[9px] font-bold text-violet-750 bg-violet-50 px-1.5 py-0.5 rounded uppercase">
                              {chal.type}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="text-xs font-bold text-slate-800 line-clamp-1 max-w-md">
                            {chal.question || getChallengeLabel(chal.type)}
                          </p>
                        </td>
                        <td className="py-2.5 px-3">
                          {hasVoice ? (
                            <span className="text-[8.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5">
                              🔊 Ready
                            </span>
                          ) : (
                            <span className="text-[8.5px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              No voice
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] font-mono text-emerald-600 font-bold">
                            ★ {chal.xpValue || 10}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => onSelectChallenge(chal)}
                              className="px-2 py-1 text-[10px] font-bold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer"
                            >
                              Open
                            </button>
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={(e) => {
                                onReorderChallenge(chal.id, 'up', e);
                                soundManager?.play?.('click');
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition cursor-pointer"
                              title="Move Screen Up"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              disabled={index === arr.length - 1}
                              onClick={(e) => {
                                onReorderChallenge(chal.id, 'down', e);
                                soundManager?.play?.('click');
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition cursor-pointer"
                              title="Move Screen Down"
                            >
                              ▼
                            </button>
                            <button
                              type="button"
                              onClick={(e) => onDeleteChallenge(chal.id, e)}
                              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                              title="Delete Screen"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* CARDS VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentChallenges.map((chal, index, arr) => (
              <div 
                key={chal.id}
                onClick={() => onSelectChallenge(chal)}
                className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/10 cursor-pointer flex flex-col justify-between gap-2 shadow-3xs transition-all relative group"
              >
                <div className="min-w-0 pr-1 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-mono font-bold bg-slate-150 text-slate-655 px-1.5 py-0.5 rounded uppercase">
                      Screen {index + 1}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 truncate">ID: {chal.id}</span>
                    <span className="text-[9px] font-bold text-violet-700 uppercase bg-violet-50 px-1 rounded-md">
                      {chal.type}
                    </span>
                  </div>
                  <div className="font-extrabold text-xs text-slate-805 line-clamp-2">
                    {chal.question || getChallengeLabel(chal.type)}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                  <span className="font-mono text-emerald-600 font-semibold">★ {chal.xpValue || 10} XP</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (index > 0) {
                          onReorderChallenge(chal.id, 'up', e);
                          soundManager?.play?.('click');
                        }
                      }}
                      disabled={index === 0}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 transition cursor-pointer"
                      title="Move Screen Up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (index < arr.length - 1) {
                          onReorderChallenge(chal.id, 'down', e);
                          soundManager?.play?.('click');
                        }
                      }}
                      disabled={index === arr.length - 1}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-705 disabled:opacity-30 transition cursor-pointer"
                      title="Move Screen Down"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChallenge(chal.id, e);
                      }}
                      className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                      title="Delete Screen"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
