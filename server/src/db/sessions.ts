import { database } from './database.js';

export function insertSession(
  token: string,
  userId: number,
  createdAt: number,
  expiresAt: number,
) {
  const statement = database.prepare(`
    INSERT INTO sessions(
      token,
      userId,
      createdAt,
      expiresAt
    )
    VALUES (?, ?, ?, ?)
  `);

  return statement.run(
    token,
    userId,
    createdAt,
    expiresAt,
  );
}

export function getSessionByToken(token: string) {
  const statement = database.prepare(`
    SELECT
      token,
      userId,
      createdAt,
      expiresAt
    FROM sessions
    WHERE token = ?
    LIMIT 1  
  `);

  return statement.get(token);
}

export function deleteSession(token: string) {
  const statement = database.prepare(`
    DELETE FROM session
    WHERE token = ?  
  `);

  return statement.run(token);
}