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
      type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      {type === 'success' ? <CheckCircle size={22} className="text-emerald-600"/> : <AlertCircle size={22} className="text-red-600"/>}
      <p className="font-bold text-sm tracking-wide">{msg}</p>
    </div>
  );
}