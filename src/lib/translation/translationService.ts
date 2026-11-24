import { isUserFacingText } from './filterUtils';
import { CORE_UI_DICTIONARY, MASTER_LANGUAGE_CODE } from './languages';
import { getAdminAuthHeaders } from '../supabase';

const CACHE_STORAGE_KEY = 'chikoo_translation_cache_v2';
const MAX_LOCALSTORAGE_KEYS = 2500;

class TranslationService {
  // Memory Cache keyed strictly by `${targetLanguage}:::${text}`
  private memoryCache: Map<string, string> = new Map();

  // Strings currently in-flight to prevent duplicate simultaneous requests
  private inFlightKeys: Set<string> = new Set();

  // Pending queue of unique text strings per target language: Map<targetLanguage, Set<string>>
  private batchQueue: Map<string, Set<string>> = new Map();

  // Callbacks awaiting batch completion: Map<`${targetLanguage}:::${text}`, Array<(res: string) => void>>
  private pendingCallbacks: Map<string, Array<(translated: string) => void>> = new Map();

  // Debounce timers per target language
  private debounceTimers: Map<string, any> = new Map();

  // Listeners for cache updates
  private listeners: Set<(lang: string) => void> = new Set();

  constructor() {
    this.loadInitialCache();
  }

  /**
   * Generates a deterministic cache key for text + targetLanguage.
   */
  public getCacheKey(text: string, targetLanguage: string): string {
    return `${targetLanguage}:::${text.trim()}`;
  }

  /**
   * Initialize in-memory cache from pre-warmed dictionary and localStorage.
   */
  private loadInitialCache() {
    // 1. Seed pre-warmed core UI dictionary
    for (const [lang, dict] of Object.entries(CORE_UI_DICTIONARY)) {
      for (const [src, trans] of Object.entries(dict)) {
        this.memoryCache.set(this.getCacheKey(src, lang), trans);
      }
    }

    // 2. Load persisted cache from localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(CACHE_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            for (const [k, v] of Object.entries(parsed)) {
              if (typeof v === 'string') {
                this.memoryCache.set(k, v);
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('[TranslationService] Error loading localStorage cache:', e);
    }
  }

  /**
   * Persist cache to localStorage safely.
   */
  private persistCache() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const obj: Record<string, string> = {};
      let count = 0;
      for (const [k, v] of this.memoryCache.entries()) {
        if (count >= MAX_LOCALSTORAGE_KEYS) break;
        obj[k] = v;
        count++;
      }
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {
      console.warn('[TranslationService] Could not persist to localStorage:', e);
    }
  }

  /**
   * Synchronous check if text is already cached for the specified target language.
   * If found, returns the translated string with original whitespace preserved.
   * Otherwise returns null.
   */
  public getCached(text: string, targetLanguage: string): string | null {
    if (!text || targetLanguage === MASTER_LANGUAGE_CODE) return text;
    const trimmed = text.trim();
    if (!trimmed) return text;

    const cacheKey = this.getCacheKey(trimmed, targetLanguage);
    if (this.memoryCache.has(cacheKey)) {
      const translated = this.memoryCache.get(cacheKey)!;
      return this.matchWhitespace(text, translated);
    }
    return null;
  }

  /**
   * Checks if text + targetLanguage is cached (boolean).
   */
  public isCached(text: string, targetLanguage: string): boolean {
    if (!text || targetLanguage === MASTER_LANGUAGE_CODE) return true;
    const cacheKey = this.getCacheKey(text, targetLanguage);
    return this.memoryCache.has(cacheKey);
  }

  /**
   * Get number of cached entries for target language.
   */
  public getCachedCount(targetLanguage: string): number {
    let count = 0;
    const prefix = `${targetLanguage}:::`;
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) count++;
    }
    return count;
  }

  /**
   * Clear cache for a specific language or all languages.
   */
  public clearCache(targetLanguage?: string) {
    if (targetLanguage) {
      const prefix = `${targetLanguage}:::`;
      for (const key of Array.from(this.memoryCache.keys())) {
        if (key.startsWith(prefix)) {
          this.memoryCache.delete(key);
        }
      }
    } else {
      this.memoryCache.clear();
      this.loadInitialCache();
    }
    this.persistCache();
    this.notifyListeners(targetLanguage || 'all');
  }

  /**
   * Subscribe to cache updates.
   */
  public subscribe(callback: (lang: string) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(lang: string) {
    this.listeners.forEach(cb => {
      try {
        cb(lang);
      } catch (e) {
        console.error(e);
      }
    });
  }

  /**
   * Request translation for a single text. Debounced and batched automatically.
   */
  public async translateText(text: string, targetLanguage: string): Promise<string> {
    if (!text || !targetLanguage || targetLanguage === MASTER_LANGUAGE_CODE) {
      return text;
    }

    if (!isUserFacingText(text)) {
      return text;
    }

    // Return cached immediately if available
    const cached = this.getCached(text, targetLanguage);
    if (cached !== null) {
      return cached;
    }

    const trimmed = text.trim();
    const cacheKey = this.getCacheKey(trimmed, targetLanguage);

    return new Promise<string>((resolve) => {
      let callbacks = this.pendingCallbacks.get(cacheKey);
      if (!callbacks) {
        callbacks = [];
        this.pendingCallbacks.set(cacheKey, callbacks);
      }
      callbacks.push((translated: string) => {
        resolve(this.matchWhitespace(text, translated));
      });

      // If not already in-flight or in queue, add to batch queue
      if (!this.inFlightKeys.has(cacheKey)) {
        let queue = this.batchQueue.get(targetLanguage);
        if (!queue) {
          queue = new Set();
          this.batchQueue.set(targetLanguage, queue);
        }
        queue.add(trimmed);
      }

      this.scheduleBatch(targetLanguage);
    });
  }

  /**
   * Batch translate multiple strings in one single request.
   */
  public async translateBatch(texts: string[], targetLanguage: string): Promise<Record<string, string>> {
    if (!targetLanguage || targetLanguage === MASTER_LANGUAGE_CODE) {
      const identity: Record<string, string> = {};
      texts.forEach(t => { identity[t] = t; });
      return identity;
    }

    const results: Record<string, string> = {};
    const uncachedToFetch: string[] = [];

    // 1. Separate cached items from uncached items
    for (const rawText of texts) {
      if (!rawText || !isUserFacingText(rawText)) {
        results[rawText] = rawText;
        continue;
      }

      const cached = this.getCached(rawText, targetLanguage);
      if (cached !== null) {
        results[rawText] = cached;
      } else {
        const trimmed = rawText.trim();
        uncachedToFetch.push(trimmed);
      }
    }

    // If all were cached, return instantly with zero network overhead
    if (uncachedToFetch.length === 0) {
      return results;
    }

    // 2. Queue uncached items and await their resolution
    const uniqueUncached = Array.from(new Set(uncachedToFetch));
    const promises = uniqueUncached.map(str => this.translateText(str, targetLanguage));
    const translatedList = await Promise.all(promises);

    uniqueUncached.forEach((str, idx) => {
      results[str] = translatedList[idx] || str;
    });

    return results;
  }

  /**
   * Debounce trigger for batch execution (snappy 40ms window to gather all on-screen elements)
   */
  private scheduleBatch(targetLanguage: string) {
    if (this.debounceTimers.has(targetLanguage)) return;

    const timer = setTimeout(() => {
      this.debounceTimers.delete(targetLanguage);
      this.processBatch(targetLanguage);
    }, 40);

    this.debounceTimers.set(targetLanguage, timer);
  }

  /**
   * Executes a single batched HTTP request for all queued strings in targetLanguage.
   */
  private async processBatch(targetLanguage: string) {
    const queue = this.batchQueue.get(targetLanguage);
    if (!queue || queue.size === 0) return;

    const textsToTranslate = Array.from(queue);
    // Mark as in flight and clear from queue
    queue.clear();

    textsToTranslate.forEach(t => {
      this.inFlightKeys.add(this.getCacheKey(t, targetLanguage));
    });

    try {
      const headers = await getAdminAuthHeaders();
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          texts: textsToTranslate,
          targetLanguage,
          sourceLanguage: MASTER_LANGUAGE_CODE
        })
      });

      let translationMap: Record<string, string> = {};

      if (response.ok) {
        const data = await response.json();
        if (data && data.translations) {
          translationMap = data.translations;
        }
      }

      // Save to memory cache & notify awaiting promises
      for (const src of textsToTranslate) {
        const cacheKey = this.getCacheKey(src, targetLanguage);
        const translated = translationMap[src] || src; // Fallback to original text if translation failed

        this.memoryCache.set(cacheKey, translated);
        this.inFlightKeys.delete(cacheKey);

        const callbacks = this.pendingCallbacks.get(cacheKey);
        if (callbacks) {
          callbacks.forEach(cb => cb(translated));
          this.pendingCallbacks.delete(cacheKey);
        }
      }

      this.persistCache();
      this.notifyListeners(targetLanguage);
    } catch (err) {
      console.warn(`[TranslationService] Translation batch failed for ${targetLanguage}. Retaining original text:`, err);
      
      // Fallback gracefully: resolve with original text so UI and lesson flow never breaks
      for (const src of textsToTranslate) {
        const cacheKey = this.getCacheKey(src, targetLanguage);
        this.inFlightKeys.delete(cacheKey);

        const callbacks = this.pendingCallbacks.get(cacheKey);
        if (callbacks) {
          callbacks.forEach(cb => cb(src));
          this.pendingCallbacks.delete(cacheKey);
        }
      }
    }

    // If new items were added while batch was processing, trigger next batch
    if (queue.size > 0) {
      this.scheduleBatch(targetLanguage);
    }
  }

  /**
   * Preserve leading and trailing whitespace from original string.
   */
  private matchWhitespace(original: string, translated: string): string {
    const leadingMatch = original.match(/^\s*/);
    const trailingMatch = original.match(/\s*$/);
    const leading = leadingMatch ? leadingMatch[0] : '';
    const trailing = trailingMatch ? trailingMatch[0] : '';
    return leading + translated.trim() + trailing;
  }
}

export const translationService = new TranslationService();
