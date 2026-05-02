import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, Loader2, ShieldCheck, FileText, ChevronRight, Edit3, Key, Send } from 'lucide-react';
import { AnimatedDiv } from "@/components/ui/AnimatedText";
import confetti from 'canvas-confetti';
import { useNotification } from '../context/NotificationContext';

export function VerifyTaskPrePage() {
  const [searchParams] = useSearchParams();
  const { showNotification } = useNotification();
  const [status, setStatus] = useState<'checking' | 'valid' | 'forbidden' | 'confirmed'>('checking');
  const [errorMSG, setErrorMSG] = useState('');
  
  const [emailInput, setEmailInput] = useState('');
  const [noteInput, setNoteInput] = useState('');

  const sessionId = searchParams.get('code');
  const uuid = searchParams.get('uuid');

  useEffect(() => {
    if (!sessionId || !uuid) {
      setStatus('forbidden');
      setErrorMSG('Truy cập bị từ chối. Vui lòng bắt đầu từ trang nhiệm vụ chính.');
      return;
    }

    // Fast Security Check (< 5s)
    const timeout = setTimeout(() => {
      fetch('/api/tasks/verify-session-pro', { // Reuse pro verify logic for VPN check
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, uuid })
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'valid') {
          setStatus('valid');
          showNotification({ title: 'Bảo mật', message: 'Hệ thống đã xác thực IP an toàn.', type: 'success' });
        } else {
          setStatus('forbidden');
          setErrorMSG(data.error || 'Phát hiện VPN/Proxy hoặc Phiên không hợp lệ.');
          showNotification({ title: 'Từ chối', message: 'VPN/Proxy detected', type: 'error' });
        }
      })
      .catch(() => {
        setStatus('forbidden');
        setErrorMSG('Lỗi kết nối máy chủ bảo mật.');
      });
    }, 2000);

    return () => clearTimeout(timeout);
  }, [sessionId, uuid, showNotification]);

  const handleSubmit = () => {
    if (!emailInput.trim()) return showNotification({ title: 'Cảnh báo', message: 'Vui lòng nhập Email!', type: 'warning' });
    if (!emailInput.includes('@gmail.com')) return showNotification({ title: 'Sai định dạng', message: 'Vui lòng nhập định dạng @gmail.com', type: 'error' });

    fetch('/api/admin/submit-pre-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, uuid, email: emailInput, note: noteInput })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setStatus('confirmed');
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ef4444', '#f59e0b', '#10b981']
        });
        showNotification({ title: 'Thành công', message: 'Thông tin Gmail đã được gửi.', type: 'success' });
        setTimeout(() => {
          window.location.href = '/app/task-pre';
        }, 2500);
      } else {
        showNotification({ title: 'Lỗi', message: data.error || 'Gửi thất bại', type: 'error' });
      }
    })
    .catch(() => showNotification({ title: 'Lỗi', message: 'Lỗi hệ thống', type: 'error' }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-600 font-extrabold text-xl tracking-tighter">
            <Mail size={28} />
            PRE-VERIFY
          </div>
          <nav className="hidden md:flex gap-8 text-xs font-black text-slate-500 uppercase tracking-widest">
            <a href="#" className="hover:text-red-600 transition-colors">Hướng dẫn</a>
            <a href="#" className="hover:text-red-600 transition-colors">Mẹo hay</a>
            <a href="#" className="hover:text-red-600 transition-colors">Hỗ trợ</a>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-[40px] p-6 md:p-12 border border-gray-100 shadow-xl shadow-slate-200/50">
            
            <AnimatedDiv className="mb-10">
              {status === 'checking' && (
                <div className="bg-slate-50 rounded-3xl p-12 text-center border border-dashed border-slate-200">
                  <Loader2 className="animate-spin text-slate-400 mx-auto mb-4" size={48} />
                  <h3 className="text-xl font-black text-slate-800">Đang quét bảo mật...</h3>
                  <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">Thời gian kiểm tra không quá 5 giây</p>
                </div>
              )}

              {status === 'forbidden' && (
                <div className="bg-rose-50 rounded-3xl p-12 text-center border border-rose-100">
                   <AlertCircle className="text-rose-500 mx-auto mb-4" size={48} />
                   <h3 className="text-xl font-black text-rose-800 uppercase tracking-tighter">Bị chặn: VPN/Robot</h3>
                   <p className="text-sm font-bold text-rose-600 mt-2">{errorMSG}</p>
                   <button onClick={() => window.location.href = '/app/task-pre'} className="mt-8 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 active:translate-y-1 transition-all">Quay lại Task</button>
                </div>
              )}

              {status === 'valid' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                   <div className="flex items-center gap-4 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0">
                         <ShieldCheck size={24} />
                      </div>
                      <div>
                         <h4 className="font-black text-emerald-900 uppercase text-sm tracking-tight">KẾT NỐI AN TOÀN</h4>
                         <p className="text-xs font-bold text-emerald-600">IP của bạn đã được xác thực là người dùng thật.</p>
                      </div>
                   </div>

                   <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 text-rose-400 font-black text-xs uppercase tracking-[0.2em] mb-4">
                           <AlertCircle size={14} /> QUY ĐỊNH QUAN TRỌNG
                        </div>
                        <p className="text-lg font-bold leading-relaxed italic opacity-90">
                           Tên tài khoản là tiếng Việt - Mật khẩu mặc định: <span className="text-emerald-400 underline decoration-2 underline-offset-4">Zhy99!!!</span>
                        </p>
                      </div>
                      <div className="absolute -right-8 -bottom-8 opacity-10 rotate-12">
                         <Mail size={120} />
                      </div>
                   </div>

                   <div className="grid gap-6">
                      <div className="space-y-2">
                         <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nhập Email bạn vừa tạo</label>
                         <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                              type="text" 
                              value={emailInput}
                              onChange={(e) => setEmailInput(e.target.value)}
                              placeholder="vidu@gmail.com"
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 py-4 font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                            />
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Mật khẩu mặc định (Cố định)</label>
                         <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                            <input 
                              type="text" 
                              disabled
                              value="Zhy99!!!"
                              className="w-full bg-slate-100 border border-slate-200 rounded-2xl pl-12 pr-6 py-4 font-black text-slate-400 outline-none cursor-not-allowed"
                            />
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Ghi chú cho Admin (Nếu có)</label>
                         <div className="relative">
                            <Edit3 className="absolute left-4 top-4 text-slate-400" size={20} />
                            <textarea 
                              rows={3}
                              value={noteInput}
                              onChange={(e) => setNoteInput(e.target.value)}
                              placeholder="Ví dụ: Mail này tạo lúc 8h sáng..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 py-4 font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
                            />
                         </div>
                      </div>

                      <button 
                        onClick={handleSubmit}
                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/30 transition-all flex items-center justify-center gap-3 active:scale-95"
                      >
                         XÁC NHẬN & GỬI BÀI <Send size={18} />
                      </button>
                   </div>
                </div>
              )}

              {status === 'confirmed' && (
                <div className="bg-emerald-50 rounded-3xl p-12 text-center border border-emerald-100 animate-in zoom-in-95 duration-500">
                   <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
                      <CheckCircle size={40} />
                   </div>
                   <h3 className="text-2xl font-black text-slate-800 uppercase italic">Gửi thành công!</h3>
                   <p className="text-sm font-bold text-emerald-600 mt-2">Dữ liệu đã được lưu. Đang chuyển hướng về web chính...</p>
                </div>
              )}
            </AnimatedDiv>

            <article className="prose prose-slate max-w-none border-t border-slate-100 pt-12">
               <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3 leading-none">
                 <span className="w-3 h-10 bg-red-600 rounded-full inline-block"></span>
                 Mẹo Tạo Gmail Không Cần Số Điện Thoại
               </h2>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm leading-relaxed font-bold text-slate-600">
                  <div className="space-y-4">
                     <p className="bg-slate-50 p-6 rounded-3xl border border-slate-200"><span className="text-indigo-600 font-extrabold uppercase block mb-1 text-xs">Cách 1</span> Sử dụng điện thoại Android/IPhone: Có thể dùng 4G hoặc WiFi. Sử dụng trình duyệt Chrome, Cốc Cốc hoặc ứng dụng G-mail, Drive, CH-Play đều hiệu quả.</p>
                     <p className="bg-slate-50 p-6 rounded-3xl border border-slate-200"><span className="text-indigo-600 font-extrabold uppercase block mb-1 text-xs">Cách 2</span> Tạo tài khoản liên tục: Nếu thiết bị chưa tạo lâu ngày, thường tạo được 4-5 tài khoản một lúc mà không bị hỏi SĐT.</p>
                  </div>
                  <div className="space-y-4">
                     <p className="bg-amber-50 p-6 rounded-3xl border border-amber-200"><span className="text-amber-600 font-extrabold uppercase block mb-1 text-xs text-amber-700">Lưu ý khi bị hỏi SĐT</span> Đừng cố tạo tiếp! Hãy dừng lại và đợi ít nhất 5 ngày. Trong thời gian này không đăng nhập hay tương tác gì với các dịch vụ Google trên máy đó.</p>
                     <div className="bg-slate-900 p-6 rounded-3xl text-slate-400 text-xs">
                        <h5 className="text-white font-black uppercase mb-2">QUẢNG CÁO</h5>
                        <div className="h-20 bg-slate-800 rounded-xl flex items-center justify-center font-black uppercase tracking-[0.3em]">GG ADS 300x100</div>
                     </div>
                  </div>
               </div>
            </article>

          </div>
        </div>

        <aside className="space-y-6">
           <div className="bg-white p-4 rounded-[32px] border border-gray-100 shadow-lg">
             <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] text-center mb-2">Google ADs</div>
             <div className="h-64 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 font-black uppercase tracking-[0.4em] border border-dashed border-slate-200">
                AD_300x250
             </div>
           </div>

           <div className="bg-indigo-900 rounded-[32px] p-8 text-white shadow-xl shadow-indigo-200">
              <h3 className="font-black italic uppercase tracking-tighter text-xl mb-4 leading-none">Hỗ trợ 24/7</h3>
              <p className="text-xs font-bold text-indigo-300 leading-relaxed mb-6">Mọi thắc mắc về nhiệm vụ, vui lòng nhắn tin cho bộ phận kỹ thuật để được hỗ trợ nhanh nhất.</p>
              <button className="w-full bg-white/10 hover:bg-white/20 py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all">
                Mở Chatbox <ChevronRight size={14} className="inline ml-1" />
              </button>
           </div>
        </aside>
      </main>

      <footer className="bg-white border-t border-gray-100 py-12 mt-12">
         <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">© 2026 PRE-VERIFY SECURE SYSTEM. Powered by Linktot</p>
         </div>
      </footer>
    </div>
  );
}
