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

export function hideChatForUser(
  chatId: number,
  userId: number,
) {
  const statement = database.prepare(`
    UPDATE chat_members
    SET hiddenAt = ?
    WHERE chatId = ?
      AND userId = ?
  `);

  return statement.run(
    Date.now(),
    chatId,
    userId,
  );
}

export function showChatForUser(
  chatId: number,
  userId: number,
) {
  const statement = database.prepare(`
    UPDATE chat_members
    SET hiddenAt = NULL
    WHERE chatId = ?
      AND userId = ?  
  `);

  return statement.run(
    chatId,
    userId,
  );
}

export function showChatForAllMembers(
  chatId: number,
) {
  const statement = database.prepare(`
    UPDATE chat_members
    SET hiddenAt = NULL
    WHERE chatId = ?  
  `);

  return statement.run(chatId);
}

export function getChatIdsByUserId(
  userId: number,
) {
  const statement = database.prepare(`
    SELECT chatId
    FROM chat_members
    WHERE userId = ?
  `);

  return statement.all(
    userId,
  ) as Array<{
    chatId: number;
  }>;
}

export function clearChatHistoryForUser(
  chatId: number,
  userId: number,
) {
  const statement = database.prepare(`
    UPDATE chat_members
    SET clearedBeforeMessageId = (
      SELECT MAX(id)
      FROM messages
      WHERE chatId = ?
    )
    WHERE chatId = ?
      AND userId = ?  
  `);

  return statement.run(
    chatId,
    chatId,
    userId,
  );
}

export function hideChatWithHistoryForUser(
  chatId: number,
  userId: number,
) {
  database.exec('BEGIN');

  try {
    const clearStatement = database.prepare(`
      UPDATE chat_members
      SET clearedBeforeMessageId = (
        SELECT MAX(id)
        FROM messages
        WHERE chatId = ?
      )
      WHERE chatId = ?
        AND userId = ?
    `);

    clearStatement.run(
      chatId,
      chatId,
      userId,
    );

    const hideStatement = database.prepare(`
      UPDATE chat_members
      SET hiddenAt = ?
      WHERE chatId = ?
        AND userId = ?
    `);

    hideStatement.run(
      Date.now(),
      chatId,
      userId,
    );

    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');

    throw error;
  }
}