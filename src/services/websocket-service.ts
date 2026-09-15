import { API_BASE_URL } from '@/config/api';
import type {
  MessageData,
  MessageReceiptData,
} from '@/types/message';
import type { MessageApiData } from '@/types/message-api';
import { mapMessageApiData } from '@/utils/map-message';

const WEB_SOCKET_URL = API_BASE_URL
  .replace(/^https:\/\//, 'wss://')
  .replace(/^http:\/\//, 'ws://');
const RECONNECT_INITIAL_DELAY = 1000;
const RECONNECT_MAX_DELAY = 30000;

type ConnectWebSocketOptions = {
  token: string;
  currentUserId: number;
  onMessageCreated: (message: MessageData) => void;
  onMessageUpdated: (message: MessageData) => void;
  onMessageDeleted: (message: MessageData) => void;
  onMessageStatusUpdated: (receipt: MessageReceiptData) => void;
  onTypingStarted: (data: TypingEventData) => void;
  onTypingStopped: (data: TypingEventData) => void;
  onUserPresenceUpdated: (data: UserPresenceEventData) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
};

type WebSocketEvent = {
  type: string;
  data: unknown;
};

export type TypingEventData = {
  chatId: number;
  userId: number;
}

export type UserPresenceEventData = {
  chatId: number;
  userId: number;
  isOnline: boolean;
  lastSeenAt: number | null;
};

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
  onUserPresenceUpdated,
  onConnected,
  onDisconnected,
}: ConnectWebSocketOptions): WebSocketConnection {
  let socket: WebSocket | null = null;
  let reconnectTimer: 
    | ReturnType<typeof setTimeout> 
    | null = null;
  let shouldReconnect = true;
  let reconnectAttempt = 0;
  const pendingDeliveryMessageIds = new Set<number>();
  const pendingReadChatIds = new Set<number>();

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

  function sendChatRead(
    chatId: number,
  ) {
    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN
    ) {
      return false;
    }

    socket.send(
      JSON.stringify({
        type: 'chat_read',
        data: {
          chatId,
        },
      }),
    );

    return true;
  }

  function markChatRead(
    chatId: number,
  ) {
    const wasSent = sendChatRead(chatId);

    if (wasSent) {
      pendingReadChatIds.delete(chatId);
      return;
    }

    pendingReadChatIds.add(chatId);
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

  function getReconnectDelay() {
    const delay = Math.min(
      RECONNECT_INITIAL_DELAY *
        2 ** reconnectAttempt,
      RECONNECT_MAX_DELAY,
    );

    const jitter = 0.8 + Math.random() * 0.4;

    return Math.round(
      delay * jitter,
    );
  }

  function connect() {
    if (!shouldReconnect) {
      return;
    }

    if (
      socket &&
      (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      )
    ) {
      return;
    }
    
    const socketUrl = 
    `${WEB_SOCKET_URL}?token=${encodeURIComponent(token)}`;

    const currentSocket = new WebSocket(socketUrl);
    
    socket = currentSocket;

    currentSocket.onopen = () => {
      if (socket !== currentSocket) {
        currentSocket.close();
        return;
      }

      reconnectAttempt = 0;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      console.log('WebSocket connected');

      for (const messageId of pendingDeliveryMessageIds) {
        const wasSent = sendMessageDelivered(messageId);

        if (wasSent) {
          pendingDeliveryMessageIds.delete(messageId);
        }
      }

      for (
        const chatId
        of pendingReadChatIds
      ) {
        const wasSent = sendChatRead(chatId);

        if (wasSent) {
          pendingReadChatIds.delete(chatId);
        }
      }

      onConnected?.();
    };

    currentSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketEvent;

        if (message.type === 'heartbeat_ping') {
          if (
            currentSocket.readyState ===
            WebSocket.OPEN
          ) {
            currentSocket.send(
              JSON.stringify({
                type: 'heartbeat_pong',
                data: {},
              }),
            );
          }

          return;
        }

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

        if (
          message.type === 
          'user_presence_updated'
        ) {
          const presenceData = message.data as UserPresenceEventData;

          onUserPresenceUpdated(presenceData);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    currentSocket.onerror = () => {
      console.log(
        'WebSocket connection error. Waiting for reconnect...',
      );
    };

    currentSocket.onclose = () => {
      if (socket === currentSocket) {
        socket = null;
      }

      if (!shouldReconnect) {
        console.log('WebSocket disconnected');

        return;
      }

      onDisconnected?.();

      if (reconnectTimer) {
        return;
      }

      const reconnectDelay= getReconnectDelay();

      reconnectAttempt += 1;

      console.log(
        `WebSocket disconnected. Reconnecting in ${(reconnectDelay / 1000).toFixed(1)}s...`,
      )

      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, reconnectDelay,
      );
    };
  }

  connect();

  function disconnect() {
    shouldReconnect = false;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    const currentSocket = socket;

    socket = null;

    currentSocket?.close();
  }

  return {
    disconnect,
    acknowledgeMessageDelivered,
    markChatRead,
    startTyping,
    stopTyping,
  };
}