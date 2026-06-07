/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, Trash2, FileSpreadsheet, CornerDownRight, RefreshCw, CheckCircle2, X, CheckSquare, Square, Upload, Eye, Settings, DownloadCloud } from "lucide-react";

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

const defaultProfile = {
  code: defaultTemplate.code, provinsi: defaultTemplate.provinsi, nama_perusahaan: defaultTemplate.nama_perusahaan,
  alamat_perusahaan: defaultTemplate.alamat_perusahaan, telp: defaultTemplate.telp, email: defaultTemplate.email,
  kabupaten: defaultTemplate.kabupaten, jenis_pupuk: defaultTemplate.jenis_pupuk
};

const defaultTujuan = {
  kepada: defaultTemplate.kepada, penerima_1: defaultTemplate.penerima_1, penerima_2: defaultTemplate.penerima_2,
  alamat_penerima_1: defaultTemplate.alamat_penerima_1, alamat_penerima_2: defaultTemplate.alamat_penerima_2
};

const defaultTtd = {
  direktur: defaultTemplate.direktur, jabatan: defaultTemplate.jabatan
};

const defaultMasterData = {
  profiles: [{ id: 'default', nama_preset: 'Profil Utama', ...defaultProfile }],
  tujuans: [{ id: 'default', nama_preset: 'Tujuan Utama', ...defaultTujuan }],
  ttds: [{ id: 'default', nama_preset: 'TTD Utama', ...defaultTtd }],
  tembusans: [{ id: 'default', nama_preset: 'Tembusan Utama', list: defaultTemplate.tembusan || [] }],
  active: { profileId: 'default', tujuanId: 'default', ttdId: 'default', tembusanId: 'default' },
  exportHistory: [],
  kiosList: [] 
};

export default function Home() {
  const [view, setView] = useState<"dashboard" | "template" | "update">("dashboard");
  const [isSyncing, setIsSyncing] = useState(true);
  
  // STATE NOTIFIKASI
  const [toast, setToast] = useState<{show: boolean, msg: string, type: 'success' | 'error'}>({show: false, msg: '', type: 'success'});
  
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  const [tanggalTtd, setTanggalTtd] = useState(new Date().toISOString().slice(0, 10));
  const [tanggalPeriode, setTanggalPeriode] = useState(new Date().toISOString().slice(0, 10));
  
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
    const active = masterData?.active || {};
    const rawP = active.profileId === 'none' ? {} : (masterData.profiles?.find((x: any) => x.id === active.profileId) || {});
    const rawT = active.tujuanId === 'none' ? {} : (masterData.tujuans?.find((x: any) => x.id === active.tujuanId) || {});
    const rawTtd = active.ttdId === 'none' ? {} : (masterData.ttds?.find((x: any) => x.id === active.ttdId) || {});
    const rawTem = active.tembusanId === 'none' ? { list: [] } : (masterData.tembusans?.find((x: any) => x.id === active.tembusanId) || { list: [] });

    return { 
      code: rawP.code || "", provinsi: rawP.provinsi || "", nama_perusahaan: rawP.nama_perusahaan || "",
      alamat_perusahaan: rawP.alamat_perusahaan || "", telp: rawP.telp || "", email: rawP.email || "",
      kabupaten: rawP.kabupaten || "", jenis_pupuk: rawP.jenis_pupuk || "", no_so_prefix: rawP.no_so_prefix || "",
      phonska_a1: rawP.phonska_a1 || "", phonska_a2: rawP.phonska_a2 || "", phonska_a3: rawP.phonska_a3 || "",
      phonska_a4: rawP.phonska_a4 || "", kepada: rawT.kepada || "", penerima_1: rawT.penerima_1 || "",
      penerima_2: rawT.penerima_2 || "", alamat_penerima_1: rawT.alamat_penerima_1 || "", alamat_penerima_2: rawT.alamat_penerima_2 || "",
      direktur: rawTtd.direktur || "", jabatan: rawTtd.jabatan || "", tembusan: rawTem.list || []
    };
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
      ipcRenderer.removeAllListeners('update-sedang-dicek'); ipcRenderer.removeAllListeners('update-tersedia');
      ipcRenderer.removeAllListeners('update-tidak-ada'); ipcRenderer.removeAllListeners('update-download-progress');
      ipcRenderer.removeAllListeners('update-selesai-didownload'); ipcRenderer.removeAllListeners('update-error');
    };
  }, []);

  useEffect(() => {
    if (!ipcRenderer) { setIsSyncing(false); return; }
    (async () => {
      try {
        const { template } = await ipcRenderer.invoke('db-get-init');
        if (template) {
          if (!template.profiles) {
            setMasterData({
              profiles: [{ id: 'legacy', nama_preset: 'Data Lama', ...defaultProfile }],
              tujuans: [{ id: 'legacy', nama_preset: 'Data Lama', ...defaultTujuan }],
              ttds: [{ id: 'legacy', nama_preset: 'Data Lama', ...defaultTtd }],
              tembusans: [{ id: 'legacy', nama_preset: 'Data Lama', list: defaultTemplate.tembusan || [] }],
              active: { profileId: 'legacy', tujuanId: 'legacy', ttdId: 'legacy', tembusanId: 'legacy' },
              exportHistory: [], kiosList: []
            });
          } else {
            const safeActive = {
              profileId: template.active?.profileId || 'default', tujuanId: template.active?.tujuanId || 'default',
              ttdId: template.active?.ttdId || 'default', tembusanId: template.active?.tembusanId || 'default'
            };
            setMasterData({ ...template, active: safeActive, exportHistory: template.exportHistory || [], kiosList: template.kiosList || [] });
          }
        }
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
             exists.kecamatan = so.kecamatan; isKiosUpdated = true;
          }
        }
      });
    });

    if (isKiosUpdated) {
      const newMasterData = { ...masterData, kiosList: updatedKiosList };
      setMasterData(newMasterData);
      if (ipcRenderer) ipcRenderer.invoke('db-save', { table: 'rekapdotemplate', id: 'current_session', data: newMasterData });
    }
    showToast("Data Excel/CSV berhasil di-import!", "success");
  };

  const getModifiedSoListForExport = () => {
    const prefix = activeTemplate.no_so_prefix || "";
    if (!prefix) return soList;
    return soList.map(so => ({ ...so, noSO: (so.noSO && !so.noSO.startsWith(prefix)) ? `${prefix}${so.noSO}` : so.noSO }));
  };

  const executeExport = (format: 'EXCEL' | 'PDF') => {
    try {
      const dataToExport = getModifiedSoListForExport();
      const templateWithPeriode = { ...activeTemplate, tanggal_periode: tanggalPeriode };
      
      if (format === 'EXCEL') exportToExcel(dataToExport, templateWithPeriode, tanggalTtd);
      if (format === 'PDF') exportToPDF(dataToExport, templateWithPeriode, tanggalTtd);

      const newHistoryRecord = {
        id: generateId(), waktu_export: new Date().toISOString(), periode_laporan: tanggalPeriode, 
        jenis_pupuk: activeTemplate.jenis_pupuk || "Tanpa Nama", format: format, total_do: dataToExport.length,
        total_pengadaan: dataToExport.reduce((acc, so) => acc + (so.pengadaan || 0), 0),
        total_penyaluran: dataToExport.reduce((acc, so) => acc + so.penyaluranList.reduce((a, b) => a + (b.penyaluran || 0), 0), 0),
        data_snapshot: dataToExport 
      };

      const updatedMasterData = { ...masterData, exportHistory: [newHistoryRecord, ...(masterData.exportHistory || [])] };
      setMasterData(updatedMasterData);
      if (ipcRenderer) ipcRenderer.invoke('db-save', { table: 'rekapdotemplate', id: 'current_session', data: updatedMasterData });

      setSoList([{ id: generateId(), tanggalSO: "", noSO: "", kecamatan: "", stokAwal: 0, pengadaan: 0, penyaluranList: [] }]);
      setIsPreviewModalOpen(false);
      showToast(`Berhasil di-export ke ${format} & data telah di-reset!`, "success");
    } catch (error) { showToast(`Gagal melakukan export data.`, "error"); }
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
      isOpen: true, title: `Hapus ${selectedIds.length} Baris?`, message: "Data yang dihapus akan hilang permanen dari lembar kerja saat ini.", type: 'danger',
      onConfirm: () => {
        setSoList(prev => { 
          const f = prev.filter(so => !selectedIds.includes(so.id)); 
          const u = f.map(so => ({ ...so, penyaluranList: so.penyaluranList.filter(p => !selectedIds.includes(p.id)) })); 
          return u.length > 0 ? u : [{ id: generateId(), tanggalSO: "", noSO: "", kecamatan: "", stokAwal: 0, pengadaan: 0, penyaluranList: [] }]; 
        }); 
        setSelectedIds([]); setConfirmModal(prev => ({...prev, isOpen: false})); showToast("Baris terpilih dihapus.", "success");
      }
    });
  };

  if (view === "template") {
    return (
      <TemplateEditor masterData={masterData} setMasterData={setMasterData} onBack={() => setView("dashboard")} 
        onLoadHistory={(data, periodeH) => { setSoList(data); setTanggalPeriode(periodeH); setTanggalTtd(new Date().toISOString().slice(0, 10)); setView("dashboard"); }}
        onReExportHistory={(format, data, periodeH) => {
          const templateWithPeriode = { ...activeTemplate, tanggal_periode: periodeH };
          if (format === 'EXCEL') exportToExcel(data, templateWithPeriode, tanggalTtd);
          if (format === 'PDF') exportToPDF(data, templateWithPeriode, tanggalTtd);
        }}
      />
    );
  }
  
  if (view === "update") return <UpdateView infoUpdate={updateInfo} isChecking={isChecking} statusDownload={statusDownload} progress={downloadProgress} onStartDownload={triggerDownload} onBack={() => setView("dashboard")} />;

  const inputCellClass = "w-full h-full bg-transparent px-3 py-1.5 outline-none focus:bg-blue-900/30 focus:ring-1 focus:ring-blue-500 focus:z-10 relative transition-none placeholder:text-slate-600 text-slate-200 [color-scheme:dark] text-[13px]";
  
  const thClass = "px-3 py-2 font-semibold text-[11px] text-slate-400 border-b border-r border-slate-800 bg-slate-900 tracking-wider sticky top-0 z-10";
  // Menghapus flex dari tdClass agar sifat asli tabel (table-cell) tidak rusak
  const tdClass = "border-b border-r border-slate-800 p-0 relative align-middle";
  const btnToolbarClass = "h-8 px-3 flex items-center gap-1.5 rounded text-[12px] font-medium border transition-colors focus:outline-none focus:ring-1 focus:ring-slate-500";

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-300 font-sans overflow-hidden selection:bg-blue-500/30">
      
      <Toast show={toast.show} msg={toast.msg} type={toast.type} />
      {isImportModalOpen && <ImportExcel onDataLoaded={handleDataImported} onClose={() => setIsImportModalOpen(false)} />}
      <ConfirmModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} confirmText="Hapus" onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(prev => ({...prev, isOpen: false}))} />
      <PreviewExportModal isOpen={isPreviewModalOpen} dataList={getModifiedSoListForExport()} templateInfo={{ ...activeTemplate, tanggal_periode: tanggalPeriode }} onCancel={() => setIsPreviewModalOpen(false)} onExport={executeExport} />

      {/* HEADER: TITLE BAR */}
      <header className="h-12 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded">
            <FileSpreadsheet size={16} className="text-white" />
          </div>
          <h1 className="text-sm font-semibold text-slate-100 tracking-wide">
            Rekapitulasi DO {activeTemplate.jenis_pupuk ? `- ${activeTemplate.jenis_pupuk}` : ""}
          </h1>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            {isSyncing ? <><RefreshCw size={12} className="animate-spin text-blue-400"/> Sinkronisasi...</> : <><CheckCircle2 size={12} className="text-emerald-500"/> DB Lokal Sinkron</>}
          </div>
          <div className="w-px h-4 bg-slate-800"></div>
          <button onClick={openUpdatePage} className={`flex items-center gap-1.5 hover:text-white transition-colors ${hasUpdateNotification ? 'text-orange-400 font-bold' : 'text-slate-400'}`}>
            <DownloadCloud size={14} />
            Versi {APP_VERSION}
            {hasUpdateNotification && <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse ml-1"></span>}
          </button>
        </div>
      </header>

      {/* TOOLBAR / RIBBON */}
      <div className="h-14 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-4 shrink-0">
        
        {/* Left Toolbar (Data Actions) */}
        <div className="flex items-center gap-2">
          <button onClick={addSO} className={`${btnToolbarClass} bg-blue-600 border-blue-500 text-white hover:bg-blue-500`}>
            <Plus size={14} /> Tambah DO
          </button>
          
          <div className="w-px h-6 bg-slate-700 mx-1"></div>
          
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded px-2 h-8">
            <span className="text-[10px] uppercase text-slate-500 font-semibold">Periode</span>
            <input type="date" className="bg-transparent text-xs text-slate-200 outline-none [color-scheme:dark]" value={tanggalPeriode} onChange={e => setTanggalPeriode(e.target.value)} />
          </div>
          
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded px-2 h-8">
            <span className="text-[10px] uppercase text-slate-500 font-semibold">Tgl TTD</span>
            <input type="date" className="bg-transparent text-xs text-slate-200 outline-none [color-scheme:dark]" value={tanggalTtd} onChange={e => setTanggalTtd(e.target.value)} />
          </div>

          {selectedIds.length > 0 && (
            <>
              <div className="w-px h-6 bg-slate-700 mx-1"></div>
              <button onClick={deleteSelected} className={`${btnToolbarClass} bg-red-950/50 border-red-900/50 text-red-400 hover:bg-red-900/50`}>
                <Trash2 size={14} /> Hapus ({selectedIds.length})
              </button>
            </>
          )}
        </div>

        {/* Right Toolbar (System Actions) */}
        <div className="flex items-center gap-2">
          <button onClick={() => setView("template")} className={`${btnToolbarClass} bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white`}>
            <Settings size={14} /> Master Data
          </button>
          <div className="w-px h-6 bg-slate-700 mx-1"></div>
          <button onClick={() => setIsImportModalOpen(true)} className={`${btnToolbarClass} bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-emerald-400`}>
            <Upload size={14} /> Import
          </button>
          <button onClick={() => setIsPreviewModalOpen(true)} className={`${btnToolbarClass} bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-blue-400`}>
            <Eye size={14} /> Preview Laporan
          </button>
        </div>
      </div>

      {/* WORKSPACE (DATA GRID) */}
      <main className="flex-1 overflow-auto bg-slate-950 custom-scrollbar relative">
        <table className="w-full min-w-[1500px] text-left border-collapse table-fixed">
          <thead>
            <tr>
              <th className={`${thClass} w-10 text-center`}><button onClick={toggleSelectAll} className="hover:text-blue-400 transition-colors">{selectedIds.length > 0 && selectedIds.length === (soList.length + soList.reduce((a,b)=>a+b.penyaluranList.length, 0)) ? <CheckSquare size={14}/> : <Square size={14}/>}</button></th>
              <th className={`${thClass} w-12 text-center`}>No</th>
              
              <th className={`${thClass} w-36`}>Tanggal SO</th>
              <th className={`${thClass} w-56 text-blue-400`}>No SO / Salur</th>
              <th className={`${thClass} w-64`}>Pengecer</th>
              <th className={`${thClass} w-40`}>Kecamatan</th>
              
              <th className={`${thClass} w-32 text-right`}>Stok Awal</th>
              <th className={`${thClass} w-32 text-right text-emerald-500`}>Pengadaan</th>
              <th className={`${thClass} w-32 text-right text-orange-500`}>Penyaluran</th>
              <th className={`${thClass} w-32 text-right text-blue-400 bg-slate-900`}>Stok Akhir</th>
              
              <th className={`${thClass} w-20 text-center`}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {soList.map((so, idx) => {
              let runningCur = (so.stokAwal || 0) + (so.pengadaan || 0);
              const isSoSelected = selectedIds.includes(so.id);
              return (
                <React.Fragment key={so.id}>
                  {/* Induk Row (Sales Order) */}
                  <tr className={`group ${isSoSelected ? 'bg-blue-900/20' : 'bg-slate-950 hover:bg-slate-900'}`}>
                    <td className={`${tdClass} text-center`}><button onClick={() => toggleSelect(so.id)} className="text-slate-500 hover:text-blue-400 mt-1.5">{isSoSelected ? <CheckSquare size={14}/> : <Square size={14}/>}</button></td>
                    <td className={`${tdClass} text-center text-[11px] font-medium text-slate-500 bg-slate-900/50`}>{idx + 1}</td>
                    
                    <td className={tdClass}>
                      <input type="date" ref={el => { if (el) inputRefs.current[so.id] = el; }} className={inputCellClass} value={so.tanggalSO} onChange={e => updateSO(so.id, "tanggalSO", e.target.value)} onKeyDown={(e) => handleKeyDown(e, so.id)} />
                    </td>
                    
                    {/* Perbaikan: Menggunakan <div> pembungkus flex di dalam <td> */}
                    <td className={`${tdClass} bg-slate-900/30`}>
                      <div className="flex items-center w-full h-full focus-within:bg-blue-900/30 focus-within:ring-1 focus-within:ring-blue-500 relative">
                        {activeTemplate.no_so_prefix && (
                          <span className="text-slate-500 font-semibold text-[11px] ml-3 tracking-widest select-none absolute left-0 z-0">
                            {activeTemplate.no_so_prefix}
                          </span>
                        )}
                        <input type="text" className={`${inputCellClass} text-blue-300 font-medium uppercase tracking-wider bg-transparent relative z-10 ${activeTemplate.no_so_prefix ? 'pl-12' : 'pl-3'} focus:bg-transparent focus:ring-0`} placeholder="NO SO..." value={so.noSO} onChange={e => updateSO(so.id, "noSO", e.target.value)} onKeyDown={(e) => handleKeyDown(e, so.id)} />
                      </div>
                    </td>

                    <td className={`${tdClass} bg-slate-900/50`}></td>
                    
                    <td className={tdClass}>
                      <input type="text" className={inputCellClass} placeholder="Kecamatan..." value={so.kecamatan} onChange={e => updateSO(so.id, "kecamatan", e.target.value)} onKeyDown={(e) => handleKeyDown(e, so.id)} />
                    </td>
                    
                    <td className={tdClass}>
                      <input type="number" step="any" className={`${inputCellClass} text-right font-medium text-slate-300`} value={so.stokAwal || ""} onChange={e => updateSO(so.id, "stokAwal", parseFloat(e.target.value) || 0)} onKeyDown={(e) => handleKeyDown(e, so.id)} placeholder="0" />
                    </td>
                    
                    <td className={tdClass}>
                      <input type="number" step="any" className={`${inputCellClass} text-right font-medium text-emerald-400`} value={so.pengadaan || ""} onChange={e => updateSO(so.id, "pengadaan", parseFloat(e.target.value) || 0)} onKeyDown={(e) => handleKeyDown(e, so.id)} placeholder="0" />
                    </td>
                    
                    <td className={`${tdClass} bg-slate-900/50`}></td>
                    
                    <td className={`${tdClass} text-right px-3 text-[13px] font-medium text-blue-400 bg-slate-900 tabular-nums`}>
                      {formatDesimal(runningCur)}
                    </td>
                    
                    <td className={`${tdClass} text-center`}>
                      <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                        <button onClick={() => addPenyaluran(so.id)} className="p-1.5 text-blue-400 hover:bg-blue-900/50 rounded" title="Tambah Penyaluran"><Plus size={14}/></button>
                        <button onClick={() => removeSO(so.id)} className="p-1.5 text-red-500 hover:bg-red-900/30 rounded" title="Hapus DO"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>

                  {/* Anak Row (Penyaluran) */}
                  {so.penyaluranList.map((det) => {
                    runningCur -= (det.penyaluran || 0);
                    const isDetSelected = selectedIds.includes(det.id);
                    return (
                      <tr key={det.id} className={`group ${isDetSelected ? 'bg-blue-900/30' : 'bg-[#0b0e14] hover:bg-slate-900'}`}>
                        <td className={`${tdClass} text-center`}><button onClick={() => toggleSelect(det.id)} className="text-slate-600 hover:text-blue-400 mt-1.5">{isDetSelected ? <CheckSquare size={14}/> : <Square size={14}/>}</button></td>
                        <td colSpan={2} className={`${tdClass} bg-slate-900/20`}></td>
                        
                        {/* Perbaikan: Menggunakan <div> pembungkus flex di dalam <td> */}
                        <td className={tdClass}>
                          <div className="flex items-center w-full h-full pl-2 focus-within:bg-blue-900/30 focus-within:ring-1 focus-within:ring-blue-500">
                            <CornerDownRight size={14} className="text-slate-600 mr-1 shrink-0" />
                            <input type="date" ref={el => { if (el) inputRefs.current[det.id] = el; }} className={`${inputCellClass} focus:ring-0 focus:bg-transparent`} value={det.tglSalur} onChange={e => updatePenyaluran(so.id, det.id, "tglSalur", e.target.value)} onKeyDown={(e) => handleKeyDown(e, so.id)} />
                          </div>
                        </td>
                        
                        <td className={tdClass}>
                          <input type="text" className={inputCellClass} placeholder="Nama Pengecer..." value={det.pengecer} onChange={e => updatePenyaluran(so.id, det.id, "pengecer", e.target.value)} onKeyDown={(e) => handleKeyDown(e, so.id)} />
                        </td>
                        
                        <td colSpan={3} className={`${tdClass} bg-slate-900/20`}></td>
                        
                        <td className={tdClass}>
                          <input type="number" step="any" className={`${inputCellClass} text-right font-medium text-orange-400`} value={det.penyaluran || ""} onChange={e => updatePenyaluran(so.id, det.id, "penyaluran", parseFloat(e.target.value) || 0)} onKeyDown={(e) => handleKeyDown(e, so.id)} placeholder="0" />
                        </td>
                        
                        <td className={`${tdClass} text-right px-3 text-[13px] text-slate-500 tabular-nums`}>
                          {formatDesimal(runningCur)}
                        </td>
                        
                        <td className={`${tdClass} text-center`}>
                          <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                            <button onClick={() => removePenyaluran(so.id, det.id)} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded"><X size={14}/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </main>

      {/* STATUS BAR (FOOTER) */}
      <footer className="h-10 border-t border-slate-800 bg-slate-950 flex items-center justify-between px-4 shrink-0 text-[11px] font-medium text-slate-400 select-none z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span>Total Baris SO:</span>
            <span className="text-slate-200 font-bold">{soList.length}</span>
          </div>
          <div className="w-px h-4 bg-slate-800"></div>
          <div className="flex items-center gap-2">
            <span>Total Pengadaan:</span>
            <span className="text-emerald-400 font-bold">{formatDesimal(soList.reduce((acc, so) => acc + (so.pengadaan || 0), 0))}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span>Total Penyaluran Keluar:</span>
          <span className="text-orange-400 font-bold text-xs bg-orange-950/30 border border-orange-900/50 px-2 py-0.5 rounded">
            {formatDesimal(soList.reduce((acc, so) => acc + so.penyaluranList.reduce((a, b) => a + (b.penyaluran || 0), 0), 0))}
          </span>
        </div>
      </footer>

    </div>
  );
}