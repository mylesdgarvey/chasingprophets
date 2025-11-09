/**
 * ModelFit type definitions
 * Represents a trained model instance (a scaffold trained on a data slice)
 */

export interface ModelFit {
  modelFitId: string;
  scaffoldId: string;
  assetId: string;
  dataSliceId: string;
  
  // Model artifacts in S3
  modelUrl?: string;  // Base S3 path: models/{modelFitId}/
  modelParametersPath: string;  // S3 path to parameters.json (e.g., models/{modelFitId}/parameters.json)
  
  // Script references (copied from scaffold at fit creation)
  s3RemoteInferenceScriptPath: string;  // For server-side inference
  s3LocalInferenceScriptPath?: string;  // For client-side inference (if available)
  
  // Training info
  trainingMetrics?: {
    mape?: number;
    rmse?: number;
    r2?: number;
    [key: string]: number | undefined;
  };
  trainingStatus: 'unfit' | 'fitting' | 'fit' | 'failed';
  
  // Metadata
  createdAt: string;
  lastUpdated: string;
}

export interface CreateModelFitInput {
  modelFitId: string;
  scaffoldId: string;
  assetId: string;
  dataSliceId: string;
  modelUrl?: string;
  modelParametersPath: string;
  s3RemoteInferenceScriptPath: string;
  s3LocalInferenceScriptPath?: string;
  trainingMetrics?: {
    mape?: number;
    rmse?: number;
    r2?: number;
    [key: string]: number | undefined;
  };
  trainingStatus?: 'unfit' | 'fitting' | 'fit' | 'failed';
}
