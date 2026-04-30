import React, { useState, useEffect } from 'react';
import { Bell, Send, Trash2, Edit } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { safeFetch } from '@/lib/utils';

export function AdminNotifications() {
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('system');
  const [target, setTarget] = useState('all');
  const [history, setHistory] = useState<any[]>([]);

  const fetchHistory = async () => {
    const data = await safeFetch('/api/notifications');
    if (data && data.notifications) {
        setHistory(data.notifications.reverse());
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Xóa thông báo này?")) return;
    await safeFetch('/api/admin/notifications/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    fetchHistory();
  };

  const handleSend = async () => {
    if (!title || !content) {
      showNotification({ title: 'Thiếu thông tin', message: "Vui lòng điền đủ Tiêu đề và Nội dung", type: 'warning' });
      return;
    }
    
    const data = await safeFetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, type, target })
    });

    if (data && data.success) {
      showNotification({ title: 'Đã gửi', message: "Thông báo đã được đẩy tới hệ thống thành công!", type: 'success' });
      setTitle('');
      setContent('');
      fetchHistory();
      setActiveTab('history');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
        <button 
          onClick={() => setActiveTab('create')}
          className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${activeTab === 'create' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          Tạo thông báo mới
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${activeTab === 'history' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          Lịch sử thông báo
        </button>
      </div>

      {activeTab === 'create' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-slate-800">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
              <Bell size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Push thông báo in-app</h2>
              <p className="text-sm text-gray-500">Gửi thông báo tới toàn bộ hệ thống hoặc theo nhóm đối tượng</p>
            </div>
          </div>

          <div className="space-y-6 w-full">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Tiêu đề thông báo</label>
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ví dụ: Bảo trì hệ thống định kỳ..." 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Nội dung chi tiết</label>
              <textarea 
                rows={5}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Nhập nội dung cần truyền tải..." 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Loại thông báo</label>
                 <select value={type} onChange={e => setType(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium">
                    <option value="system">Hệ thống (Bảo trì, Update)</option>
                    <option value="event">Sự kiện (Khuyến mãi, Minigame)</option>
                    <option value="warning">Cảnh báo (Khóa TK, Scam)</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Đối tượng nhận</label>
                 <select value={target} onChange={e => setTarget(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium">
                    <option value="all">Tất cả người dùng</option>
                    <option value="active">Chỉ người dùng đang hoạt động (7 ngày qua)</option>
                    <option value="inactive">Người dùng ít tương tác</option>
                 </select>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
              <button className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-xl font-bold transition-all text-sm">
                Lưu Nháp
              </button>
              <button onClick={handleSend} className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all text-sm">
                <Send size={18} />
                Gửi Thông Báo
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-2 rounded-tl-2xl w-16 text-center">ID</th>
                  <th className="p-2 w-1/4">Thông báo</th>
                  <th className="p-2">Nội dung</th>
                  <th className="p-2 w-32">Ngày gửi</th>
                  <th className="p-2 text-center rounded-tr-2xl w-24">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((notif: any) => (
                  <tr key={notif.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-2 text-center font-mono text-xs text-gray-500">#{notif.id.slice(-4)}</td>
                    <td className="p-2">
                      <div className="font-bold text-slate-800 text-sm line-clamp-1">{notif.title}</div>
                      <div className="text-[9px] font-bold mt-0.5 uppercase tracking-wider text-blue-500">
                         {notif.type === 'system' ? 'Hệ thống' : notif.type === 'event' ? 'Sự kiện' : 'Cảnh báo'}
                      </div>
                    </td>
                    <td className="p-2 text-xs text-gray-600 line-clamp-2 max-w-sm">
                      {notif.content}
                    </td>
                    <td className="p-2 text-xs text-gray-500">{new Date(notif.created_at).toLocaleString('vi-VN')}</td>
                    <td className="p-2">
                       <div className="flex justify-center gap-1.5">
                         <button className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-slate-800 rounded-lg transition-colors tooltip" title="Chỉnh sửa">
                            <Edit size={14} />
                         </button>
                         <button onClick={() => handleDelete(notif.id)} className="p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-colors tooltip" title="Xóa">
                            <Trash2 size={14} />
                         </button>
                       </div>
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-400 font-medium">
                      Chưa có thông báo nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
