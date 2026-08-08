import { API_BASE_URL } from '@/config/api';
import type { MessageData } from '@/types/message';
import type {
  MessageApiData,
  SendMessageRequest,
} from '@/types/message-api';
import { mapMessageApiData } from '@/utils/map-message';

export async function getMessagesRequest(
  chatId: number
): Promise<MessageData[]> {
  const response = await fetch(
    `${API_BASE_URL}/messages?chatId=${chatId}`
  );

  if (!response.ok) {
    throw new Error('Failed to load message');
  }

  const messages = (await response.json()) as MessageApiData[];

  return messages.map(mapMessageApiData);
}

export async function sendMessageRequest(
  data: SendMessageRequest,
): Promise<MessageData> {
  const response = await fetch(`${API_BASE_URL}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  const message = (await response.json()) as MessageApiData;

  return mapMessageApiData(message);
}

export async function getLatestMessagesRequest(): Promise<MessageData[]> {
  const response = await fetch(
    `${API_BASE_URL}/messages/latest`
  );

  if (!response.ok) {
    throw new Error('Failed to load latest messages');
  }

  const messages = (await response.json()) as MessageApiData[];
  
  return messages.map(mapMessageApiData);
}