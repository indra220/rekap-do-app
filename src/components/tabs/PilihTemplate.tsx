/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Building2, Send, PenTool, Copy } from "lucide-react";

export default function PilihTemplate({ masterData, handleActiveChange }: any) {
  return (
    <div className="animate-in fade-in zoom-in-95 duration-300">
      <div className="mb-10 text-center">
        <h3 className="text-2xl font-bold text-white">Pilih Template Aktif</h3>
        <p className="text-slate-400 font-medium mt-2">Pilih konfigurasi data yang ingin Anda gunakan pada dashboard & saat Export (Print).</p>
      </div>
      
      <div className="grid grid-cols-2 gap-8 max-w-3xl mx-auto">
        <div className="bg-blue-950/20 p-6 rounded-2xl border border-blue-900/30">
          <label className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Building2 size={14}/> Profil Perusahaan</label>
          <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-semibold text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-900/50 cursor-pointer [color-scheme:dark] transition-all" value={masterData.active.profileId} onChange={e => handleActiveChange('profileId', e.target.value)}>
            <option value="none">-- Tidak Menggunakan (Kosong) --</option>
            {masterData.profiles?.map((p: any) => <option key={p.id} value={p.id}>{p.nama_preset}</option>)}
          </select>
        </div>
        
        <div className="bg-emerald-950/20 p-6 rounded-2xl border border-emerald-900/30">
          <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Send size={14}/> Tujuan Laporan</label>
          <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-semibold text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-900/50 cursor-pointer [color-scheme:dark] transition-all" value={masterData.active.tujuanId} onChange={e => handleActiveChange('tujuanId', e.target.value)}>
            <option value="none">-- Tidak Menggunakan (Kosong) --</option>
            {masterData.tujuans?.map((p: any) => <option key={p.id} value={p.id}>{p.nama_preset}</option>)}
          </select>
        </div>
        
        <div className="bg-orange-950/20 p-6 rounded-2xl border border-orange-900/30">
          <label className="text-[11px] font-bold text-orange-400 uppercase tracking-widest mb-3 flex items-center gap-2"><PenTool size={14}/> Otorisasi (TTD)</label>
          <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-semibold text-slate-200 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-900/50 cursor-pointer [color-scheme:dark] transition-all" value={masterData.active.ttdId} onChange={e => handleActiveChange('ttdId', e.target.value)}>
            <option value="none">-- Tidak Menggunakan (Kosong) --</option>
            {masterData.ttds?.map((p: any) => <option key={p.id} value={p.id}>{p.nama_preset}</option>)}
          </select>
        </div>
        
        <div className="bg-purple-950/20 p-6 rounded-2xl border border-purple-900/30">
          <label className="text-[11px] font-bold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Copy size={14}/> Daftar Tembusan</label>
          <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-semibold text-slate-200 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-900/50 cursor-pointer [color-scheme:dark] transition-all" value={masterData.active.tembusanId} onChange={e => handleActiveChange('tembusanId', e.target.value)}>
            <option value="none">-- Tidak Menggunakan (Kosong) --</option>
            {masterData.tembusans?.map((p: any) => <option key={p.id} value={p.id}>{p.nama_preset}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}