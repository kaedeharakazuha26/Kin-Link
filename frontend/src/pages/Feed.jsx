import { useEffect, useState } from 'react';
import { dummyPostsData } from '../assets/assets';
import Loading from '../components/Loading';
import StoriesBar from '../components/StoriesBar';

const Feed = () => {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeeds = async () => {
    setFeeds(dummyPostsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchFeeds();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="h-full overflow-y-scroll no-scrollbar py-10 xl:pr-5 flex items-start justify-center xl:gap-8">
      {/* stories and posts */}
      <div>
        <StoriesBar/>
        <div className="p-4 space-y-6">
        <p>List of post</p>
        </div>
      </div>

      {/* Right Sidebar */}
      <div>
        <div>
          <h1>Ads</h1>
        </div>
        <h1>Recent Messages</h1>
      </div>
    </div>
  );
};

export default Feed;
