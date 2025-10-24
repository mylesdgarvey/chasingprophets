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

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="asset-page">
      <header className="page-header">
        <h1 className="title">{asset?.ticker || asset?.name}</h1>
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
          padding: var(--spacing-6);
          width: 100%;
          max-width: 100%;
          gap: var(--spacing-6);
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-6);
          background: var(--bg-primary);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          margin-bottom: var(--spacing-4);
        }
        .title {
          font-size: 28px;
          font-weight: 600;
          color: var(--text);
          margin: 0;
        }
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--spacing-8);
          padding: var(--spacing-6);
          max-width: 1400px;
          margin: 0 auto;
        }
        .chart-card {
          position: relative;
          background: var(--bg-primary);
          border-radius: var(--radius-lg);
          padding: var(--spacing-8);
          box-shadow: rgba(0, 0, 0, 0.1) 0px 1px 3px, rgba(0, 0, 0, 0.05) 0px 8px 24px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          height: 360px;
          width: 100%;
        }
        .chart-card:hover {
          transform: translateY(-2px);
          box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 4px, rgba(0, 0, 0, 0.1) 0px 12px 32px;
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
          height: 100%;
          width: 100%;
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