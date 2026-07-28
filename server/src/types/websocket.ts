export type WebSocketEvent<T = unknown> = {
  type: string;
  data: T;
};