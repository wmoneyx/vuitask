import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, ArrowRight, ExternalLink, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export function AdminTasks() {
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pending-tasks');
      const data = await res.json();
      setPending(data.pending || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (userId: string, taskId: string, decision: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/approve-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, taskId, decision })
      });
      if (res.ok) {
        setPending(prev => prev.filter(p => p.id !== taskId));
        showNotification({ 
          title: decision === 'approve' ? 'Đã duyệt' : 'Đã từ chối', 
          message: `Nhiệm vụ #${taskId.slice(-6)} đã được xử lý.`, 
          type: decision === 'approve' ? 'success' : 'info' 
        });
      }
    } catch (e) {
      showNotification({ title: 'Lỗi', message: "Lỗi xử lý duyệt nhiệm vụ", type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-2">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${activeTab === 'pending' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Duyệt nhiệm vụ ({pending.length})
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${activeTab === 'history' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Lịch sử duyệt
          </button>
        </div>
        
        {activeTab === 'pending' && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Tìm kiếm ID nhiệm vụ..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all text-sm"
            />
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
             <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="p-4 rounded-tl-2xl w-24">ID</th>
                <th className="p-4">Nhiệm vụ</th>
                <th className="p-4">Người làm</th>
                <th className="p-4">URL</th>
                <th className="p-4 text-center">Thưởng</th>
                <th className="p-4 text-center">Duyệt V1</th>
                <th className="p-4 text-center">Duyệt V2</th>
                <th className="p-4 text-center">IP</th>
                <th className="p-4 text-center rounded-tr-2xl">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 italic text-sm">
               {loading && (
                 <tr><td colSpan={9} className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-slate-400" /></td></tr>
               )}
               {!loading && activeTab === 'pending' && pending.map((task, idx) => (
                 <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-4 font-mono text-xs">{task.id.slice(-6)}</td>
                    <td className="p-4 font-bold">{task.taskName}</td>
                    <td className="p-4 text-xs">{task.userId.slice(0, 8)}...</td>
                    <td className="p-4">
                       <a href={task.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                          LINK <ExternalLink size={12}/>
                       </a>
                    </td>
                    <td className="p-4 text-center font-bold text-emerald-600">+{task.reward}</td>
                    <td className="p-4 text-center">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${task.statusV1 === 'Đã duyệt' ? 'text-emerald-600 bg-emerald-50' : 'text-orange-600 bg-orange-50'}`}>
                          24 GIỜ
                       </span>
                    </td>
                    <td className="p-4 text-center">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${task.statusV2 === 'Đã duyệt' ? 'text-emerald-600 bg-emerald-50' : 'text-orange-600 bg-orange-50'}`}>
                          10 NGÀY
                       </span>
                    </td>
                    <td className="p-4 text-center text-xs">{task.ip}</td>
                    <td className="p-4">
                       <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleDecision(task.userId, task.id, 'approve')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"><CheckCircle size={18}/></button>
                          <button onClick={() => handleDecision(task.userId, task.id, 'reject')} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"><XCircle size={18}/></button>
                       </div>
                    </td>
                 </tr>
               ))}
               {!loading && activeTab === 'pending' && pending.length === 0 && (
                 <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-400 font-medium">Chưa có nhiệm vụ nào cần duyệt.</td>
                 </tr>
               )}
            </tbody>
          </table>
          {activeTab === 'history' && (
            <div className="p-8 text-center text-gray-400 font-medium">Chưa có lịch sử duyệt.</div>
          )}
        </div>
      </div>
    </div>
  );
}
