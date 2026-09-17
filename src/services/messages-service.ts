import {
  deleteMessageForMeRequest,
  deleteMessageRequest,
  editMessageRequest,
  forwardMessageRequest,
  getLatestMessagesRequest,
  getMessagePageRequest,
  getMessageReceiptsRequest,
  getMessagesRequest,
  getPendingDeliveryMessagesRequest,
  getUnreadMessageCountsRequest,
  searchMessagesRequest,
  sendMessageRequest,
  syncMessagesRequest,
} from '@/services/message-api';
import { saveMessages } from "@/services/message-storage";
import type { MessageData, UnreadMessageCount } from "@/types/message";

export async function searchMessages(
  chatId: number,
  search: string,
  token: string,
  currentUserId: number,
) {
  return searchMessagesRequest(
    chatId,
    search,
    token,
    currentUserId,
  );
}

export async function syncMessages(
  messageIds: number[],
  token: string,
  currentUserId: number,
) {
  return syncMessagesRequest(
    messageIds,
    token,
    currentUserId,
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

export async function loadMessagePage(
  chatId: number,
  beforeMessageId: number | null,
  token: string,
  currentUserId: number,
) {
  return getMessagePageRequest(
    chatId,
    beforeMessageId,
    token,
    currentUserId,
  );
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
  clientMessageId: string,
  replyToMessageId: number | null = null,
  attachmentIds: number[] = [],
) {
  return sendMessageRequest(
    {
      chatId,
      text,
      clientMessageId,
      replyToMessageId,
      attachmentIds,
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