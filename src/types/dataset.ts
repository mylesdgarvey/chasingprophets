/**
 * Dataset type definitions
 * Represents metadata layer connecting an Asset to its data collection
 */

export type DatasetType = 'table' | 'text' | 'timeseries' | 'image';

export interface Dataset {
  datasetId: string;
  assetId: string;
  name: string;
  description: string;
  source: string;  // S3 path or DynamoDB table name
  datasetType?: DatasetType;  // Type of dataset for visualization
  recordCount?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  createdAt: string;
  lastUpdated: string;
}

export interface CreateDatasetInput {
  datasetId: string;
  assetId: string;
  name: string;
  description: string;
  source: string;
  recordCount?: number;
  dateRange?: {
    start: string;
    end: string;
  };
}
