import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { safeFetch } from '@/lib/utils';

export function WebsiteAnnouncements() {
  const location = useLocation();
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Fetch announcements periodically
  useEffect(() => {
    const fetchAnnouncements = async () => {
      const data = await safeFetch('/api/notifications');
      
      if (data && data.notifications && data.notifications.length > 0) {
         const readIds = JSON.parse(localStorage.getItem('read_announcements') || '[]');
         const unread = data.notifications.filter((n: any) => !readIds.includes(n.id));
         if (unread.length > 0) {
             setAnnouncements(prev => {
                 // only add new ones not already in state
                 const newItems = unread.filter((u: any) => !prev.find(p => p.id === u.id));
                 return [...prev, ...newItems];
             });
         }
      }
    };

    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 30000); // Check every 30s instead of 10s
    return () => clearInterval(interval);
  }, []);

  // Hide on Task and Attendance pages (as requested)
  // assuming task pages are task, task-vip, task-pre, attendance
  if (['/app/task', '/app/task-vip', '/app/task-pre', '/app/attendance'].includes(location.pathname)) {
    return null;
  }

  if (announcements.length === 0) return null;

  const currentAnnouncement = announcements[0];

  const handleClose = () => {
    // Mark as read
    const readIds = JSON.parse(localStorage.getItem('read_announcements') || '[]');
    localStorage.setItem('read_announcements', JSON.stringify([...readIds, currentAnnouncement.id]));
    
    // Remove from state
    setAnnouncements(prev => prev.slice(1));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
       <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
          <button 
             onClick={handleClose}
             className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto ${currentAnnouncement.type === 'warning' ? 'bg-rose-100 text-rose-500' : currentAnnouncement.type === 'event' ? 'bg-amber-100 text-amber-500' : 'bg-blue-100 text-blue-500'}`}>
             <Bell size={32} />
          </div>

          <h2 className="text-sm font-bold tracking-widest text-center text-gray-400 uppercase mb-2">Thông báo từ hệ thống</h2>
          <h3 className="text-xl font-bold text-center text-slate-800 mb-6">{currentAnnouncement.title}</h3>
          
          <div className="text-slate-600 text-[15px] leading-relaxed text-center mb-8 max-h-60 overflow-y-auto custom-scrollbar px-2">
             {currentAnnouncement.content}
          </div>

          <button onClick={handleClose} className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors">
             Đã hiểu và Đóng
          </button>
       </div>
    </div>
  );
}
