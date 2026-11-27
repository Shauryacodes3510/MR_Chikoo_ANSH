import React from 'react';
import {
  Globe,
  Copy,
  Download,
  ChevronRight,
  Plus,
  Layers,
  Search,
  Layout,
  MoreVertical,
  Edit,
  Trash2,
} from 'lucide-react';
import { OutlineMapProps } from './types';
import { getChallengeIcon, getChallengeLabel, cleanEntityForExport } from './utils';

export const OutlineMap: React.FC<OutlineMapProps> = ({
  modulesList,
  practiceModulesList,
  adminWorlds,
  selectedAdminWorldId,
  setSelectedAdminWorldId,
  selectedModuleId,
  setSelectedModuleId,
  selectedLessonId,
  setSelectedLessonId,
  chalId,
  setChalId,
  setSelectedModuleWorldId,
  searchQuery,
  setSearchQuery,
  isOutlineCollapsed,
  setIsOutlineCollapsed,
  mobileViewMode,
  openLessonMenuId,
  setOpenLessonMenuId,
  onSelectModule,
  onSelectLesson,
  onSelectChallenge,
  onDuplicateLesson,
  onDeleteLesson,
  onDeleteModule,
  onDeleteChallenge,
  onAddUnitInstantly,
  onAddLessonInstantly,
  onCopyLessonJson,
  onExportLessonJson,
  onCopyUnitJson,
  onExportUnitJson,
  onCopyWorldJson,
  onExportWorldJson,
  onOpenImportModal,
  onOpenScreenPicker,
  onReorderUnit,
  onSaveOrder,
  isOrderChanged = false,
  isModuleInSelectedWorld,
  triggerNotification,
  soundManager,
}) => {
  const currentWorld = adminWorlds.find(w => w.id === selectedAdminWorldId);
  const isW1 = selectedAdminWorldId === 'world_1' || currentWorld?.world_number === 1;

  const moduleInWorldFilter = isModuleInSelectedWorld || ((mod: any) => {
    if (!mod.world_id) return isW1;
    if (mod.world_id === selectedAdminWorldId) return true;
    if (isW1 && mod.world_id === 'world_1') return true;
    if (isW1 && currentWorld && mod.world_id === currentWorld.id) return true;
    return false;
  });

  const filteredSpaceModules = modulesList.filter(moduleInWorldFilter);
  const filteredPracticeModules = practiceModulesList;

  return (
    <aside
      className={`w-full md:w-80 lg:w-[350px] border-r border-slate-200/80 bg-white flex flex-col h-full shrink-0 z-20 ${
        mobileViewMode === 'map' ? 'flex' : (isOutlineCollapsed ? 'hidden' : 'hidden md:flex')
      }`}
    >
      {/* World Selector Card */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/70 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="adminWorldSelector" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 select-none shrink-0">
            <Globe size={14} className="text-indigo-600" />
            <span>World:</span>
          </label>
          <div className="relative flex-1">
            <select
              id="adminWorldSelector"
              value={selectedAdminWorldId}
              onChange={(e) => {
                const nextWorldId = e.target.value;
                soundManager?.play?.('click');
                setSelectedAdminWorldId(nextWorldId);
                setSelectedModuleWorldId?.(nextWorldId);

                const cWorld = adminWorlds.find(w => w.id === nextWorldId);
                const isWorld1 = nextWorldId === 'world_1' || cWorld?.world_number === 1;
                const firstInWorld = [...modulesList, ...practiceModulesList].find(m => {
                  if (m.world_id === nextWorldId) return true;
                  if (isWorld1) return !m.world_id || m.world_id === 'world_1' || (!!cWorld && m.world_id === cWorld.id);
                  return false;
                });
                if (firstInWorld) {
                  setSelectedModuleId(firstInWorld.id);
                  setSelectedLessonId(firstInWorld.lessons?.[0]?.id || '');
                } else {
                  setSelectedModuleId('');
                  setSelectedLessonId('');
                }
                setChalId?.('');
              }}
              className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 text-slate-900 text-xs font-bold rounded-lg px-2.5 py-1.5 shadow-3xs focus:outline-none cursor-pointer truncate transition-all"
            >
              {adminWorlds.length === 0 ? (
                <option value="world_1">World 1: AI Foundations</option>
              ) : (
                adminWorlds.map((w) => (
                  <option key={w.id} value={w.id}>
                    World {w.world_number}: {w.title}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onCopyWorldJson && (
              <button
                type="button"
                onClick={() => onCopyWorldJson(selectedAdminWorldId)}
                className="p-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-600 hover:text-indigo-600 transition-colors shadow-3xs cursor-pointer"
                title="Copy Entire World JSON to Clipboard"
              >
                <Copy size={13} />
              </button>
            )}
            {onExportWorldJson && (
              <button
                type="button"
                onClick={() => onExportWorldJson(selectedAdminWorldId)}
                className="p-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-600 hover:text-indigo-600 transition-colors shadow-3xs cursor-pointer"
                title="Download Entire World JSON File"
              >
                <Download size={13} />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                soundManager?.play?.('click');
                setIsOutlineCollapsed(true);
              }}
              className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors shadow-3xs cursor-pointer"
              title="Collapse Outline Sidebar"
            >
              <ChevronRight size={13} className="rotate-180" />
            </button>
          </div>
        </div>
      </div>

      {/* Search and Action Bar */}
      <div className="p-3 border-b border-slate-100 space-y-2 shrink-0 bg-white">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500">
            {filteredSpaceModules.length + filteredPracticeModules.length} Units · {
              filteredSpaceModules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) +
              filteredPracticeModules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)
            } Lessons
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {onOpenImportModal && (
              <>
                <button
                  type="button"
                  onClick={() => onOpenImportModal({ level: 'unit' })}
                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-indigo-150"
                  title="Import Unit directly via JSON"
                >
                  <Layers size={12} />
                  <span>Import Unit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenImportModal()}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Import JSON (Screen / Lesson / Unit / World)"
                >
                  <Plus size={12} />
                  <span>Import</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                soundManager?.play?.('click');
                onAddUnitInstantly('space');
              }}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-3xs transition-colors cursor-pointer"
              title="Create Blank Unit"
            >
              <Plus size={12} />
              <span>+ Unit</span>
            </button>
          </div>
        </div>

        <div className="relative text-slate-400 focus-within:text-indigo-600">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" size={13} />
          <input
            type="text"
            placeholder="Filter units, lessons, screens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-500 transition-all font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { soundManager?.play?.('click'); setSearchQuery(''); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Scrolling tree list of Modules and Lessons */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Cosmos Curriculum Modules Section */}
        <div className="space-y-3">
          <div className="text-[10px] uppercase font-black tracking-widest text-indigo-505 border-b border-indigo-50 pb-1 flex justify-between items-center">
            <span>🪐 COSMIC SPACE CURRICULUM</span>
            <div className="flex gap-2">
              {isOrderChanged && onSaveOrder && (
                <button onClick={onSaveOrder} className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded shadow-sm hover:bg-indigo-700 cursor-pointer">
                  SAVE ORDER
                </button>
              )}
              <span className="text-[9px] font-mono bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">Core Course</span>
            </div>
          </div>
          
          {filteredSpaceModules.length === 0 ? (
            <div className="p-3 text-xs text-slate-400 italic bg-slate-50 rounded-xl text-center">No modules configured or matches.</div>
          ) : (
            filteredSpaceModules.map((mod, modIdx) => {
              const isSelectedMod = selectedModuleId === mod.id && !selectedLessonId;
              const isAnyUnderModSelected = selectedModuleId === mod.id;
              return (
                <div 
                  key={`space-mod-${mod.id}-${modIdx}`} 
                  onClick={() => onSelectModule(mod)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelectedMod 
                      ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-100/50 shadow-xs' 
                      : isAnyUnderModSelected
                      ? 'bg-slate-50/80 border-slate-300'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[8px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-bold uppercase">
                          ID: {mod.id}
                        </span>
                        <span className="text-[8px] font-mono font-black bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded" title={`Unit position #${modIdx + 1} in this world`}>
                          #{modIdx + 1}
                        </span>
                        {onReorderUnit && (
                          <div className="inline-flex items-center rounded-md border border-slate-200 bg-white shadow-3xs overflow-hidden">
                            <button 
                              type="button"
                              disabled={modIdx === 0}
                              onClick={(e) => { e.stopPropagation(); onReorderUnit(mod.id, 'up', e); }} 
                              className={`px-1.5 py-0.5 text-[10px] transition cursor-pointer ${
                                modIdx === 0 ? 'text-slate-300 opacity-30 cursor-not-allowed' : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 font-black'
                              }`}
                              title={modIdx === 0 ? "First unit in this world" : "Move unit up in sequence"}
                            >
                              ▲
                            </button>
                            <div className="w-[1px] h-3 bg-slate-200" />
                            <button 
                              type="button"
                              disabled={modIdx === filteredSpaceModules.length - 1}
                              onClick={(e) => { e.stopPropagation(); onReorderUnit(mod.id, 'down', e); }} 
                              className={`px-1.5 py-0.5 text-[10px] transition cursor-pointer ${
                                modIdx === filteredSpaceModules.length - 1 ? 'text-slate-300 opacity-30 cursor-not-allowed' : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 font-black'
                              }`}
                              title={modIdx === filteredSpaceModules.length - 1 ? "Last practice unit" : "Move unit down in sequence"}
                            >
                              ▼
                            </button>
                          </div>
                        )}
                        <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded uppercase ${
                          mod.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-600' : mod.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {mod.difficulty}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-xs text-slate-900 mt-1.5 truncate">
                        {mod.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddLessonInstantly(mod.id);
                        }}
                        className="px-1.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-850 rounded-lg text-[9px] font-extrabold border border-indigo-150 flex items-center gap-0.5 transition-all cursor-pointer"
                        title="Add Lesson node instantly inside this Unit"
                      >
                        <Plus size={10} className="stroke-[2.5px]" />
                        <span>+ Lesson</span>
                      </button>
                      {onCopyUnitJson && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCopyUnitJson(mod);
                          }}
                          className="p-1 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors shrink-0 cursor-pointer"
                          title="Copy Unit JSON"
                        >
                          <Copy size={12} />
                        </button>
                      )}
                      {onExportUnitJson && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onExportUnitJson(mod);
                          }}
                          className="p-1 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors shrink-0 cursor-pointer"
                          title="Download Unit JSON File"
                        >
                          <Download size={12} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteModule(mod.id, e);
                        }}
                        className="p-1 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors shrink-0 cursor-pointer"
                        title="Delete Unit"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Nested Lessons lists */}
                  <div className="mt-3 pl-3 border-l border-slate-200 space-y-1.5">
                    {mod.lessons.filter(l => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      const modMatches = mod.title.toLowerCase().includes(q) || mod.id.toLowerCase().includes(q);
                      const lesMatches = l.title.toLowerCase().includes(q) || l.id.toLowerCase().includes(q) || (l.challenges || []).some(c => c.question?.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
                      return modMatches || lesMatches;
                    }).map((lesson, lesIdx) => {
                      const isSelectedLes = selectedLessonId === lesson.id && !chalId;
                      const isAnyUnderLesSelected = selectedLessonId === lesson.id;
                      return (
                        <div
                          key={`space-les-${lesson.id}-${lesIdx}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectLesson(mod.id, lesson);
                          }}
                          className={`p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            isSelectedLes
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-805 font-black shadow-3xs'
                              : isAnyUnderLesSelected
                              ? 'bg-slate-50 border-slate-250 text-slate-905'
                              : 'bg-white border-slate-150 hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="min-w-0 pr-1 flex-1">
                              <div className="text-[8.5px] font-bold text-slate-400 font-mono flex items-center gap-1 flex-wrap">
                                <span>ID: {lesson.id}</span>
                                {lesson.category && (
                                  <span className="bg-slate-100 text-slate-600 px-1 rounded transform scale-95 origin-left">
                                    📚 {lesson.category}
                                  </span>
                                )}
                              </div>
                              <div className="truncate mt-0.5 font-bold">{lesson.title}</div>
                              <div className="text-[8.5px] font-medium text-slate-400 mt-0.5 flex items-center gap-1">
                                <Layout size={9} /> {lesson.challenges?.length || 0} screens • {lesson.xpReward || 50} XP
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              {onOpenScreenPicker && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedModuleId(mod.id);
                                    setSelectedLessonId(lesson.id);
                                    onOpenScreenPicker({ moduleId: mod.id, lessonId: lesson.id });
                                    soundManager?.play?.('click');
                                  }}
                                  className="px-1 py-0.5 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded text-[8px] font-black border border-violet-150 flex items-center gap-0.5 transition cursor-pointer"
                                  title="Add Interactive Slide Screen"
                                >
                                  <Plus size={8} />
                                  <span>Screen</span>
                                </button>
                              )}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenLessonMenuId(openLessonMenuId === lesson.id ? null : lesson.id);
                                    soundManager?.play?.('click');
                                  }}
                                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer"
                                  title="Lesson Actions"
                                >
                                  <MoreVertical size={13} />
                                </button>
                                
                                {openLessonMenuId === lesson.id && (
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
                                          onSelectLesson(mod.id, lesson);
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
                                          onDuplicateLesson(mod.id, lesson);
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
                                          onCopyLessonJson(lesson);
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
                                          onExportLessonJson(lesson);
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
                                          onDeleteLesson(mod.id, lesson.id, e);
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

                          {/* Nested Screens under selected Lesson */}
                          {isAnyUnderLesSelected && lesson.challenges && lesson.challenges.length > 0 && (
                            <div className="mt-2 pt-1.5 pl-2.5 border-t border-slate-100/50 space-y-1">
                              {lesson.challenges.filter(c => {
                                if (!searchQuery) return true;
                                const q = searchQuery.toLowerCase();
                                const modMatches = mod.title.toLowerCase().includes(q) || mod.id.toLowerCase().includes(q);
                                const lesMatches = lesson.title.toLowerCase().includes(q) || lesson.id.toLowerCase().includes(q);
                                const chalMatches = c.question?.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
                                return modMatches || lesMatches || chalMatches;
                              }).map((chItem, chIdx) => {
                                const isSelectedChal = chalId === chItem.id;
                                return (
                                  <div
                                    key={chItem.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectChallenge(mod.id, lesson.id, chItem);
                                    }}
                                    className={`group/screen flex items-center justify-between text-[11px] p-1.5 rounded-lg border transition-all cursor-pointer ${
                                      isSelectedChal
                                        ? 'bg-violet-50 border-violet-250 text-violet-900 font-extrabold shadow-3xs'
                                        : 'bg-white border-slate-100 hover:border-slate-200 text-slate-500 hover:text-slate-800'
                                    }`}
                                  >
                                    <div className="min-w-0 pr-1 flex-1 flex items-center gap-1.5">
                                      <span className="text-[10px] shrink-0">
                                        {getChallengeIcon(chItem.type)}
                                      </span>
                                      <span className="truncate">
                                        {chIdx + 1}. {chItem.question || getChallengeLabel(chItem.type)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover/screen:opacity-100 shrink-0">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const cleanJson = cleanEntityForExport('screen', chItem);
                                          navigator.clipboard.writeText(JSON.stringify(cleanJson, null, 2));
                                          triggerNotification("Screen JSON copied to clipboard!", "success");
                                          soundManager?.play?.('complete');
                                        }}
                                        className="p-0.5 hover:bg-violet-50 rounded text-slate-450 hover:text-violet-600 transition-colors cursor-pointer"
                                        title="Copy Screen JSON"
                                      >
                                        <Copy size={9} />
                                      </button>
                                      {onDeleteChallenge && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteChallenge(mod.id, lesson.id, chItem.id);
                                          }}
                                          className="p-0.5 hover:bg-rose-50 rounded text-rose-500 transition-colors cursor-pointer"
                                          title="Remove screen"
                                        >
                                          <Trash2 size={10} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {mod.lessons.length === 0 && (
                      <div className="text-[10px] text-slate-400 italic py-1 pl-1">No lessons added yet.</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Practice Arena Pool Section */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="text-[10px] uppercase font-black tracking-widest text-emerald-650 border-b border-slate-100 pb-1.5 flex justify-between items-center">
            <span>🌿 PRACTICE ARENA POOL</span>
            <span className="text-[9px] font-mono bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">Sandbox Mode</span>
          </div>

          {filteredPracticeModules.length === 0 ? (
            <div className="p-3 text-xs text-slate-400 italic bg-slate-50 rounded-xl text-center">No practice modules or matches.</div>
          ) : (
            filteredPracticeModules.map((mod, pModIdx) => {
              const isSelectedMod = selectedModuleId === mod.id && !selectedLessonId;
              const isAnyUnderModSelected = selectedModuleId === mod.id;
              return (
                <div 
                  key={`prac-mod-${mod.id}-${pModIdx}`} 
                  onClick={() => onSelectModule(mod)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelectedMod 
                      ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-100/50 shadow-xs' 
                      : isAnyUnderModSelected
                      ? 'bg-slate-50/80 border-slate-250'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[8px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-bold uppercase">
                          ID: {mod.id}
                        </span>
                        <span className="text-[8px] font-mono font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded" title={`Practice unit #${pModIdx + 1}`}>
                          #{pModIdx + 1}
                        </span>
                        {onReorderUnit && (
                          <div className="inline-flex items-center rounded-md border border-slate-200 bg-white shadow-3xs overflow-hidden">
                            <button 
                              type="button"
                              disabled={pModIdx === 0}
                              onClick={(e) => { e.stopPropagation(); onReorderUnit(mod.id, 'up', e); }} 
                              className={`px-1.5 py-0.5 text-[10px] transition cursor-pointer ${
                                pModIdx === 0 ? 'text-slate-300 opacity-30 cursor-not-allowed' : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 font-black'
                              }`}
                              title={pModIdx === 0 ? "First practice unit" : "Move practice unit up"}
                            >
                              ▲
                            </button>
                            <div className="w-[1px] h-3 bg-slate-200" />
                            <button 
                              type="button"
                              disabled={pModIdx === filteredPracticeModules.length - 1}
                              onClick={(e) => { e.stopPropagation(); onReorderUnit(mod.id, 'down', e); }} 
                              className={`px-1.5 py-0.5 text-[10px] transition cursor-pointer ${
                                pModIdx === filteredPracticeModules.length - 1 ? 'text-slate-300 opacity-30 cursor-not-allowed' : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 font-black'
                              }`}
                              title={pModIdx === filteredPracticeModules.length - 1 ? "Last practice unit" : "Move practice unit down"}
                            >
                              ▼
                            </button>
                          </div>
                        )}
                        <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded uppercase bg-emerald-50 text-emerald-600">
                          {mod.difficulty}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-xs text-slate-900 mt-1.5 truncate">
                        {mod.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddLessonInstantly(mod.id);
                        }}
                        className="px-1.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-850 rounded-lg text-[9px] font-extrabold border border-emerald-150 flex items-center gap-0.5 transition-all cursor-pointer"
                        title="Add Lesson"
                      >
                        <Plus size={10} className="stroke-[2.5px]" />
                        <span>+ Lesson</span>
                      </button>
                      {onCopyUnitJson && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCopyUnitJson(mod);
                          }}
                          className="p-1 hover:bg-emerald-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors shrink-0 cursor-pointer"
                          title="Copy Unit JSON"
                        >
                          <Copy size={12} />
                        </button>
                      )}
                      {onExportUnitJson && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onExportUnitJson(mod);
                          }}
                          className="p-1 hover:bg-emerald-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors shrink-0 cursor-pointer"
                          title="Download Unit JSON File"
                        >
                          <Download size={12} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteModule(mod.id, e);
                        }}
                        className="p-1 px-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors shrink-0 cursor-pointer"
                        title="Delete Unit"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Nested Lessons lists */}
                  <div className="mt-3 pl-3 border-l border-emerald-150 space-y-1.5">
                    {mod.lessons.filter(l => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      const modMatches = mod.title.toLowerCase().includes(q) || mod.id.toLowerCase().includes(q);
                      const lesMatches = l.title.toLowerCase().includes(q) || l.id.toLowerCase().includes(q) || (l.challenges || []).some(c => c.question?.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
                      return modMatches || lesMatches;
                    }).map((lesson, pLesIdx) => {
                      const isSelectedLes = selectedLessonId === lesson.id && !chalId;
                      const isAnyUnderLesSelected = selectedLessonId === lesson.id;
                      return (
                        <div
                          key={`prac-les-${lesson.id}-${pLesIdx}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectLesson(mod.id, lesson);
                          }}
                          className={`p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            isSelectedLes
                              ? 'bg-white border-emerald-350 text-emerald-805 font-bold shadow-3xs'
                              : isAnyUnderLesSelected
                              ? 'bg-slate-50 border-slate-250 text-slate-905'
                              : 'bg-slate-50/40 border-slate-150 hover:bg-slate-50 text-slate-600 hover:text-slate-950'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="min-w-0 pr-1 flex-1">
                              <div className="text-[8.5px] font-bold text-slate-450 font-mono flex items-center gap-1 flex-wrap">
                                <span>ID: {lesson.id}</span>
                                {lesson.category && (
                                  <span className="bg-slate-200/50 text-slate-600 px-1 rounded transform scale-95 origin-left">
                                    📚 {lesson.category}
                                  </span>
                                )}
                              </div>
                              <div className="truncate mt-0.5 font-bold">{lesson.title}</div>
                              <div className="text-[8.5px] font-medium text-slate-400 mt-0.5 flex items-center gap-1">
                                <Layout size={9} /> {lesson.challenges?.length || 0} screens • {lesson.xpReward || 50} XP
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              {onOpenScreenPicker && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedModuleId(mod.id);
                                    setSelectedLessonId(lesson.id);
                                    onOpenScreenPicker({ moduleId: mod.id, lessonId: lesson.id });
                                    soundManager?.play?.('click');
                                  }}
                                  className="px-1 py-0.5 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded text-[8px] font-black border border-violet-150 flex items-center gap-0.5 transition cursor-pointer"
                                  title="Add Interactive Slide Screen"
                                >
                                  <Plus size={8} />
                                  <span>Screen</span>
                                </button>
                              )}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenLessonMenuId(openLessonMenuId === lesson.id ? null : lesson.id);
                                    soundManager?.play?.('click');
                                  }}
                                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer"
                                  title="Lesson Actions"
                                >
                                  <MoreVertical size={13} />
                                </button>
                                
                                {openLessonMenuId === lesson.id && (
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
                                          onSelectLesson(mod.id, lesson);
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
                                          onDuplicateLesson(mod.id, lesson);
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
                                          onCopyLessonJson(lesson);
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
                                          onExportLessonJson(lesson);
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
                                          onDeleteLesson(mod.id, lesson.id, e);
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

                          {/* Nested Screens under selected Lesson */}
                          {isAnyUnderLesSelected && lesson.challenges && lesson.challenges.length > 0 && (
                            <div className="mt-2 pt-1.5 pl-2.5 border-t border-slate-100/50 space-y-1">
                              {lesson.challenges.filter(c => {
                                if (!searchQuery) return true;
                                const q = searchQuery.toLowerCase();
                                const modMatches = mod.title.toLowerCase().includes(q) || mod.id.toLowerCase().includes(q);
                                const lesMatches = lesson.title.toLowerCase().includes(q) || lesson.id.toLowerCase().includes(q);
                                const chalMatches = c.question?.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
                                return modMatches || lesMatches || chalMatches;
                              }).map((chItem, chIdx) => {
                                const isSelectedChal = chalId === chItem.id;
                                return (
                                  <div
                                    key={`prac-chal-${chItem.id}-${chIdx}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectChallenge(mod.id, lesson.id, chItem);
                                    }}
                                    className={`group/screen flex items-center justify-between text-[11px] p-1.5 rounded-lg border transition-all cursor-pointer ${
                                      isSelectedChal
                                        ? 'bg-violet-50 border-violet-250 text-violet-900 font-extrabold shadow-3xs'
                                        : 'bg-white border-slate-100 hover:border-slate-200 text-slate-505 hover:text-slate-805'
                                    }`}
                                  >
                                    <div className="min-w-0 pr-1 flex-1 flex items-center gap-1.5">
                                      <span className="text-[10px] shrink-0">
                                        {getChallengeIcon(chItem.type)}
                                      </span>
                                      <span className="truncate">
                                        {chIdx + 1}. {chItem.question || getChallengeLabel(chItem.type)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover/screen:opacity-100 shrink-0">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const cleanJson = cleanEntityForExport('screen', chItem);
                                          navigator.clipboard.writeText(JSON.stringify(cleanJson, null, 2));
                                          triggerNotification("Screen JSON copied to clipboard!", "success");
                                          soundManager?.play?.('complete');
                                        }}
                                        className="p-0.5 hover:bg-violet-50 rounded text-slate-450 hover:text-violet-600 transition-colors cursor-pointer"
                                        title="Copy Screen JSON"
                                      >
                                        <Copy size={9} />
                                      </button>
                                      {onDeleteChallenge && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteChallenge(mod.id, lesson.id, chItem.id);
                                          }}
                                          className="p-0.5 hover:bg-rose-550 rounded text-rose-500 transition-colors animate-fadeIn cursor-pointer"
                                          title="Remove screen"
                                        >
                                          <Trash2 size={10} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {mod.lessons.length === 0 && (
                      <div className="text-[10px] text-slate-405 italic py-1 pl-1">No lessons defined here.</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </aside>
  );
};
