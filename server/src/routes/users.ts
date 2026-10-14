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
  updateUserAvatarImages,
} from '../db/users.js';
import type {
  NextFunction,
  Request,
  Response,
} from 'express';
import { publishProfileUpdate } from '../realtime/profile-events.js';
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
  avatarFullUrl: string | null,
) {
  for (const url of [avatarUrl, avatarFullUrl]) {
    const filename = url?.match(
      /^\/avatars\/([a-f0-9-]{36}(?:-full)?\.webp)$/,
    )?.[1];

    if (!filename) continue;

    try {
      rmSync(
        resolve(AVATAR_UPLOAD_DIRECTORY, filename),
        { force: true },
      );
    } catch (error) {
      console.warn(
        'Failed to remove avatar image:',
        error,
      );
    }
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

    const imageId = randomUUID();

    const thumbnailName = `${imageId}.webp`;
    const fullName = `${imageId}-full.webp`;

    const thumbnailPath = resolve(
      AVATAR_UPLOAD_DIRECTORY,
      thumbnailName,
    );

    const fullPath = resolve(
      AVATAR_UPLOAD_DIRECTORY,
      fullName,
    );

    const avatarUrl = `/avatars/${thumbnailName}`;
    const avatarFullUrl = `/avatars/${fullName}`;

    try {
      const metadata = await sharp(
        file.buffer,
        {
          limitInputPixels: 16_000_000,
        },
      ).metadata();

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
        .resize(1600, 1600, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toFile(fullPath);

      await sharp(file.buffer, {
        limitInputPixels: 16_000_000,
      })
        .rotate()
        .resize(512, 512, {
          fit: 'cover',
          position: 'centre',
        })
        .webp({ quality: 82 })
        .toFile(thumbnailPath);
    } catch (error) {
      rmSync(fullPath, { force: true });
      rmSync(thumbnailPath, { force: true });

      console.warn(
        'Failed to process avatar image:',
        error,
      );

      response.status(400).json({
        error: 'invalid image',
      });
      return;
    }

    let updatedRow: UserRow;

    try {
      updateUserAvatarImages(
        currentUser.id,
        avatarUrl,
        avatarFullUrl,
      );

      const row = getUserById(
        currentUser.id,
      ) as UserRow | undefined;

      if (!row) {
        throw new Error('Updated user was not found');
      }

      updatedRow = row;
    } catch (error) {
      rmSync(fullPath, { force: true });
      rmSync(thumbnailPath, { force: true });

      console.error(
        'Failed to save avatar:',
        error,
      );

      response.status(500).json({
        error: 'failed to save avatar',
      });
      return;
    }

    deleteStoredAvatar(
      existingRow.avatarUrl,
      existingRow.avatarFullUrl,
    );

    const updatedUser = mapUserRow(updatedRow);

    response.json({
      user: updatedUser,
    });

    publishProfileUpdate(updatedUser);
  },
);

usersRouter.delete(
  '/me/avatar',
  (request, response) => {
    const currentUser = request.user;

    if (!currentUser) {
      response.status(401).json({
        error: 'authorization required',
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

    try {
      updateUserAvatarImages(
        currentUser.id,
        null,
        null,
      );

      const updatedRow = getUserById(
        currentUser.id,
      );

      if (!updatedRow) {
        throw new Error(
          'updated user was not found',
        );
      }

      deleteStoredAvatar(
        existingRow.avatarUrl,
        existingRow.avatarFullUrl,
      );

      const updatedUser = mapUserRow(updatedRow);

      response.json({
        user: updatedUser,
      });

      publishProfileUpdate(updatedUser);
    } catch (error) {
      console.error(
        'Failed to delete avatar:',
        error,
      );

      response.status(500).json({
        error: 'failed to delete avatar',
      });
    }
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

  const updatedUser = mapUserRow(updatedRow);

  response.json({
    user: updatedUser,
  });

  publishProfileUpdate(updatedUser);
});

usersRouter.get('/:id', (request, response) => {
  const userId = Number(request.params.id);

  if (
    !Number.isFinite(userId) ||
    userId <= 0
  ) {
    response.status(400).json({
      error: 'user id must be a positive integer',
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