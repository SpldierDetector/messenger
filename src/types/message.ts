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
  forwardedFromMessageId: number | null;
  forwardedFromAuthor: string | null;
  isOwn: boolean;
}

