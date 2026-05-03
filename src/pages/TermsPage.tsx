import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { AnimatedDiv } from '@/components/ui/AnimatedText';

export function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6 md:px-12 lg:px-20 font-sans">
      <div className="w-full mx-auto max-w-[1200px]">
        <div className="flex justify-between items-center mb-8">
           <Link to="/" className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
              <ArrowLeft size={16} /> QUAY LẠI
           </Link>
           <Logo />
        </div>
        
        <AnimatedDiv className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-100">
           <h1 className="text-3xl font-black text-slate-900 mb-8 border-b pb-6 tracking-tight uppercase">Điều khoản & Quy định</h1>
           
           <div className="space-y-8 text-slate-600 leading-relaxed text-sm sm:text-base">
             <section>
               <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-tight">
                 <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs shrink-0">1.1</div>
                 Chính sách tài khoản
               </h2>
               <p>Mỗi người dùng chỉ được phép sở hữu 01 tài khoản duy nhất trên hệ thống. Việc cố tình tạo nhiều tài khoản nhằm trục lợi sẽ bị khóa vĩnh viễn và không hoàn lại số dư.</p>
             </section>

             <section>
               <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-tight">
                 <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs shrink-0">1.2</div>
                 Nhiệm vụ & Gian lận
               </h2>
               <p>Nghiêm cấm tuyệt đối việc sử dụng các công cụ tự động (Bot), tập lệnh (Script), VPN hoặc Proxy để thực hiện nhiệm vụ. Mọi hành vi nghi vấn sẽ được hệ thống dữ liệu lớn tự động gắn cờ và kiểm tra chéo.</p>
             </section>

             <section>
               <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-tight">
                 <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs shrink-0">1.3</div>
                 Quy chuẩn rút tiền
               </h2>
               <p>Số dư tối thiểu để khởi tạo lệnh rút tiền là 10.000 VuiCoin. Thời gian xử lý lệnh từ 5 phút đến 24 giờ. Tài khoản chưa xác minh IP có thể bị tạm giữ tiền để kiểm tra tính hợp lệ.</p>
             </section>

             <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100 ring-1 ring-slate-200/50 shadow-inner">
               <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-tight">
                 <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs shrink-0">1.4</div>
                 Giới hạn nhiệm vụ & Chia sẻ thiết bị
               </h2>
               <p className="font-medium text-slate-700">Hệ thống áp dụng hạn mức làm nhiệm vụ theo ngày cho từng Tài khoản, Thiết bị và Địa chỉ IP. Khi một thiết bị hoặc IP đã đạt giới hạn cho một nhiệm vụ cụ thể, bất kỳ tài khoản nào khác dùng chung môi trường này đều không thể tiếp tục thực hiện nhiệm vụ đó cho đến khi qua ngày mới.</p>
             </section>

             <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100 ring-1 ring-slate-200/50 shadow-inner">
               <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-tight">
                 <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs shrink-0">1.5</div>
                 Công nghệ định danh (Fingerprint)
               </h2>
               <p className="font-medium text-slate-700">Chúng tôi sử dụng công nghệ định danh vân tay trình duyệt để nhận diện thiết bị. Mọi hành vi xóa Cookie, dùng Tab ẩn danh hoặc thay đổi thông số trình duyệt nhằm lách luật đều được hệ thống ghi lại và có thể dẫn đến việc hạn chế quyền lợi hoặc khóa vĩnh viễn.</p>
             </section>
           </div>
           
           <div className="mt-12 pt-8 border-t border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                 <Shield size={24} />
              </div>
              <div className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-loose">
                ĐIỀU KHOẢN CẬP NHẬT LẦN CUỐI VÀO NGÀY 02 THÁNG 05 NĂM 2026. VUITASK CÓ QUYỀN THAY ĐỔI CÁC QUY ĐỊNH MÀ KHÔNG CẦN THÔNG BÁO TRƯỚC.
              </div>
           </div>
        </AnimatedDiv>
      </div>
    </div>
  );
}
