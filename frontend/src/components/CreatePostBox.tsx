import React, { useState, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Avatar } from './ui/avatar';
import { Image, Video, Smile, X, Loader2, Send } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { Post } from '../types';

interface CreatePostBoxProps {
  onPostCreated?: (newPost: Post) => void;
}

const CreatePostBox: React.FC<CreatePostBoxProps> = ({ onPostCreated }) => {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      setIsExpanded(true);
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
      toast.error('Please enter some text or select a photo/video.');
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

      if (res.data.success && res.data.post) {
        toast.success('Post published successfully!');
        setContent('');
        removeMedia();
        setIsExpanded(false);
        if (onPostCreated) {
          onPostCreated(res.data.post);
        }
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to create post.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#11131f] rounded-3xl shadow-xl border border-white/[0.08] p-4 sm:p-5 transition text-white">
      <div className="flex gap-3.5">
        <Avatar src={user?.profilePicture} fallback={user?.fullName || 'User'} size="md" className="ring-1 ring-white/10 shrink-0" />
        <div className="flex-1">
          <textarea
            placeholder={`What's on your mind, ${user?.fullName ? user.fullName.split(' ')[0] : 'friend'}?`}
            value={content}
            onClick={() => setIsExpanded(true)}
            onChange={(e) => setContent(e.target.value)}
            rows={isExpanded ? 3 : 1}
            className="w-full bg-[#181b2c] border border-white/10 rounded-2xl px-4 py-3 text-sm sm:text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none transition shadow-inner"
          />
        </div>
      </div>

      {/* Media Preview Box */}
      {mediaPreview && (
        <div className="relative mt-3.5 rounded-2xl overflow-hidden border border-white/10 bg-[#0a0b12] max-h-80 flex items-center justify-center">
          <button
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

      {/* Action Footer */}
      <div className="mt-3.5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-1 sm:gap-2">
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
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-emerald-400 hover:bg-emerald-500/10 transition cursor-pointer"
          >
            <Image className="w-4 h-4" />
            <span>Photo / Video</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setContent((prev) => prev + ' 😊');
              setIsExpanded(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-amber-400 hover:bg-amber-500/10 transition cursor-pointer"
          >
            <Smile className="w-4 h-4" />
            <span>Feeling</span>
          </button>
        </div>

        {isExpanded && (
          <button
            onClick={handleSubmit}
            disabled={(!content.trim() && !mediaFile) || isSubmitting}
            className="px-5 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:brightness-110 disabled:opacity-40 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Post</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default CreatePostBox;
