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

const messageColumns = database
  .prepare(`PRAGMA table_info(messages)`)
  .all() as Array<{ name: string }>;

const hasSenderId = messageColumns.some(
  (column) => column.name === 'senderId',
);

const messageColumnsAfterMigration = database
  .prepare(`PRAGMA table_info(messages)`)
  .all();


if (!hasSenderId) {
  database.exec(`
    ALTER TABLE messages
    ADD COLUMN senderId INTEGER  
  `);
}

database.exec(`
  UPDATE messages
  SET senderId = CASE
    WHEN isOwn = 1 THEN 1
    ELSE (
      SELECT users.id
      FROM users
      WHERE users.name = messages.author
      LIMIT 1
    )
  END
`);


database.exec(`
  CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    isOnline INTEGER NOT NULL DEFAULT 0 
  );
`);

database.exec(`
  CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  )
`)

database.exec(`
  INSERT OR IGNORE INTO chats (id, name, isOnline)
  VALUES
    (1, 'Alex', 1),
    (2, 'John', 0),
    (3, 'Maria', 0),
    (4, 'Женёк', 1)  
`);

database.exec(`
  INSERT OR IGNORE INTO users (id, name)
  VALUES
    (1, 'Me'),
    (2, 'Alex'),
    (3, 'John'),
    (4, 'Maria'),
    (5, 'Женёк')  
`);