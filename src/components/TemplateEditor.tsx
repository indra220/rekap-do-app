/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import { ArrowLeft, Save, CheckSquare, Building2, Send, PenTool, Copy, Database, Archive, Store } from "lucide-react"; 
import { SOData } from "@/types";
import Toast from "./Toast";
import ConfirmModal from "./ConfirmModal";
import PilihTemplate from "./tabs/PilihTemplate";
import Profil from "./tabs/Profil";
import Tujuan from "./tabs/Tujuan";
import Ttd from "./tabs/Ttd";
import Tembusan from "./tabs/Tembusan";
import Kios from "./tabs/Kios";
import Riwayat from "./tabs/Riwayat";

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function TemplateEditor({ masterData, setMasterData, onBack, onLoadHistory, onReExportHistory }: any) {
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
    { id: "pilih", label: "Pilih Template Aktif", icon: <CheckSquare size={16} /> },
    { id: "profil", label: "Data Profil & Metadata", icon: <Building2 size={16} /> },
    { id: "tujuan", label: "Data Tujuan Laporan", icon: <Send size={16} /> },
    { id: "ttd", label: "Data Otorisasi (TTD)", icon: <PenTool size={16} /> },
    { id: "tembusan", label: "Data Daftar Tembusan", icon: <Copy size={16} /> },
    { id: "kios", label: "Data Kios", icon: <Store size={16} /> },
    { id: "riwayat", label: "Riwayat Export", icon: <Archive size={16} /> },
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
      message: "Seluruh data snapshot yang tersimpan dalam riwayat ini akan dihapus permanen.",
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
      message: "Peringatan: Data di Dashboard saat ini akan ditimpa dengan riwayat ini. Lanjutkan?",
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
    showToast("Template aktif berhasil diterapkan.", "success");
  };

  return (
    <div className="h-screen w-screen bg-slate-950 p-4 flex flex-col overflow-hidden text-slate-200 font-sans">
      
      <Toast show={toast.show} msg={toast.msg} type={toast.type} />

      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        title={confirmModal.title} 
        message={confirmModal.message} 
        type={confirmModal.type} 
        onConfirm={confirmModal.onConfirm} 
        onCancel={() => setConfirmModal(prev => ({...prev, isOpen: false}))} 
      />

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded overflow-hidden flex flex-col shadow-2xl">
        {/* Header Ribbon */}
        <div className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded text-slate-400 transition"><ArrowLeft size={18}/></button>
             <h2 className="font-bold text-sm tracking-widest uppercase text-slate-200">Master Data Configuration</h2>
          </div>
          {viewMode === 'form' ? (
            <div className="flex gap-2">
                <button onClick={() => setViewMode("list")} className="px-4 py-1.5 rounded text-xs font-bold text-slate-400 hover:text-white border border-transparent hover:border-slate-700">
                  BATAL
                </button>
                <button onClick={handleSaveForm} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-2">
                  <Save size={14}/> SIMPAN DATA
                </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded text-[11px] text-slate-400 font-bold tracking-wider">
                <Database size={12}/> DATA TERSIMPAN LOKAL
            </div>
          )}
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-slate-900 border-r border-slate-800 p-2 space-y-1">
            {menus.map((m) => (
              <button key={m.id} onClick={() => { setMenu(m.id); setViewMode("list"); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded text-[13px] font-medium transition ${menu === m.id ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-800/50"}`}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {/* Konten Tab */}
          <div className="flex-1 overflow-auto bg-slate-950 p-8 custom-scrollbar">
            <div className="max-w-4xl mx-auto">
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