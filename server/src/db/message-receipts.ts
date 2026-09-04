import { database } from './database.js';

export function createMessageReceipts(
  messageId: number,
  chatId: number,
  senderId: number,
) {
  const statement = database.prepare(`
    INSERT OR IGNORE INTO message_receipts (
      messageId,
      userId
    )  
    SELECT ?, userId
    FROM chat_members
    WHERE chatId = ?
      AND userId != ?
  `);

  return statement.run(
    messageId,
    chatId,
    senderId,
  );
}

export function markMessageDelivered(
  messageId: number,
  userId: number,
  deliveredAt: number,
) {
  const statement = database.prepare(`
    UPDATE message_receipts
    SET deliveredAt = COALESCE(
      deliveredAt,
      ?
    )
    WHERE messageId = ?
      AND userId = ?
  `);

  return statement.run(
    deliveredAt,
    messageId,
    userId,
  );
}

export function markChatMessageRead(
  chatId: number,
  userId: number,
  readAt: number,
) {
  const statement = database.prepare(`
    UPDATE message_receipts
    SET
      deliveredAt = COALESCE(
        deliveredAt,
        ?
      ),
      readAt = COALESCE(
        readAt,
        ?
      )
    WHERE userId = ?
      AND readAt IS NULL
      AND messageId IN (
        SELECT id
        FROM messages
        WHERE chatId = ?
      )
  `);

  return statement.run(
    readAt,
    readAt,
    userId,
  );
}