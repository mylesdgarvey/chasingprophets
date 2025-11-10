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
  console.log('✓ Script loaded, length:', scriptContent.length, 'First line:', scriptContent.split('\n')[0]);
  
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
    
    // Extract the actual parameters (handle both flat and nested structures)
    const modelParams = parameters.parameters || parameters;
    
    // Return wrapped function for single prediction
    return (input: any) => {
      try {
        // Call predict function with correct signature: predict(data, parameters)
        // The inference scripts expect data as an array, so wrap single input in array
        const result = predictFunction([input], modelParams);
        
        // Handle different return types
        if (typeof result === 'number') {
          return result;
        } else if (Array.isArray(result) && result.length > 0) {
          // If it returns an array, get first element
          const val = result[0];
          if (typeof val === 'number') return val;
          // If array of objects, extract predicted value
          const outputField = modelParams.output_field || 'close';
          return val[`${outputField}_pred`] || val.predicted || val;
        } else if (typeof result === 'object' && result !== null) {
          // If it returns an object, extract prediction
          const outputField = modelParams.output_field || 'close';
          return result[`${outputField}_pred`] || result.predicted || result.value;
        }
        
        throw new Error(`Unexpected prediction result type: ${typeof result}`);
      } catch (err) {
        throw new Error(`Prediction error: ${err instanceof Error ? err.message : err}`);
      }
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
 * The models are trained on actual price data (OHLCV),
 * so we pass the price data directly to the inference function.
 */
export function executeInference(
  historicalData: PriceData[],
  inferenceFunction: (input: any) => number,
  targetField: string = 'close'
): Prediction[] {
  const predictions: Prediction[] = [];
  
  // We need at least 2 data points to make a prediction
  // (use current data to predict next value)
  if (historicalData.length < 2) {
    console.warn(`Not enough data: need at least 2 points, got ${historicalData.length}`);
    return predictions;
  }
  
  // For each data point (except the last), predict the next value
  for (let i = 0; i < historicalData.length - 1; i++) {
    const current = historicalData[i];
    const next = historicalData[i + 1];
    
    try {
      // Pass the current data point to the inference function
      // Models expect: { date, open, high, low, close, volume }
      const input = {
        date: current.date,
        open: current.open,
        high: current.high,
        low: current.low,
        close: current.close,
        volume: current.volume
      };
      
      // Model predicts the next close price
      const predictedPrice = inferenceFunction(input);
      
      if (predictedPrice === null || isNaN(predictedPrice)) {
        console.warn(`Invalid prediction at index ${i}:`, predictedPrice);
        continue;
      }
      
      // The actual next price
      const actualPrice = next[targetField as keyof PriceData] as number;
      
      predictions.push({
        date: next.date,
        actual: actualPrice,
        predicted: predictedPrice,
        error: Math.abs(actualPrice - predictedPrice),
        percentError: Math.abs((actualPrice - predictedPrice) / actualPrice) * 100
      });
    } catch (error) {
      console.error(`Prediction error at index ${i}:`, error);
      // Continue with next prediction
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
