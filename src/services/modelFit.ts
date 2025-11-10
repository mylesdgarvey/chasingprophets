/**
 * ModelFit Service
 * Handles CRUD operations for model fits in DynamoDB
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
import type { ModelFit, CreateModelFitInput } from '../types/modelFit';
import type { ModelScaffold } from '../types/modelScaffold';
import { getModelScaffold } from './modelScaffold';

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
  console.warn('Failed to initialize DynamoDB client for ModelFitService', err);
}

/**
 * Get a model fit by ID
 */
export async function getModelFit(modelFitId: string): Promise<ModelFit | null> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new GetCommand({
    TableName: TABLES.MODEL_FITS,
    Key: { modelFitId }
  });

  try {
    const response = await ddb.send(command);
    return (response.Item as ModelFit) || null;
  } catch (error) {
    console.error('Error fetching model fit:', error);
    throw error;
  }
}

/**
 * Get all model fits for an asset
 */
export async function getModelFitsByAsset(assetId: string): Promise<ModelFit[]> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new QueryCommand({
    TableName: TABLES.MODEL_FITS,
    IndexName: 'AssetIndex',
    KeyConditionExpression: 'assetId = :assetId',
    ExpressionAttributeValues: { ':assetId': assetId }
  });

  try {
    const response = await ddb.send(command);
    return (response.Items || []) as ModelFit[];
  } catch (error) {
    console.error('Error fetching model fits by asset:', error);
    throw error;
  }
}

/**
 * Get all model fits for a scaffold
 */
export async function getModelFitsByScaffold(scaffoldId: string): Promise<ModelFit[]> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new QueryCommand({
    TableName: TABLES.MODEL_FITS,
    IndexName: 'ScaffoldIndex',
    KeyConditionExpression: 'scaffoldId = :scaffoldId',
    ExpressionAttributeValues: { ':scaffoldId': scaffoldId }
  });

  try {
    const response = await ddb.send(command);
    return (response.Items || []) as ModelFit[];
  } catch (error) {
    console.error('Error fetching model fits by scaffold:', error);
    throw error;
  }
}

/**
 * Get all model fits
 */
export async function getAllModelFits(): Promise<ModelFit[]> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new ScanCommand({
    TableName: TABLES.MODEL_FITS
  });

  try {
    const response = await ddb.send(command);
    return (response.Items || []) as ModelFit[];
  } catch (error) {
    console.error('Error fetching all model fits:', error);
    throw error;
  }
}

/**
 * Create a new model fit
 * Script paths are copied from the scaffold to ensure the fit uses the correct inference scripts
 */
export async function createModelFit(input: CreateModelFitInput): Promise<ModelFit> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  // Fetch the scaffold to get script paths if not provided in input
  let scriptPaths = {
    s3RemoteInferenceScriptPath: input.s3RemoteInferenceScriptPath,
    s3LocalInferenceScriptPath: input.s3LocalInferenceScriptPath
  };

  // If script paths not provided, copy from scaffold
  if (!input.s3RemoteInferenceScriptPath) {
    const scaffold = await getModelScaffold(input.scaffoldId);
    if (!scaffold) {
      throw new Error(`Scaffold not found: ${input.scaffoldId}`);
    }
    scriptPaths = {
      s3RemoteInferenceScriptPath: scaffold.s3RemoteInferenceScriptPath,
      s3LocalInferenceScriptPath: scaffold.s3LocalInferenceScriptPath
    };
  }

  const modelFit: ModelFit = {
    ...input,
    ...scriptPaths,
    trainingStatus: input.trainingStatus || 'unfit',
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };

  const command = new PutCommand({
    TableName: TABLES.MODEL_FITS,
    Item: modelFit
  });

  try {
    await ddb.send(command);
    return modelFit;
  } catch (error) {
    console.error('Error creating model fit:', error);
    throw error;
  }
}

/**
 * Update model fit training status
 */
export async function updateModelFitStatus(
  modelFitId: string,
  status: 'unfit' | 'fitting' | 'fit' | 'failed',
  trainingMetrics?: Record<string, number>
): Promise<void> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new UpdateCommand({
    TableName: TABLES.MODEL_FITS,
    Key: { modelFitId },
    UpdateExpression: 'SET trainingStatus = :status, lastUpdated = :updated' +
      (trainingMetrics ? ', trainingMetrics = :metrics' : ''),
    ExpressionAttributeValues: {
      ':status': status,
      ':updated': new Date().toISOString(),
      ...(trainingMetrics && { ':metrics': trainingMetrics })
    }
  });

  try {
    await ddb.send(command);
  } catch (error) {
    console.error('Error updating model fit status:', error);
    throw error;
  }
}

/**
 * Delete a model fit
 */
export async function deleteModelFit(modelFitId: string): Promise<void> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new DeleteCommand({
    TableName: TABLES.MODEL_FITS,
    Key: { modelFitId }
  });

  try {
    await ddb.send(command);
  } catch (error) {
    console.error('Error deleting model fit:', error);
    throw error;
  }
}

// Export aliases for consistency with other components
export const getModelFitById = getModelFit;
