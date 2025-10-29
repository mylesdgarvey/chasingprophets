import React, { useRef, useEffect } from 'react';
import Plotly from 'plotly.js-dist-min';

import { Data, Layout, Config } from 'plotly.js';

interface StockChartProps {
  data: Data[];
  scaleType: 'linear' | 'log';
}

const StockChart: React.FC<StockChartProps> = ({ data, scaleType }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const themeKey = typeof document !== 'undefined'
    ? (document.documentElement.classList.contains('theme-night') ? 'night' : 'day')
    : 'day';

  useEffect(() => {
    if (!chartRef.current || data.length === 0) {
      return;
    }

    const styles = getComputedStyle(document.documentElement);
    const plotBackground = styles.getPropertyValue('--bg-card')?.trim() || '#0b1539';
    const paperBackground = styles.getPropertyValue('--bg-panel')?.trim() || '#050d26';
    const textColor = styles.getPropertyValue('--text')?.trim() || '#f1f5ff';
    const subtleText = styles.getPropertyValue('--text-muted')?.trim() || 'rgba(241,245,255,0.6)';
    const gridColor = styles.getPropertyValue('--gridline-color')?.trim() || 'rgba(120,146,220,0.2)';

    const layout: Partial<Layout> = {
      autosize: true,
      margin: { t: 16, r: 32, l: 48, b: 40 },
      showlegend: true,
      legend: {
        orientation: 'h',
        y: -0.15,
        x: 0,
        font: {
          family: styles.getPropertyValue('--font-family-sans')?.trim() || 'Inter, sans-serif',
          size: 12,
          color: subtleText
        }
      },
      font: {
        family: styles.getPropertyValue('--font-family-sans')?.trim() || 'Inter, sans-serif',
        color: textColor
      },
      yaxis: {
        type: scaleType,
        autorange: true,
        title: { text: 'Price', font: { size: 12, color: subtleText } },
        tickfont: { color: subtleText },
        gridcolor: gridColor,
        zerolinecolor: gridColor
      },
      xaxis: {
        rangeslider: { visible: false },
        type: 'date',
        tickfont: { color: subtleText },
        gridcolor: gridColor
      },
      plot_bgcolor: plotBackground,
      paper_bgcolor: paperBackground,
      hovermode: 'x unified',
      hoverlabel: {
        bgcolor: paperBackground,
        bordercolor: gridColor,
        font: {
          color: textColor,
          family: styles.getPropertyValue('--font-family-sans')?.trim() || 'Inter, sans-serif'
        }
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
  }, [data, scaleType, themeKey]);

  return <div ref={chartRef} style={{ width: '100%', height: '100%' }} />;
};

export default StockChart;