import { getSearchTerms } from '../utils/search.js';
import { database } from './database.js';

export function getUsers() {
  const statement = database.prepare(`
    SELECT
      id,
      name
    FROM users
    ORDER BY id ASC  
  `);

  return statement.all();
}

export function getUserById(userId: number) {
  const statement = database.prepare(`
    SELECT
      id,
      name,
      login,
      passwordHash
    FROM users
    WHERE id = ?
    LIMIT 1  
  `);

  return statement.get(userId);
}

export function getUserByLogin(login: string) {
  const statement = database.prepare(`
    SELECT
      id,
      name,
      login,
      passwordHash
    FROM users
    WHERE login = ?
    LIMIT 1  
  `);

  return statement.get(login);
}

export function insertUser(
  name: string,
  login: string,
  passwordHash: string,
): number {
  const statement = database.prepare(`
    INSERT INTO users(
      name,
      login,
      passwordHash
    )
    VALUES (?, ?, ?)
  `);

  const result = statement.run(
    name,
    login,
    passwordHash,
  );

  return Number(result.lastInsertRowid);
}

export function searchUsers(
  search: string,
  currentUserId: number,
) {
  const searchTerms =
    getSearchTerms(search);

  if (searchTerms.length === 0) {
    return [];
  }

  const searchConditions =
    searchTerms
      .map(
        () => `
          (
            instr(
              normalize_search(name),
              ?
            ) > 0
            OR instr(
              normalize_search(login),
              ?
            ) > 0
          )
        `,
      )
      .join(' AND ');

  const statement = database.prepare(`
    SELECT
      id,
      name
    FROM users
    WHERE id != ?
      AND ${searchConditions}
    ORDER BY name ASC
    LIMIT 20
  `);

  const searchParameters =
    searchTerms.flatMap(
      (term) => [
        term,
        term,
      ],
    );

  return statement.all(
    currentUserId,
    ...searchParameters,
  );
}

export function updateUserLastSeenAt(
  userId: number,
  lastSeenAt: number,
) {
  const statement = database.prepare(`
    UPDATE users
    SET lastSeenAt = ?
    WHERE id = ?  
  `);

  return statement.run(
    lastSeenAt,
    userId,
  )
}