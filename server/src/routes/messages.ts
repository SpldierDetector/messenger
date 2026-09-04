import { Router } from 'express';
import {
  isUserInChat,
  showChatForAllMembers,
} from '../db/chat-members.js';
import { createMessageReceipts } from '../db/message-receipts.js';
import {
  deleteMessage,
  getLatestMessagesByUserId,
  getMessageById,
  getMessagesByChatId,
  insertForwardedMessage,
  insertMessage,
  updateMessage,
} from '../db/messages.js';
import { mapMessageRow } from '../mappers/message.js';
import { requireAuth } from '../middleware/auth.js';
import type {
  EditMessageRequest,
  ForwardMessageRequest,
  MessageData,
  MessageRow,
  SendMessageRequest,
} from '../types/message.js';

type MessagesRouterOptions = {
  broadcastMessageCreated: (message: MessageData) => void;
  broadcastMessageUpdated: (message: MessageData) => void;
  broadcastMessageDeleted: (message: MessageData) => void;
};

export function createMessagesRouter({
  broadcastMessageCreated,
  broadcastMessageUpdated,
  broadcastMessageDeleted,
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
    const { 
      chatId,
      text,
      replyToMessageId = null,
    } = request.body as SendMessageRequest;

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

    if (
      replyToMessageId !== null &&
      (
        !Number.isInteger(replyToMessageId) ||
        replyToMessageId <= 0
      )
    ) {
      response.status(400).json({
        error:
        'replyToMessageId ust be a positive integer or null',
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

    if (replyToMessageId !== null) {
      const replyRow = getMessageById(
        replyToMessageId,
      );

      if (!replyRow) {
        response.status(404).json({
          error: 'reply message not found',
        });

        return;
      }

      const replyMessage =
        replyRow as MessageRow;

      if (
        replyMessage.chatId !== chatId
      ) {
        response.status(400).json({
          error: 'reply message must belong to the same chat',
        });

        return;
      }

      if (
        replyMessage.deletedAt !== null
      ) {
        response.status(409).json({
          error: 'cannot reply to deleted message',
        });

        return;
      }
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
      replyToMessageId,
    );

    createMessageReceipts(
      Number(result.lastInsertRowid),
      chatId,
      currentUser.id,
    );

    const message: MessageData = {
      id: Number(result.lastInsertRowid),
      chatId,
      senderId: currentUser.id,
      author: currentUser.name,
      text: text.trim(),
      createdAt: now,
      editedAt: null,
      deletedAt: null,
      replyToMessageId,
      forwardedFromMessageId: null,
      forwardedFromAuthor: null,
    };

    broadcastMessageCreated(message);

    response.status(201).json(message);
  });

  messagesRouter.post('/:id/forward', requireAuth, (request, response) => {
    const messageId = Number(request.params.id);

    if (
      !Number.isInteger(messageId) ||
      messageId <= 0
    ) {
      response.status(400).json({
        error:
          'message id must be a positive integer',
      });

      return;
    }

    const {
      targetChatId,
    } = request.body as ForwardMessageRequest; 

    if (
      !Number.isInteger(targetChatId) ||
      targetChatId <= 0
    ) {
      response.status(400).json({
        error:
          'targetChatId must be a positive integer',
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

    const sourceRow = getMessageById(messageId);

    if (!sourceRow) {
      response.status(404).json({
        error: 'message not found',
      });

      return;
    }

    const sourceMessage = sourceRow as MessageRow;

    const userIsSourceChatMember =
      isUserInChat(
        sourceMessage.chatId,
        currentUser.id,
      );

    if (!userIsSourceChatMember) {
      response.status(403).json({
        error: 'forbidden',
      });

      return;
    }

    if (sourceMessage.deletedAt !== null) {
      response.status(409).json({
        error: 'deleted message cannot be forwarded',
      });

      return;
    }

    const userIsTargetChatMember =
      isUserInChat(
        targetChatId,
        currentUser.id,
      );

    if (!userIsTargetChatMember) {
      response.status(403).json({
        error: 'target chat access forbidden',
      });

      return;
    }

    const now = Date.now();

    const forwardedFromMessageId =
      sourceMessage.forwardedFromMessageId ??
      sourceMessage.id;

    const forwardedFromAuthor =
      sourceMessage.forwardedFromAuthor ??
      sourceMessage.author;

    showChatForAllMembers(
      targetChatId,
    );

    const result =
      insertForwardedMessage(
        targetChatId,
        currentUser.id,
        currentUser.name,
        sourceMessage.text,
        now,
        forwardedFromMessageId,
        forwardedFromAuthor,
      );

    createMessageReceipts(
      Number(result.lastInsertRowid),
      targetChatId,
      currentUser.id,
    )

    const forwardedMessage: MessageData = {
      id: Number(result.lastInsertRowid),
      chatId: targetChatId,
      senderId: currentUser.id,
      author: currentUser.name,
      text: sourceMessage.text,
      createdAt: now,
      editedAt: null,
      deletedAt: null,
      replyToMessageId: null,
      forwardedFromMessageId,
      forwardedFromAuthor,
    };

    broadcastMessageCreated(
      forwardedMessage,
    );

    response.status(201).json(
      forwardedMessage,
    );
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

      if (message.deletedAt !== null) {
        response.status(409).json({
          error: 'deleted message cannot be edited',
        });

        return;
      }

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

  messagesRouter.delete(
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
          error: 'you can delete only your own messages',
        });

        return;
      }

      if (message.deletedAt !== null) {
        response.status(409).json({
          error: 'message already deleted',
        });

        return;
      }

      const deletedAt = Date.now();

      deleteMessage(
        messageId,
        deletedAt,
      );

      const deletedMessage: MessageData = {
        ...message,
        deletedAt,
      };

      broadcastMessageDeleted(
        deletedMessage,
      );

      response.json(deletedMessage);
    },
  );

  return messagesRouter;
}