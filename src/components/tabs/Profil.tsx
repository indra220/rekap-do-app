/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Edit, Trash, Plus } from "lucide-react";
import InputRow from "../InputRow";

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function Profil({ masterData, viewMode, setViewMode, formData, setFormData, triggerDelete }: any) {
  if (viewMode === "list") {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-black text-slate-800">Data Profil & Metadata</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">Kelola data template yang tersimpan di database.</p>
          </div>
          <button onClick={() => { setFormData({ id: generateId(), nama_preset: "", list: [] }); setViewMode("form"); }} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition shadow-lg">
            <Plus size={16} /> Buat Data Baru
          </button>
        </div>

        <div className="space-y-3">
          {masterData.profiles?.map((item: any, idx: number) => (
            <div key={item.id} className="bg-slate-50 hover:bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 flex justify-between items-center transition shadow-sm group">
              <div className="flex items-center gap-4">
                <span className="bg-slate-200 text-slate-500 font-black px-3 py-1 rounded-lg text-xs">{idx + 1}</span>
                <div>
                  <p className="font-bold text-slate-800 text-base">{item.nama_preset}</p>
                  <p className="text-xs text-slate-400 font-medium">ID Database: {item.id}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setFormData(item); setViewMode("form"); }} className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2"><Edit size={14}/> Edit Template</button>
                <button onClick={() => triggerDelete(item.id)} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2"><Trash size={14}/> Hapus</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-3xl mx-auto">
      <div className="mb-8 border-b border-slate-100 pb-4">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Edit size={24} className="text-blue-500"/> Editor Data Profil</h3>
      </div>
      <div className="bg-slate-800 p-6 rounded-2xl mb-8 shadow-lg">
        <label className="text-[11px] font-black text-slate-300 uppercase tracking-widest mb-2 block">Nama Template / Preset (Wajib)</label>
        <input type="text" className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white rounded-xl px-4 py-3 font-bold text-lg outline-none" 
          value={formData.nama_preset || ""} onChange={e => setFormData({...formData, nama_preset: e.target.value})} placeholder="Contoh: Template Phonska 2026"/>
      </div>
      <div className="grid grid-cols-2 gap-x-6">
        <InputRow label="Code Laporan" value={formData.code} onChange={(e: any) => setFormData({...formData, code: e.target.value})} placeholder="Contoh: F-5 B" />
        <InputRow label="Provinsi" value={formData.provinsi} onChange={(e: any) => setFormData({...formData, provinsi: e.target.value})} placeholder="Contoh: Jawa Barat" />
        <InputRow label="Nama Perusahaan" value={formData.nama_perusahaan} onChange={(e: any) => setFormData({...formData, nama_perusahaan: e.target.value})} placeholder="PT Mega Agro..." />
        <InputRow label="Alamat Perusahaan" value={formData.alamat_perusahaan} onChange={(e: any) => setFormData({...formData, alamat_perusahaan: e.target.value})} placeholder="Jl. Ir. H. Juanda..." />
        <InputRow label="Telp / Fax" value={formData.telp} onChange={(e: any) => setFormData({...formData, telp: e.target.value})} placeholder="0813..." />
        <InputRow label="Alamat E-mail" value={formData.email} onChange={(e: any) => setFormData({...formData, email: e.target.value})} placeholder="email@pt.com" />
        <InputRow label="Kabupaten" value={formData.kabupaten} onChange={(e: any) => setFormData({...formData, kabupaten: e.target.value})} placeholder="Tasikmalaya" />
        <InputRow label="Jenis Pupuk" value={formData.jenis_pupuk} onChange={(e: any) => setFormData({...formData, jenis_pupuk: e.target.value})} placeholder="Contoh: UREA / PHONSKA" />
        <div className="col-span-2">
          <InputRow label="Awalan No SO (Prefix Default)" value={formData.no_so_prefix} onChange={(e: any) => setFormData({...formData, no_so_prefix: e.target.value})} placeholder="Contoh: 3280" />
        </div>
      </div>
    </div>
  );
}