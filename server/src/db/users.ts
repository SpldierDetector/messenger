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
      name
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