import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

import { API_BASE_URL } from '@/config/api';
import { ApiError } from './api-error';

let knownPushToken: string | null = null;

let operationQueue: Promise<void> = Promise.resolve();

function enqueue(
  operation: () => Promise<void>,
): Promise<void> {
  const current = operationQueue.then(operation);

  operationQueue = current.catch(() => undefined);

  return current;
}

async function getPushToken(
  requestPermission: boolean,
): Promise<string | null> {
  if (Platform.OS !== 'android') {
    return null;
  }

  await Notifications.setNotificationChannelAsync('messages', {
    name: 'Сообщения',
    importance: Notifications.AndroidImportance.HIGH,
  });

  const permission = await Notifications.getPermissionsAsync();
  let status = permission.status;

  if (
    requestPermission &&
    status === Notifications.PermissionStatus.UNDETERMINED
  ) {
    const result = await Notifications.requestPermissionsAsync();
    status = result.status;
  }

  if (status !== Notifications.PermissionStatus.GRANTED) {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    throw new Error('EAS Project ID не найден');
  }

  const result = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  knownPushToken = result.data;

  return result.data;
}

async function sendPushTokenRequest(
  authToken: string,
  pushToken: string,
  method: 'POST' | 'DELETE',
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/push-tokens`,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        token: pushToken,
      }),
    },
  );

  if (!response.ok) {
    throw new ApiError(
      'Push token request failed',
      response.status,
    );
  }
}

export function registerDevicePushToken(
  authToken: string,
): Promise<void> {
  return enqueue(async () => {
    const pushToken = await getPushToken(true);

    if (!pushToken) {
      console.log('[push] Регистрация пропущена');
      return;
    }

    await sendPushTokenRequest(
      authToken,
      pushToken,
      'POST',
    );

    console.log('[push] Устройство зарегистрировано на сервере');
  });
}

export function unregisterDevicePushToken(
  authToken: string,
): Promise<void> {
  return enqueue(async () => {
    const pushToken = knownPushToken ?? await getPushToken(false);

    if (!pushToken) {
      return;
    }

    await sendPushTokenRequest(
      authToken,
      pushToken,
      'DELETE',
    );

    console.log('[push] Устройство отвязано от аккаунта');
  });
}