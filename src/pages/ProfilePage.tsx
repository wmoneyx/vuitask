import React, { useState, useEffect } from 'react';
import { User, Camera, AlertTriangle } from 'lucide-react';
import { AnimatedDiv, AnimatedText } from "@/components/ui/AnimatedText";
import { VuiCoin } from "@/components/ui/VuiCoin";
import { CoinTask } from "@/components/ui/CoinTask";

export function ProfilePage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [status, setStatus] = useState<"AN TOÀN" | "CẢNH BÁO" | "GIAN LẬN" | "BAN">("AN TOÀN");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [vuiBalance, setVuiBalance] = useState(0);
  const [taskBalance, setTaskBalance] = useState(0);

  useEffect(() => {
     const uuid = localStorage.getItem('userUUID');
     const storedEmail = localStorage.getItem('userEmail');
     const storedName = localStorage.getItem('userName');
     if (uuid) {
        setUsername(storedName || uuid);
        setEmail(storedEmail || 'Chưa thiết lập');
        setAvatarUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${uuid}`);
        
        fetch(`/api/user/sync-profile`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ uuid, email: storedEmail, userName: storedName })
        }).then(res => res.json()).then(data => {
            if (data.profile) {
                setVuiBalance(data.profile.vui_coin_balance);
                setTaskBalance(data.profile.coin_task_balance);
                if (data.profile.user_name) {
                  setUsername(data.profile.user_name);
                  localStorage.setItem('userName', data.profile.user_name);
                }
                if (data.profile.is_banned) setStatus("BAN");
            }
        });
     }
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const getStatusColor = () => {
    switch(status) {
      case "AN TOÀN": return "text-emerald-400";
      case "CẢNH BÁO": return "text-yellow-400";
      case "GIAN LẬN": return "text-orange-400";
      case "BAN": return "text-red-600";
      default: return "text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-slate-800 mb-6">
        <User className="text-blue-500" size={28} />
        <h2 className="text-2xl font-bold uppercase tracking-tight">
          <AnimatedText delay={0.1}>Hồ Sơ Cá Nhân</AnimatedText>
        </h2>
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
          <h3 className="text-xl font-black text-slate-900 truncate" title={username}>{username || "Người dùng"}</h3>
          <p className="text-gray-500">{email || "Chưa thiết lập email"}</p>
          <input 
            type="text" 
            placeholder="Nhập URL ảnh đại diện..." 
            className="mt-3 bg-gray-50 rounded-xl px-4 py-2 w-full max-w-sm text-sm"
            onChange={(e) => setAvatarUrl(e.target.value)}
          />
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
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg">
            <h4 className="text-gray-400 text-xs font-bold uppercase mb-2">Trạng thái</h4>
            <div className={`text-2xl font-black ${getStatusColor()}`}>{status}</div>
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
