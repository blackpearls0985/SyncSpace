import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_API_URL;

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(URL, {
      withCredentials: true,
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}
