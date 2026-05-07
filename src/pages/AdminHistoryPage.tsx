import React, { useEffect, useState } from 'react';
import { safeFetch } from '@/lib/utils';
import { Loader2, Search, CheckSquare, CreditCard, Gift } from 'lucide-react';

export function AdminHistoryPage() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'withdrawals' | 'gifts'>('tasks');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async (tab: 'tasks' | 'withdrawals' | 'gifts') => {
    setLoading(true);
    let endpoint = '/api/admin/tasks-history';
    if (tab === 'withdrawals') endpoint = '/api/admin/withdrawals?status=history';
    if (tab === 'gifts') endpoint = '/api/admin/system/giftcodes'; // FIXME: Need a proper endpoint for gift redemptions, this might be codes list.
    
    const res = await safeFetch(endpoint);
    if (res) {
      if (tab === 'tasks') setData(res.history || []);
      else if (tab === 'withdrawals') setData(res.withdrawals || []);
      else setData(res.codes || []); // Still need real redemption endpoint
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const filtered = data.filter(h => 
    JSON.stringify(h).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-black mb-6 text-slate-900 uppercase tracking-tight">Tra cứu lịch sử hệ thống</h1>
      
      <div className="flex gap-2 mb-6">
        {[
           { id: 'tasks', name: 'Nhiệm vụ', icon: CheckSquare },
           { id: 'withdrawals', name: 'Rút tiền', icon: CreditCard },
           { id: 'gifts', name: 'Đổi quà', icon: Gift }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-500'}`}
          >
             <tab.icon size={18}/> {tab.name}
          </button>
        ))}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input 
          type="text" 
          placeholder="Tìm kiếm..." 
          className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-slate-400" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-4 text-left">Nội dung</th>
                <th className="p-4 text-left">Người dùng</th>
                <th className="p-4 text-left">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((record: any) => (
                <tr key={record.id || record.code}>
                  <td className="p-4 font-bold text-slate-800">
                    {activeTab === 'tasks' && record.task_name}
                    {activeTab === 'withdrawals' && `Rút ${record.amount}`}
                    {activeTab === 'gifts' && `Gift ${record.code}`}
                  </td>
                  <td className="p-4 font-mono text-xs text-gray-600">{record.user_uuid || 'N/A'}</td>
                  <td className="p-4 text-gray-400 text-xs">{new Date(record.timestamp || record.created_at).toLocaleString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
