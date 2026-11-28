/**
 * AI Copilot v1 – Wave 2 service: ask / action / audit.
 * Pure orchestration (no express, no env): takes an LlmAdapter so it is fully testable.
 * Modes are enforced HERE, not in the prompt:
 *   ask    -> text only, never returns actions
 *   action -> LLM JSON -> parseActionPayload -> validateActions (dry run) -> diffs. Nothing is saved.
 *   audit  -> read-only scan; each finding may carry a fix that has passed the same dry run.
 */
import type { ActionResult, CopilotAction, CopilotScope, ModuleLike } from '../types';
import { parseActionPayload } from '../validate';
import { validateActions } from '../applyActions';
import { isPlainObject } from '../shared';
import type { LlmAdapter } from './llm';
import { ACTION_SYSTEM, ASK_SYSTEM, AUDIT_SYSTEM, CHAT_SYSTEM } from './prompts';
import {
  buildScopeView,
  handlerForType,
  listEditableScreens,
  resolveScope,
  serializeView,
  toAiScreenView,
} from './context';

export const MAX_INSTRUCTION_CHARS = 2000;
export const MAX_HISTORY_TURNS = 10;
export const AUDIT_BATCH_SIZE = 12;
export const AUDIT_MAX_SCREENS = 120;
const MAX_FINDINGS_PER_BATCH = 50;

export interface ChatTurn { role: 'user' | 'assistant'; text: string }

export class CopilotInputError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

/** Checks the scope object coming from the client. */
export const parseScope = (raw: unknown): CopilotScope => {
  if (!isPlainObject(raw)) throw new CopilotInputError('scope is required.');
  const s = (v: unknown) => (typeof v === 'string' && v.length > 0 && v.length < 200 ? v : null);
  if (raw.kind === 'screen' && s(raw.lessonId) && s(raw.screenId)) return { kind: 'screen', lessonId: raw.lessonId, screenId: raw.screenId };
  if (raw.kind === 'lesson' && s(raw.lessonId)) return { kind: 'lesson', lessonId: raw.lessonId };
  if (raw.kind === 'unit' && s(raw.unitId)) return { kind: 'unit', unitId: raw.unitId };
  throw new CopilotInputError('scope must be {kind:"screen"|"lesson"|"unit", ...ids}.');
};

export const parseModules = (raw: unknown): ModuleLike[] => {
  if (!Array.isArray(raw) || raw.length === 0) throw new CopilotInputError('modules (the selected curriculum data) is required.');
  return raw as ModuleLike[];
};

const cleanText = (v: unknown, label: string): string => {
  if (typeof v !== 'string' || !v.trim()) throw new CopilotInputError(`${label} is required.`);
  if (v.length > MAX_INSTRUCTION_CHARS) throw new CopilotInputError(`${label} is too long (max ${MAX_INSTRUCTION_CHARS} characters).`);
  return v.trim();
};

export const parseHistory = (raw: unknown): ChatTurn[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((t): t is ChatTurn => isPlainObject(t) && (t.role === 'user' || t.role === 'assistant') && typeof t.text === 'string')
    .slice(-MAX_HISTORY_TURNS)
    .map(t => ({ role: t.role, text: t.text.slice(0, MAX_INSTRUCTION_CHARS) }));
};

const prepare = (modulesRaw: unknown, scopeRaw: unknown) => {
  const scope = parseScope(scopeRaw);
  const resolved = resolveScope(parseModules(modulesRaw), scope);
  if (resolved.error) throw new CopilotInputError(resolved.error);
  const scoped = resolved.modules;
  const ser = serializeView(buildScopeView(scoped));
  if ('error' in ser) throw new CopilotInputError(ser.error, 413);
  return { scope, scoped, contextJson: ser.json };
};

const safeJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
  } catch {
    return null;
  }
};

// ───────────────────────── ASK ─────────────────────────
export const runAsk = async (
  llm: LlmAdapter,
  input: { modules: unknown; scope: unknown; question: unknown; history?: unknown },
) => {
  const { contextJson } = prepare(input.modules, input.scope);
  const question = cleanText(input.question, 'question');
  const history = parseHistory(input.history)
    .map(t => `${t.role === 'user' ? 'Admin' : 'Copilot'}: ${t.text}`)
    .join('\n');
  const user = `CURRICULUM (selected scope):\n${contextJson}\n\n${history ? `CHAT SO FAR:\n${history}\n\n` : ''}ADMIN QUESTION:\n${question}`;
  const answer = (await llm.generate({ system: ASK_SYSTEM, user })).trim();
  return { answer: answer || 'No answer was returned. Please try again.' };
};

// ───────────────────────── ACTION ─────────────────────────
export interface ActionResponse {
  actions: CopilotAction[];
  results: ActionResult[];
  message?: string;
  /** Problems with the AI's JSON that could not be fixed by the one retry. */
  errors: string[];
  retried: boolean;
}

export const runAction = async (
  llm: LlmAdapter,
  input: { modules: unknown; scope: unknown; instruction: unknown; history?: unknown },
): Promise<ActionResponse> => {
  const { scope, scoped, contextJson } = prepare(input.modules, input.scope);
  const instruction = cleanText(input.instruction, 'instruction');
  const history = parseHistory(input.history)
    .map(t => `${t.role === 'user' ? 'Admin' : 'Copilot'}: ${t.text}`)
    .join('\n');
  const user = `CURRICULUM (selected scope):\n${contextJson}\n\n${history ? `CHAT SO FAR:\n${history}\n\n` : ''}ADMIN REQUEST:\n${instruction}`;

  let raw = await llm.generate({ system: ACTION_SYSTEM, user, json: true });
  let parsed = parseActionPayload(raw);
  let retried = false;
  if (parsed.errors.length && parsed.actions.length === 0) {
    // One retry on invalid JSON / wrong shape, telling the model what was wrong.
    retried = true;
    raw = await llm.generate({
      system: ACTION_SYSTEM,
      user: `${user}\n\nYour previous answer was invalid: ${parsed.errors.join(' ')}\nReturn ONLY the corrected JSON.`,
      json: true,
    });
    parsed = parseActionPayload(raw);
  }

  const maybeMsg = safeJson(raw);
  const message = isPlainObject(maybeMsg) && typeof maybeMsg.message === 'string' ? maybeMsg.message.slice(0, 500) : undefined;

  const run = parsed.actions.length ? validateActions(scoped, parsed.actions, scope) : null;
  return {
    actions: parsed.actions,
    results: run ? run.results : [],
    message,
    errors: parsed.errors,
    retried,
  };
};

// ───────────────────────── AUDIT ─────────────────────────
export interface AuditFinding {
  lessonId: string;
  screenId: string;
  severity: 'error' | 'warning';
  problem: string;
  why: string;
  /** Present only if the suggested fix passed the same validation as a normal Action. */
  fixAction?: CopilotAction;
  fixResult?: ActionResult;
  fixError?: string;
}

export interface AuditResponse {
  findings: AuditFinding[];
  scanned: number;
  skippedUnsupported: number;
  batchErrors: string[];
}

export const runAudit = async (
  llm: LlmAdapter,
  input: { modules: unknown; scope: unknown; instruction?: unknown; history?: unknown },
): Promise<AuditResponse> => {
  const { scope, scoped } = prepare(input.modules, input.scope);
  const { items, skipped } = listEditableScreens(scoped);
  if (items.length === 0) {
    return { findings: [], scanned: 0, skippedUnsupported: skipped, batchErrors: [] };
  }
  if (items.length > AUDIT_MAX_SCREENS) {
    throw new CopilotInputError(`Too many screens to audit at once (${items.length}, max ${AUDIT_MAX_SCREENS}). Select a lesson or a smaller unit.`, 413);
  }

  const customInstruction = typeof input.instruction === 'string' && input.instruction.trim()
    ? input.instruction.trim()
    : '';
  const historyText = parseHistory(input.history)
    .map(t => `${t.role === 'user' ? 'Admin' : 'Copilot'}: ${t.text}`)
    .join('\n');

  const findings: AuditFinding[] = [];
  const batchErrors: string[] = [];
  for (let i = 0; i < items.length; i += AUDIT_BATCH_SIZE) {
    const batch = items.slice(i, i + AUDIT_BATCH_SIZE);
    const known = new Map(batch.map(b => [`${b.lessonId}::${b.screen.id}`, b]));
    const payload = JSON.stringify({ screens: batch.map(b => ({ lessonId: b.lessonId, ...toAiScreenView(b.screen) })) });
    try {
      const userPrompt = [
        historyText ? `RECENT CHAT CONVERSATION:\n${historyText}\n` : '',
        customInstruction ? `ADMIN SPECIAL INSTRUCTION FOR THIS AUDIT:\n"${customInstruction}"\nCRITICAL: Strictly adhere to the admin's instruction above! For example, if the admin asks to ignore a previously reported error, skip it. If the admin asks to focus on spelling, grammar, kids vocabulary, or story screens, prioritize those.\n` : '',
        `SCREENS TO AUDIT (Batch ${Math.floor(i / AUDIT_BATCH_SIZE) + 1}):\n${payload}`,
      ].filter(Boolean).join('\n');

      const raw = await llm.generate({ system: AUDIT_SYSTEM, user: userPrompt, json: true });
      const data = safeJson(raw);
      if (!isPlainObject(data) || !Array.isArray(data.findings)) {
        batchErrors.push(`Batch ${i / AUDIT_BATCH_SIZE + 1}: AI returned an invalid answer.`);
        continue;
      }
      for (const f of data.findings.slice(0, MAX_FINDINGS_PER_BATCH)) {
        if (!isPlainObject(f) || typeof f.lessonId !== 'string' || typeof f.screenId !== 'string') continue;
        const target = known.get(`${f.lessonId}::${f.screenId}`);
        if (!target) continue; // hallucinated / out-of-batch ids are dropped
        const finding: AuditFinding = {
          lessonId: f.lessonId,
          screenId: f.screenId,
          severity: f.severity === 'warning' ? 'warning' : 'error',
          problem: String(f.problem ?? '').slice(0, 500),
          why: String(f.why ?? '').slice(0, 800),
        };
        const fields = isPlainObject(f.fix) && isPlainObject(f.fix.fields) ? f.fix.fields : null;
        const handler = handlerForType(target.screen.type);
        if (fields && handler) {
          const action: CopilotAction = {
            action: handler.actionName,
            lessonId: f.lessonId,
            screenId: f.screenId,
            fields,
            reason: finding.problem.slice(0, 500),
          };
          const res = validateActions(scoped, [action], scope).results[0];
          if (res && res.status === 'ok') {
            finding.fixAction = action;
            finding.fixResult = res;
          } else {
            finding.fixError = `Suggested fix was rejected: ${(res?.errors || ['unknown']).join(' ')}`;
          }
        }
        findings.push(finding);
      }
    } catch (e: any) {
      batchErrors.push(`Batch ${i / AUDIT_BATCH_SIZE + 1}: ${e?.message || 'AI request failed.'}`);
    }
  }
  return { findings, scanned: items.length, skippedUnsupported: skipped, batchErrors };
};

// ───────────────────────── UNIFIED CHAT ─────────────────────────
export interface ChatResponse {
  intent: 'ask' | 'action' | 'audit';
  reply: string;
  actions?: CopilotAction[];
  results?: ActionResult[];
  findings?: AuditFinding[];
  scanned?: number;
  skippedUnsupported?: number;
  errors?: string[];
  retried?: boolean;
}

export const isAuditMessage = (msg: string): boolean => {
  const m = msg.toLowerCase().trim();
  // English audit patterns
  if (/\b(audit|scan)\b/i.test(m)) return true;
  if (/\b(check|find|look\s+for|spot)\b.*?\b(all|every|screens?|lessons?|unit|mistakes?|errors?|answers?|problems?|typos?)\b/i.test(m)) return true;
  if (/\b(mistakes?|errors?|bugs?|typos?)\b.*?\b(check|find|look|spot|verify)\b/i.test(m)) return true;
  // Hinglish / Hindi audit patterns
  if (/\b(galti(yan)?|mistake(s)?|kamiyan)\b/i.test(m) && /\b(check|dhundo|dekho|batao|nikalo|find)\b/i.test(m)) return true;
  if (/\b(sab|sare|saare|pura|poora)\b.*?\b(check|audit|dekho|scan)\b/i.test(m)) return true;
  if (/\b(screens?|lessons?|questions?|sawal)\b.*?\b(check|audit)\b/i.test(m)) return true;
  return false;
};

export const runChat = async (
  llm: LlmAdapter,
  input: { modules: unknown; scope: unknown; message: unknown; history?: unknown },
): Promise<ChatResponse> => {
  const { scope, scoped, contextJson } = prepare(input.modules, input.scope);
  const message = cleanText(input.message, 'message');
  const history = parseHistory(input.history)
    .map(t => `${t.role === 'user' ? 'Admin' : 'Copilot'}: ${t.text}`)
    .join('\n');
  const user = `CURRICULUM (selected scope):\n${contextJson}\n\n${history ? `CHAT SO FAR:\n${history}\n\n` : ''}ADMIN MESSAGE:\n${message}`;

  // Direct keyword short-circuit for audit commands to ensure 100% reliable audit triggering
  const isAuditIntent = isAuditMessage(message);
  if (isAuditIntent) {
    const auditRes = await runAudit(llm, {
      modules: input.modules,
      scope: input.scope,
      instruction: message,
      history: input.history,
    });
    const reply = auditRes.findings.length > 0
      ? `Audit complete for ${scope.kind}: scanned ${auditRes.scanned} screen(s), found ${auditRes.findings.length} issue(s). Review each finding below:`
      : `Audit complete for ${scope.kind}: scanned ${auditRes.scanned} screen(s). All screens verified against the Master Quality Standards!`;
    return {
      intent: 'audit',
      reply,
      findings: auditRes.findings,
      scanned: auditRes.scanned,
      skippedUnsupported: auditRes.skippedUnsupported,
    };
  }

  let raw = await llm.generate({ system: CHAT_SYSTEM, user, json: true });
  let parsedJson = safeJson(raw) as any;
  let retried = false;

  if (!isPlainObject(parsedJson)) {
    retried = true;
    raw = await llm.generate({
      system: CHAT_SYSTEM,
      user: `${user}\n\nYour previous response was not valid JSON. Return ONLY valid JSON with "intent" and "reply".`,
      json: true,
    });
    parsedJson = safeJson(raw) as any;
  }

  // If still not valid JSON, treat raw text as an Ask reply
  if (!isPlainObject(parsedJson)) {
    return {
      intent: 'ask',
      reply: raw.trim() || 'I could not process that request. Please try again.',
      retried,
    };
  }

  const intent = parsedJson.intent === 'action' || parsedJson.intent === 'audit' ? parsedJson.intent : 'ask';
  const reply = typeof parsedJson.reply === 'string' && parsedJson.reply.trim()
    ? parsedJson.reply.trim()
    : 'I have processed your request.';

  if (intent === 'audit') {
    const auditRes = await runAudit(llm, {
      modules: input.modules,
      scope: input.scope,
      instruction: message,
      history: input.history,
    });
    return {
      intent: 'audit',
      reply,
      findings: auditRes.findings,
      scanned: auditRes.scanned,
      skippedUnsupported: auditRes.skippedUnsupported,
      retried,
    };
  }

  if (intent === 'action') {
    const actionPayload = parseActionPayload(raw);
    if (actionPayload.actions.length > 0) {
      const run = validateActions(scoped, actionPayload.actions, scope);
      return {
        intent: 'action',
        reply,
        actions: actionPayload.actions,
        results: run.results,
        errors: actionPayload.errors,
        retried,
      };
    }
    return {
      intent: 'ask',
      reply,
      errors: actionPayload.errors,
      retried,
    };
  }

  return {
    intent: 'ask',
    reply,
    retried,
  };
};
