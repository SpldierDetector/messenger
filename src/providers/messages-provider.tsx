import { createContext, type ReactNode, useContext, useEffect, useState, } from 'react';

import { messages as initialMessages } from '@/data/message';
import { loadMessages, saveMessages } from '@/services/message-storage';
import type { MessageData } from '@/types/message';

type MessagesContextValue = {
	messages: MessageData[];
	sendMessage: (message: MessageData) => void
};

export const MessagesContext = createContext<
	MessagesContextValue | undefined
>(undefined);

type MessagesProviderProps = {
  children: ReactNode;
};

export function MessagesProvider({
	children,
}: MessagesProviderProps) {
	const [messages, setMessages] = useState(initialMessages);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
		async function restoreMessages() {
			const storedMessages = await loadMessages();

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

    saveMessages(messages);
  }, [messages, isLoaded]);

	function sendMessage(message: MessageData) {
		setMessages((currentMessages) => [
			...currentMessages,
			message,
		]);
	}

	return (
  	<MessagesContext.Provider value={{ messages, sendMessage }}>
			{children}
			</MessagesContext.Provider>
	);
}

export function useMessages() {
	const context = useContext(MessagesContext);

	if (!context) {
		throw new Error (
			'useMessages must be used inside MessagesProvider'
		);
	}

	return context;
}