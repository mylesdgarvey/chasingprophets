#!/usr/bin/env tsx
/**
 * Create Prophets from Trained Model Fits
 * Phase 4G: Generate prophet records for all trained model fits
 */

import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const region = process.env.AWS_REGION || 'us-east-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID!;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!;

const ddbClient = new DynamoDBClient({
  region,
  credentials: { accessKeyId, secretAccessKey }
});
const ddb = DynamoDBDocumentClient.from(ddbClient);

const s3 = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey }
});

const BUCKET = 'chasingprophets-models-us-east-1';

interface Prophet {
  prophetId: string;
  prophetName: string;
  description: string;
  assetId: string;
  modelFitIds: string[];
  ensembleMethod: 'single' | 'average' | 'weighted_average';
  targetProperty: string;
  s3OutputTransformScriptPath: string;
  forecastMethod: 'direct' | 'recursive';
  status: 'active' | 'pending_training' | 'inactive';
  createdAt: string;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  PHASE 4G: CREATE PROPHETS FROM TRAINED MODEL FITS        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // 1. Scan for all trained model fits
  console.log('🔍 Scanning for trained model fits...');
  const scan = await ddbClient.send(new ScanCommand({
    TableName: 'ChasingProphets-ModelFits',
    FilterExpression: 'trainingStatus = :status',
    ExpressionAttributeValues: {
      ':status': { S: 'fit' }
    }
  }));

  const modelFits = scan.Items || [];
  console.log(`✓ Found ${modelFits.length} trained model fits\n`);

  if (modelFits.length === 0) {
    console.log('⚠️  No trained model fits found. Run training first.\n');
    return;
  }

  // 2. Create prophets
  console.log('🔮 Creating prophets...\n');

  let created = 0;
  for (const fit of modelFits) {
    const modelFitId = fit.modelFitId?.S!;
    const scaffoldId = fit.scaffoldId?.S!;
    const dataSliceId = fit.dataSliceId?.S!;
    const assetId = fit.assetId?.S!;

    const prophetId = randomUUID();

    // Create default output_transform script
    const outputTransformScript = `// Default output_transform for prophet ${prophetId}
module.exports = async function output_transform(predictions, context = {}) {
  // predictions may be an array or scalar; default behavior: passthrough
  return predictions;
};
`;

    const s3Key = `scripts/prophets/${prophetId}/output_transform.js`;
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      Body: outputTransformScript,
      ContentType: 'application/javascript'
    }));

    const s3OutputPath = `s3://${BUCKET}/${s3Key}`;

    // Create prophet record
    const prophet: Prophet = {
      prophetId,
      prophetName: `${scaffoldId}-${assetId}-${dataSliceId}`,
      description: `${scaffoldId} trained on ${assetId} (${dataSliceId})`,
      assetId,
      modelFitIds: [modelFitId],  // Array with single fit
      ensembleMethod: 'single',
      targetProperty: 'close',
      s3OutputTransformScriptPath: s3OutputPath,
      forecastMethod: 'direct',
      status: 'active',  // Active since model is trained
      createdAt: new Date().toISOString()
    };

    await ddb.send(new PutCommand({
      TableName: 'ChasingProphets-Prophets',
      Item: prophet
    }));

    created++;
    if (created % 50 === 0) {
      console.log(`  Created ${created} prophets...`);
    }
  }

  console.log(`\n✅ Created ${created} prophets\n`);
  console.log('Next steps:');
  console.log('  - Phase 4H: Test inference with prophets');
  console.log('  - Verify prophets in DynamoDB');
  console.log('  - Check S3 for output_transform scripts\n');
}

main().catch(console.error);
