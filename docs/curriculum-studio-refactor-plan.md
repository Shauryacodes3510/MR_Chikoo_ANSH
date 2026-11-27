# Curriculum Studio Refactoring Plan

## 1. Baseline & Invariants
- **Git Branch:** `feat/curriculum-studio-extract`
- **TypeScript Baseline Check (`npx tsc --noEmit`):** **0 errors** (must remain 0 at every wave).
- **`saveCurriculumToStorage` Occurrences:**
  - `src/components/AdminPanel.tsx`: **26** (1 import + 25 call sites)
  - Full repo: **32** (including `content.ts`, `LearningPathBuilder.tsx`, `CurriculumStudio.tsx`)
  - Target invariant: The exact count across `AdminPanel.tsx` + `src/features/admin/curriculum/` must equal **26**.

---

## 2. Dependency Map: State & Handlers

| State / Handler | Studio JSX Block | Used Outside Studio? | Decision |
|---|---|---|---|
| `modulesList`, `setModulesList` | OutlineMap, OverviewPanel, UnitEditor, LessonEditor, PracticeArenaLists | Yes (Sidebar badges, Curriculum JSON, Schools, AILessonGenerator) | Stays in AdminPanel, passed as prop / provided to hook |
| `practiceModulesList`, `setPracticeModulesList` | OutlineMap, OverviewPanel, UnitEditor, LessonEditor, PracticeArenaLists | Yes (Sidebar badges, Curriculum JSON, Schools, AILessonGenerator) | Stays in AdminPanel, passed as prop / provided to hook |
| `selectedModuleId`, `setSelectedModuleId` | OutlineMap, CurriculumStudio, UnitEditor, LessonEditor, ScreenEditor | Yes (AILessonGenerator selection target) | Hook state / passed to AdminPanel |
| `selectedLessonId`, `setSelectedLessonId` | OutlineMap, CurriculumStudio, LessonEditor, ScreenEditor | Yes (AILessonGenerator selection target) | Hook state / passed to AdminPanel |
| `selectedAdminWorldId`, `setSelectedAdminWorldId` | OutlineMap, Breadcrumb Header, UnitEditor | Yes (Worlds tab, world switcher) | Stays in AdminPanel, passed as prop |
| `adminWorlds` | OutlineMap, Breadcrumb Header | Yes (Worlds tab, world creation) | Stays in AdminPanel, passed as prop |
| `curriculumSyncStatus`, `setCurriculumSyncStatus` | SyncStatusBadge, Header | No | Moves to CurriculumStudio / SyncStatusBadge |
| `mod*` (title, difficulty, targetGroup, worldId, etc.) | UnitEditor | No | Moves to `useCurriculumStudio` |
| `les*` (id, title, desc, diff, cat, xp, chest, bonus, story) | LessonEditor | No | Moves to `useCurriculumStudio` |
| `chal*` (id, type, question, options, correct, expl, points, img, pairs, bucket, timeline, classify, reveal, panels, args, code, analogy, etc.) | ScreenEditor + screen/* components | No | Moves to `useScreenForm` |
| `isOutlineCollapsed`, `setIsOutlineCollapsed` | OutlineMap, Breadcrumb toggle | No | Moves to `useCurriculumStudio` / passed as prop |
| `editorLayoutMode`, `setEditorLayoutMode` | ScreenEditor | No | Moves to `useScreenForm` / ScreenEditor |
| `lessonsSubTab`, `setLessonsSubTab` | CurriculumStudio shell | No | Moves to `useCurriculumStudio` |
| `lessonListViewMode`, `setLessonListViewMode` | LessonEditor | No | Moves to `useCurriculumStudio` |
| `screenListViewMode`, `setScreenListViewMode` | ScreenEditor | No | Moves to `useScreenForm` |
| `isStudentViewMode`, `setIsStudentViewMode` | ScreenEditor preview | No | Moves to `useScreenForm` |
| `mobileViewMode`, `setMobileViewMode` | OutlineMap, MobileStudioNav, Header | Yes (Mobile top sub-bars across tabs) | Stays in AdminPanel, passed as prop |
| `mobileNavTab`, `setMobileNavTab` | MobileStudioNav | Yes (Mobile navigation system) | Stays in AdminPanel, passed as prop |
| `openLessonMenuId`, `setOpenLessonMenuId` | OutlineMap, UnitEditor | No | Moves to `useCurriculumStudio` |
| `rawJsonText`, `setRawJsonText` | Curriculum JSON tab, updated on save | Yes (Curriculum JSON tab) | Stays in AdminPanel, passed as prop/setter |
| `handleCreateModule` | UnitEditor, OutlineMap | No | Moves to `useCurriculumStudio` |
| `handleDeleteModule` | UnitEditor, OutlineMap | No | Moves to `useCurriculumStudio` |
| `handleSaveModuleEdits` | UnitEditor | No | Moves to `useCurriculumStudio` |
| `reorderUnit`, `moveModule` | OutlineMap, UnitEditor, PracticeArenaLists | No | Moves to `useCurriculumStudio` |
| `handleCreateLesson` | LessonEditor, UnitEditor | No | Moves to `useCurriculumStudio` |
| `handleDeleteLesson` | LessonEditor, UnitEditor, OutlineMap | No | Moves to `useCurriculumStudio` |
| `handleSaveLessonEdits` | LessonEditor | No | Moves to `useCurriculumStudio` |
| `handleDuplicateLesson` | LessonEditor, UnitEditor, OutlineMap | No | Moves to `useCurriculumStudio` |
| `reorderLesson` | LessonEditor, UnitEditor, OutlineMap | No | Moves to `useCurriculumStudio` |
| `handleCreateChallenge` | ScreenEditor | No | Moves to `useScreenForm` |
| `handleDeleteChallenge` | ScreenEditor, LessonEditor | No | Moves to `useScreenForm` |
| `handleSaveChallengeEdits` | ScreenEditor | No | Moves to `useScreenForm` |
| `reorderChallenge` | ScreenEditor, LessonEditor | No | Moves to `useScreenForm` |
| `selectChallengeForEditing` | ScreenEditor, LessonEditor, OutlineMap | No | Moves to `useScreenForm` |
| `handleGenerateLessonImage`, `handleBulkGenerateImages` | OverviewPanel, LessonEditor, ScreenEditor | No | Moves to `useCurriculumStudio` / `useScreenForm` |
| `addUnitInstantly`, `addLessonInstantly` | OutlineMap, PracticeArenaLists | No | Moves to `useCurriculumStudio` |
| `createInteractiveChallenge` | LessonEditor, ScreenEditor | No | Moves to `useScreenForm` |

---

## 3. Target File Mapping & Assigned Line Ranges

| Target File | AdminPanel.tsx Source Line Range | Owner | Description |
|---|---|---|---|
| `types.ts` | 1470–1660, interfaces | Wave 1 Lead | Contract: Prop interfaces, domain types, hook return types |
| `hooks/useCurriculumStudio.ts` | 1640–1745, 2300–2400, 3350–3450, 3790–3840, 4175–4260, 4370–4560 | Wave 1 Lead | Module/lesson state & lifecycle handlers |
| `hooks/useScreenForm.ts` | 2400–2850, 2870–2915, 3670–3780, 3880–4155 | Wave 1 Lead | Challenge/screen state & builder handlers |
| `SyncStatusBadge.tsx` | 6936–6975 | Subagent-SyncStatusBadge | Save status badge (Saving/Saved/Failed retry) |
| `OutlineMap.tsx` | 5780–6609 | Subagent-OutlineMap | Left sidebar outline tree, world selector, search, collapse |
| `OverviewPanel.tsx` | 9065–9226 | Subagent-OverviewPanel | Overview stats, data source inspector, cache reload |
| `UnitEditor.tsx` | 8640–9063 | Subagent-UnitEditor | Unit details form, lessons list, LearningPathBuilder embedding |
| `LessonEditor.tsx` | 8176–8638 | Subagent-LessonEditor | Lesson details form, screens cards/table, audio trigger |
| `PracticeArenaLists.tsx` | 9228–9670 | Subagent-PracticeArenaLists | Utility buttons & Cosmic Space / Practice Arena lists |
| `MobileStudioNav.tsx` | 6614–6635, 11197–11245 | Subagent-MobileStudioNav | Mobile header sub-nav & bottom editor bar |
| `screen/ScreenEditor.tsx` | 9671–9820, 10980–11116 | Subagent-ScreenEditor | Screen editor shell, preview toggle, action bar |
| `screen/MultipleChoiceScreen.tsx` | 9820–10120 | Subagent-MCQScreen | MCQ, True/False, Tap Right, Spot AI forms |
| `screen/PairsBucketTimelineScreen.tsx` | 10120–10450 | Subagent-PairsScreen | Concept pairs, bucket sort, timeline steps |
| `screen/ImageVisualScreen.tsx` | 10450–10750 | Subagent-ImageScreen | Image classify, visual analogy, reveal, memes |
| `screen/DialogueStoryScreen.tsx` | 10750–10980 | Subagent-StoryScreen | Student story, mission, why care, arguments |
| `screen/CommonScreenFields.tsx` | Shared inputs across types | Subagent-ScreenFields | Prompt, points, explanation, audio fields |
| `CurriculumStudio.tsx` | 6885–7035, 8170–9671 | Subagent-StudioShell | Shell router: breadcrumbs, sub-navigation, panel switcher |
| `index.ts` | Barrel exports | Wave 1 Lead | Public API of `curriculum/` |

---

## 4. Execution Waves
- **Wave 0 (Plan):** Completed baseline validation and created dependency map doc.
- **Wave 1 (Contract):** Create `types.ts`, `hooks/useCurriculumStudio.ts`, `hooks/useScreenForm.ts`, test compile.
- **Wave 2 (Parallel Components):** Extract each component into its target file.
- **Wave 3 (Integration):** Wire components into `AdminPanel.tsx` one by one, verifying `npx tsc --noEmit` and `saveCurriculumToStorage` count after each step.
- **Wave 4 (Verification):** Build and functional verification.
