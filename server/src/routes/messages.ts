import { Router } from 'express';
import {
  getLatestMessages,
  getMessagesByChatId,
  insertMessage,
} from '../db/messages.js';
import type {
  MessageData,
  MessageRow,
} from '../types/message.js';
import { mapMessageRow } from '../mappers/message.js';

type SendMessageRequest = {
  chatId: number;
  text: string;
};

export const messagesRouter = Router();

messagesRouter.get('/latest', (_request, response) => {
  const rows = getLatestMessages();

  const latestMessages = rows
    .map((row) => row as MessageRow)
    .map(mapMessageRow);

  response.json(latestMessages);
});

messagesRouter.get('/', (request, response) => {
  const chatId = Number(request.query.chatId);

  if (!Number.isFinite(chatId)) {
    response.status(400).json({
      error: 'chatId must be a number',
    });

    return;
  }

  const rows = getMessagesByChatId(chatId);

  const chatMessages = rows
  .map((row) => row as MessageRow)
  .map(mapMessageRow);

  response.json(chatMessages);
});

messagesRouter.post('/', (request, response) => {
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
    author: 'Me',
    text: text.trim(),
    createdAt: now,
    isOwn: true,
  };

  response.status(201).json(message);
});