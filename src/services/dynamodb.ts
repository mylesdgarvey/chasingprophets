import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  QueryCommand, 
  ScanCommand 
} from "@aws-sdk/lib-dynamodb";
import { TABLES, AssetMeta } from '../types/assets.ts';

// Initialize DynamoDB client with proper error handling
const client = new DynamoDBClient({
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || ''
  }
});

export const ddbDocClient = DynamoDBDocumentClient.from(client);

// Use the AssetMeta interface from types/assets.ts for consistency
export interface DynamoAsset extends AssetMeta {
  lastUpdated: string;
}

export async function getAssetBySymbol(symbol: string, market: string): Promise<DynamoAsset | null> {
  const command = new GetCommand({
    TableName: TABLES.ASSETS,
    Key: { symbol, market }
  });

  try {
    const response = await ddbDocClient.send(command);
    return response.Item as DynamoAsset || null;
  } catch (error) {
    console.error('Error fetching asset:', error);
    throw error;
  }
}

export async function getAssetsByMarket(market: string): Promise<DynamoAsset[]> {
  const command = new QueryCommand({
    TableName: TABLES.ASSETS,
    IndexName: "MarketLastUpdatedIndex",
    KeyConditionExpression: "market = :market",
    ExpressionAttributeValues: {
      ":market": market
    }
  });

  try {
    const response = await ddbDocClient.send(command);
    return (response.Items || []) as DynamoAsset[];
  } catch (error) {
    console.error('Error fetching assets by market:', error);
    throw error;
  }
}

export async function updateAssetPrice(
  symbol: string, 
  market: string, 
  lastPrice: number
): Promise<void> {
  const command = new PutCommand({
    TableName: TABLES.ASSETS,
    Item: {
      ticker: symbol,
      market,
      lastPrice,
      lastUpdated: new Date().toISOString()
    }
  });

  try {
    await ddbDocClient.send(command);
  } catch (error) {
    console.error('Error updating asset price:', error);
    throw error;
  }
}

export async function getAllAssets(limit = 50): Promise<DynamoAsset[]> {
  const command = new ScanCommand({
    TableName: TABLES.ASSETS,
    Limit: limit
  });

  try {
    const response = await ddbDocClient.send(command);
    return (response.Items || []) as DynamoAsset[];
  } catch (error) {
    console.error('Error fetching all assets:', error);
    throw error;
  }
}