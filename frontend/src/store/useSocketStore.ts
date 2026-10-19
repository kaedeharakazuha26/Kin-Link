import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  connectSocket: (userId: string, token?: string) => void;
  disconnectSocket: () => void;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],

  connectSocket: (userId: string, token?: string) => {
    const existingSocket = get().socket;
    if (existingSocket?.connected) return;

    const socket = io(SOCKET_URL, {
      auth: { token: token || localStorage.getItem('accessToken') },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('register_user', userId);
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
