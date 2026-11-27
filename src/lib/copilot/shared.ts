/**
 * AI Copilot v1 – helpers shared by all screen handlers.
 * Everything here is pure (no mutation of inputs).
 */
import type { ScreenLike } from './types';

export const isPlainObject = (v: unknown): v is Record<string, any> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export const sameValue = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * Fields that are never editable by the AI on ANY screen type (v1).
 * Includes the duplicate "mirror" fields: the AI must not know/write them, code does.
 */
export const isGloballyLockedField = (name: string): boolean =>
  name === 'id' ||
  name === 'type' ||
  name === 'quoteAuthor' ||
  name === 'correctAnswer' || // code derives it from correctOptionIndex
  name === 'audioNarrations' ||
  name === 'audioUrl' ||
  name === 'contentScreen' ||
  name === 'visualLessonScreen' ||
  /audio_?url$/i.test(name) ||
  /^explanation_/i.test(name); // explanation_concept/takeaway/speech_script/example/confused/marathi_*

/** Spoken/narrated explanation text mirrored into these keys by code. */
export const EXPLANATION_MIRROR_KEYS = [
  'explanation_concept',
  'explanation_takeaway',
  'explanation_speech_script',
] as const;

/** Current English explanation text, whether `explanation` is a string or an object. */
export const getExplanationText = (screen: ScreenLike): string => {
  const e = screen.explanation;
  if (typeof e === 'string') return e;
  if (isPlainObject(e) && typeof e.text === 'string') return e.text;
  return '';
};

/**
 * Returns a copy of `screen` with the new explanation text.
 * Preserves the shape: string stays string; object keeps audioUrl/audioDuration/etc.
 * Mirrors are written ONLY if their current value equals the OLD text
 * (protects manually written text). Returns which mirrors were written.
 */
export const withExplanationText = (
  screen: ScreenLike,
  newText: string,
): { screen: ScreenLike; mirrorsWritten: string[] } => {
  const oldText = getExplanationText(screen);
  const next: ScreenLike = { ...screen };
  if (isPlainObject(screen.explanation)) {
    next.explanation = { ...screen.explanation, text: newText };
  } else {
    next.explanation = newText;
  }
  const mirrorsWritten: string[] = [];
  for (const key of EXPLANATION_MIRROR_KEYS) {
    if (typeof screen[key] === 'string' && screen[key] === oldText) {
      next[key] = newText;
      mirrorsWritten.push(key);
    }
  }
  return { screen: next, mirrorsWritten };
};

/**
 * Flags every EXISTING audioNarrations entry (all aliases: en/english, mr/marathi,
 * hinglish/hi) as status:"stale". Never touches url/hash/voiceId/etc. and never
 * creates entries. Returns the aliases flagged.
 */
export const markAudioStale = (screen: ScreenLike): { screen: ScreenLike; aliases: string[] } => {
  const narrations = screen.audioNarrations;
  if (!isPlainObject(narrations)) return { screen, aliases: [] };
  const nextNarrations: Record<string, any> = { ...narrations };
  const aliases: string[] = [];
  for (const key of Object.keys(narrations)) {
    const entry = narrations[key];
    if (isPlainObject(entry)) {
      nextNarrations[key] = { ...entry, status: 'stale' };
      aliases.push(key);
    }
  }
  if (aliases.length === 0) return { screen, aliases };
  return { screen: { ...screen, audioNarrations: nextNarrations }, aliases };
};

/** Field-name check shared by handlers: separates "locked" from "not editable here". */
export const checkFieldNames = (
  fields: Record<string, unknown>,
  allowed: readonly string[],
  screenType: string,
): string[] => {
  const errors: string[] = [];
  for (const name of Object.keys(fields)) {
    if (allowed.includes(name)) continue;
    if (isGloballyLockedField(name)) {
      errors.push(`Field "${name}" is locked and cannot be edited by the AI.`);
    } else {
      errors.push(`Field "${name}" is not editable on ${screenType} screens.`);
    }
  }
  return errors;
};

/** Trimmed non-empty string within max length, else an error message. */
export const readText = (
  name: string,
  value: unknown,
  max: number,
  opts: { allowEmpty?: boolean } = {},
): { value?: string; error?: string } => {
  if (typeof value !== 'string') return { error: `"${name}" must be a string.` };
  const v = value.trim();
  if (!opts.allowEmpty && v.length === 0) return { error: `"${name}" cannot be empty.` };
  if (v.length > max) return { error: `"${name}" is too long (max ${max} characters).` };
  return { value: v };
};
