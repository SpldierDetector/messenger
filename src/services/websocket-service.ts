import { API_BASE_URL } from '@/config/api';
import type {
  MessageData,
  MessageReceiptData,
} from '@/types/message';
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
  onMessageStatusUpdated: (receipt: MessageReceiptData) => void;
  onConnected?: () => void;
};

type WebSocketEvent = {
  type: string;
  data: unknown;
};

export type WebSocketConnection = {
  disconnect: () => void;
  acknowledgeMessageDelivered: (
    messageId: number,
  ) => void;
  markChatRead: (
    chatId: number,
  ) => void;
};

export function connectWebSocket({
  token,
  currentUserId,
  onMessageCreated,
  onMessageUpdated,
  onMessageDeleted,
  onMessageStatusUpdated,
  onConnected,
}: ConnectWebSocketOptions): WebSocketConnection {
  let socket: WebSocket | null = null;
  let reconnectTimer: 
    | ReturnType<typeof setTimeout> 
    | null = null;
  let shouldReconnect = true;
  const pendingDeliveryMessageIds = new Set<number>();

  function sendMessageDelivered(messageId: number) {
    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN
    ) {
      return false;
    }

    socket.send(
      JSON.stringify({
        type: 'message_delivered',
        data: {
          messageId,
        },
      }),
    );

    return true;
  }
  
  function acknowledgeMessageDelivered(
    messageId: number,
  ) {
    const wasSent = sendMessageDelivered(messageId);

    if (wasSent) {
      pendingDeliveryMessageIds.delete(messageId);

      return;
    }

    pendingDeliveryMessageIds.add(messageId);
  }

  function markChatRead(chatId: number) {
    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    socket.send(
      JSON.stringify({
        type: 'chat_read',
        data: {chatId},
      }),
    );
  }

  function connect() {
    const socketUrl = 
    `${WEB_SOCKET_URL}?token=${encodeURIComponent(token)}`;

    socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      console.log('WebSocket connected');

      for (const messageId of pendingDeliveryMessageIds) {
        const wasSent = sendMessageDelivered(messageId);

        if (wasSent) {
          pendingDeliveryMessageIds.delete(messageId);
        }
      }

      onConnected?.();
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

        if (message.type === 'message_status_updated') {
          const receipt = message.data as MessageReceiptData;

          onMessageStatusUpdated(receipt);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    socket.onerror = () => {
      console.log(
        'WebSocket connection error. Waiting for reconnect...',
      );
    };

    socket.onclose = () => {
      if (!shouldReconnect) {
      console.log('WebSocket disconnect');
      
        return;
      }

      console.log(
        `WebSocket disconnected. Reconnecting in ${RECONNECT_DELAY / 1000}s...`
      )

      reconnectTimer = setTimeout(() => {
        connect();
      }, RECONNECT_DELAY);
    };
  }

  connect();

  function disconnect() {
    shouldReconnect = false;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    socket?.close();
  }

  return {
    disconnect,
    acknowledgeMessageDelivered,
    markChatRead,
  };
}