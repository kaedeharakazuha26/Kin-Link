import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { User } from '../types';
import Loading from '../components/Loading';
import { Avatar } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { UserCheck, UserX, UserPlus, Users, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Friends: React.FC = () => {
  const { user } = useAuthStore();
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
        api.get('/users/search?q='),
      ]);

      if (reqRes.data.success) setRequests(reqRes.data.requests || []);
      if (friendsRes.data.success) setFriends(friendsRes.data.friends || []);
      if (sugRes.data.success) {
        // filter out already friends and self
        const existingIds = new Set([user.id, ...(user.friends || [])]);
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
  }, [user]);

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
      }
    } catch {
      toast.error('Failed to send request.');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) return;
    try {
      const res = await api.delete(`/users/friends/${friendId}`);
      if (res.data.success) {
        toast.success('Friend removed.');
        setFriends((prev) => prev.filter((f) => f.id !== friendId));
      }
    } catch {
      toast.error('Failed to remove friend.');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Friends & Community</h1>
          <p className="text-sm text-gray-500">Manage your connections and discover new peers.</p>
        </div>

        {/* Tab switcher */}
        <div className="flex p-1 rounded-xl bg-slate-200/80 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              activeTab === 'requests'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              activeTab === 'all'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              activeTab === 'suggestions'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Suggestions ({suggestions.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Requests */}
      {activeTab === 'requests' && (
        <div>
          {requests.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-200 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-2 text-indigo-300" />
              <p className="font-semibold text-gray-700">No pending friend requests</p>
              <p className="text-xs text-gray-400 mt-1">When someone sends you a request, it will show up here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {requests.map((requester) => (
                <div
                  key={requester.id}
                  className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex flex-col justify-between"
                >
                  <div
                    onClick={() => navigate(`/profile/${requester.id}`)}
                    className="flex items-center gap-3 cursor-pointer mb-4"
                  >
                    <Avatar src={requester.profilePicture} fallback={requester.fullName} size="lg" />
                    <div className="truncate">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{requester.fullName}</h3>
                      <p className="text-xs text-gray-400 truncate">@{requester.username}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAcceptRequest(requester.id)}
                      className="flex-1 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRejectRequest(requester.id)}
                      className="flex-1 py-1.5 text-xs rounded-xl"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: All Friends */}
      {activeTab === 'all' && (
        <div>
          {friends.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-200 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-2 text-indigo-300" />
              <p className="font-semibold text-gray-700">You don't have any friends yet</p>
              <p className="text-xs text-gray-400 mt-1">Check out suggestions or discover people to add!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex items-center justify-between"
                >
                  <div
                    onClick={() => navigate(`/profile/${friend.id}`)}
                    className="flex items-center gap-3 cursor-pointer truncate mr-2"
                  >
                    <Avatar src={friend.profilePicture} fallback={friend.fullName} size="md" />
                    <div className="truncate">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{friend.fullName}</h4>
                      <p className="text-xs text-gray-400 truncate">@{friend.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/messages/${friend.id}`)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                      title="Send message"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveFriend(friend.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                      title="Remove friend"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Suggestions */}
      {activeTab === 'suggestions' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {suggestions.map((person) => (
            <div
              key={person.id}
              className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex flex-col justify-between"
            >
              <div
                onClick={() => navigate(`/profile/${person.id}`)}
                className="flex items-center gap-3 cursor-pointer mb-4"
              >
                <Avatar src={person.profilePicture} fallback={person.fullName} size="lg" />
                <div className="truncate">
                  <h4 className="text-sm font-bold text-gray-900 truncate">{person.fullName}</h4>
                  <p className="text-xs text-gray-400 truncate">@{person.username}</p>
                </div>
              </div>

              <Button
                onClick={() => handleSendRequest(person.id)}
                className="w-full py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Friend
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Friends;
