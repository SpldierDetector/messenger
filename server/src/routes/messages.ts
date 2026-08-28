import { Router } from 'express';
import {
  getLatestMessagesByUserId,
  getMessageById,
  getMessagesByChatId,
  insertMessage,
  updateMessage,
} from '../db/messages.js';
import type {
  EditMessageRequest,
  MessageData,
  MessageRow,
  SendMessageRequest,
} from '../types/message.js';
import { mapMessageRow } from '../mappers/message.js';
import { requireAuth } from '../middleware/auth.js';
import { 
  isUserInChat,
  showChatForAllMembers, 
} from '../db/chat-members.js'

type MessagesRouterOptions = {
  broadcastMessageCreated: (message: MessageData) => void;
  broadcastMessageUpdated: (message: MessageData) => void;
};

export function createMessagesRouter({
  broadcastMessageCreated,
  broadcastMessageUpdated,
}: MessagesRouterOptions) {
  const messagesRouter = Router();

  messagesRouter.get('/latest', requireAuth, (request, response) => {
    const currentUser = request.user;

    if (!currentUser) {
      response.status(401).json({
        error: 'authorization required',
      });

      return;
    }

    const rows = getLatestMessagesByUserId(
      currentUser.id,
    );

    const latestMessages = rows.map(mapMessageRow);
    
    response.json(latestMessages);
  },
  );

  messagesRouter.get('/', requireAuth, (request, response) => {
    const chatId = Number(request.query.chatId);

    if (!Number.isFinite(chatId)) {
      response.status(400).json({
        error: 'chatId must be a number',
      });

      return;
    }

    const currentUser = request.user;

    if (!currentUser) {
      response.status(401).json({
        error: 'authorization required',
      });

      return;
    }

    const userIsChatMember = isUserInChat(
      chatId,
      currentUser.id,
    );

    if (!userIsChatMember) {
      response.status(403).json({
        error: 'forbidden',
      });

      return;
    }

    const rows = getMessagesByChatId(chatId);

    const chatMessages = rows.map(mapMessageRow);

    response.json(chatMessages);
  });

  messagesRouter.post('/', requireAuth, (request, response) => {
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

    const currentUser = request.user;

    if (!currentUser) {
      response.status(401).json({
        error: 'authorization required',
      });

      return;
    }

    const userIsChatMember = isUserInChat(
      chatId,
      currentUser.id,
    );

    if (!userIsChatMember) {
      response.status(403).json({
        error: 'forbidden',
      });

      return;
    }

    showChatForAllMembers(chatId);

    const now = Date.now();

    const result = insertMessage(
      chatId,
      currentUser.id,
      currentUser.name,
      text.trim(),
      now,
      true,
    );

    const message: MessageData = {
      id: Number(result.lastInsertRowid),
      chatId,
      senderId: currentUser.id,
      author: currentUser.name,
      text: text.trim(),
      createdAt: now,
      editedAt: null,
    };

    broadcastMessageCreated(message);

    response.status(201).json(message);
  });

  messagesRouter.patch(
    '/:id',
    requireAuth,
    (request, response) => {
      const messageId = Number(
        request.params.id,
      );

      if (
        !Number.isInteger(messageId) ||
        messageId <= 0
      ) {
        response.status(400).json({
          error: 'message id must be a positive integer',
        });

        return;
      }

      const { text } =
        request.body as EditMessageRequest;

      if (
        typeof text !== 'string' ||
        !text.trim()
      ) {
        response.status(400).json({
          error: 'text must be a non-empty string',
        });

        return;
      }

      const currentUser = request.user;

      if (!currentUser) {
        response.status(401).json({
          error: 'authorization required',
        });

        return;
      }

      const row = getMessageById(messageId);

      if (!row) {
        response.status(404).json({
          error: 'message not found',
        });

        return;
      }

      const message = row as MessageRow;

      const userIsChatMember = isUserInChat(
        message.chatId,
        currentUser.id,
      );

      if (!userIsChatMember) {
        response.status(403).json({
          error: 'forbidden',
        });

        return;
      }

      if (
        message.senderId !== currentUser.id
      ) {
        response.status(403).json({
          error: 'you can edit only your own messages',
        });

        return;
      }

      const normalizedText = text.trim();
      const editedAt = Date.now();

      updateMessage(
        messageId,
        normalizedText,
        editedAt,
      );

      const updatedMessage: MessageData ={
        ...message,
        text: normalizedText,
        editedAt,
      };

      broadcastMessageUpdated(
        updatedMessage,
      );

      response.json(updatedMessage);
    },
  );

  return messagesRouter;
}