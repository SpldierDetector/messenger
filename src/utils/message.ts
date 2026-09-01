import type { MessageData } from '@/types/message';

export function getLastMessage(
  messages: MessageData[],
  chatId: number
) {
  const chatMessages = messages.filter(
    (message) =>
      message.chatId === chatId &&
      message.deletedAt === null,
  );

  if (chatMessages.length === 0) {
    return undefined;
  }

  return chatMessages.reduce(
    (latestMessage, message) => 
      message.createdAt > latestMessage.createdAt
        ? message
        : latestMessage,
  );
}