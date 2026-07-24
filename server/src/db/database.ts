import { DatabaseSync } from 'node:sqlite';

export const database = new DatabaseSync('voxa.db');

database.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chatId INTEGER NOT NULL,
    author TEXT NOT NULL,
    text TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    isOwn INTEGER NOT NULL
  )
`);