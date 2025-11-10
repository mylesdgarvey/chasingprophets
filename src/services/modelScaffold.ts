/**
 * ModelScaffold Service
 * Handles CRUD operations for model scaffolds in DynamoDB
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb';
import { TABLES } from '../types/assets';
import type { ModelScaffold, CreateModelScaffoldInput } from '../types/modelScaffold';

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
  console.warn('Failed to initialize DynamoDB client for ModelScaffoldService', err);
}

/**
 * Get a model scaffold by ID
 */
export async function getModelScaffold(scaffoldId: string): Promise<ModelScaffold | null> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new GetCommand({
    TableName: TABLES.MODEL_SCAFFOLDS,
    Key: { scaffoldId }
  });

  try {
    const response = await ddb.send(command);
    if (!response.Item) return null;
    
    // Convert contract format from DynamoDB storage to TypeScript interface
    const item = response.Item as any;
    return normalizeScaffold(item);
  } catch (error) {
    console.error('Error fetching model scaffold:', error);
    throw error;
  }
}

/**
 * Normalize scaffold data from DynamoDB format to TypeScript interface
 */
function normalizeScaffold(item: any): ModelScaffold {
  // Convert contracts from {fields: [...], types: {...}} to ContractField[]
  const normalizeContract = (contract: any): any[] => {
    if (Array.isArray(contract)) {
      return contract; // Already in correct format
    }
    if (contract && contract.fields && contract.types) {
      // Convert from DynamoDB format
      return contract.fields.map((field: string) => ({
        name: field,
        type: contract.types[field] || 'numerical',
        required: true,
        description: ''
      }));
    }
    return [];
  };

  return {
    ...item,
    inputContract: normalizeContract(item.inputContract),
    outputContract: normalizeContract(item.outputContract),
    formulaLatex: item.formula || item.formulaLatex // Support both field names
  } as ModelScaffold;
}

/**
 * Get all model scaffolds
 */
export async function getAllModelScaffolds(): Promise<ModelScaffold[]> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new ScanCommand({
    TableName: TABLES.MODEL_SCAFFOLDS
  });

  try {
    const response = await ddb.send(command);
    return (response.Items || []).map(item => normalizeScaffold(item));
  } catch (error) {
    console.error('Error fetching all model scaffolds:', error);
    throw error;
  }
}

/**
 * Create a new model scaffold
 */
export async function createModelScaffold(input: CreateModelScaffoldInput): Promise<ModelScaffold> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const scaffold: ModelScaffold = {
    ...input,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };

  const command = new PutCommand({
    TableName: TABLES.MODEL_SCAFFOLDS,
    Item: scaffold
  });

  try {
    await ddb.send(command);
    return scaffold;
  } catch (error) {
    console.error('Error creating model scaffold:', error);
    throw error;
  }
}

/**
 * Update an existing model scaffold
 */
export async function updateModelScaffold(scaffoldId: string, updates: Partial<ModelScaffold>): Promise<ModelScaffold> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  // First get the existing scaffold
  const existing = await getModelScaffold(scaffoldId);
  if (!existing) {
    throw new Error(`Scaffold ${scaffoldId} not found`);
  }

  // Merge updates
  const updated: ModelScaffold = {
    ...existing,
    ...updates,
    scaffoldId, // Ensure ID doesn't change
    lastUpdated: new Date().toISOString()
  };

  const command = new PutCommand({
    TableName: TABLES.MODEL_SCAFFOLDS,
    Item: updated
  });

  try {
    await ddb.send(command);
    return updated;
  } catch (error) {
    console.error('Error updating model scaffold:', error);
    throw error;
  }
}

/**
 * Delete a model scaffold
 */
export async function deleteModelScaffold(scaffoldId: string): Promise<void> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new DeleteCommand({
    TableName: TABLES.MODEL_SCAFFOLDS,
    Key: { scaffoldId }
  });

  try {
    await ddb.send(command);
  } catch (error) {
    console.error('Error deleting model scaffold:', error);
    throw error;
  }
}

/**
 * Upload a script file to S3
 * @param scriptContent - The script code as a string
 * @param s3Path - S3 path (e.g., "models/scaffolds/slr/train.py")
 * @returns The full S3 URL
 */
export async function uploadScriptToS3(scriptContent: string, s3Path: string): Promise<string> {
  try {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const s3Client = new S3Client({
      region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || ''
      }
    });

    const bucket = import.meta.env.VITE_S3_MODELS_BUCKET || 'chasingprophets-models-us-east-1';
    
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: s3Path,
      Body: scriptContent,
      ContentType: s3Path.endsWith('.py') ? 'text/x-python' : 
                   s3Path.endsWith('.js') ? 'application/javascript' : 
                   'text/plain'
    });

    await s3Client.send(command);
    return `s3://${bucket}/${s3Path}`;
  } catch (error) {
    console.error('Error uploading script to S3:', error);
    throw error;
  }
}

/**
 * Download a script file from S3
 * @param s3Path - Full S3 path (s3://bucket/key or just the key)
 * @returns The script content as a string
 */
export async function downloadScriptFromS3(s3Path: string): Promise<string> {
  try {
    const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
    
    // Parse S3 path
    let bucket: string;
    let key: string;
    
    if (s3Path.startsWith('s3://')) {
      const pathParts = s3Path.replace('s3://', '').split('/');
      bucket = pathParts[0];
      key = pathParts.slice(1).join('/');
    } else {
      bucket = import.meta.env.VITE_S3_MODELS_BUCKET || 'chasingprophets-models-us-east-1';
      key = s3Path;
    }

    const s3Client = new S3Client({
      region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || ''
      }
    });

    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3Client.send(command);

    if (!response.Body) {
      throw new Error('No data in S3 response');
    }

    return await response.Body.transformToString();
  } catch (error) {
    console.error('Error downloading script from S3:', error);
    throw error;
  }
}

/**
 * Test remote inference by calling the Lambda function (placeholder)
 * This will be implemented in Phase 5 when we set up Lambda
 * @param scaffoldId - The scaffold ID to test
 * @param testData - Sample input data matching the input contract
 * @returns Inference results
 */
export async function testRemoteInference(
  scaffoldId: string,
  testData: Record<string, unknown>
): Promise<Record<string, unknown>> {
  // Placeholder - will be implemented when Lambda is set up
  console.log('Testing remote inference for scaffold:', scaffoldId, 'with data:', testData);
  
  // TODO: Invoke Lambda function via AWS SDK
  // const lambda = new LambdaClient({ ... });
  // const result = await lambda.send(new InvokeCommand({ ... }));
  
  return {
    status: 'not_implemented',
    message: 'Remote inference testing will be implemented in Phase 5'
  };
}

// Export aliases for consistency with other components
export const getModelScaffoldById = getModelScaffold;
