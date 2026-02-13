/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from "react";
import { Info, Download, RefreshCcw, X } from "lucide-react";

export default function UpdateNotification() {
  const [adaUpdate, setAdaUpdate] = useState(false);
  const [infoUpdate, setInfoUpdate] = useState<any>(null);
  const [bukaModal, setBukaModal] = useState(false);
  const [statusDownload, setStatusDownload] = useState<"standby" | "downloading" | "ready">("standby");

  useEffect(() => {
    // Memastikan IPC Renderer hanya dipanggil jika berjalan di dalam Electron
    if (typeof window !== "undefined" && window.require) {
      const { ipcRenderer } = window.require("electron");

      // Menangkap sinyal dari main.js (Backend)
      const handleUpdateTersedia = (event: any, info: any) => {
        setAdaUpdate(true);
        setInfoUpdate(info);
      };

      const handleUpdateSelesai = () => {
        setStatusDownload("ready");
      };

      ipcRenderer.on("update-tersedia", handleUpdateTersedia);
      ipcRenderer.on("update-selesai-didownload", handleUpdateSelesai);

      // Membersihkan event listener agar tidak terjadi memory leak
      return () => {
        ipcRenderer.removeListener("update-tersedia", handleUpdateTersedia);
        ipcRenderer.removeListener("update-selesai-didownload", handleUpdateSelesai);
      };
    }
  }, []);

  // Fungsi untuk mengirim perintah download ke main.js
  const handleMulaiDownload = () => {
    setStatusDownload("downloading");
    if (typeof window !== "undefined" && window.require) {
      const { ipcRenderer } = window.require("electron");
      ipcRenderer.send("mulai-download-update");
    }
  };

  // Fungsi untuk mengirim perintah install ke main.js
  const handleInstallRestart = () => {
    if (typeof window !== "undefined" && window.require) {
      const { ipcRenderer } = window.require("electron");
      ipcRenderer.send("install-dan-restart");
    }
  };

  return (
    <>
      {/* 1. TOMBOL MENU DENGAN LENCANA TANDA SERU (!) */}
      {/* Tombol hanya akan muncul jika adaUpdate bernilai true */}
      {adaUpdate && (
        <button 
          onClick={() => setBukaModal(true)}
          className="relative flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 transition"
        >
          <Info size={18} />
          Update Aplikasi
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[9px] items-center justify-center font-black">!</span>
          </span>
        </button>
      )}

      {/* 2. POP-UP / MODAL DETAIL UPDATE */}
      {bukaModal && infoUpdate && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full relative">
            
            <button onClick={() => setBukaModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition">
              <X size={20} />
            </button>

            <h2 className="text-xl font-black text-slate-800 mb-1">Update Tersedia! 🎉</h2>
            <p className="text-sm font-bold text-blue-600 mb-4">Versi Baru: v{infoUpdate.version}</p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 max-h-[200px] overflow-y-auto custom-scrollbar">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Yang Baru Pada Versi Ini:</p>
              
              {/* Menampilkan isi catatan rilis yang diambil otomatis dari GitHub */}
              <div 
                className="text-sm text-slate-600 prose prose-sm"
                dangerouslySetInnerHTML={{ 
                  __html: infoUpdate.releaseNotes || "<i>Perbaikan bug dan peningkatan performa sistem.</i>" 
                }}
              />
            </div>

            {/* 3. AREA TOMBOL AKSI UPDATE */}
            <div className="flex justify-end gap-2">
              <button onClick={() => setBukaModal(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100 transition">
                Nanti Saja
              </button>

              {statusDownload === "standby" && (
                <button onClick={handleMulaiDownload} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition">
                  <Download size={16} /> Download Update
                </button>
              )}

              {statusDownload === "downloading" && (
                <button disabled className="flex items-center gap-2 bg-slate-200 text-slate-500 px-5 py-2 rounded-lg text-sm font-bold cursor-not-allowed">
                  <RefreshCcw size={16} className="animate-spin" /> Mendownload...
                </button>
              )}

              {statusDownload === "ready" && (
                <button onClick={handleInstallRestart} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-bold transition">
                  <RefreshCcw size={16} /> Install & Restart
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}