import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

import { getUserBySessionToken } from './auth/auth-service.js';
import {
  markChatMessagesRead,
  markMessageDelivered,
} from './db/message-receipts.js';
import { getMessageById } from './db/messages.js';
import type { MessageRow } from './types/message.js';

import { isUserInChat } from './db/chat-members.js';
import { authRouter } from './routes/auth.js';
import { chatsRouter } from './routes/chats.js';
import { createMessagesRouter } from './routes/messages.js';
import { usersRouter } from './routes/users.js';
import type {
  AuthenticatedWebSocket,
  ChatReadEvent,
  MessageDeliveredEvent,
  TypingStartedEvent,
  TypingStoppedEvent,
} from './types/websocket.js';
import {
  broadcastMessageCreated,
  broadcastMessageDeleted,
  broadcastMessageStatusUpdated,
  broadcastMessageUpdated,
  broadcastTypingEvent,
} from './websocket/broadcast.js';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_request, response) => {
  response.json({
    status: 'ok',
  });
});

app.use('/auth', authRouter);
app.use('/chats', chatsRouter);
app.use('/users', usersRouter);

const server = createServer(app);

const webSocketServer = new WebSocketServer({
  server,
});

const messagesRouter = createMessagesRouter({
  broadcastMessageCreated: (message) => {
    broadcastMessageCreated(
      webSocketServer, 
      message,
    );
  },

  broadcastMessageUpdated: (message) => {
    broadcastMessageUpdated(
      webSocketServer,
      message,
    );
  },

  broadcastMessageDeleted: (message) => {
    broadcastMessageDeleted(
      webSocketServer,
      message,
    );
  },
});

app.use('/messages', messagesRouter);

webSocketServer.on('connection', (socket, request) => {
  const requestUrl = new URL(
    request.url ?? '/',
    'http://localhost',
  );

  const token = requestUrl.searchParams.get('token');

  if (!token) {
    socket.close(1008, 'Authorization required');

    return;
  }

  const user = getUserBySessionToken(token);

  if (!user) {
    socket.close(
      1008,
      'Invalid or expired session',
    );

    return;
  }

  const authenticatedSocket =
    socket as AuthenticatedWebSocket;

  authenticatedSocket.userId = user.id;

  console.log(`WebSocket client connected: user ${user.id}`);

  authenticatedSocket.on(
    'message',
    (rawData) => {
      let event: 
        | MessageDeliveredEvent
        | ChatReadEvent
        | TypingStartedEvent
        | TypingStoppedEvent;

      try {
        event = JSON.parse(
          rawData.toString(),
        ) as 
          | MessageDeliveredEvent
          | ChatReadEvent
          | TypingStartedEvent
          | TypingStoppedEvent;
      } catch {
        return;
      }

      if (
        event.type === 'message_delivered'
      ) {
      const messageId = event.data?.messageId;

      if (!Number.isInteger(messageId) || messageId <= 0) {
        return;
      }

      const deliveredAt = Date.now();
      
      const result = markMessageDelivered(
        messageId,
        user.id,
        deliveredAt,
      );

      if (result.changes === 0) {
        return;
      }

      const messageRow = getMessageById(messageId);

      if (!messageRow) {
        return;
      }

      const message = messageRow as MessageRow;

      broadcastMessageStatusUpdated(
        webSocketServer,
        message.senderId,
        messageId,
        user.id,
        deliveredAt,
        null,
      );

      return;
    }

    if (event.type ==='chat_read') {
      const chatId = event.data?.chatId;

      if (
        !Number.isInteger(chatId) ||
        chatId <= 0
      ) {
        return;
      }

      const userIsChatMember =
        isUserInChat(
          chatId,
          user.id,
        );

      if (!userIsChatMember) {
        return;
      }

      const readAt = Date.now();

      const updatedReceipts =
        markChatMessagesRead(
          chatId,
          user.id,
          readAt,
        );
      
      for (
        const receipt of updatedReceipts
      ) {
        const messageRow =
          getMessageById(receipt.messageId);

        if (!messageRow) {continue}

        const message = messageRow as MessageRow;

        broadcastMessageStatusUpdated(
          webSocketServer,
          message.senderId,
          receipt.messageId,
          receipt.userId,
          receipt.deliveredAt,
          receipt.readAt,
        );
      }
    }

    if (
      event.type === 'typing_started' ||
      event.type === 'typing_stopped'
    ) {
      const chatId = event.data?.chatId;

      if (
        !Number.isInteger(chatId) ||
        chatId <= 0
      ) {
        return;
      }

      const userIsChatMember =
        isUserInChat(
          chatId,
          user.id,
        );

      if (!userIsChatMember) {
        return;
      }

      broadcastTypingEvent(
        webSocketServer,
        chatId,
        user.id,
        event.type,
      );

      return;
    }
  });

  authenticatedSocket.on('close', () => {
    console.log(`WebSocket client disconnected: user ${user.id}`);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server started on port ${port}`);
});
