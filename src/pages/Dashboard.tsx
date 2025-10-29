import React, { useMemo, useState } from 'react';
import StockChart from '../components/chart/StockChart';
import { PriceData } from '../types/price';
import { DJIA_DATA, SPX_DATA } from '../data/testData';
import { useTheme } from '../context/ThemeContext';
import type { ThemeMode } from '../context/ThemeContext';
import './Dashboard.css';

const MAX_ACTIVE_PROPHETS = 4;

const ASSET_OPTIONS = [
  { id: 'DJIA', label: 'Dow Jones', subtitle: 'US blue-chip equities' },
  { id: 'SPX', label: 'S&P 500', subtitle: 'Large cap market breadth' }
] as const;

const TIME_WINDOWS = ['1W', '1M', '3M', 'All'] as const;

const TIME_WINDOW_DAYS: Record<Exclude<typeof TIME_WINDOWS[number], 'All'>, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 90
};

const TIME_WINDOW_LABELS: Record<typeof TIME_WINDOWS[number], string> = {
  '1W': '7 day trend',
  '1M': '30 day trend',
  '3M': '90 day trend',
  'All': 'full history'
};

const PROPHET_OPTIONS = [
  { id: 'timeSage', label: 'Time Sage' },
  { id: 'trendOracle', label: 'Trend Oracle' },
  { id: 'marketMind', label: 'Market Mind' },
  { id: 'quantumPredictor', label: 'Quantum Predictor' }
] as const;

type AssetId = typeof ASSET_OPTIONS[number]['id'];
type TimeWindow = typeof TIME_WINDOWS[number];
type ProphetId = typeof PROPHET_OPTIONS[number]['id'];
const PROPHET_COLORS: Record<ProphetId, string> = {
  timeSage: '#10b981',
  trendOracle: '#ef4444',
  marketMind: '#f59e0b',
  quantumPredictor: '#8b5cf6'
};

const DATASETS: Record<AssetId, PriceData[]> = {
  DJIA: DJIA_DATA,
  SPX: SPX_DATA
};

interface PriceStats {
  latest: PriceData;
  previous: PriceData | null;
  changePct: number;
  weeklyChange: number;
  monthlyChange: number;
  quarterlyChange: number;
  ytdReturn: number;
  high52: number;
  low52: number;
  rangePlacement: number;
  avgVolume30: number;
  volumeDelta: number;
  volumeLatest: number;
  intradayRange: number;
  annualizedVolatility: number;
  prophetDeltas: Record<ProphetId, number>;
}

function sliceByTimeWindow(data: PriceData[], window: TimeWindow): PriceData[] {
  if (window === 'All') return data;
  const days = TIME_WINDOW_DAYS[window];
  return data.slice(-days);
}

function percentChange(from: number, to: number): number {
  if (!Number.isFinite(from) || from === 0) return 0;
  return (to - from) / from;
}

function changeOverDays(data: PriceData[], days: number): number {
  if (!data.length) return 0;
  const index = Math.max(data.length - 1 - days, 0);
  const from = data[index].close;
  const to = data[data.length - 1].close;
  return percentChange(from, to);
}

function computePriceStats(data: PriceData[]): PriceStats | null {
  if (!data.length) return null;

  const latest = data[data.length - 1];
  const previous = data.length > 1 ? data[data.length - 2] : null;

  const lastYear = data.slice(-365);
  const highs = lastYear.map(entry => entry.high);
  const lows = lastYear.map(entry => entry.low);
  const high52 = highs.length ? Math.max(...highs) : latest.high;
  const low52 = lows.length ? Math.min(...lows) : latest.low;
  const rangePlacement = high52 === low52 ? 0.5 : Math.min(Math.max((latest.close - low52) / (high52 - low52), 0), 1);

  const recentVolumes = data.slice(-30).map(entry => entry.volume ?? 0);
  const avgVolume30 = recentVolumes.length
    ? recentVolumes.reduce((sum, value) => sum + value, 0) / recentVolumes.length
    : latest.volume ?? 0;
  const volumeLatest = latest.volume ?? 0;
  const volumeDelta = avgVolume30 === 0 ? 0 : (volumeLatest - avgVolume30) / avgVolume30;

  const returns: number[] = [];
  for (let i = 1; i < data.length; i += 1) {
    const prevClose = data[i - 1].close;
    if (!Number.isFinite(prevClose) || prevClose === 0) continue;
    returns.push((data[i].close - prevClose) / prevClose);
  }
  const sample = returns.slice(-60);
  const mean = sample.length ? sample.reduce((sum, value) => sum + value, 0) / sample.length : 0;
  const variance = sample.length
    ? sample.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / sample.length
    : 0;
  const annualizedVolatility = Math.sqrt(Math.max(variance, 0)) * Math.sqrt(252);

  const startOfYear = data.find(entry => new Date(entry.date).getFullYear() === new Date().getFullYear());
  const ytdReturn = startOfYear ? percentChange(startOfYear.close, latest.close) : percentChange(data[0].close, latest.close);

  const prophetDeltas = PROPHET_OPTIONS.reduce<Record<ProphetId, number>>((acc, option) => {
    const value = latest[option.id as keyof PriceData];
    const numericValue = typeof value === 'number' ? value : undefined;
    acc[option.id] = numericValue !== undefined && latest.close !== 0
      ? (numericValue - latest.close) / latest.close
      : 0;
    return acc;
  }, {
    timeSage: 0,
    trendOracle: 0,
    marketMind: 0,
    quantumPredictor: 0
  });

  return {
    latest,
    previous,
    changePct: previous ? percentChange(previous.close, latest.close) : 0,
    weeklyChange: changeOverDays(data, 5),
    monthlyChange: changeOverDays(data, 21),
    quarterlyChange: changeOverDays(data, 63),
    ytdReturn,
    high52,
    low52,
    rangePlacement,
    avgVolume30,
    volumeDelta,
    volumeLatest,
    intradayRange: latest.open ? (latest.high - latest.low) / latest.open : 0,
    annualizedVolatility,
    prophetDeltas
  };
}

function formatPercent(value: number | null | undefined, fractionDigits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const percentage = (value * 100).toFixed(fractionDigits);
  return `${value > 0 ? '+' : ''}${percentage}%`;
}

function formatCurrency(value: number | null | undefined, fractionDigits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value);
}

function formatCompactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
}

export default function Dashboard() {
  const [selectedAsset, setSelectedAsset] = useState<AssetId>('DJIA');
  const [selectedProphets, setSelectedProphets] = useState<ProphetId[]>(['timeSage', 'trendOracle']);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('1M');
  const [scaleType, setScaleType] = useState<'linear' | 'log'>('linear');
  const { theme, setTheme } = useTheme();

  const statsByAsset = useMemo(() => {
    const entries = {} as Record<AssetId, PriceStats | null>;
    ASSET_OPTIONS.forEach(option => {
      entries[option.id] = computePriceStats(DATASETS[option.id]);
    });
    return entries;
  }, []);

  const selectedStats = statsByAsset[selectedAsset];
  const activeData = DATASETS[selectedAsset];
  const filteredData = useMemo(() => sliceByTimeWindow(activeData, timeWindow), [activeData, timeWindow]);

  const chartTheme = theme === 'day' ? 'light' : 'dark';
  const baseLineColor = theme === 'day' ? '#1d4ed8' : '#60a5fa';

  const prophetChartData = useMemo(() => {
    if (!filteredData.length) return [];
    const traces = [
      {
        x: filteredData.map(entry => entry.date),
        y: filteredData.map(entry => entry.close),
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: `${selectedAsset} Close`,
        line: { color: baseLineColor, width: 2.4 }
      }
    ];

    selectedProphets.forEach(prophet => {
      const series = filteredData.map(entry => entry[prophet as keyof PriceData]);
      if (series.every(point => typeof point !== 'number')) return;
      traces.push({
        x: filteredData.map(entry => entry.date),
        y: filteredData.map(entry => (entry[prophet as keyof PriceData] as number | undefined) ?? null),
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: PROPHET_OPTIONS.find(option => option.id === prophet)?.label ?? prophet,
        line: { color: PROPHET_COLORS[prophet], width: 1.6, dash: 'dot' }
      });
    });

    return traces;
  }, [filteredData, selectedAsset, selectedProphets, baseLineColor]);

  const indexPanels = useMemo(() => ASSET_OPTIONS.map(option => {
    const dataset = DATASETS[option.id];
    const panelStats = statsByAsset[option.id];
    const windowed = sliceByTimeWindow(dataset, timeWindow);
    const traces = [
      {
        x: windowed.map(entry => entry.date),
        y: windowed.map(entry => entry.close),
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: `${option.id} Close`,
        line: { color: option.id === 'DJIA' ? '#38bdf8' : '#f97316', width: 2 }
      }
    ];

    return {
      ...option,
      stats: panelStats,
      traces
    };
  }), [statsByAsset, timeWindow]);

  const marketBreadthPct = Math.round(((statsByAsset.DJIA?.rangePlacement ?? 0.5) + (statsByAsset.SPX?.rangePlacement ?? 0.5)) / 2 * 100);
  const compositeDailyChange = ((statsByAsset.DJIA?.changePct ?? 0) + (statsByAsset.SPX?.changePct ?? 0)) / 2;

  const prophetDivergences = selectedStats && selectedProphets.length
    ? selectedProphets.map(prophet => selectedStats.prophetDeltas[prophet])
    : [];
  const averageProphetDivergence = prophetDivergences.length
    ? prophetDivergences.reduce((sum, value) => sum + value, 0) / prophetDivergences.length
    : 0;
  const averageProphetSpread = prophetDivergences.length
    ? prophetDivergences.reduce((sum, value) => sum + Math.abs(value), 0) / prophetDivergences.length
    : 0;
  const prophetConfidence = 1 - Math.min(1, averageProphetSpread * 6);

  const updates = prophetDivergences.map((delta, index) => ({
    id: selectedProphets[index],
    title: PROPHET_OPTIONS.find(option => option.id === selectedProphets[index])?.label ?? selectedProphets[index],
    delta
  }));

  const heroMetrics = selectedStats ? [
    {
      id: 'momentum',
      label: 'Momentum',
      badge: { text: formatPercent(selectedStats.changePct), type: selectedStats.changePct >= 0 ? 'up' : 'down' },
      value: formatCurrency(selectedStats.latest.close),
      rows: [
        { label: 'Weekly', value: formatPercent(selectedStats.weeklyChange) },
        { label: 'Monthly', value: formatPercent(selectedStats.monthlyChange) },
        { label: 'Quarter', value: formatPercent(selectedStats.quarterlyChange), highlight: true }
      ]
    },
    {
      id: 'range',
      label: '52W Range',
      badge: { text: `${Math.round((selectedStats.rangePlacement ?? 0.5) * 100)}%`, type: selectedStats.rangePlacement >= 0.5 ? 'up' : 'down' },
      value: `${formatCurrency(selectedStats.low52, 0)} - ${formatCurrency(selectedStats.high52, 0)}`,
      rows: [
        { label: 'Current', value: formatCurrency(selectedStats.latest.close) },
        { label: 'Range Position', value: `${Math.round((selectedStats.rangePlacement ?? 0.5) * 100)}th pct`, highlight: true },
        { label: 'Intraday Range', value: formatPercent(selectedStats.intradayRange, 2) }
      ]
    },
    {
      id: 'liquidity',
      label: 'Liquidity Pulse',
      badge: { text: formatPercent(selectedStats.volumeDelta), type: selectedStats.volumeDelta >= 0 ? 'up' : 'down' },
      value: formatCompactNumber(selectedStats.volumeLatest),
      rows: [
        { label: '30d Avg', value: formatCompactNumber(selectedStats.avgVolume30) },
        { label: 'Volatility', value: formatPercent(selectedStats.annualizedVolatility) },
        { label: 'Prophet Spread', value: formatPercent(averageProphetSpread), highlight: true }
      ]
    }
  ] : [];

  const statCards = selectedStats ? [
    {
      label: 'Market Breadth',
      value: `${marketBreadthPct}%`,
      meta: 'Advancers across DJI & SPX'
    },
    {
      label: 'YTD Return',
      value: formatPercent(selectedStats.ytdReturn),
      meta: 'vs January open'
    },
    {
      label: 'Prophet Confidence',
      value: `${Math.round(prophetConfidence * 100)}%`,
      meta: `${selectedProphets.length} active models`
    },
    {
      label: 'Volatility (Ann.)',
      value: formatPercent(selectedStats.annualizedVolatility),
      meta: 'Rolling 60d sample'
    }
  ] : [];

  const divergenceSignal = selectedStats && selectedProphets.length
    ? selectedStats.prophetDeltas[selectedProphets[0]]
    : 0;

  const marketVisualStatus = compositeDailyChange > 0.002
    ? 'Bullish bias'
    : compositeDailyChange < -0.002
      ? 'Defensive tilt'
      : 'Neutral drift';

  const themeClass = theme === 'day' ? 'theme-day' : 'theme-night';
  const currentDateLabel = selectedStats
    ? new Date(selectedStats.latest.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const handleProphetToggle = (prophet: ProphetId) => {
    setSelectedProphets(current => {
      if (current.includes(prophet)) {
        return current.filter(item => item !== prophet);
      }
      if (current.length >= MAX_ACTIVE_PROPHETS) {
        const [, ...rest] = [...current, prophet];
        return rest;
      }
      return [...current, prophet];
    });
  };

  return (
    <div className={`dashboard-page ${themeClass}`}>
      <div className="dashboard-wrapper">
        <div className="dashboard">
          <section className="dashboard-hero">
            <div className="hero-panel">
              <div className="hero-meta">
                <span className="hero-pill">Live market</span>
                <span className="hero-date">{currentDateLabel}</span>
              </div>
              <h1>Adaptive market intelligence for strategic positioning</h1>
              <p className="hero-description">
                Blend real-time index flows with proprietary prophet forecasts to surface actionable conviction.
                Toggle your benchmarks, horizons, and signal models to shape the story you deliver to stakeholders.
              </p>

              <div className="hero-controls">
                <div className="control-group">
                  <span className="control-label">Benchmark</span>
                  <div className="segmented-control">
                    {ASSET_OPTIONS.map(option => (
                      <button
                        key={option.id}
                        type="button"
                        className={`segment ${selectedAsset === option.id ? 'active' : ''}`}
                        onClick={() => setSelectedAsset(option.id)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="control-group">
                  <span className="control-label">Timeframe</span>
                  <div className="segmented-control">
                    {TIME_WINDOWS.map(option => (
                      <button
                        key={option}
                        type="button"
                        className={`segment ${timeWindow === option ? 'active' : ''}`}
                        onClick={() => setTimeWindow(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="control-group">
                  <span className="control-label">Scale</span>
                  <div className="segmented-control">
                    {(['linear', 'log'] as Array<'linear' | 'log'>).map(option => (
                      <button
                        key={option}
                        type="button"
                        className={`segment ${scaleType === option ? 'active' : ''}`}
                        onClick={() => setScaleType(option)}
                      >
                        {option === 'linear' ? 'Linear' : 'Log'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="control-group">
                  <span className="control-label">Theme</span>
                  <div className="segmented-control">
                    {(['night', 'day'] as ThemeMode[]).map(option => (
                      <button
                        key={option}
                        type="button"
                        className={`segment ${theme === option ? 'active' : ''}`}
                        onClick={() => setTheme(option)}
                      >
                        {option === 'day' ? 'Daylight' : 'Nightfall'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="control-group">
                  <span className="control-label">Prophets</span>
                  <div className="segmented-control">
                    {PROPHET_OPTIONS.map(option => (
                      <button
                        key={option.id}
                        type="button"
                        className={`segment ${selectedProphets.includes(option.id) ? 'active' : ''}`}
                        onClick={() => handleProphetToggle(option.id)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="stat-grid">
                {statCards.map(card => (
                  <div key={card.label} className={`stat-card ${card.label === 'Market Breadth' ? 'primary' : ''}`}>
                    <span className="stat-label">{card.label}</span>
                    <span className="stat-value">{card.value}</span>
                    <span className="stat-meta">{card.meta}</span>
                  </div>
                ))}
              </div>

              <div className="updates-grid">
                {updates.map(update => (
                  <div key={update.id} className="update-card">
                    <h4>{update.title}</h4>
                    <p>
                      Signal divergence <span className={update.delta >= 0 ? 'uptrend' : 'downtrend'}>{formatPercent(update.delta, 2)}</span> vs price
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-metrics">
              {heroMetrics.map(metric => (
                <div key={metric.id} className="metric-card">
                  <div className="metric-header">
                    <span className="metric-label">{metric.label}</span>
                    <span className={`metric-badge ${metric.badge.type}`}>{metric.badge.text}</span>
                  </div>
                  <div className="metric-value">{metric.value}</div>
                  {metric.rows.map(row => (
                    <div key={row.label} className={`metric-row ${row.highlight ? 'highlight' : ''}`}>
                      <span>{row.label}</span>
                      <span>{row.value}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <section className="headline-section">
            <div className="section-header">
              <div>
                <h2>Market leadership at a glance</h2>
                <p className="section-copy">
                  Track how institutional money rotates across the Dow and S&amp;P macro baskets. Compare intraday velocity,
                  multi-week range positioning, and the liquidity backdrop to contextualise the prophets you activate.
                </p>
              </div>
              <div className="section-actions">
                <button type="button" className="ghost-button">Download Snapshot</button>
                <button type="button" className="ghost-button">Share Story</button>
              </div>
            </div>
            <div className="section-chips">
              <span className="chip">{ASSET_OPTIONS.find(option => option.id === selectedAsset)?.label}</span>
              <span className="chip">{TIME_WINDOW_LABELS[timeWindow]}</span>
              <span className="chip">{selectedProphets.length} prophets</span>
            </div>

            <div className="index-panels">
              {indexPanels.map(panel => (
                <div key={panel.id} className="index-panel">
                  <div className="index-panel-header">
                    <div>
                      <h3>{panel.label}</h3>
                      <div className="index-subtitle">{panel.subtitle}</div>
                    </div>
                    <div className="index-meta">
                      <span className={`index-delta ${(panel.stats?.changePct ?? 0) < 0 ? 'down' : ''}`}>
                        {formatPercent(panel.stats?.changePct ?? 0)}
                      </span>
                      <span className="index-price">{formatCurrency(panel.stats?.latest.close ?? 0)}</span>
                    </div>
                  </div>
                  <div className="index-panel-chart">
                    <StockChart data={panel.traces} scaleType={scaleType} theme={chartTheme} />
                  </div>
                  <div className="index-panel-footer">
                    <div>
                      <div>Open</div>
                      <div className="value">{formatCurrency(panel.stats?.latest.open ?? 0)}</div>
                    </div>
                    <div>
                      <div>Day High</div>
                      <div className="value">{formatCurrency(panel.stats?.latest.high ?? 0)}</div>
                    </div>
                    <div>
                      <div>Volume</div>
                      <div className="value">{formatCompactNumber(panel.stats?.latest.volume ?? 0)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="custom-section">
            <div className="section-header">
              <div>
                <h2>Prophet signal desk</h2>
                <p className="section-copy">
                  See how your active prophets track the benchmark and where their conviction converges or gaps. Use the divergence signal
                  to decide whether to overweight price action or prophetic foresight in upcoming allocations.
                </p>
              </div>
            </div>

            <div className="custom-grid">
              <div className="custom-card">
                <div className="custom-card-header">
                  <div className="custom-card-titles">
                    <h3>Prophet alignment</h3>
                    <span className="index-subtitle">{selectedProphets.length} signals vs {selectedAsset}</span>
                  </div>
                  <div className="custom-card-meta">
                    <span>{TIME_WINDOW_LABELS[timeWindow]}</span>
                    <span>{scaleType === 'log' ? 'Log scale' : 'Linear scale'}</span>
                  </div>
                </div>
                <div className="custom-card-chart">
                  <StockChart data={prophetChartData} scaleType={scaleType} theme={chartTheme} />
                </div>
                <div className="custom-card-body">
                  <p>
                    Average divergence across selected prophets sits at {formatPercent(averageProphetDivergence, 2)}.
                    Variance in signals is {formatPercent(averageProphetSpread, 2)}, indicating a {prophetConfidence > 0.6 ? 'tight consensus' : 'wider dispersion'} in forward bias.
                  </p>
                  <p>
                    Keep at least two prophets in play to stabilise the composite storyline. Add specialised models when liquidity spikes above
                    average to capture mean-reversion edge.
                  </p>
                </div>
                <div className="custom-card-footer">
                  <span className="trend-label">Lead divergence</span>
                  <span className={`trend ${divergenceSignal >= 0 ? 'up' : 'down'}`}>{formatPercent(divergenceSignal, 2)}</span>
                </div>
              </div>

              <div className="custom-card">
                <div className="custom-card-header">
                  <div className="custom-card-titles">
                    <h3>Macro positioning</h3>
                    <span className="index-subtitle">Cross-index composite</span>
                  </div>
                  <div className="custom-card-meta">
                    <span>Breadth {marketBreadthPct}%</span>
                    <span>{marketVisualStatus}</span>
                  </div>
                </div>
                <div className="custom-card-body">
                  <p>
                    The combined Dow and S&amp;P daily change is {formatPercent(compositeDailyChange, 2)}, signalling {compositeDailyChange >= 0 ? 'constructive upside pressure' : 'a defensive risk tone'}.
                    Annualised volatility on the focus asset prints {formatPercent(selectedStats?.annualizedVolatility ?? 0, 2)}.
                  </p>
                  <p>
                    Use this panel to calibrate hedges: below 45% breadth consider raising cash; above 60% lean into
                    growth and tactical momentum baskets.
                  </p>
                </div>
                <div className="custom-card-footer">
                  <span>Prophet confidence</span>
                  <span className={`trend ${prophetConfidence >= 0.5 ? 'up' : 'down'}`}>{Math.round(prophetConfidence * 100)}%</span>
                </div>
              </div>
            </div>
          </section>

          <section className="dashboard-market-visual">
            <div className="market-visual-content">
              <div className="market-visual-header">
                <h3>Macro regime overview</h3>
                <div className="market-visual-meta">
                  <span>Composite change {formatPercent(compositeDailyChange, 2)}</span>
                  <span className="status">{marketVisualStatus}</span>
                </div>
              </div>
              <div className="market-visual-grid">
                <div className="market-visual-card">
                  <h4>Breadth</h4>
                  <div className="value">{marketBreadthPct}%</div>
                  <div className="trend">Advancers vs decliners</div>
                </div>
                <div className="market-visual-card">
                  <h4>Prophet drift</h4>
                  <div className="value">{formatPercent(averageProphetDivergence, 2)}</div>
                  <div className="trend">Composite delta vs price</div>
                </div>
                <div className="market-visual-card">
                  <h4>Volatility</h4>
                  <div className="value">{formatPercent(selectedStats?.annualizedVolatility ?? 0, 2)}</div>
                  <div className="trend">Annualised (60d sample)</div>
                </div>
              </div>
            </div>
            <div className="skyline" aria-hidden="true" />
          </section>
        </div>
      </div>
    </div>
  );
}