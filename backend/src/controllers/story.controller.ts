import { Response } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { Story } from '../types';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { uploadFileDetailed, deleteFileFromImageKit } from '../utils/upload';

export const createStory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { content = '', mediaType = 'text', background = '#4f46e5' } = req.body;
    // Only server-uploaded media is trusted; never accept a client-supplied URL
    let mediaUrl: string | undefined;
    let mediaFileId: string | undefined;

    if (req.file) {
      const uploadRes = await uploadFileDetailed(req.file, 'stories');
      mediaUrl = uploadRes.url;
      mediaFileId = uploadRes.fileId;
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
      if (mediaFileId) {
        newStory.mediaFileId = mediaFileId;
      }
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

    // Opportunistically delete expired stories and their media
    // shortcut: batches up to 50 expired stories per request to avoid worker/cron overhead
    db.collection('stories')
      .where('expiresAt', '<=', nowIso)
      .limit(50)
      .get()
      .then(async (expiredSnapshot) => {
        if (!expiredSnapshot.empty) {
          const batch = db.batch();
          for (const doc of expiredSnapshot.docs) {
            const data = doc.data() as Story;
            if (data.mediaFileId) {
              deleteFileFromImageKit(data.mediaFileId).catch(() => {});
            }
            batch.delete(doc.ref);
          }
          await batch.commit();
        }
      })
      .catch((err) => {
        console.warn('Failed to clean up expired stories:', err);
      });

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
    await storyRef.update({
      views: FieldValue.arrayUnion(userId),
    });

    res.json({ success: true });
  } catch (error) {
    console.error('View story error:', error);
    res.status(500).json({ success: false, message: 'Failed to record story view.' });
  }
};
