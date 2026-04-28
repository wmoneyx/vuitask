import { Eye, Wallet, BellRing } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AnimatedDiv, AnimatedText } from "@/components/ui/AnimatedText";
import { VuiCoin } from "@/components/ui/VuiCoin";

const CHART_DATA: any[] = [];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        <AnimatedText>Tổng quan</AnimatedText>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnimatedDiv delay={0.1} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-cyan-50 text-cyan-500 flex items-center justify-center shrink-0">
             <Eye size={28} strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-sm text-gray-500 font-medium mb-1">Tổng Số View</div>
            <div className="text-2xl font-bold text-slate-800">
               0 <span className="text-sm font-medium text-gray-400">/ ∞</span>
            </div>
          </div>
        </AnimatedDiv>

        <AnimatedDiv delay={0.2} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
             <VuiCoin size={28} strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-sm text-gray-500 font-medium mb-1">Số Dư Hôm Nay</div>
            <div className="text-2xl font-bold text-purple-600 flex items-center gap-1.5"><VuiCoin size={24} strokeWidth={2.5} /> 0.0</div>
          </div>
        </AnimatedDiv>

        <AnimatedDiv delay={0.3} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
             <Wallet size={28} strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-sm text-gray-500 font-medium mb-1">Số Dư Ví</div>
            <div className="text-2xl font-bold text-amber-500 flex items-center gap-1.5"><VuiCoin size={24} strokeWidth={2.5} /> 0.0</div>
          </div>
        </AnimatedDiv>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <AnimatedDiv delay={0.4} className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">Biểu đồ Thu nhập</h3>
            <div className="h-72 w-full">
              {CHART_DATA.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CHART_DATA} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '20px'}} />
                    <Bar dataKey="view" name="Lượt làm" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="vui" name="Thu nhập" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-100 rounded-xl">
                   <p className="text-gray-400 italic text-sm">Chưa có dữ liệu thống kê</p>
                </div>
              )}
            </div>
         </AnimatedDiv>

         <AnimatedDiv delay={0.5} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <BellRing size={20} className="text-primary" />
              Thông Báo Từ Web
            </h3>
            <div className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-100 rounded-xl text-center">
              <p className="text-gray-400 italic text-sm">Chưa có thông báo nào</p>
            </div>
         </AnimatedDiv>
      </div>
    </div>
  );
}
