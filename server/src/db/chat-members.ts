import { database } from './database.js';

export function isUserInChat(
  chatId: number,
  userId: number,
) {
  const statement = database.prepare(`
    SELECT 1
    FROM chat_members
    WHERE chatId = ?
      AND userId = ?
    LIMIT 1  
  `);

  return Boolean(statement.get(chatId, userId));
}