/**
 * AI Copilot v1 – builds the SMALL, CLEAN view of the curriculum that the LLM sees.
 *  - Only the selected scope is included.
 *  - Audio urls/hashes, mirror fields (explanation_*, contentScreen duplicates) never go out.
 *  - MCQ answers are shown as correctOptionIndex (what the AI must return), not correctAnswer.
 */
import type { CopilotScope, ModuleLike, ScreenLike } from '../types';
import { findHandlerByAction, HANDLERS } from '../handlers';
import { getExplanationText, isPlainObject } from '../shared';

/** Hard cap on the JSON sent to the LLM (characters). */
export const MAX_CONTEXT_CHARS = 120_000;

export const isEditableType = (type: string): boolean => HANDLERS.some(h => h.types.includes(type));
export const handlerForType = (type: string) => HANDLERS.find(h => h.types.includes(type));

export interface AiScreenView {
  id: string;
  type: string;
  /** false = Ask can read it, but Action/Audit cannot change it in v1. */
  editable: boolean;
  [key: string]: unknown;
}

const pick = (src: Record<string, any> | undefined, keys: string[]): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  if (!src) return out;
  for (const k of keys) if (src[k] !== undefined && src[k] !== null && src[k] !== '') out[k] = src[k];
  return out;
};


const MAX_STRING = 600;
const MAX_DEPTH = 6;
/** Keys never shown to the LLM: audio, hashes, ids of voices, duplicated/mirror blobs. */
const HIDDEN_KEY = /(^audioNarrations$|audio|hash|voice|ttsModel|^explanation_(?!marathi)|^contentScreen$|^visualLessonScreen$|^updatedAt$|^durationMs$)/i;

/** Copy of a value without hidden keys, long strings cut, depth limited. */
const sanitize = (v: unknown, depth = 0): unknown => {
  if (typeof v === 'string') return v.length > MAX_STRING ? v.slice(0, MAX_STRING) + '…' : v;
  if (v === null || typeof v !== 'object') return v;
  if (depth >= MAX_DEPTH) return undefined;
  if (Array.isArray(v)) return v.slice(0, 40).map(x => sanitize(x, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (HIDDEN_KEY.test(k)) continue;
    const c = sanitize(val, depth + 1);
    if (c !== undefined && c !== '') out[k] = c;
  }
  return out;
};

export const toAiScreenView = (screen: ScreenLike): AiScreenView => {
  const editable = isEditableType(screen.type);
  const base = { id: screen.id, type: screen.type, editable };
  if (editable) {
    const options: unknown = screen.options;
    const idx = Array.isArray(options) && typeof screen.correctAnswer === 'string' ? options.indexOf(screen.correctAnswer) : -1;
    return {
      ...base,
      ...pick(screen, ['question', 'options', 'mascotMessage', 'xpValue', 'difficulty']),
      correctOptionIndex: idx >= 0 ? idx : null,
      // Only when the answer could not be matched to an option, so the AI can still see it.
      ...(idx < 0 && screen.correctAnswer !== undefined ? { rawCorrectAnswer: sanitize(screen.correctAnswer) } : {}),
      explanation: getExplanationText(screen),
    };
  }
  if (screen.type === 'content_screen') {
    const cs = isPlainObject(screen.contentScreen) ? screen.contentScreen : screen;
    return { ...base, ...pick(cs, ['heading', 'subheading', 'contentBody', 'badge', 'quote', 'bottomMessage', 'mascotMessage']) };
  }
  // Other types: read-only, but the AI gets the real data (options, answers, pairs, ...),
  // minus audio/hash/mirror fields, so "Ask" can really check them.
  const { id: _id, type: _type, ...rest } = screen;
  return { ...base, ...(sanitize(rest) as Record<string, unknown>) };
};

export interface AiScopeView {
  units: { id: string; title?: string; lessons: { id: string; title?: string; screens: AiScreenView[] }[] }[];
}

/** Returns only the modules/lessons/screens inside the scope, or an error. */
export const resolveScope = (
  modules: ModuleLike[],
  scope: CopilotScope,
): { modules: ModuleLike[]; error?: undefined } | { modules?: undefined; error: string } => {
  const out: ModuleLike[] = [];
  for (const m of modules) {
    if (scope.kind === 'unit' && m.id !== scope.unitId) continue;
    const lessons = (m.lessons || []).filter(l => {
      if (scope.kind === 'unit') return true;
      return l.id === scope.lessonId;
    });
    if (!lessons.length) continue;
    const scoped = lessons.map(l =>
      scope.kind === 'screen'
        ? { ...l, challenges: (l.challenges || []).filter(c => c.id === scope.screenId) }
        : l,
    );
    const nonEmpty = scoped.filter(l => (l.challenges || []).length > 0 || scope.kind !== 'screen');
    if (nonEmpty.length) out.push({ ...m, lessons: nonEmpty });
  }
  if (!out.length) return { error: 'Selected scope was not found in the data sent.' };
  return { modules: out };
};

export const buildScopeView = (scoped: ModuleLike[]): AiScopeView => ({
  units: scoped.map(m => ({
    id: m.id,
    title: m.title ?? m.name,
    lessons: (m.lessons || []).map(l => ({
      id: l.id,
      title: l.title,
      screens: (l.challenges || []).map(toAiScreenView),
    })),
  })),
});

export const serializeView = (view: AiScopeView): { json: string } | { error: string } => {
  const json = JSON.stringify(view);
  if (json.length > MAX_CONTEXT_CHARS) {
    return { error: 'Selection is too large for the AI. Select a single lesson or screen.' };
  }
  return { json };
};

/** All screens in scope that an Action/Audit can edit (for the audit batches). */
export const listEditableScreens = (scoped: ModuleLike[]) => {
  const items: { lessonId: string; screen: ScreenLike }[] = [];
  let skipped = 0;
  for (const m of scoped)
    for (const l of m.lessons || [])
      for (const c of l.challenges || []) {
        if (isEditableType(c.type)) items.push({ lessonId: l.id, screen: c });
        else skipped++;
      }
  return { items, skipped };
};

export { findHandlerByAction };
