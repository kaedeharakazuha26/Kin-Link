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
import {
  Sparkles,
  MessageCircle,
  Users,
  Check,
  X,
  Hash,
  TrendingUp,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Feed: React.FC = () => {
  const { user, updateUserProfileState } = useAuthStore();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [suggestedFriends, setSuggestedFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<User[]>([]);
  const [friendsList, setFriendsList] = useState<User[]>([]);

  const fetchFeed = async (cursor?: string) => {
    try {
      const url = cursor ? `/posts/feed?cursor=${encodeURIComponent(cursor)}` : '/posts/feed';
      const res = await api.get(url);
      if (res.data.success) {
        if (cursor) {
          setPosts((prev) => [...prev, ...(res.data.posts || [])]);
        } else {
          setPosts(res.data.posts || []);
        }
        setNextCursor(res.data.nextCursor || null);
      }
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchRightColumnData = async () => {
    if (!user?.id) return;
    try {
      const [reqRes, friendsRes, sugRes] = await Promise.all([
        api.get('/users/requests'),
        api.get(`/users/${user.id}/friends`),
        api.get('/users/search?q=&excludeFriends=true'),
      ]);

      if (reqRes.data.success) {
        setPendingRequests(reqRes.data.requests || []);
      }

      const activeFriends: User[] = friendsRes.data.success ? friendsRes.data.friends || [] : [];
      setFriendsList(activeFriends);

      if (sugRes.data.success) {
        const friendIds = new Set([user.id, ...(user.friends || []), ...activeFriends.map((f) => f.id)]);
        const clean = (sugRes.data.users || []).filter((u: User) => !friendIds.has(u.id));
        setSuggestedFriends(clean.slice(0, 5));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchFeed();
    fetchRightColumnData();
  }, [user?.id, user?.friends]);

  const handleAcceptRequest = async (requesterId: string) => {
    try {
      const res = await api.post(`/users/friends/accept/${requesterId}`);
      if (res.data.success) {
        toast.success('Friend request accepted!');
        const accepted = pendingRequests.find((r) => r.id === requesterId);
        if (accepted) {
          setFriendsList((prev) => [...prev, accepted]);
          setPendingRequests((prev) => prev.filter((r) => r.id !== requesterId));
        }

        if (res.data.user) {
          updateUserProfileState(res.data.user);
        } else {
          updateUserProfileState({
            friends: [...(user?.friends || []), requesterId],
            friendRequestsReceived: (user?.friendRequestsReceived || []).filter((id) => id !== requesterId),
          });
        }
      }
    } catch {
      toast.error('Failed to accept request.');
    }
  };

  const handleRejectRequest = async (requesterId: string) => {
    try {
      const res = await api.post(`/users/friends/reject/${requesterId}`);
      if (res.data.success) {
        toast.success('Request declined.');
        setPendingRequests((prev) => prev.filter((r) => r.id !== requesterId));

        if (res.data.user) {
          updateUserProfileState(res.data.user);
        } else {
          updateUserProfileState({
            friendRequestsReceived: (user?.friendRequestsReceived || []).filter((id) => id !== requesterId),
          });
        }
      }
    } catch {
      toast.error('Failed to decline request.');
    }
  };

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

            {nextCursor && (
              <div className="pt-2 pb-6 text-center">
                <button
                  onClick={() => {
                    setLoadingMore(true);
                    fetchFeed(nextCursor);
                  }}
                  disabled={loadingMore}
                  className="px-6 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  {loadingMore ? 'Loading more posts...' : 'Load more posts'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Column (Useful Platform Widgets) */}
      <div className="hidden xl:block w-80 space-y-5 shrink-0 sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto no-scrollbar pr-1">
        {/* Pending Requests Widget (Only shows when user has incoming requests) */}
        {pendingRequests.length > 0 && (
          <div className="bg-[#11131f] rounded-3xl p-4 border border-indigo-500/30 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Friend Requests
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                  {pendingRequests.length}
                </span>
              </h3>
              <span
                onClick={() => navigate('/friends')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer transition"
              >
                View all
              </span>
            </div>

            <div className="space-y-3">
              {pendingRequests.slice(0, 3).map((req) => (
                <div
                  key={req.id}
                  className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2.5"
                >
                  <div
                    onClick={() => navigate(`/profile/${req.id}`)}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <Avatar
                      src={req.profilePicture}
                      fallback={req.fullName}
                      size="sm"
                      className="ring-1 ring-white/10 group-hover:ring-indigo-500 transition"
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition truncate">
                        {req.fullName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">@{req.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleAcceptRequest(req.id)}
                      className="flex-1 py-1.5 px-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Confirm
                    </button>
                    <button
                      onClick={() => handleRejectRequest(req.id)}
                      className="py-1.5 px-3 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center transition border border-white/5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contacts / Friends Quick Chat */}
        <div className="bg-[#11131f] rounded-3xl p-4 border border-white/[0.08] shadow-xl">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Contacts & Friends
              {friendsList.length > 0 && (
                <span className="text-xs text-slate-500">({friendsList.length})</span>
              )}
            </h3>
            <span
              onClick={() => navigate('/friends')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer transition"
            >
              All Friends
            </span>
          </div>

          <div className="space-y-1.5">
            {friendsList.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs text-slate-400">No contacts yet.</p>
                <button
                  onClick={() => navigate('/discover')}
                  className="mt-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                >
                  Find people to connect →
                </button>
              </div>
            ) : (
              friendsList.slice(0, 6).map((friend) => (
                <div
                  key={friend.id}
                  onClick={() => navigate(`/profile/${friend.id}`)}
                  className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/[0.04] transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 truncate mr-2">
                    <div className="relative">
                      <Avatar
                        src={friend.profilePicture}
                        fallback={friend.fullName}
                        size="sm"
                        className="ring-1 ring-white/10 group-hover:ring-indigo-500 transition"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#11131f]" />
                    </div>
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
                    title={`Message ${friend.fullName}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Suggested People (if available) */}
        {suggestedFriends.length > 0 && (
          <div className="bg-[#11131f] rounded-3xl p-4 border border-white/[0.08] shadow-xl">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
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
              {suggestedFriends.slice(0, 4).map((person) => (
                <div
                  key={person.id}
                  onClick={() => navigate(`/profile/${person.id}`)}
                  className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/[0.04] transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 truncate mr-2">
                    <Avatar
                      src={person.profilePicture}
                      fallback={person.fullName}
                      size="sm"
                      className="ring-1 ring-white/10 group-hover:ring-purple-500 transition"
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold text-white group-hover:text-purple-300 transition truncate">
                        {person.fullName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">@{person.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/messages/${person.id}`);
                    }}
                    className="p-2 text-purple-400 hover:text-white bg-purple-500/10 hover:bg-purple-600 rounded-xl transition cursor-pointer"
                    title="Send message"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trending Community Topics */}
        <div className="bg-[#11131f] rounded-3xl p-4 border border-white/[0.08] shadow-xl">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-pink-400" />
              Trending Topics
            </h3>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Active</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { tag: 'Technology', count: '1.4k posts' },
              { tag: 'WebDev', count: '920 posts' },
              { tag: 'Photography', count: '760 posts' },
              { tag: 'Design', count: '540 posts' },
              { tag: 'Gaming', count: '410 posts' },
            ].map((topic) => (
              <button
                key={topic.tag}
                onClick={() => navigate(`/discover`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-indigo-500/15 border border-white/5 hover:border-indigo-500/30 text-xs text-slate-300 hover:text-indigo-300 transition cursor-pointer group"
              >
                <Hash className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 transition" />
                <span className="font-semibold">{topic.tag}</span>
              </button>
            ))}
          </div>
        </div>


      </div>
    </div>
  );
};

export default Feed;
