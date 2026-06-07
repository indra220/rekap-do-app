import React from "react";
import { CheckCircle, AlertCircle } from "lucide-react";

interface ToastProps {
  show: boolean;
  msg: string;
  type: 'success' | 'error';
}

export default function Toast({ show, msg, type }: ToastProps) {
  if (!show) return null;

  return (
    <div className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-top-5 fade-in duration-300 ${
      type === 'success' ? 'bg-emerald-950 border-emerald-900/50 text-emerald-400' : 'bg-red-950 border-red-900/50 text-red-400'
    }`}>
      {type === 'success' ? <CheckCircle size={22} className="text-emerald-500"/> : <AlertCircle size={22} className="text-red-500"/>}
      <p className="font-bold text-sm tracking-wide text-slate-200">{msg}</p>
    </div>
  );
}