import type {
  ChatData,
  ChatRow,
} from '../types/chat.js';

export function mapChatRow(
  row: unknown,
  isOnline?: boolean,
): ChatData {
  const chat = row as ChatRow;

  return {
    id: chat.id,
    name: chat.name,
    isOnline:
      isOnline ??
      Boolean(chat.isOnline),
    type: chat.type,
  };
}