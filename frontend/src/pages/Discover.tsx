import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { User, Post } from '../types';
import { useAuthStore } from '../store/useAuthStore';
import { Avatar } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import PostCard from '../components/PostCard';
import {
  Search,
  UserPlus,
  Sparkles,
  Loader2,
  MessageCircle,
  Users,
  Check,
  FileText,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const Discover: React.FC = () => {
  const { user, updateUserProfileState } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'people' | 'posts'>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(
    new Set(user?.friendRequestsSent || [])
  );

  const executeSearch = async (searchTerm: string) => {
    setLoading(true);
    try {
      const [usersRes, postsRes] = await Promise.all([
        api.get(`/users/search?q=${encodeURIComponent(searchTerm)}`),
        api.get(`/posts/search?q=${encodeURIComponent(searchTerm)}`),
      ]);

      if (usersRes.data.success) {
        setUsers(usersRes.data.users || []);
      }
      if (postsRes.data.success) {
        setPosts(postsRes.data.posts || []);
      }
    } catch {
      toast.error('Search request failed.');
    } finally {
      setLoading(false);
    }
  };

  // Sync when URL query parameter changes (e.g. from topbar search or ⌘K)
  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    executeSearch(q);
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim();
    if (clean) {
      setSearchParams({ q: clean });
    } else {
      setSearchParams({});
    }
  };

  const handleSendFriendRequest = async (targetId: string) => {
    try {
      const res = await api.post(`/users/friends/request/${targetId}`);
      if (res.data.success) {
        setSentRequests((prev) => new Set(prev).add(targetId));
        if (res.data.user) {
          updateUserProfileState(res.data.user);
        }
        toast.success('Friend request sent!');
      }
    } catch {
      toast.error('Could not send friend request.');
    }
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const totalResults = users.length + posts.length;

  return (
    <div className="min-h-full bg-[#090a10] py-8 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-7">
        {/* Header & Omni Search Hero */}
        <div className="bg-[#11131f] rounded-3xl p-6 sm:p-8 border border-white/[0.08] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/15 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Universal Search</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Search People & Posts
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
              Find friends, colleagues, creators, hashtags, articles, and community posts across LINK.
            </p>

            <form onSubmit={handleSearchSubmit} className="mt-6 relative max-w-2xl">
              <Search className="w-5 h-5 absolute left-4 top-3.5 text-indigo-400" />
              <input
                type="text"
                placeholder="Search by name, @username, keywords, or topics..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-[#181b2c] border border-white/10 rounded-2xl pl-12 pr-32 py-3.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner"
              />
              <Button
                type="submit"
                className="absolute right-2 top-2 rounded-xl text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-4 py-2 shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                Search
              </Button>
            </form>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mt-6 pt-5 border-t border-white/[0.08]">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                All
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/15">
                  {totalResults}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('people')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'people'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                People
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/15">
                  {users.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('posts')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'posts'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Posts
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/15">
                  {posts.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Stream / Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-xs text-slate-400 font-medium">Searching LINK directory...</p>
          </div>
        ) : totalResults === 0 ? (
          <div className="bg-[#11131f] rounded-3xl p-14 text-center border border-white/[0.08] shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3">
              <Search className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="text-base font-bold text-white">No results found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              We couldn't find any people or posts matching "{query}". Try different keywords, names, or check your spelling.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* PEOPLE SECTION (Shown in 'all' or 'people' tab) */}
            {(activeTab === 'all' || activeTab === 'people') && users.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    People ({users.length})
                  </h2>
                  {activeTab === 'all' && users.length > 6 && (
                    <button
                      onClick={() => setActiveTab('people')}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition cursor-pointer"
                    >
                      View all people <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(activeTab === 'all' ? users.slice(0, 6) : users).map((item) => {
                    const isFriend = user?.friends?.includes(item.id);
                    const isSelf = user?.id === item.id;
                    const hasSent = sentRequests.has(item.id);

                    return (
                      <div
                        key={item.id}
                        className="bg-[#11131f] rounded-3xl p-5 border border-white/[0.08] shadow-xl flex flex-col justify-between hover:border-indigo-500/40 hover:shadow-indigo-500/5 transition-all duration-300 group"
                      >
                        <div>
                          <div
                            onClick={() => navigate(`/profile/${item.id}`)}
                            className="flex items-center gap-3.5 cursor-pointer mb-3.5"
                          >
                            <div className="relative">
                              <Avatar
                                src={item.profilePicture}
                                fallback={item.fullName}
                                size="lg"
                                className="ring-2 ring-white/10 group-hover:ring-indigo-500/40 transition"
                              />
                            </div>
                            <div className="truncate">
                              <h3 className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition">
                                {item.fullName}
                              </h3>
                              <p className="text-xs text-slate-400 truncate">@{item.username}</p>
                            </div>
                          </div>

                          {item.bio && (
                            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4 bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.04]">
                              {item.bio}
                            </p>
                          )}
                        </div>

                        {!isSelf && (
                          <div className="pt-2 flex items-center gap-2">
                            {isFriend ? (
                              <span className="flex-1 text-center text-xs font-bold text-emerald-400 py-2.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                ✓ Friends
                              </span>
                            ) : hasSent ? (
                              <span className="flex-1 text-center text-xs font-semibold text-slate-400 py-2.5 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Request Sent
                              </span>
                            ) : (
                              <Button
                                onClick={() => handleSendFriendRequest(item.id)}
                                className="flex-1 py-2.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer font-semibold"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                Add Friend
                              </Button>
                            )}
                            <button
                              onClick={() => navigate(`/messages/${item.id}`)}
                              className="p-2.5 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-600 hover:text-white rounded-2xl transition cursor-pointer border border-indigo-500/20"
                              title="Send direct message"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* POSTS SECTION (Shown in 'all' or 'posts' tab) */}
            {(activeTab === 'all' || activeTab === 'posts') && posts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    Posts ({posts.length})
                  </h2>
                  {activeTab === 'all' && posts.length > 5 && (
                    <button
                      onClick={() => setActiveTab('posts')}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition cursor-pointer"
                    >
                      View all posts <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="max-w-2xl mx-auto space-y-5">
                  {(activeTab === 'all' ? posts.slice(0, 5) : posts).map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onPostDeleted={handlePostDeleted}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;
