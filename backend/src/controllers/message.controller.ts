import { Response } from 'express';
import { db } from '../config/firebase';
import { Message, Conversation, User, SafeUser } from '../types';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { uploadFileToFirebase } from '../utils/upload';

const toSafeUser = (u: User): SafeUser => {
  const { passwordHash, refreshTokens, ...safe } = u;
  return safe;
};

export const getConversations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const snapshot = await db
      .collection('conversations')
      .where('participants', 'array-contains', currentUserId)
      .orderBy('updatedAt', 'desc')
      .get();

    const conversationsWithDetails = [];

    for (const doc of snapshot.docs) {
      const conv = doc.data() as Conversation;
      const otherUserId = conv.participants.find((id) => id !== currentUserId) || currentUserId;
      const userDoc = await db.collection('users').doc(otherUserId).get();

      let otherUser: SafeUser | null = null;
      if (userDoc.exists) {
        otherUser = toSafeUser(userDoc.data() as User);
      }

      conversationsWithDetails.push({
        ...conv,
        otherUser,
      });
    }

    res.json({ success: true, conversations: conversationsWithDetails });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve conversations.' });
  }
};

export const getOrCreateConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const targetUserId = String(req.params.targetUserId);

    if (!currentUserId || !targetUserId) {
      res.status(400).json({ success: false, message: 'Invalid participants' });
      return;
    }

    // Check if conversation already exists
    const snapshot = await db
      .collection('conversations')
      .where('participants', 'array-contains', currentUserId)
      .get();

    let existingConv: Conversation | null = null;
    for (const doc of snapshot.docs) {
      const conv = doc.data() as Conversation;
      if (conv.participants.includes(targetUserId)) {
        existingConv = conv;
        break;
      }
    }

    const otherUserDoc = await db.collection('users').doc(targetUserId).get();
    if (!otherUserDoc.exists) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }
    const otherUser = toSafeUser(otherUserDoc.data() as User);

    if (existingConv) {
      res.json({ success: true, conversation: { ...existingConv, otherUser } });
      return;
    }

    // Create new conversation
    const convId = db.collection('conversations').doc().id;
    const now = new Date().toISOString();
    const newConv: Conversation = {
      id: convId,
      participants: [currentUserId, targetUserId],
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('conversations').doc(convId).set(newConv);

    res.status(201).json({ success: true, conversation: { ...newConv, otherUser } });
  } catch (error) {
    console.error('Get/Create conversation error:', error);
    res.status(500).json({ success: false, message: 'Failed to start conversation.' });
  }
};

export const getMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const conversationId = String(req.params.conversationId);
    const currentUserId = req.user?.id;

    const convDoc = await db.collection('conversations').doc(conversationId).get();
    if (!convDoc.exists) {
      res.status(404).json({ success: false, message: 'Conversation not found.' });
      return;
    }

    const convData = convDoc.data() as Conversation;
    if (!convData.participants.includes(currentUserId!)) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    const snapshot = await db
      .collection('conversations')
      .doc(conversationId)
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .limit(100)
      .get();

    const messages: Message[] = [];
    snapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      messages.push(doc.data() as Message);
    });

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve messages.' });
  }
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const conversationId = String(req.params.conversationId);
    const { text } = req.body;
    let mediaUrl = req.body.mediaUrl;
    const senderId = req.user?.id;

    if (!senderId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const convRef = db.collection('conversations').doc(conversationId);
    const convDoc = await convRef.get();

    if (!convDoc.exists) {
      res.status(404).json({ success: false, message: 'Conversation not found.' });
      return;
    }

    const convData = convDoc.data() as Conversation;
    if (!convData.participants.includes(senderId)) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    if (req.file) {
      mediaUrl = await uploadFileToFirebase(req.file, 'chat');
    }

    if (!text && !mediaUrl) {
      res.status(400).json({ success: false, message: 'Message text or media is required.' });
      return;
    }

    const receiverId = convData.participants.find((id) => id !== senderId) || senderId;
    const messageId = convRef.collection('messages').doc().id;
    const now = new Date().toISOString();

    const newMessage: Message = {
      id: messageId,
      conversationId,
      senderId,
      receiverId,
      text: text ? text.trim() : '',
      mediaUrl: mediaUrl || undefined,
      isRead: false,
      createdAt: now,
    };

    await convRef.collection('messages').doc(messageId).set(newMessage);

    // Update conversation lastMessage & updatedAt
    await convRef.update({
      lastMessage: {
        text: newMessage.text || (newMessage.mediaUrl ? '📷 Attachment' : ''),
        senderId,
        createdAt: now,
      },
      updatedAt: now,
    });

    res.status(201).json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};
