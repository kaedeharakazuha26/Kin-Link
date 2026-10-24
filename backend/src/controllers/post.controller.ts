import { Response } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { Post, Comment } from '../types';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { uploadFileDetailed, deleteFileFromImageKit } from '../utils/upload';

export const createPost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { content, mediaType = 'none' } = req.body;
    // Only server-uploaded media is trusted; a client URL could point at another user's file
    let mediaUrl: string | undefined;
    let mediaFileId: string | undefined;

    if (req.file) {
      const uploadRes = await uploadFileDetailed(req.file, 'posts');
      mediaUrl = uploadRes.url;
      mediaFileId = uploadRes.fileId;
    }

    if (!content && !mediaUrl) {
      res.status(400).json({ success: false, message: 'Post content or media is required.' });
      return;
    }

    const postId = db.collection('posts').doc().id;
    const now = new Date().toISOString();

    let detectedMediaType: 'image' | 'video' | 'none' = mediaType;
    if (mediaUrl) {
      if (req.file?.mimetype.startsWith('video') || mediaUrl.includes('.mp4') || mediaUrl.includes('video')) {
        detectedMediaType = 'video';
      } else {
        detectedMediaType = 'image';
      }
    }

    const newPost: Post = {
      id: postId,
      authorId: user.id,
      authorName: user.fullName,
      authorUsername: user.username,
      authorProfilePicture: user.profilePicture || '',
      content: content ? content.trim() : '',
      mediaType: detectedMediaType,
      likes: [],
      commentsCount: 0,
      sharesCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    if (mediaUrl) {
      newPost.mediaUrl = mediaUrl;
      if (mediaFileId) {
        newPost.mediaFileId = mediaFileId;
      }
    }

    await db.collection('posts').doc(postId).set(newPost);

    res.status(201).json({ success: true, message: 'Post created successfully.', post: newPost });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ success: false, message: 'Failed to create post.' });
  }
};

export const getFeedPosts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const friends = req.user?.friends || [];
    // shortcut: Firestore 'in' filter is limited to 30 authors, paginate author batches or fan out to user feed collections when friend count exceeds 30
    const authorIds = [userId, ...friends].filter(Boolean).slice(0, 30) as string[];

    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;

    let posts: Post[] = [];

    try {
      let query: FirebaseFirestore.Query = db.collection('posts');
      if (authorIds.length > 0) {
        query = query.where('authorId', 'in', authorIds);
      }
      query = query.orderBy('createdAt', 'desc');
      if (cursor) {
        query = query.startAfter(cursor);
      }
      const snapshot = await query.limit(limit).get();
      snapshot.forEach((doc) => posts.push(doc.data() as Post));
    } catch (queryErr: any) {
      // Fallback for unindexed or pending Firestore composite index
      console.warn('Feed index query failed, using in-memory filter fallback:', queryErr?.message || queryErr);
      let fallbackQuery: FirebaseFirestore.Query = db.collection('posts').orderBy('createdAt', 'desc');
      if (cursor) {
        fallbackQuery = fallbackQuery.startAfter(cursor);
      }
      const snapshot = await fallbackQuery.limit(limit * 3).get();
      snapshot.forEach((doc) => {
        const p = doc.data() as Post;
        if (authorIds.includes(p.authorId) && posts.length < limit) {
          posts.push(p);
        }
      });
    }

    const nextCursor = posts.length === limit ? posts[posts.length - 1].createdAt : null;

    res.json({ success: true, posts, nextCursor });
  } catch (error) {
    console.error('Get feed posts error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve posts.' });
  }
};

export const getUserPosts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let userId = String(req.params.userId || '');
    if (userId === 'me' || userId === 'undefined' || !userId) {
      userId = req.user?.id || '';
    }
    const snapshot = await db
      .collection('posts')
      .where('authorId', '==', userId)
      .limit(100)
      .get();

    const posts: Post[] = [];
    snapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      posts.push(doc.data() as Post);
    });

    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, posts });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve user posts.' });
  }
};

export const toggleLikePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const postId = String(req.params.postId);
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const postRef = db.collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      res.status(404).json({ success: false, message: 'Post not found.' });
      return;
    }

    const postData = postDoc.data() as Post;
    const likes = postData.likes || [];
    const hasLiked = likes.includes(userId);

    const updatedLikes = hasLiked ? likes.filter((id) => id !== userId) : [...likes, userId];

    await postRef.update({
      likes: hasLiked ? FieldValue.arrayRemove(userId) : FieldValue.arrayUnion(userId),
      updatedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      liked: !hasLiked,
      likesCount: updatedLikes.length,
      likes: updatedLikes,
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle like.' });
  }
};

export const addComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const postId = String(req.params.postId);
    const { content } = req.body;
    const user = req.user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!content || !content.trim()) {
      res.status(400).json({ success: false, message: 'Comment content cannot be empty.' });
      return;
    }

    const postRef = db.collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      res.status(404).json({ success: false, message: 'Post not found.' });
      return;
    }

    const commentId = db.collection('posts').doc(postId).collection('comments').doc().id;
    const now = new Date().toISOString();

    const newComment: Comment = {
      id: commentId,
      postId,
      authorId: user.id,
      authorName: user.fullName,
      authorUsername: user.username,
      authorProfilePicture: user.profilePicture,
      content: content.trim(),
      createdAt: now,
    };

    await db.collection('posts').doc(postId).collection('comments').doc(commentId).set(newComment);

    await postRef.update({
      commentsCount: FieldValue.increment(1),
      updatedAt: now,
    });

    res.status(201).json({ success: true, comment: newComment });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment.' });
  }
};

export const getComments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const postId = String(req.params.postId);
    const snapshot = await db
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .orderBy('createdAt', 'asc')
      .get();

    const comments: Comment[] = [];
    snapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      comments.push(doc.data() as Comment);
    });

    res.json({ success: true, comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve comments.' });
  }
};

export const deletePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const postId = String(req.params.postId);
    const userId = req.user?.id;

    const postRef = db.collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      res.status(404).json({ success: false, message: 'Post not found.' });
      return;
    }

    const postData = postDoc.data() as Post;
    if (postData.authorId !== userId) {
      res.status(403).json({ success: false, message: 'You can only delete your own posts.' });
      return;
    }

    // Delete media only by the fileId we stored at upload; deleting by URL could hit another user's file
    // shortcut: legacy posts without mediaFileId keep their ImageKit file, clean up manually if storage matters
    try {
      if (postData.mediaFileId) {
        await deleteFileFromImageKit(postData.mediaFileId);
      }
    } catch (mediaErr) {
      console.warn('Failed to delete media from ImageKit during post deletion:', mediaErr);
    }

    // Delete comments subcollection
    // shortcut: deletes up to 500 comments in a single batch, paginate if comments exceed 500
    try {
      const commentsSnapshot = await postRef.collection('comments').limit(500).get();
      if (!commentsSnapshot.empty) {
        const batch = db.batch();
        commentsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }
    } catch (commentsErr) {
      console.warn('Failed to delete post comments subcollection:', commentsErr);
    }

    await postRef.delete();
    res.json({ success: true, message: 'Post deleted successfully.' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete post.' });
  }
};

export const sharePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const postId = String(req.params.postId);
    const postRef = db.collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      res.status(404).json({ success: false, message: 'Post not found.' });
      return;
    }

    const postData = postDoc.data() as Post;
    const updatedShares = (postData.sharesCount || 0) + 1;

    await postRef.update({
      sharesCount: FieldValue.increment(1),
      updatedAt: new Date().toISOString(),
    });

    res.json({ success: true, sharesCount: updatedShares });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({ success: false, message: 'Failed to share post.' });
  }
};

export const searchPosts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const q = ((req.query.q as string) || '').toLowerCase().trim();

    const snapshot = await db.collection('posts').orderBy('createdAt', 'desc').limit(100).get();
    const posts: Post[] = [];

    snapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const p = doc.data() as Post;
      if (!q) {
        posts.push(p);
      } else {
        const matchContent = p.content && p.content.toLowerCase().includes(q);
        const matchAuthor = (p.authorName && p.authorName.toLowerCase().includes(q)) ||
                            (p.authorUsername && p.authorUsername.toLowerCase().includes(q));
        if (matchContent || matchAuthor) {
          posts.push(p);
        }
      }
    });

    res.json({ success: true, posts });
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({ success: false, message: 'Failed to search posts.' });
  }
};

