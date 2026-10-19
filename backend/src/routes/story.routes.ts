import { Router } from 'express';
import { createStory, getActiveStories, markStoryViewed } from '../controllers/story.controller';
import { protectRoute } from '../middleware/auth.middleware';
import { upload } from '../utils/upload';

const router = Router();

router.get('/', protectRoute, getActiveStories);
router.post('/', protectRoute, upload.single('media'), createStory);
router.post('/:storyId/view', protectRoute, markStoryViewed);

export default router;
