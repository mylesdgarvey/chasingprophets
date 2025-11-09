/**
 * Local Inference Engine for Browser
 * 
 * Executes model inference directly in the browser using:
 * 1. Model parameters from S3
 * 2. Inference script (inference.js) from S3
 * 3. Historical OHLCV data
 * 
 * Computes predictions and performance metrics for visualization
 */

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const REGION = import.meta.env.VITE_AWS_REGION || 'us-east-1';
const BUCKET = `chasingprophets-models-${REGION}`;

// Initialize S3 client
const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || ''
  }
});

export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Prediction {
  date: string;
  actual: number;
  predicted: number;
  error: number;
  percentError: number;
}

export interface PerformanceMetrics {
  mape: number;  // Mean Absolute Percentage Error
  rmse: number;  // Root Mean Squared Error
  mae: number;   // Mean Absolute Error
  directionalAccuracy: number;  // % of correct up/down predictions
  sampleSize: number;
}

/**
 * Load object from S3 and return as string
 */
async function loadFromS3(s3Path: string): Promise<string> {
  // Parse S3 path: s3://bucket/key
  const match = s3Path.match(/^s3:\/\/([^/]+)\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid S3 path: ${s3Path}`);
  }
  
  const [, bucket, key] = match;
  
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key
  });
  
  const response = await s3Client.send(command);
  if (!response.Body) {
    throw new Error(`Empty S3 object: ${s3Path}`);
  }
  
  return await response.Body.transformToString();
}

/**
 * Load and execute inference script from S3
 * Returns a function that can make predictions
 */
export async function loadInferenceScript(s3ScriptPath: string, parameters: any): Promise<(input: any) => number> {
  console.log('Loading inference script from S3:', s3ScriptPath);
  
  // Load script content
  const scriptContent = await loadFromS3(s3ScriptPath);
  
  // Execute script in isolated context
  // The script exports a `predict` function
  const scriptWrapper = `
    (function() {
      ${scriptContent}
      // Return the predict function (works with both module.exports and window patterns)
      return typeof predict !== 'undefined' ? predict : null;
    })()
  `;
  
  try {
    // Use Function constructor to execute script
    const predictFunction = eval(scriptWrapper);
    
    if (typeof predictFunction !== 'function') {
      throw new Error('Inference script did not export a valid predict function');
    }
    
    // Return wrapped function for single prediction
    // The script's predict() expects array of data + parameters object
    // Extract the actual parameters (handle both flat and nested structures)
    const modelParams = parameters.parameters || parameters;
    
    return (input: any) => {
      const result = predictFunction([input], modelParams);
      if (result && result.length > 0) {
        // Extract predicted value from result
        const outputField = modelParams.output_field || 'close';
        return result[0][`${outputField}_pred`];
      }
      throw new Error('Prediction returned no results');
    };
  } catch (error) {
    console.error('Failed to load inference script:', error);
    throw new Error(`Failed to execute inference script: ${error}`);
  }
}

/**
 * Load model parameters from S3
 */
export async function loadModelParameters(s3ParametersPath: string): Promise<any> {
  console.log('Loading model parameters from S3:', s3ParametersPath);
  
  const content = await loadFromS3(s3ParametersPath);
  return JSON.parse(content);
}

/**
 * Execute inference on historical data
 * 
 * This function handles the transformation between prices and percentage returns:
 * 1. Converts prices to % returns
 * 2. Provides the appropriate lagged returns based on model requirements
 * 3. Predicts next % return
 * 4. Converts predicted % return back to absolute price
 */
export function executeInference(
  historicalData: PriceData[],
  inferenceFunction: (input: any) => number,
  targetField: string = 'close'
): Prediction[] {
  const predictions: Prediction[] = [];
  
  // Calculate all percentage returns first
  const returns: number[] = [];
  for (let i = 1; i < historicalData.length; i++) {
    const prevPrice = historicalData[i - 1][targetField as keyof PriceData] as number;
    const currentPrice = historicalData[i][targetField as keyof PriceData] as number;
    const percentReturn = ((currentPrice / prevPrice) - 1) * 100;
    returns.push(percentReturn);
  }
  
  // We need at least 3 returns to make predictions with MLR (2 lags + 1 to predict)
  // For SLR we only need 2 returns (1 lag + 1 to predict)
  const minReturns = 3; // Support both SLR and MLR
  
  if (returns.length < minReturns) {
    console.warn(`Not enough data: need at least ${minReturns} returns, got ${returns.length}`);
    return predictions;
  }
  
  // Start from index 3 in historicalData (corresponds to returns[2])
  // This gives us returns[0] and returns[1] as lags
  for (let i = minReturns; i < historicalData.length; i++) {
    const current = historicalData[i];
    const previous = historicalData[i - 1];
    const returnIndex = i - 1; // Index in returns array
    
    try {
      // Prepare input with lagged returns
      // Try to provide both t-1 and t-2 lags for compatibility with both SLR and MLR
      const input: any = {
        date: current.date
      };
      
      // Add lagged returns (t-1, t-2)
      if (returnIndex >= 1) {
        input['return_t-1'] = returns[returnIndex - 1];
      }
      if (returnIndex >= 2) {
        input['return_t-2'] = returns[returnIndex - 2];
      }
      
      // For SLR compatibility, also provide the simple 'close' field
      input[targetField] = returns[returnIndex - 1];
      
      // Model predicts the NEXT percentage return
      const predictedReturn = inferenceFunction(input);
      
      // Debug: Log first few predictions
      if (i === minReturns) {
        console.log('First prediction:', {
          date: current.date,
          return_t_minus_2: input['return_t-2'],
          return_t_minus_1: input['return_t-1'],
          predictedReturn,
          currentActual: current[targetField as keyof PriceData] as number
        });
      }
      
      // Convert predicted % return back to absolute price
      // predicted_price = previous_price * (1 + predicted_return / 100)
      const previousPrice = previous[targetField as keyof PriceData] as number;
      const predictedPrice = previousPrice * (1 + predictedReturn / 100);
      
      const actual = current[targetField as keyof PriceData] as number;
      const error = actual - predictedPrice;
      const percentError = Math.abs(error / actual) * 100;
      
      predictions.push({
        date: current.date,
        actual,
        predicted: predictedPrice,
        error,
        percentError
      });
    } catch (error) {
      console.error(`Inference failed for date ${current.date}:`, error);
      // Skip this prediction but continue
    }
  }
  
  return predictions;
}

/**
 * Calculate performance metrics from predictions
 */
export function calculateMetrics(predictions: Prediction[]): PerformanceMetrics {
  if (predictions.length === 0) {
    return {
      mape: 0,
      rmse: 0,
      mae: 0,
      directionalAccuracy: 0,
      sampleSize: 0
    };
  }
  
  // MAPE: Mean Absolute Percentage Error
  const mape = predictions.reduce((sum, p) => sum + p.percentError, 0) / predictions.length;
  
  // RMSE: Root Mean Squared Error
  const mse = predictions.reduce((sum, p) => sum + p.error * p.error, 0) / predictions.length;
  const rmse = Math.sqrt(mse);
  
  // MAE: Mean Absolute Error
  const mae = predictions.reduce((sum, p) => sum + Math.abs(p.error), 0) / predictions.length;
  
  // Directional Accuracy: % of correct up/down predictions
  let correctDirections = 0;
  for (let i = 1; i < predictions.length; i++) {
    const actualDirection = predictions[i].actual > predictions[i - 1].actual ? 1 : -1;
    const predictedDirection = predictions[i].predicted > predictions[i - 1].predicted ? 1 : -1;
    if (actualDirection === predictedDirection) {
      correctDirections++;
    }
  }
  const directionalAccuracy = (correctDirections / (predictions.length - 1)) * 100;
  
  return {
    mape,
    rmse,
    mae,
    directionalAccuracy,
    sampleSize: predictions.length
  };
}

/**
 * Calculate rolling window metrics
 * Returns metrics for different time windows (20d, 60d, 120d, etc.)
 */
export function calculateRollingMetrics(
  predictions: Prediction[],
  windows: number[] = [20, 60, 120, 240, 480]
): Map<number, PerformanceMetrics> {
  const rollingMetrics = new Map<number, PerformanceMetrics>();
  
  for (const window of windows) {
    if (predictions.length >= window) {
      // Take most recent N predictions
      const recentPredictions = predictions.slice(-window);
      const metrics = calculateMetrics(recentPredictions);
      rollingMetrics.set(window, metrics);
    }
  }
  
  return rollingMetrics;
}

/**
 * Main function to run complete inference pipeline
 */
export async function runLocalInference(
  s3ScriptPath: string,
  s3ParametersPath: string,
  historicalData: PriceData[],
  targetField: string = 'close'
): Promise<{
  predictions: Prediction[];
  overallMetrics: PerformanceMetrics;
  rollingMetrics: Map<number, PerformanceMetrics>;
}> {
  console.log('Starting local inference pipeline...');
  console.log(`  Data points: ${historicalData.length}`);
  console.log(`  Target field: ${targetField}`);
  
  // 1. Load model parameters
  const parameters = await loadModelParameters(s3ParametersPath);
  console.log('  ✓ Parameters loaded');
  
  // 2. Load and prepare inference function
  const inferenceFunction = await loadInferenceScript(s3ScriptPath, parameters);
  console.log('  ✓ Inference script loaded');
  
  // 3. Execute inference
  const predictions = executeInference(historicalData, inferenceFunction, targetField);
  console.log(`  ✓ Generated ${predictions.length} predictions`);
  
  // 4. Calculate metrics
  const overallMetrics = calculateMetrics(predictions);
  const rollingMetrics = calculateRollingMetrics(predictions);
  console.log('  ✓ Metrics calculated');
  console.log(`  Overall MAPE: ${overallMetrics.mape.toFixed(2)}%`);
  
  return {
    predictions,
    overallMetrics,
    rollingMetrics
  };
}
