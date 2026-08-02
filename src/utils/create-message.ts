import type { MessageData } from '@/types/message';
import { CURRENT_USER_ID } from '@/config/current-user'

export function createOutgoingMessage(
  chatId: number,
  text: string
): MessageData {
  const now = Date.now();

  return {
    id: now,
    chatId,
    senderId: CURRENT_USER_ID,
    author: 'Me',
    text: text.trim(),
    createdAt: now,
    isOwn: true,
  };
}