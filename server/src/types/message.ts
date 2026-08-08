export type MessageRow = {
  id: number;
  chatId: number;
  senderId: number;
  author: string;
  text: string;
  createdAt: number;
};

export type MessageData = {
  id: number;
  chatId: number;
  senderId: number;
  author: string;
  text: string;
  createdAt: number;
};

export type SendMessageRequest = {
  chatId: number;
  text: string;
};