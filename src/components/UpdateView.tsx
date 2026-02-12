"use client";
import React from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { APP_VERSION } from "@/constants/data";

interface UpdateViewProps {
  onBack: () => void;
}

export default function UpdateView({ onBack }: UpdateViewProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-12 flex flex-col items-center justify-center">
      <div className="max-w-[600px] w-full bg-white p-12 rounded-[40px] shadow-2xl border border-slate-100 text-center space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
        <button onClick={onBack} className="absolute top-8 left-8 p-2 text-slate-400 hover:text-slate-600 transition"><ArrowLeft size={24}/></button>
        <div className="inline-flex p-6 bg-blue-50 rounded-3xl text-blue-600 mb-4"><RefreshCw size={48} className="animate-spin"/></div>
        <div><h2 className="text-3xl font-black text-slate-900 tracking-tight">Pusat Pembaruan</h2><p className="text-slate-500 font-medium mt-2">Versi saat ini: <span className="font-black text-blue-600">v{APP_VERSION}</span></p></div>
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-left"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Status Sistem</p><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div><span className="text-sm font-black text-slate-700">Aplikasi Mutakhir</span></div></div></div>
      </div>
    </div>
  );
}