import { getMessagesRequest, sendMessageRequest } from '@/services/message-api';
import { saveMessages } from "@/services/message-storage";
import type { MessageData } from "@/types/message";

export async function loadMessageList() {
  return getMessagesRequest();
}

export async function saveMessageList(
  messages: MessageData[]
) {
  await saveMessages(messages);
}

export async function createMessage(
  chatId: number,
  text: string,
) {
  return sendMessageRequest({
    chatId,
    text,
  });
}
