import React, { useState } from 'react';
import { Plus, BookOpen, Layout, Trash2, ChevronRight } from 'lucide-react';
import { PracticeArenaListsProps } from './types';

export const PracticeArenaLists: React.FC<PracticeArenaListsProps> = ({
  modulesList,
  practiceModulesList,
  onDeleteModule,
  onDeleteLesson,
  onDeleteChallenge,
  triggerConfirm,
  soundManager,
  setActiveTab,
}) => {
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({});

  const toggleModuleExpand = (id: string) => {
    soundManager?.play?.('click');
    setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleLessonExpand = (id: string) => {
    soundManager?.play?.('click');
    setExpandedLessons(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="hidden border border-amber-200 p-4">
      {/* Quick Utility Options bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <button
          onClick={() => { soundManager?.play?.('click'); setActiveTab('modules'); }}
          className="bg-white hover:bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-left text-xs text-slate-700 font-extrabold flex items-center gap-2 shadow-3xs hover:border-slate-300 transition-all cursor-pointer"
        >
          <Plus size={14} className="text-indigo-650" />
          <div>
            <div className="font-black text-slate-900 truncate">Add Unit Module</div>
            <div className="text-[10px] text-slate-400 font-normal mt-0.5">Create a top-level unit</div>
          </div>
        </button>

        <button
          onClick={() => { soundManager?.play?.('click'); setActiveTab('lessons'); }}
          className="bg-white hover:bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-left text-xs text-slate-700 font-extrabold flex items-center gap-2 shadow-3xs hover:border-slate-300 transition-all cursor-pointer"
        >
          <BookOpen size={14} className="text-violet-650" />
          <div>
            <div className="font-black text-slate-900 truncate">Add Lesson Node</div>
            <div className="text-[10px] text-slate-400 font-normal mt-0.5">Embed secondary learning page</div>
          </div>
        </button>

        <button
          onClick={() => { soundManager?.play?.('click'); setActiveTab('challenges'); }}
          className="bg-white hover:bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-left text-xs text-slate-700 font-extrabold flex items-center gap-2 shadow-3xs hover:border-slate-300 transition-all cursor-pointer"
        >
          <Layout size={14} className="text-emerald-650" />
          <div>
            <div className="font-black text-slate-900 truncate">Add Task View Screen</div>
            <div className="text-[10px] text-slate-400 font-normal mt-0.5">Embed gamified question screens</div>
          </div>
        </button>

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
          className="bg-amber-50/50 hover:bg-rose-50 border border-amber-200 hover:border-rose-200 p-3.5 rounded-xl text-left text-xs text-amber-800 hover:text-rose-800 font-extrabold flex items-center gap-2 transition-all shadow-3xs cursor-pointer"
        >
          <Trash2 size={14} className="text-amber-500 hover:text-rose-600" />
          <div>
            <div className="font-black truncate">Clear Cache & Reload</div>
            <div className="text-[10px] font-normal mt-0.5">Reload fresh from database</div>
          </div>
        </button>
      </div>

      {/* MODULE LISTS */}
      <div className="space-y-6">
        
        {/* 1. MAIN COSMIC SPACE TRAIL */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
            <h4 className="text-xs font-black uppercase text-indigo-800 tracking-wider flex items-center gap-1.5">
              <span>🪐 Cosmic Space Course Curriculum</span>
              <span className="text-[9px] font-mono bg-indigo-50 text-indigo-650 px-2 py-0.5 rounded-md font-bold">
                {modulesList.length} Units Active
              </span>
            </h4>
          </div>

          {modulesList.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border text-center text-xs text-slate-400 italic">
              There are no Cosmic Space Modules. Click "Add Unit Module" to create one!
            </div>
          ) : (
            <div className="space-y-4">
              {modulesList.map((mod) => {
                const isModExpanded = !!expandedModules[mod.id];
                const moduleLessons = mod.lessons || [];
                return (
                  <div key={mod.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                    {/* Card Header for Module */}
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60 border-b border-slate-100">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase">
                            ID: {mod.id}
                          </span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                            mod.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-600' : mod.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {mod.difficulty} Level
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-500">
                            {moduleLessons.length} lessons · {moduleLessons.reduce((acc, l) => acc + (l.challenges?.length || 0), 0)} interactive screens
                          </span>
                        </div>
                        <h5 className="text-sm font-extrabold text-slate-900 mt-1">
                          {mod.title}
                        </h5>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleModuleExpand(mod.id)}
                          className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl transition-colors flex items-center gap-1 shadow-3xs cursor-pointer"
                        >
                          {isModExpanded ? "Hide Lessons" : `View Lessons (${moduleLessons.length})`}
                          <ChevronRight size={14} className={`transform transition-transform ${isModExpanded ? 'rotate-90' : ''}`} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => onDeleteModule(mod.id, e)}
                          className="p-2 border border-rose-100 hover:border-rose-200 bg-rose-50 hover:bg-rose-100/80 rounded-xl text-rose-600 hover:text-rose-700 transition-all shadow-3xs flex items-center gap-1 px-3 py-1.5 text-xs font-black cursor-pointer"
                          title="Delete Unit"
                        >
                          <Trash2 size={13} />
                          Delete Unit & Items
                        </button>
                      </div>
                    </div>

                    {/* Nested Lessons - conditionally expanded */}
                    {isModExpanded && (
                      <div className="p-4 sm:p-5 bg-white space-y-4 border-t border-slate-100">
                        <h6 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          Nested Lessons inside &ldquo;{mod.title}&rdquo;
                        </h6>

                        {moduleLessons.length === 0 ? (
                          <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400 italic">
                            No lesson nodes yet. Choose &ldquo;Add Lesson&rdquo; tab to embed your first content!
                          </div>
                        ) : (
                          <div className="space-y-4 pl-3.5 border-l-2 border-indigo-100">
                            {moduleLessons.map((lesson) => {
                              const isLesExpanded = !!expandedLessons[lesson.id];
                              const lessonChallenges = lesson.challenges || [];
                              return (
                                <div key={lesson.id} className="bg-slate-50/40 p-4 rounded-xl border border-slate-200 space-y-3">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[9px] font-mono bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-bold">
                                          ID: {lesson.id}
                                        </span>
                                        {lesson.category && (
                                          <span className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-md">
                                            📚 {lesson.category}
                                          </span>
                                        )}
                                        <span className="text-[9.5px] font-bold text-yellow-600">
                                          ★ {lesson.xpReward} XP reward value
                                        </span>
                                      </div>
                                      <h6 className="text-xs font-black text-slate-800 mt-1">
                                        {lesson.title}
                                      </h6>
                                      <p className="text-[11px] text-slate-500 italic max-w-xl">
                                        {lesson.description}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => toggleLessonExpand(lesson.id)}
                                        className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-650 rounded-lg transition-colors flex items-center gap-1 shadow-3xs cursor-pointer"
                                      >
                                        {isLesExpanded ? "Hide Screens" : `View task screens (${lessonChallenges.length})`}
                                        <ChevronRight size={11} className={`transform transition-transform ${isLesExpanded ? 'rotate-90' : ''}`} />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => onDeleteLesson(mod.id, lesson.id, e)}
                                        className="p-1 px-1.5 border border-rose-200/50 hover:border-rose-205 bg-white hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-600 transition-all shadow-3xs flex items-center gap-1.5 text-[10px] font-extrabold cursor-pointer"
                                        title="Delete Lesson"
                                      >
                                        <Trash2 size={11} />
                                        Delete Lesson
                                      </button>
                                    </div>
                                  </div>

                                  {/* Nested tasks challenge list */}
                                  {isLesExpanded && (
                                    <div className="p-3 bg-white rounded-lg border border-slate-150 space-y-2 mt-2">
                                      <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block pb-1 border-b border-slate-100 font-mono">
                                        Interactive Question Screens ({lessonChallenges.length})
                                      </span>

                                      {lessonChallenges.length === 0 ? (
                                        <div className="text-[10px] text-slate-400 italic py-1">No screen views here yet. Click &ldquo;Add Task Screen&rdquo; tab above to build interactive queries!</div>
                                      ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                                          {lessonChallenges.map((chal, idx) => (
                                            <div key={chal.id} className="bg-slate-50/75 p-2.5 rounded-lg border border-slate-200 flex items-start justify-between gap-2.5">
                                              <div className="min-w-0">
                                                <div className="flex items-center gap-1 flex-wrap">
                                                  <span className="text-[8.5px] font-mono bg-slate-200 px-1 rounded font-bold">
                                                    S{idx + 1}
                                                  </span>
                                                  <span className="text-[8.5px] font-mono text-slate-500 font-bold truncate">
                                                    {chal.id}
                                                  </span>
                                                  <span className="text-[8.5px] bg-indigo-50 text-indigo-700 px-1 rounded uppercase font-extrabold scale-95 transform origin-left">
                                                    {chal.type}
                                                  </span>
                                                </div>
                                                <p className="text-[10.5px] font-bold text-slate-800 line-clamp-1 mt-1">
                                                  {chal.question}
                                                </p>
                                              </div>
                                              
                                              {onDeleteChallenge && (
                                                <button
                                                  type="button"
                                                  onClick={() => onDeleteChallenge(mod.id, lesson.id, chal.id)}
                                                  className="p-1 hover:bg-rose-100 hover:text-rose-600 rounded text-rose-500 transition-colors shrink-0 mt-0.5 cursor-pointer"
                                                  title="Delete Screen"
                                                >
                                                  <Trash2 size={11} />
                                                </button>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>


        {/* 2. PRACTICE ARENA POOL */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
              <span>🌿 Sandbox Practice Arena Pool</span>
              <span className="text-[9px] font-mono bg-emerald-50 text-emerald-650 px-2 py-0.5 rounded-md font-bold">
                {practiceModulesList.length} Units Active
              </span>
            </h4>
          </div>

          {practiceModulesList.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border text-center text-xs text-slate-400 italic">
              There are no Practice Arena Modules. Click "Add Unit Module" to configure sandbox pools.
            </div>
          ) : (
            <div className="space-y-4">
              {practiceModulesList.map((mod) => {
                const isModExpanded = !!expandedModules[mod.id];
                const moduleLessons = mod.lessons || [];
                return (
                  <div key={mod.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                    {/* Card Header for Module */}
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60 border-b border-slate-100">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-mono font-bold bg-slate-200 text-slate-705 px-2 py-0.5 rounded uppercase">
                            ID: {mod.id}
                          </span>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase bg-emerald-50 text-emerald-600">
                            {mod.difficulty} Level
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-500">
                            {moduleLessons.length} lessons · {moduleLessons.reduce((acc, l) => acc + (l.challenges?.length || 0), 0)} interactive screens
                          </span>
                        </div>
                        <h5 className="text-sm font-extrabold text-slate-900 mt-1">
                          {mod.title}
                        </h5>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleModuleExpand(mod.id)}
                          className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl transition-colors flex items-center gap-1 shadow-3xs cursor-pointer"
                        >
                          {isModExpanded ? "Hide Lessons" : `View Lessons (${moduleLessons.length})`}
                          <ChevronRight size={14} className={`transform transition-transform ${isModExpanded ? 'rotate-90' : ''}`} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => onDeleteModule(mod.id, e)}
                          className="p-2 border border-rose-100 hover:border-rose-200 bg-rose-50 hover:bg-rose-100/80 rounded-xl text-rose-600 hover:text-rose-700 transition-all shadow-3xs flex items-center gap-1 px-3 py-1.5 text-xs font-black cursor-pointer"
                          title="Delete Unit"
                        >
                          <Trash2 size={13} />
                          Delete Unit & Items
                        </button>
                      </div>
                    </div>

                    {/* Nested Lessons - conditionally expanded */}
                    {isModExpanded && (
                      <div className="p-4 sm:p-5 bg-white space-y-4 border-t border-slate-100">
                        <h6 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          Nested Lessons inside &ldquo;{mod.title}&rdquo;
                        </h6>

                        {moduleLessons.length === 0 ? (
                          <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400 italic">
                            No lesson nodes yet. Choose &ldquo;Add Lesson&rdquo; tab to embed your first content!
                          </div>
                        ) : (
                          <div className="space-y-4 pl-3.5 border-l-2 border-emerald-100">
                            {moduleLessons.map((lesson) => {
                              const isLesExpanded = !!expandedLessons[lesson.id];
                              const lessonChallenges = lesson.challenges || [];
                              return (
                                <div key={lesson.id} className="bg-slate-50/40 p-4 rounded-xl border border-slate-200 space-y-3">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[9px] font-mono bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-bold">
                                          ID: {lesson.id}
                                        </span>
                                        {lesson.category && (
                                          <span className="text-[9px] bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-md">
                                            📚 {lesson.category}
                                          </span>
                                        )}
                                        <span className="text-[9.5px] font-bold text-yellow-650">
                                          ★ {lesson.xpReward} XP reward value
                                        </span>
                                      </div>
                                      <h6 className="text-xs font-black text-slate-800 mt-1">
                                        {lesson.title}
                                      </h6>
                                      <p className="text-[11px] text-slate-500 italic max-w-xl">
                                        {lesson.description}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => toggleLessonExpand(lesson.id)}
                                        className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-650 rounded-lg transition-colors flex items-center gap-1 shadow-3xs cursor-pointer"
                                      >
                                        {isLesExpanded ? "Hide Screens" : `View task screens (${lessonChallenges.length})`}
                                        <ChevronRight size={11} className={`transform transition-transform ${isLesExpanded ? 'rotate-90' : ''}`} />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => onDeleteLesson(mod.id, lesson.id, e)}
                                        className="p-1 px-1.5 border border-rose-200/50 hover:border-rose-205 bg-white hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-600 transition-all shadow-3xs flex items-center gap-1.5 text-[10px] font-extrabold cursor-pointer"
                                        title="Delete Lesson"
                                      >
                                        <Trash2 size={11} />
                                        Delete Lesson
                                      </button>
                                    </div>
                                  </div>

                                  {/* Nested tasks challenge list */}
                                  {isLesExpanded && (
                                    <div className="p-3 bg-white rounded-lg border border-slate-150 space-y-2 mt-2">
                                      <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block pb-1 border-b border-slate-100 font-mono">
                                        Interactive Question Screens ({lessonChallenges.length})
                                      </span>

                                      {lessonChallenges.length === 0 ? (
                                        <div className="text-[10px] text-slate-400 italic py-1">No screen views here yet. Click &ldquo;Add Task Screen&rdquo; tab above to build interactive queries!</div>
                                      ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                                          {lessonChallenges.map((chal, idx) => (
                                            <div key={chal.id} className="bg-slate-50/75 p-2.5 rounded-lg border border-slate-200 flex items-start justify-between gap-2.5">
                                              <div className="min-w-0">
                                                <div className="flex items-center gap-1 flex-wrap">
                                                  <span className="text-[8.5px] font-mono bg-slate-200 px-1 rounded font-bold">
                                                    S{idx + 1}
                                                  </span>
                                                  <span className="text-[8.5px] font-mono text-slate-500 font-bold truncate">
                                                    {chal.id}
                                                  </span>
                                                  <span className="text-[8.5px] bg-emerald-50 text-emerald-700 px-1 rounded uppercase font-extrabold scale-95 transform origin-left">
                                                    {chal.type}
                                                  </span>
                                                </div>
                                                <p className="text-[10.5px] font-bold text-slate-800 line-clamp-1 mt-1">
                                                  {chal.question}
                                                </p>
                                              </div>
                                              
                                              {onDeleteChallenge && (
                                                <button
                                                  type="button"
                                                  onClick={() => onDeleteChallenge(mod.id, lesson.id, chal.id)}
                                                  className="p-1 hover:bg-rose-100 hover:text-rose-600 rounded text-rose-500 transition-colors shrink-0 mt-0.5 cursor-pointer"
                                                  title="Delete Screen"
                                                >
                                                  <Trash2 size={11} />
                                                </button>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
