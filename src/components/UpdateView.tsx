/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import { Download, RefreshCcw, ArrowLeft, ShieldCheck, CheckCircle2, Loader2, Clock, Search, FileText } from "lucide-react";

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

  // LOGIKA PEMINDAI TEKS (TEXT PARSER) UNTUK DESKRIPSI COMMIT
  const renderReleaseNotes = () => {
    if (!infoUpdate?.releaseNotes) {
      return <p className="text-slate-500 italic text-center p-4">Tidak ada rincian pembaruan untuk versi ini.</p>;
    }

    // 1. Ambil teks asli
    let rawText = infoUpdate.releaseNotes;

    // 2. Ganti simbol "(-)" atau "(*)" menjadi baris baru yang diawali tanda "-"
    rawText = rawText.replace(/\(-\)/g, '\n- ').replace(/\(\*\)/g, '\n* ');

    // 3. Pecah teks berdasarkan enter (baris baru)
    const lines = rawText.split(/\r?\n/).map((line: string) => line.trim()).filter((line: string) => line !== '');

    return (
      <div className="w-full text-left bg-white border border-slate-200 p-6 rounded-2xl shadow-inner mt-2 max-h-[250px] overflow-auto custom-scrollbar">
        <ul className="space-y-3">
          {lines.map((line: string, index: number) => {
            // Jika baris diawali dengan "-" atau "*", jadikan List Bullet Point
            if (line.startsWith('-') || line.startsWith('*')) {
              const cleanText = line.substring(1).trim();
              return (
                <li key={index} className="flex items-start gap-3 text-slate-600 text-sm group transition-all hover:text-slate-900">
                  <span className="text-blue-500 font-black mt-0.5 group-hover:scale-125 transition-transform">•</span>
                  <span className="font-medium leading-relaxed">{cleanText}</span>
                </li>
              );
            } else {
              // Jika bukan List, jadikan sebagai Judul / Paragraf biasa
              return (
                <li key={index} className={`list-none ${index !== 0 ? 'mt-5' : ''}`}>
                  <span className="text-slate-800 font-black bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest inline-block mb-1">
                    {line}
                  </span>
                </li>
              );
            }
          })}
        </ul>
      </div>
    );
  };

  const handleInstallRestart = () => {
    setIsApplying(true);
    if (typeof window !== "undefined" && (window as any).require) {
      const ipc = (window as any).require("electron").ipcRenderer;
      ipc.send("pasang-update-dan-restart");
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 p-8 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-white shadow-2xl rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* HEADER */}
        <div className="bg-slate-900 px-8 py-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-4">
            <button onClick={onBack} disabled={statusDownload === 'downloading'} className="hover:bg-white/10 p-2 rounded-xl transition disabled:opacity-50">
              <ArrowLeft size={24}/>
            </button>
            <div>
              <h2 className="font-black text-lg tracking-wide flex items-center gap-2">
                <ShieldCheck className="text-blue-400" /> Pembaruan Sistem
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-1">Periksa dan unduh versi terbaru aplikasi</p>
            </div>
          </div>
          {isChecking && <Loader2 size={24} className="text-blue-400 animate-spin" />}
        </div>

        <div className="p-10 space-y-8 bg-slate-50">
          
          {/* STATUS SECTION */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
            {isChecking ? (
              <div className="flex flex-col items-center text-slate-500 py-6">
                <Search size={48} className="mb-4 text-blue-300 animate-pulse" />
                <p className="font-bold text-lg text-slate-700 mb-1">Sedang Memeriksa...</p>
                <p className="text-sm">Menghubungkan ke server untuk mencari versi terbaru.</p>
              </div>
            ) : infoUpdate ? (
              <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-emerald-100 text-emerald-600 p-5 rounded-full mb-4 ring-8 ring-emerald-50">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-2xl font-black text-slate-800">Versi {infoUpdate.version} Tersedia!</h3>
                <p className="text-slate-500 font-medium text-sm mt-2">Pembaruan baru telah ditemukan dan siap untuk diunduh.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-slate-500 py-6">
                <div className="bg-slate-100 p-5 rounded-full mb-4 text-slate-400">
                  <Clock size={48} />
                </div>
                <h3 className="text-xl font-black text-slate-700 mb-1">Aplikasi Anda Up-to-Date</h3>
                <p className="text-sm">Anda sedang menggunakan versi terbaru saat ini.</p>
              </div>
            )}
          </div>

          {/* RELEASE NOTES SECTION */}
          {infoUpdate && (
            <div className="animate-in fade-in duration-500 delay-150 fill-mode-both">
              <div className="flex items-center gap-2 mb-3 px-2">
                <FileText size={18} className="text-slate-400"/>
                <h4 className="font-black text-slate-700 text-sm uppercase tracking-widest">Catatan Rilis (Changelog)</h4>
              </div>
              {renderReleaseNotes()}
            </div>
          )}

          {/* ACTION BUTTONS */}
          {infoUpdate && (
            <div className="bg-white rounded-3xl p-6 flex flex-col items-center justify-center text-center border border-slate-200 shadow-sm animate-in slide-in-from-bottom-5 duration-500 delay-300 fill-mode-both">
              
              <h3 className="font-black text-slate-800 text-sm mb-4 uppercase tracking-widest">
                {statusDownload === 'ready' ? "✨ Unduhan Selesai!" : statusDownload === 'downloading' ? `Mengunduh Data... ${progress}%` : "Aksi Diperlukan"}
              </h3>

              {statusDownload === "downloading" && (
                 <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden shadow-inner border border-slate-200">
                    <div className="bg-blue-500 h-full rounded-full transition-all duration-300 relative overflow-hidden" style={{ width: `${progress}%` }}>
                      <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" style={{backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)', transform: 'skewX(-20deg)'}}></div>
                    </div>
                 </div>
              )}

              <div className="mt-2 w-full">
                {statusDownload === "standby" && (
                  <button onClick={onStartDownload} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-800 transition shadow-lg shadow-slate-900/20">
                    <Download size={20} /> Mulai Unduh Pembaruan
                  </button>
                )}
                {statusDownload === "ready" && (
                  <button onClick={handleInstallRestart} disabled={isApplying} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-emerald-700 transition shadow-lg shadow-emerald-500/30 disabled:opacity-70">
                    {isApplying ? <Loader2 size={20} className="animate-spin" /> : <RefreshCcw size={20} />}
                    {isApplying ? "Menerapkan Pembaruan..." : "Pasang & Muat Ulang Sekarang"}
                  </button>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}