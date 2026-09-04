import { API_BASE_URL } from '@/config/api';
import type { MessageData } from '@/types/message';
import type { MessageApiData } from '@/types/message-api';
import { mapMessageApiData } from '@/utils/map-message';

const WEB_SOCKET_URL = API_BASE_URL.replace('http://', 'ws://');
const RECONNECT_DELAY = 3000;

type ConnectWebSocketOptions = {
  token: string;
  currentUserId: number;
  onMessageCreated: (message: MessageData) => void;
  onMessageUpdated: (message: MessageData) => void;
  onMessageDeleted: (message: MessageData) => void;
};

type WebSocketEvent = {
  type: string;
  data: unknown;
};

export function connectWebSocket({
  token,
  currentUserId,
  onMessageCreated,
  onMessageUpdated,
  onMessageDeleted,
}: ConnectWebSocketOptions) {
  let socket: WebSocket | null = null;
  let reconnectTimer: 
    | ReturnType<typeof setTimeout> 
    | null = null;
  let shouldReconnect = true;

  function acknowledgeMessageDelivered(
    messageId: number,
  ) {
    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    socket.send(
      JSON.stringify({
        type: 'message_delivered',
        data: {
          messageId,
        },
      }),
    );
  }

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

          if (!mappedMessage.isOwn) {
            acknowledgeMessageDelivered(
              mappedMessage.id,
            );
          }
        }

        if (message.type === 'message_updated') {
          const apiMessage =
            message.data as MessageApiData;

          const mappedMessage = mapMessageApiData(
            apiMessage,
            currentUserId,
          );

          onMessageUpdated(mappedMessage);
        }

        if (message.type === 'message_deleted') {
          const apiMessage = message.data as MessageApiData;

          const mappedMessage =
            mapMessageApiData(
              apiMessage,
              currentUserId,
            );

          onMessageDeleted(mappedMessage);
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