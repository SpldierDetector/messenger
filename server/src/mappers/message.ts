import type {
  MessageData,
  MessageRow,
} from '../types/message.js';

export function mapMessageRow(row: MessageRow): MessageData {
  return {
    ...row,
    isOwn: Boolean(row.isOwn),
  };
}