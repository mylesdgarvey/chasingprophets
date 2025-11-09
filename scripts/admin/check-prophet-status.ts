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
  // Count by status
  const statuses = ['active', 'pending_training', 'inactive', 'failed'];
  const counts: Record<string, number> = {};
  
  for (const status of statuses) {
    const result = await client.send(new ScanCommand({
      TableName: 'ChasingProphets-Prophets',
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': { S: status }
      }
    }));
    counts[status] = result.Count || 0;
  }
  
  console.log('Prophet Status Summary:');
  console.log('═══════════════════════════');
  Object.entries(counts).forEach(([status, count]) => {
    console.log(`  ${status.padEnd(20)}: ${count}`);
  });
  console.log('═══════════════════════════');
  console.log(`  Total: ${Object.values(counts).reduce((a, b) => a + b, 0)}`);
  
  // Show sample
  const sampleResult = await client.send(new ScanCommand({
    TableName: 'ChasingProphets-Prophets',
    Limit: 3
  }));
  
  if (sampleResult.Items) {
    console.log('\nSample Prophets:');
    sampleResult.Items.forEach(item => {
      const prophet = unmarshall(item);
      console.log(`\n  ${prophet.prophetName}`);
      console.log(`    ID: ${prophet.prophetId}`);
      console.log(`    Status: ${prophet.status}`);
      console.log(`    Asset: ${prophet.assetId}`);
      console.log(`    Model Fits: ${(prophet.modelFitIds || []).length}`);
    });
  }
}

checkStatus();
