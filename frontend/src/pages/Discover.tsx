import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { useAuthStore } from '../store/useAuthStore';
import { Avatar } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Search, UserPlus, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Discover: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async (searchTerm = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(searchTerm)}`);
      if (res.data.success) {
        setUsers(res.data.users || []);
      }
    } catch {
      toast.error('Search failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchUsers('');
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchUsers(query);
  };

  const handleSendFriendRequest = async (targetId: string) => {
    try {
      const res = await api.post(`/users/friends/request/${targetId}`);
      if (res.data.success) {
        toast.success('Friend request sent!');
      }
    } catch {
      toast.error('Could not send friend request.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header & Search */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Discover People</h1>
        <p className="text-sm text-gray-500 mt-0.5">Find classmates, coworkers, creators, and new friends on LINK.</p>

        <form onSubmit={handleSearchSubmit} className="mt-5 relative max-w-xl">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by full name or username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-28 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
          <Button
            type="submit"
            className="absolute right-2 top-2 rounded-xl text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Search
          </Button>
        </form>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 text-gray-400">
          <Sparkles className="w-10 h-10 mx-auto mb-2 text-indigo-300" />
          <p className="font-semibold text-gray-700">No users found</p>
          <p className="text-xs text-gray-400 mt-1">Try searching with a different term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {users.map((item) => {
            const isFriend = user?.friends?.includes(item.id);
            const isSelf = user?.id === item.id;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div
                    onClick={() => navigate(`/profile/${item.id}`)}
                    className="flex items-center gap-3.5 cursor-pointer mb-3"
                  >
                    <Avatar src={item.profilePicture} fallback={item.fullName} size="lg" />
                    <div className="truncate">
                      <h3 className="text-sm font-bold text-gray-900 truncate hover:underline">
                        {item.fullName}
                      </h3>
                      <p className="text-xs text-gray-400 truncate">@{item.username}</p>
                    </div>
                  </div>

                  {item.bio && (
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-4">
                      {item.bio}
                    </p>
                  )}
                </div>

                {!isSelf && (
                  <div className="pt-2 flex items-center gap-2">
                    {isFriend ? (
                      <span className="flex-1 text-center text-xs font-semibold text-emerald-600 py-2 bg-emerald-50 rounded-xl">
                        ✓ Friends
                      </span>
                    ) : (
                      <Button
                        onClick={() => handleSendFriendRequest(item.id)}
                        className="flex-1 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Add Friend
                      </Button>
                    )}
                    <button
                      onClick={() => navigate(`/messages/${item.id}`)}
                      className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition cursor-pointer"
                      title="Send message"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Discover;
