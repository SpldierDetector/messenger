import { WebSocket, WebSocketServer } from 'ws';
import type { WebSocketEvent } from '../types/websocket.js';

export function broadcastWebSocketEvent(
  webSocketServer: WebSocketServer,
  event: WebSocketEvent,
) {
  const message = JSON.stringify(event);

  webSocketServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  })
}