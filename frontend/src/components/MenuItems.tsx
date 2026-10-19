import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageCircle, Users, Search, User as UserIcon } from 'lucide-react';

interface MenuItemsProps {
  setSidebarOpen?: (open: boolean) => void;
}

export const menuItems = [
  { to: '/', label: 'Feed', icon: Home },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
  { to: '/friends', label: 'Friends', icon: Users },
  { to: '/discover', label: 'Discover', icon: Search },
  { to: '/profile', label: 'Profile', icon: UserIcon },
];

const MenuItems: React.FC<MenuItemsProps> = ({ setSidebarOpen }) => {
  return (
    <div className="px-5 text-gray-600 space-y-1.5 font-medium">
      {menuItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={() => setSidebarOpen && setSidebarOpen(false)}
          className={({ isActive }) =>
            `px-4 py-2.5 flex items-center gap-3.5 rounded-xl transition-all duration-150 ${
              isActive
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                : 'hover:bg-gray-100 hover:text-gray-900'
            }`
          }
        >
          <Icon className="w-5 h-5 shrink-0" />
          <span className="text-sm">{label}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default MenuItems;
