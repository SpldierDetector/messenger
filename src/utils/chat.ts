import type { ChatData } from '@/types/chat';
import type { MessageData } from '@/types/message';
import { getLastMessage } from '@/utils/message';

export function sortChatsByLatestMessage(
    chats: ChatData[],
    messages: MessageData[],
) {
  return [...chats].sort((firstChat, secondChat) => {
    const firstLastMessage = getLastMessage(
      messages,
      firstChat.id
    );

    const secondLastMessage = getLastMessage(messages, secondChat.id);

    if (!firstLastMessage && !secondLastMessage) {
      return 0;
    }

    if (!firstLastMessage){
      return 1;
    }

    if (!secondLastMessage){
      return -1;
    }

    return secondLastMessage.createdAt - firstLastMessage.createdAt;
    });
  }