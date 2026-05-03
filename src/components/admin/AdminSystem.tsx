import React, { useState, useEffect } from 'react';
import { ToggleRight, ToggleLeft, ShieldAlert, Plus, Trash2, Gift, Link as LinkIcon, Trophy, Gamepad2 } from 'lucide-react';
import { safeFetch } from '@/lib/utils';

export function AdminSystem() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [mods, setMods] = useState<any[]>([]);
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mod inputs
  const [modName, setModName] = useState('');
  const [modPrice, setModPrice] = useState('');
  const [modLink, setModLink] = useState('');
  const [modUrl, setModUrl] = useState('');

  // Giftcode inputs
  const [codeName, setCodeName] = useState('');
  const [codeReward, setCodeReward] = useState('');
  const [codeMaxUses, setCodeMaxUses] = useState('');
  const [codeExpiry, setCodeExpiry] = useState('');
  const [codeBonus, setCodeBonus] = useState('');
  const [codeBonusExpiry, setCodeBonusExpiry] = useState('');
  const [codeType, setCodeType] = useState('vui_coin');

  const [ranks, setRanks] = useState<any[]>([]);

  const generateRandomCode = () => {
    const code = 'VUI' + Math.random().toString(36).substring(2, 7).toUpperCase();
    setCodeName(code);
  };

  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{action: string, payload: any} | null>(null);

  const fetchSystem = async () => {
     const data = await safeFetch('/api/admin/system');
     if (data) {
        if (data.settings) {
           const val = data.settings.find((s: any) => s.key === 'maintenance_mode');
           if (val) setIsMaintenance(val.value === 'true');
        }
        if (data.mods) setMods(data.mods);
        if (data.codes) setCodes(data.codes);
        if (data.leaderboard) setRanks(data.leaderboard);
     }
     setLoading(false);
  };


  useEffect(() => {
     fetchSystem();
  }, []);

  const executeAction = async () => {
    if (!confirmModal || isProcessing) return;
    setIsProcessing(true);
    const { action, payload } = confirmModal;

    try {
      if (action === 'deleteMod') {
        await safeFetch('/api/admin/system/mods/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: payload.id })
        });
        fetchSystem();
      } else if (action === 'deleteGiftcode') {
        await safeFetch('/api/admin/system/giftcodes/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: payload.id })
        });
        fetchSystem();
      } else if (action === 'clearRanks') {
        await safeFetch('/api/admin/leaderboard/clear', { method: 'POST' });
        fetchSystem();
      }
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra');
    } finally {
      setIsProcessing(false);
      setConfirmModal(null);
    }
  };

  const handleMaintenanceToggle = async () => {
      if (isProcessing) return;
      setIsProcessing(true);
      const nextState = !isMaintenance;
      setIsMaintenance(nextState);
      await safeFetch('/api/admin/system', {
         method: 'POST',
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({ key: 'maintenance_mode', value: String(nextState) })
      });
      setIsProcessing(false);
  };

  const handleCreateMod = async () => {
      if (!modName || !modPrice || !modLink || isProcessing) return;
      setIsProcessing(true);
      await safeFetch('/api/admin/system/mods', {
         method: 'POST',
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({ name: modName, price: Number(modPrice), link: modLink, image_url: modUrl })
      });
      setModName(''); setModPrice(''); setModLink(''); setModUrl('');
      fetchSystem();
      setIsProcessing(false);
  };

  const handleDeleteMod = (id: string) => {
    setConfirmModal({ action: 'deleteMod', payload: { id } });
  };

  const handleCreateGiftcode = async () => {
    if (!codeName || !codeReward || !codeMaxUses || isProcessing) return;
    setIsProcessing(true);
    let expiry = null;
    let bonusExpiry = null;
    if (codeExpiry) {
      expiry = new Date(codeExpiry).toISOString();
    }
    if (codeBonusExpiry) {
      bonusExpiry = new Date(codeBonusExpiry).toISOString();
    }
    
    await safeFetch('/api/admin/system/giftcodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        code: codeName.toUpperCase(), 
        reward: Number(codeReward), 
        max_uses: Number(codeMaxUses), 
        expiry_date: expiry,
        type: codeType,
        bonus_percent: Number(codeBonus || 0),
        bonus_expires_at: bonusExpiry
      })
    });
    setCodeName(''); setCodeReward(''); setCodeMaxUses(''); setCodeExpiry(''); setCodeBonus(''); setCodeBonusExpiry('');
    fetchSystem();
    setIsProcessing(false);
  };


  const handleDeleteGiftcode = (id: string) => {
    setConfirmModal({ action: 'deleteGiftcode', payload: { id } });
  };

  const handleClearRanks = () => {
    setConfirmModal({ action: 'clearRanks', payload: null });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* 1. Maintenance */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 col-span-1 md:col-span-2 lg:col-span-1">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
            <ShieldAlert size={24} />
          </div>
          <div>
             <h3 className="text-lg font-bold text-slate-900">Bảo trì hệ thống</h3>
             <p className="text-sm text-gray-500">Khóa trang web và hiển thị thông báo bảo trì</p>
          </div>
        </div>
        <div className="p-6 bg-slate-50 rounded-2xl border border-gray-200 flex items-center justify-between">
           <div className="font-bold text-slate-700">Trạng thái bảo trì</div>
           <button onClick={handleMaintenanceToggle} className={`text-5xl transition-colors ${isMaintenance ? 'text-rose-500' : 'text-gray-300'}`}>
              {isMaintenance ? <ToggleRight /> : <ToggleLeft />}
           </button>
        </div>
      </div>

      {/* 2. Tạo Giftcode */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 col-span-1 md:col-span-2 lg:col-span-1 border-t-4 border-t-purple-500">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center">
            <Gift size={24} />
          </div>
          <div>
             <h3 className="text-lg font-bold text-slate-900">Tạo Mã Giftcode</h3>
             <p className="text-sm text-gray-500">Tạo mã quà tặng tùy chỉnh hoặc ngẫu nhiên</p>
          </div>
        </div>
        
        <div className="space-y-4">
           <div className="flex gap-2">
              <input 
                 type="text" 
                 value={codeName}
                 onChange={e => setCodeName(e.target.value.toUpperCase())}
                 placeholder="NHẬP MÃ HOẶC TẠO NGẪU NHIÊN..." 
                 className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-bold" 
              />
              <button 
                onClick={generateRandomCode}
                className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-xs transition-colors"
                title="Tạo mã ngẫu nhiên"
              >
                NGẪU NHIÊN
              </button>
           </div>

           <div className="grid grid-cols-2 gap-3">
             <div className="col-span-1 text-xs font-bold text-slate-400 ml-1">SỐ LƯỢT DÙNG</div>
             <div className="col-span-1 text-xs font-bold text-slate-400 ml-1">PHẦN THƯỞNG</div>
             <div className="col-span-1">
               <input 
                 type="number" 
                 value={codeMaxUses}
                 onChange={e => setCodeMaxUses(e.target.value)}
                 placeholder="Số lượt" 
                 className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" 
               />
             </div>
             <div className="col-span-1">
               <input 
                 type="number" 
                 value={codeReward}
                 onChange={e => setCodeReward(e.target.value)}
                 placeholder="Phần thưởng" 
                 className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" 
               />
             </div>
             <div className="col-span-2">
               <div className="text-xs font-bold text-slate-400 ml-1 mb-1 uppercase text-center">Tăng % Thưởng Nhiệm Vụ (TASK)</div>
               <div className="flex gap-2">
                 <input 
                   type="number" 
                   value={codeBonus}
                   onChange={e => setCodeBonus(e.target.value)}
                   placeholder="VD: 5 cho 5% (Để 0 nếu không tăng)..." 
                   className="w-1/2 px-4 py-2 border border-blue-200 bg-blue-50/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-center font-bold text-blue-600" 
                 />
                 <input 
                   type="datetime-local" 
                   value={codeBonusExpiry}
                   onChange={e => setCodeBonusExpiry(e.target.value)}
                   title="Thời gian hết hạn của Tăng % Thưởng"
                   className="w-1/2 px-4 py-2 border border-blue-200 bg-blue-50/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-bold text-blue-600" 
                 />
               </div>
             </div>
             <div className="col-span-2">
               <select 
                 value={codeType}
                 onChange={e => setCodeType(e.target.value)}
                 className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm font-medium"
               >
                  <option value="vui_coin">VuiCoin Balance</option>
                  <option value="coin_task">Coin Task Balance</option>
               </select>
             </div>
             <div className="col-span-2 pb-2 border-b border-gray-100 flex gap-2">
                <input 
                  type="datetime-local" 
                  value={codeExpiry}
                  onChange={e => setCodeExpiry(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm" 
                />
                <button onClick={handleCreateGiftcode} className="px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center justify-center shrink-0 transition-colors gap-2">
                  <Plus size={20} /> TẠO MÃ
                </button>
             </div>
           </div>

            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mã đang hoạt động</div>
              {codes.map(code => (
                <div key={code.code} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-purple-50/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                       <Trophy size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        {code.code}
                        <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-purple-100 text-purple-600">{code.used_count}/{code.max_uses}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-1">
                        Thưởng: <span className="font-bold text-purple-600">{Number(code.reward_amount).toLocaleString()}</span>
                        {code.bonus_percent > 0 && <span className="text-blue-600 font-bold ml-1">+ {code.bonus_percent}% TASK</span>}
                        {code.expires_at && <span> • Hết hạn: {new Date(code.expires_at).toLocaleString('vi-VN')}</span>}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteGiftcode(code.code)} className="text-gray-400 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                </div>
              ))}
              {codes.length === 0 && <div className="text-center p-4 text-gray-400 text-sm italic">Chưa có mã Giftcode nào</div>}
            </div>
        </div>
      </div>

       {/* 3. Tạo Mod Game */}
       <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 col-span-1 md:col-span-2 lg:col-span-1 border-t-4 border-t-blue-500">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
            <Gamepad2 size={24} />
          </div>
          <div>
             <h3 className="text-lg font-bold text-slate-900">Quản lý Mod Game</h3>
             <p className="text-sm text-gray-500">Tạo danh sách các bản mod cho game</p>
          </div>
        </div>
        
        <div className="space-y-4">
           <div className="grid grid-cols-2 gap-3 pb-4 border-b border-gray-100">
             <input type="text" value={modName} onChange={e => setModName(e.target.value)} placeholder="Tên Mod..." className="col-span-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-blue-500" />
             <input type="number" value={modPrice} onChange={e => setModPrice(e.target.value)} placeholder="Giá bán (VNĐ)..." className="col-span-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-blue-500" />
             <input type="text" value={modLink} onChange={e => setModLink(e.target.value)} placeholder="Link Mod..." className="col-span-2 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-blue-500" />
             <input type="text" value={modUrl} onChange={e => setModUrl(e.target.value)} placeholder="URL Màn hình hiển thị ảnh..." className="col-span-2 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-blue-500" />
             <button onClick={handleCreateMod} className="col-span-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors mt-2">
                <Plus size={18} /> Lưu Mod Mới
             </button>
           </div>
           
           <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
              {mods.map(mod => (
                <div key={mod.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    {mod.image_url ? (
                      <img src={mod.image_url} alt={mod.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Gamepad2 size={20} className="text-blue-500" />
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{mod.name}</div>
                      <div className="font-mono text-xs text-blue-500">{Number(mod.price).toLocaleString()}đ</div>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteMod(mod.id)} className="text-gray-400 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                </div>
              ))}
              {mods.length === 0 && (
                <div className="text-center p-4 text-gray-400 text-sm">Chưa có Mod Game nào</div>
              )}
           </div>
        </div>
      </div>

      {/* 4. Leaderboard Settings */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 col-span-1 md:col-span-2 lg:col-span-1 border-t-4 border-t-yellow-400">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-50 text-yellow-500 flex items-center justify-center">
              <Trophy size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Bảng xếp hạng</h3>
              <p className="text-sm text-gray-500">Top 50 người dùng</p>
            </div>
          </div>
          <button onClick={handleClearRanks} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold text-xs transition-colors flex items-center gap-2">
             <Trash2 size={14} /> XÓA TẤT CẢ
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
           <div className="p-3 border-b border-gray-100 text-xs font-bold text-slate-400 uppercase flex justify-between px-6">
              <span>Thành viên</span>
              <span className="text-right">Điểm Tháng</span>
           </div>
           <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {ranks.length === 0 ? (
                <div className="text-center p-4 text-gray-400 text-sm">Bảng xếp hạng trống</div>
              ) : (
                ranks.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg">
                    <div className="flex justify-start items-center gap-2">
                       <span className="font-bold text-slate-400 w-5 text-center">{i + 1}</span>
                       <span className="font-bold text-sm text-slate-700">{r.user_name || r.user_email?.split('@')[0]}</span>
                    </div>
                    <span className="font-bold text-yellow-500 text-sm">{r.monthly_balance?.toLocaleString() || 0}</span>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>

    </div>

    {confirmModal && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl border border-gray-100">
          <h3 className="text-lg font-bold text-slate-900">Xác nhận Hành Động</h3>
          <p className="text-sm text-gray-500">
            {confirmModal.action === 'deleteMod' && 'Bạn có chắc chắn muốn XÓA bản Mod này?'}
            {confirmModal.action === 'deleteGiftcode' && 'Bạn có chắc chắn muốn XÓA mã Giftcode này?'}
            {confirmModal.action === 'clearRanks' && 'Khôi phục mọi điểm xếp hạng trong NGÀY, TUẦN, THÁNG về 0?'}
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button 
              onClick={() => setConfirmModal(null)}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-gray-500 font-bold hover:bg-gray-100 disabled:opacity-50"
            >
              Hủy
            </button>
            <button 
              onClick={executeAction}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-white font-bold disabled:opacity-50 flex items-center gap-2 bg-rose-500 hover:bg-rose-600"
            >
              {isProcessing ? 'Đang xử lý...' : 'Xác nhận xóa'}
            </button>
          </div>
        </div>
      </div>
    )}

    </>
  );
}
