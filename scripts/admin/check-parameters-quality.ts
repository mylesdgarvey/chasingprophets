#!/usr/bin/env tsx
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const REGION = process.env.VITE_AWS_REGION || 'us-east-1';
const BUCKET = `chasingprophets-models-${REGION}`;

const dynamodb = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || ''
  }
});

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || ''
  }
});

async function checkModelFits() {
  // Get all model fits
  const result = await dynamodb.send(new ScanCommand({
    TableName: 'ChasingProphets-ModelFits'
  }));

  if (!result.Items) return;

  const fits = result.Items.map(item => unmarshall(item));
  
  let withValidParams = 0;
  let missingParams = 0;
  let emptyParams = 0;

  console.log('Checking model fit parameters...\n');

  for (const fit of fits.slice(0, 10)) {
    if (!fit.modelParametersPath) {
      console.log(`${fit.modelFitId}: NO PATH`);
      missingParams++;
      continue;
    }

    // Try to load parameters from S3
    try {
      const s3Path = fit.modelParametersPath;
      const match = s3Path.match(/^s3:\/\/([^/]+)\/(.+)$/);
      if (!match) continue;

      const [, bucket, key] = match;
      const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
      const response = await s3.send(cmd);
      const content = await response.Body?.transformToString();
      
      if (content) {
        const params = JSON.parse(content);
        console.log(`${fit.modelFitId}:`);
        console.log(`  Model type: ${params.model_type}`);
        console.log(`  Sample size: ${params.sample_size}`);
        
        if (params.parameters) {
          if (params.parameters.slope !== undefined) {
            console.log(`  Slope: ${params.parameters.slope}`);
            console.log(`  Intercept: ${params.parameters.intercept}`);
          } else if (params.parameters.coefficients !== undefined) {
            console.log(`  Coefficients: ${JSON.stringify(params.parameters.coefficients)}`);
            console.log(`  Intercept: ${params.parameters.intercept}`);
          }
        }
        
        if (params.metrics) {
          console.log(`  R²: ${params.metrics.r2?.toFixed(4)}`);
          console.log(`  MAPE: ${params.metrics.mape?.toFixed(2)}%`);
        }
        console.log('');
        
        withValidParams++;
      }
    } catch (error: any) {
      console.log(`${fit.modelFitId}: ERROR - ${error.message}`);
      emptyParams++;
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log(`Total fits checked: ${Math.min(10, fits.length)}`);
  console.log(`Valid parameters: ${withValidParams}`);
  console.log(`Missing path: ${missingParams}`);
  console.log(`S3 errors: ${emptyParams}`);
  console.log('═══════════════════════════════════════');
}

checkModelFits();
