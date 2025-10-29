import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
// @ts-ignore
import Plotly from 'plotly.js-dist-min';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { getAsset, getAssetPrices } from '../services/assets';
import { PriceData } from '../types/price';
import MiniIndicator from '../components/mini/MiniIndicator';
import SMACombined from '../components/mini/SMACombined';
import PriceVolumeExplorer from '../components/charts/PriceVolumeExplorer';
import TimeExplorer from '../components/charts/TimeExplorer';
import { usePlotlyTheme } from '../hooks/usePlotlyTheme';
import { useTheme } from '../context/ThemeContext';
import Widget from '../components/widgets/Widget';
import './AssetPage.css';

// Minimal asset metadata used on the page (separate from per-price Asset points)
interface AssetMeta {
  ticker: string;
  name?: string;
  market?: string;
  lastPrice?: number | null;
  priceChange?: number | null;
}

export default function AssetPage() {
  const { ticker } = useParams<{ ticker: string }>();
  const plotlyTheme = usePlotlyTheme();
  const { theme } = useTheme();
  const [asset, setAsset] = useState<AssetMeta | null>(null);
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [fullPrices, setFullPrices] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<string>('1Y');

  // Downsample daily prices into weekly OHLCV (week start = Monday)
  function downsampleToWeekly(prices: PriceData[]): PriceData[] {
    if (!prices || !prices.length) return [];
    const groups: Record<string, PriceData[]> = {};
    for (const p of prices) {
      const d = new Date(p.date);
      // compute Monday as week start
      const diff = (d.getDay() + 6) % 7; // 0 for Monday
      const monday = new Date(d);
      monday.setDate(d.getDate() - diff);
      const key = monday.toISOString().slice(0, 10);
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }
    const result: PriceData[] = Object.keys(groups).sort().map(k => {
      const arr = groups[k];
      const open = arr[0].open;
      const close = arr[arr.length - 1].close;
      const high = arr.reduce((s, r) => Math.max(s, r.high), -Infinity);
      const low = arr.reduce((s, r) => Math.min(s, r.low), Infinity);
      const volume = arr.reduce((s, r) => s + (r.volume || 0), 0);
      return { date: k, open, high, low, close, volume, ticker: arr[0].ticker } as PriceData;
    });
    return result;
  }

  function simpleSMA(values: number[], period: number): number | null {
    if (!values || values.length < period) return null;
    const slice = values.slice(values.length - period);
    const sum = slice.reduce((s, v) => s + v, 0);
    return sum / period;
  }

  // Expose series-producing indicator functions (return same-length array aligned with prices)
  function smaSeries(closes: number[], period: number) {
    const out: Array<number | null> = [];
    for (let i = 0; i < closes.length; i++) {
      if (i + 1 < period) out.push(null);
      else {
        const slice = closes.slice(i + 1 - period, i + 1);
        out.push(slice.reduce((s, v) => s + v, 0) / period);
      }
    }
    return out;
  }

  function emaSeries(closes: number[], period: number) {
    const out: Array<number | null> = [];
    const k = 2 / (period + 1);
    let prev: number | null = null;
    for (let i = 0; i < closes.length; i++) {
      const price = closes[i];
      if (prev === null) {
        // seed with SMA of first period
        if (i + 1 >= period) {
          const seed = closes.slice(i + 1 - period, i + 1).reduce((s, v) => s + v, 0) / period;
          prev = seed;
          out.push(prev);
        } else out.push(null);
      } else {
        prev = price * k + prev * (1 - k);
        out.push(prev);
      }
    }
    return out;
  }

  function rsiSeries(closes: number[], period = 14) {
    const out: Array<number | null> = [];
    let gains = 0;
    let losses = 0;
    for (let i = 0; i < closes.length; i++) {
      if (i === 0) {
        out.push(null);
        continue;
      }
      const change = closes[i] - closes[i - 1];
      const gain = Math.max(0, change);
      const loss = Math.max(0, -change);
      if (i <= period) {
        gains += gain;
        losses += loss;
        out.push(null);
        if (i === period) {
          const avgGain = gains / period;
          const avgLoss = losses / period;
          const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
          out[i] = 100 - 100 / (1 + rs);
        }
        continue;
      }
      // Wilder smoothing
      // previous avgGain/avgLoss are at index i-1
      const prevIndex = i - 1;
      const prevRSI = out[prevIndex];
      // We need running averages. Simpler approach: compute avg gain/loss rolling
      // Recompute over window for simplicity (not optimal, but acceptable)
      const slice = closes.slice(Math.max(0, i + 1 - period), i + 1);
      let g = 0,
        l = 0;
      for (let j = 1; j < slice.length; j++) {
        const ch = slice[j] - slice[j - 1];
        if (ch > 0) g += ch; else l += -ch;
      }
      const avgGain = g / period;
      const avgLoss = l / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      out[i] = 100 - 100 / (1 + rs);
    }
    return out;
  }

  function macdSeries(closes: number[], fast = 12, slow = 26, signal = 9) {
    const emaFast = emaSeries(closes, fast).map(v => v ?? NaN);
    const emaSlow = emaSeries(closes, slow).map(v => v ?? NaN);
    const macd: number[] = closes.map((_, i) => {
      const f = emaFast[i];
      const s = emaSlow[i];
      if (isNaN(f) || isNaN(s)) return NaN;
      return f - s;
    });
    // signal line
    const signalLine = (() => {
      // simple EMA on macd (ignoring NaNs)
      const clean: number[] = macd.map(v => isNaN(v) ? 0 : v);
      const s = emaSeries(clean as number[], signal).map(v => v ?? NaN);
      return s;
    })();
    // histogram
    return macd.map((v, i) => (isNaN(v) || isNaN(signalLine[i]) ? null : v - (signalLine[i] as number)));
  }

  function obvSeries(closes: number[], volumes: number[]) {
    const out: Array<number | null> = [];
    let obv = 0;
    for (let i = 0; i < closes.length; i++) {
      if (i === 0) { out.push(0); continue; }
      if (closes[i] > closes[i - 1]) obv += volumes[i] || 0;
      else if (closes[i] < closes[i - 1]) obv -= volumes[i] || 0;
      out.push(obv);
    }
    return out;
  }

  function atrSeries(highs: number[], lows: number[], closes: number[], period = 14) {
    const trs: number[] = [];
    for (let i = 0; i < highs.length; i++) {
      if (i === 0) { trs.push(highs[i] - lows[i]); continue; }
      const tr = Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1]));
      trs.push(tr);
    }
    // SMA of TR for each point
    const out: Array<number | null> = [];
    for (let i = 0; i < trs.length; i++) {
      if (i + 1 < period) out.push(null);
      else {
        const slice = trs.slice(i + 1 - period, i + 1);
        out.push(slice.reduce((s, v) => s + v, 0) / period);
      }
    }
    return out;
  }

  function stochasticSeries(highs: number[], lows: number[], closes: number[], kPeriod = 14, dPeriod = 3) {
    const kArr: Array<number | null> = [];
    for (let i = 0; i < closes.length; i++) {
      if (i + 1 < kPeriod) kArr.push(null);
      else {
        const sliceH = highs.slice(i + 1 - kPeriod, i + 1);
        const sliceL = lows.slice(i + 1 - kPeriod, i + 1);
        const hh = Math.max(...sliceH);
        const ll = Math.min(...sliceL);
        const val = hh === ll ? 0 : ((closes[i] - ll) / (hh - ll)) * 100;
        kArr.push(val);
      }
    }
    // %D is SMA of %K
    const dArr: Array<number | null> = [];
    for (let i = 0; i < kArr.length; i++) {
      if (i + 1 < kPeriod + dPeriod - 1) dArr.push(null);
      else {
        const slice = kArr.slice(i + 1 - dPeriod, i + 1).map(v => v ?? 0);
        dArr.push(slice.reduce((s, v) => s + v, 0) / dPeriod);
      }
    }
    return { k: kArr, d: dArr };
  }

  function bollingerSeries(closes: number[], period = 20, mult = 2) {
    const middle = smaSeries(closes, period);
    const upper: Array<number | null> = [];
    const lower: Array<number | null> = [];
    for (let i = 0; i < closes.length; i++) {
      if (i + 1 < period) { upper.push(null); lower.push(null); }
      else {
        const slice = closes.slice(i + 1 - period, i + 1);
        const mean = slice.reduce((s, v) => s + v, 0) / period;
        const variance = slice.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / period;
        const sd = Math.sqrt(variance);
        upper.push(mean + mult * sd);
        lower.push(mean - mult * sd);
      }
    }
    return { middle, upper, lower };
  }

  function rocSeries(closes: number[], period = 12) {
    const out: Array<number | null> = [];
    for (let i = 0; i < closes.length; i++) {
      if (i < period) out.push(null);
      else out.push(((closes[i] / closes[i - period]) - 1) * 100);
    }
    return out;
  }

  function computeRangeStart(range: string, reference: Date): string | null {
    if (!range) return null;
    const d = new Date(reference);
    switch (range) {
      case '30D': d.setDate(d.getDate() - 30); break;
      case '1M': d.setMonth(d.getMonth() - 1); break;
      case '3M': d.setMonth(d.getMonth() - 3); break;
      case '6M': d.setMonth(d.getMonth() - 6); break;
      case '1Y': d.setFullYear(d.getFullYear() - 1); break;
      case 'YTD': d.setMonth(0, 1); break;
      case '5Y': d.setFullYear(d.getFullYear() - 5); break;
      case '10Y': d.setFullYear(d.getFullYear() - 10); break;
      default: return null;
    }
    return d.toISOString().slice(0, 10);
  }

  useEffect(() => {
    if (!ticker) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setAsset(null);
    setPrices([]);
    setFullPrices([]);

    (async () => {
      try {
        const [assetData, history] = await Promise.all([
          getAsset(ticker),
          getAssetPrices(ticker)
        ]);

        if (!isMounted) return;

        if (!assetData && history && history.length) {
          setAsset({ ticker: ticker || '', name: ticker });
        } else if (assetData) {
          setAsset({
            ticker: assetData.ticker || ticker,
            name: assetData.name || ticker,
            market: assetData.market
          });
        } else {
          setError('Asset not found');
        }

        const today = new Date();
        const sanitized = (history || [])
          .filter(price => new Date(price.date) <= today)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setFullPrices(sanitized);
        setLoading(false);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Failed to load asset data', err);
        setError(err?.message || 'Failed to load asset data');
        setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [ticker]);

  useEffect(() => {
    if (!fullPrices.length) {
      setPrices([]);
      return;
    }

    const reference = new Date(fullPrices[fullPrices.length - 1].date);
    const start = computeRangeStart(selectedRange, reference);
    if (!start) {
      setPrices([...fullPrices]);
      return;
    }

    const filtered = fullPrices.filter(price => price.date >= start);
    setPrices(filtered);
  }, [fullPrices, selectedRange]);

  const indicatorSeries = useMemo(() => {
    if (!fullPrices.length) return null;
    const closes = fullPrices.map(p => p.close);
    return {
      sma20: smaSeries(closes, 20),
      sma50: smaSeries(closes, 50),
      sma200: smaSeries(closes, 200),
      rsi14: rsiSeries(closes, 14),
      macdHist: macdSeries(closes)
    };
  }, [fullPrices]);

  const priceIndexByDate = useMemo(() => {
    const map = new Map<string, number>();
    fullPrices.forEach((price, idx) => {
      map.set(price.date, idx);
    });
    return map;
  }, [fullPrices]);

  const rangeIndicators = useMemo(() => {
    if (!indicatorSeries || !prices.length) return null;
    const sliceSeries = (series: Array<number | null>) => (
      prices.map(price => {
        const idx = priceIndexByDate.get(price.date);
        if (idx === undefined) return null;
        return series[idx] ?? null;
      })
    );

    return {
      sma20: sliceSeries(indicatorSeries.sma20),
      sma50: sliceSeries(indicatorSeries.sma50),
      sma200: sliceSeries(indicatorSeries.sma200),
      rsi14: sliceSeries(indicatorSeries.rsi14),
      macdHist: sliceSeries(indicatorSeries.macdHist)
    };
  }, [indicatorSeries, prices, priceIndexByDate]);

  const candlestickSource = useMemo(() => {
    if (!prices.length) return [] as PriceData[];
    if (selectedRange === '5Y' || selectedRange === '10Y') {
      return downsampleToWeekly(prices);
    }
    return prices;
  }, [prices, selectedRange]);

  const candlestickData = useMemo(() => {
    if (!candlestickSource.length) return null;

    // For psychedelic theme, create color-cycling candlesticks using individual bars
    const isPsychedelic = theme === 'psychedelic';
    
    if (isPsychedelic) {
      // Create cycling colors for psychedelic effect
      const upColors = ['#00ff88', '#39ff14', '#00ffaa', '#33ff66', '#00ff99', '#66ffaa'];
      const downColors = ['#ff1493', '#ff007f', '#ff0066', '#ff3399', '#ff00aa', '#ff66cc'];
      
      // Create individual bar traces with cycling colors
      const traces = candlestickSource.map((p, i) => {
        const isUp = p.close >= p.open;
        const colorIndex = i % 6;
        const fillColor = isUp ? upColors[colorIndex] : downColors[colorIndex];
        const lineColor = isUp ? upColors[(colorIndex + 1) % 6] : downColors[(colorIndex + 1) % 6];
        
        return {
          x: [p.date],
          open: [p.open],
          high: [p.high],
          low: [p.low],
          close: [p.close],
          type: 'candlestick' as const,
          increasing: {
            line: { color: lineColor, width: 2 },
            fillcolor: fillColor
          },
          decreasing: {
            line: { color: lineColor, width: 2 },
            fillcolor: fillColor
          },
          showlegend: false
        };
      });

      return traces;
    }

    return [{
      x: candlestickSource.map(p => p.date),
      open: candlestickSource.map(p => p.open),
      high: candlestickSource.map(p => p.high),
      low: candlestickSource.map(p => p.low),
      close: candlestickSource.map(p => p.close),
      type: 'candlestick' as const,
      name: ticker,
      increasing: plotlyTheme.increasing,
      decreasing: plotlyTheme.decreasing
    }];
  }, [candlestickSource, ticker, plotlyTheme, theme]);

  // Calculate returns for multiple time windows
  function calculateReturnsSeries(priceData: PriceData[], period: number, priceField: 'open' | 'close' | 'high' | 'low') {
    return priceData.map((price, i) => {
      if (i < period) return null;
      const prev = priceData[i - period];
      const currentPrice = price[priceField];
      const prevPrice = prev[priceField];
      return ((currentPrice - prevPrice) / prevPrice) * 100;
    });
  }

  const [returnsWindow, setReturnsWindow] = useState<string>('1D');

  const returnData = useMemo(() => {
    if (prices.length < 2) return null;

    // Determine period based on window selection
    const periodMap: Record<string, number> = {
      '1D': 1,   // DoD
      '5D': 5,   // WoW
      '20D': 20, // MoM
      '60D': 60, // QoQ
      '120D': 120, // HyoHy
      '240D': 240  // YoY
    };

    const period = periodMap[returnsWindow] || 1;

    return [
      {
        x: prices.map(p => p.date),
        y: calculateReturnsSeries(prices, period, 'open'),
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'Open-to-Open',
        line: { color: plotlyTheme.chartColors[0], width: 2 }
      },
      {
        x: prices.map(p => p.date),
        y: calculateReturnsSeries(prices, period, 'close'),
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'Close-to-Close',
        line: { color: plotlyTheme.chartColors[1], width: 2 }
      },
      {
        x: prices.map(p => p.date),
        y: calculateReturnsSeries(prices, period, 'high'),
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'High-to-High',
        line: { color: plotlyTheme.chartColors[2], width: 2 }
      },
      {
        x: prices.map(p => p.date),
        y: calculateReturnsSeries(prices, period, 'low'),
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'Low-to-Low',
        line: { color: plotlyTheme.chartColors[3], width: 2 }
      }
    ];
  }, [prices, returnsWindow, plotlyTheme]);

  const candlestickChartRef = useRef<HTMLDivElement>(null);
  const returnsChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!candlestickData) return;
    if (!candlestickChartRef.current) return;

    // Adjust height based on whether expanded
    const candlestickHeight = 460;

    // Plot candlestick chart (title moved to card label)
    const candlestickLayout = {
      height: candlestickHeight,
      margin: { t: 40, r: 10, l: 60, b: 40 },
      ...plotlyTheme,
      xaxis: {
        ...plotlyTheme.xaxis
      },
      yaxis: {
        ...plotlyTheme.yaxis,
        title: { text: 'Price', font: { color: plotlyTheme.font.color } }
      }
    };

    Plotly.newPlot(candlestickChartRef.current, candlestickData, candlestickLayout).catch(console.error);

    return () => {
      if (candlestickChartRef.current) {
        Plotly.purge(candlestickChartRef.current);
      }
    };
  }, [candlestickData, ticker, plotlyTheme]);

  useEffect(() => {
    if (!returnData) return;
    if (!returnsChartRef.current) return;

    // Adjust height based on whether expanded
    const returnHeight = 360;

    // Plot returns chart (title moved to card label)
    const returnLayout = {
      height: returnHeight,
      margin: { t: 40, r: 10, l: 60, b: 40 },
      ...plotlyTheme,
      showlegend: true,
      legend: { 
        orientation: 'h' as const, 
        y: -0.2,
        font: { color: plotlyTheme.font.color }
      },
      xaxis: {
        ...plotlyTheme.xaxis
      },
      yaxis: {
        ...plotlyTheme.yaxis,
        title: { text: 'Return (%)', font: { color: plotlyTheme.font.color } }
      }
    };

    Plotly.newPlot(returnsChartRef.current, returnData, returnLayout).catch(console.error);

    return () => {
      if (returnsChartRef.current) {
        Plotly.purge(returnsChartRef.current);
      }
    };
  }, [returnData, plotlyTheme]);

  // Ensure Plotly charts resize when their container size changes (e.g. sidebar toggles, or when expanded)
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(() => {
      try {
        if (candlestickChartRef.current) {
          // safe no-op if not a plotly element
          // @ts-ignore
          Plotly.Plots && Plotly.Plots.resize && Plotly.Plots.resize(candlestickChartRef.current);
        }
        if (returnsChartRef.current) {
          // @ts-ignore
          Plotly.Plots && Plotly.Plots.resize && Plotly.Plots.resize(returnsChartRef.current);
        }
      } catch (e) {
        // swallow resize errors
      }
    });

    const c = candlestickChartRef.current;
    const r = returnsChartRef.current;
    if (c) ro.observe(c);
  if (r) ro.observe(r);

    return () => ro.disconnect();
  }, []);

  // Trigger chart resize when expanded state changes
  useEffect(() => {
    // Small delay to allow DOM to render and container to resize
    const timer = setTimeout(() => {
      try {
        if (candlestickChartRef.current) {
          // @ts-ignore
          Plotly.Plots && Plotly.Plots.resize && Plotly.Plots.resize(candlestickChartRef.current);
        }
        if (returnsChartRef.current) {
          // @ts-ignore
          Plotly.Plots && Plotly.Plots.resize && Plotly.Plots.resize(returnsChartRef.current);
        }
      } catch (e) {
        // ignore resize errors
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const explorerPrices = fullPrices.length ? fullPrices : prices;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="asset-page-screen">
      {/* Hero Section with Price Chart */}
      <section className="asset-hero-main glass-surface">
        <div className="hero-header">
          <div className="hero-content">
            <span className="asset-eyebrow">Asset Overview</span>
            <h1 className="asset-title">{asset?.name || asset?.ticker || ticker}</h1>
            {asset?.ticker && asset?.ticker !== asset?.name ? (
              <span className="asset-ticker">{asset?.ticker}</span>
            ) : null}
          </div>
          <div className="hero-controls">
            {/* Time range selector */}
            <div className="control-group">
              <label className="control-label">Time Window</label>
              <div className="pill-group" role="tablist" aria-label="Time range">
                  {['30D','1M','3M','6M','1Y','YTD','5Y','10Y'].map(r => (
                  <button
                    key={r}
                    className={`pill ${selectedRange === r ? 'active' : ''}`}
                    onClick={() => setSelectedRange(r)}
                    aria-pressed={selectedRange === r}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Price History Chart inside hero */}
        <div className="hero-chart">
          <div className="chart-container">
            <div ref={candlestickChartRef} className="plotly-chart"></div>
          </div>
        </div>
      </section>

      {/* Widgets Grid - 3 Columns */}
      <div className="widgets-grid">
        <ErrorBoundary>
          <Widget
            id="price-volume-explorer"
            title="Price-Volume Explorer"
            subtitle="Interactive 3D Analysis"
          >
            <div className="chart-container">
              <PriceVolumeExplorer data={prices} height={380} />
            </div>
          </Widget>
        </ErrorBoundary>

        <ErrorBoundary>
          <Widget
            id="daily-returns"
            title="Daily Returns"
            subtitle="Return Distribution Over Time"
          >
            <div className="control-group" style={{ marginBottom: 'var(--spacing-4)' }}>
              <div className="pill-group">
                {['1D', '5D', '20D', '60D', '120D', '240D'].map(window => (
                  <button
                    key={window}
                    onClick={() => setReturnsWindow(window)}
                    className={`pill ${returnsWindow === window ? 'active' : ''}`}
                  >
                    {window === '1D' ? 'DoD' : window === '5D' ? 'WoW' : window === '20D' ? 'MoM' : window === '60D' ? 'QoQ' : window === '120D' ? 'HyoHy' : 'YoY'}
                  </button>
                ))}
              </div>
            </div>
            <div className="chart-container">
              <div ref={returnsChartRef} className="plotly-chart"></div>
            </div>
          </Widget>
        </ErrorBoundary>

        <ErrorBoundary>
          <Widget
            id="time-explorer"
            title="Time Explorer"
            subtitle="Historical Timeline View"
          >
            <div className="chart-container">
              <TimeExplorer prices={explorerPrices} height={360} />
            </div>
          </Widget>
        </ErrorBoundary>

        <Widget
          id="technical-analysis"
          title="Technical Analysis"
          subtitle="Key Indicators"
        >
          <div className="indicators-content">
            {prices && prices.length && rangeIndicators ? (
              <>
                {(() => {
                  const getLastValue = (series: Array<number | null>) => {
                    for (let i = series.length - 1; i >= 0; i--) {
                      const val = series[i];
                      if (val !== null && val !== undefined && !Number.isNaN(val as number)) {
                        return val as number;
                      }
                    }
                    return null;
                  };

                  const sma20Series = rangeIndicators.sma20 || [];
                  const sma50Series = rangeIndicators.sma50 || [];
                  const sma200Series = rangeIndicators.sma200 || [];
                  const rsiSeriesData = rangeIndicators.rsi14 || [];
                  const macdHistSeries = rangeIndicators.macdHist || [];
                  const lastClose = prices[prices.length - 1]?.close ?? null;

                  const macdExtent = (() => {
                    const vals = macdHistSeries.filter((v): v is number => v !== null && v !== undefined && !Number.isNaN(v as number)).map(v => Math.abs(v));
                    if (!vals.length) return 1;
                    const maxAbs = Math.max(...vals);
                    return maxAbs === 0 ? 1 : maxAbs;
                  })();

                  const macdDomain = { min: -macdExtent, max: macdExtent };

                  return (
                    <>
                      <div className="indicator-item">
                        <SMACombined sma20={sma20Series} sma50={sma50Series} sma200={sma200Series} currentValue={lastClose} />
                      </div>
                      <div className="indicator-item">
                        <MiniIndicator
                          name="RSI(14)"
                          value={getLastValue(rsiSeriesData)}
                          series={rsiSeriesData}
                          thresholds={{ low: 30, high: 70 }}
                          yDomain={{ min: 0, max: 100 }}
                        />
                      </div>
                      <div className="indicator-item">
                        <MiniIndicator
                          name="MACD(hist)"
                          value={getLastValue(macdHistSeries)}
                          series={macdHistSeries}
                          histogram
                          yDomain={macdDomain}
                        />
                      </div>
                    </>
                  );
                })()}
              </>
            ) : (
              <div className="no-data">No analysis available for this range.</div>
            )}
          </div>
        </Widget>
      </div>
    </div>
  );
}