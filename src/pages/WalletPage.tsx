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
  const [showCardModal, setShowCardModal] = useState<any | null>(null);

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
    
    if (selectedType === 'bank' && (!info.bankName || !info.holderName || !info.accountNumber)) {
        showNotification({ title: 'Lỗi thông tin', message: `Vui lòng nhập đầy đủ thông tin ngân hàng`, type: 'error' });
        return;
    }
    if (selectedType === 'zalopay' && (!info.holderName || !info.accountNumber)) {
        showNotification({ title: 'Lỗi thông tin', message: `Vui lòng nhập đầy đủ thông tin ZaloPay`, type: 'error' });
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

  const hasPendingWithdraw = history.some(h => h.status === 'Chờ duyệt' || (!['Đã thanh toán', 'Từ chối', 'Đã hủy'].includes(h.status)));

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

        <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button 
                    disabled={hasPendingWithdraw}
                    onClick={() => { setSelectedType('bank'); setInfo({}); }} 
                    className={`bg-white border-2 border-gray-100 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${hasPendingWithdraw ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-blue-500'}`}
                >
                    <Banknote className="text-blue-500" />
                    <span className="font-bold text-sm uppercase">Bank</span>
                </button>
                <button 
                    disabled={hasPendingWithdraw}
                    onClick={() => { setSelectedType('zalopay'); setInfo({}); }} 
                    className={`bg-white border-2 border-gray-100 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${hasPendingWithdraw ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-blue-500'}`}
                >
                    <Banknote className="text-sky-500" />
                    <span className="font-bold text-sm uppercase">ZaloPay</span>
                </button>
                <button 
                    disabled={hasPendingWithdraw}
                    onClick={() => { setSelectedType('card_game'); setInfo({ cardType: CARD_TYPES[0] }); }} 
                    className={`bg-white border-2 border-gray-100 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${hasPendingWithdraw ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-blue-500'}`}
                >
                    <CreditCard className="text-rose-500" />
                    <span className="font-bold text-sm uppercase">Thẻ Cào</span>
                </button>
            </div>
            {hasPendingWithdraw && (
                <div className="text-[10px] text-rose-500 font-bold bg-rose-50 p-2 rounded-lg border border-rose-100 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Hệ thống đang xử lý lệnh rút cũ. Vui lòng đợi hoặc hủy lệnh cũ để rút tiếp.
                </div>
            )}
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
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 uppercase text-sm">Lịch sử rút thưởng</h3>
            {history.length > 0 && (
                <button 
                    onClick={async () => {
                        if (!window.confirm("Xóa tất cả lịch sử rút thưởng của bạn?")) return;
                        await safeFetch('/api/user/wallet/clear', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ uuid: profile?.user_uuid })
                        });
                        fetchWithdrawals();
                    }}
                    className="text-xs font-bold text-rose-500 uppercase hover:underline"
                >
                    Xóa tất cả
                </button>
            )}
        </div>
        {history.length === 0 ? (
            <p className="text-gray-400 italic text-sm">Chưa có giao dịch nào</p>
        ) : (
            <div className="space-y-4">
                {history.map((h, i) => {
                    const contentLower = h.content?.toLowerCase() || '';
                    const isCard = contentLower.includes('card_game') || contentLower.includes('the_cao') || contentLower.includes('thẻ cào');
                    const isZalo = contentLower.includes('zalopay');
                    const method = isCard ? 'Thẻ Cào' : (isZalo ? 'ZaloPay' : 'Bank');
                    const getStatusInfo = (status: string) => {
                        if (status === 'Đã thanh toán') return { label: 'Hoàn thành', colors: 'bg-green-100 text-green-700' };
                        if (status === 'Từ chối') return { label: 'Từ chối', colors: 'bg-rose-100 text-rose-700' };
                        if (status === 'Đã hủy') return { label: 'Đã hủy', colors: 'bg-gray-100 text-gray-700' };
                        return { label: 'Chờ duyệt', colors: 'bg-orange-100 text-orange-700' };
                    };
                    const statusInfo = getStatusInfo(h.status);
                    const amount = h.amount || 0;
                    const fee = amount * 0.05;
                    const netAmount = amount - fee;
                    const methodIcon = isCard ? <CreditCard size={18}/> : <Banknote size={18}/>;
                    
                    return (
                        <div key={i} className="flex flex-col gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className='flex items-center gap-3'>
                                    <div className='p-2 bg-white rounded-lg shadow-sm text-blue-500'>
                                        {methodIcon}
                                    </div>
                                    <div>
                                        <div className='font-bold text-sm uppercase text-slate-800'>{method}</div>
                                        <div className="text-xs text-slate-500">{new Date(h.timestamp).toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className={`text-xs font-bold px-3 py-1 rounded-full ${statusInfo.colors}`}>
                                    {statusInfo.label}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                                <div className="bg-white p-2 rounded-lg border border-slate-100">
                                    <div className="text-[10px] text-gray-400 font-bold uppercase">Số rút</div>
                                    <div className="font-bold text-slate-700">{amount.toLocaleString()}đ</div>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-100">
                                    <div className="text-[10px] text-gray-400 font-bold uppercase">Thực nhận</div>
                                    <div className="font-bold text-emerald-600">{netAmount.toLocaleString()}đ</div>
                                </div>
                            </div>
                            
                            {statusInfo.label === 'Chờ duyệt' && (
                                <button 
                                    onClick={async () => {
                                        if (!window.confirm("Bạn muốn hủy lệnh rút tiền này? Tiền sẽ được hoàn lại.")) return;
                                        await safeFetch('/api/wallet/cancel', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ uuid: profile?.user_uuid, id: h.id })
                                        });
                                        fetchWithdrawals();
                                        refreshProfile();
                                    }}
                                    className='mt-2 flex items-center justify-center gap-2 bg-rose-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-rose-600 transition'
                                >
                                    Hủy lệnh rút tiền
                                </button>
                            )}

                            {isCard && statusInfo.label === 'Hoàn thành' && h.admin_reply && (
                                <button 
                                    onClick={() => setShowCardModal(h.admin_reply)} 
                                    className='mt-2 flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition'
                                >
                                    <Eye size={14}/> Xem chi tiết thẻ
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <AnimatedDiv className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4">
                <h3 className="text-xl font-black text-slate-800 text-center">Thông tin thẻ cào</h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2 text-sm text-slate-700 whitespace-pre-wrap break-all">
                   {showCardModal.content}
                </div>
                <button onClick={() => setShowCardModal(null)} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl uppercase hover:bg-slate-800">
                    Đóng
                </button>
            </AnimatedDiv>
        </div>
      )}
    </div>
  );
}

