import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  connectSocket: (userId: string, token?: string) => void;
  disconnectSocket: () => void;
}

let rawSocketUrl = (import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000').trim().replace(/\/+$/, '');
if (rawSocketUrl.endsWith('/api')) {
  rawSocketUrl = rawSocketUrl.slice(0, -4);
}
const SOCKET_URL = rawSocketUrl;

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],

  connectSocket: (userId: string, token?: string) => {
    const existingSocket = get().socket;
    if (existingSocket?.connected) return;

    const socket = io(SOCKET_URL, {
      // Callback form re-reads the token on every reconnect, so a refreshed access token is used
      auth: (cb) => cb({ token: token || localStorage.getItem('accessToken') }),
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id, 'user:', userId);
    });

    socket.on('online_users', (users: string[]) => {
      set({ onlineUsers: users });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
    }
  },
}));
