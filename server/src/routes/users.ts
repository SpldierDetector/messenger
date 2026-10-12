import { Router } from 'express';

import {
  getUserById,
  searchUsers,
  updateUserProfile,
} from '../db/users.js';
import type { UserRow } from '../types/user.js';
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

usersRouter.patch('/me', (request, response) => {
  const currentUser = request.user;

  if (!currentUser) {
    response.status(401).json({
      error: 'authorization required',
    });

    return;
  }

  const body = request.body;

  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body)
  ) {
    response.status(400).json({
      error: 'invalid request body',
    });

    return;
  }

  const { name, bio } = body as {
    name?: unknown;
    bio?: unknown;
  };

  if (
    name === undefined &&
    bio === undefined
  ) {
    response.status(400).json({
      error: 'no profile fields provided',
    });

    return;
  }

  if (
    name !== undefined &&
    typeof name !== 'string'
  ) {
    response.status(400).json({
      error: 'name must be a string',
    });

    return;
  }

  if (
    bio !== undefined &&
    bio !== null &&
    typeof bio !== 'string'
  ) {
    response.status(400).json({
      error: 'bio must be a string or null',
    });

    return;
  }

  const existingRow = getUserById(
    currentUser.id,
  ) as UserRow | undefined;

  if (!existingRow) {
    response.status(404).json({
      error: 'user not found',
    });

    return;
  }

  const normalizedName =
    typeof name === 'string'
      ? name.trim()
      : existingRow.name;

  if (
    normalizedName.length === 0 ||
    normalizedName.length > 64
  ) {
    response.status(400).json({
      error: 'name must contain from 1 to 64 characters',
    });

    return;
  }

  const normalizedBio =
    bio === undefined
      ? existingRow.bio
      : typeof bio === 'string'
        ? bio.trim() || null
        : null;

  if (
    normalizedBio !== null &&
    normalizedBio.length > 300
  ) {
    response.status(400).json({
      error: 'bio must not exceed 300 characters',
    });

    return;
  }

  updateUserProfile(
    currentUser.id,
    normalizedName,
    normalizedBio,
  );

  const updatedRow = getUserById(
    currentUser.id,
  );

  if (!updatedRow) {
    response.status(500).json({
      error: 'failed to load updated profile',
    });

    return;
  }

  response.json({
    user: mapUserRow(updatedRow),
  });
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