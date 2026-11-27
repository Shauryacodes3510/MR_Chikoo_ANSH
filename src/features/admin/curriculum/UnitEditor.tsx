import React from 'react';
import { Layers, Plus, Copy, Download, MoreVertical, Edit, Trash2, FileSpreadsheet } from 'lucide-react';
import { UnitEditorProps } from './types';
import LearningPathBuilder from '../../../components/LearningPathBuilder';

export const UnitEditor: React.FC<UnitEditorProps> = ({
  module,
  modulesList,
  practiceModulesList,
  setModulesList,
  setPracticeModulesList,
  adminWorlds,
  selectedAdminWorldId,
  modTitle,
  setModTitle,
  modDifficulty,
  setModDifficulty,
  selectedModuleWorldId,
  setSelectedModuleWorldId,
  openLessonMenuId,
  setOpenLessonMenuId,
  onSaveModuleEdits,
  onDeleteModule,
  onAddLessonInstantly,
  onSelectLesson,
  onDuplicateLesson,
  onDeleteLesson,
  onReorderLesson,
  onCopyLessonJson,
  onExportLessonJson,
  triggerNotification,
  soundManager,
  onClose,
  onOpenImportModal,
  onCopyUnitJson,
  onExportUnitJson,
  onReorderUnit,
  isModuleInSelectedWorld,
}) => {
  const isSpace = modulesList.some(m => m.id === module.id);
  const targetList = isSpace ? modulesList : practiceModulesList;
  const worldFilter = isModuleInSelectedWorld || ((m: any) => !m.world_id || m.world_id === selectedAdminWorldId || selectedAdminWorldId === 'world_1');
  const worldScoped = isSpace ? targetList.filter(worldFilter) : [...targetList];
  const currentIdx = worldScoped.findIndex(m => m.id === module.id);
  const totalCount = worldScoped.length;
  const canMoveUp = currentIdx > 0;
  const canMoveDown = currentIdx !== -1 && currentIdx < totalCount - 1;

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-2xs space-y-6 animate-fade-in animate-duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
        <div>
          <div className="text-[10px] uppercase font-black text-slate-400 font-mono tracking-widest flex items-center mb-1 pb-0.5">
            <span>UNIT MODULE SPECIFICATIONS</span>
          </div>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Layers className="text-indigo-600 animate-pulse-slow" size={18} />
            Unit Properties Configurator
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenImportModal && (
            <button
              type="button"
              onClick={() => onOpenImportModal({ level: 'unit', unitId: module.id, worldId: module.world_id })}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              title="Import another Unit via JSON"
            >
              <Plus size={13} />
              <span>Import Unit JSON</span>
            </button>
          )}
          {onCopyUnitJson && (
            <button
              type="button"
              onClick={() => onCopyUnitJson(module)}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              title="Copy Entire Unit JSON to Clipboard"
            >
              <Copy size={13} />
              <span>Copy Unit JSON</span>
            </button>
          )}
          {onExportUnitJson && (
            <button
              type="button"
              onClick={() => onExportUnitJson(module)}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              title="Download Unit JSON File"
            >
              <Download size={13} />
              <span>Download JSON</span>
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={() => {
                onClose();
                soundManager?.play?.('click');
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-905 bg-slate-100 hover:bg-slate-150 px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              Close Unit Overview
            </button>
          )}
        </div>
      </div>

      {/* Module Properties Form */}
      <form onSubmit={(e) => { e.preventDefault(); onSaveModuleEdits(e); }} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-black text-slate-500">Unit ID (Permanent)</label>
            <input 
              type="text" 
              value={module.id}
              disabled
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-400 outline-none cursor-not-allowed font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-black text-slate-500">Focus Difficulty Path</label>
            <select 
              value={modDifficulty}
              onChange={(e) => setModDifficulty(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-950 outline-none font-bold focus:border-indigo-500 cursor-pointer"
            >
              <option value="Easy">Beginner Path (Easy)</option>
              <option value="Medium">Intermediate Path (Medium)</option>
              <option value="Hard">Advanced Path (Hard)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-black text-slate-500">Unit Chapter Title</label>
            <input 
              type="text" 
              value={modTitle}
              onChange={(e) => setModTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-905 outline-none font-black focus:border-indigo-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-black text-slate-500">World: [select world]</label>
            <select
              value={selectedModuleWorldId}
              onChange={(e) => setSelectedModuleWorldId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-950 outline-none font-bold focus:border-indigo-500 cursor-pointer"
            >
              <option value="world_1">World 1 (Default)</option>
              {adminWorlds.map(w => (
                <option key={w.id} value={w.id}>
                  World {w.world_number}: {w.title} ({w.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Sequence: {currentIdx !== -1 ? `#${currentIdx + 1} of ${totalCount}` : 'Unranked'}
            </span>
            {onReorderUnit && (
              <>
                <button
                  type="button"
                  disabled={!canMoveUp}
                  onClick={(e) => onReorderUnit(module.id, 'up', e)}
                  className={`px-2 py-1 text-xs font-bold rounded-lg border transition flex items-center gap-1 ${
                    canMoveUp 
                      ? 'bg-white hover:bg-indigo-50 border-slate-200 text-slate-700 hover:text-indigo-600 shadow-3xs cursor-pointer' 
                      : 'bg-slate-100 border-slate-200 text-slate-300 opacity-40 cursor-not-allowed'
                  }`}
                  title="Move unit earlier in sequence"
                >
                  ▲ Move Earlier
                </button>
                <button
                  type="button"
                  disabled={!canMoveDown}
                  onClick={(e) => onReorderUnit(module.id, 'down', e)}
                  className={`px-2 py-1 text-xs font-bold rounded-lg border transition flex items-center gap-1 ${
                    canMoveDown 
                      ? 'bg-white hover:bg-indigo-50 border-slate-200 text-slate-700 hover:text-indigo-600 shadow-3xs cursor-pointer' 
                      : 'bg-slate-100 border-slate-200 text-slate-300 opacity-40 cursor-not-allowed'
                  }`}
                  title="Move unit later in sequence"
                >
                  ▼ Move Later
                </button>
              </>
            )}
          </div>

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-black text-[11px] uppercase tracking-wider px-6 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
          >
            Save Unit Changes
          </button>
        </div>
      </form>

      {/* Lessons list inside that Module */}
      <div className="pt-6 border-t border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
            Lesson nodes under Unit ({module.lessons?.length || 0})
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenImportModal && (
              <>
                <button
                  type="button"
                  onClick={() => onOpenImportModal({ level: 'unit', worldId: module.world_id })}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 text-xs font-black rounded-xl border border-indigo-150 flex items-center gap-1 transition cursor-pointer"
                  title="Import an entire Unit JSON"
                >
                  <Layers size={12} />
                  Import Unit JSON
                </button>
                <button
                  type="button"
                  onClick={() => onOpenImportModal({ level: 'lesson', unitId: module.id, worldId: module.world_id })}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl border border-slate-200 flex items-center gap-1 transition cursor-pointer"
                  title="Import Lesson into this Unit"
                >
                  <FileSpreadsheet size={12} />
                  Import Lesson JSON
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => onAddLessonInstantly(module.id)}
              className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-750 text-xs font-black rounded-xl border border-violet-150 flex items-center gap-1 transition cursor-pointer"
            >
              <Plus size={12} />
              Add Lesson here
            </button>
          </div>
        </div>

        {(!module.lessons || module.lessons.length === 0) ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-150 rounded-2xl bg-slate-50/50">
            <span className="text-xs text-slate-400 font-medium">No lesson nodes in this chapter unit yet. Inject your first above!</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {module.lessons.map((les, index, arr) => (
              <div 
                key={les.id}
                onClick={() => onSelectLesson(module.id, les)}
                className="bg-slate-50/40 p-4 rounded-2xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/10 cursor-pointer flex items-start justify-between gap-3 shadow-3xs transition-all relative group"
              >
                <div className="min-w-0 pr-1 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-mono font-bold bg-slate-150 text-slate-655 px-1.5 py-0.5 rounded uppercase font-mono">
                      Lesson {index + 1}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 font-mono">ID: {les.id}</span>
                    {les.category && <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1 rounded">{les.category}</span>}
                  </div>
                  <div className="font-extrabold text-xs text-slate-805 truncate mt-2">
                    {les.title}
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 block mt-1">{les.challenges?.length || 0} slide screens • ★ {les.xpReward} XP</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (index > 0) {
                        onReorderLesson(module.id, les.id, 'up');
                      }
                    }}
                    disabled={index === 0}
                    className="p-1 hover:bg-slate-105 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 transition cursor-pointer"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (index < arr.length - 1) {
                        onReorderLesson(module.id, les.id, 'down');
                      }
                    }}
                    disabled={index === arr.length - 1}
                    className="p-1 hover:bg-slate-105 rounded text-slate-400 hover:text-slate-705 disabled:opacity-30 transition cursor-pointer"
                  >
                    ▼
                  </button>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenLessonMenuId(openLessonMenuId === les.id ? null : les.id);
                        soundManager?.play?.('click');
                      }}
                      className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition"
                      title="Lesson Actions"
                    >
                      <MoreVertical size={13} />
                    </button>
                    
                    {openLessonMenuId === les.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-[99]" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenLessonMenuId(null);
                          }} 
                        />
                        <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-[100] py-1 text-left animate-fadeIn">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenLessonMenuId(null);
                              onSelectLesson(module.id, les);
                            }}
                            className="w-full px-3.5 py-2 text-[11px] font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <Edit size={12} className="text-slate-400" />
                            <span>Edit Lesson</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenLessonMenuId(null);
                              onDuplicateLesson(module.id, les);
                            }}
                            className="w-full px-3.5 py-2 text-[11px] font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <Copy size={12} className="text-slate-400" />
                            <span>Duplicate Lesson</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenLessonMenuId(null);
                              onCopyLessonJson(les);
                            }}
                            className="w-full px-3.5 py-2 text-[11px] font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <Copy size={12} className="text-slate-400" />
                            <span>Copy Lesson JSON</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenLessonMenuId(null);
                              onExportLessonJson(les);
                            }}
                            className="w-full px-3.5 py-2 text-[11px] font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <Download size={12} className="text-slate-400" />
                            <span>Export Lesson JSON</span>
                          </button>
                          <div className="border-t border-slate-100 my-1" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenLessonMenuId(null);
                              onDeleteLesson(module.id, les.id, e);
                            }}
                            className="w-full px-3.5 py-2 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 size={12} className="text-rose-450" />
                            <span>Delete Lesson</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Adventure Learning Path Builder */}
      <div className="pt-6 border-t border-slate-100">
        <LearningPathBuilder
          module={module}
          modulesList={modulesList}
          practiceModulesList={practiceModulesList}
          setModulesList={setModulesList}
          setPracticeModulesList={setPracticeModulesList}
          triggerNotification={triggerNotification}
        />
      </div>
    </div>
  );
};
