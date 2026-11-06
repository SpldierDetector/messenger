import { database } from './database.js';

const saveStatement = database.prepare(`
  INSERT INTO push_tokens (
    token,
    userId,
    createdAt,
    updatedAt
  )
  VALUES (?, ?, ?, ?)
    
  ON CONFLICT(token) DO UPDATE SET
    userId = excluded.userId,
    updatedAt = excluded.updatedAt
`)

const deletedStatement = database.prepare(`
  DELETE FROM push_tokens
  WHERE token = ? AND userId = ?  
`);

export function savePushToken(
  userId: number,
  token: string,
): void {
  const now = Date.now();

  saveStatement.run(token, userId, now, now);
}

export function removePushToken(
  userId: number,
  token: string,
): void {
  deletedStatement.run(token, userId);
}