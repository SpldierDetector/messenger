import { database } from './database.js';

export function getMessagesByChatId(chatId: number) {
  const statement = database.prepare(`
    SELECT
      id,
      chatId,
      author,
      text,
      createdAt,
      isOwn
    FROM messages
    WHERE chatId = ?
    ORDER BY createdAt ASC
  `);

  return statement.all(chatId);
}

export function getLatestMessages() {
  const statement = database.prepare(`
    SELECT
      id,
      chatId,
      author,
      text,
      createdAt,
      isOwn
    FROM messages AS message
    WHERE id = (
      SELECT id
      FROM messages
      WHERE chatId = message.chatId
      ORDER BY createdAt DESC, id DESC
      LIMIT 1
    )
    ORDER BY createdAt DESC
  `);

  return statement.all();
}

export function insertMessage(
  chatId: number,
  author: string,
  text: string,
  createdAt: number,
  isOwn: boolean,
) {
  const statement = database.prepare(`
    INSERT INTO messages (
      chatId,
      author,
      text,
      createdAt,
      isOwn
    )
    VALUES (?, ?, ?, ?, ?)
  `);

  return statement.run(
    chatId,
    author,
    text,
    createdAt,
    isOwn ? 1 : 0,
  );
}

