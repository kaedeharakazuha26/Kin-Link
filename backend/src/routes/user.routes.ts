import { Router } from 'express';
import {
  getUserProfile,
  updateProfile,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriendRequests,
  getFriendsList,
} from '../controllers/user.controller';
import { protectRoute } from '../middleware/auth.middleware';
import { upload } from '../utils/upload';

const router = Router();

router.get('/search', protectRoute, searchUsers);
router.get('/requests', protectRoute, getFriendRequests);
router.get('/:userIdOrUsername', protectRoute, getUserProfile);
router.get('/:userId/friends', protectRoute, getFriendsList);

router.put(
  '/profile',
  protectRoute,
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'coverPhoto', maxCount: 1 },
  ]),
  updateProfile
);

router.post('/friends/request/:targetUserId', protectRoute, sendFriendRequest);
router.post('/friends/accept/:requesterId', protectRoute, acceptFriendRequest);
router.post('/friends/reject/:requesterId', protectRoute, rejectFriendRequest);
router.delete('/friends/:friendId', protectRoute, removeFriend);

export default router;
