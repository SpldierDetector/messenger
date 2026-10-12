import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';

import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  getUserById,
  searchUsers,
  updateUserProfile,
  updateUserAvatarUrl,
} from '../db/users.js';
import type {
  NextFunction,
  Request,
  Response,
} from 'express'
import type { UserRow } from '../types/user.js';
import { mapUserRow } from '../mappers/user.js';
import { requireAuth } from '../middleware/auth.js';
import { AVATAR_UPLOAD_DIRECTORY } from '../uploads/storage.js';

export const usersRouter = Router();

usersRouter.use(requireAuth);

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_AVATAR_SIZE,
    files: 1,
  },
}).single('file');

function handleAvatarUpload(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  avatarUpload(
    request,
    response,
    (error: unknown) => {
      if (!error) {
        next();
        return;
      }

      if (
        error instanceof multer.MulterError &&
        error.code === 'LIMIT_FILE_SIZE'
      ) {
        response.status(413).json({
          error: 'avatar file is too large',
        });

        return;
      }

      response.status(400).json({
        error: 'invalid avatar upload',
      });
    },
  );
}

function deleteStoredAvatar(
  avatarUrl: string | null,
) {
  const filename = avatarUrl?.match(
    /^\/avatars\/([a-f0-9-]{36}\.webp)$/,
  )?.[1];

  if (!filename) return;

  try {
    rmSync(
      resolve(AVATAR_UPLOAD_DIRECTORY, filename),
      { force: true },
    );
  } catch (error) {
    console.warn(
      'Failed to remove old avatar:',
      error,
    );
  }
}

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

usersRouter.post(
  '/me/avatar',
  handleAvatarUpload,
  async (request, response) => {
    const currentUser = request.user;
    const file = request.file;

    if (!currentUser) {
      response.status(401).json({
        error: 'authorization required',
      });
      return;
    }

    if (!file) {
      response.status(400).json({
        error: 'image is required',
      });
      return;
    }

    const allowedMimeTypes = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
    ]);

    if (!allowedMimeTypes.has(file.mimetype)) {
      response.status(415).json({
        error: 'unsupported image format',
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

    const filename = `${randomUUID()}.webp`;

    const filePath = resolve(
      AVATAR_UPLOAD_DIRECTORY,
      filename,
    );

    const avatarUrl = `/avatars/${filename}`;

    try {
      const metadata = await sharp(
        file.buffer,
        {
          limitInputPixels: 16_000_000,
        },
      ). metadata();

      if (
        !metadata.format ||
        !['jpeg', 'png', 'webp'].includes(
          metadata.format,
        )
      ) {
        response.status(415).json({
          error: 'unsupported image format',
        });
        return;
      }

      await sharp(file.buffer, {
        limitInputPixels: 16_000_000,
      })
        .rotate()
        .resize(512, 512, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 82})
        .toFile(filePath);
    } catch (error){
      console.warn(
        'Invalid avatar image:',
        error,
      );

      rmSync(filePath, { force: true });

      response.status(400).json({
        error: 'invalid image',
      });
      return;
    }

    try{
      updateUserAvatarUrl(
        currentUser.id,
        avatarUrl,
      );
    } catch (error) {
      rmSync(filePath, { force: true });

      console.error(
        'Failed to update avatar in database:',
        error,
      );

      response.status(500).json({
        error: 'failed to save avatar',
      });
      return;
    }

    deleteStoredAvatar(existingRow.avatarUrl);

    const updatedRow = getUserById(currentUser.id);

    response.json({
      user: mapUserRow(updatedRow),
    });
  },
);

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