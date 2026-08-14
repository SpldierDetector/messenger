import { Router } from 'express';
import { getChatById, getChatsByUserId } from '../db/chats.js';
import { mapChatRow } from '../mappers/chat.js'
import { requireAuth } from '../middleware/auth.js';

export const chatsRouter = Router();

chatsRouter.get('/', requireAuth, (request, response) => {
  const user = request.user;

  if (!user) {
    response.status(401).json({
      error: 'authorization required',
    });

    return;
  }
  const rows = getChatsByUserId(user.id);

  const chats = rows.map(mapChatRow);

  response.json(chats);
});

chatsRouter.get('/:id', requireAuth, (request, response) => {
  const chatId = Number(request.params.id);

  if (!Number.isFinite(chatId)) {
    response.status(400).json({
      error: 'chat id must be a number',
    });

    return;
  }

  const user = request.user;

  if (!user) {
    response.status(401).json({
      error: 'authorization required',
    });

    return;
  }
  
  const row = getChatById(chatId, user.id);

  if (!row) {
    response.status(404).json({
      error: 'chat not found',
    });

    return;
  }

  const chat = mapChatRow(row);

  response.json(chat)
});