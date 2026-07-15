import type { MessageData } from '@/types/message';

export function getLastMessage(
  messages: MessageData[],
  chatId: number
) {
  return messages.findLast(
    (message) => message.chatId === chatId
  );
}