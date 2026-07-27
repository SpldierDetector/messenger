import cors from 'cors';
import express from 'express';

import { chatsRouter } from './routes/chats.js';
import { messagesRouter } from './routes/messages.js';

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
app.use('/messages', messagesRouter);

app.listen(port, '0.0.0.0', () => {
  console.log(`Server started on port ${port}`);
});