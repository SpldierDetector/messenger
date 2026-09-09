import type { WebSocket } from 'ws';

export type WebSocketEvent<T = unknown> = {
  type: string;
  data: T;
};

export type AuthenticatedWebSocket = WebSocket & {
  userId: number;
};

export type MessageDeliveredEvent = {
  type: 'message_delivered';
  data: {
    messageId: number;
  };
};

export type ChatReadEvent = {
  type: 'chat_read';
  data: {
    chatId: number;
  };
};

export type TypingStartedEvent = {
  type: 'typing_started';
  data: {
    chatId: number;
  };
};

export type TypingStoppedEvent = {
  type: 'typing_stopped';
  data: {
    chatId: number;
  };
};