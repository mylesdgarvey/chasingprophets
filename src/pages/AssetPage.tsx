import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
// @ts-ignore
import Plotly from 'plotly.js-dist-min';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { getAsset, getAssetPrices } from '../services/assets';
import { PriceData } from '../types/price';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAssetData() {
      if (!ticker) return;

      try {
        const [assetData, priceData] = await Promise.all([
          getAsset(ticker),
          getAssetPrices(ticker)
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

        setPrices(priceData || []);
        setLoading(false);
      } catch (err: any) {
        setError(err?.message || 'Failed to load asset data');
        setLoading(false);
      }
    }

    loadAssetData();
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

  const returnData = useMemo(() => {
    if (prices.length < 2) return null;

    // Calculate daily returns
    const returns = prices.slice(1).map((price, i) => {
      const prev = prices[i];
      return {
        date: price.date,
        openReturn: ((price.open - prev.open) / prev.open) * 100,
        closeReturn: ((price.close - prev.close) / prev.close) * 100,
        highReturn: ((price.high - prev.high) / prev.high) * 100,
        lowReturn: ((price.low - prev.low) / prev.low) * 100
      };
    });

    return [
      {
        x: returns.map(r => r.date),
        y: returns.map(r => r.openReturn),
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'Open-to-Open'
      },
      {
        x: returns.map(r => r.date),
        y: returns.map(r => r.closeReturn),
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'Close-to-Close'
      },
      {
        x: returns.map(r => r.date),
        y: returns.map(r => r.highReturn),
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'High-to-High'
      },
      {
        x: returns.map(r => r.date),
        y: returns.map(r => r.lowReturn),
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'Low-to-Low'
      }
    ];
  }, [prices]);

  const candlestickChartRef = useRef<HTMLDivElement>(null);
  const returnsChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!candlestickData || !returnData) return;
    if (!candlestickChartRef.current || !returnsChartRef.current) return;

    // Plot candlestick chart
    const candlestickLayout = {
      title: { text: `${ticker} Price History` },
      height: 500,
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

    // Plot returns chart
    const returnLayout = {
      title: { text: 'Daily Returns (%)' },
      height: 400,
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

    // Create the plots
    Promise.all([
      candlestickChartRef.current ? Plotly.newPlot(candlestickChartRef.current, candlestickData, candlestickLayout) : null,
      returnsChartRef.current ? Plotly.newPlot(returnsChartRef.current, returnData, returnLayout) : null
    ].filter((p): p is Promise<any> => p !== null)).catch(console.error);

    // Cleanup function
    return () => {
      if (candlestickChartRef.current) {
        Plotly.purge(candlestickChartRef.current);
      }
      if (returnsChartRef.current) {
        Plotly.purge(returnsChartRef.current);
      }
    };
  }, [candlestickData, returnData, ticker]);

  // Ensure Plotly charts resize when their container size changes (e.g. sidebar toggles)
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

  if (error) {
    return <div className="error-message">{error}</div>;
  }

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
          {/* Placeholder for TimeWindow/Scale controls if needed in future */}
        </div>
      </header>

      <div className="cards-grid">
        <ErrorBoundary>
          <div className="chart-card">
            <div ref={candlestickChartRef} className="chart-area"></div>
          </div>
        </ErrorBoundary>

        <div className="chart-card placeholder-card">
          <h3>Market Summary</h3>
          <div className="placeholder-content">Coming Soon</div>
        </div>

        <ErrorBoundary>
          <div className="chart-card">
            <div ref={returnsChartRef} className="chart-area"></div>
          </div>
        </ErrorBoundary>

        <div className="chart-card placeholder-card">
          <h3>Technical Analysis</h3>
          <div className="placeholder-content">Coming Soon</div>
        </div>
      </div>

      <style>{`
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
        .cards-grid {
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
          align-items: center;
          justify-content: center;
        }
        .placeholder-card h3 {
          color: var(--text);
          margin: 0 0 var(--spacing-4) 0;
          font-size: var(--font-size-lg);
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