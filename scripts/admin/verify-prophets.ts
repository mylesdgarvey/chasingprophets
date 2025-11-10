#!/usr/bin/env node
/**
 * Verify prophet schema after migration
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const REGION = process.env.VITE_AWS_REGION || 'us-east-1';

const ddbClient = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || ''
  }
});
const ddb = DynamoDBDocumentClient.from(ddbClient);

async function verifyProphets(): Promise<void> {
  console.log('🔍 Scanning prophets...\n');
  
  const scanCommand = new ScanCommand({
    TableName: 'ChasingProphets-Prophets',
    Limit: 5, // Just sample first 5
  });
  
  const result = await ddb.send(scanCommand);
  
  if (!result.Items || result.Items.length === 0) {
    console.log('❌ No prophets found');
    return;
  }
  
  console.log(`📊 Found ${result.Count} prophets (sampling first 5):\n`);
  
  result.Items.forEach((prophet, index) => {
    console.log(`Prophet ${index + 1}:`);
    console.log(`  prophetId: ${prophet.prophetId}`);
    console.log(`  prophetName: ${prophet.prophetName}`);
    console.log(`  assetId: ${prophet.assetId}`);
    console.log(`  modelFitId: ${prophet.modelFitId}`);
    console.log(`  targetProperty: ${prophet.targetProperty}`);
    console.log(`  s3OutputTransformScriptPath: ${prophet.s3OutputTransformScriptPath}`);
    console.log(`  s3InputTransformScriptPath: ${prophet.s3InputTransformScriptPath || '(none)'}`);
    console.log(`  forecastMethod: ${prophet.forecastMethod}`);
    console.log(`  status: ${prophet.status}`);
    console.log(`  createdAt: ${prophet.createdAt}`);
    console.log('');
  });
  
  // Check for old schema fields
  const hasOldSchema = result.Items.some(p => 
    'modelFitIds' in p || 'isActive' in p || 'lastUpdated' in p
  );
  
  if (hasOldSchema) {
    console.log('⚠️  WARNING: Some prophets still have old schema fields!');
  } else {
    console.log('✅ All sampled prophets use new schema');
  }
}

verifyProphets()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
