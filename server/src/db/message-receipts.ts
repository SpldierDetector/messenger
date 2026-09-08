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
      AND deliveredAt IS NULL
  `);

  return statement.run(
    deliveredAt,
    messageId,
    userId,
  );
}

export function markChatMessagesRead(
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
          AND deletedAt IS NULL
      )
    RETURNING
      messageId,
      userId,
      deliveredAt,
      readAt
  `);

  return statement.all(
    readAt,
    readAt,
    userId,
    chatId,
  ) as Array<{
    messageId: number;
    userId: number;
    deliveredAt: number | null;
    readAt: number | null;
  }>;
}

export function getUnreadMessageCountsByUserId(
  userId: number,
) {
  const statement = database.prepare(`
    SELECT
      messages.chatId AS chatId,
      COUNT(*) AS unreadCount 
    FROM message_receipts
    JOIN messages
      ON messages.id = message_receipts.messageId
    WHERE message_receipts.userId = ?
      AND message_receipts.readAt IS NULL
      AND messages.deletedAt IS NULL
    GROUP BY messages.chatId
    ORDER BY messages.chatId ASC 
  `);

  return statement.all(
    userId,
  ) as Array<{
    chatId: number;
    unreadCount: number;
  }>;
}

export function getMessageReceiptsByChatId(
  chatId: number,
  senderId: number,
) {
  const statement = database.prepare(`
    SELECT
      message_receipts.messageId,
      message_receipts.userId,
      message_receipts.deliveredAt,
      message_receipts.readAt
    FROM message_receipts
    JOIN messages
      ON messages.id =
        message_receipts.messageId
    WHERE messages.chatId = ?
      AND messages.senderId = ?
    ORDER BY message_receipts.messageId ASC  
  `);

  return statement.all(
    chatId,
    senderId,
  );
}