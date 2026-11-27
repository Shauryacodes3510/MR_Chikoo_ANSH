/**
 * AI Copilot v1 – the "clerk": validates and applies actions to the curriculum.
 *
 * PURE: inputs are never mutated. Changed screens/lessons/modules are copied
 * (structural sharing), everything else keeps its reference. So:
 *   - `validateActions` = dry run (gives the diff preview),
 *   - `applyActions`    = same run, but you take `nextModules` and save it,
 *   - Undo = keep the old `modules` reference and save it back.
 * Saving is NOT done here (Wave 3 calls saveCurriculumToStorage with nextModules).
 *
 * Practice vs space curriculum: pass one combined list (or run per list) and split
 * the result back by module id in the caller.
 */
import type {
  ActionResult,
  CopilotAction,
  CopilotScope,
  ModuleLike,
  RunOptions,
  RunResult,
  ScreenLike,
} from './types';
import { findHandlerByAction } from './handlers';
import { markAudioStale } from './shared';
import { checkScope } from './validate';

const reject = (index: number, action: CopilotAction, errors: string[]): ActionResult => ({
  index,
  action,
  status: 'rejected',
  errors,
  warnings: [],
  diff: [],
  mirrorsWritten: [],
  staleAudioAliases: [],
});

const locate = (modules: ModuleLike[], lessonId: string) => {
  for (let m = 0; m < modules.length; m++) {
    const lessons = modules[m].lessons || [];
    for (let l = 0; l < lessons.length; l++) {
      if (lessons[l].id === lessonId) return { m, l };
    }
  }
  return null;
};

/** Returns a new modules array where one screen is replaced (other objects keep their reference). */
const replaceScreen = (
  modules: ModuleLike[],
  m: number,
  l: number,
  s: number,
  screen: ScreenLike,
): ModuleLike[] => {
  const mod = modules[m];
  const lesson = (mod.lessons as any[])[l];
  const challenges = [...(lesson.challenges as ScreenLike[])];
  challenges[s] = screen;
  const lessons = [...(mod.lessons as any[])];
  lessons[l] = { ...lesson, challenges };
  const out = [...modules];
  out[m] = { ...mod, lessons };
  return out;
};

const run = (
  modules: ModuleLike[],
  actions: CopilotAction[],
  scope: CopilotScope,
  options: RunOptions,
): RunResult => {
  let working = modules;
  const results: ActionResult[] = [];
  const changedLessons = new Set<string>();
  const staleScreens = new Set<string>();

  actions.forEach((action, index) => {
    const loc = locate(working, action.lessonId);
    if (!loc) return results.push(reject(index, action, [`Lesson "${action.lessonId}" was not found.`]));

    const scopeError = checkScope(scope, action, working[loc.m]);
    if (scopeError) return results.push(reject(index, action, [scopeError]));

    const challenges = ((working[loc.m].lessons as any[])[loc.l].challenges || []) as ScreenLike[];
    const sIdx = challenges.findIndex(c => c.id === action.screenId);
    if (sIdx < 0) {
      return results.push(reject(index, action, [`Screen "${action.screenId}" was not found in lesson "${action.lessonId}".`]));
    }
    const screen = challenges[sIdx];

    const handler = findHandlerByAction(action.action);
    if (!handler) return results.push(reject(index, action, [`Unknown action "${action.action}".`]));
    if (!handler.types.includes(screen.type)) {
      return results.push(
        reject(index, action, [`Screen type "${screen.type}" is not supported by "${action.action}" in v1.`]),
      );
    }

    const outcome = handler.plan(screen, action.fields);
    if (outcome.errors.length || !outcome.next) {
      return results.push(reject(index, action, outcome.errors.length ? outcome.errors : ['Nothing to apply.']));
    }

    let finalScreen = outcome.next;
    let staleAliases: string[] = [];
    if (outcome.spokenTextChanged) {
      const stale = markAudioStale(finalScreen);
      finalScreen = stale.screen;
      staleAliases = stale.aliases;
      if (staleAliases.length) staleScreens.add(`${action.lessonId}/${action.screenId}`);
    }

    working = replaceScreen(working, loc.m, loc.l, sIdx, finalScreen);
    changedLessons.add(action.lessonId);
    results.push({
      index,
      action,
      status: 'ok',
      errors: [],
      warnings: outcome.warnings,
      diff: outcome.diff,
      mirrorsWritten: outcome.mirrorsWritten,
      staleAudioAliases: staleAliases,
    });
  });

  const rejectedCount = results.filter(r => r.status === 'rejected').length;
  if (options.atomic && rejectedCount > 0) {
    return {
      results,
      nextModules: modules,
      changedLessonIds: [],
      appliedCount: 0,
      rejectedCount,
      staleAudioScreens: 0,
      atomicAborted: true,
    };
  }
  return {
    results,
    nextModules: working,
    changedLessonIds: [...changedLessons],
    appliedCount: results.length - rejectedCount,
    rejectedCount,
    staleAudioScreens: staleScreens.size,
    atomicAborted: false,
  };
};

/** Dry run: use `results[].diff` for the preview. Nothing is returned for saving. */
export const validateActions = (
  modules: ModuleLike[],
  actions: CopilotAction[],
  scope: CopilotScope,
  options: RunOptions = {},
): RunResult => run(modules, actions, scope, options);

/** Same run; take `nextModules` and save it via saveCurriculumToStorage (Wave 3). */
export const applyActions = (
  modules: ModuleLike[],
  actions: CopilotAction[],
  scope: CopilotScope,
  options: RunOptions = {},
): RunResult => run(modules, actions, scope, options);
