import { Request, Response, NextFunction } from 'express';

// shortcut: in-memory IP map resets on server restart, upgrade to redis or express-rate-limit if scaling across clusters
const attempts = new Map<string, { count: number; resetAt: number }>();

export const rateLimiter = (maxAttempts = 10, windowMs = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = attempts.get(ip);

    if (record && now < record.resetAt) {
      if (record.count >= maxAttempts) {
        res.status(429).json({
          success: false,
          message: 'Too many attempts. Please try again after 15 minutes.',
        });
        return;
      }
      record.count++;
    } else {
      attempts.set(ip, { count: 1, resetAt: now + windowMs });
    }

    next();
  };
};
