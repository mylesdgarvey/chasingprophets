#!/usr/bin/env ts-node
/**
 * Verify Scaffolds
 * Simple script to verify scaffolds can be read from DynamoDB
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const REGION = process.env.VITE_AWS_REGION || "us-east-1";

const client = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || ''
  }
});
const ddb = DynamoDBDocumentClient.from(client);

async function verifyScaffolds() {
  console.log("Verifying scaffolds in DynamoDB...\n");

  const command = new ScanCommand({
    TableName: "ChasingProphets-ModelScaffolds"
  });

  const response = await ddb.send(command);
  const scaffolds = response.Items || [];

  console.log(`Found ${scaffolds.length} scaffold(s):\n`);

  scaffolds.forEach(scaffold => {
    console.log(`📋 ${scaffold.scaffoldId} - ${scaffold.name}`);
    console.log(`   Category: ${scaffold.modelMajorCategory} / ${scaffold.modelCategory}`);
    console.log(`   Inference Mode: ${scaffold.inferenceMode}`);
    console.log(`   Contextualized: ${scaffold.isContextualized}`);
    console.log(`   Input Contract: ${scaffold.inputContract?.length || 0} field(s)`);
    scaffold.inputContract?.forEach((field: any) => {
      console.log(`     - ${field.name} (${field.type})${field.required ? ' *required' : ''}`);
    });
    console.log(`   Output Contract: ${scaffold.outputContract?.length || 0} field(s)`);
    scaffold.outputContract?.forEach((field: any) => {
      console.log(`     - ${field.name} (${field.type})${field.required ? ' *required' : ''}`);
    });
    console.log(`   Scripts:`);
    console.log(`     - Training: ${scaffold.s3TrainingScriptPath}`);
    console.log(`     - Remote Inference: ${scaffold.s3RemoteInferenceScriptPath}`);
    console.log(`     - Local Inference: ${scaffold.s3LocalInferenceScriptPath || 'N/A'}`);
    console.log();
  });

  console.log("✓ Verification complete!");
}

verifyScaffolds().catch(error => {
  console.error("Error:", error);
  process.exit(1);
});
