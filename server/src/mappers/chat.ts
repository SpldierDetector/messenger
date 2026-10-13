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
    otherUserId: chat.otherUserId,
    name: chat.name,
    isOnline:
      isOnline ??
      Boolean(chat.isOnline),
    lastSeenAt:
      chat.otherUserLastSeenAt,
    type: chat.type,
    avatarUrl: chat.avatarUrl ?? null,
  };
}