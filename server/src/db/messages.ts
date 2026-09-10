import { database } from './database.js';

export function getMessagesByChatId(chatId: number, userId: number) {
  const statement = database.prepare(`
    SELECT
      message.id,
      message.chatId,
      message.senderId,
      sender.name AS author,
      message.text,
      message.createdAt,
      message.editedAt,
      message.deletedAt,
      message.replyToMessageId,
      message.forwardedFromMessageId,
      message.forwardedFromAuthor
    FROM messages AS message

    JOIN users AS sender
      ON sender.id = message.senderId

    JOIN chat_members AS member
      ON member.chatId = message.chatId
      AND member.userId = ?

    LEFT JOIN message_hidden_for_users AS hidden
      ON hidden.messageId = message.id
      AND hidden.userId = ?

    WHERE message.chatId = ?
      AND hidden.messageId IS NULL
      AND (
        member.clearedBeforeMessageId IS NULL
        OR message.id >
          member.clearedBeforeMessageId
      )

    ORDER BY message.createdAt ASC
  `);

  return statement.all(userId, userId, chatId);
}

export function getLatestMessagesByUserId(userId: number) {
  const statement = database.prepare(`
    SELECT
      message.id,
      message.chatId,
      message.senderId,
      sender.name AS author,
      message.text,
      message.createdAt,
      message.editedAt,
      message.deletedAt,
      message.replyToMessageId,
      message.forwardedFromMessageId,
      message.forwardedFromAuthor
    FROM messages AS message

    JOIN users AS sender
      ON sender.id = message.senderId

    JOIN chat_members AS member
      ON member.chatId = message.chatId
      AND member.userId = ?
      AND member.hiddenAt IS NULL

    WHERE message.id = (
      SELECT latestMessage.id
      FROM messages AS latestMessage
      WHERE latestMessage.chatId = message.chatId
        AND latestMessage.deletedAt IS NULL
        AND (
          member.clearedBeforeMessageId IS NULL
          OR latestMessage.id >
            member.clearedBeforeMessageId
        )

        AND NOT Exists (
          SELECT 1
          FROM message_hidden_for_users AS hidden
          WHERE hidden.messageId = latestMessage.id
            AND hidden.userId = member.userId
        )

      ORDER BY 
        latestMessage.createdAt DESC, 
        latestMessage.id DESC
      LIMIT 1
    )
    ORDER BY message.createdAt DESC
  `);

  return statement.all(userId);
}

export function getPendingDeliveryMessagesByUserId(
  userId: number,
) {
  const statement = database.prepare(`
    SELECT
      message.id,
      message.chatId,
      message.senderId,
      sender.name AS author,
      message.text,
      message.createdAt,
      message.editedAt,
      message.deletedAt,
      message.replyToMessageId,
      message.forwardedFromMessageId,
      message.forwardedFromAuthor
    FROM message_receipts AS receipt
    
    JOIN messages AS message
      ON message.id = receipt.messageId

    JOIN users AS sender
      ON sender.id = message.senderId

    JOIN chat_members AS member
      ON member.chatId = message.chatId
      AND member.userId = receipt.userId

    LEFT JOIN message_hidden_for_users AS hidden
      ON hidden.messageId = message.id
      AND hidden.userId = receipt.userId

    WHERE receipt.userId = ?
      AND receipt.deliveredAt IS NULL
      AND message.deletedAt IS NULL
      AND hidden.messageId IS NULL
      AND (
        member.clearedBeforeMessageId IS NULL
        OR message.id > member.clearedBeforeMessageId
      )

    ORDER BY
      message.createdAt ASC,
      message.id ASC
  `);

  return statement.all(
    userId,
  );
}

export function getMessageById(messageId: number) {
  const statement = database.prepare(`
    SELECT
      message.id,
      message.chatId,
      message.senderId,
      sender.name AS author,
      message.text,
      message.createdAt,
      message.editedAt,
      message.deletedAt,
      message.replyToMessageId,
      message.forwardedFromMessageId,
      message.forwardedFromAuthor
    FROM messages AS message
    JOIN users AS sender
      ON sender.id = message.senderId
    WHERE message.id = ?
    LIMIT 1  
  `);

  return statement.get(messageId);
}

export function insertMessage(
  chatId: number,
  senderId: number,
  author: string,
  text: string,
  createdAt: number,
  isOwn: boolean,
  replyToMessageId: number | null,
) {
  const statement = database.prepare(`
    INSERT INTO messages (
      chatId,
      senderId,
      author,
      text,
      createdAt,
      isOwn,
      replyToMessageId
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  return statement.run(
    chatId,
    senderId,
    author,
    text,
    createdAt,
    isOwn ? 1 : 0,
    replyToMessageId,
  );
}

export function insertForwardedMessage(
  chatId: number,
  senderId: number,
  author: string,
  text: string,
  createdAt: number,
  forwardedFromMessageId: number,
  forwardedFromAuthor: string,
) {
  const statement = database.prepare(`
    INSERT INTO messages (
      chatId,
      senderId,
      author,
      text,
      createdAt,
      isOwn,
      replyToMessageId,
      forwardedFromMessageId,
      forwardedFromAuthor
    )  
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  return statement.run(
    chatId,
    senderId,
    author,
    text,
    createdAt,
    1,
    null,
    forwardedFromMessageId,
    forwardedFromAuthor,
  )
}

export function updateMessage(
  messageId: number,
  text: string,
  editedAt: number,
) {
  const statement = database.prepare(`
    UPDATE messages
    SET
      text = ?,
      editedAt = ?
    WHERE id = ?  
  `);

  return statement.run(
    text,
    editedAt,
    messageId,
  );
}

export function deleteMessage(
  messageId: number,
  deletedAt: number,
) {
  const statement = database.prepare(`
    UPDATE messages
    SET deletedAt = ?
    WHERE id = ?
  `);

  return statement.run(
    deletedAt,
    messageId,
  );
}

export function hideMessageForUser(
  messageId: number,
  userId: number,
  hiddenAt: number,
) {
  const statement = database.prepare(`
    INSERT OR IGNORE INTO
      message_hidden_for_users (
        messageId,
        userId,
        hiddenAt
      )
    VALUES (?, ?, ?)  
  `);

  return statement.run(
    messageId,
    userId,
    hiddenAt,
  );
}