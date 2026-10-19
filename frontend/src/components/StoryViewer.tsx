import React, { useEffect, useState } from 'react';
import { Story } from '../types';
import { X, BadgeCheck } from 'lucide-react';
import { api } from '../services/api';
import { Avatar } from './ui/avatar';

interface StoryViewerProps {
  viewStory: Story | null;
  setViewStory: (story: Story | null) => void;
  onNextStory?: () => void;
  onPrevStory?: () => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({
  viewStory,
  setViewStory,
  onNextStory,
  onPrevStory,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!viewStory) return;

    // Mark as viewed on backend
    api.post(`/stories/${viewStory.id}/view`).catch(() => {});

    if (viewStory.mediaType !== 'video') {
      setProgress(0);
      const duration = 6000; // 6 seconds per story
      const step = 60;
      let elapsed = 0;

      const progressInterval = setInterval(() => {
        elapsed += step;
        const currentProgress = (elapsed / duration) * 100;
        setProgress(Math.min(currentProgress, 100));
      }, step);

      const timer = setTimeout(() => {
        if (onNextStory) {
          onNextStory();
        } else {
          setViewStory(null);
        }
      }, duration);

      return () => {
        clearTimeout(timer);
        clearInterval(progressInterval);
      };
    }
  }, [viewStory, setViewStory, onNextStory]);

  if (!viewStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center select-none">
      {/* Progress Bar Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex gap-1.5 max-w-lg mx-auto">
        <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-75 ease-linear rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* User Info Header */}
      <div className="absolute top-8 left-4 right-4 z-20 flex items-center justify-between max-w-lg mx-auto px-2">
        <div className="flex items-center gap-3">
          <Avatar src={viewStory.userProfilePicture} fallback={viewStory.userName} size="sm" />
          <div className="text-white drop-shadow">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm">{viewStory.userName}</span>
              <BadgeCheck className="w-4 h-4 text-indigo-400 fill-current" />
            </div>
            <span className="text-[11px] text-zinc-300">@{viewStory.userUsername}</span>
          </div>
        </div>

        <button
          onClick={() => setViewStory(null)}
          className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Click zones for navigation */}
      <div
        onClick={onPrevStory}
        className="absolute left-0 top-0 bottom-0 w-1/4 z-10 cursor-pointer"
        title="Previous"
      />
      <div
        onClick={onNextStory || (() => setViewStory(null))}
        className="absolute right-0 top-0 bottom-0 w-1/4 z-10 cursor-pointer"
        title="Next"
      />

      {/* Story Content Container */}
      <div className="w-full max-w-md h-[85vh] max-h-[750px] mx-4 rounded-3xl overflow-hidden flex items-center justify-center shadow-2xl relative">
        {viewStory.mediaType === 'image' && viewStory.mediaUrl && (
          <img
            src={viewStory.mediaUrl}
            alt="Story"
            className="w-full h-full object-contain bg-black"
          />
        )}

        {viewStory.mediaType === 'video' && viewStory.mediaUrl && (
          <video
            src={viewStory.mediaUrl}
            autoPlay
            controls
            onEnded={() => (onNextStory ? onNextStory() : setViewStory(null))}
            className="w-full h-full object-contain bg-black"
          />
        )}

        {viewStory.mediaType === 'text' && (
          <div
            className="w-full h-full flex items-center justify-center p-8 text-white text-2xl font-bold text-center leading-relaxed"
            style={{ backgroundColor: viewStory.background || '#4f46e5' }}
          >
            {viewStory.content}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
