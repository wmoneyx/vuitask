import React, { useState } from 'react';
import { GenericPage } from '../components/layout/GenericPage';
import { Map, Plane, ExternalLink, ShieldCheck, Loader2 } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export function TaskVipPage() {
  const { showNotification } = useNotification();
  const [doingTask, setDoingTask] = useState<'map' | 'trip' | null>(null);

  const startTask = async (type: 'map' | 'trip') => {
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

      const uuid = localStorage.getItem('omni_uuid') || crypto.randomUUID();
      localStorage.setItem('omni_uuid', uuid);

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
          } else {
             throw new Error(vipData.error || "Không lấy được đường dẫn từ nhà cung cấp.");
          }
      } catch (e: any) {
          showNotification({ title: 'Thất bại', message: e.message || "Lỗi tạo nhiệm vụ", type: 'error' });
      }
      setDoingTask(null);
  }

  return (
    <GenericPage title="Nhiệm Vụ VIP">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
             <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                 <Map size={40} />
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">Review Map</h3>
             <p className="text-sm font-bold text-emerald-600 mb-4 bg-emerald-50 px-4 py-2 rounded-full">+1,200 VuiCoin / lượt</p>
             <p className="text-sm text-gray-500 mb-6 font-bold">Duyệt thủ công 2 lượt. Thời gian 24H (V1), 10 Ngày (V2)</p>
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
             <p className="text-sm text-gray-500 mb-6 font-bold">Duyệt thủ công 2 lượt. Thời gian 24H (V1), 10 Ngày (V2)</p>
             <div className="w-full flex gap-2">
                 <a href="https://youtu.be/9VuCcRuSkZM?si=ASuEXoba4fJ31E9Q" target="_blank" rel="noopener noreferrer" className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-xl font-bold transition-all text-[11px] flex justify-center items-center gap-1 uppercase">XEM HƯỚNG DẪN <ExternalLink size={14}/></a>
                 <button disabled={doingTask === 'trip'} onClick={() => startTask('trip')} className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black shadow-lg shadow-indigo-500/30 transition-all uppercase flex justify-center items-center gap-2">
                     {doingTask === 'trip' ? <Loader2 size={18} className="animate-spin" /> : <><ShieldCheck size={18}/> NHẬN JOB</>}
                 </button>
             </div>
          </div>
       </div>
    </GenericPage>
  );
}
