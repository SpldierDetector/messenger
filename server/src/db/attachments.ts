import { database } from './database.js';

import type {
  AttachmentRow,
  AttachmentType,
} from '../types/message.js';

export function getAttachmentsByMessageIds(
  messageIds: number[],
): AttachmentRow[] {
  if (messageIds.length === 0) {
    return [];
  }

  const placeholders =
   messageIds
    .map(() => '?')
    .join(', ');

  return database
    .prepare(`
      SELECT
        id,
        chatId,
        messageId,
        uploaderId,
        type,
        originalName,
        storedName,
        mimeType,
        size,
        width,
        height,
        durationMs,
        sortOrder,
        createdAt
      FROM attachments
      WHERE messageId IN (${placeholders})
      ORDER by
        messageId ASC,
        sortOrder ASC,
        id ASC
    `)
    .all (
      ...messageIds,
    ) as AttachmentRow[];
}

export function insertAttachment(
  chatId: number,
  uploaderId: number,
  type: AttachmentType,
  originalName: string,
  storedName: string,
  mimeType: string,
  size: number,
  createdAt: number,
) {
  const statement = database.prepare(`
    INSERT INTO attachments (
      chatId,
      messageId,
      uploaderId,
      type,
      originalName,
      storedName,
      mimeType,
      size,
      width,
      height,
      durationMs,
      sortOrder,
      createdAt
    )
    VALUES (?, NULL, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, 0, ?)  
  `);

  return statement.run(
    chatId,
    uploaderId,
    type,
    originalName,
    storedName,
    mimeType,
    size,
    createdAt,
  );
}

export function getAttachmentById(
  attachmentId: number,
) {
  const statement = database.prepare(`
    SELECT
      id,
      chatId,
      messageId,
      uploaderId,
      type,
      originalName,
      storedName,
      mimeType,
      size,
      width,
      height,
      durationMs,
      sortOrder,
      createdAt
    FROM attachments
    WHERE id = ?
    LIMIT 1
  `);

  return statement.get(
    attachmentId,
  );
}

export function getAttachmentsByIdsForUploaderAndChat(
  attachmentIds: number[],
  uploaderId: number,
  chatId: number,
): AttachmentRow[] {
  if (attachmentIds.length === 0) {
    return [];
  }

  const placeholders = attachmentIds
    .map(() => '?')
    .join(', ');

  return database
    .prepare(`
      SELECT
        id,
        chatId,
        messageId,
        uploaderId,
        type,
        originalName,
        storedName,
        mimeType,
        size,
        width,
        height,
        durationMs,
        sortOrder,
        createdAt
      FROM attachments
      WHERE id IN (${placeholders})
        AND uploaderId = ?
        AND chatId = ?
    `)
    .all (
      ...attachmentIds,
      uploaderId,
      chatId
    ) as AttachmentRow[];
}

export function attachAttachmentsToMessage(
  attachmentIds: number[],
  uploaderId: number,
  chatId: number,
  messageId: number,
) {
  if (attachmentIds.length === 0) {
    return 0;
  }

  const statement =
    database.prepare(`
      UPDATE attachments
      SET
        messageId = ?,
        sortOrder = ? 
      WHERE id = ?
        AND uploaderId = ?
        AND chatId = ?
        AND messageId IS NULL
    `);

  let attachedCount = 0;

  for (
    let index = 0;
    index < attachmentIds.length;
    index += 1
  ) {
    const result =
      statement.run(
        messageId,
        index,
        attachmentIds[index],
        uploaderId,
        chatId,
      );

    attachedCount += Number(result.changes);
  }
  
  return attachedCount;
}

export function getDownloadableAttachmentForUser(
  attachmentId: number,
  chatId: number,
  userId: number,
): AttachmentRow | undefined {
  const statement = database.prepare(`
    SELECT attachment.*
    FROM attachments AS attachment
    
    JOIN messages AS message
      ON message.id = attachment.messageId
      AND message.chatId = attachment.chatId

    JOIN chat_members AS member
      ON member.chatId = message.chatId
      AND member.userId = ?

    LEFT JOIN message_hidden_for_users AS hidden
      ON hidden.messageId = message.id
      AND hidden.userId = member.userId

    WHERE attachment.id = ?
      AND attachment.chatId = ?
      AND message.deletedAt IS NULL
      AND hidden.messageId IS NULL
      AND (
        member.clearedBeforeMessageId IS NULL
        OR message.id >
          member.clearedBeforeMessageId IS NULL
          OR message.id >
            member.clearedBeforeMessageId
      )

    LIMIT 1
  `);

  return statement.get(
    userId,
    attachmentId,
    chatId,
  ) as AttachmentRow | undefined;
}