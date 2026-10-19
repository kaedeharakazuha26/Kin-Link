import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';

// Map of userId -> Set of socket IDs
const onlineUsers = new Map<string, Set<string>>();

export const setupSocketIO = (io: SocketIOServer) => {
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (token) {
      const payload = verifyAccessToken(token);
      if (payload) {
        (socket as any).userId = payload.userId;
        (socket as any).username = payload.username;
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;

    if (userId) {
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId)!.add(socket.id);

      // Notify everyone about online users
      io.emit('online_users', Array.from(onlineUsers.keys()));
      console.log(`User connected: ${userId} (socket ${socket.id})`);
    }

    // Explicit registration event
    socket.on('register_user', (regUserId: string) => {
      (socket as any).userId = regUserId;
      if (!onlineUsers.has(regUserId)) {
        onlineUsers.set(regUserId, new Set());
      }
      onlineUsers.get(regUserId)!.add(socket.id);
      io.emit('online_users', Array.from(onlineUsers.keys()));
    });

    // Join conversation room
    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conv_${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conv_${conversationId}`);
    });

    // Real-time new message sent
    socket.on('send_message', (data: { conversationId: string; message: any; receiverId?: string }) => {
      const { conversationId, message, receiverId } = data;
      // Broadcast to room
      io.to(`conv_${conversationId}`).emit('new_message', message);

      // If receiver is online but outside room, send notification event
      if (receiverId && onlineUsers.has(receiverId)) {
        const receiverSockets = onlineUsers.get(receiverId);
        receiverSockets?.forEach((sockId) => {
          io.to(sockId).emit('message_notification', message);
        });
      }
    });

    // Typing indicators
    socket.on('typing', ({ conversationId, userId, username }: { conversationId: string; userId: string; username: string }) => {
      socket.to(`conv_${conversationId}`).emit('user_typing', { conversationId, userId, username });
    });

    socket.on('stop_typing', ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      socket.to(`conv_${conversationId}`).emit('user_stop_typing', { conversationId, userId });
    });

    socket.on('disconnect', () => {
      const uId = (socket as any).userId;
      if (uId && onlineUsers.has(uId)) {
        const userSockets = onlineUsers.get(uId)!;
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(uId);
        }
        io.emit('online_users', Array.from(onlineUsers.keys()));
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
