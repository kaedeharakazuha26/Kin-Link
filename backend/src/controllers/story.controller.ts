import { Response } from 'express';
import { db } from '../config/firebase';
import { Story } from '../types';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { uploadFile } from '../utils/upload';

export const createStory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { content = '', mediaType = 'text', background = '#4f46e5' } = req.body;
    let mediaUrl = req.body.mediaUrl;

    if (req.file) {
      mediaUrl = await uploadFile(req.file, 'stories');
    }

    const storyId = db.collection('stories').doc().id;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    let detectedType: 'text' | 'image' | 'video' = mediaType;
    if (mediaUrl) {
      if (req.file?.mimetype.startsWith('video') || mediaUrl.includes('video')) {
        detectedType = 'video';
      } else {
        detectedType = 'image';
      }
    }

    const newStory: Story = {
      id: storyId,
      userId: user.id,
      userName: user.fullName,
      userUsername: user.username,
      userProfilePicture: user.profilePicture || '',
      content: content.trim(),
      mediaType: detectedType,
      views: [],
      createdAt: now.toISOString(),
      expiresAt,
    };

    if (mediaUrl) {
      newStory.mediaUrl = mediaUrl;
    }
    if (detectedType === 'text') {
      newStory.background = background || '#4f46e5';
    }

    await db.collection('stories').doc(storyId).set(newStory);

    res.status(201).json({ success: true, message: 'Story created successfully.', story: newStory });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ success: false, message: 'Failed to create story.' });
  }
};

export const getActiveStories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const nowIso = new Date().toISOString();
    const snapshot = await db
      .collection('stories')
      .where('expiresAt', '>', nowIso)
      .orderBy('expiresAt', 'desc')
      .get();

    const stories: Story[] = [];
    snapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      stories.push(doc.data() as Story);
    });

    res.json({ success: true, stories });
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stories.' });
  }
};

export const markStoryViewed = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const storyId = String(req.params.storyId);
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const storyRef = db.collection('stories').doc(storyId);
    const storyDoc = await storyRef.get();

    if (!storyDoc.exists) {
      res.status(404).json({ success: false, message: 'Story not found.' });
      return;
    }

    const storyData = storyDoc.data() as Story;
    const views = storyData.views || [];

    if (!views.includes(userId)) {
      await storyRef.update({
        views: [...views, userId],
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('View story error:', error);
    res.status(500).json({ success: false, message: 'Failed to record story view.' });
  }
};
