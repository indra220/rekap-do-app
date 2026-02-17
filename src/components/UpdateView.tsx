/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { Download, RefreshCcw, ArrowLeft, ShieldCheck, CheckCircle2, Loader2, Clock, Search, FileText, ChevronDown } from "lucide-react";

interface UpdateViewProps {
  infoUpdate: any;
  isChecking: boolean;
  statusDownload: "standby" | "downloading" | "ready";
  progress: number;
  onStartDownload: () => void;
  onBack: () => void;
}

// ==========================================
// DATA RIWAYAT PATCH NOTES STATIS
// ==========================================
const PATCH_HISTORY = [
  {
    version: "v1.0.25",
    date: "17 Feb 2026",
    notes: "Pembaruan besar pada antarmuka dan penambahan database pintar.\n(-) Penambahan fitur Auto-Backup dan Riwayat Export\n(-) Master Data Kios & Kecamatan tersimpan otomatis saat Import\n(-) Notifikasi Pintar (Global Toast) & Custom Confirm Modal\n(-) Pemisahan komponen UI menjadi Modular (Tabs)\n(-) Tanggal SO dan No SO otomatis tercetak tebal (Bold) pada hasil Export"
  },
  {
    version: "v1.0.24",
    date: "10 Feb 2026",
    notes: "Rilis stabil dengan perbaikan core engine.\n(-) Import Excel cerdas anti-crash (Dynamic Header Scanning)\n(-) Export PDF disesuaikan ke format F4 (Folio) Landscape\n(-) Fitur Awalan No SO (Prefix Default) otomatis\n(-) Perombakan Master Data Template dinamis"
  }
];

export default function UpdateView({ 
  infoUpdate, 
  isChecking,
  statusDownload, 
  progress, 
  onStartDownload, 
  onBack 
}: UpdateViewProps) {
  
  const [isApplying, setIsApplying] = useState(false);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  // MENGGABUNGKAN DATA UPDATE TERBARU (DARI GITHUB) DENGAN HISTORY LAMA
  const allPatchNotes = React.useMemo(() => {
    const history = [...PATCH_HISTORY];
    
    if (infoUpdate && infoUpdate.version) {
      const isAlreadyInHistory = history.some(h => h.version === infoUpdate.version);
      if (!isAlreadyInHistory) {
        history.unshift({
          version: infoUpdate.version,
          date: "Pembaruan Baru",
          notes: infoUpdate.releaseNotes || "Tidak ada rincian pembaruan yang dilampirkan."
        });
      }
    }
    return history;
  }, [infoUpdate]);

  // Otomatis membuka tab versi paling atas (terbaru) saat halaman dimuat
  useEffect(() => {
    if (allPatchNotes.length > 0 && !expandedVersion) {
      setExpandedVersion(allPatchNotes[0].version);
    }
  }, [allPatchNotes, expandedVersion]);

  // PEMINDAI TEKS PINTAR (PARSER)
  const renderParsedNotes = (rawText: string) => {
    if (!rawText) return <p className="text-slate-500 italic text-sm">Tidak ada catatan untuk versi ini.</p>;
    
    // Konversi simbol menjadi format list
    let processedText = rawText.replace(/\(-\)/g, '\n- ').replace(/\(\*\)/g, '\n* ');
    const lines = processedText.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');

    return (
      <ul className="space-y-3 mt-2">
        {lines.map((line: string, index: number) => {
          if (line.startsWith('-') || line.startsWith('*')) {
            const cleanText = line.substring(1).trim();
            return (
              <li key={index} className="flex items-start gap-3 text-slate-600 text-sm group transition-all hover:text-slate-900">
                <span className="text-blue-500 font-black mt-0.5 group-hover:scale-125 transition-transform">•</span>
                <span className="font-medium leading-relaxed">{cleanText}</span>
              </li>
            );
          } else {
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
      <div className="max-w-[800px] w-full bg-white shadow-2xl rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
        
        {/* HEADER */}
        <div className="bg-slate-900 px-8 py-6 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={onBack} disabled={statusDownload === 'downloading'} className="hover:bg-white/10 p-2 rounded-xl transition disabled:opacity-50 text-slate-300 hover:text-white">
              <ArrowLeft size={24}/>
            </button>
            <div>
              <h2 className="font-black text-lg tracking-wide flex items-center gap-2">
                <ShieldCheck className="text-blue-400" /> Pusat Pembaruan Sistem
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-1">Periksa versi terbaru dan lihat riwayat pengembangan aplikasi.</p>
            </div>
          </div>
          {isChecking && <Loader2 size={24} className="text-blue-400 animate-spin" />}
        </div>

        <div className="flex-1 overflow-auto bg-slate-50 p-8 custom-scrollbar">
          
          {/* KOTAK STATUS DOWNLOAD */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center mb-8 relative overflow-hidden">
            {isChecking ? (
              <div className="flex flex-col items-center text-slate-500 py-4">
                <Search size={40} className="mb-4 text-blue-300 animate-pulse" />
                <p className="font-bold text-lg text-slate-700 mb-1">Sedang Memeriksa Pembaruan...</p>
                <p className="text-sm">Menghubungkan ke server dengan aman.</p>
              </div>
            ) : infoUpdate ? (
              <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-emerald-100 text-emerald-600 p-4 rounded-full mb-4 ring-8 ring-emerald-50">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-800">Versi {infoUpdate.version} Tersedia!</h3>
                <p className="text-slate-500 font-medium text-sm mt-2 mb-6">Pembaruan baru telah ditemukan dan siap untuk dipasang pada sistem Anda.</p>
                
                <div className="w-full max-w-md">
                  {statusDownload === "downloading" && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">
                        <span>Mengunduh Data</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner border border-slate-200">
                        <div className="bg-blue-500 h-full rounded-full transition-all duration-300 relative overflow-hidden" style={{ width: `${progress}%` }}>
                          <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" style={{backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)', transform: 'skewX(-20deg)'}}></div>
                        </div>
                      </div>
                    </div>
                  )}

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
            ) : (
              <div className="flex flex-col items-center text-slate-500 py-4">
                <div className="bg-slate-100 p-4 rounded-full mb-4 text-slate-400">
                  <Clock size={40} />
                </div>
                <h3 className="text-xl font-black text-slate-700 mb-1">Aplikasi Sudah Terkini</h3>
                <p className="text-sm">Anda sedang menggunakan versi terbaru saat ini.</p>
              </div>
            )}
          </div>

          {/* BAGIAN PATCH NOTES (ACCORDION) */}
          <div className="animate-in fade-in duration-500 delay-150">
            <div className="flex items-center gap-2 mb-4 px-2">
              <FileText size={20} className="text-blue-500"/>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Riwayat Pembaruan (Patch Notes)</h3>
            </div>
            
            <div className="space-y-3">
              {allPatchNotes.map((patch) => {
                const isExpanded = expandedVersion === patch.version;
                const isLatest = patch.version === infoUpdate?.version;
                
                return (
                  <div key={patch.version} className={`border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm ${isExpanded ? 'border-blue-300 bg-white' : 'border-slate-200 bg-white hover:border-blue-200'}`}>
                    <button 
                      onClick={() => setExpandedVersion(isExpanded ? null : patch.version)} 
                      className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className={`font-black text-sm px-3 py-1.5 rounded-xl border ${isLatest ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                          {patch.version}
                        </span>
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Clock size={12}/> {patch.date}</span>
                      </div>
                      <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-600' : ''}`} />
                    </button>
                    
                    <div className={`transition-all duration-300 ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                      <div className="px-8 pb-6 pt-2 border-t border-slate-100">
                        {renderParsedNotes(patch.notes)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}