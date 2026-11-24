import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { SUPPORTED_LANGUAGES, LanguageInfo, MASTER_LANGUAGE_CODE } from './languages';
import { translate } from '../../locales';
import { domTranslator } from './domTranslator';

interface TranslationContextType {
  language: string;
  setLanguage: (lang: string) => void;
  languages: LanguageInfo[];
  currentLanguageInfo: LanguageInfo;
  isTranslating: boolean;
  isMasterLanguage: boolean;
  t: (
    keyOrText: string, 
    fallbackOrParams?: string | Record<string, string | number>,
    maybeParams?: Record<string, string | number>
  ) => string;
  translateText: (text: string) => Promise<string>;
  cachedCount: number;
  clearCache: () => void;
}

const STORAGE_LANG_KEY = 'chikoo_user_selected_language';
const STORAGE_UI_LANG_KEY = 'chikoo_ui_language';

const TranslationContext = createContext<TranslationContextType | null>(null);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(STORAGE_LANG_KEY) || 
               localStorage.getItem(STORAGE_UI_LANG_KEY) || 
               MASTER_LANGUAGE_CODE;
      }
    } catch {}
    return MASTER_LANGUAGE_CODE;
  });

  const setLanguage = useCallback((newLang: string) => {
    const valid = SUPPORTED_LANGUAGES.some(l => l.code === newLang);
    const target = valid ? newLang : MASTER_LANGUAGE_CODE;

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_LANG_KEY, target);
        localStorage.setItem(STORAGE_UI_LANG_KEY, target);
      }
    } catch {}

    if (typeof document !== 'undefined') {
      document.documentElement.lang = target;
    }

    domTranslator.setLanguage(target);
    setLanguageState(target);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
    domTranslator.setLanguage(language);
  }, [language]);

  const currentLanguageInfo = useMemo(() => {
    return SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const isMasterLanguage = language === MASTER_LANGUAGE_CODE;

  // Synchronous t() helper for fixed interface UI translation
  const t = useCallback((
    keyOrText: string, 
    fallbackOrParams?: string | Record<string, string | number>,
    maybeParams?: Record<string, string | number>
  ): string => {
    if (!keyOrText) return '';

    let params: Record<string, string | number> | undefined;
    let fallback: string | undefined;

    if (typeof fallbackOrParams === 'object' && fallbackOrParams !== null) {
      params = fallbackOrParams;
    } else if (typeof fallbackOrParams === 'string') {
      fallback = fallbackOrParams;
      if (typeof maybeParams === 'object' && maybeParams !== null) {
        params = maybeParams;
      }
    }

    const translated = translate(keyOrText, language, params);
    if (translated && translated !== keyOrText) {
      return translated;
    }

    if (fallback) {
      if (params) {
        return fallback.replace(/{(\w+)}/g, (_, k) => (params && params[k] !== undefined ? String(params[k]) : `{${k}}`));
      }
      return fallback;
    }

    return translated || keyOrText;
  }, [language]);

  const translateText = useCallback(async (text: string): Promise<string> => {
    return translate(text, language);
  }, [language]);

  const clearCache = useCallback(() => {
    // No-op for bundled localization dictionary
  }, []);

  const value = useMemo<TranslationContextType>(() => ({
    language,
    setLanguage,
    languages: SUPPORTED_LANGUAGES,
    currentLanguageInfo,
    isTranslating: false,
    isMasterLanguage,
    t,
    translateText,
    cachedCount: 100,
    clearCache
  }), [
    language,
    setLanguage,
    currentLanguageInfo,
    isMasterLanguage,
    t,
    translateText,
    clearCache
  ]);

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}
