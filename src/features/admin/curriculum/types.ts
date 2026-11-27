import React from 'react';
import { Module, Lesson, Challenge, ChallengeType, CurriculumSyncStatus } from '../../../lib/content';
import { World } from '../../../lib/supabase';

export type { Module, Lesson, Challenge, ChallengeType, CurriculumSyncStatus, World };

export type EditorLayoutMode = 'editor' | 'split' | 'preview';
export type MobileViewMode = 'map' | 'editor';
export type ListViewMode = 'table' | 'cards';

// -------------------------------------------------------------
// Component Props Contracts
// -------------------------------------------------------------

export interface SyncStatusBadgeProps {
  status: CurriculumSyncStatus;
  onRetry: () => void;
  className?: string;
}

export interface OutlineMapProps {
  modulesList: Module[];
  practiceModulesList: Module[];
  adminWorlds: World[];
  selectedAdminWorldId: string;
  setSelectedAdminWorldId: (id: string) => void;
  selectedModuleId: string;
  setSelectedModuleId: (id: string) => void;
  selectedLessonId: string;
  setSelectedLessonId: (id: string) => void;
  chalId: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isOutlineCollapsed: boolean;
  setIsOutlineCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileViewMode: MobileViewMode;
  setMobileViewMode: (mode: MobileViewMode) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openLessonMenuId: string | null;
  setOpenLessonMenuId: (id: string | null) => void;
  onSelectModule: (mod: Module) => void;
  onSelectLesson: (modId: string, les: Lesson) => void;
  onSelectChallenge: (modId: string, lesId: string, chal: Challenge) => void;
  onDuplicateLesson: (modId: string, les: Lesson) => void;
  onDeleteLesson: (modId: string, lesId: string, e?: React.MouseEvent) => void;
  onDeleteModule: (modId: string, e?: React.MouseEvent) => void;
  onAddUnitInstantly: (assignedWorldId?: string, targetGroup?: 'space' | 'practice') => void;
  onAddLessonInstantly: (modId: string) => void;
  onCopyLessonJson: (les: Lesson) => void;
  onExportLessonJson: (les: Lesson) => void;
  triggerNotification: (msg: string, type?: 'success' | 'error' | 'info') => void;
  soundManager: any;
}

export interface OverviewPanelProps {
  modulesList: Module[];
  practiceModulesList: Module[];
  isSupabaseConfigured: boolean;
  isGeneratingAllImages: boolean;
  onBulkGenerateImages: () => void;
  triggerConfirm: (title: string, message: string, onConfirm: () => void) => void;
  soundManager: any;
}

export interface UnitEditorProps {
  module: Module;
  modulesList: Module[];
  practiceModulesList: Module[];
  setModulesList: React.Dispatch<React.SetStateAction<Module[]>>;
  setPracticeModulesList: React.Dispatch<React.SetStateAction<Module[]>>;
  adminWorlds: World[];
  selectedAdminWorldId: string;
  modTitle: string;
  setModTitle: (t: string) => void;
  modDifficulty: any;
  setModDifficulty: (d: any) => void;
  selectedModuleWorldId: string;
  setSelectedModuleWorldId: (w: string) => void;
  openLessonMenuId: string | null;
  setOpenLessonMenuId: (id: string | null) => void;
  onSaveModuleEdits: (e?: React.FormEvent) => void;
  onDeleteModule: (id: string, e?: React.MouseEvent) => void;
  onAddLessonInstantly: (modId: string) => void;
  onSelectLesson: (modId: string, les: Lesson) => void;
  onDuplicateLesson: (modId: string, les: Lesson) => void;
  onDeleteLesson: (modId: string, lesId: string, e?: React.MouseEvent) => void;
  onReorderLesson: (modId: string, lesId: string, direction: 'up' | 'down') => void;
  onCopyLessonJson: (les: Lesson) => void;
  onExportLessonJson: (les: Lesson) => void;
  triggerNotification: (msg: string, type?: 'success' | 'error' | 'info') => void;
  soundManager: any;
}

export interface LessonEditorProps {
  module: Module;
  lesson: Lesson;
  modulesList: Module[];
  practiceModulesList: Module[];
  lesId: string;
  lesTitle: string;
  setLesTitle: (t: string) => void;
  lesDescription: string;
  setLesDescription: (d: string) => void;
  lesDifficulty: any;
  setLesDifficulty: (d: any) => void;
  lesCategory: string;
  setLesCategory: (c: string) => void;
  lesXpReward: number;
  setLesXpReward: (x: number) => void;
  lesChestIconUrl: string;
  setLesChestIconUrl: (u: string) => void;
  lesLinkedUnitId: string;
  setLesLinkedUnitId: (u: string) => void;
  isGeneratingLessonImage: boolean;
  screenListViewMode: ListViewMode;
  setScreenListViewMode: (mode: ListViewMode) => void;
  onSaveLessonEdits: (e?: React.FormEvent) => void;
  onBackToUnit: () => void;
  onCreateChallenge: () => void;
  onSelectChallenge: (chal: Challenge) => void;
  onDeleteChallenge: (chalId: string, e?: React.MouseEvent) => void;
  onReorderChallenge: (chalId: string, direction: 'up' | 'down', e?: React.MouseEvent) => void;
  onGenerateLessonImage: () => void;
  triggerNotification: (msg: string, type?: 'success' | 'error' | 'info') => void;
  soundManager: any;
  onToggleChest?: (isChest: boolean) => void;
  onOpenScreenVoice?: (screen: Challenge) => void;
  onOpenExplanationAudio?: (screen: Challenge) => void;
}

export interface PracticeArenaListsProps {
  modulesList: Module[];
  practiceModulesList: Module[];
  onSelectModule: (mod: Module) => void;
  onSelectLesson: (modId: string, les: Lesson) => void;
  onDeleteModule: (modId: string, e?: React.MouseEvent) => void;
  onDeleteLesson: (modId: string, lesId: string, e?: React.MouseEvent) => void;
  onAddUnitInstantly: () => void;
  onAddLessonInstantly: (modId: string) => void;
  onReorderUnit: (modId: string, direction: 'up' | 'down') => void;
  triggerConfirm: (title: string, message: string, onConfirm: () => void) => void;
  soundManager: any;
  setActiveTab: (tab: string) => void;
}

export interface MobileStudioNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileNavTab: string;
  setMobileNavTab: (tab: any) => void;
  mobileViewMode: MobileViewMode;
  setMobileViewMode: (mode: MobileViewMode) => void;
  isMobileMoreOpen: boolean;
  setIsMobileMoreOpen: (open: boolean) => void;
  currentSelectedModuleObj?: Module;
  currentSelectedLessonObj?: Lesson;
  chalId?: string;
  soundManager: any;
}

export interface ScreenFormStateAndHandlers {
  chalId: string;
  setChalId: (id: string) => void;
  chalType: ChallengeType;
  setChalType: (t: ChallengeType) => void;
  chalQuestion: string;
  setChalQuestion: (q: string) => void;
  chalExplanation: string;
  setChalExplanation: (e: string) => void;
  chalExplanationText: string;
  setChalExplanationText: (t: string) => void;
  chalExplanationAudioUrl: string;
  setChalExplanationAudioUrl: (u: string) => void;
  chalExplanationAudioDuration: number;
  setChalExplanationAudioDuration: (d: number) => void;
  chalExplanationMarathi: string;
  setChalExplanationMarathi: (m: string) => void;
  chalExplanationMarathiConfused: string;
  setChalExplanationMarathiConfused: (m: string) => void;
  chalExplanationMarathiConcept: string;
  setChalExplanationMarathiConcept: (m: string) => void;
  chalExplanationMarathiExample: string;
  setChalExplanationMarathiExample: (m: string) => void;
  chalExplanationMarathiTakeaway: string;
  setChalExplanationMarathiTakeaway: (m: string) => void;
  chalExplanationMarathiSpeechScript: string;
  setChalExplanationMarathiSpeechScript: (m: string) => void;
  explanationAudioUrlMarathi: string;
  setExplanationAudioUrlMarathi: (u: string) => void;
  explanationAudioDurationMarathi: number;
  setExplanationAudioDurationMarathi: (d: number) => void;
  chalPoints: number;
  setChalPoints: (p: number) => void;
  chalImage: string;
  setChalImage: (img: string) => void;
  chalOptions: string[];
  setChalOptions: React.Dispatch<React.SetStateAction<string[]>>;
  chalCorrectAnswer: string;
  setChalCorrectAnswer: (a: string) => void;
  chalConceptPairs: Array<{ id: string; left: string; right: string }>;
  setChalConceptPairs: React.Dispatch<React.SetStateAction<Array<{ id: string; left: string; right: string }>>>;
  chalBucketCategories: string[];
  setChalBucketCategories: React.Dispatch<React.SetStateAction<string[]>>;
  chalBucketItems: Array<{ id: string; text: string; category: string }>;
  setChalBucketItems: React.Dispatch<React.SetStateAction<Array<{ id: string; text: string; category: string }>>>;
  chalTimelineSteps: Array<{ id: string; text: string; correctOrder: number }>;
  setChalTimelineSteps: React.Dispatch<React.SetStateAction<Array<{ id: string; text: string; correctOrder: number }>>>;
  chalClassifyImages: Array<{ id: string; url: string; label: string; isAi: boolean }>;
  setChalClassifyImages: React.Dispatch<React.SetStateAction<Array<{ id: string; url: string; label: string; isAi: boolean }>>>;
  chalRevealClues: string[];
  setChalRevealClues: React.Dispatch<React.SetStateAction<string[]>>;
  chalRevealFinalAnswer: string;
  setChalRevealFinalAnswer: (a: string) => void;
  chalStoryPanels: Array<{ id: string; speaker: string; text: string; avatarUrl?: string }>;
  setChalStoryPanels: React.Dispatch<React.SetStateAction<Array<{ id: string; speaker: string; text: string; avatarUrl?: string }>>>;
  chalArgumentPremises: Array<{ id: string; text: string; isFlawed: boolean }>;
  setChalArgumentPremises: React.Dispatch<React.SetStateAction<Array<{ id: string; text: string; isFlawed: boolean }>>>;
  chalCodeSnippet: string;
  setChalCodeSnippet: (code: string) => void;
  chalCodeLanguage: string;
  setChalCodeLanguage: (lang: string) => void;
  chalVisualAnalogy: { conceptA: string; conceptB: string; visualUrl?: string };
  setChalVisualAnalogy: React.Dispatch<React.SetStateAction<{ conceptA: string; conceptB: string; visualUrl?: string }>>;
  chalRoleplayCharacter: { name: string; avatar: string; role: string };
  setChalRoleplayCharacter: React.Dispatch<React.SetStateAction<{ name: string; avatar: string; role: string }>>;
  isGeneratingChallengeImage: boolean;
  selectChallengeForEditing: (modId: string, lesId: string, chal: Challenge) => void;
  handleCreateChallenge: (modId: string, lesId: string) => void;
  handleDeleteChallenge: (modId: string, lesId: string, chalId: string, e?: React.MouseEvent) => void;
  handleSaveChallengeEdits: (modId: string, lesId: string, e?: React.FormEvent) => void;
  reorderChallenge: (modId: string, lesId: string, challengeId: string, direction: 'up' | 'down', e?: React.MouseEvent) => void;
  createInteractiveChallenge: (modId: string, lesId: string, baseType?: ChallengeType) => void;
  handleGenerateChallengeImage: () => void;
  buildChallengePayload: () => Challenge;
}

export interface ScreenEditorProps {
  module: Module;
  lesson: Lesson;
  challenge: Challenge;
  modulesList: Module[];
  practiceModulesList: Module[];
  editorLayoutMode: EditorLayoutMode;
  setEditorLayoutMode: (mode: EditorLayoutMode) => void;
  isStudentViewMode: boolean;
  setIsStudentViewMode: (v: boolean) => void;
  screenForm: ScreenFormStateAndHandlers;
  onBackToLesson: () => void;
  onDeleteChallenge: (id: string) => void;
  triggerNotification: (msg: string, type?: 'success' | 'error' | 'info') => void;
  soundManager: any;
}

export interface CurriculumStudioProps {
  modulesList: Module[];
  practiceModulesList: Module[];
  setModulesList: React.Dispatch<React.SetStateAction<Module[]>>;
  setPracticeModulesList: React.Dispatch<React.SetStateAction<Module[]>>;
  adminWorlds: World[];
  selectedAdminWorldId: string;
  setSelectedAdminWorldId: (id: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileViewMode: MobileViewMode;
  setMobileViewMode: (mode: MobileViewMode) => void;
  mobileNavTab: string;
  setMobileNavTab: (tab: any) => void;
  isMobileMoreOpen: boolean;
  setIsMobileMoreOpen: (open: boolean) => void;
  isSupabaseConfigured: boolean;
  triggerNotification: (msg: string, type?: 'success' | 'error' | 'info') => void;
  triggerConfirm: (title: string, message: string, onConfirm: () => void) => void;
  soundManager: any;
  setRawJsonText?: (text: string) => void;
}
