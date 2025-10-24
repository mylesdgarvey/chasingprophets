import { ddbDocClient } from './dynamodb';
import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

export interface Notification {
  userId: string;
  notificationId: string;
  message: string;
  checked?: boolean;
  createdAt?: string;
}

const TABLE = 'ChasingProphets-Notifications';

export async function getUnreadNotificationsForUser(userId: string): Promise<Notification[]> {
  try {
    console.debug('getUnreadNotificationsForUser: userId=', userId);
    const command = new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'userId = :uid',
      FilterExpression: 'checked = :false',
      ExpressionAttributeValues: {
        ':uid': userId,
        ':false': false
      }
    });

    const resp = await ddbDocClient.send(command);
    console.debug('getUnreadNotificationsForUser: resp.Items=', resp.Items && resp.Items.length ? resp.Items.length : 0);
    return (resp.Items || []) as Notification[];
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return [];
  }
}

export async function markNotificationChecked(userId: string, notificationId: string): Promise<void> {
  try {
    const command = new UpdateCommand({
      TableName: TABLE,
      Key: { userId, notificationId },
      UpdateExpression: 'SET checked = :true',
      ExpressionAttributeValues: { ':true': true }
    });

    await ddbDocClient.send(command);
  } catch (err) {
    console.error('Error marking notification checked:', err);
    throw err;
  }
}

// Accept either a single userId or an array of userIds (username and/or email) and return a
// deduplicated unread count across those keys.
export async function getUnreadCountForUser(userId: string | string[]): Promise<number> {
  try {
    const ids = Array.isArray(userId) ? (userId as string[]).filter(Boolean) : [userId as string];
    console.debug('getUnreadCountForUser: ids=', ids);
    const seen = new Set<string>();
    for (const id of ids) {
      const items = await getUnreadNotificationsForUser(id);
      for (const it of items) {
        if (it && it.notificationId) seen.add(it.notificationId);
      }
    }
    console.debug('getUnreadCountForUser: dedupedCount=', seen.size);
    return seen.size;
  } catch (err) {
    console.error('Error getting unread count:', err);
    return 0;
  }
}

export async function markAllReadForUser(userId: string): Promise<void> {
  try {
    const unread = await getUnreadNotificationsForUser(userId);
    await Promise.all(unread.map(n => markNotificationChecked(userId, n.notificationId)));
  } catch (err) {
    console.error('Error marking all notifications read:', err);
    throw err;
  }
}
