/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import { Download, RefreshCcw, ArrowLeft, ShieldCheck, CheckCircle2, Loader2, Clock } from "lucide-react";

interface UpdateViewProps {
  infoUpdate: any;
  statusDownload: "standby" | "downloading" | "ready";
  progress: number; // Menambahkan definisi progress
  onStartDownload: () => void; // Menambahkan definisi fungsi download
  onBack: () => void;
}

export default function UpdateView({ 
  infoUpdate, 
  statusDownload, 
  progress, 
  onStartDownload, 
  onBack 
}: UpdateViewProps) {
  
  const [isApplying, setIsApplying] = useState(false);

  const handleInstallRestart = () => {
    setIsApplying(true); // Tampilkan layar loading "Menerapkan"
    if (typeof window !== "undefined" && (window as any).require) {
      // Mengirim sinyal ke main.js untuk instalasi silent (tanpa wizard)
      (window as any).require("electron").ipcRenderer.send("install-dan-restart");
    }
  };

  const renderReleaseNotes = () => {
    if (!infoUpdate?.releaseNotes) {
      return <p className="text-slate-500 italic">Tidak ada catatan rilis untuk versi ini.</p>;
    }
    return (
      <div 
        className="prose prose-blue max-w-none text-slate-700 font-medium"
        dangerouslySetInnerHTML={{ __html: infoUpdate.releaseNotes }}
      />
    );
  };

  // Tampilan Loading jika sedang menerapkan update (Silent Mode)
  if (isApplying) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white animate-in fade-in duration-500">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
        <h1 className="text-2xl font-black text-slate-800">Menerapkan Pembaruan...</h1>
        <p className="text-slate-500 font-bold mt-2">Aplikasi akan segera terbuka kembali secara otomatis.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-800">Pembaruan Sistem</h1>
          <p className="text-slate-500 font-bold">
            {infoUpdate ? "Versi terbaru telah siap untuk Anda" : "Sistem Anda sudah menggunakan versi terbaru"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Kolom Kiri: Release Notes */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-4">
              {infoUpdate ? (
                <>
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    v{infoUpdate.version}
                  </span>
                  <span className="text-blue-600 font-bold text-sm">Release Notes</span>
                </>
              ) : (
                <span className="text-emerald-600 font-bold text-sm flex items-center gap-2">
                  <CheckCircle2 size={18} /> Anda menggunakan versi terbaru
                </span>
              )}
            </div>
            <div className="text-slate-700 font-medium">
              {infoUpdate ? renderReleaseNotes() : (
                <p>Belum ada pembaruan baru yang tersedia. Aplikasi Anda akan otomatis mengecek pembaruan di latar belakang.</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck size={16} />
            <p className="text-xs font-bold uppercase tracking-tighter">Verified & Secure Update from GitHub</p>
          </div>
        </div>

        {/* Kolom Kanan: Status & Tombol Aksi */}
        {infoUpdate && (
          <div className="bg-slate-50 rounded-3xl p-8 flex flex-col items-center justify-center text-center border border-slate-100">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
              <RefreshCcw size={32} className={`text-blue-600 ${statusDownload === 'downloading' ? 'animate-spin' : ''}`} />
            </div>
            
            <h3 className="font-black text-slate-800 mb-2">
              {statusDownload === 'ready' ? "Siap Pasang!" : statusDownload === 'downloading' ? `Mengunduh ${progress}%` : "Siap Download"}
            </h3>

            {/* Progress Bar */}
            {statusDownload === "downloading" && (
               <div className="w-full bg-slate-200 rounded-full h-2 mb-6 mt-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
               </div>
            )}

            <p className="text-xs text-slate-500 font-bold mb-8">
              {statusDownload === 'ready' 
                ? "Update berhasil diunduh. Klik 'Pasang Sekarang' untuk menerapkan tanpa installer." 
                : "Klik tombol di bawah untuk mengunduh pembaruan secara otomatis."}
            </p>

            {statusDownload === "standby" && (
              <button onClick={onStartDownload} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition shadow-lg shadow-blue-200">
                <Download size={20} /> Mulai Unduh
              </button>
            )}

            {statusDownload === "downloading" && (
              <div className="w-full bg-slate-200 text-slate-500 py-4 rounded-2xl font-black cursor-wait">
                Mendownload...
              </div>
            )}

            {statusDownload === "ready" && (
              <div className="flex flex-col gap-3 w-full">
                <button onClick={handleInstallRestart} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition shadow-lg shadow-emerald-200">
                  <RefreshCcw size={20} /> Pasang Sekarang
                </button>
                <button onClick={onBack} className="w-full bg-white border border-slate-200 text-slate-500 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-50 transition">
                  <Clock size={20} /> Lain Kali
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}