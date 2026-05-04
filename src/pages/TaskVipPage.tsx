import React, { useState, useEffect } from 'react';
import { GenericPage } from '../components/layout/GenericPage';
import { Map, Plane, ExternalLink, ShieldCheck, Loader2, RefreshCw } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { safeFetch } from '@/lib/utils';
import { AnimatedDiv } from '@/components/ui/AnimatedText';

import { useUser } from '@/UserContext';

export function TaskVipPage() {
  const { profile, refreshProfile } = useUser();
  const { showNotification } = useNotification();
  const [doingTask, setDoingTask] = useState<'map' | 'trip' | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const uuid = profile?.user_uuid;

  const fetchHistory = async () => {
    if (!uuid) return;
    const data = await safeFetch(`/api/tasks/history?uuid=${uuid}`);
    if (data && data.history) {
        // Filter for VIP tasks
        const vipHistory = data.history.filter((h: any) => (h.task_id && h.task_id.startsWith('vip_')) || (h.task_name || '').toUpperCase().includes('REVIEW'));
        setHistory(vipHistory);
    }
  };

  useEffect(() => {
    if (profile) fetchHistory();
  }, [profile]);

  const startTask = async (type: 'map' | 'trip') => {
      if (!uuid) return;
      const lockKey = `vip_task_${type}_lock`;
      const lastDoneStr = localStorage.getItem(lockKey);
      if (lastDoneStr) {
          const times = JSON.parse(lastDoneStr) as number[];
          const now = Date.now();
          const validTimes = times.filter(t => now - t < 30 * 60 * 1000);
          if (validTimes.length >= 10) {
             showNotification({ title: 'Hệ thống giới hạn', message: `Bạn đã làm nhiệm vụ này quá 10 lần trong 30 phút. Vui lòng quay lại sau!`, type: 'warning' });
             return;
          }
      }

      setDoingTask(type);
      try {
          const sessionRes = await fetch('/api/tasks/generate-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  userId: uuid,
                  taskId: `vip_${type}`,
                  taskName: type === 'map' ? 'REVIEW MAP' : 'REVIEW TRIP',
                  reward: type === 'map' ? 1200 : 2900,
                  auto: false
              })
          });
          const sessionData = await sessionRes.json();
          const sessionId = sessionData.sessionId;

          const destinationUrl = `${window.location.origin}/verifytaskpro?code=${sessionId}&uuid=${uuid}`;
          
          const vipRes = await fetch('/api/tasks/start-vip', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type, uuid, destinationUrl })
          });
          
          const vipData = await vipRes.json();

          if (vipData.success && vipData.url) {
             const finalLink = vipData.url;

             // Update session Url
             fetch('/api/tasks/update-session-url', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sessionId, shortUrl: finalLink })
             });

             // Update lock
             const times = lastDoneStr ? JSON.parse(lastDoneStr) as number[] : [];
             const now = Date.now();
             const validTimes = times.filter(t => now - t < 30 * 60 * 1000);
             validTimes.push(now);
             localStorage.setItem(lockKey, JSON.stringify(validTimes));

             window.open(finalLink, '_blank');
             showNotification({ title: 'Khởi tạo thành công', message: "Đang mở nhiệm vụ trong tab mới...", type: 'success' });
             
             await refreshProfile();
          } else {
             throw new Error(vipData.error || "Không lấy được đường dẫn từ nhà cung cấp.");
          }
      } catch (e: any) {
          showNotification({ title: 'Thất bại', message: e.message || "Lỗi tạo nhiệm vụ", type: 'error' });
      }
      setDoingTask(null);
  }

  return (
    <GenericPage title="Nhiệm Vụ VIP" showHistory={false}>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
             <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                 <Map size={40} />
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">Review Map</h3>
             <p className="text-sm font-bold text-emerald-600 mb-4 bg-emerald-50 px-4 py-2 rounded-full">+1,200 VuiCoin / lượt</p>
             <p className="text-sm text-gray-500 mb-6 font-bold">Duyệt thủ công. Giới hạn 10 lượt / 30 phút. Thời gian 24H (V1), 10 Ngày (V2)</p>
             <div className="w-full flex gap-2">
                 <a href="https://youtube.com/shorts/MMwsAjJ9aYU?si=JSBTiReY3-HF8Bne" target="_blank" rel="noopener noreferrer" className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-xl font-bold transition-all text-[11px] flex justify-center items-center gap-1 uppercase">XEM HƯỚNG DẪN <ExternalLink size={14}/></a>
                 <button disabled={doingTask === 'map'} onClick={() => startTask('map')} className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black shadow-lg shadow-emerald-500/30 transition-all uppercase flex justify-center items-center gap-2">
                     {doingTask === 'map' ? <Loader2 size={18} className="animate-spin" /> : <><ShieldCheck size={18}/> NHẬN JOB</>}
                 </button>
             </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
             <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                 <Plane size={40} />
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">Review Trip</h3>
             <p className="text-sm font-bold text-indigo-600 mb-4 bg-indigo-50 px-4 py-2 rounded-full">+2,900 VuiCoin / lượt</p>
             <p className="text-sm text-gray-500 mb-6 font-bold">Duyệt thủ công. Giới hạn 10 lượt / 30 phút. Thời gian 24H (V1), 10 Ngày (V2)</p>
             <div className="w-full flex gap-2">
                 <a href="https://youtu.be/9VuCcRuSkZM?si=ASuEXoba4fJ31E9Q" target="_blank" rel="noopener noreferrer" className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-xl font-bold transition-all text-[11px] flex justify-center items-center gap-1 uppercase">XEM HƯỚNG DẪN <ExternalLink size={14}/></a>
                 <button disabled={doingTask === 'trip'} onClick={() => startTask('trip')} className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black shadow-lg shadow-indigo-500/30 transition-all uppercase flex justify-center items-center gap-2">
                     {doingTask === 'trip' ? <Loader2 size={18} className="animate-spin" /> : <><ShieldCheck size={18}/> NHẬN JOB</>}
                 </button>
             </div>
          </div>
       </div>

       <AnimatedDiv delay={0.3} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 uppercase tracking-tight text-sm">Lịch sử làm nhiệm vụ VIP</h3>
          <button onClick={fetchHistory} className="text-blue-600 hover:text-blue-700 transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>
        <div className="overflow-x-auto custom-scrollbar max-h-96">
          <table className="w-full text-left border-collapse min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr className="border-b border-gray-100 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                <th className="p-4">Thời gian</th>
                <th className="p-4">Dịch vụ</th>
                <th className="p-4 text-center">Thưởng</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-center">Duyệt V1</th>
                <th className="p-4 text-center">Duyệt V2</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {history.length === 0 ? (
                 <tr>
                   <td colSpan={6} className="p-10 text-center text-gray-400 text-xs font-bold uppercase tracking-widest opacity-40 italic">Chưa có dữ liệu nhiệm vụ VIP.</td>
                 </tr>
               ) : (
                 history.map((record, idx) => (
                   <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                     <td className="p-4 text-[11px] font-bold text-gray-400">
                        {new Date(record.timestamp).toLocaleString('vi-VN')}
                     </td>
                     <td className="p-4 font-black text-slate-700 text-xs">
                        {record.task_name}
                     </td>
                     <td className="p-4 text-center font-black text-emerald-500">
                        +{record.reward.toLocaleString()}
                     </td>
                     <td className="p-4 text-center">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter
                           ${record.status === 'Hoàn thành' ? 'bg-emerald-100 text-emerald-700' : 
                             record.status === 'Từ chối' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'}`}>
                           {record.status}
                        </span>
                     </td>
                     <td className="p-4 text-center">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${record.status_v1 === 'Đã duyệt' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                           {record.status_v1 || 'N/A'}
                        </span>
                     </td>
                     <td className="p-4 text-center">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${record.status_v2 === 'Đã duyệt' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-400'}`}>
                           {record.status_v2 || 'N/A'}
                        </span>
                     </td>
                   </tr>
                 ))
               )}
            </tbody>
          </table>
        </div>
      </AnimatedDiv>
    </GenericPage>
  );
}
