import { loadMessages, saveMessages } from "@/services/message-storage";
import type { MessageData } from "@/types/message";
import { createOutgoingMessage } from "@/utils/create-message";

export async function loadMessageList() {
  return loadMessages();
}

export async function saveMessageList(
  messages: MessageData[]
) {
  await saveMessages(messages);
}

export function createLocalMessage(
  chatId: number, text: string
) {
  return createOutgoingMessage(chatId, text);
}
