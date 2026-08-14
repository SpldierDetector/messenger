import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  createMessage,
  loadLatestMessages,
  loadMessageList,
} from "@/services/messages-service";
import { connectWebSocket } from "@/services/websocket-service";
import { useAuth } from '@/providers/auth-provider';

import type { MessageData } from "@/types/message";

type MessagesContextValue = {
  messages: MessageData[];
  sendMessage: (chatId: number, text: string) => Promise<boolean>;
  isLoaded: boolean;
  isSending: boolean;
  error: string | null;
  loadMessages: (chatId: number) => Promise<void>;
  loadLatestMessagePreviews: () => Promise<void>;
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
    });

    return disconnectWebSocket;
  }, [isAuthenticated, user?.id, token]);

  return (
    <MessagesContext.Provider 
    value={{ 
      messages, 
      sendMessage,
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
