import { IAMClient, CreateRoleCommand, AttachRolePolicyCommand, CreatePolicyCommand, GetRoleCommand, GetPolicyCommand, ListPoliciesCommand } from "@aws-sdk/client-iam";

const REGION = process.env.AWS_REGION || process.env.VITE_AWS_REGION || "us-east-1";
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID || process.env.VITE_AWS_ACCESS_KEY_ID;
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY || process.env.VITE_AWS_SECRET_ACCESS_KEY;
const ACCOUNT_ID = process.env.AWS_ACCOUNT_ID || "080577529621";

if (!ACCESS_KEY || !SECRET_KEY) {
  console.error("❌ ERROR: AWS credentials not found in environment variables");
  process.exit(1);
}

const client = new IAMClient({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY
  }
});

const ROLES = {
  LAMBDA: "ChProphets-Lambda-Role",
  ECS_EXECUTION: "ChProphets-ECSTaskExecutionRole",
  ECS_TRAINER: "ChProphets-ECSTrainerRole",
  AMPLIFY: "ChProphets-AmplifyServiceRole"
};

async function roleExists(roleName: string): Promise<boolean> {
  try {
    await client.send(new GetRoleCommand({ RoleName: roleName }));
    return true;
  } catch (error: any) {
    if (error.name === 'NoSuchEntity' || error.name === 'NoSuchEntityException') {
      return false;
    }
    throw error;
  }
}

async function createLambdaRole() {
  const roleName = ROLES.LAMBDA;
  
  if (await roleExists(roleName)) {
    console.log(`✅ Role ${roleName} already exists`);
    return;
  }

  console.log(`\n📝 Creating role: ${roleName}`);

  // Trust policy for Lambda
  const trustPolicy = {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: {
          Service: "lambda.amazonaws.com"
        },
        Action: "sts:AssumeRole"
      },
      {
        Effect: "Allow",
        Principal: {
          Service: "events.amazonaws.com"
        },
        Action: "sts:AssumeRole"
      }
    ]
  };

  await client.send(new CreateRoleCommand({
    RoleName: roleName,
    AssumeRolePolicyDocument: JSON.stringify(trustPolicy),
    Description: "Role for ChasingProphets Lambda functions (daily jobs, API handlers)"
  }));

  console.log(`✅ Created role: ${roleName}`);

  // Attach AWS managed policies
  await client.send(new AttachRolePolicyCommand({
    RoleName: roleName,
    PolicyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  }));

  // Create custom policy for DynamoDB and S3 access
  const policyDocument = {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchWriteItem"
        ],
        Resource: `arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/ChasingProphets-*`
      },
      {
        Effect: "Allow",
        Action: [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ],
        Resource: [
          `arn:aws:s3:::chasingprophets-models-*`,
          `arn:aws:s3:::chasingprophets-models-*/*`
        ]
      }
    ]
  };

  try {
    const policy = await client.send(new CreatePolicyCommand({
      PolicyName: "ChProphets-Lambda-Policy",
      PolicyDocument: JSON.stringify(policyDocument),
      Description: "Custom policy for ChasingProphets Lambda functions"
    }));

    await client.send(new AttachRolePolicyCommand({
      RoleName: roleName,
      PolicyArn: policy.Policy!.Arn!
    }));

    console.log(`✅ Attached custom policy to ${roleName}`);
  } catch (error: any) {
    if (error.name === 'EntityAlreadyExists') {
      // Policy exists, attach it
      const policies = await client.send(new ListPoliciesCommand({ Scope: "Local" }));
      const existingPolicy = policies.Policies?.find(p => p.PolicyName === "ChProphets-Lambda-Policy");
      if (existingPolicy) {
        await client.send(new AttachRolePolicyCommand({
          RoleName: roleName,
          PolicyArn: existingPolicy.Arn!
        }));
        console.log(`✅ Attached existing custom policy to ${roleName}`);
      }
    } else {
      throw error;
    }
  }
}

async function createECSExecutionRole() {
  const roleName = ROLES.ECS_EXECUTION;
  
  if (await roleExists(roleName)) {
    console.log(`✅ Role ${roleName} already exists`);
    return;
  }

  console.log(`\n📝 Creating role: ${roleName}`);

  const trustPolicy = {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: {
          Service: "ecs-tasks.amazonaws.com"
        },
        Action: "sts:AssumeRole"
      }
    ]
  };

  await client.send(new CreateRoleCommand({
    RoleName: roleName,
    AssumeRolePolicyDocument: JSON.stringify(trustPolicy),
    Description: "ECS task execution role for ChasingProphets"
  }));

  console.log(`✅ Created role: ${roleName}`);

  // Attach AWS managed policy for ECS task execution
  await client.send(new AttachRolePolicyCommand({
    RoleName: roleName,
    PolicyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
  }));

  console.log(`✅ Attached ECS execution policy to ${roleName}`);
}

async function createECSTrainerRole() {
  const roleName = ROLES.ECS_TRAINER;
  
  if (await roleExists(roleName)) {
    console.log(`✅ Role ${roleName} already exists`);
    return;
  }

  console.log(`\n📝 Creating role: ${roleName}`);

  const trustPolicy = {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: {
          Service: "ecs-tasks.amazonaws.com"
        },
        Action: "sts:AssumeRole"
      }
    ]
  };

  await client.send(new CreateRoleCommand({
    RoleName: roleName,
    AssumeRolePolicyDocument: JSON.stringify(trustPolicy),
    Description: "ECS task role for ChasingProphets model training"
  }));

  console.log(`✅ Created role: ${roleName}`);

  // Create custom policy for training tasks
  const policyDocument = {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ],
        Resource: `arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/ChasingProphets-*`
      },
      {
        Effect: "Allow",
        Action: [
          "s3:GetObject",
          "s3:PutObject"
        ],
        Resource: [
          `arn:aws:s3:::chasingprophets-models-*`,
          `arn:aws:s3:::chasingprophets-models-*/*`
        ]
      }
    ]
  };

  try {
    const policy = await client.send(new CreatePolicyCommand({
      PolicyName: "ChProphets-ECSTrainer-Policy",
      PolicyDocument: JSON.stringify(policyDocument),
      Description: "Custom policy for ChasingProphets ECS training tasks"
    }));

    await client.send(new AttachRolePolicyCommand({
      RoleName: roleName,
      PolicyArn: policy.Policy!.Arn!
    }));

    console.log(`✅ Attached custom policy to ${roleName}`);
  } catch (error: any) {
    if (error.name === 'EntityAlreadyExists') {
      const policies = await client.send(new ListPoliciesCommand({ Scope: "Local" }));
      const existingPolicy = policies.Policies?.find(p => p.PolicyName === "ChProphets-ECSTrainer-Policy");
      if (existingPolicy) {
        await client.send(new AttachRolePolicyCommand({
          RoleName: roleName,
          PolicyArn: existingPolicy.Arn!
        }));
        console.log(`✅ Attached existing custom policy to ${roleName}`);
      }
    } else {
      throw error;
    }
  }
}

async function createAmplifyRole() {
  const roleName = ROLES.AMPLIFY;
  
  if (await roleExists(roleName)) {
    console.log(`✅ Role ${roleName} already exists`);
    return;
  }

  console.log(`\n📝 Creating role: ${roleName}`);

  const trustPolicy = {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: {
          Service: "amplify.amazonaws.com"
        },
        Action: "sts:AssumeRole"
      }
    ]
  };

  await client.send(new CreateRoleCommand({
    RoleName: roleName,
    AssumeRolePolicyDocument: JSON.stringify(trustPolicy),
    Description: "Service role for AWS Amplify deployment"
  }));

  console.log(`✅ Created role: ${roleName}`);

  // Attach AWS managed policy for Amplify backend deployment
  await client.send(new AttachRolePolicyCommand({
    RoleName: roleName,
    PolicyArn: "arn:aws:iam::aws:policy/AdministratorAccess-Amplify"
  }));

  console.log(`✅ Attached Amplify policy to ${roleName}`);
}

async function setup() {
  try {
    console.log("\n🚀 Session 1: Creating IAM Roles\n");
    console.log(`Region: ${REGION}`);
    console.log(`Account: ${ACCOUNT_ID}\n`);

    await createLambdaRole();
    await createECSExecutionRole();
    await createECSTrainerRole();
    await createAmplifyRole();

    console.log("\n✅ All IAM roles created successfully!\n");
    console.log("📋 Created roles:");
    console.log(`   - ${ROLES.LAMBDA}`);
    console.log(`   - ${ROLES.ECS_EXECUTION}`);
    console.log(`   - ${ROLES.ECS_TRAINER}`);
    console.log(`   - ${ROLES.AMPLIFY}`);
    
    console.log("\n📊 Role ARNs:");
    console.log(`   Lambda: arn:aws:iam::${ACCOUNT_ID}:role/${ROLES.LAMBDA}`);
    console.log(`   ECS Execution: arn:aws:iam::${ACCOUNT_ID}:role/${ROLES.ECS_EXECUTION}`);
    console.log(`   ECS Trainer: arn:aws:iam::${ACCOUNT_ID}:role/${ROLES.ECS_TRAINER}`);
    console.log(`   Amplify: arn:aws:iam::${ACCOUNT_ID}:role/${ROLES.AMPLIFY}`);

    console.log("\n🎉 Session 1 IAM setup complete!\n");

  } catch (error) {
    console.error("\n❌ Setup failed:", error);
    process.exit(1);
  }
}

setup();
