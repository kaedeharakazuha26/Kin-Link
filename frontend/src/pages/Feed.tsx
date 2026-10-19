import React, { useEffect, useState } from 'react';
import StoriesBar from '../components/StoriesBar';
import CreatePostBox from '../components/CreatePostBox';
import PostCard from '../components/PostCard';
import Loading from '../components/Loading';
import { Post, User } from '../types';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useSocketStore } from '../store/useSocketStore';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/ui/avatar';
import { Sparkles, MessageCircle, ExternalLink } from 'lucide-react';

const Feed: React.FC = () => {
  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestedFriends, setSuggestedFriends] = useState<User[]>([]);

  const fetchFeed = async () => {
    try {
      const res = await api.get('/posts/feed');
      if (res.data.success) {
        setPosts(res.data.posts || []);
      }
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await api.get('/users/search?q=');
      if (res.data.success) {
        setSuggestedFriends((res.data.users || []).slice(0, 5));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchFeed();
    fetchSuggestions();
  }, []);

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="w-full min-h-full py-6 px-4 sm:px-6 flex justify-center items-start gap-8">
      {/* Center Feed Stream */}
      <div className="w-full max-w-2xl space-y-6">
        {/* 24h Stories Bar */}
        <StoriesBar />

        {/* Create Post Composer */}
        <CreatePostBox onPostCreated={handlePostCreated} />

        {/* Posts Stream */}
        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-200/80 shadow-xs">
            <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-800">Your feed is waiting!</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
              Share your thoughts, photos, or add friends to see their daily stories and posts right here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostDeleted={handlePostDeleted}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right Column (Sponsored Ads & Online Friends) */}
      <div className="hidden xl:block w-80 space-y-6 shrink-0 sticky top-6">
        {/* Sponsored Ad Widget */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-3 uppercase tracking-wider font-semibold">
            <span>Sponsored</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
          <div className="rounded-xl overflow-hidden mb-3">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80"
              alt="Sponsored Ad"
              className="w-full h-36 object-cover"
            />
          </div>
          <h4 className="text-sm font-bold text-gray-800">LINK Developer Suite</h4>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Build high-performance real-time applications using Node.js, TypeScript, and Firebase.
          </p>
        </div>

        {/* Suggested Friends */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800">People You May Know</h3>
            <span
              onClick={() => navigate('/discover')}
              className="text-xs text-indigo-600 hover:underline cursor-pointer"
            >
              See all
            </span>
          </div>

          <div className="space-y-3">
            {suggestedFriends.map((friend) => (
              <div
                key={friend.id}
                onClick={() => navigate(`/profile/${friend.id}`)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5 truncate mr-2">
                  <Avatar src={friend.profilePicture} fallback={friend.fullName} size="sm" />
                  <div className="truncate">
                    <p className="text-xs font-bold text-gray-800 truncate">{friend.fullName}</p>
                    <p className="text-[11px] text-gray-400 truncate">@{friend.username}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/messages/${friend.id}`);
                  }}
                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                  title="Message"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feed;
