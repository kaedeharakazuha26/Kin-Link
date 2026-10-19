import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { User } from '../types';
import Loading from '../components/Loading';
import { Avatar } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { UserCheck, UserX, UserPlus, Users, MessageCircle, UserMinus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Friends: React.FC = () => {
  const { user, updateUserProfileState } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'requests' | 'all' | 'suggestions'>('requests');
  const [requests, setRequests] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriendsData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [reqRes, friendsRes, sugRes] = await Promise.all([
        api.get('/users/requests'),
        api.get(`/users/${user.id}/friends`),
        api.get('/users/search?q=&excludeFriends=true'),
      ]);

      if (reqRes.data.success) setRequests(reqRes.data.requests || []);
      if (friendsRes.data.success) setFriends(friendsRes.data.friends || []);
      if (sugRes.data.success) {
        // filter out already friends and self
        const existingIds = new Set([user.id, ...(user.friends || []), ...(friendsRes.data.friends || []).map((f: User) => f.id)]);
        setSuggestions((sugRes.data.users || []).filter((u: User) => !existingIds.has(u.id)));
      }
    } catch (error) {
      console.error('Failed to load friends:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriendsData();
  }, [user?.id]);

  const handleAcceptRequest = async (requesterId: string) => {
    try {
      const res = await api.post(`/users/friends/accept/${requesterId}`);
      if (res.data.success) {
        toast.success('Friend request accepted!');
        const accepted = requests.find((r) => r.id === requesterId);
        if (accepted) {
          setFriends((prev) => [...prev, accepted]);
          setRequests((prev) => prev.filter((r) => r.id !== requesterId));
        }

        // Immediately update auth store to clear topbar & sidebar notification badge!
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
        toast.success('Friend request declined.');
        setRequests((prev) => prev.filter((r) => r.id !== requesterId));

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

  const handleSendRequest = async (targetId: string) => {
    try {
      const res = await api.post(`/users/friends/request/${targetId}`);
      if (res.data.success) {
        toast.success('Friend request sent!');
        setSuggestions((prev) => prev.filter((u) => u.id !== targetId));
        if (res.data.user) {
          updateUserProfileState(res.data.user);
        }
      }
    } catch {
      toast.error('Failed to send request.');
    }
  };

  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    if (!window.confirm(`Are you sure you want to unfriend ${friendName}?`)) return;
    try {
      const res = await api.delete(`/users/friends/${friendId}`);
      if (res.data.success) {
        toast.success(`Removed ${friendName} from friends.`);
        setFriends((prev) => prev.filter((f) => f.id !== friendId));

        if (res.data.user) {
          updateUserProfileState(res.data.user);
        } else {
          updateUserProfileState({
            friends: (user?.friends || []).filter((id) => id !== friendId),
          });
        }
      }
    } catch {
      toast.error('Failed to remove friend.');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-full bg-[#090a10] py-8 px-4 sm:px-8 text-white">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-indigo-400" />
              Friends & Community
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Manage incoming requests, connections, and suggestions.</p>
          </div>

          {/* Tab switcher */}
          <div className="flex p-1 rounded-2xl bg-[#141625] border border-white/10 text-xs font-semibold shrink-0">
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer ${
                activeTab === 'requests'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Requests ({requests.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Friends ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer ${
                activeTab === 'suggestions'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Suggestions ({suggestions.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Pending Friend Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="bg-[#11131f] rounded-3xl p-12 text-center border border-white/[0.08] shadow-xl text-slate-400">
                <UserCheck className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">No pending friend requests</h3>
                <p className="text-xs text-slate-400 mt-1">When someone sends you a friend request, it will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {requests.map((requester) => (
                  <div
                    key={requester.id}
                    className="bg-[#11131f] rounded-3xl p-5 border border-white/[0.08] shadow-xl flex flex-col justify-between hover:border-indigo-500/30 transition group"
                  >
                    <div>
                      <div
                        onClick={() => navigate(`/profile/${requester.id}`)}
                        className="flex items-center gap-3.5 cursor-pointer mb-3"
                      >
                        <Avatar src={requester.profilePicture} fallback={requester.fullName} size="lg" className="ring-1 ring-white/10" />
                        <div className="truncate">
                          <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition truncate">
                            {requester.fullName}
                          </h4>
                          <p className="text-xs text-slate-400 truncate">@{requester.username}</p>
                        </div>
                      </div>
                      {requester.bio && (
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4 bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.04]">
                          {requester.bio}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleAcceptRequest(requester.id)}
                        className="flex-1 py-2 text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white rounded-2xl flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20 font-bold"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleRejectRequest(requester.id)}
                        variant="outline"
                        className="flex-1 py-2 text-xs text-rose-400 border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 rounded-2xl flex items-center justify-center gap-1"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: All Friends (With Unfriend Option!) */}
        {activeTab === 'all' && (
          <div className="space-y-4">
            {friends.length === 0 ? (
              <div className="bg-[#11131f] rounded-3xl p-12 text-center border border-white/[0.08] shadow-xl text-slate-400">
                <Users className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">No friends yet</h3>
                <p className="text-xs text-slate-400 mt-1">Explore suggestions or search to grow your community.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="bg-[#11131f] rounded-3xl p-5 border border-white/[0.08] shadow-xl flex flex-col justify-between hover:border-indigo-500/30 transition group"
                  >
                    <div>
                      <div
                        onClick={() => navigate(`/profile/${friend.id}`)}
                        className="flex items-center gap-3.5 cursor-pointer mb-3"
                      >
                        <Avatar src={friend.profilePicture} fallback={friend.fullName} size="lg" className="ring-1 ring-white/10" />
                        <div className="truncate">
                          <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition truncate">
                            {friend.fullName}
                          </h4>
                          <p className="text-xs text-slate-400 truncate">@{friend.username}</p>
                        </div>
                      </div>
                      {friend.bio && (
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4 bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.04]">
                          {friend.bio}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => navigate(`/messages/${friend.id}`)}
                        className="flex-1 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center justify-center gap-1 shadow-md shadow-indigo-600/20 font-bold"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Message
                      </Button>
                      {/* Unfriend Button */}
                      <Button
                        onClick={() => handleRemoveFriend(friend.id, friend.fullName)}
                        className="py-2 px-3 text-xs text-rose-400 border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 rounded-2xl flex items-center justify-center gap-1 cursor-pointer"
                        title="Unfriend"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                        Unfriend
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Suggested Friends */}
        {activeTab === 'suggestions' && (
          <div className="space-y-4">
            {suggestions.length === 0 ? (
              <div className="bg-[#11131f] rounded-3xl p-12 text-center border border-white/[0.08] shadow-xl text-slate-400">
                <UserPlus className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">No new suggestions</h3>
                <p className="text-xs text-slate-400 mt-1">You are all caught up! Check back later for new peers.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {suggestions.map((person) => (
                  <div
                    key={person.id}
                    className="bg-[#11131f] rounded-3xl p-5 border border-white/[0.08] shadow-xl flex flex-col justify-between hover:border-indigo-500/30 transition group"
                  >
                    <div>
                      <div
                        onClick={() => navigate(`/profile/${person.id}`)}
                        className="flex items-center gap-3.5 cursor-pointer mb-3"
                      >
                        <Avatar src={person.profilePicture} fallback={person.fullName} size="lg" className="ring-1 ring-white/10" />
                        <div className="truncate">
                          <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition truncate">
                            {person.fullName}
                          </h4>
                          <p className="text-xs text-slate-400 truncate">@{person.username}</p>
                        </div>
                      </div>
                      {person.bio && (
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4 bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.04]">
                          {person.bio}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 flex gap-2">
                      <Button
                        onClick={() => handleSendRequest(person.id)}
                        className="flex-1 py-2 text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white rounded-2xl flex items-center justify-center gap-1 shadow-md shadow-indigo-600/20 font-bold"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Add Friend
                      </Button>
                      <button
                        onClick={() => navigate(`/messages/${person.id}`)}
                        className="p-2 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-600 hover:text-white rounded-2xl transition cursor-pointer border border-indigo-500/20"
                        title="Direct Message"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;
