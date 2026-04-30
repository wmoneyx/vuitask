import React, { useState, useEffect } from 'react';
import { Activity, ExternalLink, ArrowUpRight, Loader2 } from 'lucide-react';
import { AnimatedDiv, AnimatedText } from "@/components/ui/AnimatedText";
import { motion, AnimatePresence } from 'motion/react';
import { VuiCoin } from "@/components/ui/VuiCoin";
import { useNotification } from '../context/NotificationContext';
import { safeFetch } from "@/lib/utils";

const TASKS = [
  { id: 'layma', name: 'LAYMA', maxViews: 2, reward: 400, auto: true, apiUrl: 'https://api.layma.net/api/admin/shortlink/quicklink?tokenUser=de2c099a8fd17d1cc6c7068209e5fa5d&format=json&url=' },
  { id: 'link4m', name: 'LINK4M', maxViews: 2, reward: 300, auto: true, apiUrl: 'https://link4m.co/api-shorten/v2?api=68208afab6b8fc60542289b6&url=' },
  { id: 'bbmkts', name: 'BBMKTS', maxViews: 1, reward: 300, auto: true, apiUrl: 'https://bbmkts.com/dapi?token=d285ce6c761cc5961316783a&longurl=' },
  { id: 'utl3', name: 'UTL 3 STEP', maxViews: 999, reward: 463, auto: true, apiUrl: 'https://uptolink.one/api?api=94eeedcdf3928b7bb78a89c19bad78274a69b830&url=' },
  { id: 'utl2', name: 'UTL 2 STEP', maxViews: 999, reward: 449, auto: true, apiUrl: 'https://uptolink.one/api?api=94eeedcdf3928b7bb78a89c19bad78274a69b830&url=' },
  { id: 'utl1', name: 'UTL 1 STEP', maxViews: 999, reward: 385, auto: true, apiUrl: 'https://uptolink.one/api?api=94eeedcdf3928b7bb78a89c19bad78274a69b830&url=' },
  { id: 'linktot', name: 'LINKTOT', maxViews: 4, reward: 400, auto: true, apiUrl: 'https://linktot.net/JSON_QL_API.php?token=d121d1761f207cb9bfde19c8be5111cb8d623d83e1e05053ec914728c9ea869c&url=' },
  { id: 'traffic68', name: 'TRAFFIC 68', maxViews: 4, reward: 449, auto: true, apiUrl: 'https://traffic68.com/api/quicklink/api?api=tf68_c42992fb620964a590a36f35a0412f70bab3236f1e0aeb08&url=' },
  { id: 'timmap', name: 'TIMMAP', maxViews: 2, reward: 200, auto: true, apiUrl: 'https://linktot.net/api_timmap_pt.php?token=d121d1761f207cb9bfde19c8be5111cb8d623d83e1e05053ec914728c9ea869c&url=' },
  { id: 'linkngon', name: 'LINK NGON', maxViews: 2, reward: 250, auto: true, apiUrl: 'https://linkngon.top/api?api=iDqggiRIz7r9280v8NsD8jZS&url=' },
  { id: 'linktop', name: 'LINKTOP', maxViews: 2, reward: 150, auto: true, apiUrl: 'https://linktop.one/api?api=tXbluP65U5e2IuzTqVOFjAcLfJvGrzgcoaAFEnFqTbG5AG&url=' },
  { id: 'traffictop', name: 'TRAFFICTOP', maxViews: 999, reward: 200, auto: true, apiUrl: 'https://traffictop.net/api?api=OrKX4KckO50XBo29N0cCVBUW&url=' },
];

import { useUser } from '@/UserContext';

export function TaskPage() {
  const { profile, refreshProfile } = useUser();
  const { showNotification } = useNotification();
  const [loadingTask, setLoadingTask] = useState<string | null>(null);
  const [currentTaskUrl, setCurrentTaskUrl] = useState<string | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const uuid = profile?.user_uuid;

  useEffect(() => {
    if (profile) fetchHistory();
  }, [profile]);

  const fetchHistory = async () => {
    if (!uuid) return;
    const data = await safeFetch(`/api/tasks/history?uuid=${uuid}`);
    if (data && data.history) setHistory(data.history);

    // Refresh profile to update balance if tasks were completed in background
    await refreshProfile();
  }

  const handleOpenLink = () => {
    if (currentTaskUrl) {
      window.open(currentTaskUrl, "_blank");
      setShowTaskModal(false);
      showNotification({ title: 'Đang mở link', message: 'Vui lòng hoàn thành để nhận thưởng.', type: 'info' });
    }
  };

  const handleCreateNew = () => {
    setShowTaskModal(false);
    setCurrentTaskUrl(null);
  };

  const handleDoTask = async (task: any) => {
    if (!uuid) return;
    
    // Check daily turn limit
    if ((profile?.today_turns || 0) >= 10) {
      showNotification({ 
        title: 'Giới hạn hằng ngày', 
        message: 'Bạn đã đạt giới hạn 10 lượt làm nhiệm vụ mỗi ngày. Hãy quay lại vào ngày mai!', 
        type: 'warning' 
      });
      return;
    }

    setLoadingTask(task.id);
    
    try {
      // 1. TẠO SESSION ID TỪ BACKEND
      const sessionData = await safeFetch('/api/tasks/generate-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              userId: uuid,
              taskId: task.id,
              taskName: task.name,
              reward: task.reward,
              auto: task.auto
          })
      });
      
      const sessionId = sessionData?.sessionId;
      if (!sessionId) throw new Error("Không thể tạo phiên nhiệm vụ. Thử lại sau!");

      // 2. GẮN VÀO LINK DESTINATION ĐỂ CUNG CẤP CHO NHÀ CUNG CẤP URL SHORTENER
      const destinationUrl = `${window.location.origin}/verifytask?code=${sessionId}&uuid=${uuid}`;
      
      let apiRequestUrl = task.apiUrl + encodeURIComponent(destinationUrl);
      
      showNotification({ title: 'Khởi tạo', message: `Đang lấy link từ hệ thống ${task.name}...`, type: 'info' });

      let response;
      let fetchedContent = null;
      const proxyList = [
        (url: string) => url, // Direct first
        (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
        (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`
      ];

      for (let i = 0; i < proxyList.length; i++) {
        try {
          const currentUrl = proxyList[i](apiRequestUrl);
          response = await fetch(currentUrl, { method: 'GET' });
          
          if (response.ok) {
            const contentType = response.headers.get("content-type");
            const text = await response.text();
            if (contentType && contentType.includes("text/html") && (text.includes("Just a moment...") || text.includes("<title>Just a moment...</title>") || text.includes("cloudflare"))) {
              continue; // Bỏ qua Cloudflare challenge
            }
            fetchedContent = text;
            break;
          }
        } catch (e) {
          console.warn(`Attempt ${i + 1} threw error:`, e);
        }
        if (i < proxyList.length - 1) await new Promise(r => setTimeout(r, 800));
      }

      if (!response || !response.ok) {
        throw new Error("Failed to generate link after all attempts.");
      }

      const responseText = (fetchedContent || await response.text()).trim();
      if (!responseText) throw new Error("API returned empty response.");

      let result;
      
      // Parse result
      if (responseText.startsWith('http') && !responseText.includes('<') && !responseText.includes('{')) {
        result = { status: "success", shortenedUrl: responseText };
      } else {
        try {
          result = JSON.parse(responseText);
        } catch (e) {
          const urlMatch = responseText.match(/https?:\/\/[^\s"']+/);
          const scriptMatch = responseText.match(/window\.location\.href\s*=\s*["']([^"']+)["']/);
          
          if (scriptMatch && scriptMatch[1]) {
            let extractedUrl = scriptMatch[1];
            if (extractedUrl.startsWith('/')) extractedUrl = "https://linktot.net" + extractedUrl;
            result = { status: "success", shortenedUrl: extractedUrl };
          } else if (urlMatch && urlMatch[0]) {
            result = { status: "success", shortenedUrl: urlMatch[0] };
          } else {
            throw new Error("API trả về định dạng dữ liệu không hợp lệ.");
          }
        }
      }
      
      let link = 
        result.shortenedUrl || 
        result.url || 
        result.bbmktsUrl || 
        result.short_url ||
        result.data?.short_url ||
        result.data?.url ||
        result.result; 

      if (!link && result.html) {
        const urlMatch = result.html.match(/https?:\/\/[^\s"']+/);
        if (urlMatch) link = urlMatch[0];
      }

      const isSuccess = result.status === "success" || result.success === true || !!link;

      if (isSuccess && link) {
        // Cập nhật session URL trên server
        safeFetch('/api/tasks/update-session-url', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ sessionId, shortUrl: link })
        });

        setCurrentTaskUrl(link);
        setShowTaskModal(true);
        showNotification({ title: 'Sẵn sàng', message: 'Link đã sẵn sàng, hãy làm nhiệm vụ ngay!', type: 'success' });
      } else {
        throw new Error(result.message || result.error || "API Error");
      }
    } catch (error: any) {
      console.error("Lỗi tạo link:", error);
      showNotification({ title: 'Lỗi phát sinh', message: error.message || "Không thể kết nối API. Thử lại sau!", type: 'error' });
    } finally {
      setLoadingTask(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 text-slate-800">
        <Activity className="text-emerald-500" size={28} />
        <h1 className="text-2xl font-bold uppercase tracking-tight">
          <AnimatedText>Nhiệm vụ khả dụng</AnimatedText>
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TASKS.map((task, index) => (
          <AnimatedDiv key={task.id} delay={0.1 + index * 0.05} className="bg-white rounded-[2rem] p-6 sm:p-8 border border-gray-100 shadow-sm relative hover:shadow-md transition-shadow">
            {/* Active Status Dot */}
            <div className="absolute top-6 right-6 w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-slate-900/20">
                <ExternalLink size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{task.name}</h3>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">SHORTLINK</div>
              </div>
            </div>

            <div className="bg-emerald-50/80 rounded-2xl p-4 flex items-center justify-between mb-4 border border-emerald-100/50">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Phần thưởng</span>
              <span className="font-black text-emerald-600 flex items-center gap-1.5 text-lg">
                +{task.reward} <VuiCoin size={18} className="text-orange-500 fill-orange-50" />
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Giới hạn lượt làm</div>
                <div className="font-bold text-slate-800 text-lg">{(profile?.today_turns || 0)} / 10</div>
              </div>
              <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100/50">
                <div className="text-[10px] font-bold text-orange-500/70 uppercase tracking-wider mb-1">Duyệt thưởng</div>
                <div className="font-bold text-orange-600 text-lg uppercase">
                  {['linkngon', 'linktop', 'traffictop', 'bbmkts'].includes(task.id.toLowerCase()) ? 'Thủ công' : 'Tự động'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-6 text-rose-500 bg-rose-50/50 p-2.5 rounded-xl border border-rose-100/50">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mx-1"></div>
              <span className="text-[10px] font-bold uppercase tracking-wider leading-tight">Lưu ý: Nghiêm cấm sử dụng VPN / Proxy</span>
            </div>

            <button 
              onClick={() => handleDoTask(task)}
              disabled={loadingTask === task.id}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-slate-900/20"
            >
              {loadingTask === task.id ? (
                <><Loader2 size={18} className="animate-spin" /> ĐANG TẠO LINK...</>
              ) : (
                <>LÀM NHIỆM VỤ <ArrowUpRight size={18} /></>
              )}
            </button>
          </AnimatedDiv>
        ))}
      </div>

      <AnimatedDiv delay={0.3} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Lịch sử làm nhiệm vụ</h3>
          <button onClick={fetchHistory} className="text-xs font-bold text-blue-600 uppercase hover:underline">Tải lại</button>
        </div>
        <div className="overflow-x-auto custom-scrollbar max-h-96">
          <table className="w-full text-left border-collapse min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="p-4 text-center">Thời gian</th>
                <th className="p-4 text-center">Loại Task</th>
                <th className="p-4 text-center">Thưởng</th>
                <th className="p-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {history.length === 0 ? (
                 <tr>
                   <td colSpan={4} className="p-4 text-center text-gray-400 text-sm italic">Chưa có dữ liệu lịch sử làm nhiệm vụ.</td>
                 </tr>
               ) : (
                 history.filter((h: any) => !h.task_id || (!h.task_id.startsWith('vip_') && h.task_id !== 'GMAIL_PRE')).map((record, idx) => (
                   <tr key={idx} className="hover:bg-gray-50">
                     <td className="p-4 text-center text-xs font-mono text-gray-400">{new Date(record.timestamp).toLocaleString('vi-VN')}</td>
                     <td className="p-4 text-center font-bold text-slate-700">{record.taskName}</td>
                     <td className="p-4 text-center font-bold text-emerald-500">+{record.reward.toLocaleString()}</td>
                     <td className="p-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase bg-opacity-20
                           ${record.status === 'Hoàn thành' ? 'bg-emerald-500 text-emerald-700' : 
                             record.status === 'Từ chối' ? 'bg-rose-500 text-rose-700' : 'bg-orange-500 text-orange-700'}`}>
                           {record.status}
                        </span>
                     </td>
                   </tr>
                 ))
               )}
            </tbody>
          </table>
        </div>
      </AnimatedDiv>

      {/* Modal dialog for task success */}
      <AnimatePresence>
        {showTaskModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={handleCreateNew}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full relative z-10 text-center shadow-2xl"
            >
               <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase">Thành công!</h3>
               <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.1em] mb-4 leading-relaxed px-4">
                 Link nhiệm vụ của bạn đã được khởi tạo và sẵn sàng thực hiện.
               </p>
               
               {currentTaskUrl && (
                 <div className="mb-8 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                   <p className="text-[9px] font-mono text-slate-500 break-all line-clamp-2">{currentTaskUrl}</p>
                 </div>
               )}
               
               <div className="space-y-4">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleOpenLink}
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200"
                  >
                    MỞ LINK TRÌNH DUYỆT <ExternalLink size={16} />
                  </motion.button>
                  
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateNew}
                    className="w-full py-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-[0.15em] hover:bg-slate-100 transition-all border border-slate-100"
                  >
                    BỎ QUA / TẠO LẠI
                  </motion.button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

