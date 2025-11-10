import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  CreateTableCommand,
  DeleteTableCommand,
  ListTablesCommand,
  ListTablesCommandOutput,
  ResourceInUseException,
  ResourceNotFoundException
} from "@aws-sdk/client-dynamodb";

const REGION = process.env.AWS_REGION || process.env.VITE_AWS_REGION || "us-east-1";
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID || process.env.VITE_AWS_ACCESS_KEY_ID;
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY || process.env.VITE_AWS_SECRET_ACCESS_KEY;

if (!ACCESS_KEY || !SECRET_KEY) {
  console.error("❌ ERROR: AWS credentials not found in environment variables");
  console.error("   Please ensure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set");
  process.exit(1);
}

const client = new DynamoDBClient({ 
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY
  }
});

const MODEL_TABLES = {
  DATASETS: "ChasingProphets-Datasets",
  DATA_SLICES: "ChasingProphets-DataSlices",
  MODEL_SCAFFOLDS: "ChasingProphets-ModelScaffolds",
  MODEL_FITS: "ChasingProphets-ModelFits",
  PROPHETS: "ChasingProphets-Prophets",
  FORECASTS: "ChasingProphets-Forecasts",
  PERFORMANCE: "ChasingProphets-Performance",
  PROPHET_PERFORMANCE_SUMMARY: "ChasingProphets-ProphetPerformanceSummary"
};

/**
 * Session 1: Create all model-related DynamoDB tables
 * Based on finalized_development_plan/03-resources-and-locations.md
 */

async function createDatasetsTable() {
  const params = {
    TableName: MODEL_TABLES.DATASETS,
    KeySchema: [
      { AttributeName: "datasetId", KeyType: "HASH" as const }
    ],
    AttributeDefinitions: [
      { AttributeName: "datasetId", AttributeType: "S" as const },
      { AttributeName: "assetId", AttributeType: "S" as const }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "AssetIndex",
        KeySchema: [
          { AttributeName: "assetId", KeyType: "HASH" as const }
        ],
        Projection: {
          ProjectionType: "ALL" as const
        }
      }
    ],
    BillingMode: "PAY_PER_REQUEST" as const
  };

  try {
    await client.send(new CreateTableCommand(params));
    console.log(`✅ Created table: ${MODEL_TABLES.DATASETS}`);
  } catch (err) {
    if (err instanceof ResourceInUseException) {
      console.log(`⚠️  Table ${MODEL_TABLES.DATASETS} already exists`);
    } else {
      throw err;
    }
  }
}

async function createDataSlicesTable() {
  const params = {
    TableName: MODEL_TABLES.DATA_SLICES,
    KeySchema: [
      { AttributeName: "dataSliceId", KeyType: "HASH" as const }
    ],
    AttributeDefinitions: [
      { AttributeName: "dataSliceId", AttributeType: "S" as const },
      { AttributeName: "datasetId", AttributeType: "S" as const }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "DatasetIndex",
        KeySchema: [
          { AttributeName: "datasetId", KeyType: "HASH" as const }
        ],
        Projection: {
          ProjectionType: "ALL" as const
        }
      }
    ],
    BillingMode: "PAY_PER_REQUEST" as const
  };

  try {
    await client.send(new CreateTableCommand(params));
    console.log(`✅ Created table: ${MODEL_TABLES.DATA_SLICES}`);
  } catch (err) {
    if (err instanceof ResourceInUseException) {
      console.log(`⚠️  Table ${MODEL_TABLES.DATA_SLICES} already exists`);
    } else {
      throw err;
    }
  }
}

async function createModelScaffoldsTable() {
  const params = {
    TableName: MODEL_TABLES.MODEL_SCAFFOLDS,
    KeySchema: [
      { AttributeName: "scaffoldId", KeyType: "HASH" as const }
    ],
    AttributeDefinitions: [
      { AttributeName: "scaffoldId", AttributeType: "S" as const }
    ],
    BillingMode: "PAY_PER_REQUEST" as const
  };

  try {
    await client.send(new CreateTableCommand(params));
    console.log(`✅ Created table: ${MODEL_TABLES.MODEL_SCAFFOLDS}`);
  } catch (err) {
    if (err instanceof ResourceInUseException) {
      console.log(`⚠️  Table ${MODEL_TABLES.MODEL_SCAFFOLDS} already exists`);
    } else {
      throw err;
    }
  }
}

async function createModelFitsTable() {
  const params = {
    TableName: MODEL_TABLES.MODEL_FITS,
    KeySchema: [
      { AttributeName: "modelFitId", KeyType: "HASH" as const }
    ],
    AttributeDefinitions: [
      { AttributeName: "modelFitId", AttributeType: "S" as const },
      { AttributeName: "scaffoldId", AttributeType: "S" as const },
      { AttributeName: "assetId", AttributeType: "S" as const },
      { AttributeName: "status", AttributeType: "S" as const }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "ScaffoldIndex",
        KeySchema: [
          { AttributeName: "scaffoldId", KeyType: "HASH" as const }
        ],
        Projection: {
          ProjectionType: "ALL" as const
        }
      },
      {
        IndexName: "AssetStatusIndex",
        KeySchema: [
          { AttributeName: "assetId", KeyType: "HASH" as const },
          { AttributeName: "status", KeyType: "RANGE" as const }
        ],
        Projection: {
          ProjectionType: "ALL" as const
        }
      }
    ],
    BillingMode: "PAY_PER_REQUEST" as const
  };

  try {
    await client.send(new CreateTableCommand(params));
    console.log(`✅ Created table: ${MODEL_TABLES.MODEL_FITS}`);
  } catch (err) {
    if (err instanceof ResourceInUseException) {
      console.log(`⚠️  Table ${MODEL_TABLES.MODEL_FITS} already exists`);
    } else {
      throw err;
    }
  }
}

async function createProphetsTable() {
  const params = {
    TableName: MODEL_TABLES.PROPHETS,
    KeySchema: [
      { AttributeName: "prophetId", KeyType: "HASH" as const }
    ],
    AttributeDefinitions: [
      { AttributeName: "prophetId", AttributeType: "S" as const },
      { AttributeName: "assetId", AttributeType: "S" as const },
      { AttributeName: "isActive", AttributeType: "S" as const }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "AssetIndex",
        KeySchema: [
          { AttributeName: "assetId", KeyType: "HASH" as const }
        ],
        Projection: {
          ProjectionType: "ALL" as const
        }
      },
      {
        IndexName: "ActiveProphetsIndex",
        KeySchema: [
          { AttributeName: "isActive", KeyType: "HASH" as const }
        ],
        Projection: {
          ProjectionType: "ALL" as const
        }
      }
    ],
    BillingMode: "PAY_PER_REQUEST" as const
  };

  try {
    await client.send(new CreateTableCommand(params));
    console.log(`✅ Created table: ${MODEL_TABLES.PROPHETS}`);
  } catch (err) {
    if (err instanceof ResourceInUseException) {
      console.log(`⚠️  Table ${MODEL_TABLES.PROPHETS} already exists`);
    } else {
      throw err;
    }
  }
}

async function createForecastsTable() {
  const params = {
    TableName: MODEL_TABLES.FORECASTS,
    KeySchema: [
      { AttributeName: "forecastId", KeyType: "HASH" as const },
      { AttributeName: "startDate", KeyType: "RANGE" as const }
    ],
    AttributeDefinitions: [
      { AttributeName: "forecastId", AttributeType: "S" as const },
      { AttributeName: "startDate", AttributeType: "S" as const },
      { AttributeName: "prophetId", AttributeType: "S" as const }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "ProphetIndex",
        KeySchema: [
          { AttributeName: "prophetId", KeyType: "HASH" as const },
          { AttributeName: "startDate", KeyType: "RANGE" as const }
        ],
        Projection: {
          ProjectionType: "ALL" as const
        }
      }
    ],
    BillingMode: "PAY_PER_REQUEST" as const
  };

  try {
    await client.send(new CreateTableCommand(params));
    console.log(`✅ Created table: ${MODEL_TABLES.FORECASTS}`);
  } catch (err) {
    if (err instanceof ResourceInUseException) {
      console.log(`⚠️  Table ${MODEL_TABLES.FORECASTS} already exists`);
    } else {
      throw err;
    }
  }
}

async function createPerformanceTable() {
  const params = {
    TableName: MODEL_TABLES.PERFORMANCE,
    KeySchema: [
      { AttributeName: "prophetId", KeyType: "HASH" as const },
      { AttributeName: "date", KeyType: "RANGE" as const }
    ],
    AttributeDefinitions: [
      { AttributeName: "prophetId", AttributeType: "S" as const },
      { AttributeName: "date", AttributeType: "S" as const }
    ],
    BillingMode: "PAY_PER_REQUEST" as const
  };

  try {
    await client.send(new CreateTableCommand(params));
    console.log(`✅ Created table: ${MODEL_TABLES.PERFORMANCE}`);
  } catch (err) {
    if (err instanceof ResourceInUseException) {
      console.log(`⚠️  Table ${MODEL_TABLES.PERFORMANCE} already exists`);
    } else {
      throw err;
    }
  }
}

async function createProphetPerformanceSummaryTable() {
  const params = {
    TableName: MODEL_TABLES.PROPHET_PERFORMANCE_SUMMARY,
    KeySchema: [
      { AttributeName: "prophetId", KeyType: "HASH" as const },
      { AttributeName: "aggregationWindow", KeyType: "RANGE" as const }
    ],
    AttributeDefinitions: [
      { AttributeName: "prophetId", AttributeType: "S" as const },
      { AttributeName: "aggregationWindow", AttributeType: "S" as const }
    ],
    BillingMode: "PAY_PER_REQUEST" as const
  };

  try {
    await client.send(new CreateTableCommand(params));
    console.log(`✅ Created table: ${MODEL_TABLES.PROPHET_PERFORMANCE_SUMMARY}`);
  } catch (err) {
    if (err instanceof ResourceInUseException) {
      console.log(`⚠️  Table ${MODEL_TABLES.PROPHET_PERFORMANCE_SUMMARY} already exists`);
    } else {
      throw err;
    }
  }
}

async function listAllTables(): Promise<string[]> {
  const tables: string[] = [];
  
  try {
    let lastEvaluatedTableName: string | undefined;
    
    do {
      const command = new ListTablesCommand({
        ExclusiveStartTableName: lastEvaluatedTableName
      });
      const response = await client.send(command) as ListTablesCommandOutput;
      
      if (response.TableNames) {
        tables.push(...response.TableNames.filter((name: string) => 
          name.startsWith('ChasingProphets-')
        ));
      }
      
      lastEvaluatedTableName = response.LastEvaluatedTableName;
    } while (lastEvaluatedTableName);
    
  } catch (err) {
    console.error('Error listing tables:', err);
  }
  
  return tables;
}

async function deleteTableIfExists(tableName: string) {
  try {
    await client.send(new DeleteTableCommand({ TableName: tableName }));
    console.log(`🗑️  Deleted table: ${tableName}`);
    // Wait for table to be deleted
    await new Promise(resolve => setTimeout(resolve, 3000));
  } catch (err) {
    if (err instanceof ResourceNotFoundException) {
      // Table doesn't exist, that's fine
    } else {
      throw err;
    }
  }
}

async function setup(reset = false) {
  try {
    console.log("\n🚀 Session 1: Creating Model System DynamoDB Tables\n");
    console.log(`Region: ${REGION}`);
    console.log(`Mode: ${reset ? 'RESET (delete existing)' : 'CREATE (skip existing)'}\n`);

    if (reset) {
      console.log("⚠️  RESET MODE: Deleting existing model tables...");
      const modelTableNames = Object.values(MODEL_TABLES);
      
      for (const tableName of modelTableNames) {
        await deleteTableIfExists(tableName);
      }
      
      console.log("\n✅ Cleanup complete. Creating fresh tables...\n");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Create all model tables
    console.log("📊 Creating model system tables...\n");
    
    await createDatasetsTable();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await createDataSlicesTable();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await createModelScaffoldsTable();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await createModelFitsTable();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await createProphetsTable();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await createForecastsTable();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await createPerformanceTable();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await createProphetPerformanceSummaryTable();

    console.log("\n✅ All model tables created successfully!\n");
    
    // List all tables
    console.log("📋 Verifying table creation...\n");
    const allTables = await listAllTables();
    const modelTables = allTables.filter(t => 
      Object.values(MODEL_TABLES).includes(t)
    );
    
    console.log("✅ Model tables created:");
    modelTables.forEach(table => console.log(`   - ${table}`));
    
    console.log("\n📊 Total ChasingProphets tables:", allTables.length);
    console.log("\n🎉 Session 1 DynamoDB setup complete!\n");
    
  } catch (err) {
    console.error("\n❌ Setup failed:", err);
    process.exit(1);
  }
}

// Check if --reset flag is provided
const reset = process.argv.includes("--reset");
setup(reset);
