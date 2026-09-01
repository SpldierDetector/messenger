export type MessageData = {
  id: number;
  chatId: number;
  senderId: number;
  author: string;
  text: string;
  createdAt: number;
  editedAt: number | null;
  deletedAt: number | null;
  isOwn: boolean;
}

