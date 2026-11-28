/**
 * AI Copilot v1 – handler for content_screen and visual_lesson_screen.
 *
 * Schema (what the AI may edit):
 *   heading, subheading, contentBody, badge, quote, bottomMessage, mascotMessage
 * Mirrors written by code:
 *   contentScreen.*, visualLessonScreen.* (exact duplicate),
 *   explanation.text (= contentBody) + explanation_concept/takeaway/speech_script.
 * Locked: id, type, quoteAuthor, audioNarrations, all audio fields.
 */
import type { DiffEntry, HandlerOutcome, ScreenHandler, ScreenLike } from '../types';
import {
  checkFieldNames,
  readText,
  sameValue,
  withExplanationText,
  isPlainObject,
} from '../shared';

export const CONTENT_TYPES = ['content_screen', 'visual_lesson_screen'] as const;

const CONTENT_FIELDS = [
  'heading',
  'subheading',
  'contentBody',
  'badge',
  'quote',
  'bottomMessage',
  'mascotMessage',
] as const;

const LIMITS: Record<string, number> = {
  heading: 300,
  subheading: 400,
  contentBody: 3000,
  badge: 150,
  quote: 500,
  bottomMessage: 400,
  mascotMessage: 400,
};

const fail = (errors: string[]): HandlerOutcome => ({
  errors,
  warnings: [],
  diff: [],
  mirrorsWritten: [],
  spokenTextChanged: false,
});

const plan = (screen: ScreenLike, fields: Record<string, unknown>): HandlerOutcome => {
  const errors = checkFieldNames(fields, CONTENT_FIELDS, screen.type);
  if (Object.keys(fields).length === 0) errors.push('No fields to change.');
  if (errors.length) return fail(errors);

  const warnings: string[] = [];
  const diff: DiffEntry[] = [];
  let next: ScreenLike = { ...screen };
  let spokenTextChanged = false;
  const mirrorsWritten: string[] = [];

  const cs: Record<string, any> = isPlainObject(screen.contentScreen) ? { ...screen.contentScreen } : {};
  let contentScreenChanged = false;

  for (const field of CONTENT_FIELDS) {
    if (!(field in fields)) continue;
    const raw = fields[field];
    const max = LIMITS[field] || 2000;
    const read = readText(field, raw, max, { allowEmpty: field !== 'heading' && field !== 'contentBody' });
    if (read.error) {
      errors.push(read.error);
      continue;
    }
    const val = read.value!;
    const oldVal = (cs[field] ?? screen[field] ?? '') as string;
    if (sameValue(oldVal, val)) continue;

    diff.push({ field, before: oldVal, after: val, sensitive: false });
    next[field] = val;
    cs[field] = val;
    contentScreenChanged = true;

    if (field === 'heading' || field === 'contentBody' || field === 'subheading' || field === 'mascotMessage') {
      spokenTextChanged = true;
    }

    if (field === 'contentBody') {
      const exp = withExplanationText(next, val);
      next = exp.screen;
      mirrorsWritten.push(...exp.mirrorsWritten);
    }
  }

  if (contentScreenChanged) {
    next.contentScreen = cs;
    next.visualLessonScreen = { ...cs };
    mirrorsWritten.push('contentScreen', 'visualLessonScreen');
  }

  if (errors.length) return fail(errors);
  if (diff.length === 0) return fail(['The proposed changes are identical to the current screen.']);

  return {
    next,
    errors: [],
    warnings,
    diff,
    mirrorsWritten,
    spokenTextChanged,
  };
};

export const contentHandler: ScreenHandler = {
  actionName: 'updateContentScreen',
  types: CONTENT_TYPES,
  plan,
};
