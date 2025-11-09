/**
 * Prophet Performance Charts
 * 
 * Plotly-based visualizations for prophet prediction performance:
 * 1. Predicted vs Actual time series
 * 2. Error distribution histogram
 * 3. Rolling metrics over time
 */

import React from 'react';
import Plot from 'react-plotly.js';
import { Prediction, PerformanceMetrics } from '../utils/localInference';
import './ProphetCharts.css';

interface ProphetChartsProps {
  predictions: Prediction[];
  overallMetrics: PerformanceMetrics;
  rollingMetrics?: Map<number, PerformanceMetrics>;
}

export function ProphetCharts({ predictions, overallMetrics, rollingMetrics }: ProphetChartsProps) {
  if (!predictions || predictions.length === 0) {
    return <div className="no-data">No prediction data available</div>;
  }

  // Sort predictions by date
  const sortedPredictions = [...predictions].sort((a, b) => a.date.localeCompare(b.date));

  const dates = sortedPredictions.map(p => p.date);
  const actualValues = sortedPredictions.map(p => p.actual);
  const predictedValues = sortedPredictions.map(p => p.predicted);
  const errors = sortedPredictions.map(p => p.error);
  const percentErrors = sortedPredictions.map(p => p.percentError);

  return (
    <div className="prophet-charts">
      {/* Chart 1: Predicted vs Actual */}
      <div className="chart-card">
        <h4>Predicted vs Actual Prices</h4>
        <Plot
          data={[
            {
              x: dates,
              y: actualValues,
              type: 'scatter',
              mode: 'lines',
              name: 'Actual',
              line: { color: '#3b82f6', width: 2 }
            } as any,
            {
              x: dates,
              y: predictedValues,
              type: 'scatter',
              mode: 'lines',
              name: 'Predicted',
              line: { color: '#f59e0b', width: 2, dash: 'dash' }
            } as any
          ]}
          layout={{
            autosize: true,
            margin: { l: 60, r: 40, t: 40, b: 60 },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: { color: 'var(--text-primary)', family: 'Inter, sans-serif' },
            xaxis: {
              title: { text: 'Date' },
              gridcolor: 'var(--border-color)',
              showgrid: true
            },
            yaxis: {
              title: { text: 'Price' },
              gridcolor: 'var(--border-color)',
              showgrid: true
            },
            hovermode: 'x unified',
            legend: {
              x: 0,
              y: 1,
              bgcolor: 'rgba(0,0,0,0.1)'
            }
          } as any}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%', height: '400px' }}
        />
        <div className="chart-metrics">
          <div className="metric">
            <span className="label">MAPE</span>
            <span className="value">{overallMetrics.mape.toFixed(2)}%</span>
          </div>
          <div className="metric">
            <span className="label">RMSE</span>
            <span className="value">{overallMetrics.rmse.toFixed(2)}</span>
          </div>
          <div className="metric">
            <span className="label">MAE</span>
            <span className="value">{overallMetrics.mae.toFixed(2)}</span>
          </div>
          <div className="metric">
            <span className="label">Direction Accuracy</span>
            <span className="value">{overallMetrics.directionalAccuracy.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Chart 2: Error Distribution */}
      <div className="chart-card">
        <h4>Prediction Error Distribution</h4>
        <Plot
          data={[
            {
              x: errors,
              type: 'histogram',
              name: 'Error Distribution',
              marker: { color: '#8b5cf6' },
              nbinsx: 30
            } as any
          ]}
          layout={{
            autosize: true,
            margin: { l: 60, r: 40, t: 40, b: 60 },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: { color: 'var(--text-primary)', family: 'Inter, sans-serif' },
            xaxis: {
              title: { text: 'Prediction Error' },
              gridcolor: 'var(--border-color)',
              showgrid: true
            },
            yaxis: {
              title: { text: 'Frequency' },
              gridcolor: 'var(--border-color)',
              showgrid: true
            },
            showlegend: false
          } as any}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%', height: '300px' }}
        />
        <div className="chart-info">
          <p>Shows the distribution of prediction errors (Actual - Predicted).</p>
          <p>A centered distribution around 0 indicates unbiased predictions.</p>
        </div>
      </div>

      {/* Chart 3: Percent Error Distribution */}
      <div className="chart-card">
        <h4>Percentage Error Distribution</h4>
        <Plot
          data={[
            {
              x: percentErrors,
              type: 'histogram',
              name: 'Percent Error',
              marker: { color: '#10b981' },
              nbinsx: 30
            } as any
          ]}
          layout={{
            autosize: true,
            margin: { l: 60, r: 40, t: 40, b: 60 },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: { color: 'var(--text-primary)', family: 'Inter, sans-serif' },
            xaxis: {
              title: { text: 'Absolute Percentage Error (%)' },
              gridcolor: 'var(--border-color)',
              showgrid: true
            },
            yaxis: {
              title: { text: 'Frequency' },
              gridcolor: 'var(--border-color)',
              showgrid: true
            },
            showlegend: false
          } as any}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%', height: '300px' }}
        />
      </div>

      {/* Chart 4: Rolling Metrics (if available) */}
      {rollingMetrics && rollingMetrics.size > 0 && (
        <div className="chart-card">
          <h4>Rolling Window Performance</h4>
          <div className="rolling-metrics-grid">
            {Array.from(rollingMetrics.entries()).map(([window, metrics]) => (
              <div key={window} className="rolling-metric-card">
                <div className="window-label">{window}-Day Window</div>
                <div className="rolling-stats">
                  <div className="stat">
                    <span className="stat-label">MAPE</span>
                    <span className="stat-value">{metrics.mape.toFixed(2)}%</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">RMSE</span>
                    <span className="stat-value">{metrics.rmse.toFixed(2)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Direction</span>
                    <span className="stat-value">{metrics.directionalAccuracy.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Summary Table */}
      <div className="chart-card">
        <h4>Performance Summary</h4>
        
        {/* Quality Rating */}
        <div className="quality-rating">
          <span className="quality-label">Model Quality:</span>
          {overallMetrics.mape <= 10 ? (
            <span className="quality-badge excellent">⭐⭐⭐ Excellent</span>
          ) : overallMetrics.mape <= 30 ? (
            <span className="quality-badge good">⭐⭐ Good</span>
          ) : overallMetrics.mape <= 50 ? (
            <span className="quality-badge fair">⭐ Fair</span>
          ) : (
            <span className="quality-badge poor">Baseline/Experimental</span>
          )}
        </div>

        <table className="metrics-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>MAPE</td>
              <td>{overallMetrics.mape.toFixed(3)}%</td>
              <td>Mean Absolute Percentage Error - lower is better</td>
            </tr>
            <tr>
              <td>RMSE</td>
              <td>{overallMetrics.rmse.toFixed(3)}</td>
              <td>Root Mean Squared Error - measures prediction accuracy</td>
            </tr>
            <tr>
              <td>MAE</td>
              <td>{overallMetrics.mae.toFixed(3)}</td>
              <td>Mean Absolute Error - average prediction error</td>
            </tr>
            <tr>
              <td>Directional Accuracy</td>
              <td>{overallMetrics.directionalAccuracy.toFixed(2)}%</td>
              <td>Percentage of correct up/down predictions</td>
            </tr>
            <tr>
              <td>Sample Size</td>
              <td>{overallMetrics.sampleSize}</td>
              <td>Number of predictions evaluated</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
