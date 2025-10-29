import React, { useRef, useEffect } from 'react';
import Plotly from 'plotly.js-dist-min';

import { Data, Layout, Config } from 'plotly.js';
import { useTheme } from '../../context/ThemeContext';

interface StockChartProps {
  data: Data[];
  scaleType: 'linear' | 'log';
  theme?: 'light' | 'dark';
}

const StockChart: React.FC<StockChartProps> = ({ data, scaleType, theme }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { theme: globalTheme } = useTheme();
  const resolvedTheme = theme ?? (globalTheme === 'day' ? 'light' : 'dark');

  useEffect(() => {
    if (!chartRef.current || data.length === 0) {
      return;
    }

    const rootStyles = getComputedStyle(document.documentElement);
    const backgroundVar = rootStyles.getPropertyValue('--bg-primary').trim();
    const textVar = rootStyles.getPropertyValue('--text').trim();
    const gridVar = rootStyles.getPropertyValue('--chart-grid').trim();
    const accentVar = rootStyles.getPropertyValue('--accent-color').trim();

  const fallbackBg = resolvedTheme === 'dark' ? '#050b18' : '#ffffff';
  const fallbackText = resolvedTheme === 'dark' ? '#cbd5f5' : '#1e293b';
  const fallbackGrid = resolvedTheme === 'dark' ? 'rgba(148, 163, 184, 0.22)' : 'rgba(148, 163, 184, 0.35)';
    const fallbackAccent = '#3b82f6';

    const plotBg = backgroundVar || fallbackBg;
    const textColor = textVar || fallbackText;
    const gridColor = gridVar || fallbackGrid;
    const accent = accentVar || fallbackAccent;

    const layout: Partial<Layout> = {
      autosize: true,
      margin: { t: 12, r: 16, l: 16, b: 32 },
      showlegend: true,
      legend: {
        orientation: 'h',
        y: -0.18,
        font: { color: textColor }
      },
      yaxis: {
        type: scaleType,
        autorange: true,
        title: { text: 'Price', font: { color: textColor } },
        tickfont: { color: textColor },
        gridcolor: gridColor
      },
      xaxis: {
        rangeslider: { visible: false },
        type: 'date',
        tickfont: { color: textColor },
        gridcolor: gridColor
      },
      plot_bgcolor: plotBg,
      paper_bgcolor: plotBg,
      font: { color: textColor },
      hovermode: 'x unified',
      hoverlabel: {
        bgcolor: plotBg,
        bordercolor: accent,
        font: { color: textColor }
      }
    };

    const config: Partial<Config> = {
      responsive: true,
      displayModeBar: false
    };

    Plotly.newPlot(chartRef.current, data, layout, config);

    return () => {
      if (chartRef.current) {
        Plotly.purge(chartRef.current);
      }
    };
  }, [data, scaleType, resolvedTheme]);

  return (
    <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
  );
};

export default StockChart;