import {
  deleteMessageRequest,
  editMessageRequest,
  getLatestMessagesRequest,
  getMessagesRequest,
  sendMessageRequest,
} from '@/services/message-api';
import { saveMessages } from "@/services/message-storage";
import type { MessageData } from "@/types/message";

export async function loadLatestMessages(
  token: string,
  currentUserId: number,
) {
  return getLatestMessagesRequest(
    token,
    currentUserId,
  );
}

export async function loadMessageList(
  chatId: number,
  token: string,
  currentUserId: number,
) {
  return getMessagesRequest(chatId, token, currentUserId,);
}

export async function saveMessageList(
  messages: MessageData[],
) {
  await saveMessages(messages);
}

export async function createMessage(
  chatId: number,
  text: string,
  token: string,
  currentUserId: number,
  replyToMessageId: number | null = null,
) {
  return sendMessageRequest(
    {
      chatId,
      text,
      replyToMessageId,
    },
    token,
    currentUserId,
  );
}

export async function editMessage(
  messageId: number,
  text: string,
  token: string,
  currentUserId: number,
) {
  return editMessageRequest(
    messageId,
    text,
    token,
    currentUserId,
  );
}

export async function deleteMessage(
  messageId: number,
  token: string,
  currentUserId: number,
) {
  return deleteMessageRequest(
    messageId,
    token,
    currentUserId,
  );
}
