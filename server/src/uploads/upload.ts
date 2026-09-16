import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { getChatUploadDirectory } from './storage.js';

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const storage =
  multer.diskStorage({
    destination: (
      request,
      _file,
      callback,
    ) => {
      const chatId = Number(request.params.chatId);
      callback(null, getChatUploadDirectory(chatId));
    },

    filename: (
      _request,
      _file,
      callback,
    ) => {
      callback(null, randomUUID());
    },
  });

export const attachmentUpload =
  multer({
    storage,
    limits: {
      fileSize: MAX_FILE_SIZE,
      files: 1,
    },
  });