import { Response } from 'express';
import { db } from '../config/firebase';
import { User, SafeUser } from '../types';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { uploadFileToFirebase } from '../utils/upload';

const toSafeUser = (u: User): SafeUser => {
  const { passwordHash, refreshTokens, ...safe } = u;
  return safe;
};

export const getUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userIdOrUsername = String(req.params.userIdOrUsername);
    let userDoc = await db.collection('users').doc(userIdOrUsername).get();

    if (!userDoc.exists) {
      const q = await db.collection('users').where('username', '==', userIdOrUsername.toLowerCase()).limit(1).get();
      if (q.empty) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }
      userDoc = q.docs[0];
    }

    const userData = userDoc.data() as User;
    const currentUserId = req.user?.id;

    const isFriend = currentUserId ? (userData.friends || []).includes(currentUserId) : false;
    const hasSentRequest = currentUserId ? (userData.friendRequestsReceived || []).includes(currentUserId) : false;
    const hasReceivedRequest = currentUserId ? (userData.friendRequestsSent || []).includes(currentUserId) : false;

    res.json({
      success: true,
      user: toSafeUser(userData),
      isFriend,
      hasSentRequest,
      hasReceivedRequest,
      isSelf: currentUserId === userData.id,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { fullName, bio, location } = req.body;
    let { profilePicture, coverPhoto } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    if (files?.profilePicture?.[0]) {
      profilePicture = await uploadFileToFirebase(files.profilePicture[0], 'profiles');
    }
    if (files?.coverPhoto?.[0]) {
      coverPhoto = await uploadFileToFirebase(files.coverPhoto[0], 'profiles');
    }

    const updates: Partial<User> = {
      updatedAt: new Date().toISOString(),
    };

    if (fullName) updates.fullName = fullName.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (location !== undefined) updates.location = location.trim();
    if (profilePicture) updates.profilePicture = profilePicture;
    if (coverPhoto) updates.coverPhoto = coverPhoto;

    const userRef = db.collection('users').doc(userId);
    await userRef.update(updates);

    const updatedDoc = await userRef.get();
    const updatedUser = updatedDoc.data() as User;

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: toSafeUser(updatedUser),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

export const searchUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const q = ((req.query.q as string) || '').toLowerCase().trim();
    const snapshot = await db.collection('users').limit(40).get();

    const results: SafeUser[] = [];
    snapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const u = doc.data() as User;
      if (u.id !== req.user?.id) {
        if (!q || u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)) {
          results.push(toSafeUser(u));
        }
      }
    });

    res.json({ success: true, users: results });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ success: false, message: 'Search failed.' });
  }
};

export const sendFriendRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const targetUserId = String(req.params.targetUserId);

    if (!currentUserId || currentUserId === targetUserId) {
      res.status(400).json({ success: false, message: 'Invalid target user.' });
      return;
    }

    const targetRef = db.collection('users').doc(targetUserId);
    const targetDoc = await targetRef.get();

    if (!targetDoc.exists) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const targetUser = targetDoc.data() as User;
    const currentUserRef = db.collection('users').doc(currentUserId);
    const currentUserDoc = await currentUserRef.get();
    const currentUser = currentUserDoc.data() as User;

    if ((currentUser.friends || []).includes(targetUserId)) {
      res.status(400).json({ success: false, message: 'Already friends.' });
      return;
    }

    // Add to target's received list
    const targetReceived = new Set(targetUser.friendRequestsReceived || []);
    targetReceived.add(currentUserId);
    await targetRef.update({ friendRequestsReceived: Array.from(targetReceived) });

    // Add to current user's sent list
    const currentSent = new Set(currentUser.friendRequestsSent || []);
    currentSent.add(targetUserId);
    await currentUserRef.update({ friendRequestsSent: Array.from(currentSent) });

    res.json({ success: true, message: 'Friend request sent.' });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ success: false, message: 'Failed to send request.' });
  }
};

export const acceptFriendRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const requesterId = String(req.params.requesterId);

    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const currentUserRef = db.collection('users').doc(currentUserId);
    const requesterRef = db.collection('users').doc(requesterId);

    const [currentDoc, requesterDoc] = await Promise.all([currentUserRef.get(), requesterRef.get()]);

    if (!currentDoc.exists || !requesterDoc.exists) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const currentUser = currentDoc.data() as User;
    const requester = requesterDoc.data() as User;

    // Update current user
    const currentFriends = new Set(currentUser.friends || []);
    currentFriends.add(requesterId);
    const currentReceived = (currentUser.friendRequestsReceived || []).filter((id) => id !== requesterId);

    await currentUserRef.update({
      friends: Array.from(currentFriends),
      friendRequestsReceived: currentReceived,
    });

    // Update requester
    const requesterFriends = new Set(requester.friends || []);
    requesterFriends.add(currentUserId);
    const requesterSent = (requester.friendRequestsSent || []).filter((id) => id !== currentUserId);

    await requesterRef.update({
      friends: Array.from(requesterFriends),
      friendRequestsSent: requesterSent,
    });

    res.json({ success: true, message: 'Friend request accepted.' });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ success: false, message: 'Failed to accept friend request.' });
  }
};

export const rejectFriendRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const requesterId = String(req.params.requesterId);

    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const currentUserRef = db.collection('users').doc(currentUserId);
    const requesterRef = db.collection('users').doc(requesterId);

    const [currentDoc, requesterDoc] = await Promise.all([currentUserRef.get(), requesterRef.get()]);

    if (currentDoc.exists) {
      const currentUser = currentDoc.data() as User;
      const currentReceived = (currentUser.friendRequestsReceived || []).filter((id) => id !== requesterId);
      await currentUserRef.update({ friendRequestsReceived: currentReceived });
    }

    if (requesterDoc.exists) {
      const requester = requesterDoc.data() as User;
      const requesterSent = (requester.friendRequestsSent || []).filter((id) => id !== currentUserId);
      await requesterRef.update({ friendRequestsSent: requesterSent });
    }

    res.json({ success: true, message: 'Friend request declined.' });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject friend request.' });
  }
};

export const removeFriend = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const friendId = String(req.params.friendId);

    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const currentUserRef = db.collection('users').doc(currentUserId);
    const friendRef = db.collection('users').doc(friendId);

    const [currentDoc, friendDoc] = await Promise.all([currentUserRef.get(), friendRef.get()]);

    if (currentDoc.exists) {
      const currentUser = currentDoc.data() as User;
      const currentFriends = (currentUser.friends || []).filter((id) => id !== friendId);
      await currentUserRef.update({ friends: currentFriends });
    }

    if (friendDoc.exists) {
      const friend = friendDoc.data() as User;
      const friendFriends = (friend.friends || []).filter((id) => id !== currentUserId);
      await friendRef.update({ friends: friendFriends });
    }

    res.json({ success: true, message: 'Friend removed.' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove friend.' });
  }
};

export const getFriendRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data() as User;
    const receivedIds = userData.friendRequestsReceived || [];

    if (receivedIds.length === 0) {
      res.json({ success: true, requests: [] });
      return;
    }

    const requests: SafeUser[] = [];
    for (const rId of receivedIds) {
      const senderDoc = await db.collection('users').doc(rId).get();
      if (senderDoc.exists) {
        requests.push(toSafeUser(senderDoc.data() as User));
      }
    }

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch friend requests.' });
  }
};

export const getFriendsList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = String(req.params.userId);
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const userData = userDoc.data() as User;
    const friendIds = userData.friends || [];

    if (friendIds.length === 0) {
      res.json({ success: true, friends: [] });
      return;
    }

    const friends: SafeUser[] = [];
    for (const fId of friendIds) {
      const fDoc = await db.collection('users').doc(fId).get();
      if (fDoc.exists) {
        friends.push(toSafeUser(fDoc.data() as User));
      }
    }

    res.json({ success: true, friends });
  } catch (error) {
    console.error('Get friends list error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve friends list.' });
  }
};
