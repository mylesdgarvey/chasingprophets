#!/usr/bin/env tsx
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient({
  region: process.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || ''
  }
});

async function checkModelFit() {
  const result = await client.send(new ScanCommand({
    TableName: 'ChasingProphets-ModelFits',
    Limit: 3
  }));

  if (result.Items) {
    console.log('Sample ModelFit records:\n');
    result.Items.forEach(item => {
      const fit = unmarshall(item);
      console.log(`ModelFit ID: ${fit.modelFitId}`);
      console.log(`  scaffoldId: ${fit.scaffoldId}`);
      console.log(`  trainingStatus: ${fit.trainingStatus}`);
      console.log(`  modelParametersPath: ${fit.modelParametersPath || 'MISSING'}`);
      console.log(`  s3LocalInferenceScriptPath: ${fit.s3LocalInferenceScriptPath || 'MISSING'}`);
      console.log(`  s3RemoteInferenceScriptPath: ${fit.s3RemoteInferenceScriptPath || 'MISSING'}`);
      console.log('');
    });
  }
}

checkModelFit();
