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

export function getMessagePreviewText(
  message: MessageData,
): string {
  const author =
    message.isOwn
      ? 'Вы'
      : message.author;

  const text = message.text.trim();

  if (text) {
    return `${author}: ${text}`;
  }

  const attachment = message.attachments[0];

  if (!attachment) {
    return `${author}: Сообщение`;
  }

  switch (attachment.type) {
    case 'image':
      return `${author}: 📷 Фото`;

    case 'audio':
      return `${author}: 🎤 Голосовое сообщение`;

    case 'file':
      return `${author}: 📎 Файл`;
  }
}