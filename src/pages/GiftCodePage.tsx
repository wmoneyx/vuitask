import React, { useState } from 'react';
import { Ticket } from 'lucide-react';
import { AnimatedDiv, AnimatedText } from "@/components/ui/AnimatedText";
import { useNotification } from '../context/NotificationContext';
import { useUser } from "@/UserContext";
import { safeFetch } from "@/lib/utils";

export function GiftCodePage() {
  const { showNotification } = useNotification();
  const { profile, refreshProfile } = useUser();
  const [giftCode, setGiftCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [redemptionHistory, setRedemptionHistory] = useState<Array<{code: string, reward: number, time: string}>>(() => JSON.parse(localStorage.getItem('redemptionHistory') || '[]'));

  const handleRedeemGiftCode = async () => {
    if (!profile?.user_uuid || !giftCode) return;
    setLoading(true);

    try {
       const data = await safeFetch('/api/giftcode/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uuid: profile.user_uuid, code: giftCode })
       });
       
       if (data.error) {
          showNotification({ title: 'Thất bại', message: data.error, type: 'error' });
          return;
       }

       const reward = data.reward;
       const historyItem = { code: giftCode, reward, time: new Date().toLocaleString('vi-VN') };
       const newHistory = [historyItem, ...redemptionHistory];
       setRedemptionHistory(newHistory);
       localStorage.setItem('redemptionHistory', JSON.stringify(newHistory));
      
       setGiftCode('');
       showNotification({ title: 'Thành công', message: `Nhập mã thành công! Nhận ${reward.toLocaleString()} ${data.type === 'coin_task' ? 'Xu Task' : 'VuiCoin'}`, type: 'success' });
       
       await refreshProfile();
    } catch(e) {
       showNotification({ title: 'Thất bại', message: 'Lỗi hệ thống', type: 'error' });
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-slate-800 mb-6">
        <Ticket className="text-blue-500" size={28} />
        <h2 className="text-2xl font-bold uppercase tracking-tight">
          <AnimatedText delay={0.1}>Nhập GiftCode</AnimatedText>
        </h2>
      </div>

      <AnimatedDiv delay={0.2}>
        <div className="bg-slate-900 rounded-3xl p-6 shadow-xl mb-8">
          <div className="flex gap-4">
            <input 
              type="text" 
              value={giftCode} 
              onChange={(e) => setGiftCode(e.target.value)}
              placeholder="Nhập mã GiftCode..."
              className="flex-1 bg-slate-800 border-none rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-yellow-500 outline-none"
            />
            <button 
              onClick={handleRedeemGiftCode} 
              disabled={!giftCode || loading}
              className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-6 py-3 rounded-xl font-bold uppercase tracking-widest disabled:opacity-50 transition-colors flex items-center gap-2"
              >
              {loading && <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>}
              Xác nhận
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-slate-800 mb-4 uppercase text-sm">Lịch sử nhận thưởng</h3>
          <div className="space-y-3">
            {redemptionHistory.length === 0 ? (
              <p className="text-gray-500 italic text-sm">Chưa có mã nào được sử dụng</p>
            ) : (
              redemptionHistory.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{item.code}</div>
                    <div className="text-xs text-gray-500">{item.time}</div>
                  </div>
                  <div className="font-bold text-emerald-500">+{item.reward.toLocaleString()} VuiCoin</div>
                </div>
              ))
            )}
          </div>
        </div>
      </AnimatedDiv>
    </div>
  );
}
