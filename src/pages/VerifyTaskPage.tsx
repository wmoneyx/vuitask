import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, ShieldCheck, FileText, ChevronRight } from 'lucide-react';
import { AnimatedDiv } from "@/components/ui/AnimatedText";
import confetti from 'canvas-confetti';
import { useNotification } from '../context/NotificationContext';

export function VerifyTaskPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [status, setStatus] = useState<'checking' | 'valid' | 'error' | 'confirmed'>('checking');
  const [errorMSG, setErrorMSG] = useState('');
  
  const sessionId = searchParams.get('code');
  const uuid = searchParams.get('uuid');

  useEffect(() => {
    if (!sessionId || !uuid) {
      setStatus('error');
      setErrorMSG('Thiếu mã phiên làm việc hoặc UUID người dùng. Vui lòng truy cập từ trang nhiệm vụ.');
      return;
    }

    // Simulate a 2-second VPN check delay before verifying to satisfy the < 5s rule
    const timeout = setTimeout(() => {
      fetch('/api/tasks/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, uuid })
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'valid') {
          setStatus('valid');
          showNotification({ title: 'An toàn', message: 'Kết nối của bạn đã được xác thực.', type: 'success' });
        } else {
          setStatus('error');
          setErrorMSG(data.error);
          showNotification({ title: 'Cảnh báo', message: data.error, type: 'error' });
        }
      })
      .catch(() => {
          setStatus('error');
          setErrorMSG('Lỗi kiểm tra session.');
      });
    }, 2500);

    return () => clearTimeout(timeout);
  }, [sessionId, uuid, showNotification]);

  const handleConfirm = () => {
    fetch('/api/tasks/complete-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, uuid })
    })
    .then(res => res.json())
    .then(data => {
      if(data.status === 'success') {
        setStatus('confirmed');
        
        // Fireworks!
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
        });

        showNotification({ 
          title: 'Thành công', 
          message: 'Nhiệm vụ đã hoàn thành. Cộng tiền vào tài khoản!', 
          type: 'success' 
        });

        setTimeout(() => {
          window.location.href = '/app/task'; // Redirect completely back to task page
        }, 3000);
      } else {
        setStatus('error');
        setErrorMSG(data.error || 'Lỗi xác nhận');
        showNotification({ title: 'Lỗi', message: data.error || 'Lỗi xác nhận', type: 'error' });
      }
    })
    .catch(() => {
      showNotification({ title: 'Lỗi', message: 'Lỗi kết nối máy chủ', type: 'error' });
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600 font-black text-xl tracking-tight">
            <ShieldCheck size={28} />
            VERIFYHUB
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-bold text-slate-600">
            <a href="#" className="hover:text-blue-600 uppercase tracking-widest">Trang chủ</a>
            <a href="#" className="hover:text-blue-600 uppercase tracking-widest">Tin tức</a>
            <a href="#" className="hover:text-blue-600 uppercase tracking-widest">Hỗ trợ</a>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8">
        
        {/* MAIN ARTICLE CONTENT */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            
            {/* THE VERIFICATION COMPONENT */}
            <AnimatedDiv className="bg-blue-50/50 border border-blue-100 p-8 rounded-2xl text-center mb-8">
              {status === 'checking' && (
                <div className='flex flex-col items-center gap-4 py-6'>
                  <Loader2 className='animate-spin text-blue-500' size={48} />
                  <h3 className='font-black text-xl text-slate-800'>Hệ thống đang kiểm tra bảo mật...</h3>
                  <p className="text-sm text-slate-500">Quét IP, phát hiện VPN/Proxy/Bot. Vui lòng đợi trong giây lát.</p>
                </div>
              )}
              {status === 'error' && (
                  <div className='flex flex-col items-center gap-4 py-6'>
                      <AlertCircle className='text-rose-500' size={48} />
                      <h3 className='font-black text-xl text-slate-800'>Từ chối truy cập!</h3>
                      <p className='font-bold text-rose-600 bg-rose-50 px-4 py-2 rounded-lg'>{errorMSG}</p>
                      <button onClick={() => window.location.href = '/app/task'} className='mt-4 bg-slate-900 text-white rounded-xl px-8 py-3 font-bold uppercase tracking-widest hover:bg-slate-800'>Quay lại Web chính</button>
                  </div>
              )}
              {status === 'valid' && (
                  <div className='flex flex-col items-center gap-4 py-6'>
                      <CheckCircle className='text-emerald-500' size={48} />
                      <h3 className='font-black text-xl text-slate-800 tracking-tight'>Phiên làm việc hợp lệ!</h3>
                      <p className="text-sm text-slate-500 mb-2">Bạn đã có thể xác nhận hoàn thành nhiệm vụ.</p>
                      <button 
                        onClick={handleConfirm} 
                        className='bg-emerald-600 text-emerald-50 hover:bg-emerald-500 rounded-2xl px-10 py-5 font-black w-full max-w-md text-lg transition-all shadow-lg shadow-emerald-600/20 uppercase tracking-widest'
                      >
                        Xác Nhận Hoàn Thành
                      </button>
                  </div>
              )}
              {status === 'confirmed' && (
                  <div className='flex flex-col items-center gap-4 py-6'>
                      <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center mb-2">
                        <CheckCircle size={32} />
                      </div>
                      <h3 className='font-black text-xl text-slate-800 tracking-tight'>Thành công!</h3>
                      <p className="text-sm font-bold text-blue-600">Hệ thống đang chuyển hướng bạn về lại trang nhiệm vụ...</p>
                  </div>
              )}
            </AnimatedDiv>

            <article className="prose prose-slate max-w-none">
              <h1 className="text-3xl font-black mb-4 text-slate-900 tracking-tight">Tầm quan trọng của việc kiểm tra bảo mật truy cập</h1>
              <div className="flex items-center gap-2 text-sm text-slate-500 font-bold uppercase tracking-wider mb-8">
                <FileText size={16} /> Ngày đăng: 24/10/2026
              </div>
              <p>Môi trường mạng hiện nay đang đối mặt với nhiều nguy cơ. Do sự phát triển của các công cụ ẩn danh (VPN, Proxy) và mạng botnet, việc xác thực "người dùng thật" (Proof of Human) là vô cùng quan trọng đối với các hệ thống phân phối nội dung và quảng cáo.</p>
              
              <h2 className="text-xl font-bold mt-8 mb-4 text-slate-800">1. Tại sao phải cấm VPN và Proxy?</h2>
              <p>Việc sử dụng VPN nhằm che giấu địa chỉ IP thực làm ảnh hưởng tới độ chính xác của các thuật toán phân bổ lưu lượng truy cập. Trình duyệt của bạn sẽ bị phân tích sâu hơn để đảm bảo tính minh bạch.</p>
              
              <h2 className="text-xl font-bold mt-8 mb-4 text-slate-800">2. Mức độ an toàn thông tin</h2>
              <p>Chúng tôi chỉ kiểm tra độ phân giải IP và mức độ rủi ro (Fraud Score) từ địa chỉ mạng của bạn. Hệ thống hoàn toàn không thu thập thông tin định danh cá nhân ngoài mã phiên làm việc gốc (Session ID).</p>
            </article>

          </div>
        </div>

        {/* SIDEBAR WIDGETS & ADS */}
        <aside className="space-y-6">
          {/* FAKE AD UNIT 1 */}
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-right mb-2">Advertisement</div>
            <div className="w-full h-64 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-300">
               <span className="font-bold text-sm uppercase">Ad Slot 300x250</span>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg">
             <h3 className="font-black text-lg uppercase tracking-widest mb-4">Hỗ trợ nhanh</h3>
             <p className="text-slate-400 text-sm mb-4 leading-relaxed">Nếu bạn gặp khó khăn trong quá trình làm nhiệm vụ, hãy báo cáo để được xử lý ngay.</p>
             <button className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold text-sm transition-colors uppercase flex items-center justify-center gap-2">
               Gửi báo cáo lỗi <ChevronRight size={16}/>
             </button>
          </div>

          {/* FAKE AD UNIT 2 */}
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hidden md:block">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-right mb-2">Google Adsense</div>
            <div className="w-full h-[600px] bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-300">
               <span className="font-bold text-sm uppercase">Skyscraper Ad 300x600</span>
            </div>
          </div>
        </aside>

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm border-t border-slate-800">
        <p className="font-bold tracking-widest">© 2026 VERIFYHUB SECURE SYSTEM.</p>
        <p className="mt-2 text-xs opacity-50">Website được sử dụng cho mục đích xác nhận hoàn thành nhiệm vụ từ đối tác.</p>
      </footer>
    </div>
  );
}
