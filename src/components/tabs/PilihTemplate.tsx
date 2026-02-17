/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Building2, Send, PenTool, Copy } from "lucide-react";

export default function PilihTemplate({ masterData, handleActiveChange }: any) {
  return (
    <div className="animate-in fade-in zoom-in-95 duration-300">
      <div className="mb-10 text-center">
        <h3 className="text-2xl font-black text-slate-800">Pilih Template Aktif</h3>
        <p className="text-slate-500 font-medium mt-2">Pilih konfigurasi data yang ingin Anda gunakan pada dashboard & saat Export (Print).</p>
      </div>
      
      <div className="grid grid-cols-2 gap-8 max-w-3xl mx-auto">
        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
          <label className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2"><Building2 size={14}/> Profil Perusahaan</label>
          <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer" value={masterData.active.profileId} onChange={e => handleActiveChange('profileId', e.target.value)}>
            {masterData.profiles?.map((p: any) => <option key={p.id} value={p.id}>{p.nama_preset}</option>)}
          </select>
        </div>

        <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
          <label className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2"><Send size={14}/> Tujuan Laporan</label>
          <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-emerald-500 cursor-pointer" value={masterData.active.tujuanId} onChange={e => handleActiveChange('tujuanId', e.target.value)}>
            {masterData.tujuans?.map((p: any) => <option key={p.id} value={p.id}>{p.nama_preset}</option>)}
          </select>
        </div>

        <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100">
          <label className="text-[11px] font-black text-orange-600 uppercase tracking-widest mb-3 flex items-center gap-2"><PenTool size={14}/> Otorisasi (TTD)</label>
          <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-orange-500 cursor-pointer" value={masterData.active.ttdId} onChange={e => handleActiveChange('ttdId', e.target.value)}>
            {masterData.ttds?.map((p: any) => <option key={p.id} value={p.id}>{p.nama_preset}</option>)}
          </select>
        </div>

        <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100">
          <label className="text-[11px] font-black text-purple-600 uppercase tracking-widest mb-3 flex items-center gap-2"><Copy size={14}/> Daftar Tembusan</label>
          <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-purple-500 cursor-pointer" value={masterData.active.tembusanId} onChange={e => handleActiveChange('tembusanId', e.target.value)}>
            {masterData.tembusans?.map((p: any) => <option key={p.id} value={p.id}>{p.nama_preset}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}