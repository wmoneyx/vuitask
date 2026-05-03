import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { AnimatedDiv } from '@/components/ui/AnimatedText';
import { Users, DollarSign, Star, Zap, Shield, Clock } from 'lucide-react';

export function LandingPage() {
  const isLoggedIn = !!localStorage.getItem('userUUID');

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      {/* Navbar */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="w-full mx-auto px-6 md:px-12 lg:px-20 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link to="/app" className="bg-slate-900 text-white px-5 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors text-sm">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-slate-600 font-medium hover:text-slate-900 text-sm">
                  LOG IN
                </Link>
                <Link to="/register" className="bg-slate-900 text-white px-5 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors text-sm">
                  SIGN UP
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-16 px-6 md:px-12 lg:px-20">
        <div className="w-full mx-auto text-center">
          <AnimatedDiv delay={0.1}>
             <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">VUITASK.NET - WEBSITE KIẾM TIỀN ONLINE ỔN ĐỊNH</p>
             <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight leading-tight">
               Nền tảng kiếm tiền online<br />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-primary text-6xl md:text-8xl lg:text-9xl">số 1 Việt Nam</span>
             </h1>
             <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-4xl mx-auto leading-relaxed">
               Kiếm tiền thụ động vào thời gian rảnh, thu nhập cao. Vui Task kết nối doanh nghiệp với hàng nghìn cộng tác viên. Làm nhiệm vụ đơn giản, rút tiền mặt nhanh chóng.
             </p>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <Link to={isLoggedIn ? "/app" : "/register"} className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-full font-bold hover:bg-slate-800 transition-transform hover:scale-105 active:scale-95 shadow-lg w-full sm:w-auto">
                 THAM GIA NGAY <Zap fill="currentColor" size={20} />
               </Link>
               <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5"><Shield size={16} className="text-green-500" /> Uy tín 100%</span>
                  <span className="flex items-center gap-1.5"><DollarSign size={16} className="text-primary" /> Rút tiền ngay</span>
               </div>
             </div>
          </AnimatedDiv>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-gray-50/50 border-y border-gray-100">
        <div className="w-full mx-auto px-6 md:px-12 lg:px-20">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <AnimatedDiv delay={0.2} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={24} />
                </div>
                <div className="text-3xl font-bold mb-1">125,483+</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">NGƯỜI DÙNG TIN DÙNG</div>
              </AnimatedDiv>
              <AnimatedDiv delay={0.3} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
                <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign size={24} />
                </div>
                <div className="text-3xl font-bold mb-1">$1,240,500+</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">TỔNG TIỀN ĐÃ RÚT</div>
              </AnimatedDiv>
              <AnimatedDiv delay={0.4} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
                <div className="w-12 h-12 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star fill="currentColor" size={24} />
                </div>
                <div className="text-3xl font-bold mb-1">99.8%</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">TỈ LỆ HÀI LÒNG</div>
              </AnimatedDiv>
           </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
         <div className="w-full mx-auto px-6 md:px-12 lg:px-20">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-bold mb-4">Tính năng nổi bật</h2>
               <p className="text-gray-500">Tại sao nên chọn Vui Task để gia tăng thu nhập?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="p-6">
                 <Zap className="text-primary mb-4" size={28} />
                 <h3 className="text-lg font-bold mb-2">Nhiệm vụ đa dạng</h3>
                 <p className="text-gray-500 text-sm">Hàng trăm nhiệm vụ mỗi ngày: Click web, App, Mail...</p>
               </div>
               <div className="p-6">
                 <Clock className="text-primary mb-4" size={28} />
                 <h3 className="text-lg font-bold mb-2">Rút tiền cực nhanh</h3>
                 <p className="text-gray-500 text-sm">Xử lý rút tiền về ATM, Momo, ZaloPay tự động 24/7.</p>
               </div>
               <div className="p-6">
                 <Shield className="text-primary mb-4" size={28} />
                 <h3 className="text-lg font-bold mb-2">Bảo mật tuyệt đối</h3>
                 <p className="text-gray-500 text-sm">Hệ thống bảo mật đa lớp, bảo vệ số dư của bạn.</p>
               </div>
            </div>
         </div>
      </section>

      {/* Transparent Payments */}
      <section className="py-20 bg-slate-900 text-white">
         <div className="w-full mx-auto px-6 md:px-12 lg:px-20">
            <div className="flex flex-col lg:flex-row gap-12 items-center">
               <div className="lg:w-1/3">
                  <h2 className="text-3xl font-bold mb-6">Thanh toán minh bạch</h2>
                  <p className="text-slate-400 text-sm leading-relaxed mb-8">
                    Hệ thống Vui Task công khai các lệnh rút tiền đã được xử lý trong thời gian thực. Sự tin tưởng của bạn là ưu tiên hàng đầu của chúng tôi.
                  </p>
                  <ul className="space-y-4">
                     <li className="flex items-center gap-3 text-sm font-medium">
                        <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center"><Shield size={14} /></div>
                        Bảo mật thông tin người nhận
                     </li>
                     <li className="flex items-center gap-3 text-sm font-medium">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center"><Zap size={14} /></div>
                        Mã giao dịch công khai
                     </li>
                  </ul>
               </div>
               <div className="lg:w-2/3 w-full">
                  <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-2xl">
                     <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                        <h3 className="font-bold text-sm tracking-widest text-slate-300 uppercase">LỆNH RÚT GẦN ĐÂY</h3>
                        <div className="flex items-center gap-2 text-xs font-medium text-green-400">
                           <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> LIVE
                        </div>
                     </div>
                     <div className="space-y-4">
                        <div className="text-center py-12 border-2 border-dashed border-slate-700/50 rounded-xl">
                           <p className="text-slate-500 text-sm font-medium italic">Đang chờ kết nối dữ liệu trực tiếp...</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12">
        <div className="w-full mx-auto px-6 md:px-12 lg:px-20 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex flex-col items-center md:items-start gap-4">
              <Logo />
              <div className="text-xs text-gray-400 flex items-center gap-2">
                 <Shield size={14} /> BẢN QUYỀN THUỘC VUITASK
              </div>
              <p className="text-xs text-gray-500">© 2026 VuiTask.net. Nền tảng kiếm tiền online số 1 VN.</p>
           </div>
           
           <div className="flex gap-8 text-sm font-medium text-slate-600">
              <Link to="/terms" className="hover:text-primary transition-colors">Điều khoản</Link>
              <a href="#" className="hover:text-primary transition-colors">Chính sách bảo mật</a>
              <a href="#" className="hover:text-primary transition-colors">Liên hệ</a>
           </div>
        </div>
      </footer>
    </div>
  );
}
