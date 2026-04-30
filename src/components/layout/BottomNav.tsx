import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  CheckSquare, 
  Trophy, 
  User,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/UserContext';

const NAV_ITEMS = [
  { name: 'Trang chủ', path: '/app', icon: Home },
  { name: 'Nhiệm vụ', path: '/app/task', icon: CheckSquare },
  { name: 'Sự kiện', path: '/app/task-pre', icon: Zap },
  { name: 'Xếp hạng', path: '/app/ranking', icon: Trophy },
  { name: 'Cá nhân', path: '/app/profile', icon: User },
];

export function BottomNav() {
  const { profile } = useUser();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-1 z-50 flex justify-around items-center shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/app'}
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 p-2 rounded-xl transition-all flex-1 min-w-0",
            isActive 
              ? "text-primary" 
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          <item.icon size={20} className={cn(
             "transition-transform",
             "active:scale-95"
          )} />
          <span className="text-[10px] font-bold uppercase tracking-tight truncate w-full text-center">
            {item.name}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
