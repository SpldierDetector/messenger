import { API_BASE_URL } from '@/config/api';

import type { MessageData } from '@/types/message';

const WEB_SOCKET_URL = API_BASE_URL.replace('http://', 'ws://');

type ConnectWebSocketOptions = {
  onMessageCreated: (message: MessageData) => void;
};

type WebSocketEvent = {
  type: string;
  data: unknown;
};

export function connectWebSocket({onMessageCreated,}: ConnectWebSocketOptions) {
  const socket = new WebSocket(WEB_SOCKET_URL);

  socket.onopen = () => {
    console.log('WebSocket connected');
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data) as WebSocketEvent;

      if (message.type === "message_created")
        onMessageCreated(message.data as MessageData);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  socket.onclose = () => {
    console.log('WebSocket disconnect');
  };

  return socket;
}