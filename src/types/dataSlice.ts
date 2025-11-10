/**
 * DataSlice type definitions
 * Represents a fixed, immutable time window of a dataset for model training
 * 
 * Simple slices: Single contiguous time period
 * Compound slices: Union of multiple simple slices (e.g., for train+validation sets)
 */

import type { FieldType } from './contractField';

export type SliceType = 'simple' | 'compound';

export interface DataSlice {
  dataSliceId: string;
  datasetId?: string;  // New schema
  assetId?: string;    // Legacy schema - for backwards compatibility
  startDate: string;  // YYYY-MM-DD (earliest date for compound slices)
  endDate: string;    // YYYY-MM-DD (latest date for compound slices)
  description?: string;
  
  // Slice composition
  sliceType?: SliceType;  // 'simple' or 'compound' - optional for legacy data
  baseSliceIds?: string[];  // Only for compound slices: list of simple slice IDs
  
  // Schema information for contract validation
  availableColumns?: string[];  // All column names in this slice - optional for legacy
  columnTypes?: Record<string, FieldType>;  // Type of each column - optional for legacy
  columnRanges?: Record<string, { min: number; max: number }>;  // Range for numerical columns
  
  // Legacy fields
  recordCount?: number;
  windowDays?: number;
  s3Key?: string;
  
  createdAt: string;
}

export interface CreateDataSliceInput {
  dataSliceId: string;
  datasetId: string;
  startDate: string;
  endDate: string;
  description?: string;
  sliceType: SliceType;
  baseSliceIds?: string[];  // Required for compound slices
  availableColumns: string[];
  columnTypes: Record<string, FieldType>;
  columnRanges?: Record<string, { min: number; max: number }>;
}

