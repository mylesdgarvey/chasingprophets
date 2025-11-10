/**
 * Dataset Service
 * CRUD operations for datasets
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  DeleteCommand,
  ScanCommand,
  QueryCommand 
} from '@aws-sdk/lib-dynamodb';
import type { Dataset, CreateDatasetInput } from '../types/dataset';

const client = new DynamoDBClient({ 
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
  }
});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'ChasingProphets-Datasets';

/**
 * Get all datasets
 */
export async function getAllDatasets(): Promise<Dataset[]> {
  try {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
    });

    const response = await docClient.send(command);
    return (response.Items as Dataset[]) || [];
  } catch (error) {
    console.error('Error fetching datasets:', error);
    throw new Error('Failed to fetch datasets');
  }
}

/**
 * Get datasets by asset
 */
export async function getDatasetsByAsset(assetId: string): Promise<Dataset[]> {
  try {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'assetId = :assetId',
      ExpressionAttributeValues: {
        ':assetId': assetId,
      },
    });

    const response = await docClient.send(command);
    return (response.Items as Dataset[]) || [];
  } catch (error) {
    console.error('Error fetching datasets for asset:', error);
    throw new Error('Failed to fetch datasets');
  }
}

/**
 * Get single dataset by ID
 */
export async function getDataset(datasetId: string): Promise<Dataset | null> {
  try {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { datasetId },
    });

    const response = await docClient.send(command);
    return (response.Item as Dataset) || null;
  } catch (error) {
    console.error('Error fetching dataset:', error);
    throw new Error('Failed to fetch dataset');
  }
}

/**
 * Create new dataset
 */
export async function createDataset(input: CreateDatasetInput): Promise<Dataset> {
  try {
    const now = new Date().toISOString();
    const dataset: Dataset = {
      ...input,
      createdAt: now,
      lastUpdated: now,
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: dataset,
      ConditionExpression: 'attribute_not_exists(datasetId)',
    });

    await docClient.send(command);
    return dataset;
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      throw new Error('Dataset with this ID already exists');
    }
    console.error('Error creating dataset:', error);
    throw new Error('Failed to create dataset');
  }
}

/**
 * Update existing dataset
 */
export async function updateDataset(datasetId: string, updates: Partial<Dataset>): Promise<Dataset> {
  try {
    // First get the existing dataset
    const existing = await getDataset(datasetId);
    if (!existing) {
      throw new Error('Dataset not found');
    }

    const updated: Dataset = {
      ...existing,
      ...updates,
      datasetId, // Ensure ID cannot be changed
      lastUpdated: new Date().toISOString(),
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: updated,
    });

    await docClient.send(command);
    return updated;
  } catch (error) {
    console.error('Error updating dataset:', error);
    throw new Error('Failed to update dataset');
  }
}

/**
 * Delete dataset
 */
export async function deleteDataset(datasetId: string): Promise<void> {
  try {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { datasetId },
    });

    await docClient.send(command);
  } catch (error) {
    console.error('Error deleting dataset:', error);
    throw new Error('Failed to delete dataset');
  }
}
