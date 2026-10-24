import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  Home,
  MessageSquare,
  Settings as SettingsIcon,
  Sparkles,
  User as UserIcon,
  Users2,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

interface MenuItemsProps {
  setSidebarOpen?: (open: boolean) => void;
}

export const MenuItems: React.FC<MenuItemsProps> = ({ setSidebarOpen }) => {
  const { user } = useAuthStore();
  const friendRequestsCount = user?.friendRequestsReceived?.length ?? 0;

  const items = [
    { to: '/', label: 'Home Feed', icon: Home, badge: null },
    { to: '/messages', label: 'Direct Messages', icon: MessageSquare, badge: null },
    {
      to: '/friends',
      label: 'Friends & Network',
      icon: Users2,
      badge: friendRequestsCount > 0 ? friendRequestsCount : null,
    },
    { to: '/discover', label: 'Discover & Search', icon: Compass, badge: null },
    { to: '/profile', label: 'My Profile', icon: UserIcon, badge: null },
    { to: '/settings', label: 'Settings', icon: SettingsIcon, badge: null },
  ];

  return (
    <nav className="px-3.5 space-y-1.5 font-medium">
      {items.map(({ to, label, icon: Icon, badge }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={() => setSidebarOpen && setSidebarOpen(false)}
          className={({ isActive }) =>
            `group relative flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-transparent text-white font-semibold border border-indigo-500/30 shadow-[0_4px_20px_rgba(99,102,241,0.15)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Active jewel indicator */}
                {isActive && (
                  <span className="absolute left-1 top-2.5 bottom-2.5 w-1 rounded-full bg-gradient-to-b from-indigo-400 to-purple-500 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                )}

                <div
                  className={`p-2 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-indigo-600/30 text-indigo-400 ring-1 ring-indigo-500/40'
                      : 'text-slate-400 group-hover:text-indigo-300 group-hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                </div>
                <span className="text-sm tracking-wide truncate">{label}</span>
              </div>

              {badge && (
                <span className="ml-2 px-2 py-0.5 text-[11px] font-bold rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs">
                  {badge}
                </span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default MenuItems;
