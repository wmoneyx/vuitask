import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, ShieldCheck, FileText, ChevronRight, Edit3, Map, Plane } from 'lucide-react';
import { AnimatedDiv } from "@/components/ui/AnimatedText";
import confetti from 'canvas-confetti';
import { useNotification } from '../context/NotificationContext';

export function VerifyTaskProPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [status, setStatus] = useState<'checking' | 'valid' | 'error' | 'confirmed'>('checking');
  const [errorMSG, setErrorMSG] = useState('');
  
  const [mode, setMode] = useState<'map'|'trip'|null>(null);
  const [inputUrl, setInputUrl] = useState('');

  const rawCode = searchParams.get('code') || '';
  const rawUuid = searchParams.get('uuid') || '';
  const sessionId = rawCode.split('/')[0].split('?')[0];
  const uuid = rawUuid.split('/')[0].split('?')[0];

  useEffect(() => {
    if (!sessionId || !uuid) {
      setStatus('error');
      setErrorMSG('Thiếu mã phiên làm việc hoặc UUID người dùng. Vui lòng truy cập từ trang nhiệm vụ.');
      return;
    }

    // Simulate VPN check (less than 5 seconds), this checks "fast" e.g. 2s
    const timeout = setTimeout(() => {
      fetch('/api/tasks/verify-session-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, uuid })
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'valid') {
          setStatus('valid');
          showNotification({ title: 'Bảo mật', message: 'Kết nối của bạn an toàn.', type: 'success' });
        } else {
          setStatus('error');
          setErrorMSG(data.error || 'Nghi vấn sử dụng VPN / Proxy. Hủy phiên làm việc.');
          showNotification({ title: 'Cảnh báo', message: data.error || 'VPN detected', type: 'error' });
        }
      })
      .catch(() => {
          setStatus('error');
          setErrorMSG('Lỗi mạng khi kiểm tra bảo mật.');
      });
    }, 2000);

    return () => clearTimeout(timeout);
  }, [sessionId, uuid, showNotification]);

  const handleSubmitReview = () => {
      if (!inputUrl) return showNotification({ title: 'Lỗi', message: 'Vui lòng nhập URL!', type: 'warning' });
      if (mode === 'map' && !inputUrl.includes('maps.app.goo.gl')) {
         return showNotification({ title: 'Sai định dạng', message: 'URL Map phải có dạng maps.app.goo.gl', type: 'error' });
      }
      if (mode === 'trip' && !inputUrl.includes('tripadvisor')) {
         return showNotification({ title: 'Sai định dạng', message: 'URL Tripadvisor không hợp lệ', type: 'error' });
      }

      fetch('/api/admin/submit-pro-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, uuid, type: mode, reviewUrl: inputUrl })
      })
      .then(res => res.json())
      .then(data => {
        if(data.success) {
          setStatus('confirmed');
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#3b82f6', '#f59e0b']
          });
          showNotification({ title: 'Thành công', message: 'Đã gửi bài review cho Admin duyệt.', type: 'success' });
          setTimeout(() => {
            window.location.href = '/app/task-vip'; 
          }, 3000);
        } else {
          showNotification({ title: 'Lỗi', message: data.error || 'Gửi thất bại', type: 'error' });
        }
      })
      .catch(() => showNotification({ title: 'Lỗi', message: 'Lỗi hệ thống', type: 'error' }));
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200">
        <div className="w-full mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600 font-black text-xl tracking-tight">
            <ShieldCheck size={28} />
            PROVERIFY
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-bold text-slate-600">
            <a href="#" className="hover:text-indigo-600 uppercase tracking-widest">Trang chủ</a>
            <a href="#" className="hover:text-indigo-600 uppercase tracking-widest">Tin tức</a>
            <a href="#" className="hover:text-indigo-600 uppercase tracking-widest">Hỗ trợ</a>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full mx-auto px-6 md:px-12 py-8 grid grid-cols-1 md:grid-cols-[1fr_350px] gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            
            <AnimatedDiv className="bg-indigo-50/50 border border-indigo-100 p-8 rounded-2xl text-center mb-8">
              {status === 'checking' && (
                <div className='flex flex-col items-center gap-4 py-6'>
                  <Loader2 className='animate-spin text-indigo-500' size={48} />
                  <h3 className='font-black text-xl text-slate-800'>Hệ thống đang kiểm tra bảo mật...</h3>
                  <p className="text-sm text-slate-500">Đang quét mạng để chống gian lận. Thời gian tối đa 5 giây.</p>
                </div>
              )}
              {status === 'error' && (
                  <div className='flex flex-col items-center gap-4 py-6'>
                      <AlertCircle className='text-rose-500' size={48} />
                      <h3 className='font-black text-xl text-slate-800'>Từ chối truy cập!</h3>
                      <p className='font-bold text-rose-600 bg-rose-50 px-4 py-2 rounded-lg'>{errorMSG}</p>
                      <button onClick={() => window.location.href = '/app/task-vip'} className='mt-4 bg-slate-900 text-white rounded-xl px-8 py-3 font-bold uppercase tracking-widest hover:bg-slate-800'>Quay lại trang nhiệm vụ</button>
                  </div>
              )}
              {status === 'valid' && (
                  <div className='flex flex-col gap-6 py-6 text-left'>
                      <div className="text-center mb-4">
                         <CheckCircle className='text-emerald-500 mx-auto mb-2' size={48} />
                         <h3 className='font-black text-xl text-slate-800 tracking-tight'>IP hợp lệ, mời xác minh:</h3>
                      </div>

                      {!mode && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button onClick={() => setMode('map')} className="p-6 bg-white border-2 border-emerald-100 hover:border-emerald-500 rounded-2xl transition-all shadow-sm hover:shadow-md flex flex-col items-center gap-3">
                               <Map size={32} className="text-emerald-500" />
                               <span className="font-black text-slate-800 uppercase tracking-widest">Gửi xác minh Review Map</span>
                            </button>
                            <button onClick={() => setMode('trip')} className="p-6 bg-white border-2 border-indigo-100 hover:border-indigo-500 rounded-2xl transition-all shadow-sm hover:shadow-md flex flex-col items-center gap-3">
                               <Plane size={32} className="text-indigo-500" />
                               <span className="font-black text-slate-800 uppercase tracking-widest">Gửi xác minh Review Trip</span>
                            </button>
                         </div>
                      )}

                      {mode === 'map' && (
                         <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                             <div className="bg-white p-4 rounded-xl border border-gray-200">
                                <label className="text-sm font-bold text-slate-700 block mb-2">
                                   NHẬP URL <span className="text-emerald-500 font-extrabold uppercase">https://maps.app.goo.gl/XXXXXXXX</span> VỪA NHẬP Ở <span className="text-rose-600 font-extrabold uppercase italic underline">Bước 4</span> VÀO ĐÂY
                                </label>
                                <div className="relative">
                                    <Edit3 className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                    <input 
                                       value={inputUrl}
                                       onChange={e => setInputUrl(e.target.value)}
                                       className="w-full bg-slate-50 border border-gray-200 rounded-lg pl-10 pr-4 py-3 font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono text-sm" 
                                       placeholder="https://maps.app.goo.gl/..." 
                                    />
                                </div>
                             </div>
                             <button onClick={handleSubmitReview} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black shadow-lg shadow-emerald-500/30 uppercase tracking-widest transition-all">
                                XÁC NHẬN - GỬI CHO ADMIN DUYỆT 2 LẦN
                                <span className="block text-xs font-medium opacity-80 mt-1">LẦN 1 24H - LẦN 2 10 NGÀY</span>
                             </button>
                             <button onClick={() => setMode(null)} className="w-full py-2 text-sm text-slate-500 font-bold hover:text-slate-800">Quay Lại Chọn Loại Nhiệm Vụ</button>
                         </div>
                      )}

                      {mode === 'trip' && (
                         <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                             <div className="bg-white p-4 rounded-xl border border-gray-200">
                                <label className="text-sm font-bold text-slate-700 block mb-2">
                                   NHẬP URL <span className="text-emerald-500 font-extrabold uppercase">https://www.tripadvisor.com.vn/ShowUserReviews-XXXXXXXX</span> VỪA NHẬP Ở <span className="text-rose-600 font-extrabold uppercase italic underline">Bước 4</span> VÀO ĐÂY
                                </label>
                                <div className="relative">
                                    <Edit3 className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                    <input 
                                       value={inputUrl}
                                       onChange={e => setInputUrl(e.target.value)}
                                       className="w-full bg-slate-50 border border-gray-200 rounded-lg pl-10 pr-4 py-3 font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm" 
                                       placeholder="https://www.tripadvisor.com.vn/..." 
                                    />
                                </div>
                             </div>
                             <button onClick={handleSubmitReview} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black shadow-lg shadow-indigo-500/30 uppercase tracking-widest transition-all">
                                XÁC NHẬN - GỬI CHO ADMIN DUYỆT 2 LẦN
                                <span className="block text-xs font-medium opacity-80 mt-1">LẦN 1 24H - LẦN 2 10 NGÀY</span>
                             </button>
                             <button onClick={() => setMode(null)} className="w-full py-2 text-sm text-slate-500 font-bold hover:text-slate-800">Quay Lại Chọn Loại Nhiệm Vụ</button>
                         </div>
                      )}

                  </div>
              )}
              {status === 'confirmed' && (
                  <div className='flex flex-col items-center gap-4 py-6'>
                      <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center mb-2">
                        <CheckCircle size={32} />
                      </div>
                      <h3 className='font-black text-xl text-slate-800 tracking-tight'>Gửi Xét Duyệt Thành Công!</h3>
                      <p className="text-sm font-bold text-blue-600">Hệ thống đang chuyển hướng bạn về lại trang web chính...</p>
                  </div>
              )}
            </AnimatedDiv>

              <article className="prose prose-slate max-w-none">
                <h1 className="text-3xl font-black mb-4 text-slate-900 tracking-tight">Quy trình duyệt tự động và chống Bot</h1>
                <div className="flex items-center gap-2 text-sm text-slate-500 font-bold uppercase tracking-wider mb-8">
                  <FileText size={16} /> Update: 24/10/2026
                </div>
                <p className="leading-relaxed text-slate-600">Môi trường mạng hiện nay đang đối mặt với nhiều nguy cơ. Do sự phát triển của các công cụ ẩn danh (VPN, Proxy) và mạng botnet, việc xác thực "người dùng thật" (Proof of Human) là vô cùng quan trọng đối với các hệ thống phân phối nội dung và quảng cáo.</p>
                
                <h2 className="text-xl font-bold mt-8 mb-4 text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="text-indigo-600" size={20} />
                  1. Tại sao phải cấm VPN và Proxy?
                </h2>
                <p className="leading-relaxed text-slate-600">Việc sử dụng VPN nhằm che giấu địa chỉ IP thực làm ảnh hưởng tới độ chính xác của các thuật toán phân bổ lưu lượng truy cập. Trình duyệt của bạn sẽ bị phân tích sâu hơn để đảm bảo tính minh bạch. Hệ thống ProVerify của chúng tôi kiểm soát thời gian thực IP của người dùng để loại bỏ các lượt truy cập ảo.</p>
                
                <h2 className="text-xl font-bold mt-8 mb-4 text-slate-800 flex items-center gap-2">
                   <CheckCircle className="text-indigo-600" size={20} />
                   2. Quy định duyệt Review của chúng tôi
                </h2>
                <p className="leading-relaxed text-slate-600">Bất kỳ review nào không mang tính xây dựng hoặc cố tình spam thông qua botnet sẽ trực tiếp bị từ chối ở cửa kiểm duyệt thứ nhất (Hệ thống AI rà soát 24H). Chúng tôi yêu cầu URL chính xác từ Google Maps hoặc Tripadvisor để đối soát với hệ thống đối tác.</p>

                <div className="mt-12 p-8 bg-slate-900 rounded-3xl text-white">
                   <h3 className="text-xl font-black mb-4 uppercase tracking-tighter italic">Tin tức & Sự kiện</h3>
                   <div className="space-y-4">
                      <div className="border-l-2 border-indigo-500 pl-4 py-1">
                         <h4 className="font-bold text-sm">Cập nhật thuật toán quét Proxy v4.2</h4>
                         <p className="text-xs text-slate-400 mt-1">Nâng cao khả năng phát hiện các dải IP từ các trung tâm dữ liệu (Data Center).</p>
                      </div>
                      <div className="border-l-2 border-indigo-500 pl-4 py-1">
                         <h4 className="font-bold text-sm">Hệ thống thanh toán qua VuiCoin được bảo mật bởi 2FA</h4>
                         <p className="text-xs text-slate-400 mt-1">Đảm bảo an toàn tuyệt đối cho tài sản kỹ thuật số của thành viên.</p>
                      </div>
                   </div>
                </div>
              </article>

          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-right mb-2">Advertisement</div>
            <div className="w-full h-64 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-300">
               <span className="font-bold text-sm uppercase">Ad Slot 300x250</span>
            </div>
          </div>

          <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-lg">
             <h3 className="font-black text-lg uppercase tracking-widest mb-4">Hỗ trợ nhanh</h3>
             <p className="text-indigo-200 text-sm mb-4 leading-relaxed">Nếu bạn gặp khó khăn trong quá trình gửi duyệt, hãy liên hệ QTV hoặc CSKH qua Hòm Thư.</p>
             <button className="w-full bg-indigo-800 hover:bg-indigo-700 py-3 rounded-xl font-bold text-sm transition-colors uppercase flex items-center justify-center gap-2">
               Gửi báo cáo lỗi <ChevronRight size={16}/>
             </button>
          </div>
        </aside>

      </main>

      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm border-t border-slate-800">
        <p className="font-bold tracking-widest">© 2026 PROVERIFY SECURE SYSTEM.</p>
        <p className="mt-2 text-xs opacity-50">Website được sử dụng cho mục đích xác nhận nâng cao.</p>
      </footer>
    </div>
  );
}
