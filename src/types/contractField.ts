/**
 * ContractField type definitions
 * Used for defining input/output contracts in model scaffolds
 */

export type FieldType = 'numerical' | 'text' | 'categorical' | 'datetime' | 'boolean';

export interface ContractField {
  // Field identifier
  name: string;  // Variable/column name (e.g., "close_lag_1", "volume")
  
  // Type specification
  type: FieldType;
  required: boolean;
  
  // For numerical types
  minValue?: number;
  maxValue?: number;
  
  // For categorical types
  allowedValues?: string[];
  
  // Documentation
  description?: string;
}

export interface CreateContractFieldInput {
  name: string;
  type: FieldType;
  required: boolean;
  minValue?: number;
  maxValue?: number;
  allowedValues?: string[];
  description?: string;
}
