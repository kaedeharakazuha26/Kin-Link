import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MenuItems from './MenuItems';
import { CirclePlus, LogOut, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Avatar } from './ui/avatar';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const closeOnMobile = () => {
    if (setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div
      className={`w-64 xl:w-72 bg-white border-r border-gray-200 flex flex-col justify-between items-center max-sm:fixed top-0 bottom-0 left-0 z-30 h-full ${
        sidebarOpen ? 'translate-x-0' : 'max-sm:-translate-x-full'
      } transition-transform duration-300 ease-in-out`}
    >
      <div className="w-full">
        {/* Brand header */}
        <div
          onClick={() => {
            navigate('/');
            closeOnMobile();
          }}
          className="flex items-center gap-3 px-6 py-5 cursor-pointer select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[2px] shadow-sm">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
              Kin-Link
            </h1>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-gray-400">Social Network</p>
          </div>
        </div>

        <hr className="border-gray-200 mb-6" />

        <MenuItems setSidebarOpen={setSidebarOpen} />

        <div className="px-5 mt-6">
          <Link
            to="/create-post"
            onClick={closeOnMobile}
            className="flex items-center justify-center gap-2 py-2.5 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-98 transition text-white shadow-md shadow-indigo-500/20 font-medium text-sm cursor-pointer"
          >
            <CirclePlus className="w-5 h-5" />
            <span>Create Post</span>
          </Link>
        </div>
      </div>

      {/* User profile footer */}
      {user && (
        <div className="w-full border-t border-gray-200 p-4 px-5 flex items-center justify-between bg-gray-50/50">
          <div
            onClick={() => {
              navigate('/profile');
              closeOnMobile();
            }}
            className="flex gap-3 items-center cursor-pointer overflow-hidden flex-1 mr-2"
          >
            <Avatar src={user.profilePicture} fallback={user.fullName} size="md" />
            <div className="truncate">
              <h2 className="text-sm font-semibold text-gray-800 truncate">{user.fullName}</h2>
              <p className="text-xs text-gray-500 truncate">@{user.username}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
