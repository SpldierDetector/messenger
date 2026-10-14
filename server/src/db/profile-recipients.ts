import { database } from './database.js';

type ProfileRecipientRow = {
  userId: number;
};

export function getProfileUpdateRecipientIds(
  userId: number,
): number[] {
  const statement = database.prepare(`
    SELECT DISTINCT
      peer.userId AS userId
    FROM chat_members AS owner
    JOIN chat_members AS peer
      ON peer.chatId = owner.chatId
    WHERE owner.userId = ?
      AND peer.userId != ?
      AND peer.hiddenAt IS NULL
  `);

  const rows = statement.all(
    userId,
    userId,
  ) as ProfileRecipientRow[];

  return rows.map((row) => row.userId);
}