import { BasePriceData } from './price';

// Raw asset data from JSON file
export type AssetMetadata = {
  ticker: string;
  name: string;
  market?: string;
};

export type RawAssetData = {
  metadata: AssetMetadata;
  prices: Array<BasePriceData>;
};

export type RawPricesData = Record<string, RawAssetData>;

// Runtime asset types
export type AssetMeta = {
  ticker: string;
  name: string;
  market?: string;
  lastPrice?: number | null;
  priceChange?: number;
};

export type AssetSearchResult = {
  ticker: string;
  name: string;
  market?: string;
  lastPrice?: number;
  type?: 'Asset';
};

// DynamoDB Table Names
export const TABLES = {
  ASSETS: 'ChasingProphets-Assets',
  ASSET_PRICES: 'ChasingProphets-AssetPrices',
  DATASETS: 'ChasingProphets-Datasets',
  DATA_SLICES: 'ChasingProphets-DataSlices',
  MODEL_SCAFFOLDS: 'ChasingProphets-ModelScaffolds',
  MODEL_FITS: 'ChasingProphets-ModelFits',
  PROPHETS: 'ChasingProphets-Prophets',
  FORECASTS: 'ChasingProphets-Forecasts',
  PERFORMANCE: 'ChasingProphets-Performance',
  PROPHET_PERFORMANCE_SUMMARY: 'ChasingProphets-ProphetPerformanceSummary',
  NOTIFICATIONS: 'ChasingProphets-Notifications'
} as const;