/**
 * Forecast Service
 * Handles CRUD operations for forecasts in DynamoDB
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb';
import { TABLES } from '../types/assets';
import type { Forecast, CreateForecastInput } from '../types/forecast';

// Shared DynamoDB client
let ddb: DynamoDBDocumentClient | null = null;

try {
  const client = new DynamoDBClient({
    region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || ''
    }
  });
  ddb = DynamoDBDocumentClient.from(client);
} catch (err) {
  console.warn('Failed to initialize DynamoDB client for ForecastService', err);
}

/**
 * Get a forecast by ID and start date
 */
export async function getForecast(forecastId: string, startDate: string): Promise<Forecast | null> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new GetCommand({
    TableName: TABLES.FORECASTS,
    Key: { forecastId, startDate }
  });

  try {
    const response = await ddb.send(command);
    return (response.Item as Forecast) || null;
  } catch (error) {
    console.error('Error fetching forecast:', error);
    throw error;
  }
}

/**
 * Get all forecasts for a prophet
 */
export async function getForecastsByProphet(prophetId: string): Promise<Forecast[]> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new QueryCommand({
    TableName: TABLES.FORECASTS,
    IndexName: 'ProphetIndex',
    KeyConditionExpression: 'prophetId = :prophetId',
    ExpressionAttributeValues: { ':prophetId': prophetId }
  });

  try {
    const response = await ddb.send(command);
    return (response.Items || []) as Forecast[];
  } catch (error) {
    console.error('Error fetching forecasts by prophet:', error);
    throw error;
  }
}

/**
 * Get latest forecast for a prophet
 */
export async function getLatestForecast(prophetId: string): Promise<Forecast | null> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new QueryCommand({
    TableName: TABLES.FORECASTS,
    IndexName: 'ProphetIndex',
    KeyConditionExpression: 'prophetId = :prophetId',
    ExpressionAttributeValues: { ':prophetId': prophetId },
    ScanIndexForward: false,  // Descending order
    Limit: 1
  });

  try {
    const response = await ddb.send(command);
    return (response.Items && response.Items[0] as Forecast) || null;
  } catch (error) {
    console.error('Error fetching latest forecast:', error);
    throw error;
  }
}

/**
 * Create a new forecast
 */
export async function createForecast(input: CreateForecastInput): Promise<Forecast> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const forecast: Forecast = {
    ...input,
    createdAt: new Date().toISOString()
  };

  const command = new PutCommand({
    TableName: TABLES.FORECASTS,
    Item: forecast
  });

  try {
    await ddb.send(command);
    return forecast;
  } catch (error) {
    console.error('Error creating forecast:', error);
    throw error;
  }
}

/**
 * Delete a forecast
 */
export async function deleteForecast(forecastId: string, startDate: string): Promise<void> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new DeleteCommand({
    TableName: TABLES.FORECASTS,
    Key: { forecastId, startDate }
  });

  try {
    await ddb.send(command);
  } catch (error) {
    console.error('Error deleting forecast:', error);
    throw error;
  }
}
