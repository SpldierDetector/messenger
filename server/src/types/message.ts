export type MessageRow = {
  id: number;
  chatId: number;
  senderId: number;
  author: string;
  text: string;
  createdAt: number;
  editedAt: number | null;
  deletedAt: number | null;
  replyToMessageId: number | null;
};

export type MessageData = {
  id: number;
  chatId: number;
  senderId: number;
  author: string;
  text: string;
  createdAt: number;
  editedAt: number | null;
  deletedAt: number | null;
  replyToMessageId: number | null;
};

export type SendMessageRequest = {
  chatId: number;
  text: string;
  replyToMessageId?: number | null;
};

export type EditMessageRequest = {
  text: string;
};