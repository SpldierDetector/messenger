import type { MessageData } from '@/types/message';

export function createOutgoingMessage(
  chatId: number,
  text: string
): MessageData {
  const now = Date.now();

  return {
    id: now,
    chatId,
    senderId: 1,
    author: 'Me',
    text: text.trim(),
    createdAt: now,
    isOwn: true,
  };
}