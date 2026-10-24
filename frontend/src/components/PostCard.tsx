import React, { useState } from 'react';
import { Post, Comment } from '../types';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { Avatar } from './ui/avatar';
import { Heart, MessageSquare, Share2, Trash2, Send, Loader2, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface PostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

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

  const [content, setContent] = useState(post.content || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      toast.error('Post content cannot be empty.');
      return;
    }
    setIsSavingEdit(true);
    try {
      const res = await api.put(`/posts/${post.id}`, { content: editContent.trim() });
      if (res.data.success) {
        setContent(editContent.trim());
        setIsEditing(false);
        toast.success('Post updated!');
      }
    } catch {
      toast.error('Failed to update post.');
    } finally {
      setIsSavingEdit(false);
    }
  };

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

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikes((prev) => (nextLiked ? [...prev, user.id] : prev.filter((id) => id !== user.id)));

    try {
      const res = await api.post(`/posts/${post.id}/like`);
      if (res.data.success) {
        setIsLiked(res.data.liked);
        setLikes(res.data.likes);
      }
    } catch {
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
          setComments(res.data.comments || []);
        }
      } catch {
        toast.error('Could not load comments');
      } finally {
        setIsLoadingComments(false);
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await api.post(`/posts/${post.id}/comments`, { content: newComment.trim() });
      if (res.data.success && res.data.comment) {
        setComments((prev) => [...prev, res.data.comment]);
        setNewComment('');
        setCommentsCount((prev) => prev + 1);
        toast.success('Comment added!');
      }
    } catch {
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
        toast.success('Post link shared!');
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
    <div className="bg-[#11131f] rounded-3xl shadow-xl border border-white/[0.08] overflow-hidden transition text-white">
      {/* Post Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between">
        <div
          onClick={() => navigate(`/profile/${post.authorId}`)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <Avatar
            src={post.authorProfilePicture}
            fallback={post.authorName}
            size="md"
            className="ring-1 ring-white/10 group-hover:ring-indigo-500/40 transition"
          />
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
              {post.authorName}
            </h3>
            <p className="text-xs text-slate-400">
              @{post.authorUsername} • {formatTime(post.createdAt)}
            </p>
          </div>
        </div>

        {isAuthor && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setEditContent(content);
                setIsEditing(!isEditing);
              }}
              className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition cursor-pointer"
              title="Edit post"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
              title="Delete post"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Content Text or Edit Mode */}
      {isEditing ? (
        <div className="px-5 pb-3 space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="w-full p-3 rounded-2xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50 resize-none transition"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setEditContent(content);
                setIsEditing(false);
              }}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={isSavingEdit}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {isSavingEdit ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        content && (
          <div className="px-5 pb-3 text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        )
      )}

      {/* Post Media (Image / Video) */}
      {post.mediaUrl && (
        <div className="w-full bg-[#0a0b12] max-h-[520px] overflow-hidden flex items-center justify-center border-y border-white/[0.06]">
          {post.mediaType === 'video' ? (
            <video src={post.mediaUrl} controls className="w-full max-h-[520px] object-contain" />
          ) : (
            <img
              src={post.mediaUrl}
              alt="Post attachment"
              className="w-full max-h-[520px] object-cover hover:scale-[1.01] transition duration-300 cursor-pointer"
              onClick={() => window.open(post.mediaUrl, '_blank')}
            />
          )}
        </div>
      )}

      {/* Engagement Stats Bar */}
      <div className="px-5 py-2.5 flex items-center justify-between text-xs text-slate-400 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <span className="p-1 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs">
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
      <div className="px-3 py-1 flex items-center justify-between text-slate-300 border-b border-white/[0.06]">
        <button
          onClick={handleToggleLike}
          className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-2xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
            isLiked ? 'text-rose-400 bg-rose-500/10' : 'hover:bg-white/[0.05] hover:text-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          <span>{isLiked ? 'Liked' : 'Like'}</span>
        </button>

        <button
          onClick={handleToggleComments}
          className="flex-1 py-2 flex items-center justify-center gap-2 rounded-2xl text-xs sm:text-sm font-semibold hover:bg-white/[0.05] hover:text-white transition cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Comment</span>
        </button>

        <button
          onClick={handleShare}
          className="flex-1 py-2 flex items-center justify-center gap-2 rounded-2xl text-xs sm:text-sm font-semibold hover:bg-white/[0.05] hover:text-white transition cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>

      {/* Expandable Comments Section */}
      {showComments && (
        <div className="p-4 sm:p-5 bg-[#0c0d16] space-y-4 border-t border-white/[0.06]">
          {/* New Comment Input */}
          <form onSubmit={handleAddComment} className="flex gap-2.5 items-center">
            <Avatar src={user?.profilePicture} fallback={user?.fullName || 'User'} size="sm" className="ring-1 ring-white/10" />
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full bg-[#181b2c] border border-white/10 rounded-full px-4 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmittingComment}
                className="absolute right-2 p-1.5 text-indigo-400 disabled:text-slate-600 hover:text-white rounded-full transition cursor-pointer"
              >
                {isSubmittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>

          {/* Comments List */}
          {isLoadingComments ? (
            <div className="py-4 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-center text-slate-500 py-2">No comments yet. Be the first to comment!</p>
          ) : (
            <div className="space-y-3 pt-2">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2.5 items-start">
                  <Avatar src={comment.authorProfilePicture} fallback={comment.authorName} size="sm" className="ring-1 ring-white/10 mt-0.5" />
                  <div className="bg-[#161828] border border-white/[0.06] rounded-2xl px-3.5 py-2.5 max-w-[85%] shadow-sm">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-white">{comment.authorName}</span>
                      <span className="text-[10px] text-slate-500">{formatTime(comment.createdAt)}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap">{comment.content}</p>
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
