/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Edit, Trash, Plus, ChevronDown } from "lucide-react";
import InputRow from "../InputRow";

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function Profil({ masterData, viewMode, setViewMode, formData, setFormData, triggerDelete }: any) {
  const [showDropdown, setShowDropdown] = useState(false);

  if (viewMode === "list") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Data Profil & Metadata</h3>
          </div>
          <div className="relative">
              <button onClick={() => setShowDropdown(!showDropdown)} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 text-xs font-bold flex items-center gap-2 border border-slate-700 rounded transition">
                <Plus size={14} /> BUAT DATA BARU <ChevronDown size={14} />
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded shadow-xl z-20 overflow-hidden">
                  <button onClick={() => { setFormData({ id: generateId(), nama_preset: "Template UREA", jenis_pupuk: "UREA" }); setViewMode("form"); setShowDropdown(false); }} className="w-full text-left px-4 py-3 text-xs text-slate-300 hover:bg-slate-800 border-b border-slate-800 font-bold transition">Template UREA</button>
                  <button onClick={() => { setFormData({ id: generateId(), nama_preset: "Template PHONSKA", jenis_pupuk: "PHONSKA" }); setViewMode("form"); setShowDropdown(false); }} className="w-full text-left px-4 py-3 text-xs text-slate-300 hover:bg-slate-800 font-bold transition">Template PHONSKA</button>
                </div>
              )}
          </div>
        </div>

        <div className="space-y-2">
          {masterData.profiles?.map((item: any) => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 p-4 rounded flex justify-between items-center group">
              <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-300">{item.nama_preset}</span>
                  {item.jenis_pupuk && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">{item.jenis_pupuk}</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setFormData(item); setViewMode("form"); }} className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded transition"><Edit size={16}/></button>
                <button onClick={() => triggerDelete(item.id)} className="p-1.5 text-red-500 hover:bg-red-900/20 rounded transition"><Trash size={16}/></button>
              </div>
            </div>
          ))}
        </div>
        {showDropdown && <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>}
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h3 className="text-sm font-bold text-slate-200 mb-6 uppercase border-b border-slate-800 pb-2">Editor Profil</h3>
      <div className="grid grid-cols-2 gap-x-6">
        <div className="col-span-2">
            <InputRow label="Nama Template / Preset (Wajib)" value={formData.nama_preset} onChange={(e:any) => setFormData({...formData, nama_preset: e.target.value})} placeholder="Contoh: Template Utama" />
        </div>
        
        {formData.jenis_pupuk === 'PHONSKA' ? (
          <>
            <div className="col-span-2">
              <InputRow label="Judul Laporan Utama" value={formData.phonska_a1} onChange={(e: any) => setFormData({...formData, phonska_a1: e.target.value})} placeholder="Contoh: LAPORAN ALUR DO" />
            </div>
            <div className="col-span-2">
              <InputRow label="Keterangan Wilayah" value={formData.phonska_a2} onChange={(e: any) => setFormData({...formData, phonska_a2: e.target.value})} placeholder="Contoh: KAB.TASIKMALAYA" />
            </div>
            <div className="col-span-2">
              <InputRow label="Format Teks Periode" value={formData.phonska_a3} onChange={(e: any) => setFormData({...formData, phonska_a3: e.target.value})} placeholder="Contoh: PERIODE TAHUN" />
            </div>
            <div className="col-span-2">
              <InputRow label="Keterangan Sistem Penebusan" value={formData.phonska_a4} onChange={(e: any) => setFormData({...formData, phonska_a4: e.target.value})} placeholder="Contoh: SIP3-Sistem informasi..." />
            </div>
          </>
        ) : (
          <>
            <InputRow label="Code Laporan" value={formData.code} onChange={(e:any) => setFormData({...formData, code: e.target.value})} placeholder="Contoh: F-5 B" />
            <InputRow label="Provinsi" value={formData.provinsi} onChange={(e:any) => setFormData({...formData, provinsi: e.target.value})} placeholder="Contoh: Jawa Barat" />
            <div className="col-span-2">
                <InputRow label="Nama Perusahaan" value={formData.nama_perusahaan} onChange={(e:any) => setFormData({...formData, nama_perusahaan: e.target.value})} placeholder="Contoh: PT Mega Agro Sanjaya" />
            </div>
            <div className="col-span-2">
                <InputRow label="Alamat Perusahaan" value={formData.alamat_perusahaan} onChange={(e:any) => setFormData({...formData, alamat_perusahaan: e.target.value})} placeholder="Jl. Raya..." />
            </div>
            <InputRow label="Telp / Fax" value={formData.telp} onChange={(e:any) => setFormData({...formData, telp: e.target.value})} placeholder="08123..." />
            <InputRow label="Email" value={formData.email} onChange={(e:any) => setFormData({...formData, email: e.target.value})} placeholder="email@domain.com" />
            <InputRow label="Kabupaten" value={formData.kabupaten} onChange={(e:any) => setFormData({...formData, kabupaten: e.target.value})} placeholder="Tasikmalaya" />
          </>
        )}

        <div className="flex flex-col mb-4">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Jenis Pupuk (Fixed)</label>
          <input 
            type="text" 
            readOnly 
            disabled
            className="w-full bg-slate-900 border border-slate-800 text-slate-500 rounded px-3 py-2 text-sm outline-none cursor-not-allowed select-none"
            value={formData.jenis_pupuk || ""}
          />
        </div>

        <div className={formData.jenis_pupuk === 'PHONSKA' ? "" : "col-span-2"}>
          <InputRow 
            label="Awalan No SO (Prefix Default)" 
            value={formData.no_so_prefix} 
            onChange={(e: any) => setFormData({...formData, no_so_prefix: e.target.value})} 
            placeholder={formData.jenis_pupuk === 'PHONSKA' ? "Contoh: 310" : "Contoh: 3280"}
          />
        </div>
      </div>
    </div>
  );
}