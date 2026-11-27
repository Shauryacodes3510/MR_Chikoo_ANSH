/** AI Copilot – browser side API client (Wave 3). Auth = the admin's Supabase session token. */
import { supabase } from '../../../../lib/supabase';
import type { CopilotScope, ModuleLike } from '../../../../lib/copilot/types';
import { resolveScope } from '../../../../lib/copilot/server/context';

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

/** Sends ONLY the selected scope, never the whole curriculum. */
export const askCopilot = async (args: {
  modules: ModuleLike[];
  scope: CopilotScope;
  question: string;
  history: ChatTurn[];
}): Promise<string> => {
  const scoped = resolveScope(args.modules, args.scope);
  if (scoped.error) throw new CopilotClientError(scoped.error);
  const body = JSON.stringify({ scope: args.scope, modules: scoped.modules, question: args.question, history: args.history });
  if (body.length > MAX_BODY_CHARS) {
    throw new CopilotClientError('This selection is too large. Pick a single lesson or screen.');
  }
  let res: Response;
  try {
    res = await fetch('/api/copilot/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body,
    });
  } catch (e) {
    if (e instanceof CopilotClientError) throw e;
    throw new CopilotClientError('Could not reach the server. Check your connection.');
  }
  const out = await res.json().catch(() => ({}));
  if (!res.ok || !out.success) {
    throw new CopilotClientError(out.error || `Request failed (${res.status}).`);
  }
  return String(out.answer ?? '');
};
