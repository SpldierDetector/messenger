import type {
  ChatData,
  ChatRow,
} from '../types/chat.js';

export function mapChatRow(row: ChatRow): ChatData {
  return {
    ...row,
    isOnline: Boolean(row.isOnline),
  };
}