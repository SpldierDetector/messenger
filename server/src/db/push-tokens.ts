import { createHash } from 'node:crypto';
import { database } from './database.js';

function hashSessionToken(authToken: string): string {
  return createHash('sha256')
    .update(authToken)
    .digest('hex');
}

const saveStatement = database.prepare(`
  INSERT INTO push_tokens (
    token,
    userId,
    sessionHash,
    createdAt,
    updatedAt
  )
  VALUES (?, ?, ?, ?, ?)

  ON CONFLICT(token) DO UPDATE SET
    userId = excluded.userId,
    sessionHash = excluded.sessionHash,
    updatedAt = excluded.updatedAt
`);

const deleteStatement = database.prepare(`
  DELETE FROM push_tokens
  WHERE token = ?
    AND userId = ?
    AND (
      sessionHash = ?
      OR sessionHash IS NULL
    )
`);

const deleteSessionTokensStatement = database.prepare(`
  DELETE FROM push_tokens
  WHERE sessionHash = ?
`);

export function savePushToken(
  userId: number,
  token: string,
  authToken: string,
): void {
  const now = Date.now();

  saveStatement.run(
    token,
    userId,
    hashSessionToken(authToken),
    now,
    now,
  );
}

export function removePushToken(
  userId: number,
  token: string,
  authToken: string,
): void {
  deleteStatement.run(
    token,
    userId,
    hashSessionToken(authToken),
  );
}

export function removePushTokensForSession(
  authToken: string,
): void {
  deleteSessionTokensStatement.run(
    hashSessionToken(authToken),
  );
}