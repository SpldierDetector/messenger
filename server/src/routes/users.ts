import { Router } from 'express';

import {
  getUserById,
  getUsers,
} from '../db/users.js';

import { mapUserRow } from '../mappers/user.js';

export const usersRouter = Router();

usersRouter.get('/', (_request, response) => {
  const rows = getUsers();
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