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
        SELECT message.id
        FROM messages AS message

        JOIN chat_members AS member
          ON member.chatId = message.chatId
          AND member.userId = ?

        LEFT JOIN message_hidden_for_users AS hidden
          ON hidden.messageId = message.id
          AND hidden.userId = ?

        WHERE message.chatId = ?
          AND message.deletedAt IS NULL
          AND hidden.messageId IS NULL
          AND (
            member.clearedBeforeMessageId IS NULL
            OR message.id >
              member.clearedBeforeMessageId
          )
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
    userId,
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
      message.chatId AS chatId,
      COUNT(*) AS unreadCount
    FROM message_receipts AS receipt

    JOIN messages AS message
      ON message.id = receipt.messageId

    JOIN chat_members AS member
      ON member.chatId = message.chatId
      AND member.userId = receipt.userId

    LEFT JOIN message_hidden_for_users AS hidden
      ON hidden.messageId = message.id
      AND hidden.userId = receipt.userId

    WHERE receipt.userId = ?
      AND receipt.readAt IS NULL
      AND message.deletedAt IS NULL
      AND hidden.messageId IS NULL
      AND (
        member.clearedBeforeMessageId IS NULL
        OR message.id >
          member.clearedBeforeMessageId
      )

    GROUP BY message.chatId
    ORDER BY message.chatId ASC
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
      receipt.messageId,
      receipt.userId,
      receipt.deliveredAt,
      receipt.readAt
    FROM message_receipts AS receipt

    JOIN messages AS message
      ON message.id = receipt.messageId

    JOIN chat_members AS member
      ON member.chatId = message.chatId
      AND member.userId = ?

    LEFT JOIN message_hidden_for_users AS hidden
      ON hidden.messageId = message.id
      AND hidden.userId = ?

    WHERE message.chatId = ?
      AND message.senderId = ?
      AND hidden.messageId IS NULL
      AND (
        member.clearedBeforeMessageId IS NULL
        OR message.id >
          member.clearedBeforeMessageId
      )

    ORDER BY receipt.messageId ASC
  `);

  return statement.all(
    senderId,
    senderId,
    chatId,
    senderId,
  );
}