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

async function checkScaffolds() {
  const result = await client.send(new ScanCommand({
    TableName: 'ChasingProphets-ModelScaffolds'
  }));

  if (result.Items) {
    console.log('Scaffold records:\n');
    result.Items.forEach(item => {
      const scaffold = unmarshall(item);
      console.log(`Scaffold: ${scaffold.name} (${scaffold.scaffoldId})`);
      console.log(`  s3TrainingScriptPath: ${scaffold.s3TrainingScriptPath || 'MISSING'}`);
      console.log(`  s3LocalInferenceScriptPath: ${scaffold.s3LocalInferenceScriptPath || 'MISSING'}`);
      console.log(`  s3RemoteInferenceScriptPath: ${scaffold.s3RemoteInferenceScriptPath || 'MISSING'}`);
      console.log('');
    });
  }
}

checkScaffolds();
