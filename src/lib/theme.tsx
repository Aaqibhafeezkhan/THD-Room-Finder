import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Theme control. The token CSS is light by default, follows the OS in dark
 * (`prefers-color-scheme`), and honours an explicit `data-theme` override — so
 * this provider just sets/clears that attribute and persists the choice.
 *   'system' → remove the attribute (device decides — a strength of the current app)
 *   'light' / 'dark' → force it.
 */
export type Theme = 'system' | 'light' | 'dark';

/**
 * Focus graph colour (D4). Violet is the default ramp; Orchid and Graphite
 * set `data-accent`, which must sit on the same element as `data-theme`.
 */
export type Accent = 'violet' | 'orchid' | 'graphite';

const STORAGE_KEY = 'thd_theme';
const ACCENT_KEY = 'thd_accent';
const ORDER: Theme[] = ['system', 'light', 'dark'];

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch {
    /* ignore */
  }
  return 'system';
}

function initialAccent(): Accent {
  try {
    const saved = localStorage.getItem(ACCENT_KEY);
    if (saved === 'orchid' || saved === 'graphite') return saved;
  } catch {
    /* ignore */
  }
  return 'violet';
}

function applyAccent(accent: Accent): void {
  const root = document.documentElement;
  if (accent === 'violet') root.removeAttribute('data-accent');
  else root.setAttribute('data-accent', accent);
}

function apply(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

interface ThemeValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  cycle: () => void;
  accent: Accent;
  setAccent: (a: Accent) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [accent, setAccent] = useState<Accent>(initialAccent);

  useEffect(() => {
    apply(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    applyAccent(accent);
    try {
      localStorage.setItem(ACCENT_KEY, accent);
    } catch {
      /* ignore */
    }
  }, [accent]);

  const cycle = useCallback(() => {
    setTheme((prev) => ORDER[(ORDER.indexOf(prev) + 1) % ORDER.length]);
  }, []);

  const value = useMemo<ThemeValue>(
    () => ({ theme, setTheme, cycle, accent, setAccent }),
    [theme, cycle, accent],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}
