import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { User, Post } from '../types';
import PostCard from '../components/PostCard';
import Loading from '../components/Loading';
import { Avatar } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import {
  MapPin,
  Calendar,
  Users,
  Edit3,
  UserPlus,
  UserCheck,
  MessageCircle,
  Camera,
  Loader2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const { profileId } = useParams<{ profileId?: string }>();
  const navigate = useNavigate();
  const { user: currentUser, updateUserProfileState } = useAuthStore();

  const targetId = profileId || currentUser?.id || 'me';

  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Friendship statuses
  const [isFriend, setIsFriend] = useState(false);
  const [hasSentRequest, setHasSentRequest] = useState(false);
  const [hasReceivedRequest, setHasReceivedRequest] = useState(false);
  const [isSelf, setIsSelf] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'posts' | 'friends' | 'about'>('posts');

  // Edit Profile Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editProfilePic, setEditProfilePic] = useState<File | null>(null);
  const [editCoverPic, setEditCoverPic] = useState<File | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const fetchProfileData = async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      const [profileRes, postsRes, friendsRes] = await Promise.all([
        api.get(`/users/${targetId}`),
        api.get(`/posts/user/${targetId}`),
        api.get(`/users/${targetId}/friends`),
      ]);

      if (profileRes.data.success) {
        setProfile(profileRes.data.user);
        setIsFriend(profileRes.data.isFriend);
        setHasSentRequest(profileRes.data.hasSentRequest);
        setHasReceivedRequest(profileRes.data.hasReceivedRequest);
        setIsSelf(profileRes.data.isSelf);

        // Pre-fill edit modal fields
        setEditFullName(profileRes.data.user.fullName || '');
        setEditBio(profileRes.data.user.bio || '');
        setEditLocation(profileRes.data.user.location || '');
      }

      if (postsRes.data.success) {
        setPosts(postsRes.data.posts || []);
      }

      if (friendsRes.data.success) {
        setFriends(friendsRes.data.friends || []);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Could not load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [targetId]);

  const handleSendFriendRequest = async () => {
    if (!profile) return;
    try {
      const res = await api.post(`/users/friends/request/${profile.id}`);
      if (res.data.success) {
        setHasSentRequest(true);
        toast.success('Friend request sent!');
      }
    } catch {
      toast.error('Could not send friend request.');
    }
  };

  const handleAcceptRequest = async () => {
    if (!profile) return;
    try {
      const res = await api.post(`/users/friends/accept/${profile.id}`);
      if (res.data.success) {
        setIsFriend(true);
        setHasReceivedRequest(false);
        toast.success('Friend request accepted!');
      }
    } catch {
      toast.error('Failed to accept request.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append('fullName', editFullName);
      formData.append('bio', editBio);
      formData.append('location', editLocation);
      if (editProfilePic) formData.append('profilePicture', editProfilePic);
      if (editCoverPic) formData.append('coverPhoto', editCoverPic);

      const res = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success && res.data.user) {
        setProfile(res.data.user);
        updateUserProfileState(res.data.user);
        toast.success('Profile updated successfully!');
        setShowEditModal(false);
      }
    } catch {
      toast.error('Failed to save profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (loading) return <Loading />;
  if (!profile) return <div className="p-8 text-center text-gray-500">User not found.</div>;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Cover & Avatar Header Card */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-200/80">
        {/* Cover Photo */}
        <div className="h-48 sm:h-72 w-full relative bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
          {profile.coverPhoto && (
            <img src={profile.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
          )}
          {isSelf && (
            <button
              onClick={() => setShowEditModal(true)}
              className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-xl text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              Edit Cover
            </button>
          )}
        </div>

        {/* Profile Info Bar */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            <div className="relative">
              <Avatar
                src={profile.profilePicture}
                fallback={profile.fullName}
                size="xl"
                className="w-28 h-28 sm:w-36 sm:h-36 ring-4 ring-white shadow-lg"
              />
              {isSelf && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="absolute bottom-1 right-1 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-md transition cursor-pointer"
                  title="Change avatar"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="mb-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{profile.fullName}</h1>
              <p className="text-sm font-medium text-gray-500">@{profile.username}</p>
              <div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <strong>{friends.length}</strong> {friends.length === 1 ? 'friend' : 'friends'}
                </span>
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {profile.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 mb-2">
            {isSelf ? (
              <Button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-gray-800 font-semibold text-xs sm:text-sm px-4 py-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </Button>
            ) : (
              <>
                {isFriend ? (
                  <Button
                    variant="outline"
                    className="flex items-center gap-1.5 text-emerald-700 border-emerald-200 bg-emerald-50 rounded-xl"
                  >
                    <UserCheck className="w-4 h-4" />
                    Friends
                  </Button>
                ) : hasReceivedRequest ? (
                  <Button
                    onClick={handleAcceptRequest}
                    className="flex items-center gap-1.5 bg-indigo-600 text-white rounded-xl shadow-xs"
                  >
                    <UserPlus className="w-4 h-4" />
                    Confirm Request
                  </Button>
                ) : hasSentRequest ? (
                  <Button variant="outline" disabled className="text-gray-500 rounded-xl">
                    Request Pending
                  </Button>
                ) : (
                  <Button
                    onClick={handleSendFriendRequest}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Friend
                  </Button>
                )}

                <Button
                  onClick={() => navigate(`/messages/${profile.id}`)}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Bio Text */}
        {profile.bio && (
          <div className="px-6 pb-6 text-sm text-gray-700 border-t border-gray-100 pt-4 leading-relaxed">
            {profile.bio}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 flex gap-4 border-t border-gray-200 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-3.5 border-b-2 transition ${
              activeTab === 'posts'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`py-3.5 border-b-2 transition ${
              activeTab === 'friends'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Friends ({friends.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'posts' && (
        <div className="space-y-5">
          {posts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400 border border-gray-200/80">
              No posts shared yet.
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'friends' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {friends.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl p-8 text-center text-gray-400 border border-gray-200/80">
              No friends to display yet.
            </div>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.id}
                onClick={() => navigate(`/profile/${friend.id}`)}
                className="bg-white rounded-2xl p-4 border border-gray-200/80 flex items-center gap-3 cursor-pointer hover:shadow-md transition"
              >
                <Avatar src={friend.profilePicture} fallback={friend.fullName} size="lg" />
                <div className="truncate">
                  <h4 className="text-sm font-bold text-gray-900 truncate">{friend.fullName}</h4>
                  <p className="text-xs text-gray-500 truncate">@{friend.username}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Edit Profile</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Bio / Status
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Tell friends about yourself..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Change Avatar</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditProfilePic(e.target.files?.[0] || null)}
                    className="text-xs text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Change Cover</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditCoverPic(e.target.files?.[0] || null)}
                    className="text-xs text-gray-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingProfile}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2"
                >
                  {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
