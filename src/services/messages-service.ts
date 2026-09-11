import {
  deleteMessageForMeRequest,
  deleteMessageRequest,
  editMessageRequest,
  forwardMessageRequest,
  getLatestMessagesRequest,
  getMessageReceiptsRequest,
  getMessagesRequest,
  getPendingDeliveryMessagesRequest,
  getUnreadMessageCountsRequest,
  searchMessagesRequest,
  sendMessageRequest,
} from '@/services/message-api';
import { saveMessages } from "@/services/message-storage";
import type { MessageData, UnreadMessageCount } from "@/types/message";

export async function searchMessages(
  chatId: number,
  search: string,
  token: string,
) {
  return searchMessagesRequest(
    chatId,
    search,
    token,
  );
}

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

export async function loadMessageReceipts(
  chatId: number,
  token: string,
) {
  return getMessageReceiptsRequest(
    chatId,
    token,
  );
}

export async function loadPendingDeliveryMessages(
  token: string,
  currentUserId: number,
) {
  return getPendingDeliveryMessagesRequest(
    token,
    currentUserId,
  );
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

export async function deleteMessageForMe(
  messageId: number,
  token: string,
) {
  return deleteMessageForMeRequest(
    messageId,
    token,
  );
}

export async function forwardMessage(
  messageId: number,
  targetChatId: number,
  token: string,
  currentUserId: number,
) {
  return forwardMessageRequest(
    messageId,
    targetChatId,
    token,
    currentUserId,
  );
}

export async function loadUnreadMessageCounts(
  token: string,
): Promise<UnreadMessageCount[]> {
  return getUnreadMessageCountsRequest(
    token,
  );
}