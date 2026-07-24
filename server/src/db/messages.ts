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