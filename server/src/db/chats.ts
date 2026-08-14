import { database } from './database.js';

export function getChatsByUserId(
  userId: number,
) {
  const statement = database.prepare(`
    SELECT
      chat.id,
      otherUser.name,
      chat.isOnline
    FROM chats AS chat

    JOIN chat_members AS currentMember
      ON currentMember.chatId = chat.id
      AND currentMember.userId = ?

    JOIN chat_members AS otherMember
      ON otherMember.chatId = chat.id
      AND otherMember.userId != ?

    JOIN users AS otherUser
      ON otherUser.id = otherMember.userId

    ORDER BY chat.id ASC
  `);

  return statement.all(
    userId,
    userId,
  );
}

export function getChatById(
  chatId: number,
  userId: number,
) {
  const statement = database.prepare (`
    SELECT
      chat.id,
      otherUser.name,
      chat.isOnline
    FROM chats AS chat

    JOIN chat_members AS currentMember
      ON currentMember.chatId = chat.id
      AND currentMember.userId = ?

    JOIN chat_members AS otherMember
      ON otherMember.chatId = chat.id
      AND otherMember.userId != ?

    JOIN users AS otherUser
      ON otherUser.id = otherMember.userId

    WHERE chat.id = ?
    LIMIT 1  
  `);

  return statement.get(
    userId,
    userId,
    chatId,
  );
}