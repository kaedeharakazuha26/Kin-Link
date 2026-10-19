import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  Menu,
  X,
  Bell,
  MessageSquare,
  Search,
  Sparkles,
  PlusCircle,
  Home,
  Users2,
  Compass,
  User as UserIcon,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useSocketStore } from '../store/useSocketStore';
import { Avatar } from '../components/ui/avatar';

const Layout: React.FC = () => {
  const { user } = useAuthStore();
  const { connectSocket } = useSocketStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user?.id) {
      connectSocket(user.id);
    }
  }, [user?.id, connectSocket]);

  const friendRequestsCount = user?.friendRequestsReceived?.length ?? 0;

  return (
    <div className="w-full flex h-screen overflow-hidden bg-[#090a10] font-sans antialiased text-slate-100 select-none-mobile">
      {/* Redesigned Glass Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#f4f6fa]">
        {/* Sleek Frosted Top Navbar */}
        <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between shrink-0 z-20 shadow-xs">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 sm:hidden transition cursor-pointer"
              aria-label="Toggle navigation"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Omni Search Box */}
            <div
              onClick={() => navigate('/discover')}
              className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-100/90 hover:bg-slate-200/80 rounded-2xl w-full max-w-sm text-slate-500 transition-all duration-150 cursor-pointer border border-transparent hover:border-slate-300/60"
            >
              <Search className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-slate-500 truncate">
                Search friends, stories, posts...
              </span>
              <kbd className="hidden md:inline-flex ml-auto text-[10px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Quick Action Navigation & Profile Avatar */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/messages')}
              className="p-2.5 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 transition relative cursor-pointer"
              title="Messages"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            <button
              onClick={() => navigate('/friends')}
              className="p-2.5 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 transition relative cursor-pointer"
              title="Notifications & Requests"
            >
              <Bell className="w-5 h-5" />
              {friendRequestsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {friendRequestsCount}
                </span>
              )}
            </button>

            {user && (
              <div
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200/80 cursor-pointer group"
                title="View Profile"
              >
                <div className="relative">
                  <Avatar
                    src={user.profilePicture}
                    fallback={user.fullName}
                    size="sm"
                    className="ring-2 ring-indigo-500/20 group-hover:ring-indigo-500 transition"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition truncate max-w-[100px]">
                    {user.fullName.split(' ')[0]}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">Online</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Outlet Pages */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-16 sm:pb-0">
          <Outlet />
        </main>

        {/* Floating Mobile Bottom Navigation Dock */}
        <nav className="sm:hidden fixed bottom-3 left-4 right-4 z-30 bg-[#0d0f18]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-1.5 shadow-2xl flex items-center justify-around">
          <Link
            to="/"
            className={`p-2.5 rounded-2xl flex flex-col items-center gap-1 transition ${
              location.pathname === '/' ? 'text-indigo-400 bg-white/10' : 'text-slate-400'
            }`}
          >
            <Home className="w-5 h-5" />
          </Link>

          <Link
            to="/discover"
            className={`p-2.5 rounded-2xl flex flex-col items-center gap-1 transition ${
              location.pathname === '/discover' ? 'text-indigo-400 bg-white/10' : 'text-slate-400'
            }`}
          >
            <Compass className="w-5 h-5" />
          </Link>

          <Link
            to="/create-post"
            className="p-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-lg shadow-indigo-500/30 active:scale-95 transition"
          >
            <PlusCircle className="w-5 h-5" />
          </Link>

          <Link
            to="/messages"
            className={`p-2.5 rounded-2xl flex flex-col items-center gap-1 transition ${
              location.pathname.startsWith('/messages') ? 'text-indigo-400 bg-white/10' : 'text-slate-400'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
          </Link>

          <Link
            to="/profile"
            className={`p-2.5 rounded-2xl flex flex-col items-center gap-1 transition ${
              location.pathname.startsWith('/profile') ? 'text-indigo-400 bg-white/10' : 'text-slate-400'
            }`}
          >
            <UserIcon className="w-5 h-5" />
          </Link>
        </nav>
      </div>

      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 sm:hidden transition-opacity"
        />
      )}
    </div>
  );
};

export default Layout;
