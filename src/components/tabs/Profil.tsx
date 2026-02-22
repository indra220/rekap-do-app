/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Edit, Trash, Plus, ChevronDown } from "lucide-react";
import InputRow from "../InputRow";

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function Profil({ masterData, viewMode, setViewMode, formData, setFormData, triggerDelete }: any) {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleCreate = (jenis: string) => {
    // Hanya mengisi ID, Nama Preset default, dan Jenis Pupuk.
    // Semua input form lainnya (termasuk awalan no SO) dibiarkan kosong agar menggunakan Placeholder.
    const newData: any = { 
      id: generateId(), 
      nama_preset: `Template Baru (${jenis})`, 
      jenis_pupuk: jenis,
      list: [] 
    };

    setFormData(newData);
    setViewMode("form");
    setShowDropdown(false);
  };

  if (viewMode === "list") {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4 relative">
          <div>
            <h3 className="text-xl font-black text-slate-800">Data Profil & Metadata</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">Kelola data template yang tersimpan di database.</p>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)} 
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition shadow-lg"
            >
              <Plus size={16} /> Buat Data Baru <ChevronDown size={14} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <button onClick={() => handleCreate("UREA")} className="w-full text-left px-4 py-3.5 text-xs uppercase tracking-widest font-black text-slate-700 hover:bg-blue-50 hover:text-blue-700 border-b border-slate-100 transition flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span> Template UREA
                </button>
                <button onClick={() => handleCreate("PHONSKA")} className="w-full text-left px-4 py-3.5 text-xs uppercase tracking-widest font-black text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500"></span> Template PHONSKA
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {masterData.profiles?.map((item: any, idx: number) => (
            <div key={item.id} className="bg-slate-50 hover:bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 flex justify-between items-center transition shadow-sm group">
              <div className="flex items-center gap-4">
                <span className="bg-slate-200 text-slate-500 font-black px-3 py-1 rounded-lg text-xs">{idx + 1}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-800 text-base">{item.nama_preset}</p>
                    {item.jenis_pupuk === "UREA" && <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-md border border-blue-200">UREA</span>}
                    {item.jenis_pupuk === "PHONSKA" && <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-0.5 rounded-md border border-orange-200">PHONSKA</span>}
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">ID Database: {item.id}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setFormData(item); setViewMode("form"); setShowDropdown(false); }} className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2"><Edit size={14}/> Edit Template</button>
                <button onClick={() => triggerDelete(item.id)} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2"><Trash size={14}/> Hapus</button>
              </div>
            </div>
          ))}
        </div>
        
        {showDropdown && <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-3xl mx-auto">
      <div className="mb-8 border-b border-slate-100 pb-4">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Edit size={24} className={formData.jenis_pupuk === 'PHONSKA' ? 'text-orange-500' : 'text-blue-500'}/> Editor Data Profil</h3>
      </div>
      
      <div className="bg-slate-800 p-6 rounded-2xl mb-8 shadow-lg">
        <label className="text-[11px] font-black text-slate-300 uppercase tracking-widest mb-2 block">Nama Template / Preset (Wajib)</label>
        <input type="text" className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white rounded-xl px-4 py-3 font-bold text-lg outline-none" 
          value={formData.nama_preset || ""} onChange={e => setFormData({...formData, nama_preset: e.target.value})} placeholder="Contoh: Template Phonska 2026"/>
      </div>

      <div className="grid grid-cols-2 gap-x-6">
        
        {/* TAMPILAN FORM JIKA PHONSKA */}
        {formData.jenis_pupuk === 'PHONSKA' ? (
          <>
            <div className="col-span-2">
              <InputRow label="Judul Laporan Utama" value={formData.phonska_a1} onChange={(e: any) => setFormData({...formData, phonska_a1: e.target.value})} placeholder="Contoh: LAPORAN ALUR DO PT MEGA AGRO SANJAYA" />
            </div>
            <div className="col-span-2">
              <InputRow label="Keterangan Wilayah" value={formData.phonska_a2} onChange={(e: any) => setFormData({...formData, phonska_a2: e.target.value})} placeholder="Contoh: KAB.TASIKMALAYA PROVINSI JAWA BARAT" />
            </div>
            <div className="col-span-2">
              <InputRow label="Format Teks Periode" value={formData.phonska_a3} onChange={(e: any) => setFormData({...formData, phonska_a3: e.target.value})} placeholder="Contoh: PERIODE TAHUN" />
            </div>
            <div className="col-span-2 mb-2">
              <InputRow label="Keterangan Sistem Penebusan" value={formData.phonska_a4} onChange={(e: any) => setFormData({...formData, phonska_a4: e.target.value})} placeholder="Contoh: SIP3-Sistem informasi Penebusan & Penyaluran Pupuk Bersubsidi PT Petrokimia Gresik" />
            </div>
          </>
        ) : (
          /* TAMPILAN FORM JIKA UREA */
          <>
            <InputRow label="Code Laporan" value={formData.code} onChange={(e: any) => setFormData({...formData, code: e.target.value})} placeholder="Contoh: F-5 B" />
            <InputRow label="Provinsi" value={formData.provinsi} onChange={(e: any) => setFormData({...formData, provinsi: e.target.value})} placeholder="Contoh: Jawa Barat" />
            <InputRow label="Nama Perusahaan" value={formData.nama_perusahaan} onChange={(e: any) => setFormData({...formData, nama_perusahaan: e.target.value})} placeholder="Contoh: PT Mega Agro Sanjaya" />
            <InputRow label="Alamat Perusahaan" value={formData.alamat_perusahaan} onChange={(e: any) => setFormData({...formData, alamat_perusahaan: e.target.value})} placeholder="Contoh: Jl. Ir. H. Juanda Kel. Argasari..." />
            <InputRow label="Telp / Fax" value={formData.telp} onChange={(e: any) => setFormData({...formData, telp: e.target.value})} placeholder="Contoh: 081320599599" />
            <InputRow label="Alamat E-mail" value={formData.email} onChange={(e: any) => setFormData({...formData, email: e.target.value})} placeholder="Contoh: ptmegaagrosanjaya@gmail.com" />
            <InputRow label="Kabupaten" value={formData.kabupaten} onChange={(e: any) => setFormData({...formData, kabupaten: e.target.value})} placeholder="Contoh: Tasikmalaya" />
          </>
        )}

        {/* KOLOM JENIS PUPUK (FIXED & READ-ONLY) */}
        <div className="flex flex-col mb-4">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Jenis Pupuk (Fixed)</label>
          <input 
            type="text" 
            readOnly 
            disabled
            className={`w-full border rounded-xl px-4 py-3 font-black text-sm outline-none cursor-not-allowed select-none ${
              formData.jenis_pupuk === 'UREA' ? 'bg-blue-50 border-blue-200 text-blue-700' : 
              formData.jenis_pupuk === 'PHONSKA' ? 'bg-orange-50 border-orange-200 text-orange-700' : 
              'bg-slate-100 border-slate-200 text-slate-500'
            }`}
            value={formData.jenis_pupuk || ""} 
          />
        </div>

        {/* AWALAN NO SO (Dengan placeholder dinamis sesuai jenis pupuk) */}
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