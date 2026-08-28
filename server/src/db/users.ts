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
  const statement = database.prepare(`
    SELECT
      id,
      name
    FROM users
    WHERE id != ?
      AND (
        LOWER(name) LIKE LOWER(?)
        OR LOWER(login) LIKE LOWER(?)  
      )  
    ORDER BY name ASC
    LIMIT 20
  `);

  const searchPattern = `%${search}%`;

  return statement.all(
    currentUserId,
    searchPattern,
    searchPattern,
  );
}