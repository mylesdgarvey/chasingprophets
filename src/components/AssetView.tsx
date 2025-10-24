import React, { useEffect, useState } from 'react';
type DisplayAsset = { name: string; description?: string };
import { getAsset, getAssetPrices } from '../services/assets';
import { PriceData } from '../types/price';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

interface AssetViewProps {
  ticker: string;
}

export default function AssetView({ ticker }: AssetViewProps) {
  const [asset, setAsset] = useState<DisplayAsset | null>(null);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAssetData() {
      try {
        setLoading(true);
        const [assetData, prices] = await Promise.all([
          getAsset(ticker),
          getAssetPrices(ticker)
        ]);
        setAsset(assetData);
        setPriceData(prices);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load asset data');
      } finally {
        setLoading(false);
      }
    }

    loadAssetData();
  }, [ticker]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!asset) return <div>Asset not found</div>;

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">{asset.name} ({ticker})</h2>
        <p className="text-gray-600">{asset.description}</p>
      </div>

      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={priceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => new Date(date).toLocaleDateString()} 
            />
            <YAxis domain={['auto', 'auto']} />
            <Tooltip 
              labelFormatter={(date) => new Date(date).toLocaleDateString()}
              formatter={(value) => ['$' + Number(value).toFixed(2)]}
            />
            <Line 
              type="monotone" 
              dataKey="close" 
              stroke="#8884d8" 
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}