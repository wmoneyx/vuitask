import React from 'react';
import { AnimatedDiv, AnimatedText } from "@/components/ui/AnimatedText";
import { STATUS_COLORS } from "@/constants";

interface GenericPageProps {
  title: string;
  children?: React.ReactNode;
  showHistory?: boolean;
}

export function GenericPage({ title, children, showHistory = true }: GenericPageProps) {
  const histories: any[] = [];

  return (
    <div className="space-y-6 max-w-full">
      <h1 className="text-2xl font-bold">
        <AnimatedText>{title}</AnimatedText>
      </h1>

      <AnimatedDiv delay={0.1} className="min-h-[200px]">
         {children || (
           <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-center">
             <div className="text-gray-400 italic text-sm text-center">Tính năng đang được phát triển...</div>
           </div>
         )}
      </AnimatedDiv>

      {showHistory && (
         <AnimatedDiv delay={0.2} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
               <h3 className="font-bold text-slate-800">Lịch sử & Trạng thái</h3>
            </div>
            <div className="p-0 overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wider">
                        <th className="p-2 font-medium border-b border-gray-100">Thời gian tạo</th>
                        <th className="p-2 font-medium border-b border-gray-100">Chi tiết</th>
                        <th className="p-2 font-medium border-b border-gray-100">Phần thưởng (Vui)</th>
                        <th className="p-2 font-medium border-b border-gray-100 w-36">Trạng thái</th>
                     </tr>
                  </thead>
                  <tbody>
                     {histories.length > 0 ? (
                        histories.map((record, i) => (
                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors text-xs">
                               <td className="p-2 text-gray-600">{record.time}</td>
                               <td className="p-2 text-slate-800 font-medium">{record.detail}</td>
                               <td className={`p-2 font-bold ${record.reward.includes('+') ? 'text-green-600' : record.reward.includes('-') && record.reward !== '-' ? 'text-red-500' : 'text-gray-400'}`}>
                                   {record.reward}
                               </td>
                               <td className="p-2">
                                  <span className={`inline-flex items-center gap-1.5 font-medium ${STATUS_COLORS[record.status as keyof typeof STATUS_COLORS]}`}>
                                     <span className={`w-1.5 h-1.5 rounded-full ${record.statusColor}`}></span> {record.statusLabel}
                                  </span>
                               </td>
                            </tr>
                        ))
                     ) : (
                        <tr>
                           <td colSpan={4} className="p-4 text-center text-gray-400 text-xs italic">
                              Chưa có dữ liệu lịch sử
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </AnimatedDiv>
      )}
    </div>
  );
}
