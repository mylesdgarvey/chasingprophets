import React, { useState, useEffect, useRef, useMemo } from 'react';
import MainLayout from './components/layout/MainLayout';
import Plot from 'react-plotly.js';
import Papa from 'papaparse';
import './styles/globals.css';
import ProphetAccordion from './components/ProphetAccordion';

// Asset information - will be moved to database/API in future
const ASSET_INFO = {
  id: 'DJIA',
  name: 'Dow Jones Industrial Average',
  ticker: 'DJIA',
  description: 'Stock market index that measures the performance of 30 large companies listed on stock exchanges in the United States',
  type: 'Index',
  exchange: 'NYSE',
  currency: 'USD'
};

const PROPHET_COLORS = [
  '#2ecc71', // Green
  '#e74c3c', // Red
  '#f1c40f', // Yellow
  '#9b59b6', // Purple
  '#1abc9c', // Turquoise
  '#3498db', // Blue
  '#e67e22', // Orange
  '#34495e', // Navy
  '#16a085', // Dark Turquoise
  '#8e44ad'  // Dark Purple
];

const MAX_ACTIVE_PROPHETS = 5;

const TIME_WINDOWS = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: 'All', days: null }
];

const SCALE_TYPES = [
  { label: 'Auto', type: 'linear' },
  { label: 'Fixed', type: 'linear' },
  { label: 'Log', type: 'log' }
];

const PROPHET_INFO = {
  prophet1: {
    name: "TimeSage AI",
    description: "Advanced neural network trained on historical market data with sentiment analysis",
    baseDataSets: ["DJIA Historical", "Federal Reserve Economic Data", "Twitter Sentiment"],
    modelType: "Hybrid LSTM-Transformer"
  },
  prophet2: {
    name: "TrendOracle",
    description: "Ensemble model combining technical analysis with macro-economic indicators",
    baseDataSets: ["S&P 500", "GDP Growth", "Interest Rates"],
    modelType: "Random Forest + XGBoost"
  },
  prophet3: {
    name: "MarketMind",
    description: "Deep learning system with real-time news integration and pattern recognition",
    baseDataSets: ["Market Order Flow", "News Headlines", "Volatility Index"],
    modelType: "Deep Neural Network"
  },
  prophet4: {
    name: "QuantumPredictor",
    description: "Quantum-inspired algorithm for complex market pattern analysis",
    baseDataSets: ["Market Microstructure", "Options Chain Data", "Sector Rotations"],
    modelType: "Quantum-Inspired Neural Network"
  },
  prophet5: {
    name: "WaveRider AI",
    description: "Specialized in detecting market cycles and Elliott Wave patterns",
    baseDataSets: ["Technical Indicators", "Market Cycles", "Volume Profiles"],
    modelType: "Wavelet Neural Network"
  },
  prophet6: {
    name: "MacroSage",
    description: "Focuses on macroeconomic trends and global market correlations",
    baseDataSets: ["Global Market Indices", "Currency Exchange Rates", "Economic Indicators"],
    modelType: "Bayesian Network + Time Series"
  },
  prophet7: {
    name: "SentimentScope",
    description: "Analyzes social media, news, and market sentiment in real-time",
    baseDataSets: ["Social Media Feeds", "Financial News", "Market Sentiment Scores"],
    modelType: "NLP + Sentiment Analysis"
  },
  prophet8: {
    name: "FractalForecast",
    description: "Uses fractal mathematics and chaos theory for pattern prediction",
    baseDataSets: ["Price Fractals", "Market Volatility", "Trading Patterns"],
    modelType: "Fractal Analysis Network"
  },
  prophet9: {
    name: "NeuroFlow",
    description: "Combines neuromorphic computing with market flow analysis",
    baseDataSets: ["Order Flow", "Dark Pool Data", "Market Depth"],
    modelType: "Neuromorphic AI"
  },
  prophet10: {
    name: "CycleVision",
    description: "Specializes in market cycle identification and rotation prediction",
    baseDataSets: ["Sector Performance", "Economic Cycles", "Rotation Patterns"],
    modelType: "Cyclic Neural Network"
  }
};

function App() {
  const [data, setData] = useState([]);
  const [prophets, setProphets] = useState([]);
  const [activeProphets, setActiveProphets] = useState([]);
  const [windowIdx, setWindowIdx] = useState(3); // Start with 'All'
  const [scaleIdx, setScaleIdx] = useState(0); // Start with 'Auto'
  const [error, setError] = useState('');
  const [message, setMessage] = useState('Loading...');
  const plotRef = useRef(null);

  useEffect(() => {
    fetch('djia_sample.csv')
      .then(response => response.text())
      .then(csvText => {
        const result = Papa.parse(csvText, {
          header: true,
          dynamicTyping: true
        });
        
        // Create array of all prophet keys (prophet1 through prophet10)
        const prophetCols = Array.from({ length: 10 }, (_, i) => `prophet${i + 1}`);
        
        setProphets(prophetCols);
        setActiveProphets(prophetCols.slice(0, 2));
        setData(result.data);
        setMessage('');
      })
      .catch(error => {
        setMessage('Error loading data: ' + error.message);
      });
  }, []);

  const handleProphetClick = (prophet) => {
    if (activeProphets.includes(prophet)) {
      setActiveProphets(activeProphets.filter(p => p !== prophet));
      setError('');
    } else {
      if (activeProphets.length >= MAX_ACTIVE_PROPHETS) {
        setError(`Cannot select more than ${MAX_ACTIVE_PROPHETS} prophets at once. Please deselect one first.`);
        return;
      }
      setActiveProphets([...activeProphets, prophet]);
      setError('');
    }
  };

  const filteredData = useMemo(() => {
    if (!data.length) return [];
    const days = TIME_WINDOWS[windowIdx].days;
    if (!days) return data;
    return data.slice(-days);
  }, [data, windowIdx]);

  const plotData = useMemo(() => {
    const traces = [];
    
    traces.push({
      x: filteredData.map(d => d.date),
      y: filteredData.map(d => d.close),
      type: 'scatter',
      mode: 'lines',
      name: 'Close Price',
      line: { 
        color: '#2b6cb0',
        width: 2,
        shape: 'spline',
        smoothing: 0.3
      },
      hoverlabel: {
        bgcolor: '#2b6cb0',
        font: { color: 'white' }
      }
    });

    activeProphets.forEach((prophet, idx) => {
      traces.push({
        x: filteredData.map(d => d.date),
        y: filteredData.map(d => d[prophet]),
        type: 'scatter',
        mode: 'lines',
        name: PROPHET_INFO[prophet].name,
        line: { 
          color: PROPHET_COLORS[idx], 
          width: 1.5,
          dash: 'dash',
          shape: 'spline',
          smoothing: 0.3
        },
        hoverlabel: {
          bgcolor: PROPHET_COLORS[idx],
          font: { color: 'white' }
        }
      });
    });

    return traces;
  }, [filteredData, activeProphets]);

  if (message) {
    return <MainLayout><div style={{ padding: '2rem' }}>{message}</div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="container">
        <div style={{ marginBottom: 'var(--spacing-6)' }}>
          <h1 className="heading-lg" style={{ marginBottom: 'var(--spacing-2)' }}>
            {ASSET_INFO.name} ({ASSET_INFO.ticker})
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)',
            fontSize: 'var(--font-size-base)',
            maxWidth: '800px',
            lineHeight: '1.5'
          }}>
            {ASSET_INFO.description}
          </p>
        </div>
        
        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #ef4444',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ flex: '1' }}>
            {/* Asset Meta Info */}
            <div style={{ 
              display: 'flex', 
              gap: 'var(--spacing-6)',
              marginBottom: 'var(--spacing-4)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)'
            }}>
              <div>
                <span style={{ fontWeight: '500' }}>Type:</span> {ASSET_INFO.type}
              </div>
              <div>
                <span style={{ fontWeight: '500' }}>Exchange:</span> {ASSET_INFO.exchange}
              </div>
              <div>
                <span style={{ fontWeight: '500' }}>Currency:</span> {ASSET_INFO.currency}
              </div>
            </div>

            {/* Controls */}
            <div className="controls-container" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div className="control-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="control-label">Time Window:</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {TIME_WINDOWS.map((window, idx) => (
                    <button
                      key={window.label}
                      onClick={() => setWindowIdx(idx)}
                      className={`control-button ${windowIdx === idx ? 'active' : ''}`}
                    >
                      {window.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="control-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="control-label">Scale:</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {SCALE_TYPES.map((scale, idx) => (
                    <button
                      key={scale.label}
                      onClick={() => setScaleIdx(idx)}
                      className={`control-button ${scaleIdx === idx ? 'active' : ''}`}
                    >
                      {scale.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="chart-container" style={{ 
              height: '600px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
              padding: '24px'
            }}>
              <Plot
            ref={plotRef}
            data={plotData}
            layout={{
              autosize: true,
              margin: { l: 65, r: 20, t: 20, b: 30 },
              showlegend: true,
              legend: {
                orientation: 'h',
                yanchor: 'bottom',
                y: 1.02,
                xanchor: 'right',
                x: 1,
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                bordercolor: '#e2e8f0',
                borderwidth: 1,
                font: {
                  size: 11,
                  color: '#2d3748'
                }
              },
              hoverlabel: {
                font: {
                  size: 12,
                  family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                },
                bordercolor: '#ffffff'
              },
              paper_bgcolor: 'rgba(0,0,0,0)',
              plot_bgcolor: 'rgba(0,0,0,0)',
              xaxis: {
                type: 'date',
                rangeslider: {
                  visible: true,
                  thickness: 0.05,
                  bgcolor: '#f8fafc'
                },
                gridcolor: '#e2e8f0',
                linecolor: '#cbd5e0',
                autorange: true,
                tickformat: '%Y-%m-%d',
                hoverformat: '%Y-%m-%d',
                tickfont: {
                  size: 11,
                  color: '#4a5568'
                },
                nticks: 12,
                showgrid: true,
                gridwidth: 1,
                tickangle: -45
              },
              yaxis: {
                type: SCALE_TYPES[scaleIdx].type,
                autorange: true,
                tickformat: '$,.0f',
                fixedrange: false,
                gridcolor: '#e2e8f0',
                linecolor: '#cbd5e0',
                tickfont: {
                  size: 11,
                  color: '#4a5568'
                },
                title: {
                  text: 'DJIA Index Value',
                  font: {
                    size: 12,
                    color: '#2d3748',
                    weight: 500
                  },
                  standoff: 10
                },
                showgrid: true,
                gridwidth: 1,
                zeroline: false
              },
              dragmode: 'zoom',
              hovermode: 'x unified',
              modebar: {
                bgcolor: 'rgba(0,0,0,0)',
                color: '#4a5568',
                activecolor: '#2b6cb0'
              },
              font: {
                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
              }
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
        </div>
          </div>

          {/* Prophet Selection */}
          <div style={{ 
            width: '350px',
            padding: '0 20px',
            marginTop: '48px' // To align with the chart area accounting for the controls height
          }}>
            <h2 className="heading-md">Prophet Selection</h2>
            <div>
              {prophets.map((prophet, idx) => (
                <ProphetAccordion
                  key={prophet}
                  prophet={prophet}
                  prophetInfo={PROPHET_INFO[prophet]}
                  isActive={activeProphets.includes(prophet)}
                  onToggleActive={handleProphetClick}
                  color={PROPHET_COLORS[idx]}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default App;