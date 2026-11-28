import type { CopilotScope, ModuleLike } from '../../../../lib/copilot/types';

/** What the shell (CopilotPanel) hands to every mode view. */
export interface CopilotContext {
  /** null until a unit is selected. */
  scope: CopilotScope | null;
  /** e.g. "Unit 1 › Lesson 2 › screen 3" */
  scopeLabel: string;
  /** World-filtered lists the admin sees: these are what we send to the AI. */
  displayModules: ModuleLike[];
  /** FULL lists: Apply / Undo work on these, then save both through onCommit. */
  fullSpace: ModuleLike[];
  fullPrac: ModuleLike[];
  /** Saves: setModulesList + setPracticeModulesList + saveCurriculumToStorage (AdminPanel). */
  onCommit: (nextSpace: ModuleLike[], nextPrac: ModuleLike[]) => void;
}
