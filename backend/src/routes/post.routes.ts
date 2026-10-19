import { Router } from 'express';
import {
  createPost,
  getFeedPosts,
  getUserPosts,
  toggleLikePost,
  addComment,
  getComments,
  deletePost,
  sharePost,
  searchPosts,
} from '../controllers/post.controller';
import { protectRoute } from '../middleware/auth.middleware';
import { upload } from '../utils/upload';

const router = Router();

router.get('/feed', protectRoute, getFeedPosts);
router.get('/search', protectRoute, searchPosts);
router.get('/user/:userId', protectRoute, getUserPosts);
router.post('/', protectRoute, upload.single('media'), createPost);
router.post('/:postId/like', protectRoute, toggleLikePost);
router.post('/:postId/comments', protectRoute, addComment);
router.get('/:postId/comments', protectRoute, getComments);
router.delete('/:postId', protectRoute, deletePost);
router.post('/:postId/share', protectRoute, sharePost);

export default router;
