/**
 * ModelScaffold type definitions
 * Represents a contract-based reusable model architecture template
 */

import { ContractField } from './contractField';

export type InferenceMode = 'local' | 'remote' | 'hybrid';
export type ScaffoldType = 'context-free' | 'context-dependent';
export type LearningAlgorithm = 
  | 'MLE'  // Maximum Likelihood Estimation
  | 'OLS'  // Ordinary Least Squares
  | 'gradient_descent'
  | 'adam'
  | 'sgd'
  | 'custom'
  | string;  // Allow custom strings

export interface ModelScaffold {
  // Identity
  scaffoldId: string;
  name: string;
  description: string;
  modelType?: 'ML' | 'DL' | 'TS' | 'statistical';
  
  // Classification (per concept document)
  scaffoldType: ScaffoldType;  // ADDED: context-free or context-dependent
  modelMajorCategory?: string;  // ADDED: e.g., 'econometrics', 'deep_learning'
  modelCategory?: string;       // ADDED: e.g., 'multiple_linear_regression'
  learningAlgorithm: LearningAlgorithm;  // ADDED: e.g., 'MLE', 'OLS'
  
  // Contract specification
  isContextualized: boolean;  // KEPT for backward compatibility (maps to scaffoldType)
  inputContract: ContractField[];
  outputContract: ContractField[];
  
  // Execution configuration
  inferenceMode: InferenceMode;  // 'local' | 'remote' | 'hybrid'
  s3TrainingScriptPath: string;  // Required: scripts/scaffolds/{scaffoldId}/train.py
  s3RemoteInferenceScriptPath: string;  // Required: scripts/scaffolds/{scaffoldId}/inference.py
  s3LocalInferenceScriptPath?: string;  // Optional: scripts/scaffolds/{scaffoldId}/inference.js
  
  // Documentation
  formulaLatex?: string;  // KEPT: LaTeX model specification
  s3SpecificationPath?: string;  // ADDED: S3 path to .tex file if generated
  
  // Metadata
  createdAt: string;
  lastUpdated: string;
  createdBy?: string;
}

export interface CreateModelScaffoldInput {
  scaffoldId: string;
  name: string;
  description: string;
  modelType?: 'ML' | 'DL' | 'TS' | 'statistical';
  
  scaffoldType: ScaffoldType;  // ADDED: Required field
  modelMajorCategory?: string;  // ADDED
  modelCategory?: string;       // ADDED
  learningAlgorithm: LearningAlgorithm;  // ADDED: Required
  
  isContextualized: boolean;  // KEPT for backward compatibility
  inputContract: ContractField[];
  outputContract: ContractField[];
  
  inferenceMode: InferenceMode;
  s3TrainingScriptPath: string;
  s3RemoteInferenceScriptPath: string;
  s3LocalInferenceScriptPath?: string;
  
  formulaLatex?: string;
  s3SpecificationPath?: string;  // ADDED
  createdBy?: string;
}
