/**
 * AI Copilot v1 – express routes (Wave 2).
 *   POST /api/copilot/ask     read-only chat, text only
 *   POST /api/copilot/action  AI proposes edits -> validated diff. NOTHING is saved here.
 *   POST /api/copilot/audit   read-only scan with validated Fix suggestions
 * Admin only (same isAdmin() as generate-screen-narration). The Gemini key stays on the server.
 * Saving is done by the client (Wave 3) via saveCurriculumToStorage after the admin clicks Apply.
 */
import type express from 'express';
import { createGeminiAdapter, DEFAULT_COPILOT_MODEL, type LlmAdapter } from './llm';
import { CopilotInputError, runAction, runAsk, runAudit, runChat } from './service';

export interface CopilotRouteDeps {
  isAdmin: (req: express.Request) => Promise<boolean>;
  /** Test hook: replace the real Gemini adapter. */
  adapterFactory?: () => LlmAdapter | null;
}

const defaultAdapter = (): LlmAdapter | null => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return createGeminiAdapter(key, process.env.COPILOT_MODEL || DEFAULT_COPILOT_MODEL);
};

export const registerCopilotRoutes = (app: express.Express, deps: CopilotRouteDeps) => {
  const handle =
    (name: string, fn: (llm: LlmAdapter, body: any) => Promise<unknown>) =>
    async (req: express.Request, res: express.Response) => {
      if (!(await deps.isAdmin(req))) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Admin access required' });
      }
      const llm = (deps.adapterFactory ?? defaultAdapter)();
      if (!llm) return res.status(500).json({ success: false, error: 'GEMINI_API_KEY is missing.' });
      try {
        const data = await fn(llm, req.body || {});
        return res.json({ success: true, ...(data as object) });
      } catch (e: any) {
        if (e instanceof CopilotInputError) return res.status(e.status).json({ success: false, error: e.message });
        console.error(`[copilot/${name}]`, e?.message || e);
        return res.status(502).json({ success: false, error: 'The AI request failed. Please try again.' });
      }
    };

  app.post('/api/copilot/ask', handle('ask', (llm, b) => runAsk(llm, b)));
  app.post('/api/copilot/action', handle('action', (llm, b) => runAction(llm, b)));
  app.post('/api/copilot/audit', handle('audit', (llm, b) => runAudit(llm, b)));
  app.post('/api/copilot/chat', handle('chat', (llm, b) => runChat(llm, b)));
};
