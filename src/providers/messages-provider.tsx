import { createContext, type ReactNode, useContext, useState, } from 'react';

import { messages as initialMessages } from '@/data/message';
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