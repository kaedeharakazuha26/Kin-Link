import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MenuItems from './MenuItems';
import { Plus, LogOut, Sparkles, User, Settings, ExternalLink } from 'lucide-react';
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
    <aside
      className={`fixed sm:static top-0 bottom-0 left-0 z-40 w-72 h-screen flex flex-col justify-between shrink-0 bg-[#0d0f18] border-r border-white/[0.08] text-slate-200 shadow-2xl transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'
        }`}
    >
      <div className="flex flex-col h-full overflow-y-auto no-scrollbar justify-between">
        {/* Top Header Section */}
        <div>
          {/* Brand header */}
          <div
            onClick={() => {
              navigate('/');
              closeOnMobile();
            }}
            className="group flex items-center justify-between px-6 py-6 cursor-pointer select-none border-b border-white/[0.06]"
          >
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[2px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                  <div className="w-full h-full bg-[#0d0f18] rounded-[14px] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                </div>
                {/* Micro ping status */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#0d0f18]" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                    LINK
                  </h1>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-widest uppercase bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                    V2
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500 tracking-wide">Fucking Shit Social Network</p>
              </div>
            </div>
          </div>

          {/* Quick Create Action Capsule */}
          <div className="px-4 py-5">
            <Link
              to="/create-post"
              onClick={closeOnMobile}
              className="relative group w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 active:scale-98 transition-all duration-200 text-white font-semibold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-600/30 overflow-hidden"
            >
              {/* Shimmer light bar */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="p-1 rounded-lg bg-white/20">
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>
              <span className="tracking-wide">Create Post / Story</span>
            </Link>
          </div>

          {/* Navigation Section */}
          <div className="py-1">
            <p className="px-6 pb-2 text-[10px] font-bold tracking-wider uppercase text-slate-500">Navigation</p>
            <MenuItems setSidebarOpen={setSidebarOpen} />
          </div>
        </div>

        {/* User Identity Pod & Logout Footer */}
        {user && (
          <div className="p-4 border-t border-white/[0.08] bg-[#090b12]/60">
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:border-indigo-500/30 transition-all duration-200">
              <div
                onClick={() => {
                  navigate('/profile');
                  closeOnMobile();
                }}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="relative shrink-0">
                  <Avatar
                    src={user.profilePicture}
                    fallback={user.fullName}
                    size="md"
                    className="ring-2 ring-indigo-500/40 group-hover:ring-indigo-400 transition"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0d0f18]" />
                </div>

                <div className="truncate flex-1">
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition truncate">
                    {user.fullName}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">@{user.username}</p>
                </div>

                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition shrink-0" />
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                <button
                  onClick={() => {
                    navigate('/profile');
                    closeOnMobile();
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:text-white hover:bg-white/5 transition cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Profile</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
