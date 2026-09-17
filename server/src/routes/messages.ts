import { Router } from 'express';
import {
  attachAttachmentsToMessage,
  getAttachmentsByIdsForUploaderAndChat,
} from '../db/attachments.js';
import {
  isUserInChat,
  showChatForAllMembers,
} from '../db/chat-members.js';
import {
  database,
} from '../db/database.js';
import {
  createMessageReceipts,
  getMessageReceiptsByChatId,
  getUnreadMessageCountsByUserId,
} from '../db/message-receipts.js';
import {
  deleteMessage,
  getLatestMessagesByUserId,
  getMessageByClientMessageId,
  getMessageById,
  getMessagePageByChatId,
  getMessagesByChatId,
  getMessagesByIdsForUser,
  getPendingDeliveryMessagesByUserId,
  hideMessageForUser,
  insertForwardedMessage,
  insertMessage,
  searchMessagesByChatId,
  updateMessage,
} from '../db/messages.js';
import { requireAuth } from '../middleware/auth.js';
import {
  buildMessageData,
  buildMessageDataRows,
} from '../services/message-data.js';
import type {
  EditMessageRequest,
  ForwardMessageRequest,
  MessageData,
  MessageRow,
  SendMessageRequest,
  SyncMessagesRequest,
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

  messagesRouter.get(
    '/search',
    requireAuth,
    (request, response) => {
      const chatId = Number(request.query.chatId);

      if (
        !Number.isInteger(chatId) ||
        chatId <= 0
      ) {
        response.status(400).json({
          error: 'chatId must be a positive integer',
        });

        return;
      }

      const search =
        typeof request.query.search === 'string'
          ? request.query.search.trim()
          : '';

      if (!search) {
        response.json([]);

        return;
      }

      const currentUser = request.user;

      if (!currentUser) {
        response.status(401).json({
          error: 'authorization required',
        });

        return;
      }

      const userIsChatMember =
        isUserInChat(
          chatId,
          currentUser.id,
        );

      if (!userIsChatMember) {
        response.status(403).json({
          error: 'forbidden',
        });

        return;
      }

      const rows =
        searchMessagesByChatId(
          chatId,
          currentUser.id,
          search,
        );

      const messages = buildMessageDataRows(rows);

      response.json(messages);
    },
  );
  
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

    const latestMessages = buildMessageDataRows(rows);
    
    response.json(latestMessages);
  },
  );

  messagesRouter.get(
    '/pending-delivery',
    requireAuth,
    (request, response) => {
      const currentUser = request.user;

      if (!currentUser) {
        response.status(401).json({
          error: 'authorization required',
        });

        return;
      }

      const rows = 
        getPendingDeliveryMessagesByUserId(currentUser.id);

        const pendingMessages = buildMessageDataRows(rows);

        response.json(pendingMessages);
    },
  );

  messagesRouter.get(
    '/unread-counts',
    requireAuth,
    (request, response) => {
      const currentUser = request.user;

      if (!currentUser) {
        response.status(401).json({
          error: 'authorization required',
        });

        return;
      }

      const unreadCounts = getUnreadMessageCountsByUserId(
        currentUser.id,
      );

      response.json(unreadCounts);
    },
  );

  messagesRouter.get('/receipts', requireAuth, (request, response) => {
    const chatId = Number(request.query.chatId);

    if (!Number.isInteger(chatId) || chatId <= 0) {
      response.status(400).json({
        error:
          'chatId must be a positive integer',
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

    const userIsChatMember = isUserInChat(chatId, currentUser.id);

    if (!userIsChatMember) {
      response.status(403).json({
        error: 'forbidden',
      });

      return;
    }

    const receipts = getMessageReceiptsByChatId(chatId, currentUser.id);

    response.json(receipts);
  });

  messagesRouter.get(
    '/page',
    requireAuth,
    (request, response) => {
      const chatId = Number(
        request.query.chatId,
      );

      if (
        !Number.isInteger(chatId) ||
        chatId <= 0
      ) {
        response.status(400).json({
          error:
            'chatId must be a positive integer',
        });

        return;
      }

      const rawBeforeMessageId =
        request.query.beforeMessageId;

      let beforeMessageId: number | null =
        null;

      if (
        typeof rawBeforeMessageId ===
        'string'
      ) {
        const parsedBeforeMessageId =
          Number(rawBeforeMessageId);

        if (
          !Number.isInteger(
            parsedBeforeMessageId,
          ) ||
          parsedBeforeMessageId <= 0
        ) {
          response.status(400).json({
            error:
              'beforeMessageId must be a positive integer',
          });

          return;
        }

        beforeMessageId =
          parsedBeforeMessageId;
      }

      const currentUser =
        request.user;

      if (!currentUser) {
        response.status(401).json({
          error:
            'authorization required',
        });

        return;
      }

      const userIsChatMember =
        isUserInChat(
          chatId,
          currentUser.id,
        );

      if (!userIsChatMember) {
        response.status(403).json({
          error: 'forbidden',
        });

        return;
      }

      const PAGE_SIZE = 50;

      const rows =
        getMessagePageByChatId(
          chatId,
          currentUser.id,
          beforeMessageId,
          PAGE_SIZE + 1,
        );

      const hasMore =
        rows.length > PAGE_SIZE;

      const pageRows =
        hasMore
          ? rows.slice(0, PAGE_SIZE)
          : rows;

      const oldestRow =
        pageRows[
          pageRows.length - 1
        ] as MessageRow | undefined;

      const nextBeforeMessageId =
        hasMore && oldestRow
          ? oldestRow.id
          : null;

      const pageMessages =
        buildMessageDataRows(
          [...pageRows].reverse()
        );

      response.json({
        messages: pageMessages,
        hasMore,
        nextBeforeMessageId,
      });
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

    const rows = getMessagesByChatId(chatId, currentUser.id);

    const chatMessages = buildMessageDataRows(rows);

    response.json(chatMessages);
  });

  messagesRouter.post('/', requireAuth, (request, response) => {
    const { 
      chatId,
      text,
      clientMessageId,
      replyToMessageId = null,
      attachmentIds = [],
    } = request.body as SendMessageRequest;

    if (typeof chatId !== 'number') {
      response.status(400).json({
        error: 'chatId must be a number',
      });

      return;
    }

    if (typeof text !== 'string') {
      response.status(400).json({
        error: 'text must be a string',
      });

      return;
    }

    if (
      typeof clientMessageId !== 'string' ||
      !clientMessageId.trim() ||
      clientMessageId.length > 128
    ) {
      response.status(400).json({
        error:
        'clientMessageId must be a non-empty string up to 128 characters',
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

    if (!Array.isArray(attachmentIds)) {
      response.status(400).json({
        error: 'attachmentIds must be an array',
      });

      return;
    }

    if (attachmentIds.length > 10) {
      response.status(400).json({
        error: 'a message can contain at most 10 attachments',
      });

      return;
    }

    const normalizedAttachmentIds = [
      ...new Set(attachmentIds),
    ];

    if (
      normalizedAttachmentIds.length !== attachmentIds.length ||
      normalizedAttachmentIds.some((attachmentId) => !Number.isInteger(attachmentId) || attachmentId <= 0)
    ) {
      response.status(400).json({
        error: 'attachmentIds must contain unique positive integers',
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

    const normalizedText = text.trim();
    const normalizedClientMessageId = clientMessageId.trim();
    
    if (
      !normalizedText &&
      normalizedAttachmentIds.length === 0
    ) {
      response.status(400).json({
        error: 'message must contain text or attachments',
      });

      return;
    }

    const existingRow = getMessageByClientMessageId(currentUser.id, normalizedClientMessageId);

    if (existingRow) {
      const existingMessage = buildMessageData(existingRow);

      const existingAttachmentIds =
        existingMessage.attachments.map(
          (attachment) => attachment.id,
        );
      
      const attachmentsMatch = 
        existingAttachmentIds.length === normalizedAttachmentIds.length &&
        existingAttachmentIds.every((attachmentId, index) =>
          attachmentId === normalizedAttachmentIds[index],
        );

      const requestMatchesExistingMessage =
        existingMessage.chatId === chatId &&
        existingMessage.text === normalizedText &&
        existingMessage.replyToMessageId === replyToMessageId &&
        attachmentsMatch;

      if (!requestMatchesExistingMessage) {
        response.status(409).json({
          error: 
            'clientMessageId is already used for another message',
        });

        return;
      }

      response.json(
        existingMessage,
      );

      return;
    }

    const attachmentRows =
      getAttachmentsByIdsForUploaderAndChat(
        normalizedAttachmentIds,
        currentUser.id,
        chatId,
      );

      if (
        attachmentRows.length !==
          normalizedAttachmentIds.length
      ) {
        response.status(400).json({
          error: 'one or more attachments are invalid',
        });

        return;
      }

      const hasAttachedAttachment =
        attachmentRows.some(
          (attachment) => attachment.messageId !== null,
        );

      if (hasAttachedAttachment) {
        response.status(409).json({
          error:
            'one or more attachments are already attached to a message',
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

    let message: MessageData;

    try{
      database.exec('BEGIN IMMEDIATE');
    

      showChatForAllMembers(chatId);

      const result = insertMessage(
        chatId,
        currentUser.id,
        currentUser.name,
        normalizedText,
        now,
        true,
        replyToMessageId,
        normalizedClientMessageId,
      );

      const messageId = Number(result.lastInsertRowid);

      const attachedCount = 
        attachAttachmentsToMessage(
          normalizedAttachmentIds,
          currentUser.id,
          chatId,
          messageId,
        );

      if (
        attachedCount !==
        normalizedAttachmentIds.length
      ) {
        throw new Error(
          'failed to attach all attachments',
        );
      }

      createMessageReceipts(
        messageId,
        chatId,
        currentUser.id,
      );

      const createdRow = getMessageById(messageId);

      if (!createdRow) {
        throw new Error('created messge was not found');
      }

      message = buildMessageData(createdRow);

      database.exec(
      'COMMIT',
      );
    } catch (caughtError) {
      try{
        database.exec(
          'ROLLBACK',
        );
      } catch {
        // Transaction may have failed before BEGIN.
      }

      console.error(
        'Failed to create message:',
        caughtError,
      );

      response.status(500).json({
        error: 'failed to create message',
      });

      return;
    }


    broadcastMessageCreated(message);

    response.status(201).json(message);
  });

  messagesRouter.post(
    '/sync',
    requireAuth,
    (request, response) => {
      const {messageIds} = request.body as SyncMessagesRequest;

      if (!Array.isArray(messageIds)) {
        response.status(400).json({
          error: 'messageIds must be an array',
        });

        return;
      }

      const normalizedMessageIds = [
        ...new Set(
          messageIds.filter(
            (messageId) =>
              Number.isInteger(messageId) &&
            messageId > 0,
          ),
        ),
      ];

      if (
        normalizedMessageIds.length !==
        messageIds.length
      ) {
        response.status(400).json({
          error: 
            'messageIds must contain only positive integers',
        });

        return;
      }

      if (
        normalizedMessageIds.length > 500
      ) {
        response.status(400).json({
          error: 'too many messageIds',
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

      const rows =
      getMessagesByIdsForUser(
        normalizedMessageIds,
        currentUser.id,
      );

      response.json(
        buildMessageDataRows(rows),
      );
    },
  );

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
      clientMessageId: null,
      author: currentUser.name,
      text: sourceMessage.text,
      createdAt: now,
      editedAt: null,
      deletedAt: null,
      replyToMessageId: null,
      forwardedFromMessageId,
      forwardedFromAuthor,
      attachments: [],
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

      const updatedMessage =
        buildMessageData({
          ...message,
          text: normalizedText,
          editedAt,
        });

      broadcastMessageUpdated(
        updatedMessage,
      );

      response.json(updatedMessage);
    },
  );

  messagesRouter.delete(
    '/:id/for-me',
    requireAuth,
    (request, response) => {
      const messageId = Number(request.params.id);

      if (
        !Number.isInteger(messageId) ||
        messageId <= 0
      ) {
        response.status(400).json({
          error: 
            "message id must be a positive integer",
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

      const userIsChatMember = 
        isUserInChat(
          message.chatId,
          currentUser.id,
        );

      if (!userIsChatMember) {
        response.status(403).json({
          error: 'forbidden',
        });

        return;
      }

      hideMessageForUser(
        messageId,
        currentUser.id,
        Date.now(),
      );

      response.status(204).send()
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

      const deletedMessage =
        buildMessageData({
          ...message,
          deletedAt,        
      });

      broadcastMessageDeleted(
        deletedMessage,
      );

      response.json(deletedMessage);
    },
  );

  return messagesRouter;
}