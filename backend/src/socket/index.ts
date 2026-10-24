import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { db } from '../config/firebase';

// Map of userId -> Set of socket IDs
const onlineUsers = new Map<string, Set<string>>();

export const setupSocketIO = (io: SocketIOServer) => {
  // Reject unauthenticated sockets; identity comes only from the verified token
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    const payload = token ? verifyAccessToken(token) : null;
    if (!payload) return next(new Error('Unauthorized'));
    socket.data.userId = payload.userId;
    socket.data.username = payload.username;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const userId: string = socket.data.userId;
    const username: string = socket.data.username;

    // Personal room for targeted notifications
    socket.join(`user_${userId}`);

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);
    io.emit('online_users', Array.from(onlineUsers.keys()));
    console.log(`User connected: ${userId} (socket ${socket.id})`);

    // Join conversation room, only if this user is a participant
    socket.on('join_conversation', async (conversationId: string) => {
      try {
        if (typeof conversationId !== 'string' || !conversationId) return;
        const convDoc = await db.collection('conversations').doc(conversationId).get();
        const participants: string[] = convDoc.data()?.participants || [];
        if (participants.includes(userId)) {
          socket.join(`conv_${conversationId}`);
        }
      } catch (err) {
        console.warn('join_conversation error:', err);
      }
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conv_${conversationId}`);
    });

    // Typing indicators: only within joined rooms, identity from the token
    socket.on('typing', ({ conversationId }: { conversationId: string }) => {
      const room = `conv_${conversationId}`;
      if (!socket.rooms.has(room)) return;
      socket.to(room).emit('user_typing', { conversationId, userId, username });
    });

    socket.on('stop_typing', ({ conversationId }: { conversationId: string }) => {
      const room = `conv_${conversationId}`;
      if (!socket.rooms.has(room)) return;
      socket.to(room).emit('user_stop_typing', { conversationId, userId });
    });

    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
        }
        io.emit('online_users', Array.from(onlineUsers.keys()));
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
