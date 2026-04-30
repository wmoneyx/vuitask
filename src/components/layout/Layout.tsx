import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { AnimatedDiv } from "../ui/AnimatedText";
import { WebsiteAnnouncements } from "./WebsiteAnnouncements";
import { useUser } from "@/UserContext";

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { profile, loading, error, refreshProfile } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const uuid = localStorage.getItem('userUUID');
    if (!uuid && !loading) {
      navigate('/login');
    }
  }, [loading, navigate]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
        <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Đang đồng bộ dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white flex-col gap-6 p-6 text-center">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-100/50">
           <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Đồng bộ thất bại</h2>
          <p className="text-slate-500 font-medium max-w-md mx-auto">{error}</p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button 
            onClick={() => refreshProfile()}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all active:scale-[0.98]"
          >
            THỬ LẠI NGAY
          </button>
          <button 
            onClick={() => { localStorage.clear(); navigate('/login'); }}
            className="w-full py-4 bg-gray-100 text-slate-600 font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-[0.98]"
          >
            ĐĂNG XUẤT
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = profile?.is_admin || false;

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
        <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
           <AnimatedDiv className="w-full h-full">
             <Outlet />
           </AnimatedDiv>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
