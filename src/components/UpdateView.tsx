/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import { Download, RefreshCcw, ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";

interface UpdateViewProps {
  infoUpdate: any;
  statusDownload: "standby" | "downloading" | "ready";
  onBack: () => void;
}

export default function UpdateView({ infoUpdate, statusDownload, onBack }: UpdateViewProps) {
  
  const handleMulaiDownload = () => {
    if (typeof window !== "undefined" && (window as any).require) {
      (window as any).require("electron").ipcRenderer.send("mulai-download-update");
    }
  };

  const handleInstallRestart = () => {
    if (typeof window !== "undefined" && (window as any).require) {
      (window as any).require("electron").ipcRenderer.send("install-dan-restart");
    }
  };

  // Helper untuk merender Release Notes
  const renderReleaseNotes = () => {
    if (!infoUpdate?.releaseNotes) {
      return <p className="text-slate-500 italic">Tidak ada catatan rilis untuk versi ini.</p>;
    }

    if (Array.isArray(infoUpdate.releaseNotes)) {
      return (
        <ul className="list-disc pl-5 space-y-1">
          {infoUpdate.releaseNotes.map((note: any, i: number) => (
            <li key={i}>{note.note || note}</li>
          ))}
        </ul>
      );
    }

    return (
      <div 
        className="prose prose-blue max-w-none text-slate-700 font-medium"
        dangerouslySetInnerHTML={{ __html: infoUpdate.releaseNotes }}
      />
    );
  };

  return (
    <div className="flex flex-col h-full bg-white p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Halaman Update */}
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
        {/* Kolom Kiri: Info Versi */}
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
                <p>Belum ada pembaruan baru yang tersedia di server saat ini. Aplikasi Anda akan otomatis mengecek pembaruan di latar belakang.</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck size={16} />
            <p className="text-xs font-bold uppercase tracking-tighter">Verified & Secure Update from GitHub</p>
          </div>
        </div>

        {/* Kolom Kanan: Aksi (Hanya muncul jika ada infoUpdate) */}
        {infoUpdate && (
          <div className="bg-slate-50 rounded-3xl p-8 flex flex-col items-center justify-center text-center border border-slate-100">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
              <RefreshCcw size={32} className={`text-blue-600 ${statusDownload === 'downloading' ? 'animate-spin' : ''}`} />
            </div>
            
            <h3 className="font-black text-slate-800 mb-2">
              {statusDownload === 'ready' ? "Siap Pasang!" : "Siap Download"}
            </h3>
            <p className="text-xs text-slate-500 font-bold mb-8">
              {statusDownload === 'ready' 
                ? "File telah berhasil diunduh. Aplikasi perlu direstart untuk memasang update." 
                : "Klik tombol di bawah untuk mengunduh file pembaruan secara otomatis."}
            </p>

            {statusDownload === "standby" && (
              <button onClick={handleMulaiDownload} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition shadow-lg shadow-blue-200">
                <Download size={20} /> Mulai Unduh
              </button>
            )}

            {statusDownload === "downloading" && (
              <div className="w-full bg-slate-200 text-slate-500 py-4 rounded-2xl font-black cursor-not-allowed">
                Sedang Mengunduh...
              </div>
            )}

            {statusDownload === "ready" && (
              <button onClick={handleInstallRestart} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition shadow-lg shadow-emerald-200">
                <RefreshCcw size={20} /> Pasang & Restart
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}