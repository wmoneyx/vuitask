import React, { useState, useEffect } from 'react';
import { CreditCard, Copy, CheckCircle, XCircle, Gamepad2, Send } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { safeFetch } from '@/lib/utils';

export function AdminWithdrawals() {
  const { showNotification } = useNotification();
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'history'>('pending');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  useEffect(() => {
    fetchWithdrawals();
    const interval = setInterval(fetchWithdrawals, 10000); // Poll every 10s instead of 3s
    return () => clearInterval(interval);
  }, []);

  const fetchWithdrawals = async () => {
    const data = await safeFetch('/api/admin/withdrawals');
    if (data && data.withdrawals) setWithdrawals(data.withdrawals);
  };

  const pending = withdrawals.filter(w => w.status === 'Đang chờ duyệt');
  const history = withdrawals.filter(w => w.status !== 'Đang chờ duyệt');

  const displayedList = activeSubTab === 'pending' ? pending : history;

  const handleApprove = async (id: string, amount: number) => {
    const confirmMessage = `Số tiền ${amount.toLocaleString()}đ đã được thanh toán thành công tới bạn!`;
    const data = await safeFetch('/api/community/admin-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId: id, content: confirmMessage })
    });
    if (data) {
        fetchWithdrawals();
        showNotification({ title: 'Thành công', message: "Đã duyệt và thông báo lên cộng đồng!", type: 'success' });
    }
  };

  const handleReject = async (id: string, amount: number) => {
    if (!window.confirm(`Bạn có chắc chắn muốn từ chối và hoàn lại ${amount.toLocaleString()}đ cho người dùng?`)) return;
    const data = await safeFetch('/api/admin/reject-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId: id })
    });
    if (data && data.success) {
        fetchWithdrawals();
        showNotification({ title: 'Đã từ chối', message: "Đã từ chối và hoàn tiền kèm phí 5%!", type: 'info' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
        <button 
          onClick={() => setActiveSubTab('pending')}
          className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${activeSubTab === 'pending' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          Chờ duyệt ({pending.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('history')}
          className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${activeSubTab === 'history' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          Lịch sử duyệt ({history.length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedList.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col relative overflow-hidden">
             {/* Type Badge */}
             <div className="absolute top-0 right-0">
               <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase">RÚT TIỀN</span>
             </div>

             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center shrink-0">
                  {item.user?.avatar ? <img src={item.user.avatar} alt="avatar" className="w-full h-full object-cover" /> : <CreditCard className="text-slate-600" size={20} />}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-lg">{item.amount?.toLocaleString()}đ</div>
                  <div className="text-xs text-gray-500">{item.user?.name}</div>
                </div>
             </div>

             <div className="flex-1 space-y-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Trạng thái:</span> <span className={`font-bold ${item.status === 'Đã thanh toán' ? 'text-emerald-500' : 'text-orange-500'}`}>{item.status}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">TG:</span> <span className="font-mono text-xs">{new Date(item.timestamp).toLocaleString()}</span></div>
             </div>

             {activeSubTab === 'pending' && (
               <div className="flex gap-2 mt-auto">
                 <button onClick={() => handleApprove(item.id, item.amount)} className="flex-1 py-2.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                   <CheckCircle size={18} /> Duyệt & Trả lời
                 </button>
                 <button onClick={() => handleReject(item.id, item.amount)} className="flex-1 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                   <XCircle size={18} /> Từ chối
                 </button>
               </div>
             )}
          </div>
        ))}
        {displayedList.length === 0 && (
          <div className="col-span-full p-8 text-center text-gray-400 font-medium">
            Không có dữ liệu
          </div>
        )}
      </div>
    </div>
  );
}
