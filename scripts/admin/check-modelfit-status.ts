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

async function checkStatus() {
  const result = await client.send(new ScanCommand({
    TableName: 'ChasingProphets-ModelFits',
    Limit: 10
  }));

  if (result.Items) {
    console.log(`Found ${result.Count} model fits (showing first 10):\n`);
    result.Items.forEach(item => {
      const fit = unmarshall(item);
      console.log(`  ${fit.modelFitId}`);
      console.log(`    Scaffold: ${fit.scaffoldId}`);
      console.log(`    Status: ${fit.trainingStatus || 'N/A'}`);
      console.log('');
    });
  }
  
  // Count all with trainingStatus = 'unfit'
  const unfitResult = await client.send(new ScanCommand({
    TableName: 'ChasingProphets-ModelFits',
    FilterExpression: 'trainingStatus = :unfit',
    ExpressionAttributeValues: {
      ':unfit': { S: 'unfit' }
    }
  }));
  
  console.log(`\nTotal unfit model fits: ${unfitResult.Count}`);
}

checkStatus();
