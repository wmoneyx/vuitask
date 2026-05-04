import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, ArrowRight, ExternalLink, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { safeFetch } from '@/lib/utils';
import { ConfirmModal } from './ConfirmModal';

export function AdminTasks() {
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'standard' | 'vip' | 'pre'>('all');
  const [pending, setPending] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmState, setConfirmState] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({ isOpen: false, message: '', onConfirm: () => {} });

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

  const getFilteredPending = () => {
    return pending.filter(task => {
        if (categoryFilter === 'all') return true;
        
        const name = (task.task_name || '').toUpperCase();
        const isVip = (task.task_id && task.task_id.startsWith('vip_')) || name.includes('REVIEW');
        const isPre = task.task_id === 'GMAIL_PRE' || name.includes('GMAIL');
        const isStandard = !isVip && !isPre;

        if (categoryFilter === 'standard') return isStandard;
        if (categoryFilter === 'vip') return isVip;
        if (categoryFilter === 'pre') return isPre;
        return true;
    });
  };

  const executeDecision = async (userId: string, taskId: string, decision: 'approve' | 'reject') => {
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

  const handleDecision = (userId: string, taskId: string, decision: 'approve' | 'reject') => {
    setConfirmState({
       isOpen: true,
       message: `Bạn có chắc chắn muốn ${decision === 'approve' ? 'DUYỆT' : 'TỪ CHỐI'} nhiệm vụ này?`,
       onConfirm: () => {
         executeDecision(userId, taskId, decision);
         setConfirmState({ ...confirmState, isOpen: false });
       }
    });
  };

  const handleClearHistory = () => {
    setConfirmState({
       isOpen: true,
       message: 'Bạn có chắc chắn muốn xóa TẤT CẢ lịch sử duyệt nhiệm vụ? Hành động này không thể hoàn tác.',
       onConfirm: async () => {
         setConfirmState({ ...confirmState, isOpen: false });
         const data = await safeFetch('/api/admin/clear-tasks-history', { method: 'POST' });
         if (data) {
           setHistory([]);
           showNotification({ title: 'Thành công', message: 'Đã xóa lịch sở.', type: 'success' });
         }
       }
    });
  };

  // Helper component for Long Press to copy ID
  const WorkerCell = ({ userUuid }: { userUuid: string }) => {
    const timerRef = React.useRef<any>(null);

    const startPress = () => {
      timerRef.current = setTimeout(() => {
        if (userUuid) {
          navigator.clipboard.writeText(userUuid);
          showNotification({
            title: 'Đã sao chép ID',
            message: `ID người dùng: ${userUuid}`,
            type: 'success'
          });
          // Trình duyệt hỗ trợ rung để báo hiệu cho mobile
          if (navigator.vibrate) navigator.vibrate(50);
        }
      }, 2000);
    };

    const cancelPress = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };

    return (
      <td 
        className="p-2 text-xs cursor-copy select-none active:bg-slate-100 transition-colors"
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        title="Nhấn giữ 2s để copy ID"
      >
        {userUuid?.slice(0, 8) || 'unknown'}...
      </td>
    );
  };

  const getTaskCategory = (taskId: string, taskName: string) => {
      const name = (taskName || '').toUpperCase();
      const isVip = (taskId && taskId.startsWith('vip_')) || name.includes('REVIEW');
      const isPre = taskId === 'GMAIL_PRE' || name.includes('GMAIL');
      return isVip ? 'vip' : isPre ? 'pre' : 'standard';
  }

  const renderVerificationDetails = (task: any) => {
      const cat = getTaskCategory(task.task_id, task.task_name);
      
      const session = task.session_data;
      const createdAt = session ? new Date(session.expires - 15 * 60 * 1000) : null;
      const verifiedAt = new Date(task.timestamp);
      const totalTime = createdAt ? Math.floor((verifiedAt.getTime() - createdAt.getTime()) / 1000) : 0;
      
      const formatTime = (sec: number) => {
         if (sec < 60) return `${sec} giây`;
         if (sec < 0) return 'N/A';
         return `${Math.floor(sec/60)} phút ${sec%60} giây`;
      };
      
      if (cat === 'standard') {
          return (
             <div className="flex flex-col gap-0.5 text-[11px] leading-tight">
                <div><span className="text-gray-500 font-medium">Link NV: </span> {session?.short_url ? <a href={session.short_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline inline-flex items-center gap-1">Click<ExternalLink size={10}/></a> : (task.url && task.url.startsWith('http') ? <a href={task.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Link</a> : 'N/A')}</div>
                <div><span className="text-gray-500 font-medium">Mã XN: </span> <span className="font-mono bg-gray-100 px-1 rounded truncate inline-block max-w-[120px] align-bottom" title={task.id}>{task.id}</span></div>
                <div><span className="text-gray-500 font-medium">Tạo: </span> {createdAt ? createdAt.toLocaleTimeString('vi-VN') : 'N/A'}</div>
                <div><span className="text-gray-500 font-medium">Xác minh: </span> {verifiedAt.toLocaleTimeString('vi-VN')}</div>
                <div><span className="text-gray-500 font-medium">Tổng làm: </span> <span className="text-purple-600 font-bold">{formatTime(totalTime)}</span></div>
             </div>
          );
      }
      if (cat === 'vip') {
          return (
             <div className="flex flex-col gap-0.5 text-[11px] leading-tight">
                <div><span className="text-gray-500 font-medium">Link NV: </span> {session?.short_url ? <a href={session.short_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline inline-flex items-center gap-1">Mở<ExternalLink size={10}/></a> : 'N/A'}</div>
                <div><span className="text-gray-500 font-medium">Link XN: </span> <a href={task.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline inline-flex items-center gap-1">H.thành<ExternalLink size={10}/></a></div>
                <div><span className="text-gray-500 font-medium">Tạo: </span> {createdAt ? createdAt.toLocaleTimeString('vi-VN') : 'N/A'}</div>
                <div><span className="text-gray-500 font-medium">Hoàn thành: </span> {verifiedAt.toLocaleTimeString('vi-VN')}</div>
                <div><span className="text-gray-500 font-medium">Tổng t.gian: </span> <span className="text-purple-600 font-bold">{formatTime(totalTime)}</span></div>
             </div>
          );
      }
      if (cat === 'pre') {
          let email = task.url || '';
          let note = 'Không có';
          if (email && email.includes('|||')) {
             const parts = email.split('|||');
             email = parts[0];
             note = parts[1];
          }
          return (
             <div className="flex flex-col gap-0.5 text-[11px] leading-tight w-[160px]">
                <div><span className="text-gray-500 font-medium">Email: </span> <span className="font-bold text-slate-800 break-all">{email}</span></div>
                <div><span className="text-gray-500 font-medium">Pass: </span> <span className="font-mono text-rose-600 font-bold bg-rose-50 px-1 rounded">Zhy99!!!</span></div>
                <div><span className="text-gray-500 font-medium">Ghi chú: </span> <span className="italic text-gray-600 truncate block">{note}</span></div>
                <div><span className="text-gray-500 font-medium">Tạo: </span> {createdAt ? createdAt.toLocaleTimeString('vi-VN') : 'N/A'}</div>
                <div><span className="text-gray-500 font-medium">Hoàn thành: </span> {verifiedAt.toLocaleTimeString('vi-VN')}</div>
                <div><span className="text-gray-500 font-medium">Tổng t.gian: </span> <span className="text-purple-600 font-bold">{formatTime(totalTime)}</span></div>
             </div>
          );
      }
      return null;
  }

  return (
    <div className="space-y-6">
      <ConfirmModal 
        isOpen={confirmState.isOpen} 
        message={confirmState.message} 
        onConfirm={confirmState.onConfirm} 
        onCancel={() => setConfirmState({ ...confirmState, isOpen: false })} 
      />
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
          <div className="flex gap-2 mb-2 sm:mb-0">
             {(['all', 'standard', 'vip', 'pre'] as const).map(cat => (
                <button 
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-lg font-bold text-xs uppercase ${categoryFilter === cat ? 'bg-slate-200' : 'bg-gray-50'} hover:bg-gray-100`}
                >
                    {cat}
                </button>
             ))}
          </div>
        )}
        
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
                <th className="p-2 w-64">Thông tin xác minh</th>
                <th className="p-2 text-center">Thưởng</th>
                <th className="p-2 text-center">Trạng thái</th>
                <th className="p-2 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 italic text-sm">
               {loading && (
                 <tr><td colSpan={7} className="p-4 text-center"><Loader2 className="animate-spin mx-auto text-slate-400" /></td></tr>
               )}
                 {!loading && activeTab === 'pending' && getFilteredPending().map((task, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                     <td className="p-2 font-mono text-xs">{task.id.slice(-6)}</td>
                     <td className="p-2 font-bold">{task.task_name}</td>
                     <WorkerCell userUuid={task.user_uuid} />
                     <td className="p-2 align-top">
                        {renderVerificationDetails(task)}
                     </td>
                     <td className="p-2 text-center font-bold text-emerald-600 align-top">+{task.reward}</td>
                     <td className="p-2 text-center align-top">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${statusBadgeColor(task.status)}`}>
                           {task.status}
                        </span>
                     </td>
                     <td className="p-2 align-top">
                        <div className="flex items-center justify-center gap-1.5">
                           <button onClick={() => handleDecision(task.user_uuid, task.id, 'approve')} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"><CheckCircle size={16}/></button>
                           <button onClick={() => handleDecision(task.user_uuid, task.id, 'reject')} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"><XCircle size={16}/></button>
                        </div>
                     </td>
                  </tr>
                ))}
               {!loading && activeTab === 'history' && history.map((task, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                     <td className="p-2 font-mono text-xs align-top">{task.id.slice(-6)}</td>
                     <td className="p-2 font-bold align-top">{task.task_name}</td>
                     <WorkerCell userUuid={task.user_uuid} />
                     <td className="p-2 align-top">
                        {renderVerificationDetails(task)}
                     </td>
                     <td className="p-2 text-center font-bold text-emerald-600 align-top">+{task.reward}</td>
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
