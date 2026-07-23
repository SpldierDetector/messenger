import {
  createContext,
  type ReactNode,
  useContext,
  useState,
} from "react";

import {
  createMessage,
  loadMessageList,
} from "@/services/messages-service";

import type { MessageData } from "@/types/message";

type MessagesContextValue = {
  messages: MessageData[];
  sendMessage: (chatId: number, text: string) => Promise<boolean>;
  isLoaded: boolean;
  isSending: boolean;
  error: string | null;
  loadMessages: (chatId: number) => Promise<void>;
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

    setMessages(loadedMessages);
    setIsLoaded(true);
  }

  async function sendMessage(chatId: number, text: string): Promise<boolean> {
    try {
      setIsSending(true);
      setError(null);

      const message = await createMessage(chatId, text);

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
      loadMessages, 
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
