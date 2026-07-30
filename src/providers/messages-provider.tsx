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
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMessages(chatId: number) {
    const loadedMessages = await loadMessageList(chatId);

    setMessages((currentMessages) => [
      ...currentMessages.filter(
        (message: MessageData) => message.chatId !== chatId
      ),
      ...loadedMessages,
    ]);

    setIsLoaded(true);
  }

  async function loadLatestMessagePreviews() {
    const latestMessages = await loadLatestMessages();

    setMessages(latestMessages);
    setIsLoaded(true);
  }

  async function sendMessage(chatId: number, text: string): Promise<boolean> {
    try {
      setIsSending(true);
      setError(null);

      const message = await createMessage(chatId, text);

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
    const socket = connectWebSocket({
      onMessageCreated: addMessageIfMissing,
    });

    return () => {
      socket.close();
    };
  }, []);

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
