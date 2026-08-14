import type { WebSocket } from 'ws';

export type WebSocketEvent<T = unknown> = {
  type: string;
  data: T;
};

export type AuthenticatedWebSocket = WebSocket & {
  userId: number;
};