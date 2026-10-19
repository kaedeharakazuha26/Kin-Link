import React, { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import StoryModal from './StoryModal';
import StoryViewer from './StoryViewer';
import { Story } from '../types';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { Avatar } from './ui/avatar';

const StoriesBar: React.FC = () => {
  const { user } = useAuthStore();
  const [stories, setStories] = useState<Story[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchStories = async () => {
    try {
      const res = await api.get('/stories');
      if (res.data.success) {
        setStories(res.data.stories || []);
      }
    } catch {
      // Fallback empty stories
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  // Horizontal scroll wheel handling
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      const canScrollLeft = el.scrollLeft > 0;
      const canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      const scrollingRight = e.deltaY > 0;

      if ((scrollingRight && canScrollRight) || (!scrollingRight && canScrollLeft)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const handleNextStory = () => {
    if (selectedStoryIndex !== null && selectedStoryIndex < stories.length - 1) {
      setSelectedStoryIndex(selectedStoryIndex + 1);
    } else {
      setSelectedStoryIndex(null);
    }
  };

  const handlePrevStory = () => {
    if (selectedStoryIndex !== null && selectedStoryIndex > 0) {
      setSelectedStoryIndex(selectedStoryIndex - 1);
    }
  };

  const currentViewStory = selectedStoryIndex !== null ? stories[selectedStoryIndex] : null;

  return (
    <>
      <div
        ref={scrollRef}
        className="w-full max-w-2xl no-scrollbar overflow-x-auto pb-2 flex gap-3 px-1 select-none"
      >
        {/* Create Story / My Day Card */}
        <div
          onClick={() => setShowModal(true)}
          className="relative min-w-[110px] w-[110px] h-[175px] rounded-3xl overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl transition duration-200 group border border-white/[0.08] bg-[#11131f] shrink-0 flex flex-col justify-between"
        >
          <div className="h-[120px] w-full overflow-hidden bg-[#181b2c] relative">
            <img
              src={user?.profilePicture}
              alt="Profile"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-90 group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition" />
          </div>

          <div className="absolute top-[102px] left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center ring-4 ring-[#11131f] shadow-lg group-hover:brightness-110 transition">
            <Plus className="w-4 h-4 stroke-[3]" />
          </div>

          <div className="h-[55px] pt-3 flex items-center justify-center bg-[#11131f] px-2 border-t border-white/[0.04]">
            <span className="text-[11px] font-bold text-white text-center leading-tight">
              Create Story
            </span>
          </div>
        </div>

        {/* Existing Stories List */}
        {stories.map((story, idx) => {
          const hasViewed = user ? story.views?.includes(user.id) : false;

          return (
            <div
              key={story.id}
              onClick={() => setSelectedStoryIndex(idx)}
              className="relative min-w-[110px] w-[110px] h-[175px] rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition duration-200 group border border-gray-200/80 shrink-0 flex flex-col justify-between p-2.5"
              style={{
                backgroundColor: story.background || '#1e1b4b',
              }}
            >
              {story.mediaUrl && (
                <img
                  src={story.mediaUrl}
                  alt="Story preview"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/75" />

              {/* Story Author Avatar with ring */}
              <div
                className={`relative z-10 w-9 h-9 rounded-full p-[2px] ${
                  hasViewed
                    ? 'ring-2 ring-gray-400/80'
                    : 'bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 ring-2 ring-white shadow-sm'
                }`}
              >
                <img
                  src={story.userProfilePicture}
                  alt={story.userName}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>

              {/* Story Author Name */}
              <div className="relative z-10 truncate">
                <span className="text-white text-xs font-semibold drop-shadow-md truncate block">
                  {story.userName.split(' ')[0]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Story Creation Modal */}
      {showModal && <StoryModal setShowModal={setShowModal} fetchStories={fetchStories} />}

      {/* Story Viewer Component */}
      {currentViewStory && (
        <StoryViewer
          viewStory={currentViewStory}
          setViewStory={() => setSelectedStoryIndex(null)}
          onNextStory={handleNextStory}
          onPrevStory={handlePrevStory}
        />
      )}
    </>
  );
};

export default StoriesBar;
