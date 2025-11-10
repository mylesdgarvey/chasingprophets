/**
 * Check MLR model parameters structure
 */

import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const ddb = new DynamoDBClient({ region: 'us-east-1' });
const s3 = new S3Client({ region: 'us-east-1' });

async function checkMLRParameters() {
  // Find an MLR model fit
  const scanCommand = new ScanCommand({
    TableName: 'ModelFits',
    FilterExpression: 'contains(scaffoldId, :mlr)',
    ExpressionAttributeValues: {
      ':mlr': { S: 'MLR' }
    },
    Limit: 1
  });

  const result = await ddb.send(scanCommand);
  
  if (!result.Items || result.Items.length === 0) {
    console.log('No MLR model fits found');
    return;
  }

  const fit = unmarshall(result.Items[0]);
  console.log('\nMLR Model Fit:');
  console.log('  ID:', fit.modelFitId);
  console.log('  Parameters Path:', fit.modelParametersPath);

  if (fit.modelParametersPath) {
    // Extract bucket and key from s3:// path
    const s3Path = fit.modelParametersPath.replace('s3://', '');
    const [bucket, ...keyParts] = s3Path.split('/');
    const key = keyParts.join('/');

    console.log('\n  Loading parameters from S3...');
    const getCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });

    const response = await s3.send(getCommand);
    const bodyString = await response.Body?.transformToString();
    
    if (bodyString) {
      const params = JSON.parse(bodyString);
      console.log('\n  Parameters structure:');
      console.log(JSON.stringify(params, null, 2));
    }
  }
}

checkMLRParameters().catch(console.error);
