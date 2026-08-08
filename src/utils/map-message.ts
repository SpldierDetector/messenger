import { CURRENT_USER_ID } from '@/config/current-user';
import type { MessageApiData } from '@/types/message-api';
import type { MessageData } from '@/types/message';

export function mapMessageApiData(
  message: MessageApiData,
): MessageData {
  return {
    ...message,
    isOwn: message.senderId === CURRENT_USER_ID,
  };
}