import React, { useState, useEffect } from 'react';
import { Search, Users, AlertTriangle, MoreVertical, Ban, DollarSign, Trash2, ShieldAlert, CheckCircle, Copy, ShieldCheck } from 'lucide-react';
import { safeFetch } from '@/lib/utils';

export function AdminMembers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAdjModal, setShowAdjModal] = useState<string | null>(null);
  const [adjAmount, setAdjAmount] = useState('');
  const [adjType, setAdjType] = useState<'add' | 'subtract'>('add');
  const [showDuplicateIps, setShowDuplicateIps] = useState(false);
  const [duplicateIps, setDuplicateIps] = useState<any[]>([]);

  const fetchMembers = async () => {
     setLoading(true);
     const data = await safeFetch('/api/admin/members');
     if (data && data.members) {
        setMembers(data.members);
     }
     const dupeData = await safeFetch('/api/admin/duplicate-ips');
     if (dupeData && dupeData.duplicates) {
        setDuplicateIps(dupeData.duplicates);
     }
     setLoading(false);
  };

  useEffect(() => {
     fetchMembers();
  }, []);

  const toggleBan = async (id: string, is_banned: boolean) => {
    await safeFetch('/api/admin/members/ban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_banned })
    });
    fetchMembers(); // refresh
    setDropdownOpen(null);
  };

  const toggleAdmin = async (id: string, is_admin: boolean) => {
    await safeFetch('/api/admin/members/set-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_admin })
    });
    fetchMembers(); // refresh
    setDropdownOpen(null);
  };

  const deleteAccount = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản này? Hành động này không thể hoàn tác.")) return;
    await safeFetch('/api/admin/members/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    fetchMembers(); // refresh
    setDropdownOpen(null);
  };

  const handleAdjustBalance = async () => {
    if (!showAdjModal || !adjAmount) return;
    await safeFetch('/api/admin/members/adjust-balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: showAdjModal, amount: Number(adjAmount), type: adjType })
    });
    setAdjAmount('');
    setShowAdjModal(null);
    fetchMembers();
  };

  const deleteIpRecord = async (ip: string, userUuid: string) => {
    if (!window.confirm(`Xóa bản ghi IP ${ip} cho người dùng này?`)) return;
    await safeFetch('/api/admin/delete-ip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, user_uuid: userUuid })
    });
    fetchMembers();
  };

  const toggleSuspect = async (id: string) => {
    await safeFetch('/api/admin/toggle-suspect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uuid: id })
    });
    alert("Đã cập nhật trạng thái diện tình nghi!");
    setDropdownOpen(null);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredMembers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMembers.map(m => m.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
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
          <button 
            onClick={() => setShowDuplicateIps(!showDuplicateIps)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors border ${showDuplicateIps ? 'bg-rose-600 text-white border-rose-600' : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'}`}
          >
            <AlertTriangle size={16} />
            CHECK IP TRÙNG LẶP ({duplicateIps.length})
          </button>
          <button 
            onClick={handleSelectAll}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${selectedIds.length > 0 ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
          >
            <Users size={16} />
            {selectedIds.length === filteredMembers.length ? 'BỎ CHỌN TẤT CẢ' : 'CHỌN TẤT CẢ'}
          </button>
        </div>
      </div>

      {showDuplicateIps && (
        <div className="bg-rose-50 rounded-2xl border border-rose-100 p-6 animate-in slide-in-from-top-4 duration-300">
           <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-rose-800 flex items-center gap-2">
                 <ShieldAlert size={18} /> Cảnh báo trùng lặp IP mạng
              </h3>
              <button onClick={() => setShowDuplicateIps(false)} className="text-rose-400 hover:text-rose-600 font-bold">Đóng</button>
           </div>
           <div className="space-y-4">
              {duplicateIps.map((group, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-rose-200/50 shadow-sm">
                   <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                      <span className="font-mono text-sm font-bold text-rose-600">{group.ip}</span>
                      <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-bold">{group.users.length} tài khoản</span>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {group.users.map((user: any) => (
                        <div key={user.user_uuid} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                           <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                                {user.name.charAt(0)}
                             </div>
                             <div className="text-[11px]">
                                <div className="font-bold text-slate-800">{user.name}</div>
                                <div className="text-gray-500">{user.email}</div>
                             </div>
                           </div>
                           <button onClick={() => deleteIpRecord(group.ip, user.user_uuid)} className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors">
                              <Trash2 size={14} />
                           </button>
                        </div>
                      ))}
                   </div>
                </div>
              ))}
              {duplicateIps.length === 0 && <p className="text-center text-rose-400 text-sm py-4">Không phát hiện IP trùng lặp</p>}
           </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="p-2 rounded-tl-2xl w-10 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === filteredMembers.length && filteredMembers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500" 
                  />
                </th>
                <th className="p-2">Tên & Email</th>
                <th className="p-2 text-right">Số dư ví tất cả</th>
                <th className="p-2 text-right">Số dư ví hôm nay</th>
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
                <tr key={user.id} className={`hover:bg-gray-50/50 transition-colors group ${selectedIds.includes(user.id) ? 'bg-blue-50/30' : ''}`}>
                  <td className="p-2 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(user.id)}
                      onChange={() => toggleSelect(user.id)}
                      className="rounded border-gray-300 text-blue-500 focus:ring-blue-500" 
                    />
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
                        <button onClick={() => toggleAdmin(user.id, !user.is_admin)} className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-blue-50 flex items-center gap-3 text-blue-600">
                          <ShieldCheck size={16} />
                          {user.is_admin ? 'Gỡ quyền Admin' : 'Cấp quyền Admin'}
                        </button>
                        <button onClick={() => toggleBan(user.id, user.status === 'active' ? true : false)} className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 flex items-center gap-3 text-slate-700">
                          {user.status === 'active' ? <Ban size={16} className="text-gray-400" /> : <CheckCircle size={16} className="text-green-500" />}
                          {user.status === 'active' ? 'Khóa tài khoản' : 'Mở tài khoản'}
                        </button>
                        <button onClick={() => { setShowAdjModal(user.id); setDropdownOpen(null); }} className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 flex items-center gap-3 text-slate-700">
                          <DollarSign size={16} className="text-yellow-500" />
                          Cộng/Trừ tiền thủ công
                        </button>
                        <button onClick={() => toggleSuspect(user.id)} className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 flex items-center gap-3 text-slate-700">
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

      {/* Balance Adjustment Modal */}
      {showAdjModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
           <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 border border-gray-100 animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Cộng/Trừ số dư</h3>
              <div className="space-y-4">
                 <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setAdjType('add')}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${adjType === 'add' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}
                    >
                      Cộng tiền (+)
                    </button>
                    <button 
                      onClick={() => setAdjType('subtract')}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${adjType === 'subtract' ? 'bg-rose-500 text-white shadow-sm' : 'text-gray-500'}`}
                    >
                      Trừ tiền (-)
                    </button>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Số lượng VuiCoin</label>
                    <input 
                      type="number" 
                      value={adjAmount}
                      onChange={e => setAdjAmount(e.target.value)}
                      placeholder="Ví dụ: 10000" 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                    />
                 </div>
                 <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowAdjModal(null)} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors">Hủy</button>
                    <button onClick={handleAdjustBalance} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all">Xác nhận</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
