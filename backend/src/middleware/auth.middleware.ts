import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { db } from '../config/firebase';
import { SafeUser, User } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
}

export const protectRoute = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
      return;
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      res.status(401).json({ success: false, message: 'Invalid or expired token.' });
      return;
    }

    const userDoc = await db.collection('users').doc(payload.userId).get();
    if (!userDoc.exists) {
      res.status(401).json({ success: false, message: 'User not found.' });
      return;
    }

    const userData = userDoc.data() as User;
    const { passwordHash, refreshTokens, ...safeUser } = userData;

    req.user = safeUser;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ success: false, message: 'Internal server error in auth verification.' });
  }
};
