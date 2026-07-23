import { sendMessageRequest } from '@/services/message-api';
import { loadMessages, saveMessages } from "@/services/message-storage";
import type { MessageData } from "@/types/message";

export async function loadMessageList() {
  return loadMessages();
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
