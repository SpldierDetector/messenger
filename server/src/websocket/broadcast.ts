import { WebSocket, WebSocketServer } from 'ws';

import {
  getChatIdsByUserId,
  isUserInChat
} from '../db/chat-members.js';
import type { MessageData } from '../types/message.js';
import type {
  AuthenticatedWebSocket,
  WebSocketEvent,
} from '../types/websocket.js';

function broadcastToChatMembers(
  webSocketServer: WebSocketServer,
  message: MessageData,
  eventType: string,
) {
  const event: WebSocketEvent<MessageData> = {
    type: eventType,
    data: message,
  };

  const serializedEvent = JSON.stringify(event);

  webSocketServer.clients.forEach((client) => {
    const authenticatedClient =
      client as AuthenticatedWebSocket;

    if (
      authenticatedClient.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    const userIsChatMember = isUserInChat(
      message.chatId,
      authenticatedClient.userId,
    );

    if (!userIsChatMember) {
      return;
    }

    authenticatedClient.send(serializedEvent);
  });
}

export function broadcastMessageStatusUpdated(
  webSocketServer: WebSocketServer,
  senderId: number,
  messageId: number,
  userId: number,
  deliveredAt: number | null,
  readAt: number | null,
) {
  const event: WebSocketEvent<{
    messageId: number;
    userId: number;
    deliveredAt: number | null;
    readAt: number | null;
  }> = {
    type: 'message_status_updated',
    data: {
      messageId,
      userId,
      deliveredAt,
      readAt,
    },
  };

  const serializedEvent = JSON.stringify(event);

  webSocketServer.clients.forEach(
    (client) => {
      const authenticatedClient = client as AuthenticatedWebSocket;

      if (authenticatedClient.readyState !== WebSocket.OPEN) {
        return;
      }

      if (authenticatedClient.userId !== senderId) {
        return;
      }

      authenticatedClient.send(serializedEvent);
    },
  );
}

export function broadcastMessageCreated(
  webSocketServer: WebSocketServer,
  message: MessageData,
) {
  broadcastToChatMembers(
    webSocketServer,
    message,
    'message_created',
  );
}

export function broadcastMessageUpdated(
  webSocketServer: WebSocketServer,
  message: MessageData,
) {
  broadcastToChatMembers(
    webSocketServer,
    message,
    'message_updated',
  );
}

export function broadcastMessageDeleted(
  webSocketServer: WebSocketServer,
  message: MessageData,
) {
  broadcastToChatMembers(
    webSocketServer,
    message,
    'message_deleted',
  );
}

export function broadcastTypingEvent(
  webSocketServer: WebSocketServer,
  chatId: number,
  userId: number,
  eventType:
    | 'typing_started'
    | 'typing_stopped',
) {
  const event: WebSocketEvent<{
    chatId: number;
    userId: number;
  }> = {
    type: eventType,
    data: {
      chatId,
      userId,
    },
  };

  const serializedEvent = JSON.stringify(event);
  
  webSocketServer.clients.forEach(
    (client) => {
      const authenticatedClient = client as AuthenticatedWebSocket;

      if (
        authenticatedClient.readyState !==
        WebSocket.OPEN
      ) {
        return;
      }

      if (
        authenticatedClient.userId === userId
      ) {
        return;
      }

      const userIsChatMember =
        isUserInChat(
          chatId,
          authenticatedClient.userId,
        );

      if (!userIsChatMember) {
        return;
      }

      authenticatedClient.send(
        serializedEvent,
      );
    },
  );
}

export function broadcastUserPresence(
  webSocketServer: WebSocketServer,
  userId: number,
  isOnline: boolean,
  lastSeenAt: number | null,
) {
  const chatIds = getChatIdsByUserId(userId);

  for (const { chatId } of chatIds) {
    const event: WebSocketEvent<{
      chatId: number;
      userId: number;
      isOnline: boolean;
      lastSeenAt: number | null;
    }> = {
      type: 'user_presence_updated',
      data: {
        chatId,
        userId,
        isOnline,
        lastSeenAt,
      },
    };

    const serializedEvent = JSON.stringify(event);

    webSocketServer.clients.forEach(
      (client) => {
        const authenticatedClient =
          client as AuthenticatedWebSocket;

        if (
          authenticatedClient.readyState !==
          WebSocket.OPEN
        ) {
          return;
        }

        if (
          authenticatedClient.userId ===
          userId
        ) {
          return;
        }

        const userIsChatMember =
          isUserInChat(
            chatId,
            authenticatedClient.userId,
          );
        
        if (!userIsChatMember) {
          return;
        }
        authenticatedClient.send(
          serializedEvent,
        );
      },
    );
  }
}