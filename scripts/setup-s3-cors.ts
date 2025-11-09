#!/usr/bin/env tsx
/**
 * Configure CORS on S3 bucket to allow browser access from React app
 */

import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

const REGION = process.env.AWS_REGION || process.env.VITE_AWS_REGION || "us-east-1";
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID || process.env.VITE_AWS_ACCESS_KEY_ID;
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY || process.env.VITE_AWS_SECRET_ACCESS_KEY;
const BUCKET_NAME = `chasingprophets-models-${REGION}`;

if (!ACCESS_KEY || !SECRET_KEY) {
  console.error("❌ ERROR: AWS credentials not found in environment variables");
  process.exit(1);
}

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY
  }
});

async function configureCORS() {
  console.log(`🔧 Configuring CORS for bucket: ${BUCKET_NAME}`);
  
  const corsConfiguration = {
    CORSRules: [
      {
        AllowedHeaders: ["*"],
        AllowedMethods: ["GET", "HEAD"],
        AllowedOrigins: ["*"],  // Allow all origins for dev (tighten in prod)
        ExposeHeaders: ["ETag"],
        MaxAgeSeconds: 3000
      }
    ]
  };

  try {
    await s3Client.send(
      new PutBucketCorsCommand({
        Bucket: BUCKET_NAME,
        CORSConfiguration: corsConfiguration
      })
    );
    
    console.log("✅ CORS configuration applied successfully");
    console.log("   Allowed methods: GET, HEAD");
    console.log("   Allowed origins: * (all)");
    console.log("\n✅ Browser can now fetch CSV files from S3");
  } catch (error) {
    console.error("❌ Error configuring CORS:", error);
    process.exit(1);
  }
}

configureCORS();
