import type {
  MessageData,
  MessageRow,
} from '../types/message.js';

export function mapMessageRow(row: unknown): MessageData {
  return row as MessageRow;
}