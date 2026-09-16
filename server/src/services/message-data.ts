import { getAttachmentsByMessageIds } from '../db/attachments.js';
import { mapMessageRow, mapMessageRows } from '../mappers/message.js';
import type { MessageData, MessageRow } from '../types/message.js';

export function buildMessageDataRows(
  rows: unknown[],
): MessageData[] {
  const messageRows = rows as MessageRow[];

  if (messageRows.length === 0) {
    return [];
  }

  const messageIds =
    messageRows.map((message) => message.id);

  const attachmentRows = getAttachmentsByMessageIds(messageIds);

  return mapMessageRows(
    messageRows,
    attachmentRows,
  );
}

export function buildMessageData(
  row: unknown,
): MessageData {
  const messageRow = row as MessageRow;

  const messages = buildMessageDataRows([messageRow]);

  return (
    messages[0] ??
    mapMessageRow(messageRow)
  );
}