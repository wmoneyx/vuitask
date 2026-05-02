import React, { useState, useEffect } from 'react';
import { User, Camera, AlertTriangle } from 'lucide-react';
import { AnimatedDiv, AnimatedText } from "@/components/ui/AnimatedText";
import { VuiCoin } from "@/components/ui/VuiCoin";
import { CoinTask } from "@/components/ui/CoinTask";
import { safeFetch } from '@/lib/utils';

import { useNavigate } from 'react-router-dom';
import { useUser } from '@/UserContext';

export function ProfilePage() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useUser();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [status, setStatus] = useState<"AN TOÀN" | "CẢNH BÁO" | "GIAN LẬN" | "BỊ GIÁM SÁT" | "BAN">("AN TOÀN");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [vuiBalance, setVuiBalance] = useState(0);
  const [taskBalance, setTaskBalance] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
     if (profile) {
        setUsername(profile.user_name || profile.user_uuid);
        setEmail(profile.user_email || 'Chưa thiết lập');
        setAvatarUrl(profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user_uuid}`);
        setVuiBalance(profile.vui_coin_balance || 0);
        setTaskBalance(profile.coin_task_balance || 0);
        if (profile.is_banned) {
            setStatus("BAN");
        } else if (profile.is_suspected) {
            setStatus("BỊ GIÁM SÁT");
        } else {
            setStatus("AN TOÀN");
        }
     }
  }, [profile]);

  const saveProfile = async () => {
    if (!profile?.user_uuid) return;
    
    setIsSaving(true);
    try {
        const data = await safeFetch(`/api/user/sync-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uuid: profile.user_uuid, userName: username, avatarUrl: avatarUrl })
        });
        
        if (data && data.profile) {
            await refreshProfile();
        }
    } catch (err) {}
    setIsSaving(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getStatusColor = () => {
    switch(status) {
      case "AN TOÀN": return "text-emerald-400";
      case "BỊ GIÁM SÁT": return "text-purple-400";
      case "CẢNH BÁO": return "text-yellow-400";
      case "GIAN LẬN": return "text-orange-400";
      case "BAN": return "text-red-600";
      default: return "text-gray-400";
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between text-slate-800 mb-6">
        <div className="flex items-center gap-3">
          <User className="text-blue-500" size={28} />
          <h2 className="text-2xl font-bold uppercase tracking-tight">
            <AnimatedText delay={0.1}>Hồ Sơ Cá Nhân</AnimatedText>
          </h2>
        </div>
        <button 
          onClick={handleLogout}
          className="md:hidden px-4 py-2 bg-red-50 text-red-500 font-bold rounded-xl text-xs uppercase"
        >
          Đăng xuất
        </button>
      </div>

      <AnimatedDiv delay={0.2} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-4 border-slate-100 relative group shrink-0">
          {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover"/> : <User size={40} className="text-slate-400" />}
          <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
            <Camera size={24} className="text-white" />
            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </label>
        </div>
        <div className="flex-1 text-center md:text-left overflow-hidden">
          <input 
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="text-xl font-black text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 outline-none w-full mb-1"
          />
          <p className="text-gray-500 mb-3">{email || "Chưa thiết lập email"}</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input 
              type="text" 
              value={avatarUrl}
              placeholder="URL ảnh đại diện..." 
              className="bg-gray-50 rounded-xl px-4 py-2 flex-1 text-sm border border-gray-100"
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
            <button 
                onClick={saveProfile}
                disabled={isSaving}
                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all hover:bg-slate-800 disabled:opacity-50"
            >
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </AnimatedDiv>

      <AnimatedDiv delay={0.3} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h4 className="text-gray-400 text-xs font-bold uppercase mb-2">Số dư VuiCoin</h4>
            <div className="text-2xl font-black text-emerald-600 flex items-center gap-2">
                {vuiBalance.toLocaleString()} <VuiCoin size={20} className="text-orange-500 fill-orange-50" />
            </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h4 className="text-gray-400 text-xs font-bold uppercase mb-2">Số dư CoinTask</h4>
            <div className="text-2xl font-black text-blue-600 flex items-center gap-2">
                {taskBalance.toLocaleString()} <CoinTask size={20} className="text-yellow-500" />
            </div>
        </div>
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden group">
            <h4 className="text-gray-400 text-xs font-bold uppercase mb-2">Trạng thái</h4>
            <div className={`text-2xl font-black ${getStatusColor()}`}>{status}</div>
            {profile && profile.task_bonus_percent > 0 && (
              <div className="mt-2 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded inline-block border border-emerald-400/20">
                +{profile.task_bonus_percent}% THƯỞNG TASK
              </div>
            )}
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
               <User size={100} />
            </div>
        </div>
      </AnimatedDiv>

      <AnimatedDiv delay={0.4} className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100">
        <h3 className="font-bold text-rose-600 mb-4 uppercase flex items-center gap-2"><AlertTriangle size={18}/> Xóa tài khoản vĩnh viễn</h3>
        <p className="text-gray-500 text-sm mb-4">Nếu bạn chắc chắn xóa tài khoản, vui lòng nhập <span className='font-bold text-slate-900 break-all'>"{username || "username"}"</span> vào ô bên dưới:</p>
        <div className='flex gap-4'>
            <input 
                value={deleteConfirm} 
                onChange={(e) => setDeleteConfirm(e.target.value)} 
                placeholder={`Nhập username`}
                className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-200"
            />
            <button 
                disabled={deleteConfirm !== username}
                onClick={() => setIsDeleting(true)}
                className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl uppercase transition-all shrink-0"
            >
                Xóa vĩnh viễn
            </button>
        </div>
      </AnimatedDiv>
    </div>
  );
}
