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
  deleteMessage as deleteMessageService,
  editMessage as editMessageService,
  forwardMessage as forwardMessageService,
  loadLatestMessages,
  loadMessageList,
  loadMessageReceipts,
  loadPendingDeliveryMessages,
  loadUnreadMessageCounts,
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
  lastSeenByChat: Record<number, number | null>;
  deleteMessage: (messageId: number) => Promise<boolean>;
  forwardMessage: (messageId: number, targetChatId: number) => Promise<boolean>;
  sendMessage: (chatId: number, text: string, replyToMessageId?: number | null) => Promise<boolean>;
  isLoaded: boolean;
  isSending: boolean;
  error: string | null;
  loadMessages: (chatId: number) => Promise<void>;
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
  const [lastSeenByChat, setLastSeenByChat] = useState<Record<number, number | null>>({});
  const webSocketConnectionRef = useRef<WebSocketConnection | null>(null);

  async function loadMessages(chatId: number) {
    if (!token || !user) {
      return;
    }

    const [loadedMessages, loadedReceipts] = await Promise.all([
      loadMessageList(chatId, token, user.id),
      loadMessageReceipts(chatId, token),
    ]);

    setMessages((currentMessages) => [
      ...currentMessages.filter(
        (message: MessageData) => message.chatId !== chatId,
      ),
      ...loadedMessages,
    ]);

    const loadedMessageIds = new Set(
      loadedMessages.map((message) => message.id),
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

    setIsLoaded(true);
  }

  async function loadLatestMessagePreviews() {
    if (!token || !user) {
      return;
    }

    const latestMessages = await loadLatestMessages(token, user.id,);

    setMessages(latestMessages);
    setIsLoaded(true);
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

  async function sendMessage(chatId: number, text: string, replyToMessageId: number | null = null): Promise<boolean> {
    if (!token || !user) {
      return false;
    }
    
    try {
      setIsSending(true);
      setError(null);

      const message = await createMessage(chatId, text, token, user.id, replyToMessageId);

      addMessageIfMissing(message);

      return true;
    } catch (caughtError) {
      console.error('Failed to send message:', caughtError);

      setError('Не удалось отправить сообщение');

      return false;
    } finally {
      setIsSending(false);
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

  function handleMessageCreated(
    newMessage: MessageData,
  ) {
    addMessageIfMissing(newMessage);

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
      setTypingUserIdsByChat({});
      setOnlineByChat({});
      setLastSeenByChat({});
      
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
        void syncPendingDeliveryMessages();
        void refreshUnreadCounts();
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
      receipts,
      unreadCounts,
      typingUserIdsByChat,
      onlineByChat,
      lastSeenByChat,
      sendMessage,
      editMessage,
      deleteMessage,
      forwardMessage,
      loadMessages,
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
