import React, { useState, useEffect } from 'react';
import { CalendarCheck, Lock, CheckCircle2, Gift, Loader2 } from 'lucide-react';
import { AnimatedDiv, AnimatedText } from "@/components/ui/AnimatedText";
import { VuiCoin } from "@/components/ui/VuiCoin";
import { CoinTask } from "@/components/ui/CoinTask";
import { useNotification } from '../context/NotificationContext';

import { useUser } from '@/UserContext';
import { safeFetch } from '@/lib/utils';

export function AttendancePage() {
  const { profile, refreshProfile } = useUser();
  const { showNotification } = useNotification();
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-indexed
  const currentYear = currentDate.getFullYear();
  const currentDay = currentDate.getDate();

  // Đếm số ngày trong tháng
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const [openedChests, setOpenedChests] = useState<Record<string, number>>({
    chest1: 0,
    chest2: 0,
    chest3: 0,
  });

  const [totalTasks] = useState(0); 
  const [coinTaskBalance, setCoinTaskBalance] = useState(0);
  const [vuiCoinBalance, setVuiCoinBalance] = useState(0);

  useEffect(() => {
    if (profile) {
      setCoinTaskBalance(profile.coin_task_balance || 0);
      setVuiCoinBalance(profile.vui_coin_balance || 0);
    }
  }, [profile]);

  const [checkedInDays, setCheckedInDays] = useState<number[]>([]);

  useEffect(() => {
    const fetchAttendanceHistory = async () => {
      if (!profile?.user_uuid) return;
      const data = await safeFetch(`/api/user/attendance-history?uuid=${profile.user_uuid}`);
      if (data && data.historyCode) {
        setCheckedInDays(data.historyCode);
      }
    };
    fetchAttendanceHistory();
  }, [profile]);

  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [loadingChest, setLoadingChest] = useState<number | null>(null);

  const handleCheckIn = async (day: number) => {
    if (isCheckingIn) return;
    if (!checkedInDays.includes(day)) {
      setIsCheckingIn(true);
      const earned = day * 10;
      const uuid = profile?.user_uuid;
      if (uuid) {
        try {
           const res = await safeFetch('/api/user/attendance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ uuid, day, reward: earned })
           });
           if (res.error) {
              showNotification({ title: 'Lỗi', message: res.error, type: 'error' });
              setIsCheckingIn(false);
              return;
           }
           
           await refreshProfile();
        } catch (e) {
           showNotification({ title: 'Lỗi', message: 'Không thể điểm danh', type: 'error' });
           setIsCheckingIn(false);
           return;
        }
      }

      setCheckedInDays([...checkedInDays, day]);
      showNotification({ title: 'Điểm danh', message: `Thành công ngày ${day}/${currentMonth + 1}! Nhận ${earned} CoinTask`, type: 'success' });
      setIsCheckingIn(false);
    }
  };

  const handleOpenChest = async (chestId: string, type: number) => {
    let cost = 0;
    let minReward = 0;
    let maxReward = 0;
    let isVuiCoinCost = false;
    let requiredTasks = 0;

    if (type === 1) {
      if (openedChests.chest1 >= 1) {
        showNotification({ title: 'Hết lượt', message: "Đã hết lượt mở Hòm Bí Ẩn 1", type: 'error' });
        return;
      }
      cost = 10000;
      minReward = 10000;
      maxReward = 100000;
      requiredTasks = 1000;
    } else if (type === 2) {
      if (openedChests.chest2 >= 10) {
        showNotification({ title: 'Hết lượt', message: "Đã hết lượt mở Hòm Bí Ẩn 2", type: 'error' });
        return;
      }
      cost = 36000;
      minReward = 10000;
      maxReward = 100000;
      requiredTasks = 2500 + (openedChests.chest2 * 10);
    } else {
      if (openedChests.chest3 >= 100) {
        showNotification({ title: 'Hết lượt', message: "Đã hết lượt mở Hòm Bí Ẩn 3", type: 'error' });
        return;
      }
      cost = 1800000;
      isVuiCoinCost = true;
      minReward = 100000;
      maxReward = 500000;
      requiredTasks = 10000 + (openedChests.chest3 * 20);
    }

    if (totalTasks < requiredTasks) {
       showNotification({ title: 'Chưa đủ điều kiện', message: `Chưa đạt chỉ tiêu ${requiredTasks} task!`, type: 'warning' });
       return;
    }

    if (isVuiCoinCost) {
      if (vuiCoinBalance < cost) {
        showNotification({ title: 'Số dư thấp', message: "Không đủ số dư VuiCoin!", type: 'error' });
        return;
      }
    } else {
      if (coinTaskBalance < cost) {
        showNotification({ title: 'Số dư thấp', message: "Không đủ số dư CoinTask!", type: 'error' });
        return;
      }
    }

    setLoadingChest(type);

    // Process on server (mocking the cost deduction logic here or assume server handles it)
    // For now keeping client side optimistic balance visual and then refreshing
    const uuid = profile?.user_uuid;
    if (!uuid) return;

    try {
        // We'd need an API for this: /api/user/open-chest
        // For now, doing it via existing sync simulation or generic write
        await safeFetch('/api/user/sync-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                uuid, 
                vuiChange: isVuiCoinCost ? -cost : 0, 
                coinTaskChange: !isVuiCoinCost ? -cost : 0 
            })
        });
        await refreshProfile();
    } catch (err) {}

    // Logic for reward
    let reward = Math.floor(Math.random() * (maxReward - minReward + 1)) + minReward;
    
    // CƠ CHẾ ẨN: PHẦN THƯỞNG RANDOM
    if (type === 3) {
      if (reward > 150000) reward = 150000;
    } else {
      if (reward > 15000) reward = 15000;
    }

    // Update opened
    setOpenedChests(p => ({ ...p, [chestId]: p[chestId] + 1 }));
    
    // Create reward notification
    const notification = {
      id: Date.now(),
      type: 'reward_chest',
      title: `Chúc mừng mở Hòm ${type}!`,
      content: `Bạn đã mở Hòm Bí Ẩn ${type}. Nhấn để mở nhận phần thưởng!`,
      rewardAmount: reward,
      chestType: type,
      time: 'Vừa xong',
      read: false,
      isLocalReward: true,
      timestamp: Date.now()
    };

    const existingNotifs = JSON.parse(localStorage.getItem('local_rewards') || '[]');
    localStorage.setItem('local_rewards', JSON.stringify([notification, ...existingNotifs]));
    window.dispatchEvent(new CustomEvent('newNotification'));
    
    showNotification({ title: 'Phần thưởng', message: `Đã gửi Hòm Bí Ẩn ${type} vào hộp thông báo!`, type: 'success' });
    setLoadingChest(null);
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-slate-800">
          <CalendarCheck className="text-blue-500" size={28} />
          <h1 className="text-2xl font-bold uppercase tracking-tight">
            <AnimatedText>Lịch Điểm Danh</AnimatedText>
          </h1>
        </div>
        <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-lg">
          <CoinTask size={24} className="text-yellow-400" />
          <span className="text-lg font-black">{coinTaskBalance.toLocaleString()}</span>
        </div>
      </div>

      <AnimatedDiv delay={0.1}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {days.map(day => {
            const isToday = currentDay === day;
            const isPast = day < currentDay || checkedInDays.includes(day);
            const reward = day * 10;
            const isCheckedIn = checkedInDays.includes(day);
            
            return (
              <div 
                key={day} 
                className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all ${
                  isToday 
                    ? 'bg-blue-50 border-blue-200 shadow-[0_8px_30px_rgb(59,130,246,0.12)] scale-105 z-10' 
                    : isCheckedIn 
                      ? 'bg-gray-50 border-gray-100 opacity-70' 
                      : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-md'
                }`}
              >
                 <div className="text-sm font-bold text-slate-500">Ngày {day}/{currentMonth + 1}</div>
                 
                 <div className="font-black text-xl text-yellow-500 flex flex-col items-center gap-1.5 h-16 justify-center">
                   <CoinTask size={28} />
                   <span>+{reward}</span>
                 </div>

                 <div className="w-full">
                    {isToday && !isCheckedIn ? (
                      <button disabled={isCheckingIn} onClick={() => handleCheckIn(day)} className="bg-blue-600 disabled:opacity-50 text-white py-2 rounded-xl text-[11px] font-bold w-full uppercase flex items-center justify-center gap-1 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                        {isCheckingIn && <Loader2 className="animate-spin" size={14} />}
                        {isCheckingIn ? 'Đang điểm danh...' : 'Điểm danh'}
                      </button>
                    ) : isCheckedIn ? (
                      <div className="bg-emerald-500 text-white py-2 rounded-xl text-[11px] font-bold w-full uppercase flex items-center justify-center gap-1 shadow-lg shadow-emerald-600/20">
                        <CheckCircle2 size={14} /> Đã điểm danh
                      </div>
                    ) : (
                      <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center justify-center gap-1 py-2 bg-slate-100 rounded-xl">
                        <Lock size={12} /> Chờ mở
                      </div>
                    )}
                 </div>
              </div>
            );
          })}
        </div>
      </AnimatedDiv>

      <div className="pt-8 border-t border-gray-100">
        <div className="flex items-center gap-3 text-slate-800 mb-6">
          <Gift className="text-rose-500" size={28} />
          <h2 className="text-2xl font-bold uppercase tracking-tight">
            <AnimatedText delay={0.2}>Bảng Đổi Thưởng</AnimatedText>
          </h2>
        </div>

        <AnimatedDiv delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Chest 1 */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-1 shadow-xl shadow-purple-500/20 group">
              <div className="bg-slate-900 rounded-[22px] p-6 text-center h-full flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                
                <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">Hòm Bí Ẩn 1</h3>
                <div className="text-purple-400 text-[10px] font-bold tracking-[0.2em] mb-6 border border-purple-500/30 bg-purple-500/10 inline-block px-4 py-1.5 rounded-full mx-auto uppercase">
                  LƯỢT MỞ: {1 - openedChests.chest1}/1
                </div>

                <div className="flex-1 flex flex-col items-center justify-center min-h-[140px] mb-6">
                  <div className="relative mb-6">
                     <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full"></div>
                     <Gift size={64} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] relative z-10 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Phần thưởng (Random)</div>
                  <div className="text-lg font-black text-emerald-400 flex items-center justify-center gap-2 flex-wrap bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                    10k <VuiCoin size={16} className="text-orange-500 fill-orange-50" /> - 100k <VuiCoin size={16} className="text-orange-500 fill-orange-50" />
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Chỉ tiêu: 1,000 task</div>
                </div>

                <button onClick={() => handleOpenChest('chest1', 1)} disabled={openedChests.chest1 >= 1 || !!loadingChest} className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-slate-900 py-4 rounded-xl font-black text-sm uppercase tracking-wider disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(234,179,8,0.39)] transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                  {loadingChest === 1 && <Loader2 className="animate-spin" size={20} />} 10,000 <CoinTask size={20} className="text-slate-800" />
                </button>
              </div>
            </div>

            {/* Chest 2 */}
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl p-1 shadow-xl shadow-blue-500/20 group">
              <div className="bg-slate-900 rounded-[22px] p-6 text-center h-full flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                
                <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">Hòm Bí Ẩn 2</h3>
                <div className="text-blue-400 text-[10px] font-bold tracking-[0.2em] mb-6 border border-blue-500/30 bg-blue-500/10 inline-block px-4 py-1.5 rounded-full mx-auto uppercase">
                  LƯỢT MỞ: {10 - openedChests.chest2}/10
                </div>

                <div className="flex-1 flex flex-col items-center justify-center min-h-[140px] mb-6">
                  <div className="relative mb-6">
                     <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full"></div>
                     <Gift size={64} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] relative z-10 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Phần thưởng (Random)</div>
                  <div className="text-lg font-black text-emerald-400 flex items-center justify-center gap-2 flex-wrap bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                    10k <VuiCoin size={16} className="text-orange-500 fill-orange-50" /> - 100k <VuiCoin size={16} className="text-orange-500 fill-orange-50" />
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Chỉ tiêu: {(2500 + (openedChests.chest2 * 10)).toLocaleString()} task</div>
                </div>

                <button onClick={() => handleOpenChest('chest2', 2)} disabled={openedChests.chest2 >= 10 || !!loadingChest} className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-slate-900 py-4 rounded-xl font-black text-sm uppercase tracking-wider disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(234,179,8,0.39)] transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                  {loadingChest === 2 && <Loader2 className="animate-spin" size={20} />} 36,000 <CoinTask size={20} className="text-slate-800" />
                </button>
              </div>
            </div>

            {/* Chest 3 */}
            <div className="bg-gradient-to-br from-rose-500 to-orange-600 rounded-3xl p-1 shadow-xl shadow-rose-500/20 group">
              <div className="bg-slate-900 rounded-[22px] p-6 text-center h-full flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                
                <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">Hòm Bí Ẩn 3</h3>
                <div className="text-rose-400 text-[10px] font-bold tracking-[0.2em] mb-6 border border-rose-500/30 bg-rose-500/10 inline-block px-4 py-1.5 rounded-full mx-auto uppercase">
                  LƯỢT MỞ: {100 - openedChests.chest3}/100
                </div>

                <div className="flex-1 flex flex-col items-center justify-center min-h-[140px] mb-6">
                  <div className="relative mb-6">
                     <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full"></div>
                     <Gift size={64} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] relative z-10 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Phần thưởng (Random)</div>
                  <div className="text-lg font-black text-emerald-400 flex items-center justify-center gap-2 flex-wrap bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                    100k <VuiCoin size={16} className="text-orange-500 fill-orange-50" /> - 500k <VuiCoin size={16} className="text-orange-500 fill-orange-50" />
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Chỉ tiêu: {(10000 + (openedChests.chest3 * 20)).toLocaleString()} task</div>
                </div>

                <button onClick={() => handleOpenChest('chest3', 3)} disabled={openedChests.chest3 >= 100 || !!loadingChest} className="w-full bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-white py-4 rounded-xl font-black text-sm uppercase tracking-wider disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                  {loadingChest === 3 && <Loader2 className="animate-spin" size={20} />} 1,800,000 <VuiCoin size={20} className="text-orange-200 fill-orange-50/20 drop-shadow-md" />
                </button>
              </div>
            </div>
          </div>
        </AnimatedDiv>
      </div>  
    </div>
  );
}
