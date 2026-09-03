import { database } from './database.js';

export function getMessagesByChatId(chatId: number) {
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
    WHERE message.chatId = ?
    ORDER BY message.createdAt ASC
  `);

  return statement.all(chatId);
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
      ORDER BY 
        latestMessage.createdAt DESC, 
        latestMessage.id DESC
      LIMIT 1
    )
    ORDER BY message.createdAt DESC
  `);

  return statement.all(userId);
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