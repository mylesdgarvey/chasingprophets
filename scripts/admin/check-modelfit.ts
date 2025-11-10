import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || ''
  }
});

const cmd = new ScanCommand({ TableName: 'ChasingProphets-ModelFits', Limit: 1 });
const result = await client.send(cmd);
if (result.Items && result.Items[0]) {
  console.log(JSON.stringify(unmarshall(result.Items[0]), null, 2));
}
