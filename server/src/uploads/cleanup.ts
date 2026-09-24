import { unlinkSync } from 'node:fs';
import { join } from 'node:path';
import {
  deleteExpiredUnattachedAttachment,
  getAttachmentById,
  getExpiredUnattachedAttachments,
} from '../db/attachments.js';
import type { AttachmentRow } from '../types/message.js';
import { CHAT_UPLOAD_DIRECTORY } from './storage.js';

const UNATTACHED_FILE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function cleanupExpiredAttachments(): void {
  const cutoff =
    Date.now() - UNATTACHED_FILE_MAX_AGE_MS;

  const attachments = getExpiredUnattachedAttachments(cutoff);

  let deletedCount = 0;

  for (const attachment of attachments) {
    try {
      const currentAttachment = getAttachmentById(
        attachment.id,
      ) as AttachmentRow | undefined;

      if (
        !currentAttachment ||
        currentAttachment.messageId !== null ||
        currentAttachment.createdAt >= cutoff
      ) {
        continue;
      }

      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          .test(currentAttachment.storedName)
      ) {
        console.warn(
          'Skipping attachment with invalid storedName:',
          currentAttachment.id,
        );

        continue;
      }

      const filePath = join(
        CHAT_UPLOAD_DIRECTORY,
        String(currentAttachment.chatId),
        currentAttachment.storedName,
      );

      try {
        unlinkSync(filePath);
      } catch (error) {
        const fileError = error as NodeJS.ErrnoException;

        if (fileError.code !== 'ENOENT') {
          throw error;
        }
      }

      const wasDeleted =
        deleteExpiredUnattachedAttachment(
          currentAttachment.id,
          cutoff,
        );

      if (wasDeleted) {
        deletedCount += 1;
      }
    } catch (error) {
      console.error(
        `Failed to clean up attachment ${attachment.id}:`,
        error,
      );
    }
  }

  console.log(
    `Attachment cleanup: removed ${deletedCount} expired attachments`,
  );
}