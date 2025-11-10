import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getProphet, updateProphetPerformance } from '../services/prophet';
import { getModelFit } from '../services/modelFit';
import { getAssetPrices } from '../services/assets';

const REGION = process.env.VITE_AWS_REGION || 'us-east-1';
const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || ''
  }
});

function parseS3Path(s3Path: string) {
  if (!s3Path.startsWith('s3://')) throw new Error('Invalid S3 path: ' + s3Path);
  const parts = s3Path.replace('s3://', '').split('/');
  const bucket = parts.shift() || '';
  const key = parts.join('/');
  return { bucket, key };
}

async function getJsonFromS3(s3Path: string): Promise<any> {
  const { bucket, key } = parseS3Path(s3Path);
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const res = await s3.send(cmd);
  if (!res.Body) throw new Error('Empty S3 object: ' + s3Path);
  const text = await (res.Body as any).transformToString();
  return JSON.parse(text);
}

async function getScriptFromS3(s3Path: string): Promise<string> {
  const { bucket, key } = parseS3Path(s3Path);
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const res = await s3.send(cmd);
  if (!res.Body) throw new Error('Empty S3 object: ' + s3Path);
  const text = await (res.Body as any).transformToString();
  return text;
}

/**
 * Safely load a CommonJS module from string and return module.exports
 */
function loadCommonJsModule(code: string): any {
  const module: any = { exports: {} };
  const fn = new Function('module', 'exports', code);
  fn(module, module.exports);
  return module.exports;
}

function calculateRMSE(actual: number[], predicted: number[]) {
  if (!actual || !predicted || actual.length !== predicted.length) return NaN;
  const n = actual.length;
  const sum = actual.reduce((acc, a, i) => acc + Math.pow(a - predicted[i], 2), 0);
  return Math.sqrt(sum / n);
}

function calculateMAPE(actual: number[], predicted: number[]) {
  if (!actual || !predicted || actual.length !== predicted.length) return NaN;
  const n = actual.length;
  const sum = actual.reduce((acc, a, i) => acc + Math.abs((a - predicted[i]) / (a || 1)), 0);
  return sum / n;
}

function calculateDirectionalAccuracy(actual: number[], predicted: number[]) {
  if (!actual || !predicted || actual.length !== predicted.length) return NaN;
  let correct = 0;
  for (let i = 1; i < actual.length; i++) {
    const actualDelta = actual[i] - actual[i - 1];
    const predDelta = predicted[i] - predicted[i - 1];
    if ((actualDelta >= 0 && predDelta >= 0) || (actualDelta < 0 && predDelta < 0)) correct++;
  }
  return correct / (actual.length - 1);
}

/** Combine model outputs according to ensemble method
 * Assumes each modelOutput is an array of numeric values (aligned)
 */
function combineModelOutputs(outputs: number[][], method: string, weights?: number[]) {
  if (!outputs || outputs.length === 0) return [];
  const n = outputs[0].length;
  const result: number[] = new Array(n).fill(0);

  if (method === 'single' || outputs.length === 1) return outputs[0];

  if (method === 'average') {
    for (let i = 0; i < n; i++) {
      let s = 0;
      for (const out of outputs) s += out[i];
      result[i] = s / outputs.length;
    }
    return result;
  }

  if (method === 'weighted_average') {
    const w = weights || outputs.map(() => 1 / outputs.length);
    for (let i = 0; i < n; i++) {
      let s = 0;
      for (let j = 0; j < outputs.length; j++) s += outputs[j][i] * w[j];
      result[i] = s;
    }
    return result;
  }

  // fallback to average
  return combineModelOutputs(outputs, 'average');
}

/**
 * Run inference for a single prophet over a single window (days)
 * Returns { predictions, actual, metrics }
 */
export async function runProphetInferenceWindow(prophetId: string, windowDays: number) {
  const prophet = await getProphet(prophetId);
  if (!prophet) throw new Error('Prophet not found: ' + prophetId);

  // Fetch asset prices (we need windowDays + 1 for lagged inputs)
  const allPrices = await getAssetPrices(prophet.assetId);
  if (!allPrices || allPrices.length < windowDays + 1) {
    throw new Error('Insufficient asset data for window ' + windowDays);
  }
  const inputData = allPrices.slice(- (windowDays + 1)); // last N+1 rows

  // For each model fit: download params and inference script and run
  const modelOutputs: number[][] = [];
  for (const mfId of prophet.modelFitIds) {
    const modelFit = await getModelFit(mfId);
    if (!modelFit) throw new Error('ModelFit not found: ' + mfId);

    const params = await getJsonFromS3(modelFit.modelParametersPath);
    const scriptText = await getScriptFromS3(modelFit.s3RemoteInferenceScriptPath);
    const mod = loadCommonJsModule(scriptText);

    if (typeof mod.predict !== 'function') throw new Error('Inference script does not export predict');

    // Prepare model input (we assume inference script expects array of input rows)
    const modelInput = inputData.slice(0, -1).map(r => ({ x: r.close }));

    const modelOut = mod.predict(modelInput, params);

    // Normalize modelOut to array of numbers (assuming mod.predict returns array of objects or numbers)
    const numericOut: number[] = Array.isArray(modelOut)
      ? modelOut.map((v: any) => (typeof v === 'number' ? v : (v.y_pred ?? v.pred ?? Number(v))))
      : [];

    modelOutputs.push(numericOut);
  }

  // Combine outputs using prophet.ensembleMethod
  const combined = combineModelOutputs(modelOutputs, prophet.ensembleMethod || 'single', prophet.ensembleWeights);

  // Apply output transform
  const outputTransformText = await getScriptFromS3(prophet.s3OutputTransformScriptPath);
  const outMod = loadCommonJsModule(outputTransformText);
  if (typeof outMod !== 'function' && typeof outMod.output_transform !== 'function') {
    // support module.exports = async function output_transform(...) {}
    if (typeof outMod !== 'function') {
      // try module.exports.output_transform
      // continue
    }
  }

  const outputFunc = (typeof outMod === 'function') ? outMod : outMod.output_transform;
  const lastActualPrice = inputData[inputData.length - 1].close;
  const predictions = await outputFunc(combined, { lastActualPrice });

  // Compute actuals (aligned) — we use inputData.slice(1).map(close)
  const actual = inputData.slice(1).map(r => r.close);

  const rmse = calculateRMSE(actual, predictions as number[]);
  const mape = calculateMAPE(actual, predictions as number[]);
  const dirAcc = calculateDirectionalAccuracy(actual, predictions as number[]);

  const metrics = { rmse, mape, r2: NaN, directionalAccuracy: dirAcc, backtestPeriod: { start: inputData[0].date, end: inputData[inputData.length - 1].date } };

  // Update Prophet performance in DB (server-side daily job will call this)
  await updateProphetPerformance(prophetId, metrics);

  return {
    predictions,
    actual,
    metrics
  };
}

/**
 * Run multiple windows for a prophet (helper for UI/server)
 */
export async function runProphetInferenceMultiWindow(prophetId: string) {
  const windows = [5, 20, 60, 120, 240, 480, 1200, 2400];
  const results: any[] = [];
  for (const w of windows) {
    try {
      const res = await runProphetInferenceWindow(prophetId, w);
      results.push({ window: w, ...res });
    } catch (err) {
      if (err instanceof Error) {
        console.warn(`Window ${w} failed:`, err.message);
      } else {
        console.warn(`Window ${w} failed:`, String(err));
      }
    }
  }
  return results;
}
