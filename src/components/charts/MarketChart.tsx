import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { getAssetPrices } from '../../services/assets';
import { PriceData } from '../../types/price';

interface MarketChartProps {
  assets: any[];
  selectedProphets: string[];
  timeWindow: string;
  scaleType: string;
  colors: { [key: string]: string };
}

export const MarketChart: React.FC<MarketChartProps> = ({ 
  assets, 
  selectedProphets, 
  timeWindow,
  scaleType,
  colors 
}) => {
  const [priceData, setPriceData] = useState<{ [ticker: string]: PriceData[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPriceData() {
      try {
        const startDate = new Date();
        const days = timeWindow === '1M' ? 30 : 
                    timeWindow === '3M' ? 90 : 
                    timeWindow === '6M' ? 180 : 
                    timeWindow === '1Y' ? 365 : 30;
        startDate.setDate(startDate.getDate() - days);
        
        const pricePromises = assets.map(asset => 
          getAssetPrices(
            asset.ticker, 
            startDate.toISOString(), 
            new Date().toISOString()
          )
        );

        const results = await Promise.all(pricePromises);
        const priceMap = results.reduce((acc, prices, index) => {
          acc[assets[index].ticker] = prices;
          return acc;
        }, {} as { [ticker: string]: PriceData[] });

        setPriceData(priceMap);
      } catch (error) {
        console.error('Error loading price data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (assets.length > 0) {
      loadPriceData();
    }
  }, [assets, timeWindow]);

  if (loading) return <div>Loading chart data...</div>;
  if (assets.length === 0) return <div>No assets to display</div>;

  // Create a merged dataset for the chart
  const chartData = Object.entries(priceData).reduce((acc, [ticker, prices]) => {
    prices.forEach(price => {
      const date = new Date(price.date).toISOString().split('T')[0];
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing[ticker] = price.close;
      } else {
        acc.push({ date, [ticker]: price.close });
      }
    });
    return acc;
  }, [] as any[]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <YAxis 
            scale={scaleType.toLowerCase() === 'log' ? 'log' : 'auto'}
            domain={['dataMin', 'dataMax']}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          <Tooltip
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
          />
          <Legend />
          {selectedProphets.map((prophet) => (
            assets.map((asset, index) => (
              <Line
                key={`${prophet}-${asset.ticker}`}
                type="monotone"
                dataKey={asset.ticker}
                stroke={colors[prophet]}
                name={`${prophet} - ${asset.name} (${asset.ticker})`}
                dot={false}
                connectNulls
                strokeDasharray={index > 0 ? "5 5" : undefined}
              />
            ))
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};