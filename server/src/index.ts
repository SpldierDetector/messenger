import cors from 'cors';
import express from 'express';
import { database } from './db/database.js';

type SendMessageRequest = {
  chatId: number;
  text: string;
};

type MessageData = {
  id: number;
  chatId: number;
  author: string;
  text: string;
  createdAt: number;
  isOwn: boolean;
};

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_request, response) => {
  response.json({
    status: 'ok',
  });
});

app.get('/messages/latest', (_request, response) => {
  const selectLatestMessages = database.prepare(`
    SELECT
      id,
      chatId,
      author,
      text,
      createdAt,
      isOwn
    FROM messages AS message
    WHERE id = (
      SELECT id
      FROM messages
      WHERE chatId = message.chatId
      ORDER BY createdAt DESC, id DESC
      LIMIT 1
    )
    ORDER BY createdAt DESC
  `);

  const rows = selectLatestMessages.all();
  
  const latestMessages: MessageData[] = rows.map((row) => {
    const message = row as {
      id: number;
      chatId: number;
      author: string;
      text: string;
      createdAt: number;
      isOwn: number;
    };

    return {
      ...message,
      isOwn: Boolean(message.isOwn),
    };
  });

  response.json(latestMessages)
})

app.get('/messages', (request, response) => {
  const chatId = Number(request.query.chatId);

  if (!Number.isFinite(chatId)) {
    response.status(400).json({
      error: 'chatId must be a number',
    });

    return;
  }

  const selectMessages = database.prepare(`
    SELECT
      id,
      chatId,
      author,
      text,
      createdAt,
      isOwn
    FROM messages
    WHERE chatId = ?
    ORDER BY createdAt ASC
  `);

  const rows = selectMessages.all(chatId);

  const chatMessages: MessageData[] = rows.map((row) => {
    const message = row as {
      id: number;
      chatId: number;
      author: string;
      text: string;
      createdAt: number;
      isOwn: number;
    };

    return {
      ...message,
      isOwn: Boolean(message.isOwn),
    };
  });

  response.json(chatMessages);
});

app.post('/messages', (request, response) => {
  const { chatId, text } = request.body as SendMessageRequest;

  if (typeof chatId !== 'number') {
    response.status(400).json({
      error: 'chatId must be a number',
    });

    return;
  }

  if (typeof text !== 'string' || !text.trim()) {
    response.status(400).json({
      error: 'text must be a non-empty string',
    });

    return;
  }

  const now = Date.now();

  const insertMessage = database.prepare(`
    INSERT INTO messages (
    chatId,
    author,
    text,
    createdAt,
    isOwn
    )
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = insertMessage.run(
    chatId,
    'Me',
    text.trim(),
    now,
    1
  );

  const message: MessageData = {
    id: now,
    chatId,
    author : 'Me',
    text: text.trim(),
    createdAt: now,
    isOwn: true,
  };

  response.status(201).json(message);
});

app.listen(port, '0.0.0.0', () => {
  console.log('Server started on port ${port}');
});