import React, { useMemo, useState } from "react";
import {
  TrendingUp,
  Activity,
  Zap,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  Navigation
} from "react-feather";
import StockChart from "../components/chart/StockChart";
import type { Data } from "plotly.js";
import type { PriceData } from "../types/price";
import { DJIA_DATA, SPX_DATA } from "../data/testData";
import "./Dashboard.css";

type TimeWindowKey = "1W" | "1M" | "3M" | "All";
type ScaleKey = "linear" | "log";
type ProphetKey = "timeSage" | "trendOracle" | "marketMind" | "quantumPredictor";

const TIME_WINDOWS: Array<{ id: TimeWindowKey; label: string; days: number | null }> = [
  { id: "1W", label: "1W", days: 7 },
  { id: "1M", label: "1M", days: 30 },
  { id: "3M", label: "3M", days: 90 },
  { id: "All", label: "All", days: null }
];

const SCALE_OPTIONS: Array<{ id: ScaleKey; label: string }> = [
  { id: "linear", label: "Linear" },
  { id: "log", label: "Log" }
];

const PROPHECY_LIBRARY: Record<ProphetKey, { title: string; blurb: string; color: string; emphasis: string }> = {
  timeSage: {
    title: "TimeSage AI",
    blurb: "Temporal neural sentinel tuned for intraday drift and liquidity cues.",
    color: "#3fe3ce",
    emphasis: "Leads 8 mins"
  },
  trendOracle: {
    title: "TrendOracle",
    blurb: "Macro factor ensemble that stabilises medium range conviction.",
    color: "#3ea8ff",
    emphasis: "Confidence 82%"
  },
  marketMind: {
    title: "MarketMind",
    blurb: "Pattern-aware transformer merging news velocity with order flow.",
    color: "#f973ff",
    emphasis: "News bias neutral"
  },
  quantumPredictor: {
    title: "QuantumPredictor",
    blurb: "Quantum-inspired engine scanning volatility clustering regimes.",
    color: "#ff8a65",
    emphasis: "Vol floor 14%"
  }
};

const MAX_ACTIVE_PROPHETS = 3;

const ASSETS = [
  {
    id: "DJIA" as const,
    name: "Dow Jones Industrial Average",
    description: "Legacy bellwether for U.S. industrial momentum.",
    data: DJIA_DATA
  },
  {
    id: "SPX" as const,
    name: "S&P 500",
    description: "Wide-market risk proxy with heavy tech skew.",
    data: SPX_DATA
  }
];

function sliceDataWindow(dataset: PriceData[], window: TimeWindowKey): PriceData[] {
  const config = TIME_WINDOWS.find(entry => entry.id === window);
  if (!config?.days) return dataset.slice();
  return dataset.slice(-config.days);
}

function computeSessionChange(dataset: PriceData[]) {
  if (dataset.length < 2) return { points: 0, pct: 0 };
  const latest = dataset[dataset.length - 1];
  const previous = dataset[dataset.length - 2];
  const points = latest.close - previous.close;
  const pct = previous.close === 0 ? 0 : (points / previous.close) * 100;
  return { points, pct };
}

function computeVolatility(dataset: PriceData[], lookback = 30) {
  if (dataset.length < lookback + 1) return 0;
  const recent = dataset.slice(-lookback - 1);
  const returns: number[] = [];
  for (let i = 1; i < recent.length; i += 1) {
    const prev = recent[i - 1].close;
    const next = recent[i].close;
    if (!prev) continue;
    returns.push(Math.log(next / prev));
  }
  if (!returns.length) return 0;
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

function computeFiftyTwoWeekRange(dataset: PriceData[]) {
  if (!dataset.length) return { high: 0, low: 0 };
  const span = dataset.slice(-252);
  const highs = span.map(item => item.high);
  const lows = span.map(item => item.low);
  return {
    high: Math.max(...highs),
    low: Math.min(...lows)
  };
}

function buildTraces(dataset: PriceData[], prophets: ProphetKey[], baselineColor: string): Data[] {
  if (!dataset.length) return [];

  const traces: Data[] = [];

  traces.push({
    x: dataset.map(point => point.date),
    y: dataset.map(point => point.close),
    type: "scatter",
    mode: "lines",
    name: "Close",
    line: { color: baselineColor, width: 2.6 }
  });

  prophets.forEach(key => {
    const info = PROPHECY_LIBRARY[key];
    if (!info) return;

    const trace: Data = {
      x: dataset.map(point => point.date),
      y: dataset.map(point => point[key] ?? null),
      type: "scatter",
      mode: "lines",
      name: info.title,
      line: { color: info.color, width: 1.6, dash: "dot" }
    };

    traces.push(trace);
  });

  return traces;
}

function formatDelta(value: number, fractionDigits = 2) {
  const formatter = new Intl.NumberFormat("en-US", {
    signDisplay: "exceptZero",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  });
  return formatter.format(value);
}

function formatPoints(value: number) {
  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  return formatter.format(value);
}

function formatCompact(value: number) {
  const formatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  });
  return formatter.format(value);
}

export default function Dashboard() {
  const [activeAssetId, setActiveAssetId] = useState<typeof ASSETS[number]["id"]>("DJIA");
  const [timeWindow, setTimeWindow] = useState<TimeWindowKey>("1M");
  const [scaleType, setScaleType] = useState<ScaleKey>("linear");
  const [selectedProphets, setSelectedProphets] = useState<ProphetKey[]>([
    "timeSage",
    "trendOracle",
    "marketMind"
  ]);

  const activeAsset = useMemo(() => ASSETS.find(asset => asset.id === activeAssetId) ?? ASSETS[0], [activeAssetId]);
  const comparisonAsset = useMemo(() => ASSETS.find(asset => asset.id !== activeAssetId) ?? ASSETS[1], [activeAssetId]);

  const windowedActiveData = useMemo(() => sliceDataWindow(activeAsset.data, timeWindow), [activeAsset.data, timeWindow]);
  const comparisonData = useMemo(() => sliceDataWindow(comparisonAsset.data, "3M"), [comparisonAsset.data]);

  const sessionChange = useMemo(() => computeSessionChange(activeAsset.data), [activeAsset.data]);
  const volatility = useMemo(() => computeVolatility(activeAsset.data), [activeAsset.data]);
  const range = useMemo(() => computeFiftyTwoWeekRange(activeAsset.data), [activeAsset.data]);

  const mainChartData = useMemo(
    () => buildTraces(windowedActiveData, selectedProphets, "#3ea8ff"),
    [windowedActiveData, selectedProphets]
  );

  const comparisonChartData = useMemo(
    () => buildTraces(comparisonData, ["trendOracle"], "#7c90ff"),
    [comparisonData]
  );

  const heroMetrics = useMemo(
    () => [
      {
        id: "session",
        label: "Session Drift",
        value: `${formatPoints(sessionChange.points)} pts`,
        delta: `${formatDelta(sessionChange.pct)}%`,
        icon: sessionChange.points >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />,
        positive: sessionChange.points >= 0
      },
      {
        id: "volatility",
        label: "Annualised Vol",
        value: `${formatDelta(volatility, 1)}%`,
        delta: "30d window",
        icon: <Activity size={16} />,
        positive: volatility < 25
      },
      {
        id: "range",
        label: "52W Span",
        value: `${formatCompact(range.high)} / ${formatCompact(range.low)}`,
        delta: "High / Low",
        icon: <Navigation size={16} />,
        positive: true
      },
      {
        id: "prophets",
        label: "Prophets Live",
        value: `${selectedProphets.length} / ${MAX_ACTIVE_PROPHETS}`,
        delta: "Multi-model blend",
        icon: <Layers size={16} />,
        positive: selectedProphets.length >= 2
      }
    ],
    [sessionChange, volatility, range, selectedProphets.length]
  );

  const signalDeck = useMemo(
    () => [
      {
        title: "Momentum",
        description: `Close pacing ${formatDelta(sessionChange.pct, 2)}% vs yesterday with TimeSage keeping lead on short horizon.`,
        icon: <TrendingUp size={18} />
      },
      {
        title: "Prophet Sync",
        description: `${selectedProphets.length} streams aligned; TrendOracle divergence under 0.6σ.`,
        icon: <Layers size={18} />
      },
      {
        title: "Volatility",
        description: `QuantumPredictor projecting ${formatDelta(volatility, 1)}% annualised, subdued corridor overnight.`,
        icon: <Activity size={18} />
      }
    ],
    [sessionChange.pct, selectedProphets.length, volatility]
  );

  const handleProphetToggle = (prophet: ProphetKey) => {
    setSelectedProphets(current => {
      if (current.includes(prophet)) {
        return current.filter(entry => entry !== prophet);
      }
      if (current.length >= MAX_ACTIVE_PROPHETS) {
        const [, ...rest] = current;
        return [...rest, prophet];
      }
      return [...current, prophet];
    });
  };

  return (
    <div className="dashboard-screen">
      <section className="dashboard-hero glass-surface">
        <div className="hero-copy">
          <span className="eyebrow">Night Ops Control</span>
          <h1>{activeAsset.name}</h1>
          <p>{activeAsset.description}</p>

          <div className="hero-metrics">
            {heroMetrics.map(metric => (
              <div key={metric.id} className={`metric-chip ${metric.positive ? "positive" : "negative"}`}>
                <div className="metric-icon">{metric.icon}</div>
                <div className="metric-text">
                  <span className="metric-label">{metric.label}</span>
                  <span className="metric-value">{metric.value}</span>
                </div>
                <span className="metric-delta">{metric.delta}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-controls">
          <div className="pill-group" role="tablist" aria-label="Primary asset">
            {ASSETS.map(asset => {
              const active = asset.id === activeAssetId;
              return (
                <button
                  key={asset.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`pill ${active ? "active" : ""}`}
                  onClick={() => setActiveAssetId(asset.id)}
                >
                  <span>{asset.id}</span>
                </button>
              );
            })}
          </div>

          <div className="control-stack">
            <div className="control-group">
              <span className="control-label">Timeframe</span>
              <div className="pill-group" role="group" aria-label="Time window">
                {TIME_WINDOWS.map(option => {
                  const active = option.id === timeWindow;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={`pill ${active ? "active" : ""}`}
                      onClick={() => setTimeWindow(option.id)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="control-group">
              <span className="control-label">Scale</span>
              <div className="pill-group" role="group" aria-label="Scale selector">
                {SCALE_OPTIONS.map(option => {
                  const active = option.id === scaleType;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={`pill ${active ? "active" : ""}`}
                      onClick={() => setScaleType(option.id)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="command-center">
        <article className="market-panel glass-surface">
          <header className="market-panel-header">
            <div className="panel-title">
              <BarChart2 size={18} />
              <div>
                <h2>{activeAsset.id} Prophecy Blend</h2>
                <span className="panel-subtitle">Close vs active prophets for current window</span>
              </div>
            </div>
            <span className="panel-tag">{timeWindow}</span>
          </header>
          <div className="market-panel-chart">
            <StockChart data={mainChartData} scaleType={scaleType} />
          </div>
          <footer className="market-panel-footer">
            <div className="footer-stat">
              <span>52W High</span>
              <strong>{formatCompact(range.high)}</strong>
            </div>
            <div className="footer-stat">
              <span>52W Low</span>
              <strong>{formatCompact(range.low)}</strong>
            </div>
            <div className="footer-stat">
              <span>Session Δ</span>
              <strong className={sessionChange.points >= 0 ? "positive" : "negative"}>
                {formatDelta(sessionChange.pct)}%
              </strong>
            </div>
          </footer>
        </article>

        <aside className="prophet-console glass-surface">
          <header className="prophet-header">
            <Zap size={18} />
            <div>
              <h3>Prophet Console</h3>
              <span>Select up to {MAX_ACTIVE_PROPHETS} models to overlay live</span>
            </div>
          </header>
          <div className="prophet-grid">
            {(Object.keys(PROPHECY_LIBRARY) as ProphetKey[]).map(key => {
              const info = PROPHECY_LIBRARY[key];
              const active = selectedProphets.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  className={`prophet-card ${active ? "active" : ""}`}
                  onClick={() => handleProphetToggle(key)}
                  style={{ borderColor: active ? info.color : "var(--border-light)" }}
                >
                  <span className="prophet-accent" style={{ background: info.color }} />
                  <div className="prophet-text">
                    <strong>{info.title}</strong>
                    <p>{info.blurb}</p>
                    <span className="prophet-emphasis">{info.emphasis}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      </section>

      <section className="insights-grid">
        <article className="insight-card glass-surface">
          <header>
            <h3>{comparisonAsset.id} Pulse</h3>
            <span>{comparisonAsset.description}</span>
          </header>
          <div className="mini-chart">
            <StockChart data={comparisonChartData} scaleType={scaleType} />
          </div>
        </article>

        <article className="insight-card glass-surface">
          <header>
            <h3>Signals tonight</h3>
            <span>Autogenerated blend from active prophets</span>
          </header>
          <ul className="signal-list">
            {signalDeck.map(signal => (
              <li key={signal.title}>
                <span className="signal-icon">{signal.icon}</span>
                <div>
                  <strong>{signal.title}</strong>
                  <p>{signal.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}