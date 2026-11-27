/**
 * AI Copilot v1 – LLM adapter (Wave 2).
 * The rest of the Copilot only knows this tiny interface, so Gemini can be swapped for
 * Claude later by writing one more adapter. No API key ever leaves the server.
 */
import { GoogleGenAI } from '@google/genai';

export interface LlmRequest {
  system: string;
  user: string;
  /** Ask the model for strict JSON output (action / audit modes). */
  json?: boolean;
}

export interface LlmAdapter {
  generate(req: LlmRequest): Promise<string>;
}

export const DEFAULT_COPILOT_MODEL = 'gemini-3.5-flash';
const TIMEOUT_MS = 60_000;

export const createGeminiAdapter = (apiKey: string, model: string = DEFAULT_COPILOT_MODEL): LlmAdapter => {
  const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  return {
    async generate({ system, user, json }) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('AI request timed out.')), TIMEOUT_MS);
      });
      try {
        const call = ai.models.generateContent({
          model,
          contents: user,
          config: {
            systemInstruction: system,
            temperature: json ? 0.2 : 0.5,
            ...(json ? { responseMimeType: 'application/json' } : {}),
          },
        });
        const res = await Promise.race([call, timeout]);
        return (res as any).text ?? '';
      } finally {
        if (timer) clearTimeout(timer);
      }
    },
  };
};
