import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import postRoutes from './routes/post.routes';
import storyRoutes from './routes/story.routes';
import userRoutes from './routes/user.routes';
import messageRoutes from './routes/message.routes';
import { isOriginAllowed } from './utils/cors';
import { db } from './config/firebase';

dotenv.config();

const app: Application = express();

// Trust reverse proxy (Render, Vercel, Heroku) for accurate IP detection
app.set('trust proxy', 1);

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Root & Health Check
app.get('/', (req: Request, res: Response) => {
  res.json({ success: true, message: '🚀 LINK Backend API is live!', version: '2.0', health: '/health' });
});

app.get('/health', async (req: Request, res: Response) => {
  let dbStatus = 'connected';
  let dbError: string | undefined;

  try {
    // Quick Firestore probe to verify database connectivity
    await db.collection('_health').limit(1).get();
  } catch (err: any) {
    dbStatus = 'disconnected';
    dbError = err.message || String(err);
  }

  res.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    database: dbStatus,
    ...(dbError ? { databaseError: dbError } : {}),
    timestamp: new Date().toISOString(),
    app: 'LINK API',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

export default app;
