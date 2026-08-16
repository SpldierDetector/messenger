import { Router } from 'express';
import { 
  createDirectChat,
  getChatById,
  getChatsByUserId,
  getDirectChatBetweenUsers,
} from '../db/chats.js';
import { mapChatRow } from '../mappers/chat.js';
import { requireAuth } from '../middleware/auth.js';
import { getUserById } from '../db/users.js';

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

chatsRouter.post(
  '/direct',
  requireAuth,
  (request, response) => {
    const { userId } = request.body as {
      userId?: unknown;
    };

    if (
      typeof userId !== 'number' ||
      !Number.isInteger(userId)
    ) {
      response.status(400).json({
        error: 'userId must be an integer',
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

    if (userId === currentUser.id) {
      response.status(400).json({
        error: 'cannot create direct chat with yourself',
      });

      return;
    }

    const otherUser = getUserById(userId);

    if (!otherUser) {
      response.status(404).json({
        error: 'user not found',
      });

      return;
    }

    const existingRow =
    getDirectChatBetweenUsers(
      currentUser.id,
      userId,
    );

    if (existingRow) {
      response.json(
        mapChatRow(existingRow),
      );

      return;
    }

    const createdRow =
      createDirectChat(
        currentUser.id,
        userId,
      );

    if (!createdRow) {
      response.status(500).json({
        error: 'failed to create chat',
      });

      return;
    }

    response.status(201).json(
      mapChatRow(createdRow),
    );
  },
);

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