/** AI Copilot – browser side API client (Wave 3). Auth = the admin's Supabase session token. */
import { supabase } from '../../../../lib/supabase';
import type { CopilotScope, ModuleLike } from '../../../../lib/copilot/types';
import { resolveScope } from '../../../../lib/copilot/server/context';
import type { ActionResponse, AuditResponse, AuditFinding, ChatResponse } from '../../../../lib/copilot/server/service';

export type { ActionResponse, AuditResponse, AuditFinding, ChatResponse };

/** Server body limit is 1 MB; stay well under it. */
const MAX_BODY_CHARS = 900_000;

export interface ChatTurn { role: 'user' | 'assistant'; text: string }

export class CopilotClientError extends Error {}

const authHeader = async (): Promise<Record<string, string>> => {
  const { data } = (await supabase?.auth.getSession()) ?? { data: null };
  const token = data?.session?.access_token;
  if (!token) throw new CopilotClientError('Admin login expired. Please log in again.');
  return { Authorization: `Bearer ${token}` };
};

const post = async (path: string, body: unknown): Promise<any> => {
  const text = JSON.stringify(body);
  if (text.length > MAX_BODY_CHARS) {
    throw new CopilotClientError('This selection is too large. Pick a single lesson or screen.');
  }
  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: text,
    });
  } catch (e) {
    if (e instanceof CopilotClientError) throw e;
    throw new CopilotClientError('Could not reach the server. Check your connection.');
  }
  const out = await res.json().catch(() => ({}));
  if (!res.ok || !out.success) {
    throw new CopilotClientError(out.error || `Request failed (${res.status}).`);
  }
  return out;
};

/** Sends ONLY the selected scope, never the whole curriculum. */
const scoped = (modules: ModuleLike[], scope: CopilotScope): ModuleLike[] => {
  const r = resolveScope(modules, scope);
  if (r.error) throw new CopilotClientError(r.error);
  return r.modules;
};

export const askCopilot = async (args: { modules: ModuleLike[]; scope: CopilotScope; question: string; history: ChatTurn[] }): Promise<string> => {
  const out = await post('/api/copilot/ask', { scope: args.scope, modules: scoped(args.modules, args.scope), question: args.question, history: args.history });
  return String(out.answer ?? '');
};

/** Action mode: the AI proposes edits. NOTHING is saved by this call. */
export const proposeActions = async (args: { modules: ModuleLike[]; scope: CopilotScope; instruction: string; history?: ChatTurn[] }): Promise<ActionResponse> => {
  const out = await post('/api/copilot/action', { scope: args.scope, modules: scoped(args.modules, args.scope), instruction: args.instruction, history: args.history ?? [] });
  return out as ActionResponse;
};

/** Audit mode: read-only scan. NOTHING is saved by this call. */
export const runAuditScan = async (args: { modules: ModuleLike[]; scope: CopilotScope }): Promise<AuditResponse> => {
  const out = await post('/api/copilot/audit', { scope: args.scope, modules: scoped(args.modules, args.scope) });
  return out as AuditResponse;
};

/** Unified chat: answers questions, proposes actions, or audits automatically based on context and message. */
export const sendCopilotChat = async (args: {
  modules: ModuleLike[];
  scope: CopilotScope;
  message: string;
  history?: ChatTurn[];
}): Promise<ChatResponse> => {
  const out = await post('/api/copilot/chat', {
    scope: args.scope,
    modules: scoped(args.modules, args.scope),
    message: args.message,
    history: args.history ?? [],
  });
  return out as ChatResponse;
};
