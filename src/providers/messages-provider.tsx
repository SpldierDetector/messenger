import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  createMessage,
  deleteMessage as deleteMessageService,
  editMessage as editMessageService,
  loadLatestMessages,
  loadMessageList,
} from "@/services/messages-service";
import { connectWebSocket } from "@/services/websocket-service";
import { useAuth } from '@/providers/auth-provider';

import type { MessageData } from "@/types/message";

type MessagesContextValue = {
  messages: MessageData[];
  deleteMessage: (messageId: number) => Promise<boolean>;
  sendMessage: (chatId: number, text: string) => Promise<boolean>;
  isLoaded: boolean;
  isSending: boolean;
  error: string | null;
  loadMessages: (chatId: number) => Promise<void>;
  loadLatestMessagePreviews: () => Promise<void>;
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMessages(chatId: number) {
    if (!token || !user) {
      return;
    }

    const loadedMessages = await loadMessageList(chatId, token, user.id,);

    setMessages((currentMessages) => [
      ...currentMessages.filter(
        (message: MessageData) => message.chatId !== chatId,
      ),
      ...loadedMessages,
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

  async function sendMessage(chatId: number, text: string): Promise<boolean> {
    if (!token || !user) {
      return false;
    }
    
    try {
      setIsSending(true);
      setError(null);

      const message = await createMessage(chatId, text, token, user.id,);

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
      setIsLoaded(false);
      setError(null);
      
      return;
    }

    const disconnectWebSocket = connectWebSocket({
      token,
      currentUserId: user.id,
      onMessageCreated: addMessageIfMissing,
      onMessageUpdated: updateMessageInState,
      onMessageDeleted: handleMessageDeleted,
    });

    return disconnectWebSocket;
  }, [isAuthenticated, user?.id, token]);

  return (
    <MessagesContext.Provider 
    value={{ 
      messages, 
      sendMessage,
      editMessage,
      deleteMessage,
      loadMessages,
      loadLatestMessagePreviews, 
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
