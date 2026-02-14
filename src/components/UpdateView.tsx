/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import { Download, RefreshCcw, ArrowLeft, ShieldCheck, CheckCircle2, Loader2, Clock, Search } from "lucide-react";

interface UpdateViewProps {
  infoUpdate: any;
  isChecking: boolean;
  statusDownload: "standby" | "downloading" | "ready";
  progress: number;
  onStartDownload: () => void;
  onBack: () => void;
}

export default function UpdateView({ 
  infoUpdate, 
  isChecking,
  statusDownload, 
  progress, 
  onStartDownload, 
  onBack 
}: UpdateViewProps) {
  
  const [isApplying, setIsApplying] = useState(false);

  const handleInstallRestart = () => {
    setIsApplying(true);
    if (typeof window !== "undefined" && (window as any).require) {
      (window as any).require("electron").ipcRenderer.send("install-dan-restart");
    }
  };

  if (isApplying) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
        <h1 className="text-2xl font-black text-slate-800">Menerapkan Pembaruan...</h1>
        <p className="text-slate-500 font-bold mt-2">Aplikasi akan segera terbuka kembali otomatis.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition"><ArrowLeft size={24} /></button>
        <div>
          <h1 className="text-3xl font-black text-slate-800">Pembaruan Sistem</h1>
          <p className="text-slate-500 font-bold">Status sinkronisasi otomatis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-2">
          <div className="bg-blue-50 border border-blue-100 rounded-3xl p-8 min-h-[300px] flex flex-col justify-center">
            
            {/* LOGIKA TAMPILAN OTOMATIS */}
            {isChecking ? (
              <div className="text-center space-y-4 animate-pulse">
                <div className="flex justify-center"><Search size={48} className="text-blue-500 animate-bounce" /></div>
                <p className="font-black text-blue-600 uppercase tracking-widest text-sm">Mengecek Versi Terbaru...</p>
              </div>
            ) : infoUpdate ? (
              <div className="animate-in fade-in duration-700">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">v{infoUpdate.version}</span>
                  <span className="text-blue-600 font-bold text-sm">Release Notes</span>
                </div>
                <div className="text-slate-700 font-medium max-h-[250px] overflow-y-auto custom-scrollbar" 
                     dangerouslySetInnerHTML={{ __html: infoUpdate.releaseNotes || "Perbaikan sistem dan performa." }} />
              </div>
            ) : (
              <div className="text-center animate-in zoom-in duration-500">
                <div className="flex justify-center mb-4"><CheckCircle2 size={64} className="text-emerald-500" /></div>
                <h2 className="text-2xl font-black text-slate-800">Sistem Sudah Terupdate</h2>
                <p className="text-slate-500 font-bold">Anda sedang menggunakan versi terbaik saat ini.</p>
              </div>
            )}
          </div>
        </div>

        {/* Panel Aksi (Hanya muncul jika ada update dan tidak sedang checking) */}
        {!isChecking && infoUpdate && (
          <div className="bg-slate-50 rounded-3xl p-8 flex flex-col items-center justify-center text-center border border-slate-100">
            <h3 className="font-black text-slate-800 mb-2">
              {statusDownload === 'ready' ? "Siap Pasang!" : statusDownload === 'downloading' ? `Proses ${progress}%` : "Versi Baru Tersedia"}
            </h3>

            {statusDownload === "downloading" && (
               <div className="w-full bg-slate-200 rounded-full h-2 mb-6 mt-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
               </div>
            )}

            <div className="mt-4 w-full">
              {statusDownload === "standby" && (
                <button onClick={onStartDownload} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-700 transition">
                  <Download size={20} /> Unduh Sekarang
                </button>
              )}
              {statusDownload === "ready" && (
                <button onClick={handleInstallRestart} className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-emerald-600 transition">
                  <RefreshCcw size={20} /> Pasang & Restart
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}