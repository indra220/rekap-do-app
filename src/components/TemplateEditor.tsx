/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import { ArrowLeft, Save, CheckSquare, Building2, Send, PenTool, Copy, X, Database, Archive, Store } from "lucide-react"; 
import { SOData } from "@/types";

// IMPORT KOMPONEN GLOBAL & TAB MODULAR
import Toast from "./Toast";
import ConfirmModal from "./ConfirmModal";
import PilihTemplate from "./tabs/PilihTemplate";
import Profil from "./tabs/Profil";
import Tujuan from "./tabs/Tujuan";
import Ttd from "./tabs/Ttd";
import Tembusan from "./tabs/Tembusan";
import Kios from "./tabs/Kios";
import Riwayat from "./tabs/Riwayat";

interface TemplateEditorProps {
  masterData: any;
  setMasterData: (data: any) => void;
  onBack: () => void;
  onLoadHistory: (data: SOData[], periode: string) => void;
  onReExportHistory: (format: 'EXCEL'|'PDF', data: SOData[], periode: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function TemplateEditor({ masterData, setMasterData, onBack, onLoadHistory, onReExportHistory }: TemplateEditorProps) {
  const [menu, setMenu] = useState("pilih"); 
  const [viewMode, setViewMode] = useState("list"); 
  const [formData, setFormData] = useState<any>({});
  
  const [toast, setToast] = useState<{show: boolean, msg: string, type: 'success' | 'error'}>({show: false, msg: '', type: 'success'});
  
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; title: string; message: string; type: 'danger' | 'warning' | 'info'; onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", type: 'danger', onConfirm: () => {} });

  const menus = [
    { id: "pilih", label: "Pilih Template Aktif", icon: <CheckSquare size={18} /> },
    { id: "profil", label: "Data Profil & Metadata", icon: <Building2 size={18} /> },
    { id: "tujuan", label: "Data Tujuan Laporan", icon: <Send size={18} /> },
    { id: "ttd", label: "Data Otorisasi (TTD)", icon: <PenTool size={18} /> },
    { id: "tembusan", label: "Data Daftar Tembusan", icon: <Copy size={18} /> },
    { id: "kios", label: "Data Kios", icon: <Store size={18} /> },
    { id: "riwayat", label: "Riwayat Export", icon: <Archive size={18} /> },
  ];

  const getListKey = (m: string) => m === 'profil' ? 'profiles' : m === 'tujuan' ? 'tujuans' : m === 'ttd' ? 'ttds' : m === 'kios' ? 'kiosList' : 'tembusans';

  const forceSaveToDB = (dataToSave: any) => {
    if (typeof window !== "undefined" && (window as any).require) {
      const ipc = (window as any).require("electron").ipcRenderer;
      ipc.invoke('db-save', { table: 'rekapdotemplate', id: 'current_session', data: dataToSave });
    }
  };

  const handleSaveForm = () => {
    if (menu === "kios") {
      if (!formData.namaKios) { showToast("Nama Kios wajib diisi!", "error"); return; }
    } else {
      if (!formData.nama_preset) { showToast("Nama Template/Preset wajib diisi!", "error"); return; }
    }

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
    forceSaveToDB(updatedMasterData);
    setViewMode("list");
    showToast("Data berhasil disimpan ke database.", "success");
  };

  const triggerDelete = (id: string) => {
    const listKey = getListKey(menu);
    if (menu !== 'kios' && masterData[listKey].length <= 1) {
      showToast("Gagal: Anda tidak dapat menghapus satu-satunya data yang tersisa!", "error"); 
      return;
    }
    
    setConfirmModal({
      isOpen: true,
      title: menu === 'kios' ? "Hapus Data Kios?" : "Hapus Data Template?",
      message: "Data yang dihapus tidak dapat dikembalikan. Pastikan Anda memilih data yang benar.",
      type: 'danger',
      onConfirm: () => {
        const newList = masterData[listKey].filter((x: any) => x.id !== id);
        let updatedMasterData = { ...masterData, [listKey]: newList };

        if (menu !== 'kios') {
          const activeKey = menu === 'profil' ? 'profileId' : menu === 'tujuan' ? 'tujuanId' : menu === 'ttd' ? 'ttdId' : 'tembusanId';
          let newActive = { ...masterData.active };
          if (masterData.active[activeKey] === id) newActive[activeKey] = newList[0].id; 
          updatedMasterData = { ...updatedMasterData, active: newActive };
        }
        
        setMasterData(updatedMasterData);
        forceSaveToDB(updatedMasterData);
        setConfirmModal(prev => ({...prev, isOpen: false}));
        showToast("Data berhasil dihapus secara permanen.", "success");
      }
    });
  };

  const triggerDeleteHistory = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Hapus Riwayat Export?",
      message: "Seluruh data snapshot (tabel) yang tersimpan dalam riwayat ini akan dihapus permanen.",
      type: 'danger',
      onConfirm: () => {
        const newHistory = (masterData.exportHistory || []).filter((h: any) => h.id !== id);
        const updatedMasterData = { ...masterData, exportHistory: newHistory };
        setMasterData(updatedMasterData);
        forceSaveToDB(updatedMasterData);
        setConfirmModal(prev => ({...prev, isOpen: false}));
        showToast("Riwayat Export berhasil dihapus.", "success");
      }
    });
  };

  const triggerLoadHistory = (data: SOData[], periode: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Edit / Restore Data?",
      message: "Peringatan: Data yang sedang ada di Dashboard saat ini akan ditimpa dengan data dari riwayat ini. Lanjutkan?",
      type: 'warning',
      onConfirm: () => {
        onLoadHistory(data, periode);
        setConfirmModal(prev => ({...prev, isOpen: false}));
      }
    });
  };

  const handleActiveChange = (key: string, value: string) => {
    const updatedMasterData = {...masterData, active: {...masterData.active, [key]: value}};
    setMasterData(updatedMasterData);
    forceSaveToDB(updatedMasterData);
    showToast("Template aktif berhasil diubah dan diterapkan.", "success");
  };

  return (
    <div className="min-h-screen bg-slate-200 p-8 flex flex-col items-center relative">
      
      <Toast show={toast.show} msg={toast.msg} type={toast.type} />

      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        title={confirmModal.title} 
        message={confirmModal.message} 
        type={confirmModal.type} 
        onConfirm={confirmModal.onConfirm} 
        onCancel={() => setConfirmModal(prev => ({...prev, isOpen: false}))} 
      />

      <div className="max-w-[1200px] w-full bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col h-[95vh]">
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
          <div className="w-72 bg-slate-50 border-r border-slate-200 p-6 flex flex-col gap-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Menu Kategori</p>
            {menus.map((m) => (
              <button key={m.id}
                onClick={() => { setMenu(m.id); setViewMode("list"); }}
                className={`flex items-center gap-3 px-4 py-4 rounded-2xl font-bold text-sm transition-all duration-200 ${
                  menu === m.id ? (m.id === 'pilih' ? "bg-slate-800 text-white shadow-lg" : m.id === 'riwayat' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "bg-blue-600 text-white shadow-lg shadow-blue-200") : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto bg-slate-100 p-10 custom-scrollbar relative">
            <div className="bg-white mx-auto shadow-sm border border-slate-200 p-10 rounded-3xl w-full min-h-full transition-all">
              
              {menu === "pilih" && <PilihTemplate masterData={masterData} handleActiveChange={handleActiveChange} />}
              {menu === "profil" && <Profil masterData={masterData} viewMode={viewMode} setViewMode={setViewMode} formData={formData} setFormData={setFormData} triggerDelete={triggerDelete} />}
              {menu === "tujuan" && <Tujuan masterData={masterData} viewMode={viewMode} setViewMode={setViewMode} formData={formData} setFormData={setFormData} triggerDelete={triggerDelete} />}
              {menu === "ttd" && <Ttd masterData={masterData} viewMode={viewMode} setViewMode={setViewMode} formData={formData} setFormData={setFormData} triggerDelete={triggerDelete} />}
              {menu === "tembusan" && <Tembusan masterData={masterData} viewMode={viewMode} setViewMode={setViewMode} formData={formData} setFormData={setFormData} triggerDelete={triggerDelete} />}
              {menu === "kios" && <Kios masterData={masterData} viewMode={viewMode} setViewMode={setViewMode} formData={formData} setFormData={setFormData} triggerDelete={triggerDelete} />}
              {menu === "riwayat" && <Riwayat masterData={masterData} triggerDeleteHistory={triggerDeleteHistory} triggerLoadHistory={triggerLoadHistory} onReExportHistory={onReExportHistory} showToast={showToast} />}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}