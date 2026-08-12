import type { MessageApiData } from '@/types/message-api';
import type { MessageData } from '@/types/message';

export function mapMessageApiData(
  message: MessageApiData,
  currentUserId: number,
): MessageData {
  return {
    ...message,
    isOwn: message.senderId === currentUserId,
  };
}