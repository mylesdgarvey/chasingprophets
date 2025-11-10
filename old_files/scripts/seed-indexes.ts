import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { DynamoDBClient, BatchWriteItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const REGION = process.env.AWS_REGION || "us-east-1";
const ddb = new DynamoDBClient({ region: REGION });
const s3 = new S3Client({ region: REGION });

const BUCKET = process.env.VITE_S3_BUCKET_NAME || process.env.S3_BUCKET_NAME;
if (!BUCKET) {
  throw new Error("Set VITE_S3_BUCKET_NAME or S3_BUCKET_NAME in .env to your dev bucket (chasing-prophets-dev-<account>-<region>).");
}

type Row = { Date: string; Open: string; High: string; Low: string; Close: string; Volume?: string };

function readCsv(filePath: string): Row[] {
  const csv = fs.readFileSync(filePath, "utf8");
  const parsed = Papa.parse<Row>(csv, { header: true, dynamicTyping: false });
  if (parsed.errors?.length) {
    console.error(parsed.errors);
    throw new Error(`Failed parsing CSV ${filePath}`);
  }
  // Stooq columns: Date,Open,High,Low,Close,Volume
  return (parsed.data || []).filter((r) => r && r.Date && r.Close) as Row[];
}

async function uploadToS3(key: string, body: string) {
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: "text/csv" }));
  console.log(`Uploaded s3://${BUCKET}/${key}`);
}

async function ensureAsset(ticker: string, name: string, description: string) {
  await ddb.send(
    new PutItemCommand({
      TableName: "ChasingProphets-Assets",
      Item: {
        ticker: { S: ticker },
        name: { S: name },
        description: { S: description },
        market: { S: "INDEX" },
        createdAt: { S: new Date().toISOString() },
      },
    })
  );
  console.log(`Ensured asset: ${ticker}`);
}

async function batchWritePrices(ticker: string, rows: Row[]) {
  const BATCH = 25;
  const puts = rows.map((r) => ({
    PutRequest: {
      Item: {
        ticker: { S: ticker },
        date: { S: new Date(r.Date).toISOString() },
        open: { N: (+r.Open).toFixed(2) },
        high: { N: (+r.High).toFixed(2) },
        low: { N: (+r.Low).toFixed(2) },
        close: { N: (+r.Close).toFixed(2) },
        volume: { N: String(r.Volume ? +r.Volume : 0) },
        lastUpdated: { S: new Date().toISOString() },
      },
    },
  }));
  for (let i = 0; i < puts.length; i += BATCH) {
    const RequestItems: any = { ["ChasingProphets-AssetPrices"]: puts.slice(i, i + BATCH) };
    const cmd = new BatchWriteItemCommand({ RequestItems });
    const resp = await ddb.send(cmd);
    if (resp.UnprocessedItems && Object.keys(resp.UnprocessedItems).length) {
      console.warn("UnprocessedItems present; retry logic could be added");
    }
  }
  console.log(`Wrote ${puts.length} price rows for ${ticker}`);
}

async function main() {
  const djiaCsv = path.resolve("data/raw/DJIA.csv");
  const spxCsv = path.resolve("data/raw/SPX.csv");
  if (!fs.existsSync(djiaCsv) || !fs.existsSync(spxCsv)) {
    throw new Error("CSV files not found. Run scripts/data/fetch-indexes.sh first.");
  }

  const djiaRows = readCsv(djiaCsv);
  const spxRows = readCsv(spxCsv);

  // Upload originals to S3
  await uploadToS3("data/assets/DJIA/ohlcv_full.csv", fs.readFileSync(djiaCsv, "utf8"));
  await uploadToS3("data/assets/SPX/ohlcv_full.csv", fs.readFileSync(spxCsv, "utf8"));

  // Ensure assets exist
  await ensureAsset("DJIA", "Dow Jones Industrial Average", "US large-cap index");
  await ensureAsset("SPX", "S&P 500 Index", "US 500 large-cap index");

  // Batch write into AssetPrices
  await batchWritePrices("DJIA", djiaRows);
  await batchWritePrices("SPX", spxRows);

  console.log("Data seed complete.");
}

main().catch((e) => { console.error(e); process.exit(1); });