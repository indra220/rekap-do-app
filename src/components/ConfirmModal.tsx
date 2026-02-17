import React from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'danger' | 'warning' | 'info';
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ isOpen, title, message, type, confirmText, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className={`px-8 py-6 flex flex-col items-center text-center ${type === 'danger' ? 'bg-red-50' : 'bg-orange-50'}`}>
          <div className={`p-4 rounded-full mb-4 ${type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
            <AlertTriangle size={32} />
          </div>
          <h3 className={`text-xl font-black ${type === 'danger' ? 'text-red-900' : 'text-orange-900'}`}>
            {title}
          </h3>
          <p className="text-slate-600 mt-2 text-sm leading-relaxed font-medium">
            {message}
          </p>
        </div>
        <div className="p-6 bg-white border-t border-slate-100 flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 py-3 rounded-xl font-black text-sm transition"
          >
            Batal
          </button>
          <button 
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-black text-sm text-white transition shadow-lg ${
              type === 'danger' 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'
            }`}
          >
            {confirmText || "Ya, Lanjutkan"}
          </button>
        </div>
      </div>
    </div>
  );
}