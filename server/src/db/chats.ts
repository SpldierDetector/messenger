import { database } from './database.js';
import { insertChatMember } from './chat-members.js'; 
import type { ChatRow } from '../types/chat.js';

export function getChatsByUserId(
  userId: number,
) {
  const statement = database.prepare(`
    SELECT
      chat.id,
      otherUser.name,
      chat.isOnline,
      chat.type
    FROM chats AS chat

    JOIN chat_members AS currentMember
      ON currentMember.chatId = chat.id
      AND currentMember.userId = ?
      AND currentMember.hiddenAt IS NULL

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
      chat.isOnline,
      chat.type
    FROM chats AS chat

    JOIN chat_members AS currentMember
      ON currentMember.chatId = chat.id
      AND currentMember.userId = ?
      AND currentMember.hiddenAt IS NULL

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

export function getDirectChatBetweenUsers(
  currentUserId: number,
  otherUserId: number,
) {
  const statement = database.prepare(`
    SELECT
      chat.id,
      otherUser.name,
      chat.isOnline,
      chat.type
    FROM chats AS chat
    
    JOIN chat_members AS currentMember
      ON currentMember.chatId = chat.id
      AND currentMember.userId = ?

    JOIN chat_members AS otherMember
      ON otherMember.chatId = chat.id
      AND otherMember.userId = ?

    JOIN users AS otherUser
      ON otherUser.id = otherMember.userId

    WHERE chat.type = 'direct'
      AND (
        SELECT COUNT(*)
        FROM chat_members AS memberCount
        WHERE memberCount.chatId = chat.id
      ) = 2

    LIMIT 1
  `);

  return statement.get(
    currentUserId,
    otherUserId,
  ) as ChatRow | undefined;
}

export function createDirectChat(
  currentUserId: number,
  otherUserId: number,
) {
  database.exec('BEGIN');

  try {
    const statement = database.prepare(`
      INSERT INTO chats (
        name,
        isOnline,
        type
      )
      VALUES ('', 0, 'direct')
    `);

    const result = statement.run();

    const chatId =
      Number(result.lastInsertRowid);

    insertChatMember(
      chatId,
      currentUserId,
    );

    insertChatMember(
      chatId,
      otherUserId,
    );

    database.exec('COMMIT');

    return getChatById(
      chatId,
      currentUserId,
    );
  } catch (error) {
    database.exec('ROLLBACK');

    throw error;
  }
}