import { Router } from 'express';
import { rmSync } from 'node:fs';
import { 
  getAttachmentById,
  getDownloadableAttachmentForUser,
  insertAttachment,
} from '../db/attachments.js';
import { isUserInChat } from '../db/chat-members.js';
import { mapAttachmentRow } from '../mappers/message.js';
import { requireAuth } from '../middleware/auth.js';
import type { AttachmentRow, AttachmentType } from '../types/message.js';
import { attachmentUpload } from '../uploads/upload.js';
import { getChatUploadDirectory } from '../uploads/storage.js';

function getAttachmentType(
  mimeType: string,
): AttachmentType {
  if (mimeType.startsWith('image/')) {
    return 'image';
  }

  if (mimeType.startsWith('audio/')) {
    return 'audio';
  }

  return 'file';
}

export function createAttachmentsRouter() {
  const attachmentsRouter = Router();

  attachmentsRouter.post(
    '/:chatId/attachments',
    requireAuth,

    (
      request,
      response,
      next,
    ) => {
      const chatId =
        Number(
          request.params.chatId,
        );

      if (
        !Number.isInteger(chatId) ||
        chatId <= 0
      ) {
        response.status(400).json({
          error:
            'chatId must be a positive integer',
        });

        return;
      }

      const currentUser =
        request.user;

      if (!currentUser) {
        response.status(401).json({
          error:
            'authorization required',
        });

        return;
      }

      const userIsChatMember =
        isUserInChat(
          chatId,
          currentUser.id,
        );

      if (!userIsChatMember) {
        response.status(403).json({
          error: 'forbidden',
        });

        return;
      }

      next();
    },

    attachmentUpload.single('file'),

    (
      request,
      response,
    ) => {
      const currentUser =
        request.user;

      const file =
        request.file;

      const chatId =
        Number(
          request.params.chatId,
        );

      if (!currentUser) {
        if (file) {
          rmSync(
            file.path,
            {
              force: true,
            },
          );
        }

        response.status(401).json({
          error:
            'authorization required',
        });

        return;
      }

      if (!file) {
        response.status(400).json({
          error:
            'file is required',
        });

        return;
      }

      try {
        const attachmentType =
          getAttachmentType(
            file.mimetype,
          );

        const result =
          insertAttachment(
            chatId,
            currentUser.id,
            attachmentType,
            file.originalname,
            file.filename,
            file.mimetype,
            file.size,
            Date.now(),
          );

        const attachmentRow =
          getAttachmentById(
            Number(
              result.lastInsertRowid,
            ),
          );

        if (!attachmentRow) {
          throw new Error(
            'created attachment was not found',
          );
        }

        const attachment =
          mapAttachmentRow(
            attachmentRow as AttachmentRow,
          );

        response
          .status(201)
          .json(attachment);
      } catch (caughtError) {
        rmSync(
          file.path,
          {
            force: true,
          },
        );

        console.error(
          'Failed to create attachment:',
          caughtError,
        );

        response.status(500).json({
          error:
            'failed to create attachment',
        });
      }
    },
  );

  attachmentsRouter.get(
    '/:chatId/attachments/:attachmentId/download',
    requireAuth,
    (request, response) => {
      const chatId = Number(request.params.chatId);
      const attachmentId = Number(request.params.attachmentId);
      const currentUser = request.user;
      
      if (
        !Number.isSafeInteger(chatId) ||
        chatId <= 0 ||
        !Number.isSafeInteger(attachmentId) ||
        attachmentId <= 0
      ) {
        response.status(400).json({
          error: 'invalid chatId or attachmentId',
        });

        return;
      }

      if (!currentUser) {
        response.status(401).json({
          error: 'authorization required',
        });

        return;
      }

      const attachment = getDownloadableAttachmentForUser(
        attachmentId,
        chatId,
        currentUser.id,
      );

      if (!attachment) {
        response.status(404).json({
          error: 'attachment not found',
        });

        return;
      }

      const directory = getChatUploadDirectory(chatId);

      response.setHeader(
        'Cache-Control',
        'private, no-store',
      );

      response.setHeader(
        'X-Content-Type-Options',
        'nosniff',
      );

      response.download(
        attachment.storedName,
        attachment.originalName,
        {
          root: directory,
        },
        (error) => {
          if (!error) {
            return;
          }

          console.error(
            'Failed to download attachment:',
            error,
          );

          if (response.headersSent) {
            response.destroy(error);
            return;
          }

          const fileError = error as NodeJS.ErrnoException;

          response.status(
            fileError.code === 'ENOENT' ? 404 : 500,
          ).json({
            error: 'failed to download attachment',
          });
        },
      );
    },
  );

  return attachmentsRouter;
}