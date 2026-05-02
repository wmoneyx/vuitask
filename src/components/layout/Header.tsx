import { useState, useRef, useEffect } from "react";
import { Bell, Menu, X, CheckCircle2, LogOut, User } from "lucide-react";
import confetti from 'canvas-confetti';
import { Logo } from "@/components/ui/Logo";
import { useNavigate, Link } from "react-router-dom";
import { safeFetch } from "@/lib/utils";
import { useUser } from "@/UserContext";

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isAdmin?: boolean;
}

export function Header({ isSidebarOpen, toggleSidebar, isAdmin = false }: HeaderProps) {
  const { profile, refreshProfile } = useUser();
  const userEmail = profile?.user_email || 'user@gmail.com';
  const username = profile?.user_name || userEmail.split('@')[0] || 'User';
  
  const [showMail, setShowMail] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'chests'>('notifications');
  const [notifications, setNotifications] = useState(() => {
     return JSON.parse(localStorage.getItem('local_rewards') || '[]');
  });
  const [openedChests, setOpenedChests] = useState(() => JSON.parse(localStorage.getItem('openedChests') || '{"chest1": 0, "chest2": 0, "chest3": 0}'));
  const dropdownRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await safeFetch('/api/notifications');
        if (data && data.notifications) {
           const formattedNotifs = data.notifications.map((n: any) => ({
             id: n.id,
             title: n.title,
             content: n.content,
             type: n.type,
             time: new Date(n.timestamp).toLocaleTimeString(),
             read: JSON.parse(localStorage.getItem('read_announcements') || '[]').includes(n.id)
           }));
           const localNotifs = JSON.parse(localStorage.getItem('local_rewards') || '[]');
           setNotifications([...formattedNotifs, ...localNotifs].sort((a,b) => b.timestamp - a.timestamp));
        }
      } catch (err) {
        // ignore
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleNewNotification = () => {
      const localNotifs = JSON.parse(localStorage.getItem('local_rewards') || '[]');
      setNotifications(prev => {
         const siteNotifs = prev.filter((n: any) => !n.isLocalReward);
         return [...siteNotifs, ...localNotifs].sort((a,b) => b.timestamp - a.timestamp);
      });
    };
    
    window.addEventListener('newNotification', handleNewNotification);
    return () => window.removeEventListener('newNotification', handleNewNotification);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMail(false);
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const markAllAsRead = () => {
    const updated = notifications.map((n: any) => ({...n, read: true}));
    setNotifications(updated);
    
    const siteNotifs = updated.filter((n: any) => !n.isLocalReward).map((n: any) => n.id);
    const existingRead = JSON.parse(localStorage.getItem('read_announcements') || '[]');
    localStorage.setItem('read_announcements', JSON.stringify([...new Set([...existingRead, ...siteNotifs])]));
    
    const localNotifs = updated.filter((n: any) => n.isLocalReward);
    localStorage.setItem('local_rewards', JSON.stringify(localNotifs));
  };
  
  const [showRewardPopup, setShowRewardPopup] = useState<{ isOpen: boolean; reward: number; chestType: number } | null>(null);
  
  const handleNotificationClick = async (notif: any) => {
    if (notif.type === 'reward_chest' && !notif.claimed) {
      const uuid = profile?.user_uuid;
      if (!uuid) return;

      // We should really handle this server-side, but keeping current flow with a sync call
      try {
        // Inform server if needed? Actually current rewards logic seems client-side triggered?
        // Let's just update balance via sync-profile simulation
        await safeFetch('/api/user/sync-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                uuid, 
                vuiChange: notif.rewardAmount 
            })
        });
        
        await refreshProfile();
      } catch (err) {
        console.error("Reward claiming failed", err);
      }
      
      const newNotifs = notifications.map((n: any) => 
        n.id === notif.id ? { ...n, claimed: true, read: true } : n
      );
      setNotifications(newNotifs);
      
      const localNotifs = newNotifs.filter((n: any) => n.isLocalReward);
      localStorage.setItem('local_rewards', JSON.stringify(localNotifs));
      
      setShowRewardPopup({ isOpen: true, reward: notif.rewardAmount, chestType: notif.chestType });
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 shrink-0 shadow-sm">
      <div className="flex items-center gap-2 md:gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg lg:hidden"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className={isSidebarOpen ? "hidden lg:block" : "block"}>
          <Logo />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => {
              setShowMail(!showMail);
              setOpenedChests(JSON.parse(localStorage.getItem('openedChests') || '{"chest1": 0, "chest2": 0, "chest3": 0}'));
            }}
            title="Hòm thư"
            className="relative text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-50"
          >
            <Bell size={20} strokeWidth={1.5} />
            {unreadCount > 0 && <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
          </button>
          
          {showMail && (
            <div className="absolute top-12 right-0 w-80 bg-white border border-gray-100 shadow-xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="flex border-b border-gray-100">
                <button
                  className={`flex-1 text-xs font-bold py-3 uppercase ${activeTab === 'notifications' ? 'bg-slate-50 text-slate-800' : 'text-gray-400 hover:bg-gray-50'}`}
                  onClick={() => setActiveTab('notifications')}
                >
                  Thông Báo
                </button>
                <button
                  className={`flex-1 text-xs font-bold py-3 uppercase ${activeTab === 'chests' ? 'bg-slate-50 text-slate-800' : 'text-gray-400 hover:bg-gray-50'}`}
                  onClick={() => setActiveTab('chests')}
                >
                  Mở Hòm
                </button>
              </div>
              
              <div className="max-h-80 overflow-y-auto custom-scrollbar p-2">
                {activeTab === 'notifications' ? (
                  <>
                    <div className="p-2 border-b border-gray-50 flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 text-sm">Thông báo</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-xs font-bold text-primary hover:text-orange-600 transition-colors flex items-center gap-1">
                          <CheckCircle2 size={12} /> Đã đọc
                        </button>
                      )}
                    </div>
                    {notifications.map((notif: any) => (
                      <div key={notif.id} onClick={() => handleNotificationClick(notif)} className={`p-3 rounded-xl mb-1 hover:bg-gray-50 transition-colors ${!notif.claimed ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'} ${!notif.read ? 'bg-orange-50/30' : ''}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm ${!notif.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>{notif.title}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{notif.time}</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">{notif.content}</p>
                        {notif.claimed && <div className="text-[10px] font-bold text-emerald-600 mt-1 uppercase">Đã nhận</div>}
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="p-4 text-center text-xs text-gray-400">Không có thông báo nào</div>
                    )}
                  </>
                ) : (
                  <div className="p-2">
                    <h3 className="font-bold text-slate-800 text-sm mb-2">Hòm đã mở</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(openedChests).map(([key, value]) => (
                        <div key={key} className="bg-slate-50 p-2 rounded-xl text-center">
                          <div className="text-xs text-gray-500 uppercase">{key}</div>
                          <div className="font-bold text-slate-900">{String(value)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Reward Popup */}
        {showRewardPopup?.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
              <h2 className="text-2xl font-black text-slate-900 mb-2">Chúc mừng!</h2>
              <p className="text-sm text-gray-500 mb-6">Bạn đã mở Hòm Bí Ẩn {showRewardPopup.chestType} và nhận được:</p>
              <div className="text-4xl font-black text-emerald-500 mb-8">{showRewardPopup.reward.toLocaleString()} VuiCoin</div>
              <button onClick={() => setShowRewardPopup(null)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-slate-800">Đã hiểu</button>
            </div>
          </div>
        )}

        <div className="relative" ref={accountDropdownRef}>
          <button 
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className="flex items-center gap-3 hover:bg-gray-50 p-1 rounded-xl transition-colors"
          >
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-slate-900 flex items-center justify-end gap-2 text-capitalize">
                {profile?.is_admin ? "Vui Task" : username} 
                {profile?.is_admin && <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Admin</span>}
                {profile && profile.task_bonus_percent > 0 && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-bold">+{profile.task_bonus_percent}% Bonus TASK</span>}
              </div>
              <div className="text-xs text-gray-500">{userEmail}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-primary font-bold shadow-md ring-2 ring-white uppercase overflow-hidden">
              {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : username.charAt(0)}
            </div>
          </button>

          {showAccountMenu && (
            <div className="absolute top-12 right-0 w-48 bg-white border border-gray-100 shadow-xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 py-1">
              <Link 
                to="/profile" 
                onClick={() => setShowAccountMenu(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User size={16} />
                <span>Trang cá nhân</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
