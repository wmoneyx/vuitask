import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, ArrowRight, ExternalLink, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { safeFetch } from '@/lib/utils';

export function AdminTasks() {
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [pending, setPending] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPending();
    fetchHistory();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    const data = await safeFetch('/api/admin/pending-tasks');
    if (data) {
      setPending(data.pending || []);
    }
    setLoading(false);
  };

  const fetchHistory = async () => {
    const data = await safeFetch('/api/admin/tasks-history');
    if (data) {
      setHistory(data.history || []);
    }
  };

  const handleDecision = async (userId: string, taskId: string, decision: 'approve' | 'reject') => {
    const data = await safeFetch('/api/admin/approve-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, taskId, decision })
    });
    
    if (data) {
      setPending(prev => prev.filter(p => p.id !== taskId));
      fetchHistory();
      showNotification({ 
        title: decision === 'approve' ? 'Đã duyệt' : 'Đã từ chối', 
        message: `Nhiệm vụ #${taskId.slice(-6)} đã được xử lý.`, 
        type: decision === 'approve' ? 'success' : 'info' 
      });
    } else {
      showNotification({ title: 'Lỗi', message: "Lỗi xử lý duyệt nhiệm vụ", type: 'error' });
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa TẤT CẢ lịch sử duyệt nhiệm vụ? Hành động này không thể hoàn tác.')) return;
    const data = await safeFetch('/api/admin/clear-tasks-history', {
      method: 'POST'
    });
    if (data) {
      setHistory([]);
      showNotification({ title: 'Thành công', message: 'Đã xóa lịch sử.', type: 'success' });
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
            Lịch sử duyệt ({history.length})
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

        {activeTab === 'history' && history.length > 0 && (
          <button 
            onClick={handleClearHistory}
            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold text-sm transition-colors"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-full">
             <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="p-2 rounded-tl-2xl w-24">ID</th>
                <th className="p-2">Nhiệm vụ</th>
                <th className="p-2">Người làm</th>
                <th className="p-2">URL</th>
                <th className="p-2 text-center">Thưởng</th>
                <th className="p-2 text-center">Trạng thái</th>
                <th className="p-2 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 italic text-sm">
               {loading && (
                 <tr><td colSpan={7} className="p-4 text-center"><Loader2 className="animate-spin mx-auto text-slate-400" /></td></tr>
               )}
                 {!loading && activeTab === 'pending' && pending.map((task, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                     <td className="p-2 font-mono text-xs">{task.id.slice(-6)}</td>
                     <td className="p-2 font-bold">{task.task_name}</td>
                     <td className="p-2 text-xs">{task.user_uuid?.slice(0, 8) || 'unknown'}...</td>
                     <td className="p-2">
                        <a href={task.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                           LINK <ExternalLink size={12}/>
                        </a>
                     </td>
                     <td className="p-2 text-center font-bold text-emerald-600">+{task.reward}</td>
                     <td className="p-2 text-center">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${statusBadgeColor(task.status)}`}>
                           {task.status}
                        </span>
                     </td>
                     <td className="p-2">
                        <div className="flex items-center justify-center gap-1.5">
                           <button onClick={() => handleDecision(task.user_uuid, task.id, 'approve')} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"><CheckCircle size={16}/></button>
                           <button onClick={() => handleDecision(task.user_uuid, task.id, 'reject')} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"><XCircle size={16}/></button>
                        </div>
                     </td>
                  </tr>
                ))}
               {!loading && activeTab === 'history' && history.map((task, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                     <td className="p-2 font-mono text-xs">{task.id.slice(-6)}</td>
                     <td className="p-2 font-bold">{task.task_name}</td>
                     <td className="p-2 text-xs">{task.user_uuid?.slice(0, 8) || 'unknown'}...</td>
                     <td className="p-2">
                        <a href={task.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                           LINK <ExternalLink size={12}/>
                        </a>
                     </td>
                     <td className="p-2 text-center font-bold text-emerald-600">+{task.reward}</td>
                     <td className="p-2 text-center">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${statusBadgeColor(task.status)}`}>
                           {task.status}
                        </span>
                     </td>
                     <td className="p-2 text-center text-xs text-gray-400">
                        {new Date(task.timestamp).toLocaleDateString('vi-VN')}
                     </td>
                  </tr>
                ))}
               {!loading && activeTab === 'pending' && pending.length === 0 && (
                 <tr>
                    <td colSpan={7} className="p-4 text-center text-gray-400 font-medium">Chưa có nhiệm vụ nào cần duyệt.</td>
                 </tr>
               )}
               {!loading && activeTab === 'history' && history.length === 0 && (
                 <tr>
                    <td colSpan={7} className="p-4 text-center text-gray-400 font-medium">Chưa có lịch sử duyệt.</td>
                 </tr>
               )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function statusBadgeColor(status: string) {
    if (status === 'Hoàn thành') return 'text-emerald-700 bg-emerald-100';
    if (status === 'Từ chối') return 'text-rose-700 bg-rose-100';
    return 'text-orange-700 bg-orange-100';
}
