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

async function checkParameters() {
  const result = await client.send(new ScanCommand({
    TableName: 'ChasingProphets-ModelFits'
  }));

  if (result.Items) {
    let withParams = 0;
    let withoutParams = 0;
    
    result.Items.forEach(item => {
      const fit = unmarshall(item);
      if (fit.modelParametersPath) {
        withParams++;
      } else {
        withoutParams++;
      }
    });
    
    console.log(`ModelFits with parameters: ${withParams}`);
    console.log(`ModelFits WITHOUT parameters: ${withoutParams}`);
    console.log(`Total: ${result.Count}`);
  }
}

checkParameters();
