import cors from 'cors';
import express from 'express';

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
const messages: MessageData[] = [];

app.use(cors());
app.use(express.json());

app.get('/health', (_request, response) => {
  response.json({
    status: 'ok',
  });
});

app.get('/messages', (_request, response) => {
  response.json(messages);
});;

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

  const message: MessageData = {
    id: now,
    chatId,
    author : 'Me',
    text: text.trim(),
    createdAt: now,
    isOwn: true,
  };

  messages.push(message);

  response.status(201).json(message);
});

app.listen(port, '0.0.0.0', () => {
  console.log('Server started on port ${port}');
});