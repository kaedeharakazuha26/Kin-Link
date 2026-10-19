export interface User {
  id: string;
  email: string;
  fullName: string;
  username: string;
  profilePicture: string;
  coverPhoto: string;
  bio: string;
  location: string;
  friends: string[];
  friendRequestsReceived: string[];
  friendRequestsSent: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorProfilePicture: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'none';
  likes: string[];
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorProfilePicture: string;
  content: string;
  createdAt: string;
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userUsername: string;
  userProfilePicture: string;
  content: string;
  mediaUrl?: string;
  mediaType: 'text' | 'image' | 'video';
  background?: string;
  views: string[];
  createdAt: string;
  expiresAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  mediaUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: string;
  };
  otherUser?: User;
  createdAt: string;
  updatedAt: string;
}
