#!/usr/bin/env tsx
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const region = process.env.AWS_REGION || 'us-east-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID!;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!;

const ddbClient = new DynamoDBClient({
  region,
  credentials: { accessKeyId, secretAccessKey }
});
const ddb = DynamoDBDocumentClient.from(ddbClient);

async function main() {
  console.log('Creating prophets for UNTRAINED model fits (pending status)...\n');

  const scan = await ddbClient.send(new ScanCommand({
    TableName: 'ChasingProphets-ModelFits'
  }));

  const modelFits = scan.Items || [];
  console.log(`Found ${modelFits.length} model fits\n`);

  let created = 0;
  for (const fit of modelFits) {
    const modelFitId = fit.modelFitId?.S!;
    const scaffoldId = fit.scaffoldId?.S!;
    const dataSliceId = fit.dataSliceId?.S!;
    const assetId = 'DJIA';

    const prophetId = randomUUID();

    const prophet = {
      prophetId,
      prophetName: `${scaffoldId}-${dataSliceId}`,
      description: `${scaffoldId} model for DJIA using ${dataSliceId}`,
      assetId,
      modelFitIds: [modelFitId],
      ensembleMethod: 'single',
      targetProperty: 'close',
      s3OutputTransformScriptPath: `s3://chasingprophets-models-us-east-1/scripts/prophets/${prophetId}/output_transform.js`,
      forecastMethod: 'direct',
      status: 'pending_training',
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

  console.log(`\n✓ Created ${created} prophets (all status='pending_training')\n`);
}

main().catch(console.error);
