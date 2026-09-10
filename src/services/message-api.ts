import { API_BASE_URL } from '@/config/api';
import type {
  MessageData,
  MessageReceiptData,
  UnreadMessageCount,
} from '@/types/message';
import type {
  EditMessageRequest,
  MessageApiData,
  SendMessageRequest,
} from '@/types/message-api';
import { mapMessageApiData } from '@/utils/map-message';

export async function getMessagesRequest(
  chatId: number,
  token: string,
  currentUserId: number,
): Promise<MessageData[]> {
  const response = await fetch(
    `${API_BASE_URL}/messages?chatId=${chatId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error('Failed to load message');
  }

  const messages = (await response.json()) as MessageApiData[];

  return messages.map((message) => 
    mapMessageApiData(message, currentUserId),
  );
}

export async function sendMessageRequest(
  data: SendMessageRequest,
  token: string,
  currentUserId: number,
): Promise<MessageData> {
  const response = await fetch(
    `${API_BASE_URL}/messages`, 
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  const message = (await response.json()) as MessageApiData;

  return mapMessageApiData(
    message,
    currentUserId,
  );
}

export async function editMessageRequest(
  messageId: number,
  text: string,
  token: string,
  currentUserId: number,
): Promise<MessageData> {
  const data: EditMessageRequest = {
    text,
  };

  const response = await fetch(
    `${API_BASE_URL}/messages/${messageId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error(
      'Failed to edit message',
    );
  }

  const message =
    (await response.json()) as MessageApiData;

  return mapMessageApiData(
    message,
    currentUserId,
  );
}

export async function deleteMessageRequest(
  messageId: number,
  token: string,
  currentUserId: number,
): Promise<MessageData> {
  const response = await fetch(
    `${API_BASE_URL}/messages/${messageId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      'Failed to delete message',
    );
  }

  const message = (await response.json()) as MessageApiData;

  return mapMessageApiData(
    message,
    currentUserId,
  );
}

export async function deleteMessageForMeRequest(
  messageId: number,
  token: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/messages/${messageId}/for-me`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      'Failed to delete message for current user',
    );
  }
}

export async function forwardMessageRequest(
  messageId: number,
  targetChatId: number,
  token: string,
  currentUserId: number,
): Promise<MessageData> {
  const response = await fetch(
    `${API_BASE_URL}/messages/${messageId}/forward`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        targetChatId,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      'Failed to forward message',
    );
  }

  const message = (await response.json()) as MessageApiData;

  return mapMessageApiData(message, currentUserId);
}

export async function getLatestMessagesRequest(
  token: string,
  currentUserId: number,
): Promise<MessageData[]> {
  const response = await fetch(
    `${API_BASE_URL}/messages/latest`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error('Failed to load latest messages');
  }

  const messages = (await response.json()) as MessageApiData[];
  
  return messages.map((message) =>
    mapMessageApiData(message, currentUserId),
  );
}

export async function getMessageReceiptsRequest(
  chatId: number,
  token: string,
): Promise<MessageReceiptData[]> {
  const response = await fetch(
    `${API_BASE_URL}/messages/receipts?chatId=${chatId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();

    console.error(
      'Failed to load message receipts:',
      response.status,
      errorBody,
    );

    throw new Error(
      `Failde to load message receipts: ${response.status}`,
    );
  }

  return response.json();
}

export async function getPendingDeliveryMessagesRequest(
  token: string,
  currentUserId: number,
): Promise<MessageData[]> {
  const response = await fetch(
    `${API_BASE_URL}/messages/pending-delivery`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();

    console.error(
      'Failed to load pending delivery messages:',
      response.status,
      errorBody,
    );

    throw new Error(
      `Failed to load pending delivery messages: ${response.status}`,
    );
  }

  const messages = (await response.json()) as MessageApiData[];

  return messages.map((message) =>
    mapMessageApiData(
      message,
      currentUserId,
    ),
  );
}

export async function getUnreadMessageCountsRequest(
  token: string,
): Promise<UnreadMessageCount[]> {
  const response = await fetch(
    `${API_BASE_URL}/messages/unread-counts`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();

    console.error(
      'Failed to load unread message counts:',
      response.status,
      errorBody,
    );

    throw new Error(
      `Failed to load unread message counts: ${response.status}`,
    );
  }

  return response.json() as Promise<UnreadMessageCount[]>;
}