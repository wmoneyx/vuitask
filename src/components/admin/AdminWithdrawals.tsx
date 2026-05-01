import React, { useState, useEffect } from 'react';
import { CreditCard, Copy, CheckCircle, XCircle, Gamepad2, Send, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { safeFetch } from '@/lib/utils';

// 1. XỬ LÝ NGÂN HÀNG (BANK) - TẠO QR & DATA THANH TOÁN
export const processBankLogic = (order: any) => {
  const details = order.details ? JSON.parse(order.details) : {};
  const note = `${order.id} VUITASK KIẾM TIỀN ONLINE UTS1`;
  
  // URL chuẩn VietQR
  const qrUrl = `https://img.vietqr.io/image/${details.bankName}-${details.accountNumber}-compact2.jpg?amount=${order.actualAmount}&addInfo=${encodeURIComponent(note)}&accountName=${encodeURIComponent(details.holderName || '')}`;

  return {
    qrUrl,
    transferData: {
      accountNumber: details.accountNumber,
      accountName: details.holderName,
      bankCode: details.bankName?.toUpperCase(),
      amount: order.actualAmount,
      content: note
    }
  };
};

// 2. XỬ LÝ ZALOPAY - TRÍCH XUẤT DỮ LIỆU CHUYỂN TIỀN
export const processZaloPayLogic = (order: any) => {
  const details = order.details ? JSON.parse(order.details) : {};
  const note = `${order.id} VUITASK KIẾM TIỀN ONLINE UTS1`;

  return {
    recipientPhone: details.accountNumber || details.phone,
    recipientName: details.holderName,
    amount: order.actualAmount,
    message: note
  };
};

// 3. XỬ LÝ THẺ CÀO (THE_CAO) - GỬI DỮ LIỆU THẺ
export const processCardLogic = async (order: any, serial: string, code: string, onUpdateStatus: any) => {
  if (!serial || !code) throw new Error("Vui lòng nhập đầy đủ Seri và Mã thẻ");

  const details = order.details ? JSON.parse(order.details) : {};
  
  const payload = {
    orderId: order.id,
    network: details.cardType,
    serial: serial.trim(),
    pin: code.trim(),
    timestamp: new Date().toISOString()
  };

  return await onUpdateStatus(order.id, 'SUCCESS', { cardResult: payload });
};

// HELPER: SAO CHÉP VÀO BỘ NHỚ TẠM
export const copyToClipboard = (text: string) => {
  if (!text) return;
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Lỗi sao chép:', err);
  }
  document.body.removeChild(textArea);
};

// HÀM CẬP NHẬT TRẠNG THÁI (DUYỆT/HỦY)
export const handleUpdateStatus = async (orderId: string, status: string, endpoint: string) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      orderId, 
      status,
      updatedAt: new Date().toISOString()
    })
  });
  return await response.json();
};

export function AdminWithdrawals() {
  const { showNotification } = useNotification();
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'history'>('pending');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [showInfoModal, setShowInfoModal] = useState<any>(null);
  const [cardDetails, setCardDetails] = useState({ serial: '', code: '' });
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchWithdrawals();
    const interval = setInterval(fetchWithdrawals, 10000); // Poll every 10s instead of 3s
    return () => clearInterval(interval);
  }, []);

  const fetchWithdrawals = async () => {
    const data = await safeFetch('/api/admin/withdrawals');
    if (data && data.withdrawals) setWithdrawals(data.withdrawals);
  };

  const pending = withdrawals.filter(w => w.status === 'Đang chờ duyệt');
  const history = withdrawals.filter(w => w.status !== 'Đang chờ duyệt');

  const displayedList = activeSubTab === 'pending' ? pending : history;

  const handleApprove = async (id: string, amount: number, cardData?: {serial: string, code: string}) => {
    setProcessingId(id);
    try {
        const actualAmount = amount * 0.95;
        let confirmMessage = `Số tiền thực nhận ${actualAmount.toLocaleString()}đ đã được thanh toán thành công!`;
        if (cardData) {
            confirmMessage += `\nThẻ: ${cardData.code} | Seri: ${cardData.serial}`;
        }
        const data = await safeFetch('/api/community/admin-reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ withdrawalId: id, content: confirmMessage, cardData })
        });
        if (data) {
            fetchWithdrawals();
            showNotification({ title: 'Thành công', message: "Đã duyệt và thông báo lên cộng đồng!", type: 'success' });
        }
    } finally {
        setProcessingId(null);
    }
  };

  const handleReject = async (id: string, amount: number) => {
    if (!window.confirm(`Bạn có chắc chắn muốn từ chối và hoàn lại ${amount.toLocaleString()}đ cho người dùng?`)) return;
    setProcessingId(id);
    try {
        const data = await safeFetch('/api/admin/reject-withdrawal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ withdrawalId: id })
        });
        if (data && data.success) {
            fetchWithdrawals();
            showNotification({ title: 'Đã từ chối', message: "Đã từ chối và hoàn tiền kèm phí 5%!", type: 'info' });
        }
    } finally {
        setProcessingId(null);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa TẤT CẢ lịch sử duyệt rút tiền? Hành động này không thể hoàn tác.')) return;
    const data = await safeFetch('/api/admin/clear-withdrawals-history', { method: 'POST' });
    if (data) {
        fetchWithdrawals();
        showNotification({ title: 'Thành công', message: 'Đã xóa lịch sử duyệt rút tiền.', type: 'success' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveSubTab('pending')}
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${activeSubTab === 'pending' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Chờ duyệt ({pending.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('history')}
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${activeSubTab === 'history' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Lịch sử duyệt ({history.length})
          </button>
        </div>
        
        {activeSubTab === 'history' && history.length > 0 && (
          <button 
            onClick={handleClearHistory}
            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold text-sm transition-colors"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedList.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col relative overflow-hidden">
             {/* Type Badge */}
             <div className="absolute top-0 right-0">
               <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase">RÚT TIỀN</span>
             </div>

             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center shrink-0">
                  {item.user?.avatar ? <img src={item.user.avatar} alt="avatar" className="w-full h-full object-cover" /> : <CreditCard className="text-slate-600" size={20} />}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-lg">{(item.amount * 0.95).toLocaleString()}đ <span className="text-xs text-gray-400 font-normal line-through">({item.amount?.toLocaleString()}đ)</span></div>
                  <div className="text-xs text-gray-500">{item.user?.name}</div>
                </div>
             </div>

             <div className="flex-1 space-y-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Trạng thái:</span> <span className={`font-bold ${item.status === 'Đã thanh toán' ? 'text-emerald-500' : 'text-orange-500'}`}>{item.status}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">TG:</span> <span className="font-mono text-xs">{new Date(item.timestamp).toLocaleString()}</span></div>
             </div>

             {activeSubTab === 'pending' && (
               <div className="flex gap-2 mt-auto">
                 <button onClick={() => setShowInfoModal(item)} className="flex-1 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold flex items-center justify-center gap-1 transition-colors text-xs">
                   <Gamepad2 size={14} /> Xem
                 </button>
                 <button disabled={!!processingId} onClick={() => handleApprove(item.id, item.amount)} className={`flex-1 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 transition-colors text-xs ${!!processingId ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                   <CheckCircle size={14} /> Duyệt
                 </button>
                 <button disabled={!!processingId} onClick={() => handleReject(item.id, item.amount)} className={`flex-1 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 transition-colors text-xs ${!!processingId ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}>
                   <XCircle size={14} /> Từ chối
                 </button>
               </div>
             )}
          </div>
        ))}
        {displayedList.length === 0 && (
          <div className="col-span-full p-8 text-center text-gray-400 font-medium">
            Không có dữ liệu
          </div>
        )}
      </div>
      
      {showInfoModal && (() => {
         const match = showInfoModal.content?.match(/Yêu cầu rút tiền qua (BANK|ZALOPAY|THE_CAO|CARD_GAME|MOMO|VNPAY)\.\s*Chi tiết:\s*(.*)/i);
         let method = 'Khác';
         let detailsStr = '{}';
         if (match) {
             method = match[1].toUpperCase();
             if (method === 'CARD_GAME') method = 'THE_CAO';
             detailsStr = match[2];
         } else if (showInfoModal.content) {
             const lowerContent = showInfoModal.content.toLowerCase();
             if (lowerContent.includes('zalopay')) method = 'ZALOPAY';
             else if (lowerContent.includes('the_cao') || lowerContent.includes('thẻ cào') || lowerContent.includes('card_game')) method = 'THE_CAO';
             else if (lowerContent.includes('bank')) method = 'BANK';
         }

         const order = {
             id: showInfoModal.id,
             method: method,
             details: detailsStr,
             amount: showInfoModal.amount || 0,
             actualAmount: (showInfoModal.amount || 0) * 0.95,
             user: { 
                 name: showInfoModal.user?.name || showInfoModal.user_name || 'Không rõ', 
                 email: showInfoModal.user?.email || 'N/A', 
                 uuid: showInfoModal.user_uuid 
             }
         };

         return (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
             <h3 className="text-xl font-black text-slate-800">Thông tin rút tiền</h3>
             
             <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
               <div className="flex justify-between"><span className="text-gray-500">ID Rút:</span> <span className="font-mono">{order.id}</span></div>
               <div className="flex justify-between"><span className="text-gray-500">Người dùng:</span> <span>{order.user.name}</span></div>
               <div className="flex justify-between"><span className="text-gray-500">Email:</span> <span>{order.user.email}</span></div>
               <div className="flex justify-between"><span className="text-gray-500">Loại rút:</span> <span className="font-bold text-blue-600">{order.method}</span></div>
               <div className="flex justify-between"><span className="text-gray-500">Yêu cầu:</span> <span>{order.amount.toLocaleString()}đ</span></div>
               <div className="flex justify-between"><span className="text-gray-500">Thực nhận:</span> <span className="font-bold text-emerald-600">{order.actualAmount.toLocaleString()}đ</span></div>
             </div>

             {order.method === 'BANK' && (() => {
               try {
                 const bankData = processBankLogic(order);
                 return (
                   <div className="space-y-4">
                     <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-2 relative">
                        <button onClick={() => copyToClipboard(bankData.transferData.accountNumber)} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 transition"><Copy size={16}/></button>
                        <p className="text-xs text-blue-800 font-bold">THÔNG TIN CHUYỂN KHOẢN</p>
                        <p className="text-sm">Ngân hàng: <strong className="uppercase">{bankData.transferData.bankCode}</strong></p>
                        <p className="text-sm">Số TK: <strong>{bankData.transferData.accountNumber}</strong></p>
                        <p className="text-sm">Người nhận: <strong>{bankData.transferData.accountName}</strong></p>
                        <p className="text-sm">Số tiền: <strong>{bankData.transferData.amount.toLocaleString()}đ</strong></p>
                        <p className="text-sm flex gap-2 items-center">Nội dung: <strong>{bankData.transferData.content}</strong> <button onClick={() => copyToClipboard(bankData.transferData.content)} className="text-blue-500 hover:text-blue-700 transition"><Copy size={14}/></button></p>
                     </div>
                     <img src={bankData.qrUrl} alt="QR Code" className="w-full max-w-[200px] mx-auto rounded-xl border shadow-sm" />
                     <button onClick={() => { handleApprove(order.id, order.amount); setShowInfoModal(null); }} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition">Duyệt & Thanh Toán Xong</button>
                   </div>
                 );
               } catch { return <p className="text-red-500 text-sm">Lỗi dữ liệu BANK (kiểm tra lại JSON). Nội dung gốc: {showInfoModal.content}</p>; }
             })()}

             {order.method === 'ZALOPAY' && (() => {
               try {
                 const zaloData = processZaloPayLogic(order);
                 return (
                   <div className="space-y-4">
                     <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-2 relative">
                        <button onClick={() => copyToClipboard(zaloData.recipientPhone)} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 transition"><Copy size={16}/></button>
                        <p className="text-xs text-blue-800 font-bold">ZALOPAY</p>
                        <p className="text-sm">SĐT: <strong>{zaloData.recipientPhone}</strong></p>
                        <p className="text-sm">Người nhận: <strong>{zaloData.recipientName}</strong></p>
                        <p className="text-sm">Số tiền: <strong>{zaloData.amount.toLocaleString()}đ</strong></p>
                        <p className="text-sm flex gap-2 items-center">Nội dung: <strong>{zaloData.message}</strong> <button onClick={() => copyToClipboard(zaloData.message)} className="text-blue-500 hover:text-blue-700 transition"><Copy size={14}/></button></p>
                     </div>
                     <button onClick={() => { handleApprove(order.id, order.amount); setShowInfoModal(null); }} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition">Duyệt & Thanh Toán Xong</button>
                   </div>
                 );
               } catch { return <p className="text-red-500 text-sm">Lỗi dữ liệu ZALOPAY (kiểm tra lại JSON).</p>; }
             })()}

             {order.method === 'THE_CAO' && (() => {
               try {
                 const details = order.details ? JSON.parse(order.details) : {};
                 return (
                   <div className="space-y-4">
                     <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 space-y-2">
                        <p className="text-xs text-orange-800 font-bold">THÔNG TIN THẺ CÀO</p>
                        <p className="text-sm">Loại thẻ: <strong className="uppercase">{details.cardType || 'Khác'}</strong></p>
                        <p className="text-sm">Mệnh giá: <strong>{order.actualAmount.toLocaleString()}đ</strong></p>
                        <p className="text-xs text-orange-700 mt-2">Bạn cần nạp thẻ cào tương ứng và nhập mã bên dưới để trả thẻ cho người dùng.</p>
                     </div>
                     <input type="text" placeholder="Số Seri thẻ" value={cardDetails.serial} onChange={e => setCardDetails({...cardDetails, serial: e.target.value})} className="w-full p-3 border rounded-xl" />
                     <input type="text" placeholder="Mã Thẻ (PIN)" value={cardDetails.code} onChange={e => setCardDetails({...cardDetails, code: e.target.value})} className="w-full p-3 border rounded-xl" />
                     <button 
                       onClick={() => {
                          processCardLogic(order, cardDetails.serial, cardDetails.code, async (ordId: string, status: string, payload: any) => {
                              await handleApprove(ordId, order.amount, { serial: payload.cardResult.serial, code: payload.cardResult.pin });
                          }).then(() => setShowInfoModal(null)).catch((e: any) => showNotification({ title: 'Lỗi', message: e.message, type: 'error' }));
                       }} 
                       className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition"
                     >
                       Duyệt & Gửi Thẻ
                     </button>
                   </div>
                 );
               } catch { return <p className="text-red-500 text-sm">Lỗi dữ liệu thẻ cào.</p>; }
             })()}

             {order.method === 'Khác' && (
                <div className="text-sm text-slate-600 p-4 bg-slate-50 rounded-xl space-y-2 break-all overflow-y-auto max-h-40">
                  <p><strong>Nội dung yều cầu (Gốc):</strong></p>
                  {showInfoModal.content?.split('\n').map((line: string, i: number) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
             )}

             <button onClick={() => setShowInfoModal(null)} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition">Đóng</button>
           </div>
         </div>
         );
      })()}
    </div>
  );
}
