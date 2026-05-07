import React, { useState, useEffect } from 'react';
import { History, Search, RefreshCw } from 'lucide-react';
import { safeFetch } from '@/lib/utils';
import { AnimatedDiv } from '@/components/ui/AnimatedText';

export function AdminDataHistory() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'withdrawals' | 'approvals'>('tasks');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
     setLoading(true);
     let url = '';
     if (activeTab === 'tasks') url = '/api/admin/history/tasks';
     else if (activeTab === 'withdrawals') url = '/api/admin/history/withdrawals';
     else if (activeTab === 'approvals') url = '/api/admin/history/approvals';

     const data = await safeFetch(url);
     if (data && data.logs) setLogs(data.logs);
     setLoading(false);
  };

  useEffect(() => {
     setSearch('');
     fetchLogs();
  }, [activeTab]);

  const filteredLogs = logs.filter(l => {
     const str = JSON.stringify(l).toLowerCase();
     return str.includes(search.toLowerCase());
  });

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
         <div>
            <h2 className="text-xl font-bold text-slate-800">Tra cứu Lịch sử</h2>
            <p className="text-sm text-gray-500">Lịch sử làm nhiệm vụ, Rút tiền và Lịch sử duyệt của Admin</p>
         </div>
         <div className="flex bg-slate-100 p-1 rounded-xl">
             <button onClick={() => setActiveTab('tasks')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'tasks' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Nhiệm vụ</button>
             <button onClick={() => setActiveTab('withdrawals')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'withdrawals' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Rút tiền</button>
             <button onClick={() => setActiveTab('approvals')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'approvals' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Lịch sử Duyệt</button>
         </div>
      </div>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-sm"
            placeholder="Tìm kiếm UID, tên, trạng thái..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button onClick={fetchLogs} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="overflow-x-auto min-h-[400px]">
        {loading ? (
             <div className="flex justify-center p-12 text-slate-400"><RefreshCw className="animate-spin" size={32} /></div>
        ) : (
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                   {activeTab === 'tasks' ? (
                       <>
                         <th className="p-4 rounded-tl-xl">Thời gian</th>
                         <th className="p-4">UID</th>
                         <th className="p-4">Nhiệm vụ</th>
                         <th className="p-4">Địa chỉ IP</th>
                         <th className="p-4">Thưởng</th>
                         <th className="p-4 rounded-tr-xl">Trạng thái</th>
                       </>
                   ) : activeTab === 'withdrawals' ? (
                       <>
                         <th className="p-4 rounded-tl-xl">Thời gian</th>
                         <th className="p-4">UID</th>
                         <th className="p-4">Nội dung / Yêu cầu</th>
                         <th className="p-4 rounded-tr-xl">Trạng thái</th>
                       </>
                   ) : (
                       <>
                         <th className="p-4 rounded-tl-xl">Thời gian</th>
                         <th className="p-4">UID</th>
                         <th className="p-4">Nội dung</th>
                         <th className="p-4">Loại</th>
                         <th className="p-4 rounded-tr-xl">Ghi chú (Admin)</th>
                       </>
                   )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log, idx) => (
                   <tr key={idx} className="hover:bg-slate-50 transition-colors">
                     <td className="p-4 text-xs font-mono text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                     </td>
                     <td className="p-4 text-xs font-mono text-slate-400 max-w-[100px] truncate" title={log.user_uuid}>
                        {log.user_uuid}
                     </td>
                     {activeTab === 'tasks' ? (
                        <>
                           <td className="p-4 font-bold text-slate-700">{log.task_name || log.task_id}</td>
                           <td className="p-4">
                              <div className="text-[10px] flex flex-col gap-0.5">
                                 <span className="text-gray-400 font-mono">BĐ: {log.start_ip || 'N/A'}</span>
                                 <span className="text-gray-400 font-mono">XN: {log.ip || 'N/A'}</span>
                              </div>
                           </td>
                           <td className="p-4 font-black text-emerald-600">+{log.reward}</td>
                           <td className="p-4 text-xs font-bold uppercase">
                               <span className={log.status === 'Hoàn thành' ? 'text-emerald-500' : 'text-slate-500'}>{log.status}</span>
                           </td>
                        </>
                     ) : activeTab === 'withdrawals' ? (
                        <>
                           <td className="p-4 text-xs max-w-sm whitespace-pre-wrap">{log.content}</td>
                           <td className="p-4 text-xs font-bold uppercase">
                               {log.status === 'Hoàn thành' ? <span className="text-emerald-500">Hoàn thành</span> : 
                                log.status === 'Từ chối' ? <span className="text-rose-500">Từ chối</span> : 
                                <span className="text-slate-500">{log.status}</span>}
                           </td>
                        </>
                     ) : (
                        <>
                           <td className="p-4 text-xs max-w-sm whitespace-pre-wrap line-clamp-3" title={log.content}>{log.content}</td>
                           <td className="p-4 text-xs font-bold text-indigo-500 uppercase">{log.type}</td>
                           <td className="p-4 text-xs font-bold text-slate-700">{log.admin_note || log.status}</td>
                        </>
                     )}
                   </tr>
                ))}
                {filteredLogs.length === 0 && (
                   <tr>
                     <td colSpan={5} className="p-8 text-center text-slate-400 text-xs uppercase tracking-widest font-bold">Không tìm thấy dữ liệu</td>
                   </tr>
                )}
              </tbody>
            </table>
        )}
      </div>
    </div>
  );
}
