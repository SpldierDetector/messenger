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