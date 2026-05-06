import React, { useState, useEffect } from 'react';
import { Gamepad2, Download, AlertCircle, Loader2, ShoppingCart, Check, Copy, X } from 'lucide-react';
import { AnimatedDiv, AnimatedText } from "@/components/ui/AnimatedText";
import { supabase } from '../lib/supabase';
import { useUser } from '../UserContext';
import { useNotification } from '../context/NotificationContext';

interface ModGame {
  id: string;
  name: string;
  price: number;
  link: string;
  image_url: string;
  created_at: string;
}

export function ModGamePage() {
  const { profile, refreshProfile } = useUser();
  const { showNotification } = useNotification();
  const [mods, setMods] = useState<ModGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [purchasedMod, setPurchasedMod] = useState<ModGame | null>(null);
  const [confirmingMod, setConfirmingMod] = useState<ModGame | null>(null);

  useEffect(() => {
    fetchMods();
  }, []);

  const fetchMods = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/public/mods');
      const data = await res.json();

      if (data.mods) {
        setMods(data.mods);
      } else {
        console.error('Error fetching mods:', data.error);
        setMods([]);
      }
    } catch (err) {
      console.error('Error in fetchMods:', err);
    } finally {
      setLoading(false);
    }
  };

  const confirmBuy = async (mod: ModGame) => {
    if (!profile || !profile.user_uuid) {
      showNotification({ title: 'Lỗi', message: 'Vui lòng đăng nhập để mua Mod', type: 'error' });
      return;
    }
    
    setConfirmingMod(null); // Close confirmation modal immediately

    try {
      setBuyingId(mod.id);
      const res = await fetch('/api/user/buy-mod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid: profile.user_uuid, modId: mod.id })
      });
      const data = await res.json();
      
      if (!res.ok) {
        showNotification({ title: 'Thất bại', message: data.error || 'Lỗi khi mua', type: 'error' });
        return;
      }
      
      showNotification({ title: 'Thành công', message: 'Mua Mod thành công!', type: 'success' });
      await refreshProfile();
      setPurchasedMod({ ...mod, link: data.link });
    } catch (e) {
      showNotification({ title: 'Thất bại', message: String(e), type: 'error' });
    } finally {
      setBuyingId(null);
    }
  };

  const copyLink = () => {
    if (purchasedMod) {
      navigator.clipboard.writeText(purchasedMod.link);
      showNotification({ title: 'Đã copy', message: 'Link mod đã được copy vào khay nhớ tạm', type: 'success' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-slate-800 mb-6">
        <Gamepad2 className="text-purple-500" size={28} />
        <h2 className="text-2xl font-bold uppercase tracking-tight">
          <AnimatedText delay={0.1}>Mod Game</AnimatedText>
        </h2>
      </div>

      <AnimatedDiv delay={0.2} className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center p-10 text-purple-600">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : mods.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mods.map(mod => (
                    <div key={mod.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:scale-105 transition-all duration-300 hover:shadow-xl hover:border-purple-200">
                      {mod.image_url ? (
                        <div className="aspect-video w-full bg-gray-100 overflow-hidden relative group">
                          <img 
                            src={mod.image_url} 
                            alt={mod.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                      ) : (
                        <div className="aspect-video w-full bg-purple-50 flex flex-col items-center justify-center text-purple-300">
                          <Gamepad2 size={48} className="mb-2 opacity-50" />
                          <span className="text-sm font-bold uppercase tracking-wider">No Image</span>
                        </div>
                      )}
                      <div className="p-5 flex flex-col flex-1">
                        <h4 className='font-black text-slate-900 text-lg mb-1 line-clamp-1' title={mod.name}>{mod.name}</h4>
                        
                        <div className="flex items-center justify-between mb-4 mt-auto pt-4">
                            <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                                {mod.price > 0 ? (
                                    <>
                                        <span>{mod.price.toLocaleString()}</span>
                                        <span className="text-xs uppercase">VNĐ</span>
                                    </>
                                ) : (
                                    <span className="uppercase text-green-600">Miễn phí</span>
                                )}
                            </div>
                        </div>
                        
                        <button 
                            disabled={buyingId === mod.id}
                            onClick={() => setConfirmingMod(mod)}
                            className='w-full bg-slate-900 text-white font-bold px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-purple-600 uppercase transition-colors shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            {buyingId === mod.id ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} strokeWidth={2.5}/> }
                            <span>{buyingId === mod.id ? 'Đang xử lý...' : 'Mua ngay'}</span>
                        </button>
                      </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center p-16 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                    <Gamepad2 size={40} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">Chưa có bản mod nào</h3>
                    <p className="text-gray-500">Các bản mod sẽ sớm được cập nhật thêm vào hệ thống.</p>
                </div>
            </div>
        )}
      </AnimatedDiv>

      {/* Purchase Success Modal */}
      {purchasedMod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col relative top-0 scale-in-center">
            
            <div className="bg-emerald-500 p-6 flex flex-col items-center justify-center text-white">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
                <Check size={40} className="text-white drop-shadow-md" />
              </div>
              <h3 className="text-2xl font-black uppercase text-center">{purchasedMod.name}</h3>
              <div className="mt-2 bg-black/20 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider backdrop-blur-sm">
                Trạng thái: Đã mua
              </div>
            </div>

            <div className="p-6 flex flex-col gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Link Mod Mới Nhất</label>
                <div className="flex bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                  <input 
                    type="text" 
                    value={purchasedMod.link} 
                    readOnly 
                    className="flex-1 bg-transparent px-4 py-3 text-sm font-medium text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={copyLink}
                  className="flex-1 bg-emerald-500 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 hover:bg-emerald-600 transition-colors uppercase active:scale-95"
                >
                  <Copy size={18} />
                  Copy Ngay
                </button>
                
                <button 
                  onClick={() => setPurchasedMod(null)}
                  className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl flex justify-center items-center hover:bg-slate-200 transition-colors uppercase active:scale-95"
                >
                  Đã biết
                </button>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmingMod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 flex flex-col relative top-0 scale-in-center">
            <h3 className="text-xl font-black text-center mb-2">Xác nhận mua Mod</h3>
            <p className="text-center text-gray-600 mb-6">
              Bạn có chắc chắn muốn mua Mod <span className="font-bold text-slate-900">{confirmingMod.name}</span> với giá <span className="font-bold text-purple-600">{confirmingMod.price > 0 ? confirmingMod.price.toLocaleString() + ' VNĐ' : 'Miễn phí'}</span> không?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmingMod(null)}
                className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors uppercase active:scale-95"
              >
                Hủy
              </button>
              <button 
                onClick={() => confirmBuy(confirmingMod)}
                className="flex-1 bg-purple-600 text-white font-bold py-3.5 rounded-xl hover:bg-purple-700 transition-colors uppercase active:scale-95"
              >
                {confirmingMod.price > 0 ? 'Xác nhận Mua' : 'Tải Miễn Phí'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
