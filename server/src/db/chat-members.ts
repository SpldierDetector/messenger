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

export function insertChatMember(
  chatId: number,
  userId: number,
) {
  const statement = database.prepare(`
    INSERT INTO chat_members (
      chatId,
      userId
    )
    VALUES (?, ?)  
  `);

  return statement.run(
    chatId,
    userId,
  );
}