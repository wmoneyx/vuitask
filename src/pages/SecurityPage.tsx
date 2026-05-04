import React, { useEffect, useState } from 'react';
import { Shield, Lock, MapPin, Users, Wifi, UserCheck, Loader2 } from 'lucide-react';
import { AnimatedDiv, AnimatedText } from "@/components/ui/AnimatedText";

export function SecurityPage() {
  const [ips, setIps] = useState<any[]>([]);
  const [isChangingPass, setIsChangingPass] = useState(false);

  useEffect(() => {
     const uuid = localStorage.getItem('userUUID');
     if (uuid) {
        // Log IP
        fetch('/api/user/log-ip', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ uuid })
        });

        // Fetch IPs
        fetch(`/api/user/ips?uuid=${uuid}`)
          .then(res => res.json())
          .then(data => {
              if (data.ips) setIps(data.ips);
          });
     }
  }, []);

  const currentIp = ips.length > 0 ? ips[0].ip_address : 'Đang tải...';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-slate-800 mb-6">
        <Shield className="text-blue-500" size={28} />
        <h2 className="text-2xl font-bold uppercase tracking-tight">
          <AnimatedText delay={0.1}>Bảo mật & IP</AnimatedText>
        </h2>
      </div>

      <AnimatedDiv delay={0.2} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pass Change */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-4 uppercase">Đổi mật khẩu</h3>
            <div className="space-y-4">
                <input type="password" placeholder="Mật khẩu cũ" className="w-full bg-gray-50 rounded-xl p-3 border-none" />
                <input type="password" placeholder="Mật khẩu mới" className="w-full bg-gray-50 rounded-xl p-3 border-none" />
                <button 
                  disabled={isChangingPass}
                  onClick={async () => {
                     setIsChangingPass(true);
                     await new Promise(r => setTimeout(r, 1000));
                     setIsChangingPass(false);
                  }}
                  className="w-full bg-slate-900 text-white font-bold py-3 flex items-center justify-center gap-2 rounded-xl uppercase disabled:opacity-50"
                >
                  {isChangingPass && <Loader2 className="animate-spin" size={20} />}
                  Xác nhận
                </button>
            </div>
        </div>

        {/* Account Status */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl">
            <h3 className="font-bold text-lg mb-4 uppercase">Trạng thái</h3>
            <div className="space-y-3 text-sm">
                <div className='flex justify-between'><span className='text-gray-400'>IP hiện tại:</span> {currentIp}</div>
                <div className='flex justify-between'><span className='text-gray-400'>Số người đăng nhập:</span> 1</div>
                <div className='flex justify-between'><span className='text-gray-400'>Trạng thái:</span> <span className='text-emerald-400 font-bold'>ONLINE</span></div>
                <div className='flex justify-between'><span className='text-gray-400'>Xác minh:</span> <span className='text-blue-400 font-bold'>ĐÃ XÁC MINH</span></div>
            </div>
        </div>
      </AnimatedDiv>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-slate-800 mb-4 uppercase text-sm">Lịch sử đăng nhập</h3>
        <div className="space-y-3">
            {ips.length === 0 && <div className="text-gray-400 text-sm">Chưa có lịch sử</div>}
            {ips.map((ip, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl" title={ip.user_agent}>
                  <div className='flex items-center gap-3'>
                      <MapPin className='text-gray-400' size={18}/>
                      <div>
                          <div className='font-bold text-sm'>{ip.ip_address}</div>
                          <div className='text-xs text-gray-500'>Đã ghi nhận</div>
                      </div>
                  </div>
                  <div className='text-xs font-bold text-gray-400'>{new Date(ip.last_seen).toLocaleString()}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
