import React, { useEffect, useState } from 'react';
import StoriesBar from '../components/StoriesBar';
import CreatePostBox from '../components/CreatePostBox';
import PostCard from '../components/PostCard';
import Loading from '../components/Loading';
import { Post, User } from '../types';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/ui/avatar';
import { Sparkles, MessageCircle, ExternalLink, Users } from 'lucide-react';

const Feed: React.FC = () => {
  const { user } = useAuthStore();
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
      const res = await api.get('/users/search?q=&excludeFriends=true');
      if (res.data.success) {
        const friendIds = new Set([user?.id, ...(user?.friends || [])]);
        const clean = (res.data.users || []).filter((u: User) => !friendIds.has(u.id));
        setSuggestedFriends(clean.slice(0, 5));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchFeed();
    fetchSuggestions();
  }, [user?.friends]);

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
    <div className="w-full min-h-full py-6 px-4 sm:px-6 flex justify-center items-start gap-8 bg-[#090a10]">
      {/* Center Feed Stream */}
      <div className="w-full max-w-2xl space-y-6">
        {/* 24h Stories Bar */}
        <StoriesBar />

        {/* Create Post Composer */}
        <CreatePostBox onPostCreated={handlePostCreated} />

        {/* Posts Stream */}
        {posts.length === 0 ? (
          <div className="bg-[#11131f] rounded-3xl p-10 text-center border border-white/[0.08] shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="text-base font-bold text-white">Your feed is waiting!</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1.5 leading-relaxed">
              Share your thoughts, photos, or connect with people to see their daily stories and posts right here.
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

      {/* Right Column (Sponsored Ads & People You May Know) */}
      <div className="hidden xl:block w-80 space-y-6 shrink-0 sticky top-6">
        {/* Sponsored Card */}
        <div className="bg-[#11131f] rounded-3xl p-4 border border-white/[0.08] shadow-xl">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3 uppercase tracking-wider font-bold">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              Featured
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="rounded-2xl overflow-hidden mb-3.5 border border-white/10">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80"
              alt="Sponsored Ad"
              className="w-full h-36 object-cover hover:scale-105 transition duration-500"
            />
          </div>
          <h4 className="text-sm font-bold text-white">LINK Real-Time Engine</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Ultra-fast WebSocket instant chat and smart media compression powered by Sharp.
          </p>
        </div>

        {/* Suggested Friends */}
        <div className="bg-[#11131f] rounded-3xl p-4 border border-white/[0.08] shadow-xl">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              People You May Know
            </h3>
            <span
              onClick={() => navigate('/discover')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer transition"
            >
              See all
            </span>
          </div>

          <div className="space-y-2">
            {suggestedFriends.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No new suggestions right now.</p>
            ) : (
              suggestedFriends.map((friend) => (
                <div
                  key={friend.id}
                  onClick={() => navigate(`/profile/${friend.id}`)}
                  className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/[0.04] transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 truncate mr-2">
                    <Avatar
                      src={friend.profilePicture}
                      fallback={friend.fullName}
                      size="sm"
                      className="ring-1 ring-white/10 group-hover:ring-indigo-500/50 transition"
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition truncate">
                        {friend.fullName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">@{friend.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/messages/${friend.id}`);
                    }}
                    className="p-2 text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 rounded-xl transition cursor-pointer"
                    title="Send message"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feed;
