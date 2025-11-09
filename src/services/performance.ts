/**
 * Performance Service
 * Handles CRUD operations for performance metrics and summaries in DynamoDB
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  BatchWriteCommand,
  DeleteCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb';
import { TABLES } from '../types/assets';
import type {
  Performance,
  CreatePerformanceInput,
  ProphetPerformanceSummary,
  CreatePerformanceSummaryInput
} from '../types/performance';

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
  console.warn('Failed to initialize DynamoDB client for PerformanceService', err);
}

// ========== Performance (Daily) Operations ==========

/**
 * Get performance for a specific prophet and date
 */
export async function getPerformance(prophetId: string, date: string): Promise<Performance | null> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new GetCommand({
    TableName: TABLES.PERFORMANCE,
    Key: { prophetId, date }
  });

  try {
    const response = await ddb.send(command);
    return (response.Item as Performance) || null;
  } catch (error) {
    console.error('Error fetching performance:', error);
    throw error;
  }
}

/**
 * Get all performance records for a prophet
 */
export async function getPerformanceByProphet(
  prophetId: string,
  startDate?: string,
  endDate?: string
): Promise<Performance[]> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new QueryCommand({
    TableName: TABLES.PERFORMANCE,
    KeyConditionExpression: startDate && endDate
      ? 'prophetId = :prophetId AND #date BETWEEN :start AND :end'
      : 'prophetId = :prophetId',
    ExpressionAttributeValues: {
      ':prophetId': prophetId,
      ...(startDate && { ':start': startDate }),
      ...(endDate && { ':end': endDate })
    },
    ...(startDate && endDate && { ExpressionAttributeNames: { '#date': 'date' } }),
    ScanIndexForward: true  // Ascending by date
  });

  try {
    const response = await ddb.send(command);
    return (response.Items || []) as Performance[];
  } catch (error) {
    console.error('Error fetching performance by prophet:', error);
    throw error;
  }
}

/**
 * Create a new performance record
 */
export async function createPerformance(input: CreatePerformanceInput): Promise<Performance> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const performance: Performance = {
    ...input,
    createdAt: new Date().toISOString()
  };

  const command = new PutCommand({
    TableName: TABLES.PERFORMANCE,
    Item: performance
  });

  try {
    await ddb.send(command);
    return performance;
  } catch (error) {
    console.error('Error creating performance:', error);
    throw error;
  }
}

/**
 * Batch create performance records
 */
export async function batchCreatePerformance(records: CreatePerformanceInput[]): Promise<void> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const items = records.map(input => ({
    ...input,
    createdAt: new Date().toISOString()
  }));

  // DynamoDB batch write limit is 25 items
  const BATCH_SIZE = 25;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const command = new BatchWriteCommand({
      RequestItems: {
        [TABLES.PERFORMANCE]: batch.map(item => ({
          PutRequest: { Item: item }
        }))
      }
    });

    try {
      await ddb.send(command);
    } catch (error) {
      console.error('Error batch creating performance records:', error);
      throw error;
    }
  }
}

/**
 * Delete a performance record
 */
export async function deletePerformance(prophetId: string, date: string): Promise<void> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new DeleteCommand({
    TableName: TABLES.PERFORMANCE,
    Key: { prophetId, date }
  });

  try {
    await ddb.send(command);
  } catch (error) {
    console.error('Error deleting performance:', error);
    throw error;
  }
}

// ========== Performance Summary Operations ==========

/**
 * Get performance summary for a prophet and aggregation window
 */
export async function getPerformanceSummary(
  prophetId: string,
  aggregationWindow: string
): Promise<ProphetPerformanceSummary | null> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new GetCommand({
    TableName: TABLES.PROPHET_PERFORMANCE_SUMMARY,
    Key: { prophetId, aggregationWindow }
  });

  try {
    const response = await ddb.send(command);
    return (response.Item as ProphetPerformanceSummary) || null;
  } catch (error) {
    console.error('Error fetching performance summary:', error);
    throw error;
  }
}

/**
 * Get all performance summaries for a prophet
 */
export async function getPerformanceSummariesByProphet(prophetId: string): Promise<ProphetPerformanceSummary[]> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new QueryCommand({
    TableName: TABLES.PROPHET_PERFORMANCE_SUMMARY,
    KeyConditionExpression: 'prophetId = :prophetId',
    ExpressionAttributeValues: { ':prophetId': prophetId }
  });

  try {
    const response = await ddb.send(command);
    return (response.Items || []) as ProphetPerformanceSummary[];
  } catch (error) {
    console.error('Error fetching performance summaries:', error);
    throw error;
  }
}

/**
 * Get all performance summaries across all prophets
 * Used for leaderboard display
 */
export async function getAllPerformanceSummaries(
  aggregationWindow: string = '20-day'
): Promise<ProphetPerformanceSummary[]> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new ScanCommand({
    TableName: TABLES.PROPHET_PERFORMANCE_SUMMARY,
    FilterExpression: 'aggregationWindow = :window',
    ExpressionAttributeValues: {
      ':window': aggregationWindow
    }
  });

  try {
    const response = await ddb.send(command);
    return (response.Items || []) as ProphetPerformanceSummary[];
  } catch (error) {
    console.error('Error scanning performance summaries:', error);
    throw error;
  }
}

/**
 * Create or update a performance summary
 */
export async function upsertPerformanceSummary(input: CreatePerformanceSummaryInput): Promise<ProphetPerformanceSummary> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const summary: ProphetPerformanceSummary = {
    ...input,
    lastUpdated: new Date().toISOString()
  };

  const command = new PutCommand({
    TableName: TABLES.PROPHET_PERFORMANCE_SUMMARY,
    Item: summary
  });

  try {
    await ddb.send(command);
    return summary;
  } catch (error) {
    console.error('Error upserting performance summary:', error);
    throw error;
  }
}

/**
 * Delete a performance summary
 */
export async function deletePerformanceSummary(prophetId: string, aggregationWindow: string): Promise<void> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new DeleteCommand({
    TableName: TABLES.PROPHET_PERFORMANCE_SUMMARY,
    Key: { prophetId, aggregationWindow }
  });

  try {
    await ddb.send(command);
  } catch (error) {
    console.error('Error deleting performance summary:', error);
    throw error;
  }
}
