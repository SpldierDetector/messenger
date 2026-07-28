import { API_BASE_URL } from '@/config/api';

const WEB_SOCKET_URL = API_BASE_URL.replace('http://', 'ws://');

export function connectWebSocket() {
  const socket = new WebSocket(WEB_SOCKET_URL);

  socket.onopen = () => {
    console.log('WebSocket connected');
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);

      console.log('WebSocket event type:', message.type);
      console.log('WebSocket event data:', message.data);
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