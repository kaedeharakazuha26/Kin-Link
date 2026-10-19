import React, { useState, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Avatar } from './ui/avatar';
import { Image, Video, Smile, X, Loader2 } from 'lucide-react';
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-5 transition">
      <div className="flex gap-3">
        <Avatar src={user?.profilePicture} fallback={user?.fullName} size="md" />
        <div className="flex-1">
          <textarea
            placeholder={`What's on your mind, ${user?.fullName ? user.fullName.split(' ')[0] : 'friend'}?`}
            value={content}
            onClick={() => setIsExpanded(true)}
            onChange={(e) => setContent(e.target.value)}
            rows={isExpanded ? 3 : 1}
            className="w-full bg-slate-50 border border-gray-200/80 rounded-xl px-4 py-2.5 text-sm sm:text-base text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
          />
        </div>
      </div>

      {/* Media Preview Box */}
      {mediaPreview && (
        <div className="relative mt-3 rounded-xl overflow-hidden border border-gray-200 bg-black/5 max-h-72 flex items-center justify-center">
          <button
            onClick={removeMedia}
            className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-full hover:bg-black transition cursor-pointer z-10"
          >
            <X className="w-4 h-4" />
          </button>
          {mediaFile?.type.startsWith('video') ? (
            <video src={mediaPreview} controls className="max-h-72 object-contain" />
          ) : (
            <img src={mediaPreview} alt="Upload preview" className="max-h-72 object-contain" />
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
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
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
          >
            <Image className="w-4 h-4" />
            <span>Photo/Video</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setContent((prev) => prev + ' 😊');
              setIsExpanded(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-amber-600 hover:bg-amber-50 transition cursor-pointer"
          >
            <Smile className="w-4 h-4" />
            <span>Feeling</span>
          </button>
        </div>

        {isExpanded && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false);
                removeMedia();
              }}
              className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && !mediaFile)}
              className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-medium text-xs sm:text-sm shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePostBox;
