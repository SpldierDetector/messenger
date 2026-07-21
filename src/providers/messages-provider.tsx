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
  sendMessage: (chatId: number, text: string) => void;
  isLoaded: boolean;
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

  function sendMessage(chatId: number, text: string) {
    const message = createLocalMessage(chatId, text);

    setMessages((currentMessages) => [...currentMessages, message]);
  }

  return (
    <MessagesContext.Provider value={{ messages, sendMessage, isLoaded }}>
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
