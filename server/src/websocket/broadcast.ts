import { WebSocket, WebSocketServer } from 'ws';

import { isUserInChat } from '../db/chat-members.js';
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