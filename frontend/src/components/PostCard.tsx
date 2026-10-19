import React, { useState } from 'react';
import { Post, Comment } from '../types';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { Avatar } from './ui/avatar';
import { Heart, MessageSquare, Share2, Trash2, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted }) => {
  const { user } = useAuthStore();
  const [likes, setLikes] = useState<string[]>(post.likes || []);
  const [isLiked, setIsLiked] = useState<boolean>(post.likes?.includes(user?.id || '') || false);
  const [isLiking, setIsLiking] = useState(false);

  const [sharesCount, setSharesCount] = useState<number>(post.sharesCount || 0);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentsCount, setCommentsCount] = useState<number>(post.commentsCount || 0);

  const [isDeleting, setIsDeleting] = useState(false);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const handleToggleLike = async () => {
    if (isLiking || !user) return;
    setIsLiking(true);

    // Optimistic update
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikes((prev) => (nextLiked ? [...prev, user.id] : prev.filter((id) => id !== user.id)));

    try {
      const res = await api.post(`/posts/${post.id}/like`);
      if (res.data.success) {
        setIsLiked(res.data.liked);
        setLikes(res.data.likes);
      }
    } catch (error) {
      // Revert optimistic update
      setIsLiked(!nextLiked);
      setLikes((prev) => (!nextLiked ? [...prev, user.id] : prev.filter((id) => id !== user.id)));
      toast.error('Failed to update like');
    } finally {
      setIsLiking(false);
    }
  };

  const handleToggleComments = async () => {
    const nextShow = !showComments;
    setShowComments(nextShow);
    if (nextShow && comments.length === 0) {
      setIsLoadingComments(true);
      try {
        const res = await api.get(`/posts/${post.id}/comments`);
        if (res.data.success) {
          setComments(res.data.comments);
        }
      } catch (err) {
        toast.error('Failed to load comments');
      } finally {
        setIsLoadingComments(false);
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment || !user) return;

    setIsSubmittingComment(true);
    try {
      const res = await api.post(`/posts/${post.id}/comments`, { content: newComment });
      if (res.data.success && res.data.comment) {
        setComments((prev) => [...prev, res.data.comment]);
        setCommentsCount((prev) => prev + 1);
        setNewComment('');
      }
    } catch (err) {
      toast.error('Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    try {
      const res = await api.post(`/posts/${post.id}/share`);
      if (res.data.success) {
        setSharesCount(res.data.sharesCount);
        toast.success('Post shared to your feed!');
      }
    } catch {
      toast.error('Failed to share post');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    setIsDeleting(true);
    try {
      await api.delete(`/posts/${post.id}`);
      toast.success('Post deleted.');
      if (onPostDeleted) onPostDeleted(post.id);
    } catch {
      toast.error('Failed to delete post');
      setIsDeleting(false);
    }
  };

  const isAuthor = user?.id === post.authorId;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden transition hover:shadow-md">
      {/* Post Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar src={post.authorProfilePicture} fallback={post.authorName} size="md" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900 hover:underline cursor-pointer">
              {post.authorName}
            </h3>
            <p className="text-xs text-gray-500">
              @{post.authorUsername} • {formatTime(post.createdAt)}
            </p>
          </div>
        </div>

        {isAuthor && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
            title="Delete post"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Content Text */}
      {post.content && (
        <div className="px-5 pb-3 text-sm sm:text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>
      )}

      {/* Post Media (Image / Video) */}
      {post.mediaUrl && (
        <div className="w-full bg-black/5 max-h-[500px] overflow-hidden flex items-center justify-center">
          {post.mediaType === 'video' ? (
            <video src={post.mediaUrl} controls className="w-full max-h-[500px] object-contain" />
          ) : (
            <img
              src={post.mediaUrl}
              alt="Post attachment"
              className="w-full max-h-[500px] object-cover hover:scale-[1.01] transition duration-300"
            />
          )}
        </div>
      )}

      {/* Engagement Stats Bar */}
      <div className="px-5 py-2.5 flex items-center justify-between text-xs text-gray-500 border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="p-1 rounded-full bg-red-500 text-white flex items-center justify-center shadow-xs">
            <Heart className="w-2.5 h-2.5 fill-current" />
          </span>
          <span>{likes.length} {likes.length === 1 ? 'like' : 'likes'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{commentsCount} comments</span>
          <span>{sharesCount} shares</span>
        </div>
      </div>

      {/* Action Buttons (Like, Comment, Share) */}
      <div className="px-3 py-1 flex items-center justify-between text-gray-600 border-b border-gray-100">
        <button
          onClick={handleToggleLike}
          className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition cursor-pointer ${
            isLiked ? 'text-red-600 bg-red-50 font-semibold' : 'hover:bg-gray-50'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          <span>{isLiked ? 'Liked' : 'Like'}</span>
        </button>

        <button
          onClick={handleToggleComments}
          className="flex-1 py-2 flex items-center justify-center gap-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Comment</span>
        </button>

        <button
          onClick={handleShare}
          className="flex-1 py-2 flex items-center justify-center gap-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>

      {/* Expandable Comments Section */}
      {showComments && (
        <div className="p-4 sm:p-5 bg-slate-50/70 space-y-4">
          {/* New Comment Input */}
          <form onSubmit={handleAddComment} className="flex gap-2.5 items-center">
            <Avatar src={user?.profilePicture} fallback={user?.fullName} size="sm" />
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-full px-4 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmittingComment}
                className="absolute right-2 p-1.5 text-indigo-600 disabled:text-gray-300 hover:bg-indigo-50 rounded-full transition"
              >
                {isSubmittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>

          {/* Comments List */}
          {isLoadingComments ? (
            <div className="py-4 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-center text-gray-400 py-2">No comments yet. Be the first to comment!</p>
          ) : (
            <div className="space-y-3 pt-2">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2.5 items-start">
                  <Avatar src={comment.authorProfilePicture} fallback={comment.authorName} size="sm" />
                  <div className="bg-white border border-gray-200/80 rounded-2xl px-3.5 py-2 max-w-[85%] shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{comment.authorName}</span>
                      <span className="text-[10px] text-gray-400">{formatTime(comment.createdAt)}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-800 mt-0.5 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;
