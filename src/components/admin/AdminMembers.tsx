import React, { useState, useEffect } from 'react';
import { Search, Users, AlertTriangle, MoreVertical, Ban, DollarSign, Trash2, ShieldAlert, CheckCircle, Copy, ShieldCheck } from 'lucide-react';

export function AdminMembers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
     setLoading(true);
     try {
       const res = await fetch('/api/admin/members');
       const data = await res.json();
       if (data.members) {
          setMembers(data.members);
       }
     } catch (e) {
       console.error(e);
     }
     setLoading(false);
  };

  useEffect(() => {
     fetchMembers();
  }, []);

  const toggleBan = async (id: string, is_banned: boolean) => {
    try {
      await fetch('/api/admin/members/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_banned })
      });
      fetchMembers(); // refresh
    } catch(e) {
      console.error(e);
    }
    setDropdownOpen(null);
  };

  const toggleAdmin = async (id: string, is_admin: boolean) => {
    try {
      await fetch('/api/admin/members/set-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_admin })
      });
      fetchMembers(); // refresh
    } catch(e) {
      console.error(e);
    }
    setDropdownOpen(null);
  };

  const deleteAccount = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản này? Hành động này không thể hoàn tác.")) return;
    try {
      await fetch('/api/admin/members/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      fetchMembers(); // refresh
    } catch(e) {
      console.error(e);
    }
    setDropdownOpen(null);
  };

  const filteredMembers = members.filter(m => 
     m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm Tên hoặc Email..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold text-sm transition-colors border border-rose-100">
            <AlertTriangle size={16} />
            CHECK IP TRÙNG LẶP
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold text-sm transition-colors">
            <Users size={16} />
            CHỌN TẤT CẢ
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="p-2 rounded-tl-2xl w-10">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-500 focus:ring-blue-500" />
                </th>
                <th className="p-2">Tên & Email</th>
                <th className="p-2 text-right">Doanh thu tất cả</th>
                <th className="p-2 text-right">Doanh thu hôm nay</th>
                <th className="p-2 text-center">Đã duyệt</th>
                <th className="p-2">IP Mạng</th>
                <th className="p-2">Ngày tham gia</th>
                <th className="p-2">Trạng thái</th>
                <th className="p-2 text-center rounded-tr-2xl">Cài đặt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={9} className="p-4 text-center text-gray-400">Đang tải...</td></tr>
              ) : filteredMembers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-2 text-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-500 focus:ring-blue-500" />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0 text-sm">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                          {user.name}
                          {user.suspicious && <ShieldAlert size={14} className="text-rose-500" />}
                        </div>
                        <div className="text-[11px] text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-2 text-right font-bold text-slate-900 whitespace-nowrap text-sm">
                    {user.totalRev.toLocaleString()}đ
                  </td>
                  <td className="p-2 text-right font-bold text-green-600 whitespace-nowrap text-sm">
                    +{user.todayRev.toLocaleString()}đ
                  </td>
                  <td className="p-2 text-center font-bold text-slate-700 text-sm">
                    {user.unapprovedRef}
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{user.ip}</span>
                      <button className="text-gray-400 hover:text-blue-500 transition-colors"><Copy size={12} /></button>
                    </div>
                  </td>
                  <td className="p-2 text-xs text-gray-600">
                    {user.joinDate}
                  </td>
                  <td className="p-2">
                    {user.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Bị khóa
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-center relative">
                    <button 
                      onClick={() => setDropdownOpen(dropdownOpen === user.id ? null : user.id)}
                      className="p-2 text-gray-400 hover:text-slate-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                    
                    {dropdownOpen === user.id && (
                      <div className="absolute right-8 top-12 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                        <button onClick={() => toggleAdmin(user.id, !user.isAdmin)} className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-blue-50 flex items-center gap-3 text-blue-600">
                          <ShieldCheck size={16} />
                          {user.isAdmin ? 'Gỡ quyền Admin' : 'Cấp quyền Admin'}
                        </button>
                        <button onClick={() => toggleBan(user.id, user.status === 'active' ? true : false)} className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 flex items-center gap-3 text-slate-700">
                          {user.status === 'active' ? <Ban size={16} className="text-gray-400" /> : <CheckCircle size={16} className="text-green-500" />}
                          {user.status === 'active' ? 'Khóa tài khoản' : 'Mở tài khoản'}
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 flex items-center gap-3 text-slate-700">
                          <DollarSign size={16} className="text-yellow-500" />
                          Cộng/Trừ tiền thủ công
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 flex items-center gap-3 text-slate-700">
                          <ShieldAlert size={16} className="text-orange-500" />
                          Đưa vào diện tình nghi
                        </button>
                        <div className="h-px bg-gray-100 my-1"></div>
                        <button onClick={() => deleteAccount(user.id)} className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-rose-50 flex items-center gap-3 text-rose-600">
                          <Trash2 size={16} />
                          Xóa tải khoản
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-400 font-medium">
                    Không có thành viên nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
