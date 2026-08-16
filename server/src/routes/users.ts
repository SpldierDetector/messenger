import { Router } from 'express';

import {
  getUserById,
  searchUsers,
} from '../db/users.js';

import { mapUserRow } from '../mappers/user.js';
import { requireAuth } from '../middleware/auth.js';

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get('/', (request, response) => {
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

  const rows = searchUsers(
    search,
    currentUser.id,
  );

  const users = rows.map(mapUserRow);

  response.json(users);
});

usersRouter.get('/:id', (request, response) => {
  const userId = Number(request.params.id);

  if (!Number.isFinite(userId)) {
    response.status(400).json({
      error: 'user id must be a number',
    });

    return;
  }

  const row = getUserById(userId);

  if (!row) {
    response.status(404).json({
      error: 'user not found',
    });

    return;
  }

  const user = mapUserRow(row);

  response.json(user);
});