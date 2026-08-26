import { io } from 'socket.io-client';

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin), {
      autoConnect: false,
      auth: {
        token: localStorage.getItem('token')
      }
    });
  }

  socket.auth = { token: localStorage.getItem('token') };
  return socket;
}

export function connectSocket() {
  const activeSocket = getSocket();
  if (!activeSocket.connected) {
    activeSocket.connect();
  }
  return activeSocket;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}
