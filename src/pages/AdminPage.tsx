import React, { useState, useEffect } from 'react';
import { GenericPage } from "@/components/layout/GenericPage";
import { 
  Shield, Users, Database, Settings, Activity, 
  RotateCw, HardDrive, LayoutGrid, CreditCard, 
  CheckSquare, History, Bell, LifeBuoy, TrendingUp,
  UserCheck, Smartphone, Maximize2
} from "lucide-react";
import { motion } from "motion/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Imports
import { AdminMembers } from '../components/admin/AdminMembers';
import { AdminWithdrawals } from '../components/admin/AdminWithdrawals';
import { AdminTasks } from '../components/admin/AdminTasks';
import { AdminHistory } from '../components/admin/AdminHistory';
import { AdminSystem } from '../components/admin/AdminSystem';
import { AdminSupport } from '../components/admin/AdminSupport';
import { AdminNotifications } from '../components/admin/AdminNotifications';

const data = [
  { name: 'Th 3, ngày 21', users: 0, revenue: 0, withdrawn: 0 },
  { name: 'Th 4, ngày 22', users: 0, revenue: 0, withdrawn: 0 },
  { name: 'Th 5, ngày 23', users: 0, revenue: 0, withdrawn: 0 },
  { name: 'Th 6, ngày 24', users: 0, revenue: 0, withdrawn: 0 },
  { name: 'Th 7, ngày 25', users: 0, revenue: 0, withdrawn: 0 },
  { name: 'CN, ngày 26', users: 0, revenue: 0, withdrawn: 0 },
  { name: 'Th 2, ngày 27', users: 0, revenue: 0, withdrawn: 0 },
];

export function AdminPage() {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [activeTab, setActiveTab] = useState('Tổng quan');
  const [needsFullscreenPrompt, setNeedsFullscreenPrompt] = useState(false);
  
  const [statsData, setStatsData] = useState({
    users: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    totalWithdrawn: 0,
    pendingWithdrawals: 0,
    pendingTasks: 0
  });

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data) {
         setStatsData(data);
      }
    } catch(e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    const statsTimer = setInterval(fetchStats, 60000); // refresh every minute

    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => {
      clearInterval(timer);
      clearInterval(statsTimer);
    };
  }, []);

  useEffect(() => {
    const checkMobileFullscreen = () => {
      const isMobile = window.innerWidth <= 1024;
      const isPortrait = window.innerHeight > window.innerWidth;
      
      if (isMobile && (!document.fullscreenElement || isPortrait)) {
         setNeedsFullscreenPrompt(true);
      } else {
         setNeedsFullscreenPrompt(false);
      }
    };

    checkMobileFullscreen();
    window.addEventListener('resize', checkMobileFullscreen);
    document.addEventListener('fullscreenchange', checkMobileFullscreen);
    
    return () => {
      window.removeEventListener('resize', checkMobileFullscreen);
      document.removeEventListener('fullscreenchange', checkMobileFullscreen);
    };
  }, []);

  const enterFullscreenAndLandscape = async () => {
    try {
      const doc = document.documentElement;
      if (doc.requestFullscreen) {
        await doc.requestFullscreen();
      } else if ((doc as any).webkitRequestFullscreen) {
        await (doc as any).webkitRequestFullscreen();
      } else if ((doc as any).msRequestFullscreen) {
        await (doc as any).msRequestFullscreen();
      }
      
      if (screen.orientation && (screen.orientation as any).lock) {
        await (screen.orientation as any).lock('landscape').catch(() => {});
      }
    } catch (e) {
      console.log('Cannot lock orientation: ', e);
    }
  };

  const adminTabs = [
    { name: 'Tổng quan', icon: LayoutGrid },
    { name: 'Thành viên', icon: Users },
    { name: 'Duyệt Rút', icon: CreditCard },
    { name: 'Duyệt Nhiệm vụ', icon: CheckSquare },
    { name: 'Lịch sử', icon: History },
    { name: 'Hệ thống', icon: Settings },
    { name: 'Thông báo', icon: Bell },
    { name: 'Hỗ trợ', icon: LifeBuoy },
  ];

  const stats = [
    { label: "THÀNH VIÊN", value: statsData.users.toLocaleString(), icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "DOANH THU", value: `$${statsData.totalRevenue.toLocaleString()}`, icon: Database, color: "text-green-500", bg: "bg-green-50" },
    { label: "DOANH THU HÔM NAY", value: `$${statsData.todayRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-cyan-500", bg: "bg-cyan-50" },
    { label: "ĐÃ RÚT", value: `$${statsData.totalWithdrawn.toLocaleString()}`, icon: CreditCard, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "YÊU CẦU RÚT", value: statsData.pendingWithdrawals.toLocaleString(), icon: History, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "YÊU CẦU DUYỆT", value: statsData.pendingTasks.toLocaleString(), icon: UserCheck, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "IP TRÙNG LẶP", icon: Smartphone, value: "0", color: "text-yellow-500", bg: "bg-yellow-50" },
    { label: "NGƯỜI DÙNG ONLINE", value: "0", icon: Activity, color: "text-red-500", bg: "bg-red-50" },
  ];

  if (needsFullscreenPrompt) {
    return (
      <div className="fixed inset-0 bg-slate-900 z-[100] flex flex-col items-center justify-center text-white p-6 text-center">
        <Smartphone className="w-20 h-20 mb-6 text-yellow-400 rotate-90" />
        <h2 className="text-2xl font-bold mb-3 uppercase tracking-tight">Vào chế độ toàn màn hình</h2>
        <p className="text-slate-400 mb-8 max-w-sm leading-relaxed">
          Trang quản trị yêu cầu hiển thị ngang và toàn màn hình trên thiết bị di động để có trải nghiệm tốt nhất.
        </p>
        <button 
          onClick={enterFullscreenAndLandscape}
          className="px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all"
        >
          <Maximize2 size={24} />
          Vào Admin Mode
        </button>
      </div>
    );
  }

  return (
    <GenericPage title="ADMIN DASHBOARD" showHistory={false}>
      <div className="space-y-6">
        {/* Header Hero Section */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl border border-slate-800">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-yellow-500/10 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="bg-yellow-400 text-slate-900 text-[10px] px-2 py-1 rounded-full font-bold">ADMIN DASHBOARD</span>
                <span className="text-slate-400 text-xs font-mono">{time}</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="text-yellow-400" size={32} />
                <h2 className="text-3xl font-extrabold tracking-tight uppercase">TỔNG QUAN HỆ THỐNG</h2>
              </div>
              <p className="text-slate-400 text-sm">
                Chào mừng quay trở lại, <span className="text-yellow-400 font-bold">Admin Vui Task</span>. Hệ thống đang hoạt động ổn định.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-slate-700 shadow-lg text-sm">
                <RotateCw size={18} />
                Đồng bộ LIVE
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-slate-900 rounded-xl font-bold transition-all shadow-lg text-sm">
                <HardDrive size={18} />
                Backup Data
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
          {adminTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.name;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap border-2
                  ${isActive 
                    ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                    : "bg-white text-slate-500 border-transparent hover:bg-gray-50"
                  }`}
              >
                <Icon size={18} />
                {tab.name}
              </button>
            );
          })}
        </div>

        {activeTab === 'Tổng quan' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
                  >
                    <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</div>
                      <div className="text-xl font-extrabold text-slate-900">{stat.value}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Charts & Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-lg">Biểu đồ tăng trưởng (LIVE)</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-[10px] font-bold text-slate-400 font-mono">NGƯỜI DÙNG</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                        <span className="text-[10px] font-bold text-slate-400 font-mono">DOANH THU</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-[10px] font-bold text-slate-400 font-mono">ĐÃ RÚT</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Hoạt động
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '16px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          fontSize: '12px',
                          fontWeight: '700'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="users" 
                        stroke="#3b82f6" 
                        strokeWidth={3} 
                        dot={false}
                        activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                        strokeDasharray="5 5"
                        name="Người dùng"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#eab308" 
                        strokeWidth={3} 
                        dot={false}
                        activeDot={{ r: 6, fill: '#eab308', stroke: '#fff', strokeWidth: 2 }}
                        strokeDasharray="5 5"
                        name="Doanh thu"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="withdrawn" 
                        stroke="#ef4444" 
                        strokeWidth={3} 
                        dot={false}
                        activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                        strokeDasharray="5 5"
                        name="Đã rút"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Activity Sidebar */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                <h3 className="font-bold text-slate-900 text-lg mb-6">Hành động mới nhất</h3>
                <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">                  
                  <div className="text-center py-10 opacity-30">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Không còn dữ liệu</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'Thành viên' && <AdminMembers />}
        {activeTab === 'Duyệt Rút' && <AdminWithdrawals />}
        {activeTab === 'Duyệt Nhiệm vụ' && <AdminTasks />}
        {activeTab === 'Lịch sử' && <AdminHistory />}
        {activeTab === 'Hệ thống' && <AdminSystem />}
        {activeTab === 'Thông báo' && <AdminNotifications />}
        {activeTab === 'Hỗ trợ' && <AdminSupport />}
      </div>
    </GenericPage>
  );
}
