import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { LanguageCode } from '../types/governance';
import { TRANSLATIONS, type TranslationDictionary } from './translations';

interface I18nContextValue {
  lang: LanguageCode;
  dir: 'ltr' | 'rtl';
  t: TranslationDictionary;
  setLanguage: (lang: LanguageCode) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'aleaman_preferred_lang';

function isValidLang(value: string | null): value is LanguageCode {
  return value === 'en' || value === 'ta' || value === 'ar';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return isValidLang(saved) ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  const dir: 'ltr' | 'rtl' = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, [lang, dir]);

  const setLanguage = useCallback((nextLang: LanguageCode) => {
    setLangState(nextLang);
  }, []);

  return (
    <I18nContext.Provider
      value={{
        lang,
        dir,
        t: TRANSLATIONS[lang],
        setLanguage,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}
