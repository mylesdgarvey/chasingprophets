import React, { useRef, useEffect } from 'react';
import Plotly from 'plotly.js-dist-min';

import { Data, Layout, Config } from 'plotly.js';

interface StockChartProps {
  data: Data[];
  scaleType: 'linear' | 'log';
}

const StockChart: React.FC<StockChartProps> = ({ data, scaleType }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current && data.length > 0) {
      const layout: Partial<Layout> = {
        autosize: true,
        margin: { t: 20, r: 40, l: 40, b: 40 },
        showlegend: true,
        legend: {
          orientation: 'h',
          y: -0.2
        },
        yaxis: {
          type: scaleType,
          autorange: true,
          title: { text: 'Price' }
        },
        xaxis: {
          rangeslider: { visible: false },
          type: 'date'
        },
        plot_bgcolor: 'white',
        paper_bgcolor: 'white',
        hovermode: 'x unified'
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
    }
  }, [data, scaleType]);

  return (
    <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
  );
};

export default StockChart;