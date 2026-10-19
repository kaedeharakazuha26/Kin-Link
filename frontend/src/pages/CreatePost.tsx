import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Avatar } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Image, Video, X, Loader2, ArrowLeft, Sparkles } from 'lucide-react';
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
    <div className="max-w-xl mx-auto py-8 px-4">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">Create New Post</h2>
          <span className="w-9" />
        </div>

        {/* User Identity */}
        <div className="flex items-center gap-3 mb-6">
          <Avatar src={user?.profilePicture} fallback={user?.fullName} size="md" />
          <div>
            <h3 className="text-sm font-bold text-gray-900">{user?.fullName}</h3>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700">
              Public Feed
            </span>
          </div>
        </div>

        {/* Content Input */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <textarea
            placeholder={`What's on your mind, ${user?.fullName ? user.fullName.split(' ')[0] : 'friend'}?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="w-full text-base sm:text-lg text-gray-800 placeholder:text-gray-400 focus:outline-none resize-none"
          />

          {/* Media Preview */}
          {mediaPreview && (
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-black/5 max-h-80 flex items-center justify-center">
              <button
                type="button"
                onClick={removeMedia}
                className="absolute top-3 right-3 p-1.5 bg-black/70 text-white rounded-full hover:bg-black transition cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>
              {mediaFile?.type.startsWith('video') ? (
                <video src={mediaPreview} controls className="max-h-80 object-contain" />
              ) : (
                <img src={mediaPreview} alt="Upload preview" className="max-h-80 object-contain" />
              )}
            </div>
          )}

          {/* Media Attachment Card */}
          <div className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-gray-700">Add to your post</span>
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
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                title="Photo / Video"
              >
                <Image className="w-5 h-5" />
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || (!content.trim() && !mediaFile)}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl transition duration-200 shadow-md shadow-indigo-500/20 text-base"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publishing...
              </>
            ) : (
              'Publish Post'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
