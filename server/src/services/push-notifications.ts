import {
  getPushTokensForChatRecipients,
  removeInvalidPushToken,
} from '../db/push-tokens.js';

import type {
  MessageData,
} from '../types/message.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const MAX_BATCH_SIZE = 100;

type PushTicket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
};

type ExpoPushResponse = {
  data?: PushTicket[] | PushTicket;
  errors?: unknown[];
};

export async function sendNewMessagePush(
  message: MessageData,
  senderId: number,
  senderName: string,
): Promise<void> {
  const tokens = getPushTokensForChatRecipients(
    message.chatId,
    senderId,
  );

  if (tokens.length === 0) {
    return;
  }

  const text = message.text.trim();

  const preview = text
    ? text.length > 160
      ? `${text.slice(0, 159)}...`
      : text
    : '📎 Вложение';

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  const accessToken = process.env.EXPO_ACCESS_TOKEN;

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  for (let start = 0; start < tokens.length; start += MAX_BATCH_SIZE) {
    const batch = tokens.slice(
      start,
      start + MAX_BATCH_SIZE,
    );

    const notifications = batch.map((token) => ({
      to: token,
      title: senderName,
      body: preview,
      channelId: 'messages',
      priority: 'high' as const,
      tag: `rutsuna-chat-${message.chatId}-message-${message.id}`,
      data: {
        chatId: message.chatId,
        messageId: message.id,
      },
    }));

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify(notifications),
    });

    if (!response.ok) {
      throw new Error(
        `Expo Push API returned HTTP ${response.status}`,
      );
    }

    const payload = (await response.json()) as ExpoPushResponse;

    const tickets = Array.isArray(payload.data)
      ? payload.data
      : payload.data
        ? [payload.data]
        : [];

    if (tickets.length !== batch.length) {
      throw new Error(
        'Expo returned an unexpected number of push tickets',
      );
    }

    for (let index = 0; index < tickets.length; index++) {
      const ticket = tickets[index];

      if (ticket.status === 'ok') {
        continue;
      }

      const errorCode = ticket.details?.error ?? 'UnknownError';

      console.warn(
        `[push] Expo ticket error: ${errorCode}`,
      );

      if (errorCode === 'DeviceNotRegistered') {
        removeInvalidPushToken(batch[index]);
      }
    }

    console.log(
      `[push] Processed ${tickets.length} notification tickets`,
    );
  }
}