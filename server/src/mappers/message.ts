import type {
  MessageData,
  MessageRow,
} from '../types/message.js';

export function mapMessageRow(row: unknown): MessageData {
  const message = row as MessageRow;

  return {
    ...message,
    isOwn: Boolean(message.isOwn),
  };
}