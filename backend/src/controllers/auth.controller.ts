import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../config/firebase';
import { User, SafeUser } from '../types';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const isProduction = process.env.NODE_ENV === 'production';
const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const getAuthErrorMessage = (error: any, fallback: string): string => {
  if (
    error?.code === 7 ||
    error?.message?.includes('permission') ||
    error?.message?.includes('credential') ||
    error?.message?.includes('UNAUTHENTICATED')
  ) {
    return 'Database permission error. Please verify Firebase credentials on Render.';
  }
  return fallback;
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, username } = req.body;

    if (!email || !password || !fullName || !username) {
      res.status(400).json({ success: false, message: 'All fields are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');

    // Check if email already registered
    const emailQuery = await db.collection('users').where('email', '==', cleanEmail).limit(1).get();
    if (!emailQuery.empty) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    // Check if username is taken
    const usernameQuery = await db.collection('users').where('username', '==', cleanUsername).limit(1).get();
    if (!usernameQuery.empty) {
      res.status(409).json({ success: false, message: 'This username is already taken.' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userId = db.collection('users').doc().id;
    const now = new Date().toISOString();

    const tokenPayload = {
      userId,
      email: cleanEmail,
      username: cleanUsername,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const newUser: User = {
      id: userId,
      email: cleanEmail,
      passwordHash,
      fullName: fullName.trim(),
      username: cleanUsername,
      profilePicture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
      coverPhoto: 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?auto=format&fit=crop&w=1200&q=80',
      bio: 'Hello! I just joined LINK.',
      location: '',
      friends: [],
      friendRequestsReceived: [],
      friendRequestsSent: [],
      refreshTokens: [refreshToken],
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('users').doc(userId).set(newUser);

    const { passwordHash: _, refreshTokens: __, ...safeUser } = newUser;

    // Cookie configuration
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      user: safeUser,
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: getAuthErrorMessage(error, 'Registration failed. Please try again.') });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      res.status(400).json({ success: false, message: 'Please provide email/username and password.' });
      return;
    }

    const input = emailOrUsername.toLowerCase().trim();

    // Search by email or username
    let userQuery = await db.collection('users').where('email', '==', input).limit(1).get();
    if (userQuery.empty) {
      userQuery = await db.collection('users').where('username', '==', input).limit(1).get();
    }

    if (userQuery.empty) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data() as User;

    const isMatch = await bcrypt.compare(password, userData.passwordHash || '');
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    const tokenPayload = {
      userId: userData.id,
      email: userData.email,
      username: userData.username,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    const existingTokens = userData.refreshTokens || [];
    // Keep max 5 active refresh tokens per user
    const updatedTokens = [...existingTokens.slice(-4), refreshToken];

    await userDoc.ref.update({
      refreshTokens: updatedTokens,
      updatedAt: new Date().toISOString(),
    });

    const { passwordHash: _, refreshTokens: __, ...safeUser } = userData;

    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    res.json({
      success: true,
      message: 'Logged in successfully.',
      user: safeUser,
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: getAuthErrorMessage(error, 'Login failed. Please try again.') });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.body.refreshToken || req.cookies.refreshToken;

    if (!token) {
      res.status(401).json({ success: false, message: 'Refresh token required.' });
      return;
    }

    const payload = verifyRefreshToken(token);
    if (!payload) {
      res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
      return;
    }

    const userDoc = await db.collection('users').doc(payload.userId).get();
    if (!userDoc.exists) {
      res.status(401).json({ success: false, message: 'User not found.' });
      return;
    }

    const userData = userDoc.data() as User;
    const currentTokens = userData.refreshTokens || [];

    if (!currentTokens.includes(token)) {
      // Possible token reuse attempt: invalidate all tokens
      await userDoc.ref.update({ refreshTokens: [] });
      res.status(403).json({ success: false, message: 'Token compromised. Please log in again.' });
      return;
    }

    // Generate new tokens (token rotation)
    const tokenPayload = {
      userId: userData.id,
      email: userData.email,
      username: userData.username,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    const updatedTokens = currentTokens.filter((t) => t !== token).concat(newRefreshToken);

    await userDoc.ref.update({
      refreshTokens: updatedTokens,
      updatedAt: new Date().toISOString(),
    });

    res.cookie('refreshToken', newRefreshToken, refreshCookieOptions);

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ success: false, message: 'Could not refresh token.' });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const token = req.body.refreshToken || req.cookies.refreshToken;
    const userId = req.user?.id;

    if (userId && token) {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        const userData = userDoc.data() as User;
        const updatedTokens = (userData.refreshTokens || []).filter((t) => t !== token);
        await userRef.update({ refreshTokens: updatedTokens });
      }
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
    });
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Logout failed.' });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || !currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Current and new password are required.' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      return;
    }
    if (newPassword === currentPassword) {
      res.status(400).json({ success: false, message: 'New password must be different from the current one.' });
      return;
    }

    const userRef = db.collection('users').doc(userId);
    const userData = (await userRef.get()).data() as User;

    const isMatch = await bcrypt.compare(currentPassword, userData.passwordHash || '');
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));

    // Revoke every refresh token (logs out other devices), then keep this session alive with a fresh one
    const refreshToken = generateRefreshToken({ userId, email: userData.email, username: userData.username });
    await userRef.update({
      passwordHash,
      refreshTokens: [refreshToken],
      updatedAt: new Date().toISOString(),
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, message: 'Password updated. Other devices have been signed out.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }
    res.json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch current user profile.' });
  }
};
