import { io } from 'socket.io-client';
import { getAuthToken } from './apiClient.js';

let socketInstance = null;
let registeredUserId = null;

export function getSocket(userId = null) {
  if (userId) {
    registeredUserId = userId;
  }

  if (!socketInstance) {
    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // Prefer explicit env, or direct backend localhost:5000 in dev, or window.location.origin
    const socketUrl =
      (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_API_URL)) ||
      (isLocalhost ? 'http://localhost:5000' : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'));

    const normalizedUrl = socketUrl.replace(/\/api\/?$/, '');

    socketInstance = io(normalizedUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      auth: {
        token: getAuthToken()
      },
      query: registeredUserId ? { userId: registeredUserId } : {}
    });

    socketInstance.on('connect', () => {
      if (registeredUserId) {
        socketInstance.emit('register_user', registeredUserId);
      }
    });

    socketInstance.on('reconnect', () => {
      if (registeredUserId) {
        socketInstance.emit('register_user', registeredUserId);
      }
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('[Socket.io] Connection warning:', err?.message);
    });
  } else if (registeredUserId && socketInstance.connected) {
    socketInstance.emit('register_user', registeredUserId);
  }

  return socketInstance;
}

export function registerSocketUser(userId) {
  if (!userId) return;
  registeredUserId = userId;
  const socket = getSocket(userId);
  if (socket && socket.connected) {
    socket.emit('register_user', userId);
  }
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    registeredUserId = null;
  }
}
