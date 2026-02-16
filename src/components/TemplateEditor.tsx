/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import { ArrowLeft, Save, Plus, Trash, CheckSquare, Building2, Send, PenTool, Copy, Edit, X, Database } from "lucide-react"; 

interface TemplateEditorProps {
  masterData: any;
  setMasterData: (data: any) => void;
  onBack: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

// KOMPONEN INPUT: Dipindah ke luar fungsi utama agar kursor tidak hilang (re-render) saat mengetik
const InputRow = ({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (e: any) => void, placeholder?: string }) => (
  <div className="flex flex-col gap-1.5 mb-5">
    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
    <input 
      type="text" 
      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 font-bold outline-none text-slate-800 transition-colors" 
      value={value || ""} 
      onChange={onChange} 
      placeholder={placeholder}
    />
  </div>
);

export default function TemplateEditor({ masterData, setMasterData, onBack }: TemplateEditorProps) {
  const [menu, setMenu] = useState("pilih"); // 'pilih', 'profil', 'tujuan', 'ttd', 'tembusan'
  const [viewMode, setViewMode] = useState("list"); // 'list', 'form'
  const [formData, setFormData] = useState<any>({});

  const menus = [
    { id: "pilih", label: "Pilih Template Aktif", icon: <CheckSquare size={18} /> },
    { id: "profil", label: "Data Profil & Metadata", icon: <Building2 size={18} /> },
    { id: "tujuan", label: "Data Tujuan Laporan", icon: <Send size={18} /> },
    { id: "ttd", label: "Data Otorisasi (TTD)", icon: <PenTool size={18} /> },
    { id: "tembusan", label: "Data Daftar Tembusan", icon: <Copy size={18} /> },
  ];

  const getListKey = (m: string) => m === 'profil' ? 'profiles' : m === 'tujuan' ? 'tujuans' : m === 'ttd' ? 'ttds' : 'tembusans';

  // --- PERBAIKAN: Fungsi Tembus Batas (Langsung Tulis ke SQLite) ---
  const forceSaveToDB = (dataToSave: any) => {
    if (typeof window !== "undefined" && (window as any).require) {
      const ipc = (window as any).require("electron").ipcRenderer;
      ipc.invoke('db-save', { table: 'rekapdotemplate', id: 'current_session', data: dataToSave });
    }
  };

  // --- LOGIKA PENYIMPANAN FORM ---
  const handleSaveForm = () => {
    if (!formData.nama_preset) { alert("Nama Template/Preset wajib diisi!"); return; }

    const listKey = getListKey(menu);
    const existingList = masterData[listKey] || [];
    const isEdit = existingList.some((x: any) => x.id === formData.id);

    let newList;
    if (isEdit) {
      newList = existingList.map((x: any) => x.id === formData.id ? formData : x);
    } else {
      newList = [...existingList, { ...formData, id: formData.id || generateId() }];
    }

    const updatedMasterData = { ...masterData, [listKey]: newList };
    setMasterData(updatedMasterData);
    
    // Eksekusi Simpan Langsung
    forceSaveToDB(updatedMasterData);
    
    setViewMode("list");
  };

  // --- LOGIKA PENGHAPUSAN DATA ---
  const handleDelete = (id: string) => {
    const listKey = getListKey(menu);
    if (masterData[listKey].length <= 1) {
      alert("Peringatan: Tidak dapat menghapus satu-satunya data yang tersisa!");
      return;
    }

    if (confirm("Hapus data template ini secara permanen?")) {
      const newList = masterData[listKey].filter((x: any) => x.id !== id);
      
      const activeKey = menu === 'profil' ? 'profileId' : menu === 'tujuan' ? 'tujuanId' : menu === 'ttd' ? 'ttdId' : 'tembusanId';
      let newActive = { ...masterData.active };
      
      if (masterData.active[activeKey] === id) {
        newActive[activeKey] = newList[0].id; 
      }
      
      const updatedMasterData = { ...masterData, [listKey]: newList, active: newActive };
      setMasterData(updatedMasterData);
      
      // Eksekusi Simpan Langsung
      forceSaveToDB(updatedMasterData);
    }
  };

  // --- LOGIKA PEMILIHAN DROPDOWN AKTIF ---
  const handleActiveChange = (key: string, value: string) => {
    const updatedMasterData = {...masterData, active: {...masterData.active, [key]: value}};
    setMasterData(updatedMasterData);
    
    // Eksekusi Simpan Langsung
    forceSaveToDB(updatedMasterData);
  };

  return (
    <div className="min-h-screen bg-slate-200 p-8 flex flex-col items-center">
      <div className="max-w-[1200px] w-full bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col h-[95vh]">
        
        {/* HEADER ATAS */}
        <div className="bg-slate-900 px-8 py-5 flex justify-between items-center text-white">
          <div className="flex items-center gap-4">
            {viewMode === 'list' ? (
              <button onClick={onBack} className="hover:bg-white/10 p-2 rounded-xl transition bg-slate-800 text-slate-300">
                <ArrowLeft size={24}/>
              </button>
            ) : (
              <button onClick={() => setViewMode('list')} className="hover:bg-red-500/20 text-red-400 p-2 rounded-xl transition flex gap-2 font-bold text-sm items-center">
                <X size={20}/> Batal Edit
              </button>
            )}
            <div className="flex items-center gap-2 bg-blue-600/20 px-4 py-2 rounded-lg text-blue-400">
              <Database size={18} />
              <h2 className="font-black text-sm tracking-widest uppercase">Master Menu Data</h2>
            </div>
          </div>
          
          {viewMode === 'form' && (
            <button onClick={handleSaveForm} className="bg-emerald-600 hover:bg-emerald-700 px-8 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 transition shadow-lg shadow-emerald-500/30">
              <Save size={18}/> Simpan Ke Database
            </button>
          )}
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          
          {/* SIDEBAR (MENU KATEGORI) */}
          <div className="w-72 bg-slate-50 border-r border-slate-200 p-6 flex flex-col gap-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Menu Kategori</p>
            {menus.map((m) => (
              <button key={m.id}
                onClick={() => { setMenu(m.id); setViewMode("list"); }}
                className={`flex items-center gap-3 px-4 py-4 rounded-2xl font-bold text-sm transition-all duration-200 ${
                  menu === m.id ? (m.id === 'pilih' ? "bg-slate-800 text-white shadow-lg" : "bg-blue-600 text-white shadow-lg shadow-blue-200") : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {/* AREA KONTEN TENGAH */}
          <div className="flex-1 overflow-auto bg-slate-100 p-10 custom-scrollbar relative">
            <div className="bg-white mx-auto shadow-sm border border-slate-200 p-10 rounded-3xl w-full min-h-full transition-all">
              
              {/* --- TAMPILAN PILIH TEMPLATE (SELECT) --- */}
              {menu === "pilih" && (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                  <div className="mb-10 text-center">
                    <h3 className="text-2xl font-black text-slate-800">Pilih Template Aktif</h3>
                    <p className="text-slate-500 font-medium mt-2">Pilih konfigurasi data yang ingin Anda gunakan pada dashboard & saat Export (Print).</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8 max-w-3xl mx-auto">
                    {/* Select Profil */}
                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                      <label className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2"><Building2 size={14}/> Profil Perusahaan</label>
                      <select 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                        value={masterData.active.profileId} onChange={e => handleActiveChange('profileId', e.target.value)}
                      >
                        {masterData.profiles?.map((p: any) => <option key={p.id} value={p.id}>{p.nama_preset}</option>)}
                      </select>
                    </div>

                    {/* Select Tujuan */}
                    <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                      <label className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2"><Send size={14}/> Tujuan Laporan</label>
                      <select 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
                        value={masterData.active.tujuanId} onChange={e => handleActiveChange('tujuanId', e.target.value)}
                      >
                        {masterData.tujuans?.map((p: any) => <option key={p.id} value={p.id}>{p.nama_preset}</option>)}
                      </select>
                    </div>

                    {/* Select TTD */}
                    <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100">
                      <label className="text-[11px] font-black text-orange-600 uppercase tracking-widest mb-3 flex items-center gap-2"><PenTool size={14}/> Otorisasi (TTD)</label>
                      <select 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-orange-500 cursor-pointer"
                        value={masterData.active.ttdId} onChange={e => handleActiveChange('ttdId', e.target.value)}
                      >
                        {masterData.ttds?.map((p: any) => <option key={p.id} value={p.id}>{p.nama_preset}</option>)}
                      </select>
                    </div>

                    {/* Select Tembusan */}
                    <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100">
                      <label className="text-[11px] font-black text-purple-600 uppercase tracking-widest mb-3 flex items-center gap-2"><Copy size={14}/> Daftar Tembusan</label>
                      <select 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-purple-500 cursor-pointer"
                        value={masterData.active.tembusanId} onChange={e => handleActiveChange('tembusanId', e.target.value)}
                      >
                        {masterData.tembusans?.map((p: any) => <option key={p.id} value={p.id}>{p.nama_preset}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAMPILAN DAFTAR DATA (LIST MODE) --- */}
              {menu !== "pilih" && viewMode === "list" && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-800">{menus.find(m => m.id === menu)?.label}</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">Kelola data template yang tersimpan di database.</p>
                    </div>
                    <button 
                      onClick={() => { setFormData({ id: generateId(), nama_preset: "", list: [] }); setViewMode("form"); }}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition shadow-lg"
                    >
                      <Plus size={16} /> Buat Data Baru
                    </button>
                  </div>

                  <div className="space-y-3">
                    {masterData[getListKey(menu)]?.map((item: any, idx: number) => (
                      <div key={item.id} className="bg-slate-50 hover:bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 flex justify-between items-center transition shadow-sm group">
                        <div className="flex items-center gap-4">
                          <span className="bg-slate-200 text-slate-500 font-black px-3 py-1 rounded-lg text-xs">{idx + 1}</span>
                          <div>
                            <p className="font-bold text-slate-800 text-base">{item.nama_preset}</p>
                            <p className="text-xs text-slate-400 font-medium">ID Database: {item.id}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setFormData(item); setViewMode("form"); }} className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2">
                            <Edit size={14}/> Edit Template
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2">
                            <Trash size={14}/> Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* --- TAMPILAN FORM EDIT/BUAT DATA --- */}
              {menu !== "pilih" && viewMode === "form" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-3xl mx-auto">
                  <div className="mb-8 border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Edit size={24} className="text-blue-500"/> Editor {menus.find(m => m.id === menu)?.label}</h3>
                  </div>

                  {/* Field Wajib untuk Semua Tab */}
                  <div className="bg-slate-800 p-6 rounded-2xl mb-8 shadow-lg">
                    <label className="text-[11px] font-black text-slate-300 uppercase tracking-widest mb-2 block">Nama Template / Preset (Wajib)</label>
                    <input type="text" className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white rounded-xl px-4 py-3 font-bold text-lg outline-none" 
                      value={formData.nama_preset || ""} onChange={e => setFormData({...formData, nama_preset: e.target.value})} placeholder="Contoh: Template Phonska 2026"/>
                  </div>

                  {/* Form Profil */}
                  {menu === "profil" && (
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
                  )}

                  {/* Form Tujuan */}
                  {menu === "tujuan" && (
                    <div className="grid grid-cols-1 gap-x-6">
                      <InputRow label="Kepada Yth" value={formData.kepada} onChange={(e: any) => setFormData({...formData, kepada: e.target.value})} placeholder="Kepada Yth," />
                      <InputRow label="Jabatan Penerima" value={formData.penerima_1} onChange={(e: any) => setFormData({...formData, penerima_1: e.target.value})} placeholder="Manager Penjualan..." />
                      <InputRow label="Instansi Penerima" value={formData.penerima_2} onChange={(e: any) => setFormData({...formData, penerima_2: e.target.value})} placeholder="PT Pupuk Kujang..." />
                      <InputRow label="Alamat Baris 1" value={formData.alamat_penerima_1} onChange={(e: any) => setFormData({...formData, alamat_penerima_1: e.target.value})} placeholder="Jl Jend. A. Yani..." />
                      <InputRow label="Alamat Baris 2" value={formData.alamat_penerima_2} onChange={(e: any) => setFormData({...formData, alamat_penerima_2: e.target.value})} placeholder="Kab Karawang" />
                    </div>
                  )}

                  {/* Form TTD */}
                  {menu === "ttd" && (
                    <div className="grid grid-cols-1 gap-x-6">
                      <InputRow label="Nama Pimpinan / Direktur" value={formData.direktur} onChange={(e: any) => setFormData({...formData, direktur: e.target.value})} placeholder="Nama Terang" />
                      <InputRow label="Jabatan" value={formData.jabatan} onChange={(e: any) => setFormData({...formData, jabatan: e.target.value})} placeholder="Contoh: Direktur" />
                    </div>
                  )}

                  {/* Form Tembusan */}
                  {menu === "tembusan" && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">List Data Tembusan</p>
                        <button onClick={() => setFormData({...formData, list: [...(formData.list || []), ""]})} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                          <Plus size={12} /> Tambah Kolom
                        </button>
                      </div>
                      <div className="space-y-3">
                        {(!formData.list || formData.list.length === 0) && <p className="text-sm text-slate-400 italic">Belum ada tembusan.</p>}
                        {formData.list?.map((t: string, i: number) => (
                          <div key={i} className="flex gap-4 items-center bg-slate-50 border border-slate-200 p-2 pl-4 rounded-xl">
                            <span className="text-xs font-black text-slate-400 w-4">{i+1}.</span>
                            <input type="text" className="flex-1 bg-transparent text-sm font-bold outline-none py-1" value={t} placeholder="Masukkan instansi..."
                              onChange={e => { const newList = [...formData.list]; newList[i] = e.target.value; setFormData({...formData, list: newList}); }} 
                            />
                            <button onClick={() => { const newList = formData.list.filter((_:any, idx:number) => idx !== i); setFormData({...formData, list: newList}); }} className="bg-red-50 text-red-500 p-2 rounded-lg">
                              <Trash size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}