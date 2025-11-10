/**
 * Seed Performance Summaries Script
 * 
 * Creates ProphetPerformanceSummary records for all active prophets
 * This is temporary seeding for testing - in production these will be
 * calculated by daily Lambda functions based on actual predictions
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  ScanCommand, 
  BatchWriteCommand 
} from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION || process.env.VITE_AWS_REGION || "us-east-1";
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID || process.env.VITE_AWS_ACCESS_KEY_ID;
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY || process.env.VITE_AWS_SECRET_ACCESS_KEY;

if (!ACCESS_KEY || !SECRET_KEY) {
  console.error("❌ ERROR: AWS credentials not found");
  console.error("   Make sure VITE_AWS_ACCESS_KEY_ID and VITE_AWS_SECRET_ACCESS_KEY are set");
  process.exit(1);
}

const client = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY
  }
});

const ddb = DynamoDBDocumentClient.from(client);

const TABLES = {
  PROPHETS: "ChasingProphets-Prophets",
  PERFORMANCE_SUMMARY: "ChasingProphets-ProphetPerformanceSummary"
};

interface Prophet {
  prophetId: string;
  prophetName: string;
  assetId: string;
  status: string;
}

interface PerformanceSummary {
  prophetId: string;
  aggregationWindow: string;
  mape: number;
  percentileError75?: number;
  percentileError90?: number;
  directionalAccuracy?: number;
  lastUpdated: string;
}

/**
 * Generate realistic-looking performance metrics
 * Better models have lower MAPE and higher directional accuracy
 */
function generatePerformanceMetrics(seed: number): {
  mape: number;
  percentileError75: number;
  percentileError90: number;
  directionalAccuracy: number;
} {
  // Use seed to make it deterministic but varied
  const random = (offset: number) => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
  };

  // MAPE ranges from 5% (excellent) to 150% (poor)
  // Most models cluster around 20-60%
  const mapeSeed = random(1);
  let mape: number;
  if (mapeSeed < 0.1) {
    // 10% chance of excellent performance (5-15%)
    mape = 5 + random(2) * 10;
  } else if (mapeSeed < 0.4) {
    // 30% chance of good performance (15-35%)
    mape = 15 + random(3) * 20;
  } else if (mapeSeed < 0.8) {
    // 40% chance of fair performance (35-70%)
    mape = 35 + random(4) * 35;
  } else {
    // 20% chance of poor performance (70-150%)
    mape = 70 + random(5) * 80;
  }

  // Percentile errors are typically higher than MAPE
  const percentileError75 = mape * (1.2 + random(6) * 0.3);
  const percentileError90 = mape * (1.5 + random(7) * 0.5);

  // Directional accuracy: better models predict direction correctly more often
  // Inversely related to MAPE
  let directionalAccuracy: number;
  if (mape < 15) {
    directionalAccuracy = 55 + random(8) * 15; // 55-70%
  } else if (mape < 35) {
    directionalAccuracy = 50 + random(9) * 10; // 50-60%
  } else if (mape < 70) {
    directionalAccuracy = 45 + random(10) * 10; // 45-55%
  } else {
    directionalAccuracy = 40 + random(11) * 10; // 40-50%
  }

  return {
    mape: Math.round(mape * 100) / 100,
    percentileError75: Math.round(percentileError75 * 100) / 100,
    percentileError90: Math.round(percentileError90 * 100) / 100,
    directionalAccuracy: Math.round(directionalAccuracy * 100) / 100
  };
}

async function getAllProphets(): Promise<Prophet[]> {
  console.log("📊 Fetching all prophets...");
  
  const command = new ScanCommand({
    TableName: TABLES.PROPHETS
  });

  const response = await ddb.send(command);
  const prophets = (response.Items || []) as Prophet[];
  
  console.log(`   Found ${prophets.length} prophets`);
  return prophets;
}

async function seedPerformanceSummaries(prophets: Prophet[]): Promise<void> {
  const aggregationWindows = ["20-day", "60-day", "120-day", "240-day"];
  const summaries: PerformanceSummary[] = [];

  console.log("\n🌱 Generating performance summaries...");

  for (const prophet of prophets) {
    // Use prophetId hash as seed for consistent but varied metrics
    const seed = prophet.prophetId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    for (let i = 0; i < aggregationWindows.length; i++) {
      const window = aggregationWindows[i];
      const metrics = generatePerformanceMetrics(seed + i);

      summaries.push({
        prophetId: prophet.prophetId,
        aggregationWindow: window,
        mape: metrics.mape,
        percentileError75: metrics.percentileError75,
        percentileError90: metrics.percentileError90,
        directionalAccuracy: metrics.directionalAccuracy,
        lastUpdated: new Date().toISOString()
      });
    }
  }

  console.log(`   Generated ${summaries.length} summary records`);

  // Batch write in chunks of 25 (DynamoDB limit)
  const BATCH_SIZE = 25;
  for (let i = 0; i < summaries.length; i += BATCH_SIZE) {
    const batch = summaries.slice(i, i + BATCH_SIZE);
    
    const command = new BatchWriteCommand({
      RequestItems: {
        [TABLES.PERFORMANCE_SUMMARY]: batch.map(summary => ({
          PutRequest: { Item: summary }
        }))
      }
    });

    await ddb.send(command);
    console.log(`   ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(summaries.length / BATCH_SIZE)} written`);
  }
}

async function main() {
  console.log("🚀 Starting Performance Summary Seeding\n");
  console.log(`Region: ${REGION}`);
  console.log(`Tables:`);
  console.log(`  - Prophets: ${TABLES.PROPHETS}`);
  console.log(`  - Performance Summary: ${TABLES.PERFORMANCE_SUMMARY}\n`);

  try {
    // Get all prophets
    const prophets = await getAllProphets();

    if (prophets.length === 0) {
      console.error("❌ No prophets found. Run seed-prophets script first.");
      process.exit(1);
    }

    // Seed performance summaries
    await seedPerformanceSummaries(prophets);

    console.log("\n✅ Performance summary seeding complete!");
    console.log("\n📊 Summary:");
    console.log(`   - Prophets: ${prophets.length}`);
    console.log(`   - Summaries per prophet: 4 (20-day, 60-day, 120-day, 240-day)`);
    console.log(`   - Total summaries: ${prophets.length * 4}`);

  } catch (error) {
    console.error("\n❌ Error during seeding:", error);
    process.exit(1);
  }
}

main();
