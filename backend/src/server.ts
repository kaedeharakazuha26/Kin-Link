import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { setupSocketIO } from './socket';
import { isOriginAllowed } from './utils/cors';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
});

setupSocketIO(io);
app.set('io', io);

server.listen(PORT, () => {
  console.log(`🚀 LINK Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready on port ${PORT}`);
});

export { server, io };
