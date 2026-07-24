import { database } from './database.js';

export function getChats() {
  const statement = database.prepare(`
    SELECT
      id,
      name,
      isOnline
    FROM chats
    ORDER BY id ASC
  `);

  return statement.all();
}

export function getChatById(chatId: number) {
  const statement = database.prepare (`
    SELECT
      id,
      name,
      isOnline
    FROM chats
    WHERE id = ?
    LIMIT 1  
  `);

  return statement.get(chatId);
}