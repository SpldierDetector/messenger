import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

import { getUserBySessionToken } from './auth/auth-service.js';

import { chatsRouter } from './routes/chats.js';
import { createMessagesRouter } from './routes/messages.js';
import { broadcastMessageCreated } from './websocket/broadcast.js';
import { usersRouter } from './routes/users.js';
import { authRouter } from './routes/auth.js';
import type { AuthenticatedWebSocket } from './types/websocket.js'

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

  authenticatedSocket.on('close', () => {
    console.log('WebSocket client disconnected: user ${user.id}');
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server started on port ${port}`);
});
