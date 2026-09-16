export type AttachmentType =
  | 'file'
  | 'image'
  | 'audio';

export type AttachmentRow = {
  id: number;
  chatId: number;
  messageId: number | null;
  uploaderId: number;
  type: AttachmentType;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  sortOrder: number;
  createdAt: number;
};

export type AttachmentData = {
  id: number;
  type: AttachmentType;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  createdAt: number;
};

export type MessageRow = {
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
};

export type MessageData = {
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

export type SendMessageRequest = {
  chatId: number;
  text: string;
  clientMessageId: string;
  replyToMessageId?: number | null;
};

export type EditMessageRequest = {
  text: string;
};

export type ForwardMessageRequest = {
  targetChatId: number,
};

export type SyncMessagesRequest = {
  messageIds: number [];
};