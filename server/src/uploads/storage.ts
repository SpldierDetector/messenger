import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

export const UPLOAD_DIRECTORY =
  resolve(process.cwd(), 'uploads');

export const CHAT_UPLOAD_DIRECTORY =
  resolve(
    UPLOAD_DIRECTORY,
    'chats',
  );

mkdirSync(
  UPLOAD_DIRECTORY,
  {
    recursive: true,
  },
);

export function getChatUploadDirectory(
  chatId: number
) {
  const directory =
    resolve(
      CHAT_UPLOAD_DIRECTORY,
      String(chatId),
    );

  mkdirSync(
    directory,
    {
      recursive: true,
    },
  );

  return directory;
}