import { io } from 'socket.io-client';

let socket;
const localHosts = new Set(['localhost', '127.0.0.1']);

function resolveSocketURL() {
  const configuredSocketURL = import.meta.env.VITE_SOCKET_URL;

  if (configuredSocketURL) {
    const parsed = new URL(configuredSocketURL, window.location.origin);
    if (!import.meta.env.DEV && localHosts.has(parsed.hostname) && !localHosts.has(window.location.hostname)) {
      return window.location.origin;
    }
    return configuredSocketURL;
  }

  return import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin;
}

export function getSocket() {
  if (!socket) {
    socket = io(resolveSocketURL(), {
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
