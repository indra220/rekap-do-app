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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className={`px-8 py-6 flex flex-col items-center text-center ${type === 'danger' ? 'bg-red-950/20' : 'bg-orange-950/20'}`}>
          <div className={`p-4 rounded-full mb-4 border ${type === 'danger' ? 'bg-red-900/30 text-red-400 border-red-900/50' : 'bg-orange-900/30 text-orange-400 border-orange-900/50'}`}>
            <AlertTriangle size={32} />
          </div>
          <h3 className={`text-xl font-black ${type === 'danger' ? 'text-red-400' : 'text-orange-400'}`}>
            {title}
          </h3>
          <p className="text-slate-300 mt-2 text-sm leading-relaxed font-medium">
            {message}
          </p>
        </div>
        <div className="p-6 bg-slate-900 border-t border-slate-800 flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white py-3 rounded-xl font-black text-sm transition"
          >
            Batal
          </button>
          <button 
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-black text-sm text-white transition shadow-lg ${
              type === 'danger' 
                ? 'bg-red-600 hover:bg-red-500 shadow-red-900/50' 
                : 'bg-orange-600 hover:bg-orange-500 shadow-orange-900/50'
            }`}
          >
            {confirmText || "Ya, Lanjutkan"}
          </button>
        </div>
      </div>
    </div>
  );
}