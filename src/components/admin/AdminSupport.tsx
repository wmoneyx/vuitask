import React from 'react';
import { Bug, CheckCircle } from 'lucide-react';

const mockBugs: any[] = [];

export function AdminSupport() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 w-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
          <Bug size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Báo cáo lỗi (Bugs)</h2>
          <p className="text-sm text-gray-500">Xem bug hệ thống để fix nhanh nhất</p>
        </div>
      </div>

      <div className="space-y-4">
        {mockBugs.map(bug => (
          <div key={bug.id} className="p-5 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                 <h4 className="font-bold text-slate-900">{bug.title}</h4>
                 {bug.status === 'open' 
                   ? <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Chưa fix</span>
                   : <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Đã fix</span>
                 }
              </div>
              <p className="text-sm text-gray-600">{bug.desc}</p>
              <div className="text-xs text-gray-400 mt-2 font-mono">{bug.date}</div>
            </div>
            
            {bug.status === 'open' && (
              <button className="shrink-0 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                 <CheckCircle size={16} /> Mark as Fixed
              </button>
            )}
          </div>
        ))}
        {mockBugs.length === 0 && (
          <div className="text-center py-10 text-gray-500 font-medium bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
             Hệ thống đang hoạt động trơn tru!
          </div>
        )}
      </div>
    </div>
  );
}
