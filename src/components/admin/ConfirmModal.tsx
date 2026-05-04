import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ isOpen, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Xác nhận hộp thoại</h3>
        <p className="text-slate-600 mb-6 break-words">{message}</p>
        
        <div className="flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={onConfirm}
            className="px-5 py-2 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Chắc chắn
          </button>
        </div>
      </div>
    </div>
  );
}
