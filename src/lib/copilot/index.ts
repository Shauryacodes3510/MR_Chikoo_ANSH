export * from './types';
export { applyActions, validateActions } from './applyActions';
export { parseActionPayload, checkScope, MAX_ACTIONS_PER_PAYLOAD } from './validate';
export { HANDLERS, findHandlerByAction } from './handlers';
export { getExplanationText, withExplanationText, markAudioStale } from './shared';
export { validateOnLists, applyOnLists, undoChanges } from './applyToLists';
export type { LessonChange, ListsRunResult, UndoResult } from './applyToLists';
