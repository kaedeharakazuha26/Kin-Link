import { useState, useEffect, useRef } from "react";
import { dummyStoriesData } from "../assets/assets";
import { Plus } from "lucide-react";
import moment from 'moment'
import StoryModal from "./StoryModal";
import StoryViewer from "./StoryViewer";

const StoriesBar = () => {
  const [stories, setStories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewStory, setViewStory] = useState(null);
  const scrollRef = useRef(null);

  const fetchStories = async () => {
    setStories(dummyStoriesData);
  };

  useEffect(() => {
    fetchStories();
  }, []);

  // Convert vertical mouse-wheel into horizontal scroll for the stories strip
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e) => {
      // Leave native horizontal gestures (trackpads) alone
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;

      const canScrollLeft = el.scrollLeft > 0;
      const canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      const scrollingRight = e.deltaY > 0;

      // Only hijack the wheel when the strip can actually move that way —
      // otherwise the page keeps its normal vertical scroll
      if ((scrollingRight && canScrollRight) || (!scrollingRight && canScrollLeft)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <div ref={scrollRef} className="w-screen sm:w-[calc(100vw-200px)] lg:max-w-2xl no-scrollbar overflow-x-auto px-4">
      <div className="flex gap-4 pb-5">
        {/* add story card */}
        <div onClick={() => setShowModal(true)} className="rounded-lg shadow-sm min-w-28 max-w-28 max-h-40 aspect-3/4 cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-dashed border-indigo-300 bg-linear-to-b from-indigo-50 to-white">
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="size-10 bg-indigo-500 rounded-full flex items-center justify-center mb-3">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-medium text-slate-700 text-center">Create Story</p>
          </div>
        </div>

        {/* story cards */}
        {stories.map((story, index) => (
          <div onClick={() => setViewStory(story)} key={index} className={`relative rounded-lg shadow min-w-30 max-w-30 max-h-40 cursor-pointer hover:shadow-lg transition-all duration-200 bg-linear-to-b from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 active:scale-95`}>
            <img src={story.user.profile_picture} alt="" className='absolute size-8 top-3 left-3 z-10 rounded-full ring ring-gray-100 shadow' />
            <p className='absolute top-19 left-3 text-white/60 text-sm truncate max-w-24'>{story.content}</p>
            <p className='text-white absolute bottom-1 right-2 z-10 text-xs'>{moment(story.createdAt).fromNow()}</p>
            {
              story.media_type !== 'text' && (
                <div className='absolute inset-0 z-1 rounded-lg bg-black overflow-hidden'>
                  {
                    story.media_type === "image" ?
                      <img src={story.media_url} alt="" className='h-full w-full object-cover hover:scale-110 transition duration-500 opacity-70 hover:opacity-80' />

                      :
                      <video src={story.media_url} className='h-full w-full object-cover hover:scale-110 transition duration-500 opacity-70 hover:opacity-80' />
                  }

                </div>
              )
            }

          </div>
        ))}
      </div>

      {/*add story modal*/}
      {showModal && <StoryModal setShowModal={setShowModal} fetchStories={fetchStories} />}

      {/*view story modal*/}
      {viewStory && <StoryViewer viewStory={viewStory} setViewStory={setViewStory} />}

    </div>
  );
};

export default StoriesBar;
