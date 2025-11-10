/**
 * DataSlice Service
 * Handles CRUD operations for data slices in DynamoDB
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb';
import { TABLES } from '../types/assets';
import type { DataSlice, CreateDataSliceInput } from '../types/dataSlice';

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
  console.warn('Failed to initialize DynamoDB client for DataSliceService', err);
}

/**
 * Get a data slice by ID
 */
export async function getDataSlice(dataSliceId: string): Promise<DataSlice | null> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new GetCommand({
    TableName: TABLES.DATA_SLICES,
    Key: { dataSliceId }
  });

  try {
    const response = await ddb.send(command);
    return (response.Item as DataSlice) || null;
  } catch (error) {
    console.error('Error fetching data slice:', error);
    throw error;
  }
}

/**
 * Get all data slices for a dataset
 */
export async function getDataSlicesByDataset(datasetId: string): Promise<DataSlice[]> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new QueryCommand({
    TableName: TABLES.DATA_SLICES,
    IndexName: 'DatasetIndex',
    KeyConditionExpression: 'datasetId = :datasetId',
    ExpressionAttributeValues: { ':datasetId': datasetId }
  });

  try {
    const response = await ddb.send(command);
    return (response.Items || []) as DataSlice[];
  } catch (error) {
    console.error('Error fetching data slices by dataset:', error);
    throw error;
  }
}

/**
 * Get all data slices
 */
export async function getAllDataSlices(): Promise<DataSlice[]> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new ScanCommand({
    TableName: TABLES.DATA_SLICES
  });

  try {
    const response = await ddb.send(command);
    return (response.Items || []) as DataSlice[];
  } catch (error) {
    console.error('Error fetching all data slices:', error);
    throw error;
  }
}

/**
 * Create a new data slice
 */
export async function createDataSlice(input: CreateDataSliceInput): Promise<DataSlice> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const dataSlice: DataSlice = {
    ...input,
    createdAt: new Date().toISOString()
  };

  const command = new PutCommand({
    TableName: TABLES.DATA_SLICES,
    Item: dataSlice
  });

  try {
    await ddb.send(command);
    return dataSlice;
  } catch (error) {
    console.error('Error creating data slice:', error);
    throw error;
  }
}

/**
 * Update an existing data slice
 */
export async function updateDataSlice(dataSliceId: string, updates: Partial<DataSlice>): Promise<DataSlice> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  // First get the existing slice
  const existing = await getDataSlice(dataSliceId);
  if (!existing) {
    throw new Error('Data slice not found');
  }

  const updated: DataSlice = {
    ...existing,
    ...updates,
    dataSliceId, // Ensure ID cannot be changed
  };

  const command = new PutCommand({
    TableName: TABLES.DATA_SLICES,
    Item: updated,
  });

  try {
    await ddb.send(command);
    return updated;
  } catch (error) {
    console.error('Error updating data slice:', error);
    throw error;
  }
}

/**
 * Delete a data slice
 */
export async function deleteDataSlice(dataSliceId: string): Promise<void> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  const command = new DeleteCommand({
    TableName: TABLES.DATA_SLICES,
    Key: { dataSliceId }
  });

  try {
    await ddb.send(command);
  } catch (error) {
    console.error('Error deleting data slice:', error);
    throw error;
  }
}

/**
 * Analyze CSV data to extract schema information
 * @param csvText - Raw CSV text
 * @returns Schema information (columns, types, ranges)
 */
export async function analyzeSliceSchema(csvText: string): Promise<{
  availableColumns: string[];
  columnTypes: Record<string, import('../types/contractField').FieldType>;
  columnRanges?: Record<string, { min: number; max: number }>;
}> {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have at least header and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const availableColumns = headers;
  const columnTypes: Record<string, import('../types/contractField').FieldType> = {};
  const columnRanges: Record<string, { min: number; max: number }> = {};

  // Sample first 100 rows to infer types
  const sampleSize = Math.min(100, lines.length - 1);
  const sampleRows = lines.slice(1, sampleSize + 1);

  headers.forEach((header, colIndex) => {
    const values = sampleRows.map(row => row.split(',')[colIndex]?.trim()).filter(v => v);
    
    if (values.length === 0) {
      columnTypes[header] = 'text';
      return;
    }

    // Check if all values are numbers
    const numericValues = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
    if (numericValues.length === values.length) {
      columnTypes[header] = 'numerical';
      columnRanges[header] = {
        min: Math.min(...numericValues),
        max: Math.max(...numericValues)
      };
      return;
    }

    // Check if it's a date (YYYY-MM-DD format)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (values.every(v => datePattern.test(v))) {
      columnTypes[header] = 'datetime';
      return;
    }

    // Check if it's boolean
    const booleanValues = ['true', 'false', '1', '0', 'yes', 'no'];
    if (values.every(v => booleanValues.includes(v.toLowerCase()))) {
      columnTypes[header] = 'boolean';
      return;
    }

    // Check if it's categorical (limited unique values)
    const uniqueValues = new Set(values);
    if (uniqueValues.size <= 20 && uniqueValues.size < values.length * 0.5) {
      columnTypes[header] = 'categorical';
      return;
    }

    // Default to text
    columnTypes[header] = 'text';
  });

  return { availableColumns, columnTypes, columnRanges };
}

/**
 * Validate that a data slice schema matches a scaffold's input contract
 * @param dataSlice - The data slice to validate
 * @param scaffold - The model scaffold with input contract
 * @returns Validation result with errors if any
 */
export async function validateContractMatch(
  dataSlice: DataSlice,
  scaffold: import('../types/modelScaffold').ModelScaffold
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Check each required field in the input contract
  for (const field of scaffold.inputContract) {
    // Check if column exists
    if (!dataSlice.availableColumns.includes(field.name)) {
      if (field.required) {
        errors.push(`Required field '${field.name}' not found in data slice`);
      }
      continue;
    }

    // Check type match
    const actualType = dataSlice.columnTypes[field.name];
    if (actualType !== field.type) {
      errors.push(
        `Type mismatch for field '${field.name}': expected ${field.type}, got ${actualType}`
      );
      continue;
    }

    // Check numerical ranges
    if (field.type === 'numerical' && dataSlice.columnRanges?.[field.name]) {
      const range = dataSlice.columnRanges[field.name];
      
      if (field.minValue !== undefined && range.min < field.minValue) {
        errors.push(
          `Field '${field.name}' has values below minimum: ${range.min} < ${field.minValue}`
        );
      }
      
      if (field.maxValue !== undefined && range.max > field.maxValue) {
        errors.push(
          `Field '${field.name}' has values above maximum: ${range.max} > ${field.maxValue}`
        );
      }
    }

    // Check categorical allowed values
    if (field.type === 'categorical' && field.allowedValues) {
      // This would require analyzing actual data values, not just schema
      // Placeholder for now - can be enhanced later
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create a compound slice from multiple simple slices
 * Validates that all base slices are simple and from the same dataset
 * @param compoundSliceId - ID for the new compound slice
 * @param baseSliceIds - Array of simple slice IDs to combine
 * @param description - Optional description
 * @returns The created compound slice
 */
export async function createCompoundSlice(
  compoundSliceId: string,
  baseSliceIds: string[],
  description?: string
): Promise<DataSlice> {
  if (!ddb) throw new Error('DynamoDB client not initialized');

  // Validate input
  if (!baseSliceIds || baseSliceIds.length === 0) {
    throw new Error('Compound slice must have at least one base slice');
  }

  // Fetch all base slices
  const baseSlices: DataSlice[] = [];
  for (const sliceId of baseSliceIds) {
    const slice = await getDataSlice(sliceId);
    if (!slice) {
      throw new Error(`Base slice not found: ${sliceId}`);
    }
    if (slice.sliceType !== 'simple') {
      throw new Error(`Base slice ${sliceId} is not a simple slice. Compound slices can only be formed from simple slices.`);
    }
    baseSlices.push(slice);
  }

  // Validate all slices are from the same dataset
  const datasetId = baseSlices[0].datasetId;
  if (!baseSlices.every(s => s.datasetId === datasetId)) {
    throw new Error('All base slices must be from the same dataset');
  }

  // Calculate compound date range (earliest start, latest end)
  const startDate = baseSlices
    .map(s => s.startDate)
    .sort()[0];
  
  const endDate = baseSlices
    .map(s => s.endDate)
    .sort()
    .reverse()[0];

  // Merge schema information (use first slice as template, verify consistency)
  const availableColumns = baseSlices[0].availableColumns;
  const columnTypes = baseSlices[0].columnTypes;
  
  // Validate all slices have the same schema
  for (let i = 1; i < baseSlices.length; i++) {
    const slice = baseSlices[i];
    if (JSON.stringify(slice.availableColumns.sort()) !== JSON.stringify(availableColumns.sort())) {
      throw new Error(`Base slice ${slice.dataSliceId} has different columns than first slice`);
    }
    if (JSON.stringify(slice.columnTypes) !== JSON.stringify(columnTypes)) {
      throw new Error(`Base slice ${slice.dataSliceId} has different column types than first slice`);
    }
  }

  // Merge numerical ranges (min of mins, max of maxes)
  const columnRanges: Record<string, { min: number; max: number }> = {};
  for (const column of availableColumns) {
    if (columnTypes[column] === 'numerical') {
      const ranges = baseSlices
        .map(s => s.columnRanges?.[column])
        .filter(r => r !== undefined) as { min: number; max: number }[];
      
      if (ranges.length > 0) {
        columnRanges[column] = {
          min: Math.min(...ranges.map(r => r.min)),
          max: Math.max(...ranges.map(r => r.max))
        };
      }
    }
  }

  // Create compound slice
  const compoundSlice: DataSlice = {
    dataSliceId: compoundSliceId,
    datasetId,
    startDate,
    endDate,
    description,
    sliceType: 'compound',
    baseSliceIds,
    availableColumns,
    columnTypes,
    columnRanges: Object.keys(columnRanges).length > 0 ? columnRanges : undefined,
    createdAt: new Date().toISOString()
  };

  // Save to DynamoDB
  const command = new PutCommand({
    TableName: TABLES.DATA_SLICES,
    Item: compoundSlice
  });

  await ddb.send(command);
  return compoundSlice;
}

/**
 * Validate compound slice composition
 * @param slice - The slice to validate
 * @returns Validation result
 */
export async function validateCompoundSlice(slice: DataSlice): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  if (slice.sliceType !== 'compound') {
    return { valid: true, errors: [] };
  }

  // Check baseSliceIds is present
  if (!slice.baseSliceIds || slice.baseSliceIds.length === 0) {
    errors.push('Compound slice must have baseSliceIds');
    return { valid: false, errors };
  }

  // Verify each base slice exists and is simple
  for (const baseSliceId of slice.baseSliceIds) {
    const baseSlice = await getDataSlice(baseSliceId);
    if (!baseSlice) {
      errors.push(`Base slice not found: ${baseSliceId}`);
    } else if (baseSlice.sliceType !== 'simple') {
      errors.push(`Base slice ${baseSliceId} is not simple (compound slices can only be formed from simple slices)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Export aliases for consistency with other components
export const getDataSliceById = getDataSlice;

