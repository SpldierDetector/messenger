import { API_BASE_URL } from '@/config/api';
import type { ChatData } from '@/types/chat';

export async function getChatsRequest(): Promise<ChatData[]> {
  const response = await fetch(`${API_BASE_URL}/chats`);

  if (!response.ok) {
    throw new Error('Failed to load chats');
  }

  return response.json();
}

export async function getChatRequest (
  chatId: number,
): Promise<ChatData | null> {
  const response = await fetch(`${API_BASE_URL}/chats/${chatId}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to load chat');
  }

  return response.json();
}