import { Router } from 'express';
import { getChatById, getChats } from '../db/chats.js';
export const chatsRouter = Router();
import type {
  ChatData,
  ChatRow,
} from '../types/chat.js';
import { mapChatRow } from '../mappers/chat.js'

chatsRouter.get('/', (_request, response) => {
  const rows = getChats();

  const chats = rows.map(mapChatRow);

  response.json(chats);
});

chatsRouter.get('/:id', (request, response) => {
  const chatId = Number(request.params.id);

  if (!Number.isFinite(chatId)) {
    response.status(400).json({
      error: 'chat id must be a number',
    });

    return;
  }

  const row = getChatById(chatId);

  if (!row) {
    response.status(404).json({
      error: 'chat not found',
    });

    return;
  }

  const chat = mapChatRow(row);

  response.json(chat)
});