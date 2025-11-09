#!/usr/bin/env ts-node
/**
 * Test Scaffold Service
 * Verifies that the modelScaffold service can read scaffolds from DynamoDB
 */

// Mock browser environment for imports
(global as any).window = undefined;
(global as any).import = { meta: { env: {
  VITE_AWS_REGION: process.env.VITE_AWS_REGION,
  VITE_AWS_ACCESS_KEY_ID: process.env.VITE_AWS_ACCESS_KEY_ID,
  VITE_AWS_SECRET_ACCESS_KEY: process.env.VITE_AWS_SECRET_ACCESS_KEY,
  VITE_S3_MODELS_BUCKET: process.env.VITE_S3_MODELS_BUCKET
}}};

// Import after mocking
import { getAllModelScaffolds, getModelScaffold } from '../../src/services/modelScaffold';

async function testScaffoldService() {
  console.log("Testing Scaffold Service...\n");

  // Test getAllModelScaffolds
  console.log("1. Fetching all scaffolds...");
  const allScaffolds = await getAllModelScaffolds();
  console.log(`   Found ${allScaffolds.length} scaffold(s)\n`);

  allScaffolds.forEach(scaffold => {
    console.log(`   ✓ ${scaffold.scaffoldId}: ${scaffold.name}`);
  });

  // Test getModelScaffold for SLR
  console.log("\n2. Fetching SLR scaffold specifically...");
  const slr = await getModelScaffold('SLR');
  if (slr) {
    console.log(`   ✓ SLR found`);
    console.log(`     Input contract: ${slr.inputContract.map(f => f.name).join(', ')}`);
    console.log(`     Output contract: ${slr.outputContract.map(f => f.name).join(', ')}`);
    console.log(`     Inference mode: ${slr.inferenceMode}`);
  } else {
    console.log(`   ✗ SLR not found`);
  }

  // Test getModelScaffold for MLR
  console.log("\n3. Fetching MLR scaffold specifically...");
  const mlr = await getModelScaffold('MLR');
  if (mlr) {
    console.log(`   ✓ MLR found`);
    console.log(`     Input contract: ${mlr.inputContract.map(f => f.name).join(', ')}`);
    console.log(`     Output contract: ${mlr.outputContract.map(f => f.name).join(', ')}`);
    console.log(`     Inference mode: ${mlr.inferenceMode}`);
  } else {
    console.log(`   ✗ MLR not found`);
  }

  console.log("\n✓ Service layer test complete!");
}

testScaffoldService().catch(error => {
  console.error("Error:", error);
  process.exit(1);
});
