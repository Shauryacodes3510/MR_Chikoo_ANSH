import { GoogleGenAI } from "@google/genai";
import { logProductionError } from "./errorUtils";

export type GeminiErrorType = 
  | 'AUTH_ERROR'
  | 'INVALID_REQUEST'
  | 'RATE_LIMIT'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'MALFORMED_RESPONSE'
  | 'UNKNOWN';

export class GeminiError extends Error {
  constructor(public type: GeminiErrorType, message: string, public originalError?: any) {
    super(message);
    this.name = 'GeminiError';
  }
}

export function classifyGeminiError(err: any): GeminiError {
  const msg = (err?.message || String(err)).toLowerCase();
  
  if (err instanceof GeminiError) {
    return err;
  }
  if (msg.includes('api key') || msg.includes('unauthorized') || msg.includes('auth') || msg.includes('401') || msg.includes('403')) {
    return new GeminiError('AUTH_ERROR', 'Gemini authentication or configuration failed.', err);
  }
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('quota')) {
    return new GeminiError('RATE_LIMIT', 'Gemini rate limit exceeded.', err);
  }
  if (msg.includes('timeout') || msg.includes('timed out') || msg.name === 'AbortError') {
    return new GeminiError('TIMEOUT', 'Gemini request timed out.', err);
  }
  if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('504') || msg.includes('unavailable') || msg.includes('overloaded')) {
    return new GeminiError('SERVER_ERROR', 'Gemini upstream service failure.', err);
  }
  if (msg.includes('invalid') || msg.includes('bad request') || msg.includes('400') || msg.includes('schema')) {
    return new GeminiError('INVALID_REQUEST', 'Invalid request sent to Gemini API.', err);
  }
  if (msg.includes('network') || msg.includes('enotfound') || msg.includes('econnrefused')) {
    return new GeminiError('NETWORK_ERROR', 'Network connection error while contacting Gemini API.', err);
  }
  
  return new GeminiError('UNKNOWN', err?.message || 'An unknown Gemini error occurred.', err);
}

export class GeminiService {
  private static instance: GeminiService;
  private client: GoogleGenAI | null = null;

  private constructor() {
    this.initClient();
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  private initClient() {
    // Use server-side GEMINI_API_KEY exclusively. Never use VITE_ prefixes for backend Gemini service.
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-api-key-here') {
      this.client = null;
      return;
    }

    try {
      this.client = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        } as any
      });
    } catch (err) {
      logProductionError('gemini_client_init', 'src/lib/geminiService.ts', 'server', err);
      this.client = null;
    }
  }

  public getClient(): GoogleGenAI {
    if (!this.client) {
      this.initClient();
    }
    if (!this.client) {
      throw new GeminiError('AUTH_ERROR', 'Gemini API client is not initialized. Please configure GEMINI_API_KEY environment variable.');
    }
    return this.client;
  }

  public async generateContent(params: {
    model: string;
    contents: any;
    config?: any;
    timeoutMs?: number;
  }): Promise<any> {
    const timeoutMs = params.timeoutMs || 60000; // Default 60s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      clearTimeout(timeoutId);
      throw new GeminiError('AUTH_ERROR', 'GEMINI_API_KEY is not configured.');
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
        signal: controller.signal
      } as any
    });

    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model: params.model,
          contents: params.contents,
          config: params.config
        }),
        new Promise((_, reject) => 
          setTimeout(() => {
            controller.abort();
            reject(new GeminiError('TIMEOUT', `Gemini request timed out after ${timeoutMs}ms and underlying fetch was aborted`));
          }, timeoutMs)
        )
      ]);
      clearTimeout(timeoutId);
      return response;
    } catch (err: any) {
      clearTimeout(timeoutId);
      const classified = classifyGeminiError(err);
      // Safe logging: log error type and model name only. Never log prompts, generated text, or API keys.
      logProductionError('gemini_generate', 'src/lib/geminiService.ts', 'server', classified, { model: params.model });
      throw classified;
    }
  }

  public async generateContentStream(params: {
    model: string;
    contents: any;
    config?: any;
    timeoutMs?: number;
  }): Promise<any> {
    const timeoutMs = params.timeoutMs || 60000;
    const controller = new AbortController();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new GeminiError('AUTH_ERROR', 'GEMINI_API_KEY is not configured.');
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
        signal: controller.signal
      } as any
    });

    try {
      return await ai.models.generateContentStream({
        model: params.model,
        contents: params.contents,
        config: params.config
      });
    } catch (err: any) {
      const classified = classifyGeminiError(err);
      logProductionError('gemini_stream', 'src/lib/geminiService.ts', 'server', classified, { model: params.model });
      throw classified;
    }
  }
}

export const geminiService = GeminiService.getInstance();
