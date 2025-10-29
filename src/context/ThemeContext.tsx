import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'night' | 'day';

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'chasingprophets.theme';

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'night';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'night' || stored === 'day') {
    return stored;
  }
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'night' : 'day';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => getInitialTheme());

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;
    root.classList.remove('theme-day', 'theme-night');
    body.classList.remove('theme-day', 'theme-night');
    const nextClass = `theme-${theme}`;
    root.classList.add(nextClass);
    body.classList.add(nextClass);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event: MediaQueryListEvent) => {
      setThemeState(event.matches ? 'night' : 'day');
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
  };

  const toggleTheme = () => {
    setThemeState(current => (current === 'night' ? 'day' : 'night'));
  };

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
