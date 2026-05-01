import React, { useState, useEffect, useRef } from 'react';
import { Search, CheckCircle, XCircle, ArrowRight, ExternalLink, Loader2, Copy, Eye, Clock, X, Terminal } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { safeFetch } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const LongPressWrapper = ({ children, text, onCopy }: { children: React.ReactNode, text: string, onCopy: (s: string) => void }) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPressing, setIsPressing] = useState(false);

  const start = () => {
    setIsPressing(true);
    timerRef.current = setTimeout(() => {
      onCopy(text);
      setIsPressing(false);
    }, 2000);
  };

  const cancel = () => {
    setIsPressing(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <div 
      onMouseDown={start} 
      onMouseUp={cancel} 
      onMouseLeave={cancel}
      onTouchStart={start}
      onTouchEnd={cancel}
      className={`relative cursor-pointer transition-all ${isPressing ? 'scale-95 opacity-50' : ''}`}
    >
      {children}
      {isPressing && (
        <div className="absolute inset-0 bg-indigo-500/10 rounded-lg animate-pulse pointer-events-none" />
      )}
    </div>
  );
};

export function AdminTasks() {
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  // Sub-tabs for pending: 'task', 'vip', 'pre'
  const [taskType, setTaskType] = useState<'task' | 'vip' | 'pre'>('task');
  
  const [pending, setPending] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Pre-task details modal state
  const [selectedPreTask, setSelectedPreTask] = useState<any>(null);

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

  const handleDecision = async (userId: string, taskId: string, decision: 'approve' | 'reject', step?: 1 | 2) => {
    if (processingId) return;
    setProcessingId(taskId);
    
    try {
      const data = await safeFetch('/api/admin/approve-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, taskId, decision, step })
      });
      
      if (data) {
        // Re-fetch to get updated statuses
        await fetchPending();
        await fetchHistory();
        showNotification({ 
          title: decision === 'approve' ? 'Thành công' : 'Đã từ chối', 
          message: `Nhiệm vụ đã được xử lý.`, 
          type: decision === 'approve' ? 'success' : 'info' 
        });
      } else {
        showNotification({ title: 'Lỗi', message: "Lỗi xử lý duyệt nhiệm vụ", type: 'error' });
      }
    } finally {
      setProcessingId(null);
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification({ title: 'Đã sao chép', message: 'Thông tin đã được lưu vào bộ nhớ tạm.', type: 'info' });
  };

  const showPreDetails = (task: any) => {
     try {
        const details = JSON.parse(task.url);
        // Use fixed password if not present or as override if user requested it to be fixed
        setSelectedPreTask({ ...task, details: { ...details, password: 'Zhy99!!!' } });
     } catch (e) {
        setSelectedPreTask({ ...task, details: { email: task.url, password: 'Zhy99!!!', note: '' } });
     }
  };

  // Filtering logic
  const getFilteredTasks = (list: any[]) => {
    return list.filter(task => {
        const matchesQuery = task.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           task.task_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.user_uuid.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesQuery) return false;

        const isVip = task.task_id?.startsWith('vip_');
        const isPre = task.task_id === 'GMAIL_PRE';
        const isStandard = !isVip && !isPre;

        if (taskType === 'vip') return isVip;
        if (taskType === 'pre') return isPre;
        return isStandard;
    });
  };

  const displayedPending = getFilteredTasks(pending);
  const displayedHistory = getFilteredTasks(history);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-2">
        <div className="flex flex-wrap items-center gap-2">
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
          
          <div className="w-px h-6 bg-gray-200 mx-2 hidden sm:block"></div>

          <div className="flex bg-gray-100 p-1 rounded-xl">
             <button 
               onClick={() => setTaskType('task')}
               className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${taskType === 'task' ? 'bg-white shadow-sm text-slate-900' : 'text-gray-500 hover:text-slate-900'}`}
             >
               Task
             </button>
             <button 
               onClick={() => setTaskType('vip')}
               className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${taskType === 'vip' ? 'bg-white shadow-sm text-slate-900' : 'text-gray-500 hover:text-slate-900'}`}
             >
               VIP
             </button>
             <button 
               onClick={() => setTaskType('pre')}
               className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${taskType === 'pre' ? 'bg-white shadow-sm text-slate-900' : 'text-gray-500 hover:text-slate-900'}`}
             >
               PRE
             </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm nhiệm vụ/UUID..." 
                  className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all text-xs w-48"
                />
            </div>
            {activeTab === 'history' && history.length > 0 && (
              <button 
                onClick={handleClearHistory}
                className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold text-xs transition-colors"
              >
                Xóa tất cả
              </button>
            )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-full">
             <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-[10px] uppercase tracking-wider text-slate-500 font-black">
                <th className="p-4 w-24">ID</th>
                <th className="p-4">Nhiệm vụ</th>
                <th className="p-4">Người làm</th>
                
                {taskType === 'task' && <th className="p-4">URL</th>}
                
                {taskType === 'vip' && (
                   <>
                    <th className="p-4">Bằng chứng (URL)</th>
                    <th className="p-4 text-center">Lần 1 (24h)</th>
                    <th className="p-4 text-center">Lần 2 (10 ngày)</th>
                   </>
                )}

                {taskType === 'pre' && (
                   <>
                    <th className="p-4 text-center italic">Xem TK</th>
                    <th className="p-4 text-center">Thời gian hoàn thành</th>
                   </>
                )}

                <th className="p-4 text-center">Thưởng</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
               {loading && (
                 <tr><td colSpan={10} className="p-12 text-center text-gray-400 font-bold"><Loader2 className="animate-spin mx-auto mb-2" /> Đang tải...</td></tr>
               )}
               
               {!loading && activeTab === 'pending' && displayedPending.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                   <td className="p-4 font-mono text-[10px] text-gray-400">#{task.id.slice(-6)}</td>
                   <td className="p-4">
                      <div className="font-bold text-slate-800">{task.task_name}</div>
                      <div className="text-[10px] text-gray-400">ID: {task.task_id}</div>
                   </td>
                   <td className="p-4">
                      <LongPressWrapper text={task.user_uuid} onCopy={copyToClipboard}>
                        <div className="text-xs font-bold text-slate-600 truncate max-w-[100px] hover:text-indigo-600 transition-all italic underline decoration-slate-200 underline-offset-2">
                          {task.user_uuid.slice(0, 8)}...
                        </div>
                      </LongPressWrapper>
                      <div className="text-[10px] text-gray-400 uppercase tracking-tighter">{task.ip || 'no-ip'}</div>
                   </td>
                   
                   {taskType === 'task' && (
                     <td className="p-4">
                        <a href={task.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg font-bold text-[10px] uppercase hover:bg-blue-100 transition-colors">
                           LINK <ExternalLink size={12}/>
                        </a>
                     </td>
                   )}

                   {taskType === 'vip' && (
                     <>
                      <td className="p-4">
                         <div className="flex flex-col gap-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">BẰNG CHỨNG (PROOF):</div>
                            <a 
                              href={task.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-indigo-600 hover:text-indigo-800 font-bold text-[10px] break-all max-w-[150px] bg-slate-50 p-2 rounded-lg border border-slate-100 block"
                            >
                               {task.url}
                            </a>
                            <button 
                              onClick={() => copyToClipboard(task.url)}
                              className="flex items-center gap-1 text-[9px] font-black text-slate-400 hover:text-indigo-600 transition-colors mt-1 uppercase"
                            >
                              <Copy size={10}/> Sao chép URL
                            </button>
                         </div>
                      </td>
                      <td className="p-4 text-center">
                         <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${task.status_v1 === 'Đã duyệt L1' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                            {task.status_v1 || 'Chưa duyệt'}
                         </span>
                      </td>
                      <td className="p-4 text-center">
                         <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${task.status_v2 === 'Đã duyệt L2' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                            {task.status_v2 || 'Chưa duyệt'}
                         </span>
                      </td>
                     </>
                   )}

                   {taskType === 'pre' && (
                     <>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => showPreDetails(task)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg font-bold text-[10px] uppercase hover:bg-amber-100 transition-colors"
                        >
                          <Eye size={12}/> Xem TK
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <div className="text-xs font-bold text-slate-600">{new Date(task.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-[10px] text-gray-400">{new Date(task.timestamp).toLocaleDateString('vi-VN')}</div>
                      </td>
                     </>
                   )}

                   <td className="p-4 text-center">
                      <div className="font-black text-emerald-600">+{task.reward.toLocaleString()}</div>
                      <div className="text-[9px] text-gray-400 uppercase tracking-widest leading-none">VuiCoin</div>
                   </td>

                   <td className="p-4 text-center">
                      <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${statusBadgeColor(task.status)}`}>
                         {task.status}
                      </span>
                   </td>
                   
                   <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                         {taskType === 'vip' ? (
                            <>
                              {task.status_v1 !== 'Đã duyệt L1' ? (
                                <button 
                                  disabled={!!processingId}
                                  onClick={() => handleDecision(task.user_uuid, task.id, 'approve', 1)} 
                                  className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all group flex flex-col items-center disabled:opacity-50"
                                  title="Duyệt Lần 1"
                                >
                                  {processingId === task.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18}/>}
                                  <span className="text-[8px] font-black group-hover:block mt-0.5">L1</span>
                                </button>
                              ) : (
                                <button 
                                  disabled={!!processingId}
                                  onClick={() => handleDecision(task.user_uuid, task.id, 'approve', 2)} 
                                  className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all group flex flex-col items-center disabled:opacity-50"
                                  title="Duyệt Lần 2"
                                >
                                  {processingId === task.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18}/>}
                                  <span className="text-[8px] font-black group-hover:block mt-0.5">L2</span>
                                </button>
                              )}
                            </>
                         ) : (
                           <button 
                             disabled={!!processingId}
                             onClick={() => handleDecision(task.user_uuid, task.id, 'approve')} 
                             className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
                           >
                             {processingId === task.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18}/>}
                           </button>
                         )}
                         <button 
                           disabled={!!processingId}
                           onClick={() => handleDecision(task.user_uuid, task.id, 'reject')} 
                           className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50"
                         >
                           <XCircle size={18}/>
                         </button>
                      </div>
                   </td>
                </tr>
              ))}

              {!loading && activeTab === 'history' && displayedHistory.map((task, idx) => (
                 <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-mono text-[10px] text-gray-400">#{task.id.slice(-6)}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{task.task_name}</div>
                      <div className="text-[10px] text-gray-400">ID: {task.task_id}</div>
                    </td>
                    <td className="p-4">
                      <LongPressWrapper text={task.user_uuid} onCopy={copyToClipboard}>
                        <div className="text-xs font-bold text-slate-600 truncate max-w-[100px] hover:text-indigo-600 transition-colors underline decoration-slate-200 underline-offset-2">
                           {task.user_uuid.slice(0, 8)}...
                        </div>
                      </LongPressWrapper>
                    </td>
                    
                    {taskType === 'task' && (
                      <td className="p-4">
                         <a href={task.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline inline-flex items-center gap-1 text-[10px] uppercase font-bold">
                            LINK <ExternalLink size={10}/>
                         </a>
                      </td>
                    )}

                    {taskType === 'vip' && (
                       <>
                        <td className="p-4">
                           <div className="flex flex-col gap-1">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">BẰNG CHỨNG (PROOF):</div>
                              <a 
                                href={task.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-indigo-600 hover:text-indigo-800 font-bold text-[10px] break-all max-w-[150px] bg-slate-50 p-1 border-b border-transparent hover:border-indigo-100 block"
                              >
                                 {task.url}
                              </a>
                           </div>
                        </td>
                        <td className="p-4 text-center text-[10px] font-bold text-emerald-600 uppercase">XONG L1</td>
                        <td className="p-4 text-center text-[10px] font-bold text-emerald-600 uppercase">XONG L2</td>
                       </>
                    )}

                   {taskType === 'pre' && (
                     <>
                      <td className="p-4 text-center">
                        <button onClick={() => showPreDetails(task)} className="text-amber-600 hover:underline text-[10px] font-bold uppercase"><Eye size={12} className="inline mr-1"/> XEM</button>
                      </td>
                      <td className="p-4 text-center text-[10px] font-bold text-slate-400">{new Date(task.timestamp).toLocaleDateString('vi-VN')}</td>
                     </>
                   )}

                    <td className="p-4 text-center font-bold text-emerald-600">+{task.reward.toLocaleString()}</td>
                    <td className="p-4 text-center">
                       <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${statusBadgeColor(task.status)}`}>
                          {task.status}
                       </span>
                    </td>
                    <td className="p-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                       <div className="flex items-center justify-center gap-1">
                          <Clock size={12}/> {new Date(task.timestamp).toLocaleDateString('vi-VN')}
                       </div>
                    </td>
                 </tr>
              ))}

               {!loading && activeTab === 'pending' && displayedPending.length === 0 && (
                 <tr>
                    <td colSpan={10} className="p-20 text-center">
                       <div className="bg-slate-50 rounded-3xl p-10 max-w-sm mx-auto border border-dashed border-slate-200">
                          <CheckCircle className="text-emerald-500 mx-auto mb-4 opacity-20" size={64} />
                          <h4 className="font-extrabold text-slate-900 uppercase tracking-widest text-sm">Tuyệt vời!</h4>
                          <p className="text-xs font-bold text-slate-400 mt-2">Đã xử lý hết nhiệm vụ trong mục {taskType.toUpperCase()}</p>
                       </div>
                    </td>
                 </tr>
               )}

               {!loading && activeTab === 'history' && displayedHistory.length === 0 && (
                 <tr>
                    <td colSpan={10} className="p-20 text-center text-gray-400 font-bold uppercase italic tracking-widest opacity-50">Lịch sử trống.</td>
                 </tr>
               )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Details Modal */}
      <AnimatePresence>
        {selectedPreTask && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedPreTask(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl"
              >
                 <div className="bg-amber-500 p-6 text-white flex items-center justify-between">
                    <div>
                       <h3 className="font-black italic uppercase tracking-tighter text-xl leading-none">Thông tin tài khoản</h3>
                       <p className="text-[10px] font-bold text-amber-100 mt-2 uppercase tracking-widest">Nhiệm vụ: {selectedPreTask.task_name}</p>
                    </div>
                    <button onClick={() => setSelectedPreTask(null)} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
                       <X size={20} />
                    </button>
                 </div>

                 <div className="p-8 space-y-6">
                    <div className="space-y-4">
                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Email / Username</label>
                          <div className="flex items-center justify-between gap-3">
                             <div className="font-bold text-slate-800 break-all">{selectedPreTask.details.email}</div>
                             <button 
                                onClick={() => copyToClipboard(selectedPreTask.details.email)}
                                className="p-2 shrink-0 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                             >
                                <Copy size={16} />
                             </button>
                          </div>
                       </div>

                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mật khẩu</label>
                          <div className="flex items-center justify-between gap-3">
                             <div className="font-bold text-slate-800 break-all">{selectedPreTask.details.password}</div>
                             <button 
                                onClick={() => copyToClipboard(selectedPreTask.details.password)}
                                className="p-2 shrink-0 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                             >
                                <Copy size={16} />
                             </button>
                          </div>
                       </div>

                       {selectedPreTask.details.note && (
                         <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Ghi chú</label>
                            <div className="flex items-center justify-between gap-3">
                               <div className="font-bold text-slate-600 text-sm whitespace-pre-wrap">{selectedPreTask.details.note}</div>
                               <button 
                                  onClick={() => copyToClipboard(selectedPreTask.details.note)}
                                  className="p-2 shrink-0 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                               >
                                  <Copy size={16} />
                               </button>
                            </div>
                         </div>
                       )}
                    </div>

                    <button 
                      onClick={() => {
                        const text = `Email: ${selectedPreTask.details.email}\nPass: ${selectedPreTask.details.password}\nNote: ${selectedPreTask.details.note}`;
                        copyToClipboard(text);
                      }}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                       <Copy size={14} /> Sao chép tất cả
                    </button>
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function statusBadgeColor(status: string) {
    if (status === 'Hoàn thành') return 'text-emerald-700 bg-emerald-100';
    if (status === 'Từ chối') return 'text-rose-700 bg-rose-100';
    if (status === 'Chờ duyệt L2') return 'text-indigo-700 bg-indigo-100';
    return 'text-orange-700 bg-orange-100';
}
