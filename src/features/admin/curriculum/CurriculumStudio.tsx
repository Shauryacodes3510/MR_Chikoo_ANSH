import React, { useState, useEffect } from 'react';
import { Layers } from 'lucide-react';
import {
  CurriculumStudioProps,
  CurriculumSyncStatus,
  Module,
  Lesson,
  Challenge,
} from './types';
import { SyncStatusBadge } from './SyncStatusBadge';
import { OverviewPanel } from './OverviewPanel';
import { UnitEditor } from './UnitEditor';
import { LessonEditor } from './LessonEditor';
import { PracticeArenaLists } from './PracticeArenaLists';
import { ScreenEditor } from './screen/ScreenEditor';
import {
  getCurriculumSyncStatus,
  subscribeCurriculumSyncStatus,
  retryFailedCurriculumSync,
} from '../../../lib/content';

export const CurriculumStudio: React.FC<CurriculumStudioProps> = ({
  modulesList,
  practiceModulesList,
  setModulesList,
  setPracticeModulesList,
  adminWorlds,
  selectedAdminWorldId,
  activeTab,
  setActiveTab,
  selectedModuleId: propSelectedModuleId,
  setSelectedModuleId: propSetSelectedModuleId,
  selectedLessonId: propSelectedLessonId,
  setSelectedLessonId: propSetSelectedLessonId,
  isOutlineCollapsed = false,
  setIsOutlineCollapsed,
  editorLayoutMode = 'editor',
  setEditorLayoutMode,
  isStudentViewMode = false,
  setIsStudentViewMode,
  screenListViewMode = 'table',
  setScreenListViewMode,
  curriculumHook,
  screenHook,
  renderChallengePreview,
  selectedScreenForVoice,
  onSaveChallenges,
  triggerNotification,
  triggerConfirm,
  soundManager,
  isSupabaseConfigured,
  onOpenImportModal,
  onCopyUnitJson,
  onExportUnitJson,
}) => {
  const [syncStatus, setSyncStatus] = useState<CurriculumSyncStatus>(getCurriculumSyncStatus());

  useEffect(() => {
    const unsubscribe = subscribeCurriculumSyncStatus((status) => {
      setSyncStatus(status);
    });
    return () => unsubscribe();
  }, []);

  const selectedModuleId = propSelectedModuleId ?? curriculumHook?.selectedModuleId ?? '';
  const setSelectedModuleId = propSetSelectedModuleId ?? curriculumHook?.setSelectedModuleId ?? (() => {});
  const selectedLessonId = propSelectedLessonId ?? curriculumHook?.selectedLessonId ?? '';
  const setSelectedLessonId = propSetSelectedLessonId ?? curriculumHook?.setSelectedLessonId ?? (() => {});

  const currentSelectedModuleObj = [...modulesList, ...practiceModulesList].find(m => m.id === selectedModuleId);
  const currentSelectedLessonObj = currentSelectedModuleObj?.lessons.find(l => l.id === selectedLessonId);
  const currentWorld = adminWorlds.find(w => w.id === selectedAdminWorldId);

  const chalId = screenHook?.chalId || '';
  const chalType = screenHook?.chalType || '';

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Studio Breadcrumb & Context Header */}
      <div className="bg-white px-3 sm:px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          {setIsOutlineCollapsed && (
            <button
              type="button"
              onClick={() => {
                soundManager?.play?.('click');
                setIsOutlineCollapsed((prev: boolean) => !prev);
              }}
              className={`hidden md:flex px-2 py-1 rounded-lg text-xs font-bold items-center gap-1.5 transition-all cursor-pointer border ${
                isOutlineCollapsed
                  ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-3xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
              }`}
              title={isOutlineCollapsed ? "Show Curriculum Outline Map" : "Collapse Curriculum Outline for Full-Width Canvas"}
            >
              <Layers size={13} className={isOutlineCollapsed ? 'text-indigo-600' : 'text-slate-500'} />
              <span>{isOutlineCollapsed ? '▶ Show Map' : '◀ Hide Map'}</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium flex-wrap">
            <span className="text-slate-800 font-bold truncate max-w-[160px]">
              {currentWorld?.title || 'World 1'}
            </span>
            {currentSelectedModuleObj && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-slate-700 font-semibold truncate max-w-[150px]">
                  {currentSelectedModuleObj.title}
                </span>
              </>
            )}
            {currentSelectedLessonObj && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-indigo-600 font-bold truncate max-w-[180px]">
                  {currentSelectedLessonObj.title}
                </span>
              </>
            )}
            {chalId && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-slate-900 font-mono text-[11px] font-bold">
                  Screen ({chalType})
                </span>
              </>
            )}
          </div>
        </div>

        {/* Real-time Curriculum Save Status Badge */}
        <SyncStatusBadge
          status={syncStatus}
          onRetry={() => {
            soundManager?.play?.('click');
            retryFailedCurriculumSync();
          }}
        />

        {/* Context Sub-navigation pills when in Curriculum modes */}
        {['manage', 'modules', 'lessons', 'challenges'].includes(activeTab) && (
          <div className="hidden sm:flex items-center gap-1 p-0.5 bg-slate-100/80 rounded-lg border border-slate-200/60 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundManager?.play?.('click');
                setActiveTab('manage');
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'manage' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overview
            </button>

            {currentSelectedModuleObj && (
              <button
                type="button"
                onClick={() => {
                  soundManager?.play?.('click');
                  setActiveTab('modules');
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeTab === 'modules' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Unit
              </button>
            )}

            {currentSelectedLessonObj && (
              <button
                type="button"
                onClick={() => {
                  soundManager?.play?.('click');
                  setActiveTab('lessons');
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeTab === 'lessons' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Lesson
              </button>
            )}

            {currentSelectedLessonObj && (
              <button
                type="button"
                onClick={() => {
                  soundManager?.play?.('click');
                  setActiveTab('challenges');
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeTab === 'challenges' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Screen Editor ({currentSelectedLessonObj.challenges?.length || 0})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Workspace Area */}
      {['manage', 'modules', 'lessons'].includes(activeTab) && (
        <div className="space-y-6">
          {currentSelectedLessonObj ? (
            <LessonEditor
              module={currentSelectedModuleObj!}
              lesson={currentSelectedLessonObj}
              modulesList={modulesList}
              practiceModulesList={practiceModulesList}
              lesId={curriculumHook?.lesId || currentSelectedLessonObj.id}
              lesTitle={curriculumHook?.lesTitle || currentSelectedLessonObj.title}
              setLesTitle={curriculumHook?.setLesTitle || (() => {})}
              lesDescription={curriculumHook?.lesDescription || currentSelectedLessonObj.description}
              setLesDescription={curriculumHook?.setLesDescription || (() => {})}
              lesDifficulty={curriculumHook?.lesDifficulty || currentSelectedLessonObj.difficulty}
              setLesDifficulty={curriculumHook?.setLesDifficulty || (() => {})}
              lesCategory={curriculumHook?.lesCategory || (currentSelectedLessonObj as any).category || ''}
              setLesCategory={curriculumHook?.setLesCategory || (() => {})}
              lesXpReward={curriculumHook?.lesXpReward || currentSelectedLessonObj.xpReward || 50}
              setLesXpReward={curriculumHook?.setLesXpReward || (() => {})}
              lesChestIconUrl={curriculumHook?.lesChestIconUrl || (currentSelectedLessonObj as any).chestIconUrl || ''}
              setLesChestIconUrl={curriculumHook?.setLesChestIconUrl || (() => {})}
              lesLinkedUnitId={curriculumHook?.lesLinkedUnitId || (currentSelectedLessonObj as any).linkedUnitId || ''}
              setLesLinkedUnitId={curriculumHook?.setLesLinkedUnitId || (() => {})}
              screenListViewMode={screenListViewMode}
              setScreenListViewMode={setScreenListViewMode || (() => {})}
              onSaveLessonEdits={curriculumHook?.handleSaveLessonEdits || (() => {})}
              onBackToUnit={() => {
                setSelectedLessonId('');
                soundManager?.play?.('click');
              }}
              onCreateChallenge={() => {
                setActiveTab('challenges');
                screenHook?.setChalId('');
              }}
              onSelectChallenge={(chal: Challenge) => {
                screenHook?.selectChallengeForEditing(currentSelectedModuleObj!.id, currentSelectedLessonObj.id, chal);
                setActiveTab('challenges');
              }}
              onDeleteChallenge={(chalIdToDelete: string, e?: React.MouseEvent) => {
                screenHook?.handleDeleteChallenge(currentSelectedModuleObj!.id, currentSelectedLessonObj.id, chalIdToDelete, e);
              }}
              onReorderChallenge={(chalIdToReorder: string, direction: 'up' | 'down', e?: React.MouseEvent) => {
                screenHook?.reorderChallenge(currentSelectedModuleObj!.id, currentSelectedLessonObj.id, chalIdToReorder, direction, e);
              }}
              soundManager={soundManager}
              chalId={chalId}
            />
          ) : currentSelectedModuleObj ? (
            <UnitEditor
              module={currentSelectedModuleObj}
              modulesList={modulesList}
              practiceModulesList={practiceModulesList}
              setModulesList={setModulesList}
              setPracticeModulesList={setPracticeModulesList}
              adminWorlds={adminWorlds}
              selectedAdminWorldId={selectedAdminWorldId}
              modTitle={curriculumHook?.modTitle || currentSelectedModuleObj.title}
              setModTitle={curriculumHook?.setModTitle || (() => {})}
              modDifficulty={curriculumHook?.modDifficulty || currentSelectedModuleObj.difficulty}
              setModDifficulty={curriculumHook?.setModDifficulty || (() => {})}
              selectedModuleWorldId={curriculumHook?.selectedModuleWorldId || currentSelectedModuleObj.world_id || 'world_1'}
              setSelectedModuleWorldId={curriculumHook?.setSelectedModuleWorldId || (() => {})}
              openLessonMenuId={curriculumHook?.openLessonMenuId || null}
              setOpenLessonMenuId={curriculumHook?.setOpenLessonMenuId || (() => {})}
              onSaveModuleEdits={curriculumHook?.handleSaveModuleEdits || (() => {})}
              onDeleteModule={curriculumHook?.handleDeleteModule || (() => {})}
              onAddLessonInstantly={curriculumHook?.addLessonInstantly || (() => {})}
              onSelectLesson={(modId: string, les: Lesson) => {
                curriculumHook?.selectLessonProperty(modId, les);
              }}
              onDuplicateLesson={curriculumHook?.handleDuplicateLesson || (() => {})}
              onDeleteLesson={curriculumHook?.handleDeleteLesson || (() => {})}
              onReorderLesson={curriculumHook?.reorderLesson || (() => {})}
              onCopyLessonJson={curriculumHook?.copyLessonJsonToClipboard || (() => {})}
              onExportLessonJson={curriculumHook?.exportLessonAsJsonFile || (() => {})}
              triggerNotification={triggerNotification}
              soundManager={soundManager}
              onClose={() => {
                setSelectedModuleId('');
                soundManager?.play?.('click');
              }}
              onOpenImportModal={onOpenImportModal}
              onCopyUnitJson={onCopyUnitJson}
              onExportUnitJson={onExportUnitJson}
              onReorderUnit={curriculumHook?.reorderUnit}
            />
          ) : (
            <>
              <OverviewPanel
                modulesList={modulesList}
                practiceModulesList={practiceModulesList}
                isSupabaseConfigured={isSupabaseConfigured}
                isGeneratingAllImages={curriculumHook?.isGeneratingAllImages || false}
                onBulkGenerateImages={curriculumHook?.handleBulkGenerateImages || (() => {})}
                triggerConfirm={triggerConfirm}
                soundManager={soundManager}
              />
              <PracticeArenaLists
                modulesList={modulesList}
                practiceModulesList={practiceModulesList}
                onDeleteModule={curriculumHook?.handleDeleteModule || (() => {})}
                onDeleteLesson={curriculumHook?.handleDeleteLesson || (() => {})}
                onDeleteChallenge={(modId, lesId, cId) => {
                  screenHook?.handleDeleteChallenge(modId, lesId, cId);
                }}
                onAddUnitInstantly={curriculumHook?.addUnitInstantly || (() => {})}
                triggerConfirm={triggerConfirm}
                soundManager={soundManager}
                setActiveTab={setActiveTab}
              />
            </>
          )}
        </div>
      )}

      {activeTab === 'challenges' && (
        <ScreenEditor
          module={currentSelectedModuleObj!}
          lesson={currentSelectedLessonObj!}
          challenge={currentSelectedLessonObj?.challenges?.find(c => c.id === chalId)!}
          modulesList={modulesList}
          practiceModulesList={practiceModulesList}
          editorLayoutMode={editorLayoutMode}
          setEditorLayoutMode={setEditorLayoutMode || (() => {})}
          isStudentViewMode={isStudentViewMode}
          setIsStudentViewMode={setIsStudentViewMode || (() => {})}
          screenForm={screenHook}
          renderChallengePreview={renderChallengePreview}
          selectedScreenForVoice={selectedScreenForVoice}
          onSaveChallenges={onSaveChallenges}
          screenListViewMode={screenListViewMode}
          setScreenListViewMode={setScreenListViewMode}
          onBackToLesson={() => {
            setActiveTab('lessons');
            soundManager?.play?.('click');
          }}
          onDeleteChallenge={(cId: string) => {
            if (currentSelectedModuleObj && currentSelectedLessonObj) {
              screenHook?.handleDeleteChallenge(currentSelectedModuleObj.id, currentSelectedLessonObj.id, cId);
            }
          }}
          triggerNotification={triggerNotification}
          soundManager={soundManager}
        />
      )}
    </div>
  );
};
