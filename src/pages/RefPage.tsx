import React, { useMemo, useState, useEffect } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { AnimatedDiv, AnimatedText } from "@/components/ui/AnimatedText";
import { VuiCoin } from "@/components/ui/VuiCoin";

export function RefPage() {
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<any[]>([]);
  
  const uuid = localStorage.getItem('userUUID') || 'guest';
  const refCode = useMemo(() => uuid.split('-')[0] || '12345', [uuid]);
  
  const refLink = `${window.location.origin}?ref=${refCode}`;

  useEffect(() => {
    fetchRefs();
  }, [uuid]);

  const fetchRefs = async () => {
    try {
        const res = await fetch(`/api/user/referrals?uuid=${uuid}`);
        const data = await res.json();
        if (data.referrals) {
            setReferrals(data.referrals);
        }
    } catch(e) {}
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalReward = referrals.reduce((acc, r) => acc + (Number(r.reward) || 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
        <Share2 className="text-purple-600" size={24} />
        <AnimatedText>Giới thiệu (Ref)</AnimatedText>
      </h1>

      <AnimatedDiv delay={0.1} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 mb-4">
             <Share2 size={28} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Kiếm thêm hoa hồng</h2>
          <p className="text-gray-500 text-sm text-center flex items-center justify-center gap-1 flex-wrap">
            Bạn sẽ nhận được 0,5 <VuiCoin size={14} className="text-orange-500 fill-orange-50" /> khi bạn bè của bạn đạt số dư 1 <VuiCoin size={14} className="text-orange-500 fill-orange-50" />
          </p>
        </div>

        <div className="max-w-[1000px] mx-auto space-y-6">
          <div className="space-y-3">
             <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">
               LINK GIỚI THIỆU CỦA BẠN
             </label>
             <div className="flex items-center bg-gray-50 border border-gray-100 p-1.5 rounded-xl transition-all hover:border-gray-200">
               <input 
                 type="text" 
                 readOnly 
                 value={refLink} 
                 className="flex-1 bg-transparent px-4 py-2 text-slate-600 text-sm focus:outline-none w-full truncate font-mono"
               />
               <button 
                 onClick={handleCopy}
                 className="flex items-center justify-center gap-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all ml-2 shrink-0 h-[42px] min-w-[110px]"
               >
                 {copied ? <Check size={16} /> : <Copy size={16} />}
                 {copied ? 'COPIED' : 'COPY'}
               </button>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-2xl p-8 flex flex-col items-center justify-center border border-gray-100 hover:border-gray-200 transition-colors">
               <div className="text-[11px] font-bold text-slate-700 mb-3">Tổng Ref</div>
               <div className="text-3xl font-black text-slate-800">{referrals.length}</div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 flex flex-col items-center justify-center border border-gray-100 hover:border-gray-200 transition-colors">
               <div className="text-[11px] font-bold text-slate-700 mb-3 flex items-center gap-1">Đã nhận (<VuiCoin size={12} className="text-orange-500 fill-orange-50" />)</div>
               <div className="text-3xl font-black text-yellow-500 flex items-center gap-2">
                 {totalReward.toLocaleString()} <VuiCoin size={28} className="text-orange-500 fill-orange-50" />
               </div>
            </div>
          </div>
        </div>
      </AnimatedDiv>
    </div>
  );
}
