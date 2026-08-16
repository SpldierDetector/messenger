import { API_BASE_URL } from '@/config/api';
import type { ChatData } from '@/types/chat';

export async function getChatsRequest(
  token: string,
): Promise<ChatData[]> {
  const response = await fetch(
    `${API_BASE_URL}/chats`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();

    console.error(
      'Failed to load chats:',
      response.status,
      errorBody,
    );

    throw new Error(`Failed to load chats: ${response.status}`);
  }

  return response.json();
}

export async function getChatRequest (
  chatId: number,
  token: string,
): Promise<ChatData | null> {
  const response = await fetch(
    `${API_BASE_URL}/chats/${chatId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorBody = await response.text();

    console.error(
      'Failed to load chats:',
      response.status,
      errorBody,
    );
    
    throw new Error(`Failed to load chats: ${response.status}`);
  }

  return response.json();
}

export async function createDirectChatRequest(
  userId: number,
  token: string,
): Promise<ChatData> {
  const response = await fetch(
    `${API_BASE_URL}/chats/direct`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId,
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();

    console.error(
      'Failed to create direct chat:',
      response.status,
      errorBody,
    );

    throw new Error(
      `Failed to create direct chat: ${response.status}`,
    );
  }

  return response.json();
}

export async function deleteChatRequest(
  chatId: number,
  token: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/chats/${chatId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();

    console.error(
      'Failed to delete chat:',
      response.status,
      errorBody,
    );

    throw new Error(
      `Failed to delete chat: ${response.status}`,
    );
  }
}