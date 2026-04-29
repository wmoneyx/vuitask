import React, { useState, useEffect } from 'react';
import { History, Activity, User, Monitor, DollarSign } from 'lucide-react';
import { safeFetch } from '@/lib/utils';

export function AdminHistory() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
     const data = await safeFetch('/api/admin/history');
     if (data && data.logs) setLogs(data.logs);
     setLoading(false);
  };

  useEffect(() => {
     fetchLogs();
  }, []);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 w-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
           <History size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Lịch sử hoạt động</h2>
          <p className="text-sm text-gray-500">Ghi log tất cả những thao tác thay đổi trong hệ thống</p>
        </div>
      </div>

      <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-100 before:via-gray-200 before:to-transparent">
        {logs.map((item) => {
          return (
            <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors">
                 <Activity size={16} className="text-gray-500" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <div className="font-bold text-slate-900">{item.action_type}</div>
                  <time className="font-mono text.xs text-gray-400">{new Date(item.created_at).toLocaleString()}</time>
                </div>
                <div className="text-sm text-gray-600">
                  Mục tiêu: <span className="font-medium text-slate-800">{item.target_id || 'System'}</span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  <span className="font-medium">{item.description}</span>
                </div>
                <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <User size={12} /> by {item.user_uuid}
                </div>
              </div>
            </div>
          );
        })}
        {loading && <div className="p-8 text-center text-gray-400 font-medium">Đang tải...</div>}
        {!loading && logs.length === 0 && (
          <div className="p-8 text-center text-gray-400 font-medium">Chưa có lịch sử.</div>
        )}
      </div>
    </div>
  );
}
