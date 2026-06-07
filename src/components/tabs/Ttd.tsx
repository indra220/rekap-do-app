/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Edit, Trash, Plus } from "lucide-react";
import InputRow from "../InputRow";

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function Ttd({ masterData, viewMode, setViewMode, formData, setFormData, triggerDelete }: any) {
  if (viewMode === "list") {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-bold text-white">Data Otorisasi (TTD)</h3>
            <p className="text-sm text-slate-400 font-medium mt-1">Kelola data template yang tersimpan di database.</p>
          </div>
          <button onClick={() => { setFormData({ id: generateId(), nama_preset: "", list: [] }); setViewMode("form"); }} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase flex items-center gap-2 transition shadow-lg shadow-blue-900/20">
            <Plus size={16} /> Buat Data Baru
          </button>
        </div>

        <div className="space-y-3">
          {masterData.ttds?.map((item: any, idx: number) => (
            <div key={item.id} className="bg-slate-950/50 hover:bg-slate-800 p-5 rounded-2xl border border-slate-800 hover:border-blue-500/50 flex justify-between items-center transition shadow-sm group">
              <div className="flex items-center gap-4">
                <span className="bg-slate-800 text-slate-400 font-bold px-3 py-1 rounded-lg text-xs border border-slate-700">{idx + 1}</span>
                <div>
                  <p className="font-semibold text-slate-200 text-base">{item.nama_preset}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">ID Database: {item.id}</p>
                </div>
              </div>
              <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setFormData(item); setViewMode("form"); }} className="bg-blue-900/30 text-blue-400 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-blue-900/50 hover:border-transparent"><Edit size={14}/> Edit Template</button>
                <button onClick={() => triggerDelete(item.id)} className="bg-red-900/20 text-red-400 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-red-900/30 hover:border-transparent"><Trash size={14}/> Hapus</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-3xl mx-auto">
      <div className="mb-8 border-b border-slate-800 pb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2"><Edit size={24} className="text-blue-400"/> Editor Otorisasi (TTD)</h3>
      </div>
      
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-8 shadow-sm">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Nama Template / Preset (Wajib)</label>
        <input type="text" className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-900/50 text-white rounded-xl px-4 py-3 font-semibold text-lg outline-none transition-all placeholder:text-slate-600" value={formData.nama_preset || ""} onChange={e => setFormData({...formData, nama_preset: e.target.value})} placeholder="Contoh: Template Phonska 2026"/>
      </div>
      
      <div className="grid grid-cols-1 gap-x-6">
        <InputRow label="Nama Pimpinan / Direktur" value={formData.direktur} onChange={(e: any) => setFormData({...formData, direktur: e.target.value})} placeholder="Nama Terang" />
        <InputRow label="Jabatan" value={formData.jabatan} onChange={(e: any) => setFormData({...formData, jabatan: e.target.value})} placeholder="Contoh: Direktur" />
      </div>
    </div>
  );
}