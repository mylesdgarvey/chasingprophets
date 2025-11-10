/**
 * Prophet Service
 * Handles CRUD operations for prophets in DynamoDB
 * Supports ensembling via modelFitIds array
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb';
import { TABLES } from '../types/assets';
import type { Prophet, CreateProphetInput, UpdateProphetInput } from '../types/prophet';

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
  console.warn('Failed to initialize DynamoDB client for ProphetService', err);
}

/**
 * Get a prophet by ID
 */
export async function getProphet(prophetId: string): Promise<Prophet | null> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new GetCommand({
    TableName: TABLES.PROPHETS,
    Key: { prophetId }
  });

  try {
    const response = await ddb.send(command);
    return (response.Item as Prophet) || null;
  } catch (error) {
    console.error('Error fetching prophet:', error);
    throw error;
  }
}

/**
 * Get all prophets for an asset
 */
export async function getProphetsByAsset(assetId: string): Promise<Prophet[]> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new QueryCommand({
    TableName: TABLES.PROPHETS,
    IndexName: 'AssetIndex',
    KeyConditionExpression: 'assetId = :assetId',
    ExpressionAttributeValues: { ':assetId': assetId }
  });

  try {
    const response = await ddb.send(command);
    return (response.Items || []) as Prophet[];
  } catch (error) {
    console.error('Error fetching prophets by asset:', error);
    throw error;
  }
}

/**
 * Get all active prophets (trained and ready for inference)
 */
export async function getActiveProphets(): Promise<Prophet[]> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new ScanCommand({
    TableName: TABLES.PROPHETS,
    FilterExpression: '#status = :active',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: { ':active': 'active' }
  });

  try {
    const response = await ddb.send(command);
    return (response.Items || []) as Prophet[];
  } catch (error) {
    console.error('Error fetching active prophets:', error);
    throw error;
  }
}

/**
 * Get all prophets
 */
export async function getAllProphets(): Promise<Prophet[]> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new ScanCommand({
    TableName: TABLES.PROPHETS
  });

  try {
    const response = await ddb.send(command);
    return (response.Items || []) as Prophet[];
  } catch (error) {
    console.error('Error fetching all prophets:', error);
    throw error;
  }
}

/**
 * Create a new prophet
 */
export async function createProphet(input: CreateProphetInput): Promise<Prophet> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  // Validate ensemble configuration
  if (input.modelFitIds.length === 0) {
    throw new Error('Prophet must have at least one model fit');
  }

  const ensembleMethod = input.ensembleMethod || (input.modelFitIds.length === 1 ? 'single' : 'average');

  if (ensembleMethod === 'weighted_average') {
    if (!input.ensembleWeights || input.ensembleWeights.length !== input.modelFitIds.length) {
      throw new Error('Weighted average requires weights for each model fit');
    }
    const sumWeights = input.ensembleWeights.reduce((a, b) => a + b, 0);
    if (Math.abs(sumWeights - 1.0) > 0.001) {
      throw new Error('Ensemble weights must sum to 1.0');
    }
  }

  const prophet: Prophet = {
    prophetId: input.prophetId,
    prophetName: input.prophetName,
    assetId: input.assetId,
    modelFitIds: input.modelFitIds,
    ensembleMethod,
    ensembleWeights: input.ensembleWeights,
    targetProperty: input.targetProperty,
    s3OutputTransformScriptPath: input.s3OutputTransformScriptPath,
    s3InputTransformScriptPath: input.s3InputTransformScriptPath,
    forecastMethod: input.forecastMethod || 'direct',
    forecastParams: input.forecastParams,
    description: input.description,
    status: 'pending_training',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const command = new PutCommand({
    TableName: TABLES.PROPHETS,
    Item: prophet
  });

  try {
    await ddb.send(command);
    return prophet;
  } catch (error) {
    console.error('Error creating prophet:', error);
    throw error;
  }
}

/**
 * Update a prophet
 */
export async function updateProphet(input: UpdateProphetInput): Promise<void> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const updateParts: string[] = [];
  const expressionValues: Record<string, any> = {
    ':updated': new Date().toISOString()
  };
  const expressionNames: Record<string, string> = {};

  if (input.prophetName !== undefined) {
    updateParts.push('prophetName = :prophetName');
    expressionValues[':prophetName'] = input.prophetName;
  }
  if (input.modelFitIds !== undefined) {
    updateParts.push('modelFitIds = :modelFitIds');
    expressionValues[':modelFitIds'] = input.modelFitIds;
  }
  if (input.ensembleMethod !== undefined) {
    updateParts.push('ensembleMethod = :ensembleMethod');
    expressionValues[':ensembleMethod'] = input.ensembleMethod;
  }
  if (input.ensembleWeights !== undefined) {
    updateParts.push('ensembleWeights = :ensembleWeights');
    expressionValues[':ensembleWeights'] = input.ensembleWeights;
  }
  if (input.targetProperty !== undefined) {
    updateParts.push('targetProperty = :targetProperty');
    expressionValues[':targetProperty'] = input.targetProperty;
  }
  if (input.s3OutputTransformScriptPath !== undefined) {
    updateParts.push('s3OutputTransformScriptPath = :s3OutputTransformScriptPath');
    expressionValues[':s3OutputTransformScriptPath'] = input.s3OutputTransformScriptPath;
  }
  if (input.s3InputTransformScriptPath !== undefined) {
    updateParts.push('s3InputTransformScriptPath = :s3InputTransformScriptPath');
    expressionValues[':s3InputTransformScriptPath'] = input.s3InputTransformScriptPath;
  }
  if (input.forecastMethod !== undefined) {
    updateParts.push('forecastMethod = :forecastMethod');
    expressionValues[':forecastMethod'] = input.forecastMethod;
  }
  if (input.forecastParams !== undefined) {
    updateParts.push('forecastParams = :forecastParams');
    expressionValues[':forecastParams'] = input.forecastParams;
  }
  if (input.status !== undefined) {
    updateParts.push('#status = :status');
    expressionValues[':status'] = input.status;
    expressionNames['#status'] = 'status';
  }
  if (input.description !== undefined) {
    updateParts.push('description = :description');
    expressionValues[':description'] = input.description;
  }

  updateParts.push('updatedAt = :updated');

  const command = new UpdateCommand({
    TableName: TABLES.PROPHETS,
    Key: { prophetId: input.prophetId },
    UpdateExpression: `SET ${updateParts.join(', ')}`,
    ExpressionAttributeValues: expressionValues,
    ...(Object.keys(expressionNames).length > 0 && { ExpressionAttributeNames: expressionNames })
  });

  try {
    await ddb.send(command);
  } catch (error) {
    console.error('Error updating prophet:', error);
    throw error;
  }
}

/**
 * Delete a prophet
 */
export async function deleteProphet(prophetId: string): Promise<void> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new DeleteCommand({
    TableName: TABLES.PROPHETS,
    Key: { prophetId }
  });

  try {
    await ddb.send(command);
  } catch (error) {
    console.error('Error deleting prophet:', error);
    throw error;
  }
}

/**
 * Update prophet performance metrics (called by daily cron job)
 */
export async function updateProphetPerformance(
  prophetId: string,
  performance: {
    rmse?: number;
    mape?: number;
    r2?: number;
    directionalAccuracy?: number;
    backtestPeriod?: { start: string; end: string };
  }
): Promise<void> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new UpdateCommand({
    TableName: TABLES.PROPHETS,
    Key: { prophetId },
    UpdateExpression: 'SET performance = :performance, updatedAt = :updated',
    ExpressionAttributeValues: {
      ':performance': performance,
      ':updated': new Date().toISOString()
    }
  });

  try {
    await ddb.send(command);
  } catch (error) {
    console.error('Error updating prophet performance:', error);
    throw error;
  }
}

// Export aliases for consistency with other components
export const getProphetById = getProphet;

