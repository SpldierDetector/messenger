import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { messages as initialMessages } from "@/data/message";
import {
  createLocalMessage,
  loadMessageList,
  saveMessageList
} from "@/services/messages-service";

import type { MessageData } from "@/types/message";

type MessagesContextValue = {
  messages: MessageData[];
  sendMessage: (chatId: number, text: string) => Promise<boolean>;
  isLoaded: boolean;
  isSending: boolean;
  error: string | null;
};

export const MessagesContext = createContext<MessagesContextValue | undefined>(
  undefined,
);

type MessagesProviderProps = {
  children: ReactNode;
};

export function MessagesProvider({ children }: MessagesProviderProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function restoreMessages() {
      const storedMessages = await loadMessageList();

      if (storedMessages) {
        setMessages(storedMessages);
      }

      setIsLoaded(true);
    }

    restoreMessages();
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    saveMessageList(messages);
  }, [messages, isLoaded]);

  async function sendMessage(chatId: number, text: string): Promise<boolean> {
    try {
      setIsSending(true);
      setError(null);

      const message = createLocalMessage(chatId, text);

      setMessages((currentMessages) =>[
        ...currentMessages,
        message,
      ]);

      return true;
    } catch (caughtError) {
      console.error('Failed to send message:', caughtError);

      setError('Не удалось отправить сообщение');

      return false;
    } finally {
      setIsSending(false);
    }
  }

  return (
    <MessagesContext.Provider 
    value={{ 
      messages, 
      sendMessage, 
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
