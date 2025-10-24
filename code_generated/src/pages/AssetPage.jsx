import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import TimeWindowSelector from '../components/chart/TimeWindowSelector';
import ScaleTypeSelector from '../components/chart/ScaleTypeSelector';
import StockChart from '../components/chart/StockChart';
import ProphetSelector from '../components/chart/ProphetSelector';
import {
  PROPHET_COLORS,
  PROPHET_INFO,
  MAX_ACTIVE_PROPHETS,
  TIME_WINDOWS,
  SCALE_TYPES
} from '../constants/prophetData';

const AssetPage = () => {
  const [data, setData] = useState([]);
  const [message, setMessage] = useState('Loading...');
  const [prophets, setProphets] = useState([]);
  const [activeProphets, setActiveProphets] = useState([]);
  const [windowIdx, setWindowIdx] = useState(3); // Start with 'All'
  const [scaleIdx, setScaleIdx] = useState(0); // Start with 'Auto'
  const [error, setError] = useState('');
  const [expandedProphet, setExpandedProphet] = useState(null);

  useEffect(() => {
    fetch('djia_sample.csv')
      .then(response => response.text())
      .then(csvText => {
        const result = Papa.parse(csvText, {
          header: true,
          dynamicTyping: true
        });
        
        const prophetCols = Object.keys(result.data[0] || {})
          .filter(key => key.startsWith('prophet'))
          .slice(0, MAX_ACTIVE_PROPHETS * 2); // Load 10 prophets but allow only 5 active
        
        setProphets(prophetCols);
        setActiveProphets(prophetCols.slice(0, 2));
        setData(result.data);
        setMessage('');
      })
      .catch(error => {
        console.error('Error:', error);
        setMessage('Error loading data: ' + error.message);
      });
  }, []);

  const handleProphetClick = (prophet) => {
    if (activeProphets.includes(prophet)) {
      setActiveProphets(activeProphets.filter(p => p !== prophet));
      setError('');
    } else {
      if (activeProphets.length >= MAX_ACTIVE_PROPHETS) {
        setError(`Maximum ${MAX_ACTIVE_PROPHETS} prophets can be active. Deselect one first.`);
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
    
    // Add close price trace
    traces.push({
      x: filteredData.map(d => d.date),
      y: filteredData.map(d => d.close),
      type: 'scatter',
      mode: 'lines',
      name: 'Close Price',
      line: { color: '#000', width: 2 }
    });

    // Add prophet traces
    activeProphets.forEach((prophet, idx) => {
      traces.push({
        x: filteredData.map(d => d.date),
        y: filteredData.map(d => d[prophet]),
        type: 'scatter',
        mode: 'lines',
        name: `${PROPHET_INFO[prophet].name}`,
        line: { color: PROPHET_COLORS[idx], width: 1 }
      });
    });

    return traces;
  }, [filteredData, activeProphets]);

  if (message) {
    return <div className="loading">{message}</div>;
  }

  return (
    <div className="asset-page">
      <header className="page-header">
        <h1 className="title">DJIA Chart</h1>
        <div className="controls">
          <TimeWindowSelector
            windows={TIME_WINDOWS}
            activeIndex={windowIdx}
            onChange={setWindowIdx}
          />
          <ScaleTypeSelector
            scales={SCALE_TYPES}
            activeIndex={scaleIdx}
            onChange={setScaleIdx}
          />
        </div>
      </header>

      <StockChart
        data={plotData}
        scaleType={SCALE_TYPES[scaleIdx].type}
      />

      <ProphetSelector
        prophets={prophets}
        activeProphets={activeProphets}
        expandedProphet={expandedProphet}
        prophetInfo={PROPHET_INFO}
        colors={PROPHET_COLORS}
        onToggleProphet={handleProphetClick}
        onExpandProphet={setExpandedProphet}
        error={error}
      />

      <style jsx>{`
        .asset-page {
          min-height: 100vh;
        }

        .page-header {
          margin-bottom: var(--spacing-6);
        }

        .title {
          font-size: var(--font-size-3xl);
          margin-bottom: var(--spacing-6);
          color: var(--primary-color);
        }

        .controls {
          display: flex;
          gap: var(--spacing-6);
          align-items: center;
        }

        .loading {
          padding: var(--spacing-8);
          text-align: center;
          color: var(--secondary-color);
        }
      `}</style>
    </div>
  );
};

export default AssetPage;