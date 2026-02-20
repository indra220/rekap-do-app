/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, Trash2, FileSpreadsheet, CornerDownRight, Box, RefreshCw, CheckCircle2, X, CheckSquare, Square, Upload, Eye } from "lucide-react";

import { PenyaluranData, SOData } from "@/types";
import { generateId, formatDesimal } from "@/utils/helpers";
import { defaultTemplate, APP_VERSION } from "@/constants/data";
import TemplateEditor from "@/components/TemplateEditor";
import UpdateView from "@/components/UpdateView";
import ImportExcel from "@/components/ImportExcel";
import { exportToExcel, exportToPDF } from "@/utils/exporter";

// IMPORT KOMPONEN GLOBAL
import Toast from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";
import PreviewExportModal from "@/components/PreviewExportModal";

declare global {
  interface Window {
    ipcRenderer: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      send: (channel: string, ...args: any[]) => void;
      on: (channel: string, listener: (...args: any[]) => void) => void;
      removeListener: (channel: string, listener: (...args: any[]) => void) => void;
    };
  }
}

let ipcRenderer: any = null;
if (typeof window !== "undefined" && (window as any).require) {
  ipcRenderer = (window as any).require("electron").ipcRenderer;
}

const defaultMasterData = {
  profiles: [{ id: 'default', nama_preset: 'Profil Utama', ...defaultTemplate }],
  tujuans: [{ id: 'default', nama_preset: 'Tujuan Utama', ...defaultTemplate }],
  ttds: [{ id: 'default', nama_preset: 'TTD Utama', ...defaultTemplate }],
  tembusans: [{ id: 'default', nama_preset: 'Tembusan Utama', list: defaultTemplate.tembusan || [] }],
  active: { profileId: 'default', tujuanId: 'default', ttdId: 'default', tembusanId: 'default' },
  exportHistory: [],
  kiosList: [] 
};

export default function Home() {
  const [view, setView] = useState<"dashboard" | "template" | "update">("dashboard");
  const [isSyncing, setIsSyncing] = useState(true);
  
  // STATE NOTIFIKASI (TOAST)
  const [toast, setToast] = useState<{show: boolean, msg: string, type: 'success' | 'error'}>({show: false, msg: '', type: 'success'});
  
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [periode, setPeriode] = useState(new Date().toISOString().slice(0, 10));
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; title: string; message: string; type: 'danger' | 'warning'; onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", type: 'danger', onConfirm: () => {} });

  const [masterData, setMasterData] = useState<any>(defaultMasterData);
  const [soList, setSoList] = useState<SOData[]>([{ id: generateId(), tanggalSO: "", noSO: "", kecamatan: "", stokAwal: 0, pengadaan: 0, penyaluranList: [] }]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [isChecking, setIsChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [statusDownload, setStatusDownload] = useState<"standby" | "downloading" | "ready">("standby");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [hasUpdateNotification, setHasUpdateNotification] = useState(false);

  const focusTargetIdRef = useRef<string | null>(null);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const activeTemplate = React.useMemo(() => {
    const p = masterData.profiles?.find((x: any) => x.id === masterData.active.profileId) || masterData.profiles?.[0] || {};
    const t = masterData.tujuans?.find((x: any) => x.id === masterData.active.tujuanId) || masterData.tujuans?.[0] || {};
    const ttd = masterData.ttds?.find((x: any) => x.id === masterData.active.ttdId) || masterData.ttds?.[0] || {};
    const tem = masterData.tembusans?.find((x: any) => x.id === masterData.active.tembusanId) || masterData.tembusans?.[0] || { list: [] };

    return { ...defaultTemplate, ...p, ...t, ...ttd, tembusan: tem.list || [] };
  }, [masterData]);

  useEffect(() => {
    if (!ipcRenderer) return;
    const handleUpdateChecking = () => setIsChecking(true);
    const handleUpdateAvailable = (_event: any, info: any) => { setUpdateInfo(info); setHasUpdateNotification(true); setIsChecking(false); };
    const handleUpdateNotAvailable = () => { setUpdateInfo(null); setIsChecking(false); setHasUpdateNotification(false); };
    const handleDownloadProgress = (_event: any, progressObj: any) => { setStatusDownload("downloading"); setDownloadProgress(Math.floor(progressObj.percent)); };
    const handleUpdateDownloaded = () => { setStatusDownload("ready"); setDownloadProgress(100); };
    const handleUpdateError = (_event: any, errorMsg: string) => { alert("Gagal update: " + errorMsg); setStatusDownload("standby"); };

    ipcRenderer.on('update-sedang-dicek', handleUpdateChecking);
    ipcRenderer.on('update-tersedia', handleUpdateAvailable);
    ipcRenderer.on('update-tidak-ada', handleUpdateNotAvailable);
    ipcRenderer.on('update-download-progress', handleDownloadProgress);
    ipcRenderer.on('update-selesai-didownload', handleUpdateDownloaded);
    ipcRenderer.on('update-error', handleUpdateError);
    return () => {
      ipcRenderer.removeAllListeners('update-sedang-dicek');
      ipcRenderer.removeAllListeners('update-tersedia');
      ipcRenderer.removeAllListeners('update-tidak-ada');
      ipcRenderer.removeAllListeners('update-download-progress');
      ipcRenderer.removeAllListeners('update-selesai-didownload');
      ipcRenderer.removeAllListeners('update-error');
    };
  }, []);

  useEffect(() => {
    if (!ipcRenderer) { setIsSyncing(false); return; }
    (async () => {
      try {
        // PERUBAHAN: Hanya memuat `template`, sengaja TIDAK memuat `solist` agar selalu ter-reset
        const { template } = await ipcRenderer.invoke('db-get-init');
        if (template) {
          if (!template.profiles) {
            setMasterData({
              profiles: [{ id: 'legacy', nama_preset: 'Data Lama', ...template }],
              tujuans: [{ id: 'legacy', nama_preset: 'Data Lama', ...template }],
              ttds: [{ id: 'legacy', nama_preset: 'Data Lama', ...template }],
              tembusans: [{ id: 'legacy', nama_preset: 'Data Lama', list: template.tembusan || [] }],
              active: { profileId: 'legacy', tujuanId: 'legacy', ttdId: 'legacy', tembusanId: 'legacy' },
              exportHistory: [],
              kiosList: []
            });
          } else {
            setMasterData({ ...template, exportHistory: template.exportHistory || [], kiosList: template.kiosList || [] });
          }
        }
        
        // Membersihkan data soList di database lokal saat aplikasi dimulai ulang
        ipcRenderer.invoke('db-save', { table: 'solistdata', id: 'current_session', data: [] });

      } catch (err) { console.error(err); } finally { setIsSyncing(false); }
    })();
  }, []);

  useEffect(() => {
    if (!isSyncing && ipcRenderer && view === "dashboard") {
      const timer = setTimeout(() => { 
        ipcRenderer.invoke('db-save', { table: 'rekapdotemplate', id: 'current_session', data: masterData });
        ipcRenderer.invoke('db-save', { table: 'solistdata', id: 'current_session', data: soList }); 
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [soList, masterData, isSyncing, view]);

  useEffect(() => {
    if (focusTargetIdRef.current && inputRefs.current[focusTargetIdRef.current]) {
      inputRefs.current[focusTargetIdRef.current]?.focus();
      focusTargetIdRef.current = null;
    }
  }, [soList]);

  const handleDataImported = (importedData: SOData[]) => {
    setSoList(prev => [...prev.filter(p => p.noSO !== ""), ...importedData]);
    
    let isKiosUpdated = false;
    const updatedKiosList = [...(masterData.kiosList || [])];

    importedData.forEach(so => {
      so.penyaluranList.forEach(peny => {
        if (peny.pengecer && peny.pengecer.trim() !== "") {
          const exists = updatedKiosList.find(k => k.namaKios.toLowerCase() === peny.pengecer.trim().toLowerCase());
          if (!exists) {
            updatedKiosList.push({ id: generateId(), namaKios: peny.pengecer.trim(), kecamatan: so.kecamatan || "" });
            isKiosUpdated = true;
          } else if (!exists.kecamatan && so.kecamatan) {
             exists.kecamatan = so.kecamatan;
             isKiosUpdated = true;
          }
        }
      });
    });

    if (isKiosUpdated) {
      const newMasterData = { ...masterData, kiosList: updatedKiosList };
      setMasterData(newMasterData);
      if (ipcRenderer) {
        ipcRenderer.invoke('db-save', { table: 'rekapdotemplate', id: 'current_session', data: newMasterData });
      }
    }

    showToast("Data Excel/CSV berhasil di-import!", "success");
  };

  const getModifiedSoListForExport = () => {
    const prefix = activeTemplate.no_so_prefix || "";
    if (!prefix) return soList;
    return soList.map(so => ({
      ...so,
      noSO: (so.noSO && !so.noSO.startsWith(prefix)) ? `${prefix}${so.noSO}` : so.noSO
    }));
  };

  const executeExport = (format: 'EXCEL' | 'PDF') => {
    try {
      const dataToExport = getModifiedSoListForExport();
      
      if (format === 'EXCEL') exportToExcel(dataToExport, activeTemplate, periode);
      if (format === 'PDF') exportToPDF(dataToExport, activeTemplate, periode);

      const newHistoryRecord = {
        id: generateId(),
        waktu_export: new Date().toISOString(),
        periode_laporan: periode,
        jenis_pupuk: activeTemplate.jenis_pupuk || "Tanpa Nama",
        format: format,
        total_do: dataToExport.length,
        total_pengadaan: dataToExport.reduce((acc, so) => acc + (so.pengadaan || 0), 0),
        total_penyaluran: dataToExport.reduce((acc, so) => acc + so.penyaluranList.reduce((a, b) => a + (b.penyaluran || 0), 0), 0),
        data_snapshot: dataToExport 
      };

      const updatedMasterData = { 
        ...masterData, 
        exportHistory: [newHistoryRecord, ...(masterData.exportHistory || [])] 
      };
      
      setMasterData(updatedMasterData);
      if (ipcRenderer) {
        ipcRenderer.invoke('db-save', { table: 'rekapdotemplate', id: 'current_session', data: updatedMasterData });
      }

      const emptySoList = [{ id: generateId(), tanggalSO: "", noSO: "", kecamatan: "", stokAwal: 0, pengadaan: 0, penyaluranList: [] }];
      setSoList(emptySoList);
      
      setIsPreviewModalOpen(false);
      showToast(`Berhasil di-export ke ${format} & data telah di-reset!`, "success");
    } catch (error) {
      showToast(`Gagal melakukan export data.`, "error");
    }
  };

  const openUpdatePage = () => { setHasUpdateNotification(false); setView("update"); };
  const triggerDownload = () => { setStatusDownload("downloading"); if (ipcRenderer) ipcRenderer.send('mulai-download-update'); };
  const handleKeyDown = (e: React.KeyboardEvent, soId: string) => { if (e.key === "Enter") { e.preventDefault(); addPenyaluran(soId); } };
  const addSO = () => { const newId = generateId(); setSoList([...soList, { id: newId, tanggalSO: "", noSO: "", kecamatan: "", stokAwal: 0, pengadaan: 0, penyaluranList: [] }]); focusTargetIdRef.current = newId; };
  const addPenyaluran = (soId: string) => { const newId = generateId(); setSoList(soList.map(so => so.id === soId ? {...so, penyaluranList: [...so.penyaluranList, {id: newId, tglSalur: "", pengecer: "", penyaluran: 0}]} : so)); focusTargetIdRef.current = newId; };
  const removeSO = (id: string) => soList.length > 1 && setSoList(soList.filter(s => s.id !== id));
  const removePenyaluran = (soId: string, salurId: string) => setSoList(soList.map(so => so.id === soId ? {...so, penyaluranList: so.penyaluranList.filter(s => s.id !== salurId)} : so));
  const updateSO = (id: string, field: keyof SOData, value: string | number) => setSoList(soList.map(so => so.id === id ? { ...so, [field]: value } : so));
  const updatePenyaluran = (soId: string, salurId: string, field: keyof PenyaluranData, value: string | number) => setSoList(soList.map(so => so.id === soId ? {...so, penyaluranList: so.penyaluranList.map(s => s.id === salurId ? {...s, [field]: value} : s)} : so));
  const toggleSelectAll = () => { const allIds: string[] = []; soList.forEach(so => { allIds.push(so.id); so.penyaluranList.forEach(p => allIds.push(p.id)); }); setSelectedIds(selectedIds.length === allIds.length ? [] : allIds); };
  const toggleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  
  const deleteSelected = () => { 
    setConfirmModal({
      isOpen: true,
      title: `Hapus ${selectedIds.length} Item?`,
      message: "Data yang dihapus akan hilang dari tampilan. Pastikan Anda memilih data yang benar.",
      type: 'danger',
      onConfirm: () => {
        setSoList(prev => { 
          const f = prev.filter(so => !selectedIds.includes(so.id)); 
          const u = f.map(so => ({ ...so, penyaluranList: so.penyaluranList.filter(p => !selectedIds.includes(p.id)) })); 
          return u.length > 0 ? u : [{ id: generateId(), tanggalSO: "", noSO: "", kecamatan: "", stokAwal: 0, pengadaan: 0, penyaluranList: [] }]; 
        }); 
        setSelectedIds([]);
        setConfirmModal(prev => ({...prev, isOpen: false}));
        showToast("Data terpilih berhasil dihapus.", "success");
      }
    });
  };

  if (view === "template") {
    return (
      <TemplateEditor 
        masterData={masterData} 
        setMasterData={setMasterData} 
        onBack={() => setView("dashboard")} 
        onLoadHistory={(data, periodeH) => {
          setSoList(data);
          setPeriode(periodeH);
          setView("dashboard");
        }}
        onReExportHistory={(format, data, periodeH) => {
          if (format === 'EXCEL') exportToExcel(data, activeTemplate, periodeH);
          if (format === 'PDF') exportToPDF(data, activeTemplate, periodeH);
        }}
      />
    );
  }
  
  if (view === "update") return <UpdateView infoUpdate={updateInfo} isChecking={isChecking} statusDownload={statusDownload} progress={downloadProgress} onStartDownload={triggerDownload} onBack={() => setView("dashboard")} />;

  const inputClass = "w-full bg-transparent border-none focus:ring-0 px-2 py-1 text-sm font-bold text-slate-800 outline-none";

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-8 relative">
      
      <Toast show={toast.show} msg={toast.msg} type={toast.type} />

      {isImportModalOpen && <ImportExcel onDataLoaded={handleDataImported} onClose={() => setIsImportModalOpen(false)} />}

      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        title={confirmModal.title} 
        message={confirmModal.message} 
        type={confirmModal.type} 
        confirmText="Hapus Sekarang"
        onConfirm={confirmModal.onConfirm} 
        onCancel={() => setConfirmModal(prev => ({...prev, isOpen: false}))} 
      />

      <PreviewExportModal 
        isOpen={isPreviewModalOpen}
        dataList={getModifiedSoListForExport()}
        onCancel={() => setIsPreviewModalOpen(false)}
        onExport={executeExport}
      />

      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex justify-between items-center relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-600 rounded-l-3xl"></div>
          <div className="flex items-center gap-5">
            <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-xl shadow-blue-200"><FileSpreadsheet size={32} /></div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight italic">Rekapitulasi DO {activeTemplate.jenis_pupuk || ""}</h1>
              <div className="flex items-center gap-2 mt-1">
                {isSyncing ? 
                  <span className="text-[10px] text-blue-500 font-black uppercase animate-pulse flex items-center gap-1"><RefreshCw size={12} className="animate-spin"/> Syncing...</span> : 
                  <span className="text-[10px] text-emerald-600 font-black uppercase flex items-center gap-1"><CheckCircle2 size={12}/> Database Active</span>
                }
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={openUpdatePage} className={`relative bg-white border ${hasUpdateNotification ? 'border-orange-500 text-orange-600' : 'border-slate-200 text-slate-500'} px-6 py-2.5 rounded-2xl font-black text-sm hover:bg-slate-50 transition flex items-center gap-2`}>
              Update v{APP_VERSION}
              {hasUpdateNotification && <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] text-white animate-bounce border-2 border-white font-black">!</span>}
            </button>
            
            <button onClick={() => setView("template")} className="bg-slate-100 px-6 py-2.5 rounded-2xl font-black text-sm text-slate-700 hover:bg-slate-200 transition border border-slate-200 shadow-sm">
              Menu Data
            </button>

            <input type="date" className="border border-slate-200 px-4 py-2.5 rounded-2xl text-sm font-black bg-slate-50 text-slate-900 outline-none" value={periode} onChange={e => setPeriode(e.target.value)} />
            
            <div className="relative flex gap-2">
              <button onClick={() => setIsImportModalOpen(true)} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-emerald-700 transition shadow-xl shadow-emerald-200 uppercase text-xs tracking-widest flex items-center gap-2 border-2 border-emerald-500">
                <Upload size={16}/> Import
              </button>
              
              <button onClick={() => setIsPreviewModalOpen(true)} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-blue-700 transition shadow-xl shadow-blue-200 uppercase text-xs tracking-widest flex items-center gap-2 border-2 border-blue-500">
                <Eye size={18}/> Preview Laporan
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-220px)] relative">
          <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white z-20">
            <div className="flex items-center gap-4">
              <h2 className="font-black text-lg flex items-center gap-2 text-slate-800 uppercase tracking-tighter"><Box size={24} className="text-blue-600"/> Data Input Transaksi</h2>
              {selectedIds.length > 0 && (
                <button onClick={deleteSelected} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-red-600 hover:text-white transition-all"><Trash2 size={14}/> Hapus Terpilih ({selectedIds.length})</button>
              )}
            </div>
            <button onClick={addSO} className="bg-slate-900 text-white px-8 py-2.5 rounded-xl flex items-center gap-2 text-sm font-black hover:bg-slate-800 transition shadow-lg"><Plus size={20}/> Tambah DO Baru</button>
          </div>

          <div className="overflow-auto flex-1 custom-scrollbar pb-36">
            <table className="w-full min-w-[1500px] text-sm text-left border-collapse table-fixed">
              <thead className="text-[11px] text-slate-900 uppercase bg-slate-50 sticky top-0 z-30 border-b border-slate-300 font-black">
                <tr>
                  <th className="w-12 text-center border-r border-slate-300"><button onClick={toggleSelectAll} className="p-1.5">{selectedIds.length > 0 && selectedIds.length === (soList.length + soList.reduce((a,b)=>a+b.penyaluranList.length, 0)) ? <CheckSquare size={18}/> : <Square size={18}/>}</button></th>
                  <th className="w-14 text-center border-r border-slate-300 py-4">No</th>
                  <th className="w-40 px-3 border-r border-slate-200">Tanggal SO</th>
                  <th className="w-56 px-3 border-r border-slate-200 text-blue-800">NO SO/TGL SALUR</th>
                  <th className="w-64 px-3 border-r border-slate-200">Pengecer</th>
                  <th className="w-44 px-3 border-r border-slate-200">Kecamatan</th>
                  <th className="w-32 px-3 border-r border-slate-200 text-right">Stok Awal</th>
                  <th className="w-32 px-3 border-r border-slate-200 text-right text-emerald-800">Pengadaan</th>
                  <th className="w-32 px-3 border-r border-slate-200 text-right text-orange-800">Penyaluran</th>
                  <th className="w-36 px-3 text-right text-blue-900 bg-blue-50/50">Stok Akhir</th>
                  <th className="w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {soList.map((so, idx) => {
                  let runningCur = (so.stokAwal || 0) + (so.pengadaan || 0);
                  const isSoSelected = selectedIds.includes(so.id);
                  return (
                    <React.Fragment key={so.id}>
                      <tr className={`group transition-colors border-b-2 border-slate-100 ${isSoSelected ? 'bg-blue-50/50' : 'bg-white'}`}>
                        <td className="text-center border-r border-slate-300"><button onClick={() => toggleSelect(so.id)}>{isSoSelected ? <CheckSquare size={18}/> : <Square size={18}/>}</button></td>
                        <td className="text-center font-black text-slate-900 border-r border-slate-300 bg-slate-50/50 text-base">{idx + 1}</td>
                        <td className="border-r border-slate-100"><input type="date" ref={el => { if (el) inputRefs.current[so.id] = el; }} className={inputClass} value={so.tanggalSO} onChange={e => updateSO(so.id, "tanggalSO", e.target.value)} onKeyDown={(e) => handleKeyDown(e, so.id)} /></td>
                        
                        <td className="border-r border-slate-100 bg-blue-50/20">
                          <div className="flex items-center px-2">
                            {activeTemplate.no_so_prefix && (
                              <span className="text-blue-900/40 font-black text-[13px] mr-0.5 tracking-wider select-none">
                                {activeTemplate.no_so_prefix}
                              </span>
                            )}
                            <input 
                              type="text" 
                              className={`${inputClass} text-blue-800 uppercase px-0 tracking-wider`} 
                              placeholder="NO SO..." 
                              value={so.noSO} 
                              onChange={e => updateSO(so.id, "noSO", e.target.value)} 
                              onKeyDown={(e) => handleKeyDown(e, so.id)} 
                            />
                          </div>
                        </td>

                        <td className="border-r border-slate-100 bg-slate-50"></td>
                        <td className="border-r border-slate-100"><input type="text" className={inputClass} placeholder="Kecamatan..." value={so.kecamatan} onChange={e => updateSO(so.id, "kecamatan", e.target.value)} onKeyDown={(e) => handleKeyDown(e, so.id)} /></td>
                        <td className="border-r border-slate-100"><input type="number" step="any" className={`${inputClass} text-right`} value={so.stokAwal || ""} onChange={e => updateSO(so.id, "stokAwal", parseFloat(e.target.value) || 0)} onKeyDown={(e) => handleKeyDown(e, so.id)} /></td>
                        <td className="border-r border-slate-100"><input type="number" step="any" className={`${inputClass} text-right text-emerald-700`} value={so.pengadaan || ""} onChange={e => updateSO(so.id, "pengadaan", parseFloat(e.target.value) || 0)} onKeyDown={(e) => handleKeyDown(e, so.id)} /></td>
                        <td className="border-r border-slate-100 bg-slate-50"></td>
                        <td className="px-3 font-black text-right text-blue-900 bg-blue-50/50 tabular-nums">{formatDesimal(runningCur)}</td>
                        <td className="px-2 flex justify-center gap-1 opacity-0 group-hover:opacity-100"><button onClick={() => addPenyaluran(so.id)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white"><Plus size={14}/></button><button onClick={() => removeSO(so.id)} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"><Trash2 size={14}/></button></td>
                      </tr>
                      {so.penyaluranList.map((det) => {
                        runningCur -= (det.penyaluran || 0);
                        const isDetSelected = selectedIds.includes(det.id);
                        return (
                          <tr key={det.id} className={`transition-colors ${isDetSelected ? 'bg-blue-50/30' : 'bg-slate-50/30 hover:bg-slate-100'}`}>
                            <td className="text-center border-r border-slate-300"><button onClick={() => toggleSelect(det.id)}>{isDetSelected ? <CheckSquare size={18}/> : <Square size={18}/>}</button></td>
                            <td className="border-r border-slate-300 bg-slate-50/30"></td><td className="border-r border-slate-100"></td>
                            <td className="border-r border-slate-100 flex items-center px-1">
                                <CornerDownRight size={14} className="text-slate-300 mr-1 shrink-0" />
                                <input type="date" ref={el => { if (el) inputRefs.current[det.id] = el; }} className={inputClass + " bg-transparent"} value={det.tglSalur} onChange={e => updatePenyaluran(so.id, det.id, "tglSalur", e.target.value)} onKeyDown={(e) => handleKeyDown(e, so.id)} />
                            </td>
                            <td className="border-r border-slate-100"><input type="text" className={inputClass} placeholder="Pengecer..." value={det.pengecer} onChange={e => updatePenyaluran(so.id, det.id, "pengecer", e.target.value)} onKeyDown={(e) => handleKeyDown(e, so.id)} /></td>
                            <td colSpan={3} className="border-r border-slate-100"></td>
                            <td className="border-r border-slate-100"><input type="number" step="any" className={`${inputClass} text-right text-orange-700`} value={det.penyaluran || ""} onChange={e => updatePenyaluran(so.id, det.id, "penyaluran", parseFloat(e.target.value) || 0)} onKeyDown={(e) => handleKeyDown(e, so.id)} /></td>
                            <td className="px-3 text-right font-bold text-slate-500 tabular-nums">{formatDesimal(runningCur)}</td>
                            <td className="px-2 flex justify-center"><button onClick={() => removePenyaluran(so.id, det.id)} className="p-1 text-slate-300 hover:text-red-500"><X size={14}/></button></td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-8 z-20 flex justify-between items-center shadow-2xl">
             <div className="flex gap-10">
                <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100"><p className="text-[10px] text-slate-400 font-black uppercase mb-1">Total DO</p><p className="text-2xl font-black text-slate-800 leading-none">{soList.length}</p></div>
                <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100"><p className="text-[10px] text-emerald-500 font-black uppercase mb-1">Total Pengadaan</p><p className="text-2xl font-black text-emerald-700 leading-none">{formatDesimal(soList.reduce((acc, so) => acc + (so.pengadaan || 0), 0))}</p></div>
             </div>
             <div className="text-right border-l border-slate-100 pl-16"><p className="text-[10px] text-slate-400 font-black uppercase mb-1">Total Penyaluran</p><p className="text-5xl font-black text-orange-700 leading-none tracking-tighter">{formatDesimal(soList.reduce((acc, so) => acc + so.penyaluranList.reduce((a, b) => a + (b.penyaluran || 0), 0), 0))}</p></div>
          </div>
        </div>
      </div>

    </div>
  );
}