import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand,
  QueryCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb';
import { TABLES, RawPricesData, RawAssetData, AssetMeta, AssetSearchResult } from '../types/assets';
import { PriceData } from '../types/price';

let ddb: DynamoDBDocumentClient | null = null;
let useLocalFallback = false;

try {
  const accessKey = import.meta.env.VITE_AWS_ACCESS_KEY_ID || '';
  const secretKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '';

  if (!accessKey || !secretKey) {
    console.warn('AWS credentials not provided in env; using local data fallback');
    useLocalFallback = true;
  } else {
    const client = new DynamoDBClient({
      region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey
      }
    });
    ddb = DynamoDBDocumentClient.from(client);
  }
} catch (err) {
  console.warn('Failed to initialize DynamoDB client, falling back to local data', err);
  useLocalFallback = true;
}

function normalizeAssetResponse(
  data: RawAssetData | null,
  ticker: string
): AssetMeta | null {
  if (!data?.prices?.length) return null;
  const last = data.prices[data.prices.length - 1];
  const prev = data.prices[data.prices.length - 2];
  const lastPrice = last?.close ?? null;
  const priceChange = last && prev ? ((last.close - prev.close) / prev.close) * 100 : 0;
  return {
    ticker,
    name: data.metadata.name,
    market: data.metadata.market || 'Unknown',
    lastPrice,
    priceChange
  };
}

// Asset type used in responses
type AssetResponse = AssetMeta;

export async function getAsset(ticker: string): Promise<AssetResponse | null> {
  if (useLocalFallback) {
    type RawGeneratedData = Record<string, {
      metadata: { ticker: string; name: string; market?: string };
      prices: Array<{
        date: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
      }>;
    }>;
    const data = (await import('../data/generatedPrices.json')).default as RawGeneratedData;
    return normalizeAssetResponse(data[ticker] || null, ticker);
  }

  const command = new GetCommand({
    TableName: TABLES.ASSETS,
    Key: { ticker }
  });

  try {
    if (!ddb) throw new Error('DynamoDB client not initialized');
    const response = await ddb.send(command);
    return response.Item as AssetResponse || null;
  } catch (error) {
    console.error('Error fetching asset:', error);
    throw error;
  }
}

export async function getAllAssets(): Promise<AssetResponse[]> {
  if (useLocalFallback) {
    const data = (await import('../data/generatedPrices.json')).default as Record<string, {
      metadata: { ticker: string; name: string; market?: string };
      prices: Array<{
        date: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
      }>;
    }>;
    return Object.entries(data)
      .map(([ticker, asset]) => normalizeAssetResponse(asset, ticker))
      .filter((asset): asset is AssetMeta => asset !== null);
  }

  const command = new ScanCommand({ TableName: TABLES.ASSETS });
  try {
    if (!ddb) throw new Error('DynamoDB client not initialized');
    const response = await ddb.send(command);
    return (response.Items || []) as AssetResponse[];
  } catch (error) {
    console.error('Error fetching all assets:', error);
    throw error;
  }
}

// Simple in-memory search over asset list. Designed to be async so it can be swapped
// with a backend search endpoint later. Returns up to `limit` results.
export async function searchAssets(query: string, limit = 10): Promise<AssetSearchResult[]> {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];

  const assets = await getAllAssets();

  // Only show exact matches or prefix matches for ticker/name
  const scored = assets.map((a: AssetMeta) => {
    const ticker = (a.ticker || '').toLowerCase();
    const name = (a.name || '').toLowerCase();
    let score = 0;
    if (ticker === q) score = 100;  // Exact ticker match
    else if (ticker.startsWith(q)) score = 90;  // Ticker prefix match
    else if (name.startsWith(q)) score = 80;  // Name prefix match
    return { asset: a, score };
  }).filter(x => x.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => ({
    ticker: s.asset.ticker,
    name: s.asset.name,
    market: s.asset.market,
    lastPrice: s.asset.lastPrice === null ? undefined : s.asset.lastPrice,
    type: 'Asset' as const
  }));
}

export async function getAssetsByMarket(market: string): Promise<AssetResponse[]> {
  if (useLocalFallback) {
    const data = (await import('../data/generatedPrices.json')).default as RawPricesData;
    return Object.entries(data)
      .filter(([_, asset]: [string, RawAssetData]) => asset.metadata.market === market)
      .map(([ticker, asset]: [string, RawAssetData]) => ({
        ticker,
        name: asset.metadata.name,
        market: asset.metadata.market
      }));
  }

  const command = new QueryCommand({
    TableName: TABLES.ASSETS,
    IndexName: 'MarketIndex',
    KeyConditionExpression: 'market = :market',
    ExpressionAttributeValues: { ':market': market }
  });

  try {
    if (!ddb) throw new Error('DynamoDB client not initialized');
    const response = await ddb.send(command);
    return (response.Items || []) as AssetResponse[];
  } catch (error) {
    console.error('Error fetching assets by market:', error);
    throw error;
  }
}

export async function getAssetPrices(
  ticker: string,
  startDate?: string,
  endDate?: string
): Promise<PriceData[]> {
  if (useLocalFallback) {
    type RawPrice = {
      date: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    };

    const data = (await import('../data/generatedPrices.json')).default as RawPricesData;
    const asset = data[ticker];
    if (!asset) return [];
    let prices = asset.prices.map((p: RawPrice) => ({
      ...p,
      ticker  // Add the ticker field to each price entry
    }));
    if (startDate) prices = prices.filter((p: PriceData) => p.date >= startDate);
    if (endDate) prices = prices.filter((p: PriceData) => p.date <= endDate);
    return prices as PriceData[];
  }

  const command = new QueryCommand({
    TableName: TABLES.ASSET_PRICES,
    KeyConditionExpression: startDate && endDate ? 'ticker = :t AND #date BETWEEN :start AND :end' : 'ticker = :t',
    ExpressionAttributeValues: {
      ':t': ticker,
      ...(startDate && { ':start': startDate }),
      ...(endDate && { ':end': endDate })
    },
    ...(startDate && endDate && { ExpressionAttributeNames: { '#date': 'date' } }),
    ScanIndexForward: true
  });

  try {
    if (!ddb) throw new Error('DynamoDB client not initialized');
    const response = await ddb.send(command);
    return (response.Items || []) as PriceData[];
  } catch (error) {
    console.error('Error fetching asset prices:', error);
    throw error;
  }
}