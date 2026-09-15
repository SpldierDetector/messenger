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