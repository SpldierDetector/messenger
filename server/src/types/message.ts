export type MessageRow = {
  id: number;
  chatId: number;
  author: string;
  text: string;
  createdAt: number;
  isOwn: number;
};

export type MessageData = {
  id: number;
  chatId: number;
  author: string;
  text: string;
  createdAt: number;
  isOwn: boolean;
};