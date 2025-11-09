#!/usr/bin/env ts-node
/**
 * Initialize Model Scaffolds
 * Creates SLR and MLR scaffolds with contract-based architecture
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { CreateModelScaffoldInput } from "../src/types/modelScaffold";

const REGION = process.env.VITE_AWS_REGION || "us-east-1";
const BUCKET = process.env.VITE_S3_MODELS_BUCKET || "chasingprophets-models-us-east-1";

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || ''
  }
});
const ddb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "ChasingProphets-ModelScaffolds";

/**
 * Define the SLR (Simple Linear Regression) scaffold
 */
const SLR_SCAFFOLD: CreateModelScaffoldInput = {
  scaffoldId: "SLR",
  name: "Simple Linear Regression",
  description: "Simple linear regression model (y = mx + b). Predicts a single output from a single input feature using least squares fitting.",
  modelMajorCategory: "econometrics",
  modelCategory: "linear_regression",
  
  // Contract-based architecture
  isContextualized: false,
  inputContract: [
    {
      name: "x",
      type: "numerical",
      required: true,
      description: "Input feature (independent variable)"
    }
  ],
  outputContract: [
    {
      name: "y",
      type: "numerical",
      required: true,
      description: "Output target (dependent variable)"
    }
  ],
  
  // Inference configuration
  inferenceMode: "hybrid", // Supports both local (browser) and remote (Lambda)
  
  // S3 script paths
  s3TrainingScriptPath: `s3://${BUCKET}/models/scaffolds/slr/train.py`,
  s3RemoteInferenceScriptPath: `s3://${BUCKET}/models/scaffolds/slr/inference.py`,
  s3LocalInferenceScriptPath: `s3://${BUCKET}/models/scaffolds/slr/inference.js`
};

/**
 * Define the MLR (Multiple Linear Regression) scaffold
 */
const MLR_SCAFFOLD: CreateModelScaffoldInput = {
  scaffoldId: "MLR",
  name: "Multiple Linear Regression",
  description: "Multiple linear regression model (y = b0 + b1*x1 + b2*x2 + ... + bn*xn). Predicts a single output from multiple input features using the normal equation.",
  modelMajorCategory: "econometrics",
  modelCategory: "linear_regression",
  
  // Contract-based architecture
  isContextualized: false,
  inputContract: [
    {
      name: "open",
      type: "numerical",
      required: true,
      description: "Opening price"
    },
    {
      name: "high",
      type: "numerical",
      required: true,
      description: "Highest price"
    },
    {
      name: "low",
      type: "numerical",
      required: true,
      description: "Lowest price"
    },
    {
      name: "volume",
      type: "numerical",
      required: true,
      description: "Trading volume"
    }
  ],
  outputContract: [
    {
      name: "close",
      type: "numerical",
      required: true,
      description: "Closing price (target variable)"
    }
  ],
  
  // Inference configuration
  inferenceMode: "hybrid", // Supports both local (browser) and remote (Lambda)
  
  // S3 script paths
  s3TrainingScriptPath: `s3://${BUCKET}/models/scaffolds/mlr/train.py`,
  s3RemoteInferenceScriptPath: `s3://${BUCKET}/models/scaffolds/mlr/inference.py`,
  s3LocalInferenceScriptPath: `s3://${BUCKET}/models/scaffolds/mlr/inference.js`
};

const SCAFFOLDS = [SLR_SCAFFOLD, MLR_SCAFFOLD];

/**
 * Create or update a scaffold in DynamoDB
 */
async function createScaffold(scaffold: CreateModelScaffoldInput): Promise<void> {
  const item = {
    ...scaffold,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: item
  });

  await ddb.send(command);
  console.log(`✓ Created scaffold: ${scaffold.scaffoldId} - ${scaffold.name}`);
}

/**
 * Main function
 */
async function main() {
  console.log("Initializing Model Scaffolds...");
  console.log(`Table: ${TABLE_NAME}`);
  console.log(`Region: ${REGION}`);
  console.log(`S3 Bucket: ${BUCKET}\n`);

  for (const scaffold of SCAFFOLDS) {
    try {
      await createScaffold(scaffold);
    } catch (error) {
      console.error(`✗ Failed to create scaffold ${scaffold.scaffoldId}:`, error);
      process.exit(1);
    }
  }

  console.log("\n✓ All scaffolds initialized successfully!");
  console.log("\nScaffold Summary:");
  SCAFFOLDS.forEach(s => {
    console.log(`\n${s.scaffoldId} - ${s.name}`);
    console.log(`  Input fields: ${s.inputContract.map(f => f.name).join(", ")}`);
    console.log(`  Output fields: ${s.outputContract.map(f => f.name).join(", ")}`);
    console.log(`  Inference mode: ${s.inferenceMode}`);
    console.log(`  Training script: ${s.s3TrainingScriptPath}`);
  });
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
