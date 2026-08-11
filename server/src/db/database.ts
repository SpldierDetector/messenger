import { DatabaseSync } from 'node:sqlite';
import { hashPassword } from '../auth/password.js'

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
  WHERE senderId IS NULL
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
  CREATE TABLE IF NOT EXISTS chat_members (
    chatId INTEGER NOT NULL,
    userId INTEGER NOT NULL,

    PRIMARY KEY (chatId, userId),

    FOREIGN KEY (chatId) REFERENCES chats(id),
    FOREIGN KEY (userId) REFERENCES users(id)
  )  
`);

database.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    userId INTEGER NOT NULL,
    createdAT INTEGER NOT NULL,
    expiresAt INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
  )  
`);

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

database.exec(`
  INSERT OR IGNORE INTO chat_members (chatId, userId)
  VALUES
    (1, 1),
    (1, 2),
    (3, 1),
    (3, 4)  
`);

const userColumns = database
  .prepare(`PRAGMA table_info(users)`)
  .all() as Array<{ name: string }>;

const hasLogin = userColumns.some(
  (column) => column.name === 'login',
);

const hasPasswordHash = userColumns.some(
  (column) => column.name === 'passwordHash',
);

if (!hasLogin) {
  database.exec(`
    ALTER TABLE users
    ADD COLUMN login TEXT  
  `);
}

if (!hasPasswordHash) {
  database.exec(`
    ALTER TABLE users
    ADD COLUMN passwordHash TEXT  
  `);
}

database.exec(`
  UPDATE users
  SET login = 'me'
  WHERE id = 1 AND login IS NULL;
  
  UPDATE users
  SET login = 'alex'
  WHERE id = 2 AND login IS NULL;
`);

database.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS users_login_unique
  ON users(login)
  WHERE login IS NOT NULL
`)

const mePasswordHash = hashPassword('me12345');
const alexPasswordHash = hashPassword('alex12345');

const updatePasswordStatement = database.prepare(`
  UPDATE users
  SET passwordHash = ?
  WHERE id = ? AND passwordHash IS NULL  
`);

updatePasswordStatement.run(mePasswordHash, 1);
updatePasswordStatement.run(alexPasswordHash, 2);