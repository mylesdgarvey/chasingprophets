import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  CreateTableCommand,
  PutItemCommand,
  DeleteTableCommand,
  ListTablesCommand,
  ListTablesCommandOutput,
  ResourceInUseException,
  ResourceNotFoundException,
  BatchWriteItemCommand
} from "@aws-sdk/client-dynamodb";

const REGION = process.env.AWS_REGION || "us-east-1";
const client = new DynamoDBClient({ region: REGION });

const TABLES = {
  ASSETS: "ChasingProphets-Assets", // Stores asset metadata
  PRICES: "ChasingProphets-AssetPrices", // Stores historical price data
  USERS: "ChasingProphets-Users"
  ,NOTIFICATIONS: "ChasingProphets-Notifications"
};

// Sample data
const sampleUsers = [
  {
    userId: { S: "admin-1" },
    username: { S: "admin" },
    email: { S: "admin@chasingprophets.local" },
    role: { S: "admin" },
    passwordHash: { S: "devpassword" }, // In production, use proper password hashing
    createdAt: { S: new Date().toISOString() }
  },
  {
    userId: { S: "user-1" },
    username: { S: "user" },
    email: { S: "user@chasingprophets.local" },
    role: { S: "user" },
    passwordHash: { S: "devpassword" },
    createdAt: { S: new Date().toISOString() }
  }
];

// Generate sample stock data using a seeded pseudo-random generator and a GBM-like process
function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateStockData(ticker: string, market: string, startPrice: number, seed = 42) {
  const startDate = new Date('2015-01-01T00:00:00Z');
  const endDate = new Date('2025-12-31T00:00:00Z');
  const rand = seededRandom(seed + ticker.length);
  const data: any[] = [];

  // Parameters for GBM-like simulation
  const mu = 0.08; // annual drift ~8%
  const sigma = 0.25; // annual volatility
  const msPerDay = 24 * 60 * 60 * 1000;

  let prevClose = startPrice;
  for (let d = startDate; d <= endDate; d = new Date(d.getTime() + msPerDay)) {
    // skip weekends: typical markets closed on Sat/Sun
    const day = d.getUTCDay();
    if (day === 0 || day === 6) continue;

    // daily return sampled from normal approx using Box-Muller
    const u1 = rand();
    const u2 = rand();
    const z = Math.sqrt(-2 * Math.log(u1 || 1e-9)) * Math.cos(2 * Math.PI * u2);
    const dt = 1 / 252; // trading days per year
    const dailyReturn = mu * dt + sigma * Math.sqrt(dt) * z;

    const open = prevClose * (1 + (rand() - 0.5) * 0.01); // small open gap
    const close = Math.max(0.01, prevClose * Math.exp(dailyReturn));
    const high = Math.max(open, close) * (1 + rand() * 0.02);
    const low = Math.min(open, close) * (1 - rand() * 0.02);
    const volume = Math.floor(100000 + rand() * 900000);

    data.push({
      PutRequest: {
        Item: {
          ticker: { S: ticker },
          market: { S: market },
          date: { S: d.toISOString() },
          open: { N: open.toFixed(2) },
          high: { N: high.toFixed(2) },
          low: { N: low.toFixed(2) },
          close: { N: close.toFixed(2) },
          volume: { N: volume.toString() },
          lastUpdated: { S: new Date().toISOString() }
        }
      }
    });

    prevClose = close;
  }

  return data;
}

const sampleStocks = [
  { ticker: 'AAPL', name: 'Apple Inc.', description: 'Consumer electronics and services', market: 'TECH', lastPrice: 175 },
  { ticker: 'MSFT', name: 'Microsoft Corporation', description: 'Software and cloud', market: 'TECH', lastPrice: 330 },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', description: 'E-commerce and cloud', market: 'CONSUMER', lastPrice: 130 },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', description: 'Internet services and AI', market: 'TECH', lastPrice: 130 },
  { ticker: 'GS', name: 'Goldman Sachs', description: 'Investment banking', market: 'FINANCE', lastPrice: 310 }
];

async function createPricesTable() {
  const params = {
    TableName: TABLES.PRICES,
    KeySchema: [
      { AttributeName: "ticker", KeyType: "HASH" as const },
      { AttributeName: "date", KeyType: "RANGE" as const }
    ],
    AttributeDefinitions: [
      { AttributeName: "ticker", AttributeType: "S" as const },
      { AttributeName: "date", AttributeType: "S" as const }
    ],
    BillingMode: "PAY_PER_REQUEST" as const
  };

  try {
    await client.send(new CreateTableCommand(params));
    console.log(`Created table: ${TABLES.PRICES}`);
  } catch (err) {
    if (err instanceof ResourceInUseException) {
      console.log(`Table ${TABLES.PRICES} already exists`);
    } else {
      throw err;
    }
  }
}

async function createNotificationsTable() {
  const params = {
    TableName: TABLES.NOTIFICATIONS,
    KeySchema: [
      { AttributeName: "userId", KeyType: "HASH" as const },
      { AttributeName: "notificationId", KeyType: "RANGE" as const }
    ],
    AttributeDefinitions: [
      { AttributeName: "userId", AttributeType: "S" as const },
      { AttributeName: "notificationId", AttributeType: "S" as const }
    ],
    BillingMode: "PAY_PER_REQUEST" as const
  };

  try {
    await client.send(new CreateTableCommand(params));
    console.log(`Created table: ${TABLES.NOTIFICATIONS}`);
  } catch (err) {
    if (err instanceof ResourceInUseException) {
      console.log(`Table ${TABLES.NOTIFICATIONS} already exists`);
    } else {
      throw err;
    }
  }
}

async function createUsersTable() {
  const params = {
    TableName: TABLES.USERS,
    KeySchema: [
      { AttributeName: "userId", KeyType: "HASH" as const }
    ],
    AttributeDefinitions: [
      { AttributeName: "userId", AttributeType: "S" as const },
      { AttributeName: "email", AttributeType: "S" as const }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "EmailIndex",
        KeySchema: [
          { AttributeName: "email", KeyType: "HASH" as const }
        ],
        Projection: {
          ProjectionType: "ALL" as const
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  try {
    await client.send(new CreateTableCommand(params));
    console.log(`Created table: ${TABLES.USERS}`);
  } catch (err) {
    if (err instanceof ResourceInUseException) {
      console.log(`Table ${TABLES.USERS} already exists`);
    } else {
      throw err;
    }
  }
}

async function createAssetsTable() {
  const params = {
    TableName: TABLES.ASSETS,
    KeySchema: [
      { AttributeName: "ticker", KeyType: "HASH" as const }
    ],
    AttributeDefinitions: [
      { AttributeName: "ticker", AttributeType: "S" as const },
      { AttributeName: "market", AttributeType: "S" as const }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "MarketIndex",
        KeySchema: [
          { AttributeName: "market", KeyType: "HASH" as const }
        ],
        Projection: {
          ProjectionType: "ALL" as const
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  try {
    await client.send(new CreateTableCommand(params));
    console.log(`Created table: ${TABLES.ASSETS}`);
  } catch (err) {
    if (err instanceof ResourceInUseException) {
      console.log(`Table ${TABLES.ASSETS} already exists`);
    } else {
      throw err;
    }
  }
}

async function insertSampleData() {
  // Insert users via batch writes
  const userPutRequests = sampleUsers.map(u => ({ PutRequest: { Item: u } }));
  await batchWriteItems(TABLES.USERS, userPutRequests);
  console.log("Inserted sample users");

  // Insert assets and their price data
  for (let idx = 0; idx < sampleStocks.length; idx++) {
    const stock = sampleStocks[idx];
    try {
      // Insert asset metadata
      console.log(`Inserting asset metadata for ${stock.ticker} into ${TABLES.ASSETS}`);
      await client.send(new PutItemCommand({
        TableName: TABLES.ASSETS,
        Item: {
          ticker: { S: stock.ticker },
          name: { S: stock.name },
          description: { S: stock.description },
          market: { S: stock.market },
          createdAt: { S: new Date().toISOString() }
        }
      }));

      // Generate and insert price history via batch writes
      const priceData = generateStockData(stock.ticker, stock.market, stock.lastPrice, 1000 + idx);
      console.log(`Writing ${priceData.length} price items to ${TABLES.PRICES}`);
      await batchWriteItems(TABLES.PRICES, priceData);
      console.log(`Inserted data for ${stock.ticker}`);
    } catch (err) {
      console.error(`Failed inserting data for ${stock.ticker}:`, err);
      throw err;
    }
  }

  // Insert some sample notifications for users (unchecked = unread)
  const notifications: any[] = [
    // Email-keyed notifications (legacy)
    {
      PutRequest: {
        Item: {
          userId: { S: "user@chasingprophets.local" },
          notificationId: { S: "notif-user-1" },
          message: { S: "Welcome to ChasingProphets! Check out the dashboard." },
          checked: { BOOL: false },
          createdAt: { S: new Date().toISOString() }
        }
      }
    },
    {
      PutRequest: {
        Item: {
          userId: { S: "user@chasingprophets.local" },
          notificationId: { S: "notif-user-2" },
          message: { S: "New analysis available for AAPL." },
          checked: { BOOL: false },
          createdAt: { S: new Date().toISOString() }
        }
      }
    },
    {
      PutRequest: {
        Item: {
          userId: { S: "user@chasingprophets.local" },
          notificationId: { S: "notif-user-3" },
          message: { S: "Old notification (read)." },
          checked: { BOOL: true },
          createdAt: { S: new Date().toISOString() }
        }
      }
    },
    {
      PutRequest: {
        Item: {
          userId: { S: "admin@chasingprophets.local" },
          notificationId: { S: "notif-admin-1" },
          message: { S: "Admin: project stats are available." },
          checked: { BOOL: false },
          createdAt: { S: new Date().toISOString() }
        }
      }
    },

    // Username-keyed notifications (Cognito username)
    // username-keyed notifications (Cognito usernames)
    {
      PutRequest: {
        Item: {
          userId: { S: "user" },
          notificationId: { S: "notif-user-1-username" },
          message: { S: "Welcome to ChasingProphets! Check out the dashboard." },
          checked: { BOOL: false },
          createdAt: { S: new Date().toISOString() }
        }
      }
    },
    {
      PutRequest: {
        Item: {
          userId: { S: "user" },
          notificationId: { S: "notif-user-2-username" },
          message: { S: "New analysis available for AAPL." },
          checked: { BOOL: false },
          createdAt: { S: new Date().toISOString() }
        }
      }
    },
    {
      PutRequest: {
        Item: {
          userId: { S: "user" },
          notificationId: { S: "notif-user-3-username-read" },
          message: { S: "Old note for user (read)." },
          checked: { BOOL: true },
          createdAt: { S: new Date().toISOString() }
        }
      }
    },
    {
      PutRequest: {
        Item: {
          userId: { S: "admin@chasingprophets.local" },
          notificationId: { S: "notif-admin-1-username" },
          message: { S: "Admin: project stats are available." },
          checked: { BOOL: false },
          createdAt: { S: new Date().toISOString() }
        }
      }
    },
    {
      PutRequest: {
        Item: {
          userId: { S: "admin@chasingprophets.local" },
          notificationId: { S: "notif-admin-2-username-read" },
          message: { S: "Admin: old notice (read)." },
          checked: { BOOL: true },
          createdAt: { S: new Date().toISOString() }
        }
      }
    }
  ];

  try {
    console.log(`Writing ${notifications.length} notifications to ${TABLES.NOTIFICATIONS}`);
    await batchWriteItems(TABLES.NOTIFICATIONS, notifications);
    console.log("Inserted sample notifications");
  } catch (err) {
    console.error('Failed inserting notifications:', err);
    throw err;
  }
}

// Batch write helper with retries for UnprocessedItems
async function batchWriteItems(tableName: string, requests: any[]) {
  const BATCH_SIZE = 25;
  for (let i = 0; i < requests.length; i += BATCH_SIZE) {
    const batch = requests.slice(i, i + BATCH_SIZE);
    let requestItems: any = { [tableName]: batch };
    let attempts = 0;
    while (Object.keys(requestItems).length > 0 && attempts < 8) {
      const command = new BatchWriteItemCommand({ RequestItems: requestItems });
      const resp = await client.send(command);
      if (resp.UnprocessedItems && Object.keys(resp.UnprocessedItems).length) {
        requestItems = resp.UnprocessedItems;
        attempts++;
        const backoff = Math.min(500 * 2 ** attempts, 10000);
        await new Promise(r => setTimeout(r, backoff));
      } else {
        requestItems = {};
      }
    }
    if (Object.keys(requestItems).length) {
      console.warn(`Unprocessed items remained for table ${tableName} after retries`);
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
    console.log(`Deleted table: ${tableName}`);
    // Wait for table to be deleted
    await new Promise(resolve => setTimeout(resolve, 5000));
  } catch (err) {
    if (err instanceof ResourceNotFoundException) {
      console.log(`Table ${tableName} does not exist`);
    } else {
      throw err;
    }
  }
}

async function setup(reset = false) {
  try {
    console.log("Starting DynamoDB setup...");

    // Always clean up existing tables when running in AWS
    if (reset || !process.env.AWS_ENDPOINT_URL) {
      console.log("Cleaning up existing tables...");
      const existingTables = await listAllTables();
      
      for (const tableName of existingTables) {
        await deleteTableIfExists(tableName);
      }
      
      // Wait a bit longer for AWS to fully clean up
      if (!process.env.AWS_ENDPOINT_URL) {
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    await createUsersTable();
    // Wait for first table
    console.log("Waiting for Users table to be ready...");
    await new Promise(resolve => setTimeout(resolve, 10000));

    await createAssetsTable();
    // Wait for second table
    console.log("Waiting for Assets table to be ready...");
    await new Promise(resolve => setTimeout(resolve, 10000));

    await createPricesTable();
  // create notifications table
  await createNotificationsTable();
    // Wait for last table
    console.log("Waiting for Prices table to be ready...");
    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log("Inserting sample data...");
    await insertSampleData();

    console.log("Setup complete!");
  } catch (err) {
    console.error("Setup failed:", err);
    process.exit(1);
  }
}

// Check if --reset flag is provided
const reset = process.argv.includes("--reset");
setup(reset);