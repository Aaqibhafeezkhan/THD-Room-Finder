import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Locale } from '../components/core/LanguageToggle';

/**
 * Minimal bilingual layer. The design system's rule is "one t(en, de) per
 * string" — components take their label text as props, so the same component
 * renders EN or DE unchanged. Room/building codes are never translated.
 */
export type Translate = (en: string, de: string) => string;

interface I18nValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translate;
}

const I18nContext = createContext<I18nValue | null>(null);
const STORAGE_KEY = 'thd_locale';

/**
 * A link may ask for a language with `?lang=de` or `?lang=en` (the about
 * pages do, so "Open app" opens the app in the language the visitor read).
 */
export function localeFromSearch(search: string): Locale | null {
  const lang = new URLSearchParams(search).get('lang');
  return lang === 'de' || lang === 'en' ? lang : null;
}

function initialLocale(): Locale {
  if (typeof location !== 'undefined') {
    const asked = localeFromSearch(location.search);
    if (asked) return asked;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'de') return saved;
  } catch {
    /* storage blocked */
  }
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('de')) {
    return 'de';
  }
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  // The language from the link is saved below; drop it from the address.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('lang')) return;
    url.searchParams.delete('lang');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nValue>(
    () => ({ locale, setLocale, t: (en, de) => (locale === 'de' ? de : en) }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>');
  return ctx;
}
