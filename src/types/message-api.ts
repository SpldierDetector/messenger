import type { AttachmentData, MessageData } from '@/types/message';

export type SendMessageRequest = {
  chatId: number;
  text: string;
  clientMessageId: string;
  replyToMessageId?: number | null;
  attachmentIds?: number[];
};

export type SendMessageResponse = MessageData;

export type MessageApiData = {
  id: number;
  chatId: number;
  senderId: number;
  clientMessageId: string | null;
  author: string;
  text: string;
  createdAt: number;
  editedAt: number | null;
  deletedAt: number | null;
  replyToMessageId: number | null;
  forwardedFromMessageId: number | null;
  forwardedFromAuthor: string | null;
  attachments: AttachmentData[];
};

export type MessagePageApiData = {
  messages: MessageApiData[];
  hasMore: boolean;
  nextBeforeMessageId: number | null;
};

export type EditMessageRequest = {
  text: string;
};

