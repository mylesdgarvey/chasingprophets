import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { themes, getThemeById, type Theme } from '../themes/themeConfigs';

export type ThemeMode = 'night-blue' | 'day-light' | 'cyber-purple' | 'forest-green' | 'sunset-orange' | 'deep-space' | 'psychedelic' | 'night' | 'day';

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  currentThemeConfig: Theme;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'chasingprophets.theme';

// Map legacy themes to new theme IDs
const THEME_MIGRATION_MAP: Record<string, ThemeMode> = {
  'night': 'night-blue',
  'day': 'day-light',
};

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'night-blue';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  
  // Migrate legacy themes
  if (stored && THEME_MIGRATION_MAP[stored]) {
    return THEME_MIGRATION_MAP[stored];
  }
  
  if (stored === 'night-blue' || stored === 'day-light' || stored === 'cyber-purple' || 
      stored === 'forest-green' || stored === 'sunset-orange' || stored === 'deep-space' || 
      stored === 'psychedelic') {
    return stored;
  }
  
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'night-blue' : 'day-light';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => getInitialTheme());

  // Get the current theme configuration
  const currentThemeConfig = useMemo(() => {
    // Map legacy theme names to new IDs
    const themeId = THEME_MIGRATION_MAP[theme] || theme;
    return getThemeById(themeId);
  }, [theme]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;
    
    // Remove old theme classes
    root.classList.remove('theme-day', 'theme-night', 'theme-night-blue', 'theme-day-light', 
                          'theme-cyber-purple', 'theme-forest-green', 'theme-sunset-orange', 'theme-deep-space');
    body.classList.remove('theme-day', 'theme-night', 'theme-night-blue', 'theme-day-light',
                          'theme-cyber-purple', 'theme-forest-green', 'theme-sunset-orange', 'theme-deep-space');
    
    // Add new theme class
    const themeClass = `theme-${currentThemeConfig.id}`;
    root.classList.add(themeClass);
    body.classList.add(themeClass);
    
    // Apply theme colors as CSS variables
    const colors = currentThemeConfig.colors;
    root.style.setProperty('--bg-primary', colors.bgPrimary);
    root.style.setProperty('--bg-secondary', colors.bgSecondary);
    root.style.setProperty('--bg-sidebar', colors.bgSidebar);
    root.style.setProperty('--bg-card', colors.bgCard);
    root.style.setProperty('--bg-panel', colors.bgPanel);
    root.style.setProperty('--bg-hover', colors.bgHover);
    root.style.setProperty('--bg-chart-panel', colors.bgChartPanel);
    
    root.style.setProperty('--text', colors.text);
    root.style.setProperty('--text-secondary', colors.textSecondary);
    root.style.setProperty('--text-muted', colors.textMuted);
    root.style.setProperty('--text-light', colors.textLight);
    
    root.style.setProperty('--border', colors.border);
    root.style.setProperty('--border-light', colors.borderLight);
    
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--accent-strong', colors.accentStrong);
    root.style.setProperty('--accent-faded', colors.accentFaded);
    
    root.style.setProperty('--success', colors.success);
    root.style.setProperty('--danger', colors.danger);
    root.style.setProperty('--warning', colors.warning);
    
    root.style.setProperty('--chart-background', colors.chartBackground);
    root.style.setProperty('--chart-grid', colors.chartGrid);
    root.style.setProperty('--chart-text', colors.chartText);
    
    root.style.setProperty('--candle-up', colors.candleUp);
    root.style.setProperty('--candle-down', colors.candleDown);
    root.style.setProperty('--candle-up-border', colors.candleUpBorder);
    root.style.setProperty('--candle-down-border', colors.candleDownBorder);
    
    root.style.setProperty('--bg-hero-gradient', colors.heroGradient);
    root.style.setProperty('--card-glow', colors.cardGlow);
    root.style.setProperty('--box-shadow', colors.boxShadow);
    
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, currentThemeConfig]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event: MediaQueryListEvent) => {
      setThemeState(event.matches ? 'night-blue' : 'day-light');
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
  };

  const toggleTheme = () => {
    setThemeState(current => {
      // Toggle between night-blue and day-light for legacy support
      if (current === 'night' || current === 'night-blue') return 'day-light';
      if (current === 'day' || current === 'day-light') return 'night-blue';
      // For other themes, toggle to day-light
      return 'day-light';
    });
  };

  const value = useMemo(() => ({ theme, setTheme, toggleTheme, currentThemeConfig }), [theme, currentThemeConfig]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
