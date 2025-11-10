#!/usr/bin/env node
/**
 * Delete all existing prophets from DynamoDB
 * Use before re-running orchestrator with new schema
 */

import { DynamoDBClient, ScanCommand, BatchWriteItemCommand } from '@aws-sdk/client-dynamodb';

const TABLE_NAME = 'ChasingProphets-Prophets';
const REGION = process.env.VITE_AWS_REGION || 'us-east-1';

const dynamoDb = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || ''
  }
});

async function deleteAllProphets(): Promise<void> {
  console.log('🔍 Scanning for existing prophets...');
  
  let deletedCount = 0;
  let lastEvaluatedKey: Record<string, any> | undefined;
  
  do {
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      ProjectionExpression: 'prophetId',
      ExclusiveStartKey: lastEvaluatedKey,
    });
    
    const scanResult = await dynamoDb.send(scanCommand);
    
    if (!scanResult.Items || scanResult.Items.length === 0) {
      break;
    }
    
    // Batch delete in chunks of 25 (DynamoDB limit)
    const chunks: any[][] = [];
    for (let i = 0; i < scanResult.Items.length; i += 25) {
      chunks.push(scanResult.Items.slice(i, i + 25));
    }
    
    for (const chunk of chunks) {
      const deleteRequests = chunk.map(item => ({
        DeleteRequest: {
          Key: {
            prophetId: item.prophetId,
          },
        },
      }));
      
      const batchWriteCommand = new BatchWriteItemCommand({
        RequestItems: {
          [TABLE_NAME]: deleteRequests,
        },
      });
      
      await dynamoDb.send(batchWriteCommand);
      deletedCount += deleteRequests.length;
      console.log(`🗑️  Deleted ${deletedCount} prophets...`);
    }
    
    lastEvaluatedKey = scanResult.LastEvaluatedKey;
  } while (lastEvaluatedKey);
  
  console.log(`✅ Deleted ${deletedCount} total prophets`);
}

// Execute
deleteAllProphets()
  .then(() => {
    console.log('✅ Prophet deletion complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error deleting prophets:', error);
    process.exit(1);
  });
