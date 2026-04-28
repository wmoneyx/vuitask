import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { AnimatedDiv } from "../ui/AnimatedText";
import { WebsiteAnnouncements } from "./WebsiteAnnouncements";

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const uuid = localStorage.getItem('userUUID');
    const email = localStorage.getItem('userEmail');
    if (!uuid) {
      navigate('/login');
      return;
    }

    // Initial sync with Supabase
    fetch('/api/user/sync-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uuid, email })
    })
    .then(res => res.json())
    .then(data => {
      if (data.profile) {
        localStorage.setItem('vuiCoinBalance', (data.profile.vui_coin_balance || 0).toString());
        localStorage.setItem('coinTaskBalance', (data.profile.coin_task_balance || 0).toString());
        localStorage.setItem('isAdmin', data.profile.is_admin ? 'true' : 'false');
        window.dispatchEvent(new CustomEvent('balanceUpdated'));
      }
    })
    .catch(console.error);
  }, [navigate]);

  return (
    <div className="flex bg-gray-50/50 h-[100dvh] text-slate-900 font-sans relative overflow-hidden">
      <WebsiteAnnouncements />
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        onOpen={() => setIsSidebarOpen(true)}
        onClose={() => setIsSidebarOpen(false)} 
      />
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh]">
        <Header isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
           <AnimatedDiv className="w-full h-full">
             <Outlet />
           </AnimatedDiv>
        </main>
      </div>
    </div>
  );
}
