// Theme Configuration System
// This file defines all available themes with their color schemes
// Charts, candles, and UI elements can all be customized per theme

export interface ThemeColors {
  // UI Colors
  bgPrimary: string;
  bgSecondary: string;
  bgSidebar: string;
  bgCard: string;
  bgPanel: string;
  bgHover: string;
  bgChartPanel: string;
  
  text: string;
  textSecondary: string;
  textMuted: string;
  textLight: string;
  
  border: string;
  borderLight: string;
  
  accent: string;
  accentStrong: string;
  accentFaded: string;
  
  success: string;
  danger: string;
  warning: string;
  
  // Chart-specific colors
  chartBackground: string;
  chartGrid: string;
  chartText: string;
  
  // Candlestick colors
  candleUp: string;
  candleDown: string;
  candleUpBorder: string;
  candleDownBorder: string;
  
  // Chart line colors (for multi-line plots)
  chartColors: string[];
  
  // Gradient backgrounds
  heroGradient: string;
  
  // Shadows
  cardGlow: string;
  boxShadow: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
}

// THEME 1: Night Blue (Default Dark)
export const nightBlueTheme: Theme = {
  id: 'night-blue',
  name: 'Night Blue',
  colors: {
    bgPrimary: '#0a1628',
    bgSecondary: '#05091a',
    bgSidebar: 'linear-gradient(180deg, #050b1f 0%, #03102c 45%, #051739 100%)',
    bgCard: 'rgba(15, 35, 70, 0.85)',
    bgPanel: 'rgba(18, 35, 68, 0.9)',
    bgHover: 'rgba(108, 199, 255, 0.15)',
    bgChartPanel: '#122344',
    
    text: '#e8f0ff',
    textSecondary: '#a8c0e8',
    textMuted: '#7590c0',
    textLight: '#f5f8ff',
    
    border: 'rgba(108, 135, 219, 0.22)',
    borderLight: 'rgba(108, 135, 219, 0.25)',
    
    accent: '#5eb8ff',
    accentStrong: '#3ea8ff',
    accentFaded: 'rgba(94, 184, 255, 0.2)',
    
    success: '#3fe3ce',
    danger: '#ff7b9b',
    warning: '#ffd479',
    
    chartBackground: '#2a4b7c',
    chartGrid: 'rgba(160, 180, 220, 0.25)',
    chartText: '#e8f0ff',
    
    candleUp: '#5eb8ff',      // Blue for up
    candleDown: '#3fe3ce',    // Cyan for down
    candleUpBorder: '#4aa3e8',
    candleDownBorder: '#2ccfb7',
    
    chartColors: ['#5eb8ff', '#3fe3ce', '#ff7b9b', '#ffd479', '#a78bfa', '#fb923c'],
    
    heroGradient: 'linear-gradient(160deg, rgba(11, 17, 32, 0.96) 0%, rgba(11, 44, 92, 0.92) 42%, rgba(42, 99, 215, 0.85) 100%)',
    
    cardGlow: '0 18px 48px rgba(62, 168, 255, 0.25)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
  }
};

// THEME 2: Day Light (Default Light)
export const dayLightTheme: Theme = {
  id: 'day-light',
  name: 'Day Light',
  colors: {
    bgPrimary: '#f5f7fb',
    bgSecondary: '#e8ecf5',
    bgSidebar: '#ffffff',
    bgCard: 'rgba(255, 255, 255, 0.95)',
    bgPanel: 'rgba(255, 255, 255, 0.95)',
    bgHover: 'rgba(14, 82, 167, 0.08)',
    bgChartPanel: '#e3ebf7',
    
    text: '#0f1729',
    textSecondary: '#2d3e5f',
    textMuted: '#6b7a97',
    textLight: '#0f1729',
    
    border: 'rgba(14, 82, 167, 0.15)',
    borderLight: 'rgba(14, 82, 167, 0.15)',
    
    accent: '#2d81d6',
    accentStrong: '#0d6efd',
    accentFaded: 'rgba(13, 110, 253, 0.12)',
    
    success: '#198754',
    danger: '#dc3545',
    warning: '#ffc107',
    
    chartBackground: '#1a2844',
    chartGrid: 'rgba(255, 255, 255, 0.3)',
    chartText: '#ffffff',
    
    candleUp: '#198754',
    candleDown: '#dc3545',
    candleUpBorder: '#146c43',
    candleDownBorder: '#b02a37',
    
    chartColors: ['#2d81d6', '#198754', '#dc3545', '#ffc107', '#6f42c1', '#fd7e14'],
    
    heroGradient: 'linear-gradient(140deg, rgba(14, 26, 50, 0.92) 0%, rgba(30, 45, 78, 0.88) 35%, rgba(46, 105, 223, 0.85) 100%)',
    
    cardGlow: '0 16px 40px rgba(75, 114, 204, 0.18)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  }
};

// THEME 3: Cyber Purple
export const cyberPurpleTheme: Theme = {
  id: 'cyber-purple',
  name: 'Cyber Purple',
  colors: {
    bgPrimary: '#0f0520',
    bgSecondary: '#1a0a2e',
    bgSidebar: 'linear-gradient(180deg, #16003b 0%, #1a0a2e 45%, #240046 100%)',
    bgCard: 'rgba(35, 10, 70, 0.85)',
    bgPanel: 'rgba(40, 15, 75, 0.9)',
    bgHover: 'rgba(168, 85, 247, 0.15)',
    bgChartPanel: '#1f0d3a',
    
    text: '#f0e6ff',
    textSecondary: '#c8b3e8',
    textMuted: '#9575c0',
    textLight: '#f8f5ff',
    
    border: 'rgba(168, 85, 247, 0.22)',
    borderLight: 'rgba(168, 85, 247, 0.25)',
    
    accent: '#a855f7',
    accentStrong: '#9333ea',
    accentFaded: 'rgba(168, 85, 247, 0.2)',
    
    success: '#10b981',
    danger: '#f43f5e',
    warning: '#f59e0b',
    
    chartBackground: '#2d1b4e',
    chartGrid: 'rgba(168, 85, 247, 0.25)',
    chartText: '#f0e6ff',
    
    candleUp: '#a855f7',      // Purple for up
    candleDown: '#ec4899',    // Pink for down
    candleUpBorder: '#9333ea',
    candleDownBorder: '#db2777',
    
    chartColors: ['#a855f7', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4', '#ec4899'],
    
    heroGradient: 'linear-gradient(160deg, rgba(15, 5, 32, 0.96) 0%, rgba(36, 0, 70, 0.92) 42%, rgba(107, 33, 168, 0.85) 100%)',
    
    cardGlow: '0 18px 48px rgba(168, 85, 247, 0.25)',
    boxShadow: '0 4px 20px rgba(107, 33, 168, 0.4)',
  }
};

// THEME 4: Forest Green
export const forestGreenTheme: Theme = {
  id: 'forest-green',
  name: 'Forest Green',
  colors: {
    bgPrimary: '#0a1810',
    bgSecondary: '#05100a',
    bgSidebar: 'linear-gradient(180deg, #0d1f15 0%, #0a1810 45%, #0f2419 100%)',
    bgCard: 'rgba(15, 40, 25, 0.85)',
    bgPanel: 'rgba(18, 45, 28, 0.9)',
    bgHover: 'rgba(52, 211, 153, 0.15)',
    bgChartPanel: '#122f20',
    
    text: '#e8fff0',
    textSecondary: '#a8e8c0',
    textMuted: '#75c090',
    textLight: '#f5fff8',
    
    border: 'rgba(52, 211, 153, 0.22)',
    borderLight: 'rgba(52, 211, 153, 0.25)',
    
    accent: '#34d399',
    accentStrong: '#10b981',
    accentFaded: 'rgba(52, 211, 153, 0.2)',
    
    success: '#22c55e',
    danger: '#ef4444',
    warning: '#eab308',
    
    chartBackground: '#1a4d2e',
    chartGrid: 'rgba(52, 211, 153, 0.25)',
    chartText: '#e8fff0',
    
    candleUp: '#34d399',      // Bright green for up
    candleDown: '#22c55e',    // Solid green for down
    candleUpBorder: '#10b981',
    candleDownBorder: '#16a34a',
    
    chartColors: ['#34d399', '#22c55e', '#ef4444', '#eab308', '#06b6d4', '#a855f7'],
    
    heroGradient: 'linear-gradient(160deg, rgba(10, 24, 16, 0.96) 0%, rgba(15, 45, 25, 0.92) 42%, rgba(26, 77, 46, 0.85) 100%)',
    
    cardGlow: '0 18px 48px rgba(52, 211, 153, 0.25)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
  }
};

// THEME 5: Sunset Orange (Warm Dark)
export const sunsetOrangeTheme: Theme = {
  id: 'sunset-orange',
  name: 'Sunset Orange',
  colors: {
    bgPrimary: '#1a0f0a',
    bgSecondary: '#0f0705',
    bgSidebar: 'linear-gradient(180deg, #1f0b05 0%, #2c1008 45%, #391505 100%)',
    bgCard: 'rgba(70, 25, 15, 0.85)',
    bgPanel: 'rgba(68, 30, 18, 0.9)',
    bgHover: 'rgba(255, 152, 94, 0.15)',
    bgChartPanel: '#442218',
    
    text: '#fff5e8',
    textSecondary: '#e8c0a8',
    textMuted: '#c09075',
    textLight: '#fffaf5',
    
    border: 'rgba(255, 152, 94, 0.22)',
    borderLight: 'rgba(255, 152, 94, 0.25)',
    
    accent: '#ff985e',
    accentStrong: '#ff7f3e',
    accentFaded: 'rgba(255, 152, 94, 0.2)',
    
    success: '#22c55e',
    danger: '#ef4444',
    warning: '#f59e0b',
    
    chartBackground: '#4d2a1a',
    chartGrid: 'rgba(255, 152, 94, 0.25)',
    chartText: '#fff5e8',
    
    candleUp: '#ff985e',      // Orange for up
    candleDown: '#fb923c',    // Deep orange for down
    candleUpBorder: '#ff7f3e',
    candleDownBorder: '#ea580c',
    
    chartColors: ['#ff985e', '#34d399', '#f87171', '#fbbf24', '#a78bfa', '#fb923c'],
    
    heroGradient: 'linear-gradient(160deg, rgba(26, 15, 10, 0.96) 0%, rgba(45, 20, 15, 0.92) 42%, rgba(77, 35, 26, 0.85) 100%)',
    
    cardGlow: '0 18px 48px rgba(255, 152, 94, 0.35)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  }
};

// THEME 6: Deep Space (Ultra Dark)
export const deepSpaceTheme: Theme = {
  id: 'deep-space',
  name: 'Deep Space',
  colors: {
    bgPrimary: '#000000',
    bgSecondary: '#050505',
    bgSidebar: 'linear-gradient(180deg, #0a0a0f 0%, #050508 45%, #000000 100%)',
    bgCard: 'rgba(20, 20, 30, 0.85)',
    bgPanel: 'rgba(18, 18, 25, 0.9)',
    bgHover: 'rgba(138, 180, 248, 0.15)',
    bgChartPanel: '#0f0f15',
    
    text: '#e0e6ff',
    textSecondary: '#9ca3af',
    textMuted: '#6b7280',
    textLight: '#f0f4ff',
    
    border: 'rgba(75, 85, 99, 0.3)',
    borderLight: 'rgba(107, 114, 128, 0.2)',
    
    accent: '#8ab4f8',
    accentStrong: '#60a5fa',
    accentFaded: 'rgba(138, 180, 248, 0.2)',
    
    success: '#10b981',
    danger: '#f43f5e',
    warning: '#fbbf24',
    
    chartBackground: '#0a0a12',
    chartGrid: 'rgba(75, 85, 99, 0.2)',
    chartText: '#e0e6ff',
    
    candleUp: '#8ab4f8',      // Light blue for up
    candleDown: '#22d3ee',    // Cyan for down
    candleUpBorder: '#60a5fa',
    candleDownBorder: '#06b6d4',
    
    chartColors: ['#8ab4f8', '#22d3ee', '#f43f5e', '#fbbf24', '#a78bfa', '#10b981'],
    
    heroGradient: 'linear-gradient(160deg, rgba(0, 0, 0, 0.98) 0%, rgba(10, 10, 20, 0.95) 42%, rgba(15, 15, 30, 0.9) 100%)',
    
    cardGlow: '0 18px 48px rgba(138, 180, 248, 0.15)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
  }
};

// THEME 7: Psychedelic Hippie (Groovy Vibes)
export const psychedelicTheme: Theme = {
  id: 'psychedelic',
  name: 'Psychedelic',
  colors: {
    bgPrimary: '#0f0820',
    bgSecondary: '#1a0d2e',
    bgSidebar: 'linear-gradient(180deg, #2d1b4e 0%, #1e3a5f 20%, #1b4d4d 40%, #2d4d2d 60%, #4d3d2d 80%, #3d2d4d 100%)',
    bgCard: 'rgba(35, 20, 60, 0.85)',
    bgPanel: 'rgba(40, 25, 65, 0.9)',
    bgHover: 'rgba(147, 112, 219, 0.2)',
    bgChartPanel: 'linear-gradient(135deg, #1a1240 0%, #1e2850 50%, #1a3040 100%)',
    
    text: '#e8e0ff',
    textSecondary: '#c8b8e8',
    textMuted: '#a898c8',
    textLight: '#f5f0ff',
    
    border: 'rgba(147, 112, 219, 0.35)',
    borderLight: 'rgba(147, 200, 219, 0.3)',
    
    accent: '#9370db',
    accentStrong: '#7b68ee',
    accentFaded: 'rgba(147, 112, 219, 0.25)',
    
    success: '#66d9a8',
    danger: '#ff6b9d',
    warning: '#f0c040',
    
    chartBackground: 'linear-gradient(135deg, #1a1240 0%, #1e2850 100%)',
    chartGrid: 'rgba(147, 112, 219, 0.2)',
    chartText: '#e8e0ff',
    
    candleUp: '#00ff88',      // Neon green for up
    candleDown: '#ff1493',    // Neon pink for down
    candleUpBorder: '#39ff14',
    candleDownBorder: '#ff007f',
    
    chartColors: ['#00ff88', '#ff1493', '#00ffff', '#ffff00', '#ff00ff', '#39ff14'],
    
    heroGradient: 'linear-gradient(135deg, rgba(45, 27, 78, 0.9) 0%, rgba(30, 58, 95, 0.85) 25%, rgba(27, 77, 77, 0.85) 50%, rgba(45, 77, 45, 0.85) 75%, rgba(77, 61, 45, 0.9) 100%)',
    
    cardGlow: '0 8px 32px rgba(147, 112, 219, 0.3), 0 0 40px rgba(102, 217, 168, 0.15)',
    boxShadow: '0 4px 24px rgba(147, 112, 219, 0.25), 0 0 40px rgba(125, 211, 252, 0.1)',
  }
};

// Export all themes
export const themes: Theme[] = [
  nightBlueTheme,
  dayLightTheme,
  cyberPurpleTheme,
  forestGreenTheme,
  sunsetOrangeTheme,
  deepSpaceTheme,
  psychedelicTheme,
];

// Helper to get theme by ID
export const getThemeById = (id: string): Theme => {
  return themes.find(t => t.id === id) || nightBlueTheme;
};
