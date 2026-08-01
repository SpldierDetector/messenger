import { Router } from 'express';
import {
  getLatestMessages,
  getMessagesByChatId,
  insertMessage,
} from '../db/messages.js';
import type {
  MessageData,
  SendMessageRequest,
} from '../types/message.js';
import { mapMessageRow } from '../mappers/message.js';
import { getUserById } from '../db/users.js';
import { mapUserRow } from '../mappers/user.js';

type MessagesRouterOptions = {
  broadcastMessageCreated: (message: MessageData) => void;
};

export function createMessagesRouter({
  broadcastMessageCreated,
}: MessagesRouterOptions) {
  const messagesRouter = Router();

  messagesRouter.get('/latest', (_request, response) => {
    const rows = getLatestMessages();
    const latestMessages = rows.map(mapMessageRow);
    
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

    const chatMessages = rows.map(mapMessageRow);

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
    const currentUserId = 1;

    const currentUserRow = getUserById(currentUserId);

    if (!currentUserId) {
      response.status(500).json({
        error: 'current user not found',
      });

      return;
    }

    const currentUser = mapUserRow(currentUserRow);

    const result = insertMessage(
      chatId,
      currentUserId,
      currentUser.name,
      text.trim(),
      now,
      true,
    );

    const message: MessageData = {
      id: Number(result.lastInsertRowid),
      chatId,
      senderId: currentUserId,
      author: currentUser.name,
      text: text.trim(),
      createdAt: now,
      isOwn: true,
    };

    broadcastMessageCreated(message);

    response.status(201).json(message);
  });

  return messagesRouter;
}