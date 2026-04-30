import React, { useState, useEffect } from 'react';
import { Wallet, Banknote, CreditCard, Eye, AlertCircle } from 'lucide-react';
import { AnimatedDiv, AnimatedText } from "@/components/ui/AnimatedText";
import { VuiCoin } from "@/components/ui/VuiCoin";
import { useNotification } from '../context/NotificationContext';
import { useUser } from "@/UserContext";
import { safeFetch } from "@/lib/utils";

type WithdrawType = 'bank' | 'zalopay' | 'card_game';

const AMOUNT_OPTIONS = [10000, 15000, 30000, 50000, 100000, 200000, 500000, 1000000, 1500000];
const CARD_TYPES = ['VIETTEL', 'MOBI', 'VINA', 'GARENA'];

export function WalletPage() {
  const { showNotification } = useNotification();
  const { profile, refreshProfile } = useUser();
  const [balance, setBalance] = useState(0);
  const [selectedType, setSelectedType] = useState<WithdrawType | null>(null);
  const [amount, setAmount] = useState(15000);
  const [info, setInfo] = useState({ bankName: '', holderName: '', accountNumber: '', cardType: CARD_TYPES[0] });
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
        setBalance(profile.vui_coin_balance || 0);
        fetchWithdrawals();
    }
  }, [profile]);

  const fetchWithdrawals = async () => {
    if (!profile?.user_uuid) return;
    try {
       const data = await safeFetch(`/api/wallet/history?uuid=${profile.user_uuid}`);
       if (data && data.transactions) setHistory(data.transactions);
    } catch(e) {}
  };

  const handleConfirmWithdraw = async () => {
    if (!profile?.user_uuid) return;

    const minAmount = selectedType === 'card_game' ? 10000 : 15000;
    if (amount < minAmount) {
      showNotification({ title: 'Lỗi số tiền', message: `Số tiền rút phải từ ${minAmount.toLocaleString()} VuiCoin trở lên`, type: 'error' });
      return;
    }
    const fee = amount * 0.05;
    const totalDeduction = amount + fee;

    if (balance < totalDeduction) {
      showNotification({ title: 'Số dư không đủ', message: "Ví của bạn không đủ tiền (đã tính 5% phí).", type: 'error' });
      return;
    }

    setLoading(true);
    try {
        const details = JSON.stringify({ ...info });
        const res = await safeFetch('/api/wallet/withdraw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uuid: profile.user_uuid,
                amount: amount,
                method: selectedType,
                details
            })
        });

        if (res.error) {
            showNotification({ title: 'Thất bại', message: res.error, type: 'error' });
            return;
        }

        await refreshProfile();
        fetchWithdrawals();
        showNotification({ title: 'Đã nhận lệnh', message: "Yêu cầu rút tiền thành công! Admin sẽ duyệt trong 24h.", type: 'success' });
        setSelectedType(null);
    } catch (err) {
        showNotification({ title: 'Lỗi', message: "Lỗi kết nối", type: 'error' });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-slate-800 mb-6">
        <Wallet className="text-blue-500" size={28} />
        <h2 className="text-2xl font-bold uppercase tracking-tight">
          <AnimatedText delay={0.1}>Ví Tiền</AnimatedText>
        </h2>
      </div>

      <AnimatedDiv delay={0.2} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-center">
            <div className="text-gray-400 uppercase text-xs font-bold tracking-widest mb-2">Số dư hiện tại</div>
            <div className="text-4xl font-black text-emerald-400 flex items-center gap-2">
                {balance.toLocaleString()} <VuiCoin size={24} className="text-orange-500 fill-orange-50" />
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button onClick={() => setSelectedType('bank')} className="bg-white border-2 border-gray-100 hover:border-blue-500 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all">
                <Banknote className="text-blue-500" />
                <span className="font-bold text-sm uppercase">Bank</span>
            </button>
            <button onClick={() => setSelectedType('zalopay')} className="bg-white border-2 border-gray-100 hover:border-blue-500 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all">
                <Banknote className="text-sky-500" />
                <span className="font-bold text-sm uppercase">ZaloPay</span>
            </button>
            <button onClick={() => setSelectedType('card_game')} className="bg-white border-2 border-gray-100 hover:border-blue-500 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all">
                <CreditCard className="text-rose-500" />
                <span className="font-bold text-sm uppercase">Thẻ Cào</span>
            </button>
        </div>
      </AnimatedDiv>

      {selectedType && (
        <AnimatedDiv delay={0.1} className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
            <h3 className="font-bold text-lg mb-4 uppercase">Rút {selectedType === 'card_game' ? 'Thẻ Cào/Game' : selectedType.toUpperCase()}</h3>
            <div className="space-y-4">
                {selectedType === 'bank' && (
                    <>
                        <input onChange={e => setInfo({...info, bankName: e.target.value})} placeholder="Tên ngân hàng" className="w-full bg-gray-50 rounded-xl p-3" />
                        <input onChange={e => setInfo({...info, holderName: e.target.value})} placeholder="Tên chủ tài khoản" className="w-full bg-gray-50 rounded-xl p-3" />
                        <input onChange={e => setInfo({...info, accountNumber: e.target.value})} placeholder="Số tài khoản" className="w-full bg-gray-50 rounded-xl p-3" />
                    </>
                )}
                {selectedType === 'zalopay' && (
                    <>
                        <input onChange={e => setInfo({...info, holderName: e.target.value})} placeholder="Họ và Tên" className="w-full bg-gray-50 rounded-xl p-3" />
                        <input onChange={e => setInfo({...info, accountNumber: e.target.value})} placeholder="Số Điện Thoại" className="w-full bg-gray-50 rounded-xl p-3" />
                    </>
                )}
                {selectedType === 'card_game' && (
                    <select onChange={e => setInfo({...info, cardType: e.target.value})} className="w-full bg-gray-50 rounded-xl p-3">
                        {CARD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                )}

                <div className='text-xs font-bold text-gray-500'>Chọn số tiền (Phí rút 5%):</div>
                <div className="grid grid-cols-4 gap-2">
                    {AMOUNT_OPTIONS.map(a => (
                        <button key={a} onClick={() => setAmount(a)} className={`p-2 rounded-lg text-xs font-bold ${amount === a ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                            {a.toLocaleString()}
                        </button>
                    ))}
                </div>
                <div className="mt-2">
                    <input 
                        type="number" 
                        value={amount} 
                        onChange={(e) => setAmount(Number(e.target.value) || 0)} 
                        placeholder="Hoặc nhập số tiền khác" 
                        className="w-full bg-gray-50 rounded-xl p-3 font-bold text-slate-800"
                    />
                </div>
                
                <div className='p-3 bg-orange-50 text-orange-700 rounded-xl text-xs font-bold flex flex-col gap-1'>
                    <AlertCircle size={14}/> Phí rút 5% : {(amount * 0.05).toLocaleString()} VuiCoin. Bạn sẽ nhận được: {(amount * 0.95).toLocaleString()} VuiCoin
                </div>

                <button onClick={handleConfirmWithdraw} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl uppercase">Xác nhận rút</button>
                <button onClick={() => setSelectedType(null)} className="text-gray-400 text-sm w-full text-center hover:text-gray-600">Đóng</button>
            </div>
        </AnimatedDiv>
      )}

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-slate-800 mb-4 uppercase text-sm">Lịch sử rút thưởng</h3>
        {history.length === 0 ? (
            <p className="text-gray-400 italic text-sm">Chưa có giao dịch nào</p>
        ) : (
            <div className="space-y-3">
                {history.map((h, i) => {
                    const method = h.content?.includes('card_game') ? 'card_game' : (h.content?.includes('zalopay') ? 'zalopay' : 'bank');
                    return (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className='flex items-center gap-3'>
                            <div className='p-2 bg-white rounded-lg'>{method === 'card_game' ? <CreditCard size={18}/> : <Banknote size={18}/>}</div>
                            <div>
                                <div className='font-bold text-sm uppercase'>{method}</div>
                                <div className='text-xs text-emerald-500 font-bold'>+{h.amount?.toLocaleString()} VuiCoin</div>
                            </div>
                        </div>
                        {method === 'card_game' && <button className='flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg text-xs font-bold'><Eye size={12}/> Xem thưởng</button>}
                    </div>
                )})}
            </div>
        )}
      </div>
    </div>
  );
}

