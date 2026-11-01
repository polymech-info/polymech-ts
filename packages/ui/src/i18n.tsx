import React, { useState, useEffect, ReactNode, useMemo } from 'react';

// --- Language Configuration ---
type LangCode = 'en' | 'fr' | 'sw' | 'de' | 'es' | 'it' | 'ja' | 'ko' | 'pt' | 'ru' | 'tr' | 'zh' | 'nl';
const DEFAULT_LANG: LangCode = 'en';

export const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'sw', name: 'Kiswahili' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'it', name: 'Itali' },
  { code: 'zh', name: '中文' }
];


// --- LocalStorage persistence for requested terms ---
const LS_KEY = 'i18n-requested-terms';

const loadRequestedTerms = (): { [lang: string]: Record<string, string> } => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(LS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveRequestedTerms = (cache: { [lang: string]: Record<string, string> }) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cache));
  } catch { /* quota exceeded — ignore */ }
};

// --- Caching and Loading ---
const translationCache: { [lang: string]: Record<string, string> } = loadRequestedTerms();
const loadingPromises: { [lang: string]: Promise<Record<string, string>> } = {};
const translationsLoaded: { [lang: string]: boolean } = {};

// --- Pub/Sub for updates ---
let listeners: (() => void)[] = [];
const subscribe = (callback: () => void) => {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
};
const notify = () => {
  listeners.forEach(l => l());
};

// Pre-register all i18n JSON modules eagerly — Vite HMR will update on file change
const langModules = import.meta.glob('./i18n/*.json', { eager: true }) as Record<string, { default: Record<string, string> }>;

const loadTranslations = (lang: LangCode): Promise<Record<string, string>> => {
  if (translationsLoaded[lang]) {
    return Promise.resolve(translationCache[lang] || {});
  }

  const key = `./i18n/${lang}.json`;
  const mod = langModules[key];
  if (!mod) {
    console.warn(`No i18n file found for language: ${lang}`);
    return Promise.resolve(translationCache[lang] || {});
  }

  const translations = mod.default;
  const existingCache = translationCache[lang] || {};
  translationCache[lang] = { ...existingCache, ...translations };
  translationsLoaded[lang] = true;
  notify();
  return Promise.resolve(translationCache[lang]);
};

// Helper to get cookie value
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

// Helper to set cookie value
const setCookie = (name: string, value: string, days: number = 365) => {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

const getCurrentLangInternal = (): LangCode => {
  if (typeof window !== 'undefined') {
    // 1. Check URL parameter first (highest priority — allows shareable links)
    const params = new URLSearchParams(window.location.search);
    const langParam = params.get('lang') as LangCode;
    if (langParam && langParam.length === 2) {
      // Save to cookie so subsequent navigations keep the language
      setCookie('lang', langParam);
      return langParam;
    }

    // 2. Check cookie
    const cookieLang = getCookie('lang') as LangCode;
    if (cookieLang && cookieLang.length === 2) {
      return cookieLang;
    }

    // 3. Fallback to browser language
    const browserLangs = navigator.languages || [navigator.language];
    for (const lang of browserLangs) {
      const shortLang = lang.split('-')[0] as LangCode;
      if (shortLang && shortLang.length === 2) {
        return shortLang;
      }
    }
  }
  return DEFAULT_LANG;
};
export const getCurrentLang = getCurrentLangInternal;

// Function to change language and save to cookie
export const setLanguage = (langCode: LangCode) => {
  setCookie('lang', langCode);
  // Reload to apply new language
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};


// Helper function to get a translated string directly (SYNC)
export const translate = (textKey: string, langParam?: LangCode): string => {
  const langToUse = langParam || getCurrentLangInternal();

  // 1. Try loaded translations for current language
  if (translationsLoaded[langToUse] && translationCache[langToUse] && translationCache[langToUse][textKey] !== undefined) {
    return translationCache[langToUse][textKey];
  }

  // 2. If not found and lang is not default, try loaded translations for default language
  if (langToUse !== DEFAULT_LANG && translationsLoaded[DEFAULT_LANG] && translationCache[DEFAULT_LANG] && translationCache[DEFAULT_LANG][textKey] !== undefined) {
    return translationCache[DEFAULT_LANG][textKey];
  }

  // 3. Auto-populate cache with key for dictionary building (only if not already loaded)
  if (!translationCache[langToUse]) {
    translationCache[langToUse] = {};
  }
  if (translationCache[langToUse][textKey] === undefined) {
    translationCache[langToUse][textKey] = textKey; // Store key as value for now
    saveRequestedTerms(translationCache); // Persist to localStorage
  }

  // 4. Ultimate fallback: return the key itself
  return textKey;
};

interface TProps {
  children: ReactNode;
}

const T: React.FC<TProps> = ({ children }) => {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    return subscribe(() => {
      forceUpdate(c => c + 1);
    });
  }, []);

  const currentLang = getCurrentLangInternal();
  useEffect(() => {
    loadTranslations(currentLang);
  }, [currentLang]);

  const textKey = useMemo(() => {
    if (typeof children === 'string') return children;
    if (React.isValidElement(children) && typeof children.props.children === 'string') {
      return children.props.children;
    }
    return null;
  }, [children]);

  if (!textKey) {
    return <>{children}</>;
  }

  const translatedString = translate(textKey, currentLang);

  if (React.isValidElement(children) && typeof children.props.children === 'string') {
    return React.cloneElement(children, {}, translatedString);
  }
  return <>{translatedString}</>;
};

export const getTranslationCache = (lang?: LangCode): Record<string, string> | Record<string, Record<string, string>> => {
  if (lang) {
    return translationCache[lang] || {};
  }
  return translationCache;
};

// Helper function to download collected translations as JSON file
export const downloadTranslations = (lang: LangCode = 'en') => {
  const translations = translationCache[lang] || {};
  const isLoaded = translationsLoaded[lang];

  const sortedTranslations = Object.keys(translations)
    .sort()
    .reduce((result, key) => {
      result[key] = translations[key];
      return result;
    }, {} as Record<string, string>);

  const jsonString = JSON.stringify(sortedTranslations, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${lang}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log(`Downloaded ${Object.keys(sortedTranslations).length} translation keys for language: ${lang} (${isLoaded ? 'loaded from file' : 'auto-collected'})`);
};

// Helper function to check translation loading status
export const getTranslationStatus = (lang?: LangCode) => {
  if (lang) {
    return {
      loaded: translationsLoaded[lang] || false,
      keysCount: Object.keys(translationCache[lang] || {}).length
    };
  }

  const status: Record<string, { loaded: boolean; keysCount: number }> = {};
  for (const langCode of Object.keys(translationCache)) {
    status[langCode] = {
      loaded: translationsLoaded[langCode] || false,
      keysCount: Object.keys(translationCache[langCode] || {}).length
    };
  }
  return status;
};

// Merge external translations into cache and persist
export const mergeTranslations = (lang: LangCode, translations: Record<string, string>) => {
  if (!translationCache[lang]) {
    translationCache[lang] = {};
  }
  Object.assign(translationCache[lang], translations);
  saveRequestedTerms(translationCache);
  notify();
};

// Read persisted requested terms from localStorage
export const getRequestedTerms = (lang?: LangCode): Record<string, string> | { [lang: string]: Record<string, string> } => {
  const stored = loadRequestedTerms();
  if (lang) return stored[lang] || {};
  return stored;
};

if (typeof window !== 'undefined') {
  (window as any).getTranslationCache = getTranslationCache;
  (window as any).translate = translate;
  (window as any).getCurrentLang = getCurrentLang;
  (window as any).downloadTranslations = downloadTranslations;
  (window as any).getTranslationStatus = getTranslationStatus;
  (window as any).mergeTranslations = mergeTranslations;
  (window as any).getRequestedTerms = getRequestedTerms;
}

export { T };
