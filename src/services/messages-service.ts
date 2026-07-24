import {
  getLatestMessagesRequest,
  getMessagesRequest,
  sendMessageRequest
} from '@/services/message-api';
import { saveMessages } from "@/services/message-storage";
import type { MessageData } from "@/types/message";

export async function loadLatestMessages() {
  return getLatestMessagesRequest();
}

export async function loadMessageList(chatId: number) {
  return getMessagesRequest(chatId);
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
