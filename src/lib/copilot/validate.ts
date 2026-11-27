/**
 * AI Copilot v1 – validation helpers.
 *  - parseActionPayload: checks the SHAPE of what the LLM returned (the JSON contract).
 *  - checkScope: every lessonId/screenId must be inside what the admin selected.
 * Screen-level rules (locked fields, MCQ index, etc.) live in handlers/*.
 */
import type { CopilotAction, CopilotScope, ModuleLike } from './types';
import { isPlainObject } from './shared';

export const MAX_ACTIONS_PER_PAYLOAD = 50;
const MAX_REASON_LENGTH = 500;

const stripFences = (s: string): string =>
  s.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

/**
 * Accepts the raw LLM output (string, possibly in ```json fences, or an already parsed
 * object) and returns well-formed actions plus a list of problems. Malformed actions are
 * dropped and reported, never guessed.
 */
export const parseActionPayload = (raw: unknown): { actions: CopilotAction[]; errors: string[] } => {
  const errors: string[] = [];
  let data: unknown = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(stripFences(raw));
    } catch {
      return { actions: [], errors: ['Response is not valid JSON.'] };
    }
  }
  if (!isPlainObject(data) || !Array.isArray(data.actions)) {
    return { actions: [], errors: ['JSON must be an object with an "actions" array.'] };
  }
  if (data.actions.length > MAX_ACTIONS_PER_PAYLOAD) {
    return { actions: [], errors: [`Too many actions (max ${MAX_ACTIONS_PER_PAYLOAD}).`] };
  }
  const actions: CopilotAction[] = [];
  data.actions.forEach((a: unknown, i: number) => {
    const label = `actions[${i}]`;
    if (!isPlainObject(a)) return errors.push(`${label} must be an object.`);
    if (typeof a.action !== 'string' || !a.action) return errors.push(`${label}.action must be a non-empty string.`);
    if (typeof a.lessonId !== 'string' || !a.lessonId) return errors.push(`${label}.lessonId must be a non-empty string.`);
    if (typeof a.screenId !== 'string' || !a.screenId) return errors.push(`${label}.screenId must be a non-empty string.`);
    if (!isPlainObject(a.fields)) return errors.push(`${label}.fields must be an object.`);
    if (a.reason !== undefined && (typeof a.reason !== 'string' || a.reason.length > MAX_REASON_LENGTH)) {
      return errors.push(`${label}.reason must be a string up to ${MAX_REASON_LENGTH} characters.`);
    }
    actions.push({
      action: a.action,
      lessonId: a.lessonId,
      screenId: a.screenId,
      fields: a.fields,
      ...(typeof a.reason === 'string' ? { reason: a.reason } : {}),
    });
  });
  return { actions, errors };
};

/** Returns an error message if the (lesson, screen) is outside the selected scope, else null. */
export const checkScope = (
  scope: CopilotScope,
  action: Pick<CopilotAction, 'lessonId' | 'screenId'>,
  parentModule: ModuleLike,
): string | null => {
  switch (scope.kind) {
    case 'screen':
      return action.lessonId === scope.lessonId && action.screenId === scope.screenId
        ? null
        : 'Screen is outside the selected scope (selected: a single screen).';
    case 'lesson':
      return action.lessonId === scope.lessonId ? null : 'Lesson is outside the selected scope (selected: one lesson).';
    case 'unit':
      return parentModule.id === scope.unitId ? null : 'Lesson is outside the selected scope (selected: one unit).';
    default:
      return 'Unknown scope.';
  }
};
