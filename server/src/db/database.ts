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
  );
`);

database.exec(`
  CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    isOnline INTEGER NOT NULL DEFAULT 0 
  );
`);

database.exec(`
  INSERT OR IGNORE INTO chats (id, name, isOnline)
  VALUES
    (1, 'Alex', 1),
    (2, 'John', 0),
    (3, 'Maria', 0),
    (4, 'Женёк', 1)  
`);