import React, { useRef, useEffect } from 'react';
import Plotly from 'plotly.js-dist-min';
import { Data, Layout, Config } from 'plotly.js';
import { usePlotlyTheme } from '../../hooks/usePlotlyTheme';
import { useTheme } from '../../context/ThemeContext';

interface StockChartProps {
  data: Data[];
  scaleType: 'linear' | 'log';
}

const StockChart: React.FC<StockChartProps> = ({ data, scaleType }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const plotlyTheme = usePlotlyTheme();
  const { theme } = useTheme();

  useEffect(() => {
    if (!chartRef.current || data.length === 0) {
      return;
    }

    const styles = getComputedStyle(document.documentElement);
    const subtleText = styles.getPropertyValue('--text-muted')?.trim() || plotlyTheme.font.color;

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
        color: plotlyTheme.font.color
      },
      yaxis: {
        type: scaleType,
        autorange: true,
        title: { text: 'Price', font: { size: 12, color: subtleText } },
        tickfont: { color: subtleText },
        gridcolor: plotlyTheme.yaxis.gridcolor,
        zerolinecolor: plotlyTheme.yaxis.zerolinecolor
      },
      xaxis: {
        rangeslider: { visible: false },
        type: 'date',
        tickfont: { color: subtleText },
        gridcolor: plotlyTheme.xaxis.gridcolor
      },
      plot_bgcolor: plotlyTheme.plot_bgcolor,
      paper_bgcolor: plotlyTheme.paper_bgcolor,
      hovermode: 'x unified',
      hoverlabel: {
        bgcolor: plotlyTheme.paper_bgcolor,
        bordercolor: plotlyTheme.xaxis.gridcolor,
        font: {
          color: plotlyTheme.font.color,
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
  }, [data, scaleType, theme, plotlyTheme]);

  return <div ref={chartRef} style={{ width: '100%', height: '100%' }} />;
};

export default StockChart;