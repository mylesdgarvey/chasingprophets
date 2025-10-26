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
  const [asset, setAsset] = useState<AssetMeta | null>(null);
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [fullPrices, setFullPrices] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<string>('1Y');
  const [techAnalysis, setTechAnalysis] = useState<Record<string, number | null>>({});
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

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

  useEffect(() => {
    async function loadAssetData() {
      if (!ticker) return;

      // compute date range based on selectedRange
      const today = new Date();
      const endDate = today.toISOString().slice(0, 10);
      const computeStart = (range: string) => {
        const d = new Date();
        switch (range) {
          case '30D': d.setDate(d.getDate() - 30); break;
          case '1M': d.setMonth(d.getMonth() - 1); break;
          case '3M': d.setMonth(d.getMonth() - 3); break;
          case '6M': d.setMonth(d.getMonth() - 6); break;
          case '1Y': d.setFullYear(d.getFullYear() - 1); break;
          case 'YTD': d.setMonth(0, 1); break;
          case '5Y': d.setFullYear(d.getFullYear() - 5); break;
          case '10Y': d.setFullYear(d.getFullYear() - 10); break;
          default: d.setFullYear(d.getFullYear() - 1);
        }
        return d.toISOString().slice(0, 10);
      };

      const startDate = computeStart(selectedRange);

      try {
        const [assetData, priceData] = await Promise.all([
          getAsset(ticker),
          getAssetPrices(ticker, startDate, endDate)
        ]);

        // If the metadata API doesn't return an asset but prices exist, fall back to
        // constructing minimal metadata so the user still sees the price chart.
        if (!assetData && priceData && priceData.length) {
          setAsset({ ticker: ticker || '', name: ticker });
        } else if (assetData) {
          // normalize metadata shape
          setAsset({
            ticker: assetData.ticker || ticker,
            name: assetData.name || ticker,
            market: assetData.market
          });
        } else {
          // Neither metadata nor price data found
          setError('Asset not found');
        }

        // If the selected range is long (5Y/10Y), downsample daily -> weekly to keep memory low
        let finalPrices = priceData || [];
        if (selectedRange === '5Y' || selectedRange === '10Y') {
          finalPrices = downsampleToWeekly(finalPrices);
        }
        setPrices(finalPrices);
        setLoading(false);
      } catch (err: any) {
        setError(err?.message || 'Failed to load asset data');
        setLoading(false);
      }
    }

    loadAssetData();
  }, [ticker, selectedRange]);

  useEffect(() => {
    if (!ticker) return;

    setFullPrices([]);

    let isMounted = true;

    (async () => {
      try {
        const history = await getAssetPrices(ticker);
        if (isMounted) {
          const today = new Date();
          const sanitized = (history || []).filter(price => new Date(price.date) <= today);
          setFullPrices(sanitized);
        }
      } catch (err) {
        console.warn('Failed to load full price history for Time Explorer', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [ticker]);

  const candlestickData = useMemo(() => {
    if (!prices.length) return null;

    return [{
      x: prices.map(p => p.date),
      open: prices.map(p => p.open),
      high: prices.map(p => p.high),
      low: prices.map(p => p.low),
      close: prices.map(p => p.close),
      type: 'candlestick' as const,
      name: ticker
    }];
  }, [prices, ticker]);

  // derive technical indicators from current prices
  useEffect(() => {
    if (!prices || !prices.length) {
      setTechAnalysis({});
      return;
    }
    const closes = prices.map(p => p.close);
    const sma50 = simpleSMA(closes, 50);
    const sma200 = simpleSMA(closes, 200);
    setTechAnalysis({ sma50, sma200 });
  }, [prices]);

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
        name: 'Open-to-Open'
      },
      {
        x: prices.map(p => p.date),
        y: calculateReturnsSeries(prices, period, 'close'),
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'Close-to-Close'
      },
      {
        x: prices.map(p => p.date),
        y: calculateReturnsSeries(prices, period, 'high'),
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'High-to-High'
      },
      {
        x: prices.map(p => p.date),
        y: calculateReturnsSeries(prices, period, 'low'),
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'Low-to-Low'
      }
    ];
  }, [prices, returnsWindow]);

  const candlestickChartRef = useRef<HTMLDivElement>(null);
  const returnsChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!candlestickData) return;
    if (!candlestickChartRef.current) return;

    // Adjust height based on whether expanded
    const candlestickHeight = expandedCard === 'price' ? window.innerHeight - 120 : 500;

    // Plot candlestick chart (title moved to card label)
    const candlestickLayout = {
      height: candlestickHeight,
      margin: { t: 40, r: 10, l: 60, b: 40 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      xaxis: {
        gridcolor: 'rgba(0,0,0,0.1)',
        zerolinecolor: 'rgba(0,0,0,0.2)'
      },
      yaxis: {
        title: { text: 'Price' },
        gridcolor: 'rgba(0,0,0,0.1)',
        zerolinecolor: 'rgba(0,0,0,0.2)'
      }
    };

    Plotly.newPlot(candlestickChartRef.current, candlestickData, candlestickLayout).catch(console.error);

    return () => {
      if (candlestickChartRef.current) {
        Plotly.purge(candlestickChartRef.current);
      }
    };
  }, [candlestickData, ticker, expandedCard]);

  useEffect(() => {
    if (!returnData) return;
    if (!returnsChartRef.current) return;

    // Adjust height based on whether expanded
    const returnHeight = expandedCard === 'returns' ? window.innerHeight - 120 : 400;

    // Plot returns chart (title moved to card label)
    const returnLayout = {
      height: returnHeight,
      margin: { t: 40, r: 10, l: 60, b: 40 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      showlegend: true,
      legend: { orientation: 'h' as const, y: -0.2 },
      xaxis: {
        gridcolor: 'rgba(0,0,0,0.1)',
        zerolinecolor: 'rgba(0,0,0,0.2)'
      },
      yaxis: {
        title: { text: 'Return (%)' },
        gridcolor: 'rgba(0,0,0,0.1)',
        zerolinecolor: 'rgba(0,0,0,0.2)'
      }
    };

    Plotly.newPlot(returnsChartRef.current, returnData, returnLayout).catch(console.error);

    return () => {
      if (returnsChartRef.current) {
        Plotly.purge(returnsChartRef.current);
      }
    };
  }, [returnData, expandedCard]);

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
  }, [expandedCard]);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const explorerPrices = fullPrices.length ? fullPrices : prices;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="asset-page">
      <header className="page-header">
        <div className="title-block">
          <h1 className="title">{asset?.ticker || asset?.name}</h1>
          {asset?.name && asset?.name !== asset?.ticker ? (
            <div className="subtitle">{asset?.name}</div>
          ) : null}
        </div>
        <div className="controls">
          {/* Time range selector */}
          <div className="range-selector" role="tablist" aria-label="Time range">
            {['30D','1M','3M','6M','1Y','YTD','5Y','10Y'].map(r => (
              <button
                key={r}
                className={`range-btn ${selectedRange === r ? 'active' : ''}`}
                onClick={() => setSelectedRange(r)}
                aria-pressed={selectedRange === r}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="cards-grid" style={expandedCard ? { display: 'none' } : {}}>
        <ErrorBoundary>
          <div className="chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-label">Price History</h3>
              <button onClick={() => setExpandedCard('price')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '4px 8px' }}>⛶</button>
            </div>
            <div ref={candlestickChartRef} className="chart-area"></div>
          </div>
        </ErrorBoundary>

        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-label">Price-Volume Explorer</h3>
            <button onClick={() => setExpandedCard('pve')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '4px 8px' }}>⛶</button>
          </div>
          <div className="chart-area" style={{ minHeight: 440 }}>
            <PriceVolumeExplorer data={prices} height={440} />
          </div>
        </div>

        <ErrorBoundary>
          <div className="chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 className="card-label">Daily Returns</h3>
              <button onClick={() => setExpandedCard('returns')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '4px 8px' }}>⛶</button>
            </div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {['1D', '5D', '20D', '60D', '120D', '240D'].map(window => (
                <button
                  key={window}
                  onClick={() => setReturnsWindow(window)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: returnsWindow === window ? '2px solid var(--primary)' : '1px solid rgba(15,23,42,0.2)',
                    background: returnsWindow === window ? 'var(--primary)' : 'transparent',
                    color: returnsWindow === window ? 'white' : 'var(--text)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: returnsWindow === window ? '600' : '500',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {window === '1D' ? 'DoD' : window === '5D' ? 'WoW' : window === '20D' ? 'MoM' : window === '60D' ? 'QoQ' : window === '120D' ? 'HyoHy' : 'YoY'}
                </button>
              ))}
            </div>
            <div ref={returnsChartRef} className="chart-area"></div>
          </div>
        </ErrorBoundary>

        <ErrorBoundary>
          <div className="chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-label">Time Explorer</h3>
              <button onClick={() => setExpandedCard('timeexplorer')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '4px 8px' }}>⛶</button>
            </div>
            <div className="chart-area" style={{ minHeight: 400 }}>
              <TimeExplorer prices={explorerPrices} height={400} />
            </div>
          </div>
        </ErrorBoundary>

        <div className="chart-card placeholder-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-label">Technical Analysis</h3>
            <button onClick={() => setExpandedCard('technical')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '4px 8px' }}>⛶</button>
          </div>
          <div className="placeholder-content">
            {prices && prices.length ? (
              <div className="mini-indicators">
                {/* compute indicators from current prices */}
                {(() => {
                  const closes = prices.map(p => p.close);
                  const highs = prices.map(p => p.high);
                  const lows = prices.map(p => p.low);
                  const volumes = prices.map(p => p.volume || 0);

                  // Industry-standard indicators: SMA(20, 50, 200), RSI(14), MACD(hist)
                  // Adapt SMA(200) if data is shorter; fall back to SMA(50) or less
                  const N = closes.length;
                  const sma200Period = N >= 200 ? 200 : (N >= 100 ? 50 : Math.max(20, Math.floor(N / 3)));
                  
                  const sma20Series = smaSeries(closes, 20);
                  const sma50Series = smaSeries(closes, 50);
                  const sma200Series = smaSeries(closes, sma200Period);
                  
                  // Get last values for display in the combined SMA component
                  const getLastValue = (series: Array<number | null>) => {
                    for (let i = series.length - 1; i >= 0; i--) {
                      if (series[i] !== null && series[i] !== undefined && !Number.isNaN(series[i] as number)) {
                        return series[i] as number;
                      }
                    }
                    return null;
                  };
                  
                  const indicators = [
                    { key: 'SMA_Combined', name: 'SMA Combined', type: 'combined', sma20: sma20Series, sma50: sma50Series, sma200: sma200Series, currentValue: closes[closes.length - 1] },
                    { key: 'RSI14', name: 'RSI(14)', type: 'indicator', series: rsiSeries(closes, 14), thresholds: { low: 30, high: 70 } },
                    { key: 'MACD', name: 'MACD(hist)', type: 'indicator', series: macdSeries(closes), histogram: true }
                  ];

                  return indicators.map(ind => {
                    if (ind.type === 'combined') {
                      return (
                        <div key={ind.key} style={{ marginBottom: 12 }}>
                          <SMACombined sma20={ind.sma20 || []} sma50={ind.sma50 || []} sma200={ind.sma200 || []} currentValue={ind.currentValue} />
                        </div>
                      );
                    }
                    const s = (ind as any).series || [];
                    const last = (s.slice().reverse().find((v: any) => v !== null && v !== undefined) as number | null) ?? null;
                    return (
                      <div key={ind.key} style={{ marginBottom: 12 }}>
                        <MiniIndicator name={ind.name} value={last ?? null} series={s} thresholds={(ind as any).thresholds as any} histogram={(ind as any).histogram as any} />
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              <div>No analysis available for this range.</div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded card views - positioned absolutely within cards-grid area */}
      {expandedCard === 'price' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'white', zIndex: 1000, display: 'flex', flexDirection: 'column', padding: '20px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', animation: 'fadeIn 0.15s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Price History</h2>
            <button onClick={() => setExpandedCard(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>✕</button>
          </div>
          <div ref={candlestickChartRef} style={{ flex: 1, minHeight: 0, overflow: 'auto' }}></div>
        </div>
      )}

      {expandedCard === 'pve' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'white', zIndex: 1000, display: 'flex', flexDirection: 'column', padding: '20px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', animation: 'fadeIn 0.15s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Price-Volume Explorer</h2>
            <button onClick={() => setExpandedCard(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>✕</button>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <PriceVolumeExplorer data={prices} height={window.innerHeight - 120} />
          </div>
        </div>
      )}

      {expandedCard === 'returns' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'white', zIndex: 1000, display: 'flex', flexDirection: 'column', padding: '20px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', animation: 'fadeIn 0.15s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Daily Returns</h2>
            <button onClick={() => setExpandedCard(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {['1D', '5D', '20D', '60D', '120D', '240D'].map(window => (
              <button
                key={window}
                onClick={() => setReturnsWindow(window)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: returnsWindow === window ? '2px solid var(--primary)' : '1px solid rgba(15,23,42,0.2)',
                  background: returnsWindow === window ? 'var(--primary)' : 'transparent',
                  color: returnsWindow === window ? 'white' : 'var(--text)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: returnsWindow === window ? '600' : '500',
                  transition: 'all 0.2s ease'
                }}
              >
                {window === '1D' ? 'DoD' : window === '5D' ? 'WoW' : window === '20D' ? 'MoM' : window === '60D' ? 'QoQ' : window === '120D' ? 'HyoHy' : 'YoY'}
              </button>
            ))}
          </div>
          <div ref={returnsChartRef} style={{ flex: 1, minHeight: 0, overflow: 'auto' }}></div>
        </div>
      )}

      {expandedCard === 'timeexplorer' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'white', zIndex: 1000, display: 'flex', flexDirection: 'column', padding: '20px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', animation: 'fadeIn 0.15s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Time Explorer</h2>
            <button onClick={() => setExpandedCard(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>✕</button>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <TimeExplorer prices={explorerPrices} height={window.innerHeight - 120} />
          </div>
        </div>
      )}

      {expandedCard === 'technical' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'white', zIndex: 1000, display: 'flex', flexDirection: 'column', padding: '20px', overflowY: 'auto', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', animation: 'fadeIn 0.15s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Technical Analysis</h2>
            <button onClick={() => setExpandedCard(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>✕</button>
          </div>
          <div className="mini-indicators">
            {prices && prices.length > 0 ? (
              (() => {
                const closes = prices.map(p => p.close);
                const sma20Series = smaSeries(closes, 20);
                const sma50Series = smaSeries(closes, 50);
                const sma200Series = smaSeries(closes, 200);
                
                return (
                  <>
                    <div style={{ marginBottom: 12 }}>
                      <SMACombined sma20={sma20Series || []} sma50={sma50Series || []} sma200={sma200Series || []} currentValue={closes[closes.length - 1]} />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <MiniIndicator name="RSI(14)" value={(rsiSeries(closes, 14).slice().reverse().find((v: any) => v !== null && v !== undefined) as number | null) ?? null} series={rsiSeries(closes, 14)} thresholds={{ low: 30, high: 70 }} />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <MiniIndicator name="MACD(hist)" value={(macdSeries(closes).slice().reverse().find((v: any) => v !== null && v !== undefined) as number | null) ?? null} series={macdSeries(closes)} histogram={true} />
                    </div>
                  </>
                );
              })()
            ) : (
              <div>No analysis available for this range.</div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.98);
          }
        }

        .expanded-card {
          animation: fadeIn 0.15s ease-out;
        }

        .expanded-card.closing {
          animation: fadeOut 0.15s ease-in forwards;
        }

        .asset-page {
          display: flex;
          flex-direction: column;
          /* reduce top padding so the page header sits closer to the top */
          padding: var(--spacing-4) 0;
          width: 100%;
          max-width: 100%;
          gap: var(--spacing-6);
          /* page background: white per user preference */
          background: #ffffff;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          /* slightly reduced top padding so the header isn't too far from the top of the page */
          padding: 20px 32px 8px 32px; /* top right bottom left */
          background: var(--bg-primary);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          margin-bottom: 0; /* control separation via grid margin */
        }
        .title-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.2;
          font-weight: 500;
        }
        .title {
          font-size: 28px;
          font-weight: 600;
          color: var(--text);
          margin: 0;
        }
        .range-selector {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .range-btn {
          background: transparent;
          border: 1px solid rgba(15,23,42,0.06);
          padding: 6px 8px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
        }
        .range-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        .cards-grid {
          position: relative;
          display: grid;
          /* Stable 2-column layout: columns are equal fractions of the available width
             so when the sidebar collapses the columns expand, and when it expands they compress. */
          grid-template-columns: repeat(2, 1fr);
          column-gap: 48px; /* bigger horizontal gap to clearly separate cards */
          row-gap: 36px;
          width: 100%;
          margin: 8px 0 0 0; /* comfortable small gap between header and cards (~20px total with header padding) */
          padding: 0 32px; /* ensure padding around grid so cards don't touch edges */
          box-sizing: border-box;
          background: transparent;
          align-items: start;
          align-content: start;
          /* create a new stacking context so lifted/z-indexed children don't overlap neighbors */
          isolation: isolate;
          grid-auto-rows: auto;
          min-height: 400px;
        }

        /* Mobile: single column */
        @media (max-width: 767px) {
          .cards-grid {
            grid-template-columns: 1fr;
            width: 100%;
            margin: 16px 0 0 0;
            padding: 0 16px;
          }
        }
        .chart-card {
          position: relative;
          /* cards: slightly darker grey (not too dark) to increase contrast */
          background: #f3f4f6; /* light grey */
          border: 1px solid rgba(15,23,42,0.08);
          border-radius: 12px;
          padding: 20px;
          /* stronger, always-visible shadow to delineate cards */
          box-shadow: var(--shadow-xl);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          /* Use min-height so cards can grow/shrink with layout; width drives layout */
          min-height: 280px;
          width: 100%;
          display: flex;
          flex-direction: column;
          z-index: 0;
          overflow: hidden;
          /* allow the card to shrink inside grid cells */
          min-width: 0;
          box-sizing: border-box;
        }
        .chart-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-xl);
          z-index: 20; /* lift hovered card above neighbors */
        }
        .chart-card:after {
          content: '';
          position: absolute;
          top: 0;
          left: 16px;
          right: 16px;
          height: 4px;
          background: var(--primary);
          border-radius: 2px;
        }
        .chart-area {
          width: 100%;
          /* let the chart area size naturally, but reserve a reasonable minimum */
          min-height: 260px; /* main chart area; timeline can sit below */
          height: auto;
          /* Prevent Plotly or other children from forcing intrinsic width beyond the card */
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
          box-sizing: border-box;
        }
        /* Force direct Plotly root containers to respect the chart-area bounds */
        .chart-area > div {
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box;
          overflow: hidden;
        }
        .placeholder-card {
          display: flex;
          flex-direction: column;
          /* put content in the top-left of the card */
          align-items: flex-start;
          justify-content: flex-start;
        }
        /* shared label style for all cards (same as Market Summary) */
        .card-label {
          color: var(--text);
          margin: 0 0 var(--spacing-4) 0;
          font-size: var(--font-size-lg);
          font-weight: 600;
        }
        .mini-indicators {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mini-indicator-row .mini-label div:first-child {
          color: var(--text);
        }
        .placeholder-content {
          color: var(--text-secondary);
          font-size: var(--font-size-base);
        }
        /* Different accent colors for each card */
        .chart-card:nth-child(1):after {
          background: var(--primary);
        }
        .chart-card:nth-child(2):after {
          background: var(--prophet-marketmind);
        }
        .chart-card:nth-child(3):after {
          background: var(--prophet-timesage);
        }
        .chart-card:nth-child(4):after {
          background: var(--prophet-quantum);
        }
      `}</style>
    </div>
  );
}