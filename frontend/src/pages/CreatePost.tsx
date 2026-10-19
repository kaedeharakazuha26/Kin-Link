import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Avatar } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Image, Video, X, Loader2, ArrowLeft, Sparkles, Send } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaFile) {
      toast.error('Please enter content or attach a photo/video.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (content.trim()) formData.append('content', content.trim());
      if (mediaFile) {
        formData.append('media', mediaFile);
        formData.append('mediaType', mediaFile.type.startsWith('video') ? 'video' : 'image');
      }

      const res = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        toast.success('Post published to your feed!');
        navigate('/');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to create post.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-[#090a10] py-8 px-4 sm:px-6 text-white flex justify-center">
      <div className="w-full max-w-xl bg-[#11131f] rounded-3xl shadow-2xl border border-white/[0.08] p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Create New Post
          </h2>
          <span className="w-9" />
        </div>

        {/* User Identity */}
        <div className="flex items-center gap-3">
          <Avatar src={user?.profilePicture} fallback={user?.fullName || 'User'} size="md" className="ring-1 ring-white/10" />
          <div>
            <h3 className="text-sm font-bold text-white">{user?.fullName}</h3>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Public Timeline
            </span>
          </div>
        </div>

        {/* Content Input Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <textarea
            placeholder={`What's on your mind, ${user?.fullName ? user.fullName.split(' ')[0] : 'friend'}?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="w-full bg-[#181b2c] border border-white/10 rounded-2xl p-4 text-sm sm:text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none transition shadow-inner"
          />

          {/* Media Preview */}
          {mediaPreview && (
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a0b12] max-h-80 flex items-center justify-center">
              <button
                type="button"
                onClick={removeMedia}
                className="absolute top-3 right-3 p-1.5 bg-black/80 text-white rounded-full hover:bg-black transition cursor-pointer z-10 border border-white/10 shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
              {mediaFile?.type.startsWith('video') ? (
                <video src={mediaPreview} controls className="max-h-80 object-contain rounded-2xl" />
              ) : (
                <img src={mediaPreview} alt="Upload preview" className="max-h-80 object-contain rounded-2xl" />
              )}
            </div>
          )}

          {/* Media Attachment Card */}
          <div className="bg-[#181b2c] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-300">Add to your post</span>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition cursor-pointer border border-emerald-500/20 flex items-center gap-1.5 text-xs font-semibold"
                title="Photo / Video"
              >
                <Image className="w-4 h-4" />
                <span>Media</span>
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || (!content.trim() && !mediaFile)}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:brightness-110 text-white font-bold rounded-2xl transition duration-200 shadow-lg shadow-indigo-600/30 text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Publish Post</span>
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
