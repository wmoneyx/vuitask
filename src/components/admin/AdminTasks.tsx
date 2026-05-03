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
  const [confirmModal, setConfirmModal] = useState<{userId: string, taskId: string, decision: 'approve' | 'reject'} | null>(null);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchPending();
    fetchHistory();
    const interval = setInterval(() => {
      fetchPending();
      fetchHistory();
    }, 5000); // Poll every 5s for faster sync as requested
    return () => clearInterval(interval);
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
    const { userId, taskId, decision } = confirmModal;

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
    
    setIsProcessing(false);
    setConfirmModal(null);
  };

  const handleDecision = (userId: string, taskId: string, decision: 'approve' | 'reject') => {
    setConfirmModal({ userId, taskId, decision });
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa TẤT CẢ lịch sử duyệt nhiệm vụ? Hành động này không thể hoàn tác.')) return;
    const data = await safeFetch('/api/admin/clear-tasks-history', {
      method: 'POST'
    });
    if (data) {
      setHistory([]);
      showNotification({ title: 'Thành công', message: 'Đã xóa lịch sở.', type: 'success' });
    }
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
                <th className="p-2 w-20">Loại</th>
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
                 <tr><td colSpan={8} className="p-4 text-center"><Loader2 className="animate-spin mx-auto text-slate-400" /></td></tr>
               )}
                 {!loading && activeTab === 'pending' && pending.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                     <td className="p-2 font-mono text-xs">{task.id.slice(-6)}</td>
                     <td className="p-2">
                        <TaskTypeBadge task={task} />
                     </td>
                     <td className="p-2 font-bold">{task.task_name}</td>
                     <WorkerCell userUuid={task.user_uuid} />
                     <td className="p-2">
                        <button 
                          onClick={() => setSelectedTask(task)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-xs hover:bg-indigo-100 transition-all active:scale-95 shadow-sm border border-indigo-100"
                        >
                          <ExternalLink size={12}/> CHI TIẾT
                        </button>
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
               {!loading && activeTab === 'history' && history.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                     <td className="p-2 font-mono text-xs">{task.id.slice(-6)}</td>
                     <td className="p-2">
                        <TaskTypeBadge task={task} />
                     </td>
                     <td className="p-2 font-bold">{task.task_name}</td>
                     <WorkerCell userUuid={task.user_uuid} />
                     <td className="p-2">
                        <button 
                          onClick={() => setSelectedTask(task)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-xs hover:bg-indigo-100 transition-all active:scale-95 shadow-sm border border-indigo-100"
                        >
                          <ExternalLink size={12}/> CHI TIẾT
                        </button>
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
                    <td colSpan={8} className="p-4 text-center text-gray-400 font-medium">Chưa có nhiệm vụ nào cần duyệt.</td>
                 </tr>
               )}
               {!loading && activeTab === 'history' && history.length === 0 && (
                 <tr>
                    <td colSpan={8} className="p-4 text-center text-gray-400 font-medium">Chưa có lịch sử duyệt.</td>
                 </tr>
               )}
            </tbody>
          </table>
        </div>
      </div>
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Xác nhận Hành Động</h3>
            <p className="text-sm text-gray-500">
              Bạn có chắc chắn muốn {confirmModal.decision === 'approve' ? 'DUYỆT' : 'TỪ CHỐI'} nhiệm vụ này không?
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
                className={`px-4 py-2 rounded-xl text-white font-bold disabled:opacity-50 flex items-center gap-2 ${confirmModal.decision === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}`}
              >
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-md space-y-6 shadow-2xl relative">
            <button onClick={() => setSelectedTask(null)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
              <XCircle size={24} className="text-gray-400" />
            </button>

            <div className="text-center">
              <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Chi tiết nhiệm vụ</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{selectedTask.task_name}</p>
            </div>

            <div className="space-y-4">
              {/* Type Specific Info & Common Info */}
              {(() => {
                const { type, meta } = getTaskType(selectedTask);
                const isPre = type === 'pre';
                const isVip = type === 'vip';
                const isStd = type === 'standard';

                return (
                  <>
                    {isPre && (
                      <div className="grid grid-cols-1 gap-3">
                        <DetailRow label="Email" value={selectedTask.url} />
                        <DetailRow label="Mật khẩu cố định" value={meta.password || 'Zhy99!!!'} />
                        <DetailRow label="Ghi chú người dùng" value={meta.note || 'Không có'} />
                      </div>
                    )}

                    {isVip && (
                      <div className="grid grid-cols-1 gap-3">
                        <DetailRow label="Link nhiệm vụ" value={meta.short_url || selectedTask.url} />
                        <DetailRow label="Link người dùng xác minh" value={meta.review_url || selectedTask.url} />
                      </div>
                    )}

                    {isStd && (
                      <div className="grid grid-cols-1 gap-3">
                        <DetailRow label="Link nhiệm vụ" value={meta.short_url || selectedTask.url} />
                        <DetailRow label="Mã xác minh (Phiên)" value={selectedTask.id} />
                      </div>
                    )}

                    {/* Time Info */}
                    {selectedTask.start_timestamp && (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Thời gian tạo:</span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(new Date(selectedTask.start_timestamp).toLocaleString('vi-VN'));
                                  showNotification({ title: 'Đã copy', message: 'Thời gian tạo', type: 'success' });
                                }}
                                className="text-[10px] text-indigo-500 font-bold uppercase"
                              >
                                Copy
                              </button>
                          </div>
                          <span className="font-mono font-black text-slate-700">{new Date(selectedTask.start_timestamp).toLocaleString('vi-VN')}</span>
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                {isStd ? 'Thời gian xác minh:' : 'Thời gian hoàn thành:'}
                              </span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(new Date(selectedTask.timestamp).toLocaleString('vi-VN'));
                                  showNotification({ title: 'Đã copy', message: isStd ? 'Thời gian xác minh' : 'Thời gian hoàn thành', type: 'success' });
                                }}
                                className="text-[10px] text-indigo-500 font-bold uppercase"
                              >
                                Copy
                              </button>
                          </div>
                          <span className="font-mono font-black text-slate-700">{new Date(selectedTask.timestamp).toLocaleString('vi-VN')}</span>
                        </div>

                        <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                          <span className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">Tổng thời gian làm:</span>
                          <span className="text-sm font-black text-indigo-600">
                              {calculateTotalTime(selectedTask.start_timestamp, selectedTask.timestamp)}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <button 
              onClick={() => setSelectedTask(null)}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-slate-900/20"
            >
              ĐÓNG
            </button>
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

function getTaskType(task: any) {
  let meta: any = {};
  if (!task) return { type: 'standard', meta };
  
  try {
    meta = typeof task.metadata === 'string' ? JSON.parse(task.metadata) : (task.metadata || {});
  } catch (e) {
    meta = {};
  }
  
  let type = meta.type || 'standard';
  if (type === 'standard') {
    const name = (task.task_name || '').toUpperCase();
    if (name.includes('GMAIL')) type = 'pre';
    else if (name.includes('REVIEW')) type = 'vip';
  }
  return { type, meta };
}

function TaskTypeBadge({ task }: { task: any }) {
  const { type } = getTaskType(task);

  if (type === 'pre') return <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 uppercase">PRE</span>;
  if (type === 'vip') return <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 uppercase">VIP</span>;
  return <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">TASK</span>;
}

function DetailRow({ label, value, copyable = true }: { label: string, value: string, copyable?: boolean }) {
  const { showNotification } = useNotification();
  
  const copy = () => {
    navigator.clipboard.writeText(value);
    showNotification({ title: 'Đã copy', message: label, type: 'success' });
  };

  return (
    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{label}</span>
        {copyable && (
          <button onClick={copy} className="text-indigo-500 hover:text-indigo-700 text-[10px] font-bold uppercase tracking-widest">Copy</button>
        )}
      </div>
      <div className="text-sm font-bold text-slate-800 break-all">{value || 'N/A'}</div>
    </div>
  );
}

function calculateTotalTime(start: number, end: number) {
  const diff = end - start;
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${mins} phút ${secs} giây`;
}
