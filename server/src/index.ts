import cors from 'cors';
import express from 'express';
import { getChatById, getChats } from './db/chats.js';
import {
  getLatestMessages,
  getMessagesByChatId,
  insertMessage,
} from './db/messages.js';

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
 const rows = getLatestMessages();
  
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

  const rows = getMessagesByChatId(chatId);

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

app.get('/chats', (_request, response) => {
  const rows = getChats();

  const chats = rows.map((row) => {
    const chat = row as {
      id: number;
      name: string;
      isOnline: number;
    };

    return {
      ...chat,
      isOnline: Boolean(chat.isOnline),
    };
  });

  response.json(chats);
})

app.get('/chats/:id', (request, response) => {
  const chatId = Number(request.params.id);

  if (!Number.isFinite(chatId)) {
    response.status(400).json({
      error: 'chat id must be a number',
    });

    return;
  }

  const row = getChatById(chatId);

  if (!row) {
    response.status(400).json({
      error: 'chat not found',
    });

    return;
  }

  const chat = row as {
    id: number;
    name: string;
    isOnline: number;
  };

  response.json({
    ...chat,
    isOnline: Boolean(chat.isOnline),
  });
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

  const result = insertMessage(
    chatId,
    'Me',
    text.trim(),
    now,
    true,
  );

  const message: MessageData = {
    id: Number(result.lastInsertRowid),
    chatId,
    author : 'Me',
    text: text.trim(),
    createdAt: now,
    isOwn: true,
  };

  response.status(201).json(message);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server started on port ${port}`);
});