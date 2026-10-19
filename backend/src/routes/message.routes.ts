import { Router } from 'express';
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
} from '../controllers/message.controller';
import { protectRoute } from '../middleware/auth.middleware';
import { upload } from '../utils/upload';

const router = Router();

router.get('/conversations', protectRoute, getConversations);
router.get('/conversations/:targetUserId', protectRoute, getOrCreateConversation);
router.get('/:conversationId', protectRoute, getMessages);
router.post('/:conversationId', protectRoute, upload.single('media'), sendMessage);

export default router;
