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
  onTypingStarted: (data: TypingEventData) => void;
  onTypingStopped: (data: TypingEventData) => void;
  onConnected?: () => void;
};

type WebSocketEvent = {
  type: string;
  data: unknown;
};

export type TypingEventData = {
  chatId: number;
  userId: number;
}

export type WebSocketConnection = {
  disconnect: () => void;
  acknowledgeMessageDelivered: (
    messageId: number,
  ) => void;
  markChatRead: (
    chatId: number,
  ) => void;
  startTyping: (
    chatId: number,
  ) => void;
  stopTyping: (
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
  onTypingStarted,
  onTypingStopped,
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

  function sendTypingEvent(
    chatId: number,
    type:
      | 'typing_started'
      | 'typing_stopped',
  ) {
    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    socket.send(
      JSON.stringify({
        type,
        data: {
          chatId,
        },
      }),
    );
  }

  function startTyping(chatId: number) {
    sendTypingEvent(
      chatId,
      'typing_started',
    );
  }

  function stopTyping(chatId: number) {
    sendTypingEvent(
      chatId,
      'typing_stopped',
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

        if (message.type === 'typing_started') {
          const typingData = message.data as TypingEventData;

          onTypingStarted(typingData);
        }

        if (message.type === 'typing_stopped') {
          const typingData = message.data as TypingEventData;

          onTypingStopped(typingData);
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
    startTyping,
    stopTyping,
  };
}