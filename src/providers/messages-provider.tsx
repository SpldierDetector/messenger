import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from '@/providers/auth-provider';
import {
  createMessage,
  deleteMessageForMe as deleteMessageForMeService,
  deleteMessage as deleteMessageService,
  editMessage as editMessageService,
  forwardMessage as forwardMessageService,
  loadLatestMessages,
  loadMessagePage,
  loadMessageReceipts,
  loadPendingDeliveryMessages,
  loadUnreadMessageCounts,
  searchMessages as searchMessagesService
  syncMessages as syncMessagesService,
} from "@/services/messages-service";
import {
  connectWebSocket,
  type TypingEventData,
  type UserPresenceEventData,
  type WebSocketConnection,
} from "@/services/websocket-service";

import type {
  MessageData,
  MessageReceiptData,
  UnreadMessageCount,
} from "@/types/message";

type MessagesContextValue = {
  messages: MessageData[];
  receipts: MessageReceiptData[];
  unreadCounts: UnreadMessageCount[];
  typingUserIdsByChat: Record<number, number[]>;
  onlineByChat: Record<number, boolean>;
  isRealtimeConnected: boolean;
  lastSeenByChat: Record<number, number | null>;
  deleteMessage: (messageId: number) => Promise<boolean>;
  deleteMessageForMe: (messageId: number) => Promise<boolean>;
  clearChatHistoryLocally: (chatId: number) => void;
  forwardMessage: (messageId: number, targetChatId: number) => Promise<boolean>;
  sendMessage: (chatId: number, text: string, replyToMessageId?: number | null) => Promise<boolean>;
  retryMessage: (clientMessageId: string) => Promise<boolean>;
  isLoaded: boolean;
  isSending: boolean;
  error: string | null;
  messageSearchResults: MessageData[];
  isSearchingMessages: boolean;
  messageSearchError: string | null;
  searchMessagesInChat: (chatId: number, search: string) => Promise<void>;
  clearMessageSearch: () => void;
  loadMessages: (chatId: number) => Promise<void>;
  loadOlderMessages: (chatId: number) => Promise<void>;
  hasMoreMessagesByChat: Record<number, boolean>;
  isLoadingOlderMessagesByChat: Record<number, boolean>;
  loadLatestMessagePreviews: () => Promise<void>;
  markChatRead: (chatId: number) => void;
  editMessage: (messageId: number, text: string,) => Promise<boolean>;
  startTyping: (chatId: number) => void;
  stopTyping: (chatId: number) => void;
};

export const MessagesContext = createContext<MessagesContextValue | undefined>(
  undefined,
);

type MessagesProviderProps = {
  children: ReactNode;
};

export function MessagesProvider({ children }: MessagesProviderProps) {
  const { isAuthenticated, token, user, } = useAuth();

  const [messages, setMessages] = useState<MessageData[]>([]);
  const [receipts, setReceipts] = useState<MessageReceiptData[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<UnreadMessageCount[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUserIdsByChat, setTypingUserIdsByChat] = useState<Record<number, number[]>>({});
  const [onlineByChat, setOnlineByChat] = useState<Record<number, boolean>>({});
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastSeenByChat, setLastSeenByChat] = useState<Record<number, number | null>>({});
  const [messageSearchResults, setMessageSearchResults] = useState<MessageData[]>([]);
  const [isSearchingMessages, setIsSearchingMessages] = useState(false);
  const [messageSearchError, setMessageSearchError] = useState<string | null>(null);
  const [hasMoreMessagesByChat, setHasMoreMessagesByChat] = useState<Record<number, boolean>>({});
  const [nextBeforeMessageIdByChat, setNextBeforeMessageIdByChat] = useState<Record<number, number | null>>({});
  const [isLoadingOlderMessagesByChat, setIsLoadingOlderMessagesByChat] = useState<Record<number, boolean>>({});
  const messageRef = useRef<MessageData[]>([]);
  const messageSearchRequestIdRef = useRef(0);
  const nextTemporaryMessageIdRef = useRef(-1);
  const webSocketConnectionRef = useRef<WebSocketConnection | null>(null);
  const loadingOlderChatIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    messageRef.current = messages;
  }, [messages]);

  async function loadMessages(chatId: number) {
    if (!token || !user) {
      return;
    }

    const [page, loadedReceipts] =
      await Promise.all([
        loadMessagePage(
          chatId,
          null,
          token,
          user.id,
        ),
        loadMessageReceipts(
          chatId,
          token,
        ),
      ]);
    
    setMessages((currentMessages) => {
      const messagesFromOtherChats =
        currentMessages.filter(
          (message) =>
            message.chatId !== chatId,
        );

      const pageMessageIds = new Set(
        page.messages.map(
          (message) => message.id,
        ),
      );

      const newestPageMessageId =
        page.messages.length > 0
          ? Math.max(
              ...page.messages.map(
                (message) => message.id
              ),
            )
          : null;
      
      const newerRealtimeMessages =
        currentMessages.filter(
          (message) =>
            message.chatId === chatId &&
            !pageMessageIds.has(message.id) &&
            (
              newestPageMessageId === null ||
              message.id >
                newestPageMessageId
            ),
        );

      return [
        ...messagesFromOtherChats,
        ...page.messages,
        ...newerRealtimeMessages,
      ];
    });

    const loadedMessageIds = new Set(
      page.messages.map(
        (message) => message.id,
      ),
    );

    setReceipts((currentReceipts) => [
      ...currentReceipts.filter(
        (receipt) =>
          !loadedMessageIds.has(
            receipt.messageId,
          ),
      ),
      ...loadedReceipts,
    ]);

    setHasMoreMessagesByChat(
      (current) => ({
        ...current,
        [chatId]: page.hasMore,
      }),
    );

    setNextBeforeMessageIdByChat(
      (current) => ({
        ...current,
        [chatId]: page.nextBeforeMessageId,
      }),
    );

    setIsLoaded(true);
  }

  async function loadOlderMessages(
    chatId: number,
  ) {
    if (!token || !user) {
      return;
    }

    if (
      loadingOlderChatIdsRef.current.has(chatId)
    ) {
      return;
    }

    const hasMore = hasMoreMessagesByChat[chatId] ?? false;
    const beforeMessageId = nextBeforeMessageIdByChat[chatId] ?? null;

    if (
      !hasMore ||
      beforeMessageId === null
    ) {
      return;
    }

    loadingOlderChatIdsRef.current.add(chatId);

    setIsLoadingOlderMessagesByChat(
      (current) => ({
        ...current,
        [chatId]: true,
      }),
    );

    try {
      const page =
        await loadMessagePage(
          chatId,
          beforeMessageId,
          token,
          user.id,
        );

      setMessages((currentMessages) => {
        const existingMessageIds =
          new Set(
            currentMessages.map(
              (message) => message.id,
            ),
          );

        const newMessages = 
          page.messages.filter(
            (message) => 
              !existingMessageIds.has(message.id),
          );

        return [
          ...currentMessages,
          ...newMessages,
        ];
      });

      setHasMoreMessagesByChat(
        (current) => ({
          ...current,
          [chatId]: page.hasMore,
        }),
      );

      setNextBeforeMessageIdByChat(
        (current) => ({
          ...current,
          [chatId]: page.nextBeforeMessageId,
        }),
      );
    } catch (caughtError) {
      console.error(
        'Failed to load older messages:',
        caughtError,
      );

      setError(
        'Не удалось загрузить предыдущие сообщения',
      );
    } finally {
      loadingOlderChatIdsRef.current.delete(chatId);

      setIsLoadingOlderMessagesByChat(
        (current) => ({
          ...current,
          [chatId]: false,
        }),
      );
    }
  }

  async function loadLatestMessagePreviews() {
    if (!token || !user) {
      return;
    }

    const latestMessages = await loadLatestMessages(token, user.id,);

    setMessages(latestMessages);
    setIsLoaded(true);
  }

  async function searchMessagesInChat(
    chatId: number,
    search: string
  ): Promise<void> {
    const query = search.trim();

    if (!token || !user || !query) {
      clearMessageSearch();
      return;
    }

    const requestId = ++messageSearchRequestIdRef.current;

    try {
      setIsSearchingMessages(true);
      setMessageSearchError(null);
      setMessageSearchResults([]);

      const results = await searchMessagesService(
        chatId,
        query,
        token,
        user.id,
      );

      if (
        requestId !==
        messageSearchRequestIdRef.current
      ) {
        return;
      }

      setMessageSearchResults(results);
    } catch (caughtError) {
      if (
        requestId !==
        messageSearchRequestIdRef.current
      ) {
        return;
      }

      console.error('Failed to search messages:', caughtError);

      setMessageSearchError(
        'Не удалось выполнить поиск сообщений',
      );
    } finally {
      if (
        requestId ===
        messageSearchRequestIdRef.current
      ) {
        setIsSearchingMessages(false);
      }
    }
  }

  function clearMessageSearch() {
    ++messageSearchRequestIdRef.current;

    setMessageSearchResults([]);
    setIsSearchingMessages(false),
    setMessageSearchError(null);
  }

  async function refreshLatestMessagePreviews() {
    if (!token || !user) {
      return;
    }

    const latestMessages =
      await loadLatestMessages(
        token,
        user.id,
      );

    setMessages((currentMessages) => {
      const mergedMessages = [
        ...currentMessages,
      ];

      for (const latestMessage of latestMessages) {
        const existingIndex =
          mergedMessages.findIndex(
            (message) =>
              message.id === latestMessage.id,
          );

        if (existingIndex >= 0) {
          mergedMessages[existingIndex] =
            latestMessage;
        } else {
          mergedMessages.push(
            latestMessage,
          );
        }
      }

      return mergedMessages;
    });
  }

  async function syncPendingDeliveryMessages() {
    if (!token || !user) {
      return;
    }

    try{
      const pendingMessages =
        await loadPendingDeliveryMessages(
          token,
          user.id,
        );

      for (const message of pendingMessages) {
        addMessageIfMissing(message);

        webSocketConnectionRef.current
          ?.acknowledgeMessageDelivered(message.id);
      }
    } catch (caughtError) {
      console.error(
        'Failed to sync pending delivery messages:',
        caughtError,
      );
    }
  }

  const refreshUnreadCounts = useCallback(
    async () => {
      if (!token) {
        return;
      }

      try {
        const counts = await loadUnreadMessageCounts(token);

        setUnreadCounts(counts);
      } catch (caughtError) {
        console.error(
          'Failed to load unread message counts:',
          caughtError,
        );
      }
    },
    [token],
  );
  
  const markChatRead = useCallback(
    (chatId: number) => {
      webSocketConnectionRef.current?.markChatRead(chatId);

      setUnreadCounts((currentCounts) =>
        currentCounts.filter(
          (count) =>
            count.chatId !== chatId,
        ), 
      );
    },
    [],
  );

  const startTyping = useCallback(
    (chatId: number) => {
      webSocketConnectionRef.current
        ?.startTyping(chatId);
    },
    [],
  );

  const stopTyping = useCallback(
    (chatId: number) => {
      webSocketConnectionRef.current
        ?.stopTyping(chatId);
    },
    [],
  );

  function createClientMessageId(
    userId: number,
  ) {
    return [
      userId,
      Date.now(),
      Math.random().toString(36).slice(2),
      Math.random().toString(36).slice(2),
    ].join('-');
  }
  
  async function sendMessage(chatId: number, text: string, replyToMessageId: number | null = null): Promise<boolean> {
    if (!token || !user) {
      return false;
    }
    
    const normalizedText = text.trim();

    if (!normalizedText) {
      return false;
    }

    const clientMessageId = createClientMessageId(user.id);
    const temporaryMessageId = nextTemporaryMessageIdRef.current;

    nextTemporaryMessageIdRef.current -= 1;

    const optimisticMessage: MessageData = {
      id: temporaryMessageId,
      chatId,
      senderId: user.id,
      clientMessageId,
      author: user.name,
      text: normalizedText,
      createdAt: Date.now(),
      editedAt: null,
      deletedAt: null,
      replyToMessageId,
      forwardedFromMessageId: null,
      forwardedFromAuthor: null,
      isOwn: true,
      sendStatus: 'sending',
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      optimisticMessage,
    ]);

    try {
      setIsSending(true);
      setError(null);

      const message =
        await createMessage(
          chatId,
          normalizedText,
          token,
          user.id,
          clientMessageId,
          replyToMessageId,
        );

      addOrReplaceServerMessage(
        message,
      );

      return true;
    } catch (caughtError) {
      console.warn(
        'Failed to send message:',
        caughtError,
      );

      setMessages((currentMessages) =>
        currentMessages.map(
          (message) =>
            message.senderId === user.id &&
            message.clientMessageId ===
              clientMessageId
              ? {
                ...message,
                sendStatus: 'failed',
              }
              : message,
        ),
      );

      return false;
    } finally {
      setIsSending(false);
    }
  }

  async function retryMessage(
    clientMessageId: string,
  ): Promise<boolean> {
    if (!token || !user) {
      return false;
    }

    const failedMessage = messages.find(
      (message) =>
        message.senderId === user.id &&
        message.clientMessageId === clientMessageId &&
        message.sendStatus === 'failed',
    );

    if (!failedMessage) {
      return false;
    }

    setMessages((currentMessages) =>
      currentMessages.map(
        (message) =>
          message.senderId === user.id &&
          message.clientMessageId === clientMessageId
            ? {
              ...message,
              sendStatus: 'sending',
            }
            : message,
      ),
    );

    try {
      const message =
      await createMessage(
        failedMessage.chatId,
        failedMessage.text,
        token,
        user.id,
        clientMessageId,
        failedMessage.replyToMessageId,
      );
      addOrReplaceServerMessage(message);

      return true;
    } catch (caughtError) {
      console.warn(
        'Failed to retry message:',
        caughtError,
      );

      setMessages((currentMessages) =>
        currentMessages.map (
          (message) =>
            message.senderId === user.id &&
            message.clientMessageId ===
            clientMessageId
            ? {
              ...message,
              sendStatus: 'failed',
            }
            : message,
        ),
      );

      return false;
    }
  }

  async function editMessage(
    messageId: number,
    text: string,
  ): Promise<boolean> {
    if (!token || !user) {
      return false;
      }

      try {
        setError(null);

      const updatedMessage =
        await editMessageService(
          messageId,
          text,
          token,
          user.id,
        );

      updateMessageInState(
        updatedMessage,
      );

      return true;
    } catch (caughtError) {
      console.error(
        'Failed to edit message:',
        caughtError,
      );

      setError(
        'Не удалось изменить сообщение',
      );

      return false;
    }
  }

  async function deleteMessage(
    messageId: number,
  ): Promise<boolean> {
    if (!token || !user) {
      return false;
    }

    try {
      setError(null);

      const deletedMessage =
        await deleteMessageService(
          messageId,
          token,
          user.id
        );

      updateMessageInState(
        deletedMessage,
      );
      return true;
    } catch (caughtError) {
      console.error(
        'Failed to delete message:',
        caughtError,
      );

      setError(
        'Не удалось удалить сообщение',
      );

      return false;
    }
  }

  async function deleteMessageForMe(
    messageId: number,
  ): Promise<boolean> {
    if (!token) {
      return false;
    }

    try {
      setError(null);

      await deleteMessageForMeService(
        messageId,
        token,
      );

      setMessages((currentMessages) =>
        currentMessages.filter(
          (message) =>
            message.id !== messageId,
        ),
      );

      setReceipts((currentReceipts) =>
        currentReceipts.filter(
          (receipt) =>
            receipt.messageId !== messageId,
        ), 
      );

      void refreshLatestMessagePreviews();

      return true;
    } catch (caughtError) {
      console.error(
        'Failed to delete message for current user:',
        caughtError,
      );

      setError(
        'Не удалось удалить сообщение',
      );

      return false;
    }
  }

  function clearChatHistoryLocally(
    chatId: number,
  ) {
    const messageIdsToRemove = new Set(
      messages
        .filter(
          (message) => message.chatId === chatId,
        )
        .map(
          (message) => message.id,
        ),
    );

    setMessages((currentMessages) =>
      currentMessages.filter(
        (message) => message.chatId !== chatId,
      ),
    );

    setHasMoreMessagesByChat(
      (current) => ({
        ...current,
        [chatId]: false,
      }),
    );

    setNextBeforeMessageIdByChat(
      (current) => ({
        ...current,
        [chatId]: null,
      }),
    );

    setIsLoadingOlderMessagesByChat(
      (current) => ({
        ...current,
        [chatId]: false,
      }),
    );

    loadingOlderChatIdsRef.current.delete(chatId);

    setReceipts((currentReceipts) =>
      currentReceipts.filter(
        (receipt) => !messageIdsToRemove.has(receipt.messageId),
      ),
    );

    setUnreadCounts((currentCounts) =>
      currentCounts.filter(
        (count) => count.chatId !== chatId,
      ),
    );

    setTypingUserIdsByChat(
      (currentTypingUsers) => {
        if (
          !(chatId in currentTypingUsers)
        ) {
          return currentTypingUsers;
        }

        const nextTypingUsers = {
          ...currentTypingUsers,
        };

        delete nextTypingUsers[chatId];

        return nextTypingUsers;
      },
    );
  }

  async function forwardMessage(
    messageId: number,
    targetChatId: number,
  ): Promise<boolean> {
    if (!token || !user) {
      return false;
    }

    try {
      setError(null);

      const forwardedMessage =
        await forwardMessageService(
          messageId,
          targetChatId,
          token,
          user.id,
        );
      
      addMessageIfMissing(
        forwardedMessage,
      );

      return true;
    } catch (caughtError) {
      console.error(
        'Failed to forward message:',
        caughtError,
      );

      setError(
        'Не удалось переслать сообщение',
      );

      return false;
    }
  }

  function addMessageIfMissing(newMessage: MessageData) {
    setMessages((currentMessages) => {
      const alreadyExists = currentMessages.some(
        (message) => message.id === newMessage.id,
      );

      if (alreadyExists) {
        return currentMessages;
      }
      return [...currentMessages, newMessage];
    });
  }

  function addOrReplaceServerMessage(
    newMessage: MessageData,
  ) {
    setMessages((currentMessages) => {
      const existingIndex =
        currentMessages.findIndex(
          (message) =>
            message.id === newMessage.id ||
            (
              newMessage.clientMessageId !== null &&
              message.senderId === newMessage.senderId &&
              message.clientMessageId === newMessage.clientMessageId
            ),
        );
      
      if (existingIndex === -1) {
        return [
          ...currentMessages,
          newMessage,
        ];
      }

      return currentMessages.map(
        (message, index) =>
          index === existingIndex
            ? newMessage
            : message,
      );
    });
  }

  function handleMessageCreated(
    newMessage: MessageData,
  ) {
    addOrReplaceServerMessage(newMessage);

    if (newMessage.senderId === user?.id) {
      return;
    }

    setUnreadCounts((currentCounts) => {
      const existingCount = currentCounts.find(
        (count) =>
          count.chatId === newMessage.chatId,
      );

      if (!existingCount) {
        return [
          ...currentCounts,
          {
            chatId: newMessage.chatId,
            unreadCount: 1,
          },
        ];
      }

      return currentCounts.map(
        (count) =>
          count.chatId === newMessage.chatId
          ? {
            ...count,
            unreadCount:
              count.unreadCount + 1,
          }
        : count,
        );
      });
  } 

  function handleTypingStarted(
    data: TypingEventData,
  ) {
    setTypingUserIdsByChat(
      (currentTypingUsers) => {
        const currentUserIds =
          currentTypingUsers[data.chatId] ?? [];

        if (
          currentUserIds.includes(data.userId)
        ) {
          return currentTypingUsers;
        }

        return {
          ...currentTypingUsers,
          [data.chatId]: [
            ...currentUserIds,
            data.userId,
          ],
        };
      },
    );
  }

  function handleTypingStopped(
    data: TypingEventData,
  ) {
    setTypingUserIdsByChat(
      (currentTypingUsers) => {
        const currentUserIds = 
          currentTypingUsers[data.chatId] ?? [];

        if (
          !currentUserIds.includes(data.userId)
        ) {
          return currentTypingUsers;
        }

        return {
          ...currentTypingUsers,
          [data.chatId]:
            currentUserIds.filter(
              (userId) =>
                userId !== data.userId,
            )
        }
      }
    )
  }

  function handleUserPresenceUpdated(
    data: UserPresenceEventData,
  ) {
    setOnlineByChat(
      (currentPresence) => ({
        ...currentPresence,
        [data.chatId]: data.isOnline,
      }),
    );

    setLastSeenByChat(
      (currentLastSeen) => ({
        ...currentLastSeen,
        [data.chatId]:
          data.lastSeenAt,
      }),
    );

    if (data.isOnline) {
      return;
    }

    setTypingUserIdsByChat(
      (currentTypingUsers) => {
        const currentUserIds =
          currentTypingUsers[data.chatId] ?? [];

        const nextUserIds =
          currentUserIds.filter(
            (userId) => userId !== data.userId,
          );

        return {
          ...currentTypingUsers,
          [data.chatId]: nextUserIds,
        };
      },
    );
  }

  function updateMessageInState(
    updatedMessage: MessageData,
  ) {
    setMessages((currentMessages) =>
      currentMessages.map((message) =>
        message.id === updatedMessage.id
          ? updatedMessage
          : message,
      ),
    );
  }

  function updateReceiptInState(
    updatedReceipt: MessageReceiptData,
  ) {
    setReceipts((currentReceipts) => {
      const existingIndex = currentReceipts.findIndex(
        (receipt) =>
          receipt.messageId === updatedReceipt.messageId &&
          receipt.userId === updatedReceipt.userId, 
      );

      if (existingIndex === -1) {
        return [
          ...currentReceipts,
          updatedReceipt,
        ];
      }

      return currentReceipts.map(
        (receipt, index) =>
          index === existingIndex
            ? updatedReceipt
            : receipt,
      );
    });
  }

  function handleMessageDeleted(
    deletedMessage: MessageData,
  ) {
    updateMessageInState(
      deletedMessage,
    );

    void refreshLatestMessagePreviews();
  }

  useEffect(() => {
    if (!isAuthenticated || !user || !token) {
      setMessages([]);
      setReceipts([]);
      setIsLoaded(false);
      setError(null);
      setUnreadCounts([]);
      setMessageSearchResults([]);
      setIsSearchingMessages(false);
      setMessageSearchError(null);
      setTypingUserIdsByChat({});
      setHasMoreMessagesByChat({});
      setNextBeforeMessageIdByChat({});
      setIsLoadingOlderMessagesByChat({});
      setOnlineByChat({});
      setLastSeenByChat({});
      setIsRealtimeConnected(false);

      loadingOlderChatIdsRef.current.clear();

      ++messageSearchRequestIdRef.current;
      
      webSocketConnectionRef.current = null;

      return;
    }

    const webSocketConnection = connectWebSocket({
      token,
      currentUserId: user.id,
      onMessageCreated: handleMessageCreated,
      onMessageUpdated: updateMessageInState,
      onMessageDeleted: handleMessageDeleted,
      onMessageStatusUpdated: updateReceiptInState,
      onTypingStarted: handleTypingStarted,
      onTypingStopped: handleTypingStopped,
      onUserPresenceUpdated: handleUserPresenceUpdated,
      onConnected: () => {
        setIsRealtimeConnected(true);
        void syncPendingDeliveryMessages();
        void refreshUnreadCounts();
      },
      onDisconnected: () => {
        setIsRealtimeConnected(false);
        setTypingUserIdsByChat({});
      },
    });

    webSocketConnectionRef.current = webSocketConnection;

    return () => {
      if (webSocketConnectionRef.current === webSocketConnection) {
        webSocketConnectionRef.current = null;
      }

      webSocketConnection.disconnect();
    };
  }, [isAuthenticated, user?.id, token]);

  return (
    <MessagesContext.Provider 
    value={{ 
      messages, 
      messageSearchResults,
      isSearchingMessages,
      messageSearchError,
      searchMessagesInChat,
      clearMessageSearch,
      receipts,
      unreadCounts,
      typingUserIdsByChat,
      onlineByChat,
      isRealtimeConnected,
      lastSeenByChat,
      sendMessage,
      retryMessage,
      editMessage,
      deleteMessage,
      deleteMessageForMe,
      clearChatHistoryLocally,
      forwardMessage,
      loadMessages,
      loadOlderMessages,
      hasMoreMessagesByChat,
      isLoadingOlderMessagesByChat,
      loadLatestMessagePreviews,
      markChatRead, 
      startTyping,
      stopTyping,
      isLoaded,
      isSending,
      error,
      }}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessagesContext);

  if (!context) {
    throw new Error("useMessages must be used inside MessagesProvider");
  }

  return context;
}
