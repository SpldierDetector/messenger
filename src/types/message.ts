export type AttachmentType =
  | 'file'
  | 'image'
  | 'audio';

export type AttachmentData = {
  id: number;
  type: AttachmentType;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  createdAt: number | null; 
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
  isOwn: boolean;
  sendStatus: MessageSendStatus | null;
}

export type MessagePage = {
  messages: MessageData[];
  hasMore: boolean;
  nextBeforeMessageId: number | null;
}

export type MessageReceiptData = {
  messageId: number;
  userId: number;
  deliveredAt: number | null;
  readAt: number | null;
};

export type UnreadMessageCount = {
  chatId: number;
  unreadCount: number;
}

export type MessageSendStatus =
  | 'sending'
  | 'failed';