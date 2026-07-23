import { API_BASE_URL } from '@/config/api';
import type { MessageData } from '@/types/message';
import type {
  SendMessageRequest,
  SendMessageResponse,
} from '@/types/message-api';

export async function getMessagesRequest(): Promise<MessageData[]> {
  const response = await fetch(`${API_BASE_URL}/messages`);

  if (!response.ok) {
    throw new Error('Failed to load message');
  }

  return response.json();
}

export async function sendMessageRequest(
  data: SendMessageRequest
): Promise<SendMessageResponse> {
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

  return response.json();
}