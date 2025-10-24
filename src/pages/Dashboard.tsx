import React, { useState, useMemo } from 'react';
import { AssetMeta } from '../types/assets';
import { PriceData } from '../types/price';
import StockChart from '../components/chart/StockChart';
// removed unused imports: TimeWindowSelector, ScaleTypeSelector, ProphetSelector
import { DJIA_DATA, SPX_DATA } from '../data/testData';
import './Dashboard.css';

const MAX_ACTIVE_PROPHETS = 4;

export default function Dashboard() {
  const [selectedAsset, _setSelectedAsset] = useState<'DJIA' | 'SPX'>('DJIA');
  const [selectedProphets, setSelectedProphets] = useState<string[]>(['timeSage', 'trendOracle']);
  const [timeWindow, _setTimeWindow] = useState('1W');
  const [scaleType, _setScaleType] = useState<'linear' | 'log'>('linear');

  const _handleScaleTypeChange = (scale: string) => {
    _setScaleType(scale === 'Log' ? 'log' : 'linear');
  };

  const data = selectedAsset === 'DJIA' ? DJIA_DATA : SPX_DATA;

  const _handleProphetSelect = (prophetId: string) => {
    setSelectedProphets(current => {
      if (current.includes(prophetId)) {
        return current.filter(id => id !== prophetId);
      } else {
        if (current.length >= MAX_ACTIVE_PROPHETS) {
          return current;
        }
        return [...current, prophetId];
      }
    });
  };

  const _chartData = useMemo(() => {
    if (!data.length) return [];

    const timeWindowDays = {
      '1W': 7,
      '1M': 30,
      '3M': 90,
      'All': data.length
    } as const;

    const days = timeWindowDays[timeWindow as keyof typeof timeWindowDays];
    const filteredData = data.slice(-days);
    
    const traces = [
      {
        x: filteredData.map(d => d.date),
        y: filteredData.map(d => d.close),
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'Close Price',
        line: { color: '#000', width: 2 }
      }
    ];

    selectedProphets.forEach(prophet => {
      const prophetKey = prophet as keyof PriceData;
      if (filteredData[0]?.[prophetKey] !== undefined) {
        traces.push({
          x: filteredData.map(d => d.date),
          y: filteredData.map(d => d[prophetKey] as number),
          type: 'scatter' as const,
          mode: 'lines' as const,
          name: prophet,
          line: { color: `var(--prophet-${prophet.toLowerCase()})`, width: 1.5 }
        });
      }
    });

    return traces;
  }, [data, timeWindow, selectedProphets]);

  // Helper to compute 52-week high/low
  const get52WeekStats = (dataset: any[]) => {
    if (!dataset.length) return { high: 0, low: 0, last: 0 };
    const lastYear = dataset.slice(-365);
    const highs = lastYear.map(d => d.high);
    const lows = lastYear.map(d => d.low);
    const closes = lastYear.map(d => d.close);
    return {
      high: Math.max(...highs),
      low: Math.min(...lows),
      last: closes[closes.length - 1]
    };
  };

  const djiaStats = get52WeekStats(DJIA_DATA);
  const spxStats = get52WeekStats(SPX_DATA);

  // Build chart traces for each index (simple close price)
  const buildTraces = (dataArr: any[]) => {
    const windows = {
      '1W': 7,
      '1M': 30,
      '3M': 90,
      'All': dataArr.length
    } as const;
    const days = windows[timeWindow as keyof typeof windows];
    const filtered = dataArr.slice(-days);
    return [
      {
        x: filtered.map(d => d.date),
        y: filtered.map(d => d.close),
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'Close',
        line: { color: '#2b6cb0', width: 2 }
      }
    ];
  };

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <div className="index-card">
          <div className="index-header">
            <h3>DJIA</h3>
            <div className="index-meta">Last: ${djiaStats.last?.toFixed(2)}</div>
          </div>
          <div className="index-chart">
            <StockChart data={buildTraces(DJIA_DATA)} scaleType={scaleType} />
          </div>
          <div className="index-stats">
            <div>52-week High: ${djiaStats.high?.toFixed(2)}</div>
            <div>52-week Low: ${djiaStats.low?.toFixed(2)}</div>
          </div>
        </div>

        <div className="index-card">
          <div className="index-header">
            <h3>S&amp;P 500 (SPX)</h3>
            <div className="index-meta">Last: ${spxStats.last?.toFixed(2)}</div>
          </div>
          <div className="index-chart">
            <StockChart data={buildTraces(SPX_DATA)} scaleType={scaleType} />
          </div>
          <div className="index-stats">
            <div>52-week High: ${spxStats.high?.toFixed(2)}</div>
            <div>52-week Low: ${spxStats.low?.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}