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
  const [confirmModal, setConfirmModal] = useState<{action: 'approve' | 'reject' | 'clearHistory', userId?: string, taskId?: string} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const confirmDecision = async () => {
    if (!confirmModal || isProcessing) return;
    setIsProcessing(true);
    const { action, userId, taskId } = confirmModal;

    if (action === 'clearHistory') {
      const data = await safeFetch('/api/admin/clear-tasks-history', {
        method: 'POST'
      });
      if (data) {
        setHistory([]);
        showNotification({ title: 'Thành công', message: 'Đã xóa lịch sở duyệt.', type: 'success' });
      }
    } else {
      const data = await safeFetch('/api/admin/approve-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, taskId, decision: action })
      });
      
      if (data) {
        setPending(prev => prev.filter(p => p.id !== taskId));
        fetchHistory();
        showNotification({ 
          title: action === 'approve' ? 'Đã duyệt' : 'Đã từ chối', 
          message: `Nhiệm vụ #${taskId?.slice(-6)} đã được xử lý.`, 
          type: action === 'approve' ? 'success' : 'info' 
        });
      } else {
        showNotification({ title: 'Lỗi', message: "Lỗi xử lý duyệt nhiệm vụ", type: 'error' });
      }
    }
    
    setIsProcessing(false);
    setConfirmModal(null);
  };

  const handleDecision = (userId: string, taskId: string, decision: 'approve' | 'reject') => {
    setConfirmModal({ action: decision, userId, taskId });
  };

  const handleClearHistory = () => {
    setConfirmModal({ action: 'clearHistory' });
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
                     <WorkerCell userUuid={task.user_uuid} />
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
                     <WorkerCell userUuid={task.user_uuid} />
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
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold text-slate-900">Xác nhận Hành Động</h3>
            <p className="text-sm text-gray-500">
              {confirmModal.action === 'approve' && 'Bạn có chắc chắn muốn DUYỆT nhiệm vụ này không?'}
              {confirmModal.action === 'reject' && 'Bạn có chắc chắn muốn TỪ CHỐI nhiệm vụ này không?'}
              {confirmModal.action === 'clearHistory' && 'Bạn có chắc chắn muốn xóa TẤT CẢ lịch sử duyệt nhiệm vụ? Hành động này không thể hoàn tác.'}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setConfirmModal(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl text-gray-500 font-bold hover:bg-gray-100 disabled:opacity-50"
              >
                Hủy
              </button>
              <button 
                onClick={confirmDecision}
                disabled={isProcessing}
                className={`px-4 py-2 rounded-xl text-white font-bold disabled:opacity-50 flex items-center gap-2 ${
                  confirmModal.action === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'
                }`}
              >
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function statusBadgeColor(status: string) {
    if (status === 'Hoàn thành') return 'text-emerald-700 bg-emerald-100';
    if (status === 'Từ chối') return 'text-rose-700 bg-rose-100';
    return 'text-orange-700 bg-orange-100';
}
