/**
 * AI Copilot v1 – handler for c1_multiple_choice and c9_true_false.
 *
 * Schema (what the AI may edit):
 *   c1: question, options[] (same count), correctOptionIndex, mascotMessage, explanation, xpValue, difficulty
 *   c9: question, correctOptionIndex (0 = "True", 1 = "False"), mascotMessage, explanation, xpValue, difficulty
 *       (True/False option labels are locked)
 * Code-written mirrors: correctAnswer (= options[index], it is option TEXT not index),
 *   explanation.text / explanation_concept / explanation_takeaway / explanation_speech_script.
 * Locked: id, type, explanation_example, explanation_confused, all audio fields, quoteAuthor.
 * Media fields (imageUrl/mediaUrl) do not exist on these types in production, so they are
 * not in this schema; they get unlocked on the screen types that have them.
 */
import type { DiffEntry, HandlerOutcome, ScreenHandler, ScreenLike } from '../types';
import {
  checkFieldNames,
  readText,
  sameValue,
  withExplanationText,
  getExplanationText,
} from '../shared';

export const MCQ_TYPES = ['c1_multiple_choice', 'c9_true_false'] as const;

const MCQ_FIELDS = ['question', 'options', 'correctOptionIndex', 'mascotMessage', 'explanation', 'xpValue', 'difficulty'] as const;
const TF_FIELDS = ['question', 'correctOptionIndex', 'mascotMessage', 'explanation', 'xpValue', 'difficulty'] as const;

const LIMITS = { question: 600, option: 300, explanation: 2000, mascot: 300, xpMax: 1000 };

const fail = (errors: string[]): HandlerOutcome => ({
  errors,
  warnings: [],
  diff: [],
  mirrorsWritten: [],
  spokenTextChanged: false,
});

const plan = (screen: ScreenLike, fields: Record<string, unknown>): HandlerOutcome => {
  const isTF = screen.type === 'c9_true_false';
  const errors = checkFieldNames(fields, isTF ? TF_FIELDS : MCQ_FIELDS, screen.type);
  if (isTF && 'options' in fields) {
    // replace generic message with the specific reason
    errors.splice(0, errors.length, ...errors.filter(e => !e.includes('"options"')), 'True/False options are locked.');
  }
  if (Object.keys(fields).length === 0) errors.push('No fields to change.');

  const currentOptions: unknown = screen.options;
  const currentOptionsOk =
    Array.isArray(currentOptions) && currentOptions.length >= 2 && currentOptions.every(o => typeof o === 'string');
  if (!currentOptionsOk) errors.push('This screen has an unexpected options format and cannot be edited.');
  if (isTF && currentOptionsOk && !sameValue(currentOptions, ['True', 'False'])) {
    errors.push('This True/False screen has unexpected options and cannot be edited.');
  }
  if (errors.length) return fail(errors);

  const oldOptions = currentOptions as string[];
  const warnings: string[] = [];
  const diff: DiffEntry[] = [];
  let next: ScreenLike = { ...screen };
  let spokenTextChanged = false;
  let mirrorsWritten: string[] = [];

  // ---- question
  if ('question' in fields) {
    const r = readText('question', fields.question, LIMITS.question);
    if (r.error) errors.push(r.error);
    else if (r.value !== screen.question) {
      diff.push({ field: 'question', before: screen.question, after: r.value, sensitive: false });
      next.question = r.value;
      spokenTextChanged = true;
    }
  }

  // ---- options (c1 only)
  let finalOptions = oldOptions;
  if ('options' in fields && !isTF) {
    const raw = fields.options;
    if (!Array.isArray(raw)) {
      errors.push('"options" must be an array of strings.');
    } else if (raw.length !== oldOptions.length) {
      errors.push(`"options" must keep the same count (${oldOptions.length}), got ${raw.length}.`);
    } else {
      const cleaned: string[] = [];
      for (let i = 0; i < raw.length; i++) {
        const r = readText(`options[${i}]`, raw[i], LIMITS.option);
        if (r.error) errors.push(r.error);
        else cleaned.push(r.value as string);
      }
      if (cleaned.length === raw.length) {
        const lower = cleaned.map(o => o.toLowerCase());
        if (new Set(lower).size !== lower.length) errors.push('"options" must all be different.');
        else if (!sameValue(cleaned, oldOptions)) {
          finalOptions = cleaned;
          diff.push({ field: 'options', before: oldOptions, after: cleaned, sensitive: false });
          next.options = cleaned;
          spokenTextChanged = true;
        }
      }
    }
  }

  // ---- correct answer (AI gives an INDEX; code writes the option TEXT)
  const oldCorrectText: unknown = screen.correctAnswer;
  const oldIdx = typeof oldCorrectText === 'string' ? oldOptions.indexOf(oldCorrectText) : -1;
  let newIdx: number | undefined;
  if ('correctOptionIndex' in fields) {
    const v = fields.correctOptionIndex;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v >= finalOptions.length) {
      errors.push(`"correctOptionIndex" must be an integer between 0 and ${finalOptions.length - 1}.`);
    } else {
      newIdx = v;
    }
  } else if (finalOptions !== oldOptions) {
    // options changed without an index → keep the same index (PDF rule 3)
    if (oldIdx < 0) {
      errors.push('Cannot tell which option is currently correct; provide "correctOptionIndex" together with "options".');
    } else {
      newIdx = oldIdx;
    }
  }
  if (newIdx !== undefined) {
    const newCorrectText = finalOptions[newIdx];
    if (newCorrectText !== oldCorrectText) {
      diff.push({ field: 'correctAnswer', before: oldCorrectText ?? null, after: newCorrectText, sensitive: true });
      next.correctAnswer = newCorrectText;
      if (!('correctOptionIndex' in fields)) {
        warnings.push(
          `Options changed without "correctOptionIndex": same index kept, so the correct answer text changed from "${String(oldCorrectText)}" to "${newCorrectText}". Check the diff.`,
        );
      }
    }
  }

  // ---- mascotMessage
  if ('mascotMessage' in fields) {
    const r = readText('mascotMessage', fields.mascotMessage, LIMITS.mascot, { allowEmpty: true });
    if (r.error) errors.push(r.error);
    else if (r.value !== screen.mascotMessage) {
      diff.push({ field: 'mascotMessage', before: screen.mascotMessage ?? null, after: r.value, sensitive: false });
      next.mascotMessage = r.value;
      spokenTextChanged = true;
    }
  }

  // ---- explanation (shape preserved, mirrors synced by code)
  if ('explanation' in fields) {
    const r = readText('explanation', fields.explanation, LIMITS.explanation);
    if (r.error) errors.push(r.error);
    else {
      const oldText = getExplanationText(screen);
      if (r.value !== oldText) {
        const w = withExplanationText(next, r.value as string);
        next = w.screen;
        mirrorsWritten = w.mirrorsWritten;
        diff.push({ field: 'explanation', before: oldText, after: r.value, sensitive: false });
        spokenTextChanged = true;
      }
    }
  }

  // ---- xpValue (sensitive)
  if ('xpValue' in fields) {
    const v = fields.xpValue;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > LIMITS.xpMax) {
      errors.push(`"xpValue" must be a whole number between 0 and ${LIMITS.xpMax}.`);
    } else if (v !== screen.xpValue) {
      diff.push({ field: 'xpValue', before: screen.xpValue ?? null, after: v, sensitive: true });
      next.xpValue = v;
    }
  }

  // ---- difficulty (sensitive; must keep the existing value's type)
  if ('difficulty' in fields) {
    const v = fields.difficulty;
    const existing = screen.difficulty;
    if (existing === undefined || existing === null) {
      errors.push('This screen has no "difficulty" value to change.');
    } else if (typeof v !== typeof existing) {
      errors.push(`"difficulty" must be a ${typeof existing}, like the current value.`);
    } else if (typeof v === 'string' && (v.trim().length === 0 || v.length > 30)) {
      errors.push('"difficulty" must be 1-30 characters.');
    } else if (typeof v === 'number' && !Number.isFinite(v)) {
      errors.push('"difficulty" must be a finite number.');
    } else if (v !== existing) {
      diff.push({ field: 'difficulty', before: existing, after: v, sensitive: true });
      next.difficulty = v;
    }
  }

  if (errors.length) return fail(errors);
  if (diff.length === 0) return fail(['No changes: the proposed values are identical to the current ones.']);
  return { errors: [], warnings, next, diff, mirrorsWritten, spokenTextChanged };
};

export const mcqHandler: ScreenHandler = {
  actionName: 'updateMcq',
  types: MCQ_TYPES,
  plan,
};
