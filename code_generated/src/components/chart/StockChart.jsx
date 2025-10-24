import React, { useRef } from 'react';
import Plot from 'react-plotly.js';

const StockChart = ({ data, scaleType }) => {
  const plotRef = useRef(null);

  return (
    <div className="stock-chart">
      <Plot
        ref={plotRef}
        data={data}
        layout={{
          autosize: true,
          margin: { l: 65, r: 20, t: 10, b: 30 },
          showlegend: false,
          xaxis: {
            type: 'date',
            rangeslider: {
              visible: true,
              thickness: 0.08,
              bgcolor: '#f5f5f5'
            },
            autorange: true,
            tickformat: '%b %d',
            hoverformat: '%b %d, %Y',
          },
          yaxis: {
            type: scaleType,
            autorange: true,
            tickformat: '$,.0f',
            fixedrange: false
          },
          dragmode: 'zoom',
          hovermode: 'x unified',
          modebar: {
            orientation: 'h'
          },
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)'
        }}
        config={{
          responsive: true,
          scrollZoom: true,
          displaylogo: false,
          modeBarButtonsToRemove: [
            'select2d',
            'lasso2d',
            'autoScale2d',
            'toggleSpikelines',
            'hoverCompareCartesian',
            'toggleHover'
          ],
          modeBarButtonsToAdd: [
            'drawline',
            'drawopenpath',
            'drawcircle',
            'drawrect',
            'eraseshape'
          ],
          displayModeBar: 'hover'
        }}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler
      />

      <style jsx>{`
        .stock-chart {
          height: 500px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: var(--spacing-4);
          background: var(--background-color);
          box-shadow: var(--shadow-sm);
        }
      `}</style>
    </div>
  );
};

export default StockChart;