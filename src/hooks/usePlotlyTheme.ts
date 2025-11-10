import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

export interface PlotlyLayoutConfig {
  paper_bgcolor: string;
  plot_bgcolor: string;
  font: {
    color: string;
  };
  xaxis: {
    gridcolor: string;
    zerolinecolor: string;
    color: string;
  };
  yaxis: {
    gridcolor: string;
    zerolinecolor: string;
    color: string;
  };
  // Candlestick colors
  increasing: {
    line: { color: string; width?: number };
    fillcolor: string;
  };
  decreasing: {
    line: { color: string; width?: number };
    fillcolor: string;
  };
  // Chart line colors
  chartColors: string[];
}

export function usePlotlyTheme() {
  const { currentThemeConfig } = useTheme();

  const config = useMemo((): PlotlyLayoutConfig => {
    const colors = currentThemeConfig.colors;
    
    return {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: colors.chartBackground,
      font: {
        color: colors.chartText
      },
      xaxis: {
        gridcolor: colors.chartGrid,
        zerolinecolor: colors.chartGrid,
        color: colors.chartText
      },
      yaxis: {
        gridcolor: colors.chartGrid,
        zerolinecolor: colors.chartGrid,
        color: colors.chartText
      },
      // Candlestick colors from theme
      increasing: {
        line: { color: colors.candleUpBorder, width: 2 },
        fillcolor: colors.candleUp
      },
      decreasing: {
        line: { color: colors.candleDownBorder, width: 2 },
        fillcolor: colors.candleDown
      },
      // Chart line colors
      chartColors: colors.chartColors
    };
  }, [currentThemeConfig]);

  return config;
}
