import React, { useState, useEffect } from 'react';
import { ToggleRight, ToggleLeft, ShieldAlert, Plus, Trash2, Gift, Link as LinkIcon, Trophy, Gamepad2, Settings, LayoutGrid, Activity } from 'lucide-react';
import { safeFetch } from '@/lib/utils';
import { ConfirmModal } from './ConfirmModal';
import { useNotification } from '../../context/NotificationContext';

export function AdminSystem() {
  const { showNotification } = useNotification();
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
  const [codeBonus, setCodeBonus] = useState('');
  const [codeBonusHours, setCodeBonusHours] = useState('');
  const [codeType, setCodeType] = useState('vui_coin');

  const [ranks, setRanks] = useState<any[]>([]);
  const [adsConfig, setAdsConfig] = useState<any>({
    global: true,
    pages: {
      "TaskPage": { script: true, banner: true, direct: true },
      "TaskPrePage": { script: true, banner: true, direct: true },
      "TaskVipPage": { script: true, banner: true, direct: true },
      "VerifyStandard": { script: true, banner: true, direct: true },
      "VerifyPre": { script: true, banner: true, direct: true },
      "VerifyPro": { script: true, banner: true, direct: true },
    }
  });
  const [confirmState, setConfirmState] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({ isOpen: false, message: '', onConfirm: () => {} });

  const generateRandomCode = () => {
    const code = 'VUI' + Math.random().toString(36).substring(2, 7).toUpperCase();
    setCodeName(code);
  };

  const fetchSystem = async () => {
     const data = await safeFetch('/api/admin/system');
     if (data) {
        if (data.settings) {
           const maintenance = data.settings.find((s: any) => s.key === 'maintenance_mode');
           if (maintenance) setIsMaintenance(maintenance.value === 'true');
           
           const ads = data.settings.find((s: any) => s.key === 'ads_config');
           if (ads) {
              try {
                setAdsConfig(JSON.parse(ads.value));
              } catch(e) {
                console.error("Ad config parse error", e);
              }
           }
        }
        if (data.mods) setMods(data.mods);
        if (data.codes) setCodes(data.codes);
        if (data.leaderboard) setRanks(data.leaderboard);
     }
     setLoading(false);
  };

  const handleUpdateAds = async (newConfig: any) => {
    setAdsConfig(newConfig);
    await safeFetch('/api/admin/system', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ key: 'ads_config', value: JSON.stringify(newConfig) })
    });
  };

  const togglePageAd = (pageKey: string, adType: 'script' | 'banner' | 'direct') => {
    const newConfig = { ...adsConfig };
    newConfig.pages[pageKey][adType] = !newConfig.pages[pageKey][adType];
    handleUpdateAds(newConfig);
  };

  const toggleGlobalAds = () => {
    const newConfig = { ...adsConfig, global: !adsConfig.global };
    handleUpdateAds(newConfig);
  };


  useEffect(() => {
     fetchSystem();
  }, []);

  const handleMaintenanceToggle = () => {
    const nextState = !isMaintenance;
    setConfirmState({
       isOpen: true,
       message: nextState ? 'Bạn có chắc chắn muốn BẬT CHẾ ĐỘ BẢO TRÌ? (Người dùng sẽ không thể truy cập web)' : 'Bạn có chắc chắn muốn TẮT CHẾ ĐỘ BẢO TRÌ?',
       onConfirm: async () => {
         setConfirmState({ ...confirmState, isOpen: false });
         setIsMaintenance(nextState);
         await safeFetch('/api/admin/system', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ key: 'maintenance_mode', value: String(nextState) })
         });
       }
    });
  };

  const handleCreateMod = () => {
      if (!modName || !modPrice || !modLink) return;
      setConfirmState({
         isOpen: true,
         message: 'Bạn có chắc chắn muốn tạo Mod/Tool này?',
         onConfirm: async () => {
           setConfirmState({ ...confirmState, isOpen: false });
           await safeFetch('/api/admin/system/mods', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ name: modName, price: Number(modPrice), link: modLink, image_url: modUrl })
           });
           setModName(''); setModPrice(''); setModLink(''); setModUrl('');
           fetchSystem();
         }
      });
  };

  const handleDeleteMod = (id: string) => {
    setConfirmState({
       isOpen: true,
       message: 'Bạn có chắc chắn muốn xóa bản Mod này?',
       onConfirm: async () => {
         setConfirmState({ ...confirmState, isOpen: false });
         await safeFetch('/api/admin/system/mods/delete', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ id })
         });
         fetchSystem();
       }
    });
  };

  const handleCreateGiftcode = () => {
    if (!codeName || !codeReward || !codeMaxUses) return;
    setConfirmState({
       isOpen: true,
       message: 'Bạn có chắc chắn muốn tạo mã Giftcode này?',
       onConfirm: async () => {
         setConfirmState({ ...confirmState, isOpen: false });
         let expiry = null;
         if (codeDays) {
           const d = new Date();
           d.setDate(d.getDate() + Number(codeDays));
           expiry = d.toISOString();
         }
         
         const data = await safeFetch('/api/admin/system/giftcodes', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ 
             code: codeName.toUpperCase().trim(), 
             reward: Number(codeReward), 
             max_uses: Number(codeMaxUses), 
             expiry_date: expiry,
             type: codeType,
             bonus_percent: Number(codeBonus || 0),
             bonus_hours: Number(codeBonusHours || 0)
           })
         });

         if (data?.error) {
           showNotification({ title: 'Thất bại', message: data.error, type: 'error' });
         } else if (data?.success) {
           showNotification({ title: 'Thành công', message: 'Đã tạo mã Giftcode mới', type: 'success' });
           setCodeName(''); setCodeReward(''); setCodeMaxUses(''); setCodeDays(''); setCodeBonus(''); setCodeBonusHours('');
           fetchSystem();
         } else {
            showNotification({ title: 'Thất bại', message: 'Lỗi không xác định', type: 'error' });
         }
       }
    });
  };


  const handleDeleteGiftcode = (id: string) => {
    setConfirmState({
       isOpen: true,
       message: 'Xóa mã Giftcode này?',
       onConfirm: async () => {
         setConfirmState({ ...confirmState, isOpen: false });
         const data = await safeFetch('/api/admin/system/giftcodes/delete', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ id })
         });
         if (data?.error) {
           showNotification({ title: 'Thất bại', message: data.error, type: 'error' });
         } else {
           showNotification({ title: 'Thành công', message: 'Đã xóa Giftcode', type: 'success' });
           fetchSystem();
         }
       }
    });
  };

  const handleClearRanks = () => {
    setConfirmState({
       isOpen: true,
       message: 'Bạn có chắc chắn muốn XÓA TOÀN BỘ dữ liệu xếp hạng ? (Tất cả điểm số trong ngày, tuần, tháng sẽ bị reset về 0)',
       onConfirm: async () => {
         setConfirmState({ ...confirmState, isOpen: false });
         await safeFetch('/api/admin/leaderboard/clear', { method: 'POST' });
         fetchSystem();
       }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ConfirmModal 
        isOpen={confirmState.isOpen} 
        message={confirmState.message} 
        onConfirm={confirmState.onConfirm} 
        onCancel={() => setConfirmState({ ...confirmState, isOpen: false })} 
      />
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
             <div className="col-span-1">
               <div className="text-xs font-bold text-slate-400 ml-1 mb-1 uppercase text-center">% Thưởng Task</div>
               <input 
                 type="number" 
                 value={codeBonus}
                 onChange={e => setCodeBonus(e.target.value)}
                 placeholder="0 %" 
                 className="w-full px-4 py-2 border border-blue-200 bg-blue-50/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-center font-bold text-blue-600" 
               />
             </div>
             <div className="col-span-1">
               <div className="text-xs font-bold text-slate-400 ml-1 mb-1 uppercase text-center">Giờ duy trì</div>
               <input 
                 type="number" 
                 value={codeBonusHours}
                 onChange={e => setCodeBonusHours(e.target.value)}
                 placeholder="0 h" 
                 className="w-full px-4 py-2 border border-blue-200 bg-blue-50/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-center font-bold text-blue-600" 
               />
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
                  type="number" 
                  value={codeDays}
                  onChange={e => setCodeDays(e.target.value)}
                  min="1" 
                  max="999" 
                  placeholder="Hạn dùng (số ngày)..." 
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" 
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
                        {code.bonus_percent > 0 && <span className="text-blue-600 font-bold ml-1">+ {code.bonus_percent}% TASK {code.bonus_hours > 0 ? `(${code.bonus_hours}h)` : ''}</span>}
                        {code.expires_at && <span> • Hết hạn: {new Date(code.expires_at).toLocaleDateString()}</span>}
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

      {/* 5. Ad Management */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 col-span-1 md:col-span-2 lg:col-span-2 border-t-4 border-t-emerald-500">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <LinkIcon size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Cấu hình Quảng Cáo</h3>
              <p className="text-sm text-gray-500">Bật/tắt quảng cáo linh hoạt từng trang</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
             <span className={`text-xs font-black uppercase tracking-widest ${adsConfig.global ? 'text-emerald-500' : 'text-slate-400'}`}>Tất cả ADS</span>
             <button onClick={toggleGlobalAds} className={`text-5xl transition-colors ${adsConfig.global ? 'text-emerald-500' : 'text-gray-300'}`}>
                {adsConfig.global ? <ToggleRight /> : <ToggleLeft />}
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {Object.entries(adsConfig.pages).map(([pageKey, config]: [string, any]) => (
            <div key={pageKey} className="space-y-4 p-5 rounded-2xl bg-slate-50/50 border border-slate-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                 <Settings size={48} />
               </div>
               <h4 className="font-black text-slate-700 uppercase tracking-tighter text-sm border-b border-slate-200 pb-2 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-400" />
                 {pageKey === 'TaskPage' ? 'Trang Nhiệm Vụ' : 
                  pageKey === 'TaskPrePage' ? 'Trang Pre Mission' :
                  pageKey === 'TaskVipPage' ? 'Trang VIP Mission' :
                  pageKey === 'VerifyStandard' ? 'Verify Nhiệm Vụ Thường' :
                  pageKey === 'VerifyPre' ? 'Verify Nhiệm Vụ Pre' :
                  pageKey === 'VerifyPro' ? 'Verify Nhiệm Vụ Pro' : pageKey}
               </h4>
               
               <div className="grid grid-cols-3 gap-3">
                 <button 
                  onClick={() => togglePageAd(pageKey, 'banner')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${config.banner ? 'bg-white border-emerald-200 text-emerald-600 shadow-sm' : 'bg-transparent border-slate-200 text-slate-400 opacity-50'}`}
                 >
                   <LayoutGrid size={18} />
                   <span className="text-[10px] font-black uppercase">Banner</span>
                 </button>
                 <button 
                  onClick={() => togglePageAd(pageKey, 'script')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${config.script ? 'bg-white border-emerald-200 text-emerald-600 shadow-sm' : 'bg-transparent border-slate-200 text-slate-400 opacity-50'}`}
                 >
                   <Activity size={18} />
                   <span className="text-[10px] font-black uppercase">Scripts</span>
                 </button>
                 <button 
                  onClick={() => togglePageAd(pageKey, 'direct')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${config.direct ? 'bg-white border-emerald-200 text-emerald-600 shadow-sm' : 'bg-transparent border-slate-200 text-slate-400 opacity-50'}`}
                 >
                   <LinkIcon size={18} />
                   <span className="text-[10px] font-black uppercase">Direct</span>
                 </button>
               </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
