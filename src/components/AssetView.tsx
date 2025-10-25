import { useEffect, useState } from 'react';
import { getAsset, getAssetPrices } from '../services/assets';
import { PriceData } from '../types/price';
import { Data } from 'plotly.js';
import StockChart from './chart/StockChart';
import { ProphetControls } from './ProphetControls';
import './AssetView.css';

// Technical indicators
const calculateRSI = (prices: number[], periods = 14) => {
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i < periods + 1; i++) {
    const difference = prices[i] - prices[i - 1];
    if (difference >= 0) {
      gains += difference;
    } else {
      losses -= difference;
    }
  }
  
  const avgGain = gains / periods;
  const avgLoss = losses / periods;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

const calculateVolatility = (prices: number[], mean: number) => {
  const squaredDiffs = prices.map(price => Math.pow(price - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b) / prices.length;
  return Math.sqrt(variance);
};

interface AssetViewProps {
  ticker: string;
}

interface AssetData {
  name: string;
  description?: string;
  marketCap?: number;
  peRatio?: number;
  volume?: number;
  weekRange?: {
    low: number;
    high: number;
  };
}

export default function AssetView({ ticker }: AssetViewProps) {
  const [asset, setAsset] = useState<AssetData | null>(null);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState('1M');
  const [scale, setScale] = useState('Auto');
  const [expandedControls, setExpandedControls] = useState(false);

  useEffect(() => {
    async function loadAssetData() {
      try {
        setLoading(true);
        const [assetData, prices] = await Promise.all([
          getAsset(ticker),
          getAssetPrices(ticker)
        ]);
        setAsset(assetData as AssetData);
        setPriceData(prices);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load asset data');
      } finally {
        setLoading(false);
      }
    }

    loadAssetData();
  }, [ticker]);

  if (loading) return <div className="loading-state">Loading...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;
  if (!asset) return <div className="not-found-state">Asset not found</div>;

  const currentPrice = priceData[priceData.length - 1]?.close;
  const previousPrice = priceData[priceData.length - 2]?.close;
  const priceChange = currentPrice && previousPrice 
    ? currentPrice - previousPrice 
    : null;
  const percentChange = currentPrice && previousPrice 
    ? ((currentPrice / previousPrice - 1) * 100)
    : null;

  // Transform price data for StockChart
  const chartData: Data[] = [{
    x: priceData.map(p => p.date),
    y: priceData.map(p => p.close),
    type: 'scatter',
    mode: 'lines',
    name: 'Price',
    line: { color: 'var(--accent-color)' }
  }];

  return (
    <div className="asset-view">
      <div className="asset-header">
        <div className="title-section">
          <h1>{asset.name}</h1>
          <div className="ticker">{ticker}</div>
          {asset.description && <p className="description">{asset.description}</p>}
        </div>
        
        <div className="price-section">
          <div className="current-price">
            ${currentPrice?.toFixed(2)}
          </div>
          <div className={`price-change ${priceChange && priceChange >= 0 ? 'positive' : 'negative'}`}>
            {priceChange !== null && (
              <>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}
                &nbsp;({percentChange !== null && (percentChange >= 0 ? '+' : '')}{percentChange?.toFixed(2)}%)
              </>
            )}
          </div>
        </div>
      </div>

      <div className="market-metrics">
        <div className="metric-card">
          <span className="metric-label">Market Cap</span>
          <span className="metric-value">
            {asset.marketCap 
              ? `$${(asset.marketCap / 1e9).toFixed(2)}B`
              : 'N/A'}
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Volume</span>
          <span className="metric-value">
            {asset.volume 
              ? `${(asset.volume / 1e6).toFixed(1)}M`
              : 'N/A'}
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">P/E Ratio</span>
          <span className="metric-value">
            {asset.peRatio?.toFixed(2) || 'N/A'}
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">52W Range</span>
          <span className="metric-value">
            {asset.weekRange 
              ? `$${asset.weekRange.low.toFixed(2)} - $${asset.weekRange.high.toFixed(2)}`
              : 'N/A'}
          </span>
        </div>
      </div>

      <div className="chart-section">
        <StockChart 
          data={chartData} 
          scaleType={scale === 'Log' ? 'log' : 'linear'} 
        />
        <ProphetControls 
          timeWindow={timeWindow}
          setTimeWindow={setTimeWindow}
          scale={scale}
          setScale={setScale}
          expanded={expandedControls}
          onToggle={() => setExpandedControls(!expandedControls)}
        />
      </div>

      <div className="market-analysis">
        <div className="analysis-card">
          <h3>Technical Indicators</h3>
          <div className="indicator-grid">
            <div className="indicator">
              <span className="indicator-label">RSI (14)</span>
              <span className="indicator-value">65.4</span>
            </div>
            <div className="indicator">
              <span className="indicator-label">MACD</span>
              <span className="indicator-value positive">+2.45</span>
            </div>
            <div className="indicator">
              <span className="indicator-label">Stochastic</span>
              <span className="indicator-value">78.2</span>
            </div>
          </div>
        </div>

        <div className="analysis-card">
          <h3>Volume Profile</h3>
          <div className="indicator-grid">
            <div className="indicator">
              <span className="indicator-label">Avg Volume (10d)</span>
              <span className="indicator-value">42.3M</span>
            </div>
            <div className="indicator">
              <span className="indicator-label">Volume Today</span>
              <span className="indicator-value">38.9M</span>
            </div>
            <div className="indicator">
              <span className="indicator-label">Vol/Avg Ratio</span>
              <span className="indicator-value">0.92</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}