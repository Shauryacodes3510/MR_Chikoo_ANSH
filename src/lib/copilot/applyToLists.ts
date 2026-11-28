/**
 * AI Copilot v1 – Wave 3: apply actions to the TWO curriculum lists (learning path + practice arena)
 * and build Undo records. Pure: no React, no saving. The UI saves `nextSpace` / `nextPrac`
 * through saveCurriculumToStorage after the admin clicks Apply / Undo.
 */
import type { ActionResult, CopilotAction, CopilotScope, LessonLike, ModuleLike, RunOptions } from './types';
import { applyActions, validateActions } from './applyActions';

/** What one Apply changed, per lesson. Enough to undo it safely. */
export interface LessonChange {
  lessonId: string;
  before: LessonLike;
  after: LessonLike;
}

export interface ListsRunResult {
  results: ActionResult[];
  nextSpace: ModuleLike[];
  nextPrac: ModuleLike[];
  changes: LessonChange[];
  appliedCount: number;
  rejectedCount: number;
  staleAudioScreens: number;
  atomicAborted: boolean;
}

const hasLesson = (list: ModuleLike[], lessonId: string) =>
  list.some(m => (m.lessons || []).some(l => l.id === lessonId));

const findLesson = (list: ModuleLike[], lessonId: string): LessonLike | undefined => {
  for (const m of list) for (const l of m.lessons || []) if (l.id === lessonId) return l;
  return undefined;
};

const run = (
  mode: 'apply' | 'validate',
  space: ModuleLike[],
  prac: ModuleLike[],
  actions: CopilotAction[],
  scope: CopilotScope,
  options: RunOptions,
): ListsRunResult => {
  const fn = mode === 'apply' ? applyActions : validateActions;
  // Route each action to the list that contains its lesson (a lesson id lives in only one list).
  const bySpace: { a: CopilotAction; i: number }[] = [];
  const byPrac: { a: CopilotAction; i: number }[] = [];
  const nowhere: number[] = [];
  actions.forEach((a, i) => {
    if (hasLesson(space, a.lessonId)) bySpace.push({ a, i });
    else if (hasLesson(prac, a.lessonId)) byPrac.push({ a, i });
    else nowhere.push(i);
  });

  const results: ActionResult[] = new Array(actions.length);
  nowhere.forEach(i => {
    results[i] = {
      index: i, action: actions[i], status: 'rejected',
      errors: [`Lesson "${actions[i].lessonId}" was not found.`], warnings: [], diff: [], mirrorsWritten: [], staleAudioAliases: [],
    };
  });

  // atomic = all or nothing across BOTH lists
  const dry = options.atomic ? { ...options, atomic: false } : options;
  const part = (list: ModuleLike[], items: { a: CopilotAction; i: number }[]) =>
    items.length ? fn(list, items.map(x => x.a), scope, dry) : null;
  const rs = part(space, bySpace);
  const rp = part(prac, byPrac);
  rs?.results.forEach((r, k) => (results[bySpace[k].i] = { ...r, index: bySpace[k].i }));
  rp?.results.forEach((r, k) => (results[byPrac[k].i] = { ...r, index: byPrac[k].i }));

  const anyRejected = results.some(r => r.status === 'rejected');
  const aborted = !!options.atomic && anyRejected;

  const nextSpace = aborted || !rs ? space : rs.nextModules;
  const nextPrac = aborted || !rp ? prac : rp.nextModules;

  const changedIds = new Set<string>([...(rs?.changedLessonIds || []), ...(rp?.changedLessonIds || [])]);
  const changes: LessonChange[] = [];
  if (!aborted) {
    changedIds.forEach(id => {
      const before = findLesson(space, id) ?? findLesson(prac, id);
      const after = findLesson(nextSpace, id) ?? findLesson(nextPrac, id);
      if (before && after) changes.push({ lessonId: id, before, after });
    });
  }

  const rejectedCount = results.filter(r => r.status === 'rejected').length;
  return {
    results,
    nextSpace,
    nextPrac,
    changes,
    appliedCount: aborted ? 0 : results.length - rejectedCount,
    rejectedCount,
    staleAudioScreens: aborted ? 0 : (rs?.staleAudioScreens || 0) + (rp?.staleAudioScreens || 0),
    atomicAborted: aborted,
  };
};

/** Dry run for the diff preview. Never changes anything. */
export const validateOnLists = (
  space: ModuleLike[], prac: ModuleLike[], actions: CopilotAction[], scope: CopilotScope, options: RunOptions = {},
) => run('validate', space, prac, actions, scope, options);

/** Same run; save `nextSpace` / `nextPrac` after the admin's click. */
export const applyOnLists = (
  space: ModuleLike[], prac: ModuleLike[], actions: CopilotAction[], scope: CopilotScope, options: RunOptions = {},
) => run('apply', space, prac, actions, scope, options);

const replaceLesson = (list: ModuleLike[], lesson: LessonLike): ModuleLike[] =>
  list.map(m =>
    (m.lessons || []).some(l => l.id === lesson.id)
      ? { ...m, lessons: (m.lessons || []).map(l => (l.id === lesson.id ? lesson : l)) }
      : m,
  );

export interface UndoResult {
  nextSpace: ModuleLike[];
  nextPrac: ModuleLike[];
  restoredLessonIds: string[];
  /** Lessons NOT restored because they were edited again after the Apply (undo would erase that edit). */
  conflictLessonIds: string[];
}

/**
 * Restores only the lessons the Apply touched, and only if they still look exactly like the
 * version the Apply produced. Anything edited since is left alone and reported.
 */
export const undoChanges = (space: ModuleLike[], prac: ModuleLike[], changes: LessonChange[]): UndoResult => {
  let nextSpace = space;
  let nextPrac = prac;
  const restoredLessonIds: string[] = [];
  const conflictLessonIds: string[] = [];
  for (const c of changes) {
    const current = findLesson(nextSpace, c.lessonId) ?? findLesson(nextPrac, c.lessonId);
    if (!current || JSON.stringify(current) !== JSON.stringify(c.after)) {
      conflictLessonIds.push(c.lessonId);
      continue;
    }
    if (hasLesson(nextSpace, c.lessonId)) nextSpace = replaceLesson(nextSpace, c.before);
    else nextPrac = replaceLesson(nextPrac, c.before);
    restoredLessonIds.push(c.lessonId);
  }
  return { nextSpace, nextPrac, restoredLessonIds, conflictLessonIds };
};
