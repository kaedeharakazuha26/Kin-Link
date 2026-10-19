import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { setupSocketIO } from './socket';

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
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
