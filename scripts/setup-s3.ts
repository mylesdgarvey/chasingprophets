import { S3Client, CreateBucketCommand, PutBucketVersioningCommand, PutBucketEncryptionCommand, HeadBucketCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const REGION = process.env.AWS_REGION || process.env.VITE_AWS_REGION || "us-east-1";
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID || process.env.VITE_AWS_ACCESS_KEY_ID;
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY || process.env.VITE_AWS_SECRET_ACCESS_KEY;
const ACCOUNT_ID = process.env.AWS_ACCOUNT_ID || "unknown";

if (!ACCESS_KEY || !SECRET_KEY) {
  console.error("❌ ERROR: AWS credentials not found in environment variables");
  process.exit(1);
}

const client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY
  }
});

// Bucket naming: chasingprophets-models-{region} to ensure uniqueness
const BUCKET_NAME = `chasingprophets-models-${REGION}`;

async function bucketExists(bucketName: string): Promise<boolean> {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucketName }));
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

async function createBucket() {
  try {
    console.log(`\n📦 Creating S3 bucket: ${BUCKET_NAME}`);
    
    // Check if bucket already exists
    if (await bucketExists(BUCKET_NAME)) {
      console.log(`✅ Bucket ${BUCKET_NAME} already exists`);
      return;
    }

    // Create bucket (note: us-east-1 doesn't need LocationConstraint)
    const createParams: any = {
      Bucket: BUCKET_NAME
    };
    
    // Only add LocationConstraint for regions other than us-east-1
    if (REGION !== 'us-east-1') {
      createParams.CreateBucketConfiguration = {
        LocationConstraint: REGION
      };
    }
    
    await client.send(new CreateBucketCommand(createParams));
    console.log(`✅ Created bucket: ${BUCKET_NAME}`);

    // Wait for bucket to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

  } catch (error: any) {
    if (error.name === 'BucketAlreadyOwnedByYou') {
      console.log(`✅ Bucket ${BUCKET_NAME} already owned by you`);
    } else {
      throw error;
    }
  }
}

async function enableVersioning() {
  try {
    console.log(`\n🔄 Enabling versioning on ${BUCKET_NAME}`);
    
    await client.send(new PutBucketVersioningCommand({
      Bucket: BUCKET_NAME,
      VersioningConfiguration: {
        Status: 'Enabled'
      }
    }));
    
    console.log(`✅ Versioning enabled`);
  } catch (error) {
    console.error(`❌ Failed to enable versioning:`, error);
    throw error;
  }
}

async function enableEncryption() {
  try {
    console.log(`\n🔒 Enabling encryption on ${BUCKET_NAME}`);
    
    await client.send(new PutBucketEncryptionCommand({
      Bucket: BUCKET_NAME,
      ServerSideEncryptionConfiguration: {
        Rules: [
          {
            ApplyServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256'
            },
            BucketKeyEnabled: true
          }
        ]
      }
    }));
    
    console.log(`✅ Encryption enabled (AES256)`);
  } catch (error) {
    console.error(`❌ Failed to enable encryption:`, error);
    throw error;
  }
}

async function createFolderStructure() {
  try {
    console.log(`\n📁 Creating folder structure...`);
    
    const folders = [
      'data/',
      'data/assets/',
      'slices/',
      'models/',
      'scripts/scaffolds/',
      'artifacts/'
    ];
    
    for (const folder of folders) {
      try {
        await client.send(new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: folder,
          Body: ''
        }));
        console.log(`   ✅ Created: ${folder}`);
      } catch (error) {
        console.log(`   ⚠️  Could not create ${folder} (may already exist)`);
      }
    }
    
    console.log(`\n✅ Folder structure created`);
  } catch (error) {
    console.error(`❌ Failed to create folder structure:`, error);
    throw error;
  }
}

async function setup() {
  try {
    console.log("\n🚀 Session 1: Creating S3 Infrastructure\n");
    console.log(`Region: ${REGION}`);
    console.log(`Bucket: ${BUCKET_NAME}\n`);

    await createBucket();
    await enableVersioning();
    await enableEncryption();
    await createFolderStructure();

    console.log("\n✅ S3 setup complete!\n");
    console.log("📊 Bucket details:");
    console.log(`   Name: ${BUCKET_NAME}`);
    console.log(`   Region: ${REGION}`);
    console.log(`   Versioning: Enabled`);
    console.log(`   Encryption: AES256`);
    console.log("\n📁 Folder structure:");
    console.log(`   data/assets/ - Asset price data`);
    console.log(`   slices/ - Data slice CSVs`);
    console.log(`   models/ - Trained model artifacts`);
    console.log(`   scripts/scaffolds/ - Model scaffold code`);
    console.log(`   artifacts/ - Miscellaneous artifacts`);
    console.log("\n🎉 Session 1 S3 setup complete!\n");

  } catch (error) {
    console.error("\n❌ Setup failed:", error);
    process.exit(1);
  }
}

setup();
