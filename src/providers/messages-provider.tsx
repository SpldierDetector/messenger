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
} from "@/services/messages-service";
import {
  connectWebSocket,
  type WebSocketConnection,
} from "@/services/websocket-service";

import type {
  MessageData,
  MessageReceiptData,
} from "@/types/message";

type MessagesContextValue = {
  messages: MessageData[];
  receipts: MessageReceiptData[];
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const markChatRead = useCallback(
    (chatId: number) => {
      webSocketConnectionRef.current?.markChatRead(chatId);
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
      
      webSocketConnectionRef.current = null;

      return;
    }

    const webSocketConnection = connectWebSocket({
      token,
      currentUserId: user.id,
      onMessageCreated: addMessageIfMissing,
      onMessageUpdated: updateMessageInState,
      onMessageDeleted: handleMessageDeleted,
      onMessageStatusUpdated: updateReceiptInState,
      onConnected: () => {void syncPendingDeliveryMessages()},
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
      sendMessage,
      editMessage,
      deleteMessage,
      forwardMessage,
      loadMessages,
      loadLatestMessagePreviews,
      markChatRead, 
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
