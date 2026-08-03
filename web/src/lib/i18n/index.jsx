import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import es from './es.js';
import en from './en.js';

const DICTS = { es, en };
const STORAGE_KEY = 'uslearn_lang';
const FALLBACK = 'es';

const LanguageContext = createContext(null);

function resolve(key, lang) {
  const dict = DICTS[lang] || DICTS[FALLBACK];
  const val = dict[key];
  if (typeof val === 'string') return val;
  if (val !== undefined) return val;
  return DICTS[FALLBACK][key] ?? key;
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'es' || saved === 'en') return saved;
    } catch {
      /* noop */
    }
    return FALLBACK;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* noop */
    }
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => {
    const t = (key, params = {}) => {
      let str = resolve(key, lang);
      if (typeof str === 'string' && params && typeof params === 'object') {
        str = str.replace(/\{(\w+)\}/g, (m, name) =>
          params[name] !== undefined ? String(params[name]) : m
        );
      }
      return str;
    };
    const toggle = () => setLang((prev) => (prev === 'es' ? 'en' : 'es'));
    return { lang, setLang, toggle, t };
  }, [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useI18n must be used within a LanguageProvider');
  }
  return ctx;
}
