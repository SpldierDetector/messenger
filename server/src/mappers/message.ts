import type {
  AttachmentData,
  AttachmentRow,
  MessageData,
  MessageRow,
} from '../types/message.js';

export function mapAttachmentRow(
  row: AttachmentRow,
): AttachmentData {
  return {
    id: row.id,
    type: row.type,
    originalName: row.originalName,
    mimeType: row.mimeType,
    size: row.size,
    width: row.width,
    height: row.height,
    durationMs: row.durationMs,
    createdAt: row.createdAt,
  };
}

export function mapMessageRow(
  row: unknown,
): MessageData {
  return {
    ...(row as MessageRow),
    attachments: [],
  };
}

export function mapMessageRowWithAttachments(
  row: unknown,
  attachments: AttachmentData[],
): MessageData {
  return {
    ...(row as MessageRow),
    attachments,
  };
}

export function mapMessageRows(
  rows: unknown[],
  attachmentRows: AttachmentRow[],
): MessageData[] {
  const attachmentsByMessageId =
    new Map<number, AttachmentData[]>();

  for (const attachmentRow of attachmentRows) {
    if (attachmentRow.messageId === null) {
      continue;
    }

    const currentAttachments =
      attachmentsByMessageId.get(
        attachmentRow.messageId,
      ) ?? [];

    attachmentsByMessageId.set(
      attachmentRow.messageId,
      [
        ...currentAttachments,
        mapAttachmentRow(
          attachmentRow,
        ),
      ],
    );
  }

  return rows.map((row) => {
    const messageRow =
      row as MessageRow;

    return mapMessageRowWithAttachments(
      messageRow,
      attachmentsByMessageId.get(
        messageRow.id,
      ) ?? [],
    );
  });
}