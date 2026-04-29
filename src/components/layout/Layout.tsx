import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { AnimatedDiv } from "../ui/AnimatedText";
import { WebsiteAnnouncements } from "./WebsiteAnnouncements";
import { safeFetch } from "@/lib/utils";

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const navigate = useNavigate();

  useEffect(() => {
    let uuid = localStorage.getItem('userUUID');
    const email = localStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName');
    
    // Clear legacy/bad data that causes Supabase congestion
    if (uuid === 'anonymous' || (uuid && uuid.length < 10 && uuid !== 'admin')) {
       console.log("Cleaning up invalid localStorage session...");
       localStorage.removeItem('userUUID');
       localStorage.removeItem('isAdmin');
       localStorage.removeItem('vuiCoinBalance');
       uuid = null;
    }

    if (!uuid) {
      navigate('/login');
      return;
    }

    // Initial sync with Supabase
    const isAdminOverride = email === 'omnitask123@gmail.com' || email === 'vuza4912@gmail.com';
    
    safeFetch('/api/user/sync-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uuid, email, userName })
    })
    .then(data => {
      if (data && data.profile) {
        localStorage.setItem('vuiCoinBalance', (data.profile.vui_coin_balance || 0).toString());
        localStorage.setItem('coinTaskBalance', (data.profile.coin_task_balance || 0).toString());
        
        const adminStatus = !!(data.profile.is_admin || isAdminOverride);
        localStorage.setItem('isAdmin', adminStatus ? 'true' : 'false');
        if (isAdmin !== adminStatus) {
           setIsAdmin(adminStatus);
        }
        if (data.profile.user_name) {
          localStorage.setItem('userName', data.profile.user_name);
        }
        window.dispatchEvent(new CustomEvent('balanceUpdated'));
      }
    });
  }, [navigate]);

  return (
    <div className="flex bg-gray-50/50 h-[100dvh] text-slate-900 font-sans relative overflow-hidden">
      <WebsiteAnnouncements />
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        onOpen={() => setIsSidebarOpen(true)}
        onClose={() => setIsSidebarOpen(false)} 
        isAdmin={isAdmin}
      />
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh]">
        <Header isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isAdmin={isAdmin} />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
           <AnimatedDiv className="w-full h-full">
             <Outlet />
           </AnimatedDiv>
        </main>
      </div>
    </div>
  );
}
