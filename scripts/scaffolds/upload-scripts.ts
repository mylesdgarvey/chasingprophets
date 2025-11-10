#!/usr/bin/env ts-node
/**
 * Upload scaffold scripts to S3
 * Uploads the training and inference scripts for SLR and MLR scaffolds
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const BUCKET = process.env.VITE_S3_MODELS_BUCKET || 'chasingprophets-models-us-east-1';
const REGION = process.env.VITE_AWS_REGION || 'us-east-1';

// Initialize S3 client
const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || ''
  }
});

interface ScriptInfo {
  localPath: string;
  s3Key: string;
  contentType: string;
}

const scripts: ScriptInfo[] = [
  // SLR scripts
  {
    localPath: 'scripts/scaffolds/slr/train.py',
    s3Key: 'models/scaffolds/slr/train.py',
    contentType: 'text/x-python'
  },
  {
    localPath: 'scripts/scaffolds/slr/inference.py',
    s3Key: 'models/scaffolds/slr/inference.py',
    contentType: 'text/x-python'
  },
  {
    localPath: 'scripts/scaffolds/slr/inference.js',
    s3Key: 'models/scaffolds/slr/inference.js',
    contentType: 'application/javascript'
  },
  // MLR scripts
  {
    localPath: 'scripts/scaffolds/mlr/train.py',
    s3Key: 'models/scaffolds/mlr/train.py',
    contentType: 'text/x-python'
  },
  {
    localPath: 'scripts/scaffolds/mlr/inference.py',
    s3Key: 'models/scaffolds/mlr/inference.py',
    contentType: 'text/x-python'
  },
  {
    localPath: 'scripts/scaffolds/mlr/inference.js',
    s3Key: 'models/scaffolds/mlr/inference.js',
    contentType: 'application/javascript'
  }
];

async function uploadScript(script: ScriptInfo): Promise<void> {
  const filePath = path.join(process.cwd(), script.localPath);
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: script.s3Key,
    Body: fileContent,
    ContentType: script.contentType
  });

  await s3Client.send(command);
  console.log(`✓ Uploaded: ${script.localPath} → s3://${BUCKET}/${script.s3Key}`);
}

async function main() {
  console.log('Uploading scaffold scripts to S3...');
  console.log(`Bucket: ${BUCKET}`);
  console.log(`Region: ${REGION}\n`);

  for (const script of scripts) {
    try {
      await uploadScript(script);
    } catch (error) {
      console.error(`✗ Failed to upload ${script.localPath}:`, error);
      process.exit(1);
    }
  }

  console.log('\n✓ All scripts uploaded successfully!');
  console.log('\nS3 paths:');
  scripts.forEach(script => {
    console.log(`  - s3://${BUCKET}/${script.s3Key}`);
  });
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
