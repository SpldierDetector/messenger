import { API_BASE_URL } from '@/config/api';
import type { MessageData } from '@/types/message';
import type { MessageApiData } from '@/types/message-api';
import { mapMessageApiData } from '@/utils/map-message'

const WEB_SOCKET_URL = API_BASE_URL.replace('http://', 'ws://');
const RECONNECT_DELAY = 3000;

type ConnectWebSocketOptions = {
  token: string;
  currentUserId: number;
  onMessageCreated: (message: MessageData) => void;
};

type WebSocketEvent = {
  type: string;
  data: unknown;
};

export function connectWebSocket({
  token,
  currentUserId,
  onMessageCreated,
}: ConnectWebSocketOptions) {
  let socket: WebSocket | null = null;
  let reconnectTimer: 
    | ReturnType<typeof setTimeout> 
    | null = null;
  let shouldReconnect = true;

  function connect() {
    const socketUrl = 
    `${WEB_SOCKET_URL}?token=${encodeURIComponent(token)}`;

    socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketEvent;

        if (message.type === "message_created") {
          const apiMessage = message.data as MessageApiData;
          const mappedMessage = mapMessageApiData(apiMessage, currentUserId,);

          onMessageCreated(mappedMessage);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnect');

      if (!shouldReconnect) {
        return;
      }

      reconnectTimer = setTimeout(() => {
        console.log("Reconnecting WebSocket...");
        connect();
      }, RECONNECT_DELAY);
    };
  }

  connect();

    return function disconnectWebSocket() {
      shouldReconnect = false;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }

      socket?.close();
    };
}