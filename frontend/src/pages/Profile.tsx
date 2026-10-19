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
  UserMinus,
  MessageCircle,
  Camera,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const { profileId } = useParams<{ profileId?: string }>();
  const navigate = useNavigate();
  const { user: currentUser, updateUserProfileState } = useAuthStore();

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
  const [previewProfilePic, setPreviewProfilePic] = useState<string | null>(null);
  const [previewCoverPic, setPreviewCoverPic] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const fetchProfileData = async () => {
    const actualTarget = profileId || currentUser?.id || 'me';
    setLoading(true);
    try {
      const [profileRes, postsRes, friendsRes] = await Promise.allSettled([
        api.get(`/users/${actualTarget}`),
        api.get(`/posts/user/${actualTarget}`),
        api.get(`/users/${actualTarget}/friends`),
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value.data.success) {
        const u = profileRes.value.data.user;
        setProfile(u);
        setIsFriend(profileRes.value.data.isFriend);
        setHasSentRequest(profileRes.value.data.hasSentRequest);
        setHasReceivedRequest(profileRes.value.data.hasReceivedRequest);
        setIsSelf(profileRes.value.data.isSelf || u.id === currentUser?.id);

        setEditFullName(u.fullName || '');
        setEditBio(u.bio || '');
        setEditLocation(u.location || '');
      } else if (currentUser && (!profileId || profileId === currentUser.id || profileId === 'me')) {
        setProfile(currentUser);
        setIsSelf(true);
        setEditFullName(currentUser.fullName || '');
        setEditBio(currentUser.bio || '');
        setEditLocation(currentUser.location || '');
      }

      if (postsRes.status === 'fulfilled' && postsRes.value.data.success) {
        setPosts(postsRes.value.data.posts || []);
      }

      if (friendsRes.status === 'fulfilled' && friendsRes.value.data.success) {
        setFriends(friendsRes.value.data.friends || []);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      if (currentUser && (!profileId || profileId === currentUser.id || profileId === 'me')) {
        setProfile(currentUser);
        setIsSelf(true);
      } else {
        toast.error('Could not load profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [profileId, currentUser?.id]);

  const handleAvatarFileSelect = (file: File | null) => {
    setEditProfilePic(file);
    if (file) {
      setPreviewProfilePic(URL.createObjectURL(file));
    } else {
      setPreviewProfilePic(null);
    }
  };

  const handleCoverFileSelect = (file: File | null) => {
    setEditCoverPic(file);
    if (file) {
      setPreviewCoverPic(URL.createObjectURL(file));
    } else {
      setPreviewCoverPic(null);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!profile) return;
    try {
      const res = await api.post(`/users/friends/request/${profile.id}`);
      if (res.data.success) {
        setHasSentRequest(true);
        if (res.data.user) {
          updateUserProfileState(res.data.user);
        }
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
        setFriends((prev) => [...prev, profile]);
        if (res.data.user) {
          updateUserProfileState(res.data.user);
        } else {
          updateUserProfileState({
            friends: [...(currentUser?.friends || []), profile.id],
            friendRequestsReceived: (currentUser?.friendRequestsReceived || []).filter((id) => id !== profile.id),
          });
        }
        toast.success('Friend request accepted!');
      }
    } catch {
      toast.error('Failed to accept request.');
    }
  };

  const handleRemoveFriend = async () => {
    if (!profile) return;
    if (!window.confirm(`Are you sure you want to unfriend ${profile.fullName}?`)) return;
    try {
      const res = await api.delete(`/users/friends/${profile.id}`);
      if (res.data.success) {
        setIsFriend(false);
        setFriends((prev) => prev.filter((f) => f.id !== profile.id));
        if (res.data.user) {
          updateUserProfileState(res.data.user);
        } else {
          updateUserProfileState({
            friends: (currentUser?.friends || []).filter((id) => id !== profile.id),
          });
        }
        toast.success(`Unfriended ${profile.fullName}.`);
      }
    } catch {
      toast.error('Failed to unfriend user.');
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
        setPreviewProfilePic(null);
        setPreviewCoverPic(null);
        setEditProfilePic(null);
        setEditCoverPic(null);
      }
    } catch {
      toast.error('Failed to save profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (loading) return <Loading />;
  if (!profile) return <div className="p-12 text-center text-slate-400">User not found.</div>;

  return (
    <div className="min-h-full bg-[#090a10] py-6 px-4 sm:px-8 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Cover & Avatar Header Card */}
        <div className="bg-[#11131f] rounded-3xl overflow-hidden shadow-2xl border border-white/[0.08]">
          {/* Cover Photo */}
          <div className="h-48 sm:h-72 w-full relative bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 overflow-hidden">
            {profile.coverPhoto && (
              <img src={profile.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
            )}
            {isSelf && (
              <button
                onClick={() => setShowEditModal(true)}
                className="absolute bottom-4 right-4 px-3.5 py-2 bg-[#0d0f18]/80 hover:bg-[#0d0f18] text-white rounded-2xl text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition border border-white/10 shadow-lg cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-indigo-400" />
                Change Cover
              </button>
            )}
          </div>

          {/* Profile Info Bar */}
          <div className="px-6 sm:px-8 pb-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
              <div className="relative">
                <Avatar
                  src={profile.profilePicture}
                  fallback={profile.fullName}
                  size="xl"
                  className="w-28 h-28 sm:w-36 sm:h-36 ring-4 ring-[#11131f] shadow-2xl"
                />
                {isSelf && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="absolute bottom-1 right-1 p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:brightness-110 shadow-lg transition cursor-pointer border-2 border-[#11131f]"
                    title="Change avatar"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="mb-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{profile.fullName}</h1>
                <p className="text-xs sm:text-sm font-semibold text-indigo-400 mt-0.5">@{profile.username}</p>
                <div className="flex items-center justify-center sm:justify-start gap-4 mt-2.5 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-xl border border-white/5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <strong className="text-white">{friends.length}</strong> {friends.length === 1 ? 'friend' : 'friends'}
                  </span>
                  {profile.location && (
                    <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-xl border border-white/5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
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
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  {isFriend ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 px-3 py-2 text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 rounded-2xl text-xs font-bold">
                        <UserCheck className="w-4 h-4" />
                        Friends
                      </span>
                      <Button
                        onClick={handleRemoveFriend}
                        className="text-xs text-rose-400 border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 rounded-2xl flex items-center gap-1 cursor-pointer py-2 px-3"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                        Unfriend
                      </Button>
                    </div>
                  ) : hasReceivedRequest ? (
                    <Button
                      onClick={handleAcceptRequest}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold px-4 py-2 shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      Accept Request
                    </Button>
                  ) : hasSentRequest ? (
                    <Button disabled className="text-slate-400 bg-white/5 border border-white/10 rounded-2xl text-xs px-4 py-2">
                      Request Sent
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSendFriendRequest}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold px-4 py-2 shadow-md shadow-indigo-600/20 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add Friend
                    </Button>
                  )}

                  <Button
                    onClick={() => navigate(`/messages/${profile.id}`)}
                    className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold px-4 py-2 border border-white/10 transition cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-indigo-400" />
                    Message
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Bio card */}
          {profile.bio && (
            <div className="px-6 sm:px-8 pb-6">
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#0d0f18]/60 p-4 rounded-2xl border border-white/[0.04]">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Tabs Navigation */}
          <div className="flex items-center gap-3 px-6 sm:px-8 border-t border-white/[0.06] pt-3 pb-3 bg-[#0d0f18]/30">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'posts'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Posts ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab('friends')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'friends'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Friends ({friends.length})
            </button>
          </div>
        </div>

        {/* Tab Content Area */}
        {activeTab === 'posts' && (
          <div className="space-y-5">
            {posts.length === 0 ? (
              <div className="bg-[#11131f] rounded-3xl p-10 text-center border border-white/[0.08] shadow-xl text-slate-400">
                <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white">No posts yet</h4>
                <p className="text-xs text-slate-500 mt-1">This timeline is currently empty.</p>
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
              <div className="col-span-full bg-[#11131f] rounded-3xl p-10 text-center border border-white/[0.08] text-slate-400">
                No friends added yet.
              </div>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.id}
                  onClick={() => navigate(`/profile/${friend.id}`)}
                  className="bg-[#11131f] rounded-3xl p-4 border border-white/[0.08] flex items-center gap-3 cursor-pointer hover:border-indigo-500/40 transition group shadow-lg"
                >
                  <Avatar src={friend.profilePicture} fallback={friend.fullName} size="md" className="ring-1 ring-white/10" />
                  <div className="truncate flex-1">
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition truncate">{friend.fullName}</h4>
                    <p className="text-[11px] text-slate-400 truncate">@{friend.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Edit Profile Modal (Dark Obsidian Acrylic Theme with Crisp White Input Text!) */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#11131f] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-white/10 text-white">
              <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-400" />
                  Edit Profile
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
                {/* Full Name Input - Explicit Crisp White Text */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full bg-[#181b2c] border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner"
                    placeholder="Your full name"
                    required
                  />
                </div>

                {/* Bio Input - Explicit Crisp White Text */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Bio / Status
                  </label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={3}
                    className="w-full bg-[#181b2c] border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none transition shadow-inner"
                    placeholder="Tell friends about yourself..."
                  />
                </div>

                {/* Location Input - Explicit Crisp White Text */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA"
                    className="w-full bg-[#181b2c] border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner"
                  />
                </div>

                {/* Media Pickers with Instant Live Previews */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Avatar Picker */}
                  <div className="p-3 bg-[#181b2c] rounded-2xl border border-white/10">
                    <label className="block text-xs font-bold text-slate-300 mb-2">Avatar Photo</label>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-[#0d0f18] border border-white/10 flex items-center justify-center">
                        {previewProfilePic ? (
                          <img src={previewProfilePic} alt="Preview Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <Avatar src={profile?.profilePicture} fallback={profile?.fullName || 'User'} size="md" />
                        )}
                      </div>
                      <label className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-indigo-300 rounded-xl border border-white/10 text-xs font-semibold text-center cursor-pointer transition">
                        <span>{previewProfilePic ? 'Change' : 'Browse'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleAvatarFileSelect(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Cover Picker */}
                  <div className="p-3 bg-[#181b2c] rounded-2xl border border-white/10">
                    <label className="block text-xs font-bold text-slate-300 mb-2">Cover Photo</label>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-14 rounded-2xl overflow-hidden shrink-0 bg-[#0d0f18] border border-white/10 flex items-center justify-center">
                        {previewCoverPic ? (
                          <img src={previewCoverPic} alt="Preview Cover" className="w-full h-full object-cover" />
                        ) : profile?.coverPhoto ? (
                          <img src={profile.coverPhoto} alt="Current Cover" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <label className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-indigo-300 rounded-xl border border-white/10 text-xs font-semibold text-center cursor-pointer transition">
                        <span>{previewCoverPic ? 'Change' : 'Browse'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleCoverFileSelect(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/[0.08]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false);
                      setPreviewProfilePic(null);
                      setPreviewCoverPic(null);
                    }}
                    className="rounded-2xl text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingProfile}
                    className="rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:brightness-110 text-white font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                  >
                    {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
