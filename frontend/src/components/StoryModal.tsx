import React, { useState } from 'react';
import { ArrowLeft, Type, Upload, Loader2, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface StoryModalProps {
  setShowModal: (show: boolean) => void;
  fetchStories: () => Promise<void>;
}

const StoryModal: React.FC<StoryModalProps> = ({ setShowModal, fetchStories }) => {
  const bgColors = ['#4f46e5', '#7c3aed', '#db2777', '#e11d48', '#ca8a04', '#0d9488', '#0284c7'];

  const [mode, setMode] = useState<'text' | 'media'>('text');
  const [background, setBackground] = useState<string>(bgColors[0]);
  const [text, setText] = useState('');
  const [media, setMedia] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMedia(file);
      setPreviewUrl(URL.createObjectURL(file));
      setMode('media');
    }
  };

  const handleCreateStory = async () => {
    if (mode === 'text' && !text.trim()) {
      toast.error('Please write something for your story.');
      return;
    }
    if (mode === 'media' && !media) {
      toast.error('Please select an image or video.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('mediaType', mode === 'text' ? 'text' : media?.type.startsWith('video') ? 'video' : 'image');
      if (mode === 'text') {
        formData.append('content', text.trim());
        formData.append('background', background);
      } else if (media) {
        formData.append('media', media);
        if (text.trim()) formData.append('content', text.trim());
      }

      const res = await api.post('/stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        toast.success('Your story was published! Lasts 24 hours.');
        await fetchStories();
        setShowModal(false);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to publish story.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 min-h-screen bg-black/85 backdrop-blur-md text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#12122b] rounded-3xl border border-white/10 p-6 shadow-2xl">
        <div className="text-center mb-5 flex items-center justify-between">
          <button
            onClick={() => setShowModal(false)}
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold tracking-tight">Create My Day / Story</h2>
          <span className="w-9" />
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2 p-1 rounded-xl bg-white/5 mb-4">
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
              mode === 'text' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            Text Story
          </button>

          <label
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === 'media' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Photo / Video
            <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} className="hidden" />
          </label>
        </div>

        {/* Story Preview Frame */}
        <div
          className="rounded-2xl h-80 flex items-center justify-center relative overflow-hidden shadow-inner border border-white/10"
          style={{ backgroundColor: mode === 'text' ? background : '#000' }}
        >
          {mode === 'text' ? (
            <textarea
              className="bg-transparent text-white w-full h-full p-6 text-xl font-medium text-center flex items-center justify-center resize-none focus:outline-none placeholder:text-white/60"
              placeholder="Type your story message..."
              onChange={(e) => setText(e.target.value)}
              value={text}
              maxLength={200}
            />
          ) : previewUrl ? (
            media?.type?.startsWith('image') ? (
              <img src={previewUrl} alt="Preview" className="object-contain max-h-full max-w-full" />
            ) : (
              <video src={previewUrl} controls className="object-contain max-h-full max-w-full" />
            )
          ) : (
            <div className="text-center p-6 text-zinc-400">
              <Upload className="w-8 h-8 mx-auto mb-2 text-zinc-500" />
              <p className="text-sm">Click above to upload photo or video</p>
            </div>
          )}
        </div>

        {/* Background Colors for Text Mode */}
        {mode === 'text' && (
          <div className="flex mt-4 gap-2 justify-center">
            {bgColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setBackground(color)}
                className={`w-7 h-7 rounded-full border-2 transition transform hover:scale-110 cursor-pointer ${
                  background === color ? 'border-white scale-110 shadow-md' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleCreateStory}
          disabled={isSubmitting}
          className="w-full mt-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-semibold rounded-xl transition duration-200 shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Publishing Story...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Share to Story (24h)
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default StoryModal;
