import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

import { chatsRouter } from './routes/chats.js';
import { createMessagesRouter } from './routes/messages.js';
import { broadcastWebSocketEvent } from './websocket/broadcast.js';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_request, response) => {
  response.json({
    status: 'ok',
  });
});

app.use('/chats', chatsRouter);

const server = createServer(app);

const webSocketServer = new WebSocketServer({
  server,
});

const messagesRouter = createMessagesRouter({
  broadcastMessageCreated: (message) => {
    broadcastWebSocketEvent(webSocketServer, {
      type: 'message_created',
      data: message,
    });
  },
});

app.use('/messages', messagesRouter);

webSocketServer.on('connection', (socket) => {
  console.log('WebSocket client connected');

  socket.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server started on port ${port}`);
});