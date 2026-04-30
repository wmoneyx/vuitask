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
  const [codeDays, setCodeDays] = useState('');
  const [codeType, setCodeType] = useState('vui_coin');

  const fetchSystem = async () => {
     const data = await safeFetch('/api/admin/system');
     if (data) {
        if (data.settings) {
           const val = data.settings.find((s: any) => s.key === 'maintenance_mode');
           if (val) setIsMaintenance(val.value === 'true');
        }
        if (data.mods) setMods(data.mods);
        if (data.codes) setCodes(data.codes);
     }
     setLoading(false);
  };

  useEffect(() => {
     fetchSystem();
  }, []);

  const handleMaintenanceToggle = async () => {
      const nextState = !isMaintenance;
      setIsMaintenance(nextState);
      await safeFetch('/api/admin/system', {
         method: 'POST',
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({ key: 'maintenance_mode', value: String(nextState) })
      });
  };

  const handleCreateMod = async () => {
      if (!modName || !modPrice || !modLink) return;
      await safeFetch('/api/admin/system/mods', {
         method: 'POST',
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({ name: modName, price: Number(modPrice), link: modLink, image_url: modUrl })
      });
      setModName(''); setModPrice(''); setModLink(''); setModUrl('');
      fetchSystem();
  };

  const handleDeleteMod = async (id: string) => {
    if (!window.confirm("Xóa bản Mod này?")) return;
    await safeFetch('/api/admin/system/mods/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    fetchSystem();
  };

  const handleCreateGiftcode = async () => {
    if (!codeName || !codeReward || !codeMaxUses) return;
    let expiry = null;
    if (codeDays) {
      const d = new Date();
      d.setDate(d.getDate() + Number(codeDays));
      expiry = d.toISOString();
    }
    
    await safeFetch('/api/admin/system/giftcodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        code: codeName.toUpperCase(), 
        reward: Number(codeReward), 
        max_uses: Number(codeMaxUses), 
        expiry_date: expiry,
        type: codeType 
      })
    });
    setCodeName(''); setCodeReward(''); setCodeMaxUses(''); setCodeDays('');
    fetchSystem();
  };

  const handleDeleteGiftcode = async (id: string) => {
    if (!window.confirm("Xóa mã Giftcode này?")) return;
    await safeFetch('/api/admin/system/giftcodes/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    fetchSystem();
  };

  return (
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
             <h3 className="text-lg font-bold text-slate-900">Quản lý Giftcode</h3>
             <p className="text-sm text-gray-500">Tạo mã quà tặng cho người chơi</p>
          </div>
        </div>
        
        <div className="space-y-4">
           <div className="grid grid-cols-3 gap-3">
             <div className="col-span-2">
               <input 
                 type="text" 
                 value={codeName}
                 onChange={e => setCodeName(e.target.value)}
                 placeholder="Mã Giftcode..." 
                 className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-bold uppercase" 
               />
             </div>
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
               <select 
                 value={codeType}
                 onChange={e => setCodeType(e.target.value)}
                 className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm font-medium"
               >
                  <option value="vui_coin">VuiCoin</option>
                  <option value="coin_task">Coin Task</option>
               </select>
             </div>
             <div className="col-span-3 pb-2 border-b border-gray-100 flex gap-2">
                <input 
                  type="number" 
                  value={codeDays}
                  onChange={e => setCodeDays(e.target.value)}
                  min="1" 
                  max="999" 
                  placeholder="Số ngày tồn tại (1-999)" 
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" 
                />
                <button onClick={handleCreateGiftcode} className="px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center justify-center shrink-0 transition-colors">
                  <Plus size={20} />
                </button>
             </div>
           </div>

           <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
              {codes.map(code => (
                <div key={code.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-purple-50/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                       <Trophy size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        {code.code}
                        <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-purple-100 text-purple-600">{code.current_uses}/{code.max_uses}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-1">
                        Thưởng: <span className="font-bold text-purple-600">{Number(code.reward).toLocaleString()}</span>
                        {code.expiry_date && <span> • Hết hạn: {new Date(code.expiry_date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteGiftcode(code.id)} className="text-gray-400 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                </div>
              ))}
              {codes.length === 0 && <div className="text-center p-4 text-gray-400 text-sm">Chưa có mã Giftcode nào</div>}
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
          <button className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold text-xs transition-colors flex items-center gap-2">
             <Trash2 size={14} /> XÓA TẤT CẢ
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
           <div className="p-3 border-b border-gray-100 text-xs font-bold text-slate-400 uppercase flex justify-between px-6">
              <span>Thành viên</span>
              <span>Hành động</span>
           </div>
           <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
              <div className="text-center p-4 text-gray-400 text-sm">Bảng xếp hạng trống</div>
           </div>
        </div>
      </div>

    </div>
  );
}
