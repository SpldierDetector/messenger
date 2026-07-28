import type {
  ChatData,
  ChatRow,
} from '../types/chat.js';

export function mapChatRow(row: unknown): ChatData {
  const chat = row as ChatRow;
  
  return {
    ...chat,
    isOnline: Boolean(chat.isOnline),
  };
}