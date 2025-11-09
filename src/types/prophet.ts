/**
 * Prophet type definitions
 * Represents a deployable prediction engine
 * Supports ensembling via modelFitIds array
 */

/**
 * Prophet type definitions
 * A Prophet is an asset-specific prediction adapter that:
 *  - Transforms asset data to match model input (optional)
 *  - Executes model inference (one or more ModelFits)
 *  - Transforms model output back to an asset-measure (required)
 */

export type ForecastMethodType = 'direct' | 'stochastic' | 'confidence_interval';
export type ProphetStatus = 'pending_training' | 'active' | 'inactive' | 'failed';
export type EnsembleMethod = 'single' | 'average' | 'weighted_average' | 'voting';

export interface Prophet {
  prophetId: string;
  prophetName: string;
  description?: string;

  // Asset binding
  assetId: string;

  // Model binding (supports one or many model fits for ensembles)
  modelFitIds: string[];  // CHANGED: Array to support ensembles
  ensembleMethod: EnsembleMethod;  // How to combine multiple fits
  ensembleWeights?: number[];  // Optional weights for weighted_average

  // What property of the asset is being forecasted (e.g., 'close', 'volume')
  targetProperty: string;

  // S3 script paths specific to this prophet
  s3InputTransformScriptPath?: string;   // Optional
  s3OutputTransformScriptPath: string;   // Required

  // Forecast method configuration
  forecastMethod: ForecastMethodType;
  forecastParams?: {
    seed?: number;
    distribution?: 'normal' | 'lognormal';
    errorModel?: 'additive' | 'multiplicative';
  };

  // Lifecycle
  status: ProphetStatus;
  createdAt: string;
  updatedAt?: string;

  // Performance metrics (computed on raw asset values)
  performance?: {
    rmse?: number;
    mape?: number;
    r2?: number;
    directionalAccuracy?: number;
    backtestPeriod?: { start: string; end: string };
  };
}

export interface CreateProphetInput {
  prophetId: string;
  prophetName: string;
  assetId: string;
  modelFitIds: string[];  // CHANGED: Array to support ensembles
  ensembleMethod?: EnsembleMethod;  // Default: 'single' if only one fit
  ensembleWeights?: number[];
  targetProperty: string;
  s3OutputTransformScriptPath: string;
  s3InputTransformScriptPath?: string;
  forecastMethod?: ForecastMethodType;
  forecastParams?: {
    seed?: number;
    distribution?: 'normal' | 'lognormal';
    errorModel?: 'additive' | 'multiplicative';
  };
  description?: string;
}

export interface UpdateProphetInput {
  prophetId: string;
  prophetName?: string;
  modelFitIds?: string[];  // CHANGED: Array to support ensembles
  ensembleMethod?: EnsembleMethod;
  ensembleWeights?: number[];
  targetProperty?: string;
  s3OutputTransformScriptPath?: string;
  s3InputTransformScriptPath?: string;
  forecastMethod?: ForecastMethodType;
  forecastParams?: {
    seed?: number;
    distribution?: 'normal' | 'lognormal';
    errorModel?: 'additive' | 'multiplicative';
  };
  description?: string;
  status?: ProphetStatus;
}
