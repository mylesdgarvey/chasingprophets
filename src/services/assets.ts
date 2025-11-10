import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand,
  QueryCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb';
import { TABLES, AssetMeta, AssetSearchResult } from '../types/assets';
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

// Asset type used in responses
type AssetResponse = AssetMeta;

export async function getAsset(ticker: string): Promise<AssetResponse | null> {
  if (useLocalFallback) {
    console.warn('AWS credentials not available, cannot fetch assets');
    return null;
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
    console.warn('AWS credentials not available, cannot fetch assets');
    return [];
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
    console.warn('AWS credentials not available, cannot fetch assets');
    return [];
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
    console.error('Error fetching asset prices from S3:', error);
    throw error;
  }
}

/**
 * Create a new asset
 */
export async function createAsset(input: {
  ticker: string;
  name: string;
  market?: string;
  type?: string;
  sector?: string;
  currency?: string;
}): Promise<AssetMeta> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const asset: AssetMeta = {
    ticker: input.ticker,
    name: input.name,
    market: input.market,
    lastPrice: null
  };

  const { PutCommand } = await import('@aws-sdk/lib-dynamodb');
  const command = new PutCommand({
    TableName: TABLES.ASSETS,
    Item: asset,
    ConditionExpression: 'attribute_not_exists(ticker)'
  });

  try {
    await ddb.send(command);
    return asset;
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      throw new Error(`Asset with ticker ${input.ticker} already exists`);
    }
    throw error;
  }
}

/**
 * Update an existing asset
 */
export async function updateAsset(ticker: string, updates: Partial<AssetMeta>): Promise<AssetMeta> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  // Get existing asset
  const existing = await getAsset(ticker);
  if (!existing) {
    throw new Error(`Asset ${ticker} not found`);
  }

  const updated: AssetMeta = {
    ...existing,
    ...updates,
    ticker // Ensure ticker cannot be changed
  };

  const { PutCommand } = await import('@aws-sdk/lib-dynamodb');
  const command = new PutCommand({
    TableName: TABLES.ASSETS,
    Item: updated
  });

  await ddb.send(command);
  return updated;
}

/**
 * Delete an asset
 */
export async function deleteAsset(ticker: string): Promise<void> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const { DeleteCommand } = await import('@aws-sdk/lib-dynamodb');
  const command = new DeleteCommand({
    TableName: TABLES.ASSETS,
    Key: { ticker }
  });

  await ddb.send(command);
}

export async function getAssetPrices(
  ticker: string,
  startDate?: string,
  endDate?: string
): Promise<PriceData[]> {
  if (useLocalFallback) {
    console.warn('AWS credentials not available, cannot fetch prices');
    return [];
  }

  try {
    if (!ddb) throw new Error('DynamoDB client not initialized');
    
    // Map Yahoo Finance tickers to our asset IDs
    const tickerToAssetId: Record<string, string> = {
      '^DJI': 'DJIA',
      '^GSPC': 'SPX',
      'DJIA': 'DJIA',
      'SPX': 'SPX'
    };
    
    const assetId = tickerToAssetId[ticker] || ticker;
    
    // Step 1: Find the dataset for this ticker using scan (AssetIndex may not exist)
    const datasetCommand = new ScanCommand({
      TableName: TABLES.DATASETS,
      FilterExpression: 'assetId = :assetId',
      ExpressionAttributeValues: { ':assetId': assetId }
    });
    
    const datasetResponse = await ddb.send(datasetCommand);
    const dataset = datasetResponse.Items?.[0];
    
    if (!dataset?.source) {
      console.warn(`No dataset found for ticker ${ticker} (mapped to ${assetId})`);
      
      // Debug: List all datasets to see what's available
      const allDatasetsCommand = new ScanCommand({
        TableName: TABLES.DATASETS,
        ProjectionExpression: 'datasetId, assetId, #n',
        ExpressionAttributeNames: { '#n': 'name' },
        Limit: 10
      });
      const allDatasetsResponse = await ddb.send(allDatasetsCommand);
      console.log('Available datasets:', allDatasetsResponse.Items);
      
      return [];
    }
    
    // Step 2: Fetch CSV from S3
    const s3Path = dataset.source as string;
    if (!s3Path.startsWith('s3://')) {
      console.error(`Invalid S3 path: ${s3Path}`);
      return [];
    }
    
    // Parse S3 path: s3://bucket/key
    const pathParts = s3Path.replace('s3://', '').split('/');
    const bucket = pathParts[0];
    const key = pathParts.slice(1).join('/');
    
    // Fetch CSV from S3
    const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
    const s3Client = new S3Client({
      region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || ''
      }
    });
    
    const getObjectCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
    const s3Response = await s3Client.send(getObjectCommand);
    
    if (!s3Response.Body) {
      console.error('No data in S3 response');
      return [];
    }
    
    // Convert stream to string
    const csvText = await s3Response.Body.transformToString();
    
    // Parse CSV (simple parser - assumes headers on first line)
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    
    let prices: PriceData[] = lines.slice(1).map(line => {
      const values = line.split(',');
      const row: Record<string, string> = {};
      headers.forEach((header, i) => {
        row[header.trim()] = values[i]?.trim() || '';
      });
      
      return {
        ticker,
        date: row.date,
        open: parseFloat(row.open),
        high: parseFloat(row.high),
        low: parseFloat(row.low),
        close: parseFloat(row.close),
        volume: parseInt(row.volume)
      };
    });
    
    // Apply date filters if provided
    if (startDate) prices = prices.filter(p => p.date >= startDate);
    if (endDate) prices = prices.filter(p => p.date <= endDate);
    
    return prices;
    
  } catch (error) {
    console.error('Error fetching asset prices from S3:', error);
    throw error;
  }
}