import React, { useState, useEffect } from 'react';
import { GenericPage } from '../components/layout/GenericPage';
import { Mail, Info, ChevronRight, CheckCircle2, ShieldAlert, Timer, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotification } from '../context/NotificationContext';
import { safeFetch } from '@/lib/utils';
import { AnimatedDiv } from '@/components/ui/AnimatedText';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const fpPromise = FingerprintJS.load();

import { useUser } from '@/UserContext';

export function TaskPrePage() {
  const { profile, refreshProfile } = useUser();
  const { showNotification } = useNotification();
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [canSubmit, setCanSubmit] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [fingerprint, setFingerprint] = useState<string>('');
  const uuid = profile?.user_uuid;

  const fetchHistory = async () => {
    if (!uuid) return;
    const data = await safeFetch(`/api/tasks/history?uuid=${uuid}`);
    if (data && data.history) {
        // Filter for Pre tasks
        const preHistory = data.history.filter((h: any) => h.task_id === 'GMAIL_PRE');
        setHistory(preHistory);
    }
  };

  useEffect(() => {
    if (profile) fetchHistory();
    
    // Get Fingerprint
    fpPromise
      .then(fp => fp.get())
      .then(result => {
        setFingerprint(result.visitorId);
      });
  }, [profile]);

  useEffect(() => {
    let timer: any;
    if (showModal && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showModal, countdown]);

  const handleStartTask = () => {
    setShowModal(true);
    setCountdown(5);
    setCanSubmit(false);
  };

  const handleGoToVerify = async () => {
    if (!uuid) return;

    try {
      const res = await fetch('/api/tasks/generate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uuid,
          taskId: 'GMAIL_PRE',
          taskName: 'Nhiệm vụ Tạo Gmail',
          reward: 3000,
          auto: false,
          fingerprint: fingerprint
        })
      });
      const data = await res.json();
      if (data.sessionId) {
        await refreshProfile();
        window.location.href = `/verifytaskpre?code=${data.sessionId}&uuid=${uuid}`;
      }
    } catch (e) {
      showNotification({ title: 'Lỗi hệ thống', message: 'Lỗi hệ thống khởi tạo phiên.', type: 'error' });
    }
  };

  return (
    <GenericPage title="Nhiệm Vụ Pre" showHistory={false}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6">
            <div className="bg-rose-50 text-rose-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Hot Task</div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center shrink-0">
              <Mail size={48} strokeWidth={2.5} />
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-2">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Tạo Tài Khoản Gmail Mới</h3>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm">
                <span className="flex items-center gap-1.5 font-bold text-slate-500">
                  <CheckCircle2 size={16} className="text-emerald-500" /> Duyệt thủ công
                </span>
                <span className="flex items-center gap-1.5 font-bold text-slate-500">
                  <Timer size={16} className="text-blue-500" /> 2h - 5 ngày
                </span>
                <span className="bg-emerald-50 text-emerald-600 font-black px-3 py-1 rounded-lg">
                  +3,000 VuiCoin / lượt
                </span>
              </div>
            </div>

            <button 
              onClick={handleStartTask}
              className="w-full md:w-auto px-8 py-4 bg-slate-900 border-b-4 border-slate-700 hover:bg-slate-800 active:border-b-0 active:translate-y-1 text-white rounded-2xl font-black uppercase tracking-widest transition-all"
            >
              Nhận Nhiệm Vụ
            </button>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
             <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                <Info size={20} />
             </div>
             <h4 className="font-bold text-indigo-900 mb-1">Không giới hạn</h4>
             <p className="text-sm text-indigo-600/70 font-medium">Bạn có thể tạo bao nhiêu tài khoản tùy thích.</p>
          </div>
          <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
             <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle2 size={20} />
             </div>
             <h4 className="font-bold text-emerald-900 mb-1">Thanh toán uy tín</h4>
             <p className="text-sm text-emerald-600/70 font-medium">Tiền cộng trực tiếp sau khi admin đã duyệt.</p>
          </div>
          <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
             <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mb-4">
                <ShieldAlert size={20} />
             </div>
             <h4 className="font-bold text-rose-900 mb-1">Quy định nghiêm ngặt</h4>
             <p className="text-sm text-rose-600/70 font-medium">Vui lòng đọc kỹ quy định để không bị trừ tiền.</p>
          </div>
        </div>
      </div>

      {/* Rules Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl relative z-10 p-1"
            >
              <div className="h-full overflow-y-auto p-6 md:p-10 custom-scrollbar">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-slate-800 uppercase italic">Quy định nhiệm vụ</h2>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">Đóng</button>
                </div>

                <div className="space-y-6">
                  <div className="bg-rose-50 border-l-4 border-rose-500 p-6 rounded-r-2xl">
                    <p className="font-black text-rose-600 leading-relaxed uppercase tracking-tight">
                      Nổi bật: Tên tài khoản là Tiếng Việt - Mật khẩu mặc định: <span className="bg-rose-600 text-white px-3 py-1 rounded inline-block ml-1">Zhy99!!!</span>
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2">
                       <ChevronRight size={18} className="text-rose-500" /> Yêu cầu chi tiết
                    </h4>
                    <ul className="space-y-3">
                      {[
                        "Tên tài khoản là tiếng Việt - Mật khẩu mặc định: Zhy99!!!",
                        "Không dính số điện thoại, không dính gmail khôi phục, không có ảnh đại diện.",
                        "Tài khoản gmail mới tạo (chưa qua dịch vụ), tạo bằng tay.",
                        "Không sử dụng box phone hoặc tool.",
                        "Không kí tự .,! trước @gmail.",
                        "Tạo xong xóa mail khỏi máy.",
                        "Không tạo email theo thứ tự.",
                        "Nhập gmail và mật khẩu sau khi hoàn thành.",
                        "Thời gian duyệt: 2 - 5 ngày. Nếu gmail không đạt sẽ bị trừ tiền vào số dư."
                      ].map((text, i) => (
                        <li key={i} className="flex gap-3 text-sm font-bold text-slate-600 leading-relaxed">
                           <span className="w-5 h-5 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center shrink-0 text-[10px]">{i+1}</span>
                           {text}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-8">
                    <button 
                      disabled={!canSubmit}
                      onClick={handleGoToVerify}
                      className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${canSubmit ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/30' : 'bg-slate-100 text-slate-400'}`}
                    >
                      {canSubmit ? (
                        <>Gửi Email Ngay <ChevronRight size={20}/></>
                      ) : (
                        <>Đang tải điều khoản ({countdown}s)...</>
                      )}
                    </button>
                    <p className="text-center text-[10px] text-slate-400 font-bold uppercase mt-4">Vui lòng đợi 5 giây để đọc kỹ các quy định trên</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatedDiv delay={0.4} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 uppercase tracking-tight text-sm italic">Lịch sử làm nhiệm vụ Pre</h3>
          <button onClick={fetchHistory} className="text-red-500 hover:text-red-600 transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>
        <div className="overflow-x-auto custom-scrollbar max-h-96">
          <table className="w-full text-left border-collapse min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr className="border-b border-gray-100 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                <th className="p-4">Thời gian</th>
                <th className="p-4">Tên</th>
                <th className="p-4">Email / Mật khẩu</th>
                <th className="p-4 text-center">Thưởng</th>
                <th className="p-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {history.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="p-10 text-center text-gray-400 text-xs font-bold uppercase tracking-widest opacity-40 italic">Chưa có dữ liệu nhiệm vụ Pre.</td>
                 </tr>
               ) : (
                 history.map((record, idx) => (
                   <tr key={idx} className="hover:bg-red-50/10 transition-colors">
                     <td className="p-4 text-[11px] font-bold text-gray-400 font-mono">
                        {new Date(record.timestamp).toLocaleString('vi-VN')}
                     </td>
                     <td className="p-4 font-black text-slate-800 text-xs">
                        {record.task_name}
                     </td>
                     <td className="p-4 space-y-1">
                        <div className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block">{record.url}</div>
                        <div className="text-[10px] font-bold text-slate-400 block px-2">PW: Zhy99!!!</div>
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
