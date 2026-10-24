import { Router } from 'express';
import { register, login, refreshToken, logout, getMe, changePassword } from '../controllers/auth.controller';
import { protectRoute } from '../middleware/auth.middleware';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();
const authLimiter = rateLimiter(10, 15 * 60 * 1000);

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);
router.post('/logout', protectRoute, logout);
router.get('/me', protectRoute, getMe);
// Rate limited: a stolen session must not be able to brute-force the current password
router.put('/password', protectRoute, authLimiter, changePassword);

export default router;
