import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Menu, X, Bell, MessageCircle, Search } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useSocketStore } from '../store/useSocketStore';
import { Avatar } from '../components/ui/avatar';

const Layout: React.FC = () => {
  const { user } = useAuthStore();
  const { connectSocket } = useSocketStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      connectSocket(user.id);
    }
  }, [user?.id, connectSocket]);

  return (
    <div className="w-full flex h-screen overflow-hidden bg-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-8 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 sm:hidden"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Quick search input */}
            <div
              onClick={() => navigate('/discover')}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-full w-full max-w-xs text-gray-500 hover:bg-slate-200/70 transition cursor-pointer"
            >
              <Search className="w-4 h-4 text-gray-400" />
              <span className="text-xs sm:text-sm">Search Kin-Link friends...</span>
            </div>
          </div>

          {/* Action icons & profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate('/messages')}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition relative"
              title="Messages"
            >
              <MessageCircle className="w-5 h-5" />
            </button>

            <button
              onClick={() => navigate('/friends')}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition relative"
              title="Friend Requests"
            >
              <Bell className="w-5 h-5" />
              {(user?.friendRequestsReceived?.length ?? 0) > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>

            {user && (
              <div
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 cursor-pointer pl-2 border-l border-gray-200"
              >
                <Avatar src={user.profilePicture} fallback={user.fullName} size="sm" />
                <span className="hidden md:inline-block text-xs font-semibold text-gray-700">
                  {user.fullName.split(' ')[0]}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Outlet Pages */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
          <Outlet />
        </main>
      </div>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-20 sm:hidden"
        />
      )}
    </div>
  );
};

export default Layout;
