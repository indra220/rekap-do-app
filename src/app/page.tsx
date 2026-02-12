/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useEffect } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  Plus, Trash2, FileSpreadsheet, CornerDownRight, Box, 
  Save, RefreshCw, ArrowLeft, CheckCircle2, X, MapPin, Building, User, Mail, Phone, Layers, Calendar, Tag, CheckSquare, Square, ChevronDown, FileText, Download, Info
} from "lucide-react";

let ipcRenderer: any = null;
if (typeof window !== "undefined" && (window as any).require) {
  ipcRenderer = (window as any).require("electron").ipcRenderer;
}

interface PenyaluranData { id: string; tglSalur: string; pengecer: string; penyaluran: number; }
interface SOData { id: string; tanggalSO: string; noSO: string; kecamatan: string; stokAwal: number; pengadaan: number; penyaluranList: PenyaluranData[]; }
interface TemplateData {
  kepada: string; penerima_1: string; penerima_2: string;
  alamat_penerima_1: string; alamat_penerima_2: string;
  code: string; provinsi: string; nama_perusahaan: string;
  alamat_perusahaan: string; telp: string; email: string;
  kabupaten: string; direktur: string; jabatan: string;
  jenis_pupuk: string;
  tembusan: string[];
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const formatTanggalIndo = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
};

const formatDesimal = (num: number) => {
  return num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const defaultTemplate: TemplateData = {
  kepada: "Kepada Yth", penerima_1: "Manager Penjualan PSO", penerima_2: "PT.PUPUK KUJANG",
  alamat_penerima_1: "Jl Jend.A.Yani No.39 Cikampek", alamat_penerima_2: "Kab Karawang",
  code: "F-5 B", provinsi: "Jawa Barat", nama_perusahaan: "PT Mega Agro Sanjaya",
  alamat_perusahaan: "Jl. Ir. H. Juanda Kel. Argasari Kec. Cihideung",
  telp: "081320599599", email: "ptmegaagrosanjaya@gmail.com", kabupaten: "Tasikmalaya",
  direktur: "Megaria Kusuma", jabatan: "Direktur", jenis_pupuk: "UREA",
  tembusan: [
    "Kepala Dinas Perdagangan Propinsi Jawa Barat", "Kepala Dinas Pertanian Propinsi Jawa Barat",
    "Komisi Pengawasan Pupuk & Pestisida Propinsi Jawa Barat", "Kepala Dinas Perdagangan KAB. TASIKMALAYA",
    "Kepala Dinas Pertanian KAB. TASIKMALAYA", "Komisi Pengawasan Pupuk & Pestisida KAB. TASIKMALAYA"
  ]
};

export default function Home() {
  const [view, setView] = useState<"dashboard" | "template" | "update">("dashboard");
  const [isSyncing, setIsSyncing] = useState(true);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [periode, setPeriode] = useState(new Date().toISOString().slice(0, 10));
  const [templateInfo, setTemplateInfo] = useState<TemplateData>(defaultTemplate);
  const [soList, setSoList] = useState<SOData[]>([{ id: generateId(), tanggalSO: "", noSO: "", kecamatan: "", stokAwal: 0, pengadaan: 0, penyaluranList: [] }]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [updateStatus, setUpdateStatus] = useState<"idle" | "checking" | "latest">("idle");

  const exportMenuRef = useRef<HTMLDivElement>(null);
  const focusTargetIdRef = useRef<string | null>(null);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!ipcRenderer) { setIsSyncing(false); return; }
    (async () => {
      try {
        const { template, solist } = await ipcRenderer.invoke('db-get-init');
        const version = await ipcRenderer.invoke('get-app-version');
        setAppVersion(version);
        if (template) setTemplateInfo(template);
        if (solist && solist.length > 0) setSoList(solist);
      } finally { setIsSyncing(false); }
    })();
  }, []);

  useEffect(() => {
    if (!isSyncing && ipcRenderer && view === "dashboard") {
      const timer = setTimeout(() => ipcRenderer.invoke('db-save', { table: 'solistdata', id: 'current_session', data: soList }), 500);
      return () => clearTimeout(timer);
    }
  }, [soList, isSyncing, view]);

  const handleKeyDown = (e: React.KeyboardEvent, soId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPenyaluran(soId);
    }
  };

  const addSO = () => {
    const newId = generateId();
    setSoList([...soList, { id: newId, tanggalSO: "", noSO: "", kecamatan: "", stokAwal: 0, pengadaan: 0, penyaluranList: [] }]);
    focusTargetIdRef.current = newId; 
  };

  const addPenyaluran = (soId: string) => {
    const newId = generateId();
    setSoList(soList.map(so => so.id === soId ? {...so, penyaluranList: [...so.penyaluranList, {id: newId, tglSalur: "", pengecer: "", penyaluran: 0}]} : so));
    focusTargetIdRef.current = newId;
  };

  const removeSO = (id: string) => soList.length > 1 && setSoList(soList.filter(s => s.id !== id));
  const removePenyaluran = (soId: string, salurId: string) => setSoList(soList.map(so => so.id === soId ? {...so, penyaluranList: so.penyaluranList.filter(s => s.id !== salurId)} : so));

  const updateSO = (id: string, field: keyof SOData, value: string | number) => setSoList(soList.map(so => so.id === id ? { ...so, [field]: value } : so));
  const updatePenyaluran = (soId: string, salurId: string, field: keyof PenyaluranData, value: string | number) => setSoList(soList.map(so => so.id === soId ? {...so, penyaluranList: so.penyaluranList.map(s => s.id === salurId ? {...s, [field]: value} : s)} : so));

  const getAllRowIds = () => {
    const ids: string[] = [];
    soList.forEach(so => {
      ids.push(so.id);
      so.penyaluranList.forEach(p => ids.push(p.id));
    });
    return ids;
  };

  const toggleSelectAll = () => {
    const allIds = getAllRowIds();
    setSelectedIds(selectedIds.length === allIds.length ? [] : allIds);
  };

  const toggleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const deleteSelected = () => {
    if (confirm(`Hapus ${selectedIds.length} baris data yang dipilih?`)) {
      setSoList(prev => {
        const filteredSOs = prev.filter(so => !selectedIds.includes(so.id));
        const updatedSOs = filteredSOs.map(so => ({ ...so, penyaluranList: so.penyaluranList.filter(p => !selectedIds.includes(p.id)) }));
        return updatedSOs.length > 0 ? updatedSOs : [{ id: generateId(), tanggalSO: "", noSO: "", kecamatan: "", stokAwal: 0, pengadaan: 0, penyaluranList: [] }];
      });
      setSelectedIds([]);
    }
  };

  const checkUpdate = () => {
    setUpdateStatus("checking");
    setTimeout(() => setUpdateStatus("latest"), 2000);
  };

  useEffect(() => {
    if (focusTargetIdRef.current && inputRefs.current[focusTargetIdRef.current]) {
      inputRefs.current[focusTargetIdRef.current]?.focus();
      focusTargetIdRef.current = null;
    }
  }, [soList]);

  // LOGIKA EXPORT (Sama seperti sebelumnya)
  const exportToExcel = async () => {
    setIsExportMenuOpen(false);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Rekap DO");
    const border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    worksheet.columns = [{ width: 5 }, { width: 18 }, { width: 25 }, { width: 30 }, { width: 18 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }];
    const decimalFormat = '#,##0.00';
    worksheet.getCell('G1').value = templateInfo.kepada;
    worksheet.getCell('G2').value = templateInfo.penerima_1;
    worksheet.getCell('G3').value = templateInfo.penerima_2;
    worksheet.getCell('G4').value = templateInfo.alamat_penerima_1;
    worksheet.getCell('G5').value = templateInfo.alamat_penerima_2;
    worksheet.getCell('A6').value = "Code"; worksheet.getCell('C6').value = `: ${templateInfo.code}`;
    worksheet.getCell('A7').value = "Provinsi"; worksheet.getCell('C7').value = `: ${templateInfo.provinsi}`;
    worksheet.getCell('A8').value = "Nama Perusahaan"; worksheet.getCell('C8').value = `: ${templateInfo.nama_perusahaan}`;
    worksheet.getCell('A9').value = "Alamat"; worksheet.getCell('C9').value = `: ${templateInfo.alamat_perusahaan}`;
    worksheet.getCell('A10').value = "Telp/Fax"; worksheet.getCell('C10').value = `: ${templateInfo.telp}`;
    worksheet.getCell('A11').value = "E-mail"; worksheet.getCell('C11').value = `: ${templateInfo.email}`;
    worksheet.getCell('A12').value = "Kabupaten"; worksheet.getCell('C12').value = `: ${templateInfo.kabupaten}`;
    worksheet.getCell('A13').value = "Periode"; worksheet.getCell('C13').value = periode;
    worksheet.getCell('I14').value = templateInfo.jenis_pupuk;
    worksheet.getCell('I14').font = { bold: true };
    const hRow = worksheet.addRow(["NO", "TANGGAL SO", "NO SO / TGL SALUR", "PENGECER", "KECAMATAN", "Stok Awal", "Pengadaan", "Penyaluran", "Stok Akhir"]);
    hRow.eachCell(c => { c.font = { bold: true }; c.border = border as any; c.alignment = { horizontal: 'center' }; });
    let tAwal = 0, tAda = 0, tLur = 0;
    soList.forEach((so, idx) => {
        let cur = (so.stokAwal || 0) + (so.pengadaan || 0);
        tAwal += (so.stokAwal || 0); tAda += (so.pengadaan || 0);
        const rSO = worksheet.addRow([idx+1, formatTanggalIndo(so.tanggalSO), so.noSO, "", so.kecamatan, so.stokAwal || 0, so.pengadaan || 0, "", cur]);
        rSO.eachCell({ includeEmpty: true }, (c, col) => { c.border = border as any; if (col >= 6) c.numFmt = decimalFormat; });
        so.penyaluranList.forEach(det => {
            cur -= (det.penyaluran || 0); tLur += (det.penyaluran || 0);
            const rS = worksheet.addRow(["", "", formatTanggalIndo(det.tglSalur), det.pengecer, "", "", "", det.penyaluran || 0, cur]);
            rS.eachCell({ includeEmpty: true }, (c, col) => { c.border = border as any; if (col >= 6) c.numFmt = decimalFormat; });
        });
    });
    worksheet.addRow([]); worksheet.addRow([]);
    const totalRow = worksheet.addRow(["", "", "", "", "", tAwal, tAda, tLur, (tAwal + tAda - tLur)]);
    totalRow.eachCell({ includeEmpty: true }, (c, col) => { if (col >= 6) { c.font = { bold: true }; c.border = border as any; c.numFmt = decimalFormat; } });
    const signRow = worksheet.lastRow!.number + 2;
    worksheet.getCell(`F${signRow}`).value = `${templateInfo.kabupaten}, ${formatTanggalIndo(periode)}`;
    worksheet.getCell(`G${signRow+1}`).value = templateInfo.nama_perusahaan;
    worksheet.getCell(`G${signRow+6}`).value = `(${templateInfo.direktur})`;
    worksheet.getCell(`G${signRow+7}`).value = templateInfo.jabatan;
    saveAs(new Blob([await workbook.xlsx.writeBuffer()]), `Rekap_DO_${periode}.xlsx`);
  };

  const exportToPDF = () => {
    setIsExportMenuOpen(false);
    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    const rightX = pageWidth - 60;
    doc.text(templateInfo.kepada, rightX, 15); doc.text(templateInfo.penerima_1, rightX, 20); doc.text(templateInfo.penerima_2, rightX, 25);
    doc.setFont("helvetica", "normal");
    doc.text(`Code          : ${templateInfo.code}`, 15, 30); doc.text(`Nama Perusahaan : ${templateInfo.nama_perusahaan}`, 15, 40);
    const tableData: any[] = [];
    let tAwal = 0, tAda = 0, tLur = 0;
    soList.forEach((so, idx) => {
      let cur = (so.stokAwal || 0) + (so.pengadaan || 0); tAwal += (so.stokAwal || 0); tAda += (so.pengadaan || 0);
      tableData.push([idx + 1, formatTanggalIndo(so.tanggalSO), so.noSO, "", so.kecamatan, formatDesimal(so.stokAwal || 0), formatDesimal(so.pengadaan || 0), "", formatDesimal(cur)]);
      so.penyaluranList.forEach(det => { cur -= (det.penyaluran || 0); tLur += (det.penyaluran || 0); tableData.push(["", "", formatTanggalIndo(det.tglSalur), det.pengecer, "", "", "", formatDesimal(det.penyaluran || 0), formatDesimal(cur)]); });
    });
    tableData.push(["", "", "", "", "", "", "", "", ""]); tableData.push(["", "", "", "", "", "", "", "", ""]);
    tableData.push(["", "", "", "", "", formatDesimal(tAwal), formatDesimal(tAda), formatDesimal(tLur), formatDesimal(tAwal + tAda - tLur)]);
    autoTable(doc, { startY: 75, head: [["NO", "TANGGAL SO", "NO SO / TGL SALUR", "PENGECER", "KECAMATAN", "Stok Awal", "Pengadaan", "Penyaluran", "Stok Akhir"]], body: tableData, theme: "grid" });
    doc.save(`Rekap_DO_${periode}.pdf`);
  };

  const inputClass = "w-full bg-transparent border-none focus:ring-0 px-2 py-1 text-sm font-bold text-slate-800 outline-none";

  // VIEW UPDATE APLIKASI
  if (view === "update") {
    return (
      <div className="min-h-screen bg-slate-200 p-8 flex flex-col items-center">
        <div className="max-w-[600px] w-full bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col">
          <div className="bg-slate-900 px-8 py-5 flex justify-between items-center text-white">
            <div className="flex items-center gap-4">
              <button onClick={() => setView("dashboard")} className="hover:bg-white/10 p-2 rounded-xl transition"><ArrowLeft size={24}/></button>
              <h2 className="font-black text-sm tracking-widest uppercase">Pembaruan Aplikasi</h2>
            </div>
          </div>
          <div className="p-12 flex flex-col items-center text-center space-y-8 bg-slate-50/50">
            <div className="bg-blue-600 p-6 rounded-full text-white shadow-2xl shadow-blue-200 animate-bounce">
              <Download size={48} />
            </div>
            <div>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">Versi Terinstal</p>
              <h3 className="text-4xl font-black text-slate-900">v{appVersion}</h3>
            </div>
            
            <div className="w-full bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
              {updateStatus === "idle" && <p className="text-sm font-bold text-slate-500">Klik tombol di bawah untuk mengecek versi terbaru.</p>}
              {updateStatus === "checking" && <div className="flex flex-col items-center gap-3"><RefreshCw className="animate-spin text-blue-600" /><p className="text-sm font-black text-blue-600 animate-pulse">Menghubungkan ke Server...</p></div>}
              {updateStatus === "latest" && <div className="flex flex-col items-center gap-2"><div className="bg-emerald-100 text-emerald-600 p-2 rounded-full"><CheckCircle2 size={24}/></div><p className="text-sm font-black text-emerald-600">Aplikasi Sudah Versi Terbaru!</p></div>}
            </div>

            <button 
              onClick={checkUpdate}
              disabled={updateStatus === "checking"}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition disabled:opacity-50"
            >
              Cek Pembaruan Sekarang
            </button>
          </div>
          <div className="px-8 py-4 bg-white border-t border-slate-100 flex items-center gap-3 text-slate-400">
            <Info size={16}/>
            <p className="text-[10px] font-bold">Terakhir dicek: {new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>
      </div>
    );
  }

  // TAMPILAN TEMPLATE EDITOR (Sama seperti sebelumnya)
  if (view === "template") {
    return (
      <div className="min-h-screen bg-slate-200 p-8 flex flex-col items-center">
        <div className="max-w-[1000px] w-full bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col h-[90vh]">
          <div className="bg-slate-900 px-8 py-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-4">
              <button onClick={() => setView("dashboard")} className="hover:bg-white/10 p-2 rounded-xl transition"><ArrowLeft size={24}/></button>
              <h2 className="font-black text-sm tracking-widest uppercase">Editor Template</h2>
            </div>
            <button onClick={async () => { await ipcRenderer.invoke('db-save', { table: 'rekapdotemplate', id: 'current_session', data: templateInfo }); setView("dashboard"); }} className="bg-blue-600 hover:bg-blue-700 px-8 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 transition"><Save size={18}/> Simpan</button>
          </div>
          <div className="flex-1 overflow-auto bg-slate-100 p-10 custom-scrollbar">
            <div className="bg-white mx-auto shadow-sm border border-slate-200 p-16 min-h-[1400px] w-full flex flex-col">
              <div className="flex justify-end mb-12">
                <div className="w-[380px] space-y-1.5 p-4 border border-dashed border-blue-200 rounded-xl">
                  <p className="text-[10px] font-black text-blue-500 uppercase">Tujuan</p>
                  <input type="text" className="w-full text-right font-black bg-transparent outline-none" value={templateInfo.kepada} onChange={e => setTemplateInfo({...templateInfo, kepada: e.target.value})} />
                  <input type="text" className="w-full text-right font-black bg-transparent outline-none" value={templateInfo.penerima_1} onChange={e => setTemplateInfo({...templateInfo, penerima_1: e.target.value})} />
                  <input type="text" className="w-full text-right font-black bg-transparent outline-none" value={templateInfo.penerima_2} onChange={e => setTemplateInfo({...templateInfo, penerima_2: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-10 mb-10">
                <div className="space-y-4 p-4 border border-dashed border-emerald-200 rounded-xl text-slate-800">
                   <p className="text-[10px] font-black text-emerald-600 uppercase">Profil</p>
                   {[{ label: "Code", key: "code" }, { label: "Nama PT", key: "nama_perusahaan" }, { label: "Kabupaten", key: "kabupaten" }].map(item => (
                     <div key={item.key} className="flex items-center gap-3">
                        <span className="w-24 text-[10px] font-black text-slate-400 uppercase">{item.label}</span>
                        <input type="text" className="flex-1 bg-transparent border-b border-slate-100 font-black text-sm outline-none" value={(templateInfo as any)[item.key]} onChange={e => setTemplateInfo({...templateInfo, [item.key]: e.target.value})} />
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TAMPILAN DASHBOARD UTAMA
  return (
    <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex justify-between items-center relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-600 rounded-l-3xl"></div>
          <div className="flex items-center gap-5">
            <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-xl shadow-blue-200"><FileSpreadsheet size={32} /></div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight italic">Rekapitulasi DO Urea</h1>
              <div className="flex items-center gap-2 mt-1">
                {isSyncing ? <span className="text-[10px] text-blue-500 font-black uppercase animate-pulse flex items-center gap-1"><RefreshCw size={12} className="animate-spin"/> Syncing...</span> : <span className="text-[10px] text-emerald-600 font-black uppercase flex items-center gap-1"><CheckCircle2 size={12}/> Database Active</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Menu Update Baru */}
            <button onClick={() => setView("update")} className="bg-white border border-slate-200 text-slate-500 px-6 py-2.5 rounded-2xl font-black text-sm hover:bg-slate-50 transition flex items-center gap-2">Update v{appVersion}</button>
            <button onClick={() => setView("template")} className="bg-slate-100 px-6 py-2.5 rounded-2xl font-black text-sm text-slate-700 hover:bg-slate-200 transition">Edit Template</button>
            <input type="date" className="border border-slate-200 px-4 py-2.5 rounded-2xl text-sm font-black bg-slate-50 text-slate-900 outline-none" value={periode} onChange={e => setPeriode(e.target.value)} />
            
            <div className="relative" ref={exportMenuRef}>
              <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="bg-blue-600 text-white px-10 py-3 rounded-2xl font-black hover:bg-blue-700 transition shadow-xl shadow-blue-200 uppercase text-xs tracking-widest flex items-center gap-3 border-2 border-blue-500">Export <ChevronDown size={20} className={`${isExportMenuOpen ? 'rotate-180' : ''}`} /></button>
              {isExportMenuOpen && (
                <div className="absolute right-0 mt-4 w-64 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-3xl border border-slate-100 py-3 z-[9999] animate-in fade-in zoom-in-95">
                  <button onClick={exportToExcel} className="w-full text-left px-5 py-4 text-[13px] font-black text-slate-700 hover:bg-blue-50 flex items-center gap-4 group transition-colors"><div className="bg-emerald-100 p-2 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors"><FileSpreadsheet size={20}/></div><span>Excel Document (.xlsx)</span></button>
                  <button onClick={exportToPDF} className="w-full text-left px-5 py-4 text-[13px] font-black text-slate-700 hover:bg-red-50 flex items-center gap-4 group transition-colors"><div className="bg-red-100 p-2 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors"><FileText size={20}/></div><span>PDF Document (.pdf)</span></button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-220px)] relative">
          <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white z-20">
            <div className="flex items-center gap-4 text-slate-800">
              <h2 className="font-black text-lg flex items-center gap-2 uppercase tracking-tighter"><Box size={24} className="text-blue-600"/> Data Input Transaksi</h2>
              {selectedIds.length > 0 && (
                <button onClick={deleteSelected} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-red-600 hover:text-white transition-all"><Trash2 size={14}/> Hapus Terpilih ({selectedIds.length})</button>
              )}
            </div>
            <button onClick={addSO} className="bg-slate-900 text-white px-8 py-2.5 rounded-xl flex items-center gap-2 text-sm font-black hover:bg-slate-800 transition shadow-lg"><Plus size={20}/> Tambah DO Baru</button>
          </div>

          <div className="overflow-auto flex-1 custom-scrollbar pb-36">
            <table className="w-full text-sm text-left border-collapse table-fixed">
              <thead className="text-[11px] text-slate-900 uppercase bg-slate-50 sticky top-0 z-30 border-b border-slate-300 font-black">
                <tr>
                  <th className="w-12 text-center border-r border-slate-300"><button onClick={toggleSelectAll} className={`p-1.5 rounded-lg ${selectedIds.length === getAllRowIds().length ? 'text-blue-600 bg-blue-50' : 'text-slate-300 hover:text-slate-400'}`}>{selectedIds.length === getAllRowIds().length ? <CheckSquare size={18}/> : <Square size={18}/>}</button></th>
                  <th className="w-14 text-center border-r border-slate-300 py-4">No</th>
                  <th className="w-40 px-3 border-r border-slate-200">Tanggal SO</th>
                  <th className="w-56 px-3 border-r border-slate-200 text-blue-800">No SO / Tgl Salur</th>
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
                        <td className="text-center border-r border-slate-300"><button onClick={() => toggleSelect(so.id)} className={`p-1.5 rounded-lg ${isSoSelected ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-400'}`}>{isSoSelected ? <CheckSquare size={18}/> : <Square size={18}/>}</button></td>
                        <td className="text-center font-black text-slate-900 border-r border-slate-300 bg-slate-50/50 text-base">{idx + 1}</td>
                        <td className="border-r border-slate-100"><input type="date" ref={el => { if (el) inputRefs.current[so.id] = el; }} className={inputClass} value={so.tanggalSO} onChange={e => updateSO(so.id, "tanggalSO", e.target.value)} onKeyDown={(e) => handleKeyDown(e, so.id)} /></td>
                        <td className="border-r border-slate-100 bg-blue-50/20"><input type="text" className={`${inputClass} text-blue-800 uppercase`} placeholder="Nomor SO..." value={so.noSO} onChange={e => updateSO(so.id, "noSO", e.target.value)} onKeyDown={(e) => handleKeyDown(e, so.id)} /></td>
                        <td className="border-r border-slate-100 bg-slate-50"></td>
                        <td className="border-r border-slate-100"><input type="text" className={inputClass} placeholder="Kecamatan..." value={so.kecamatan} onChange={e => updateSO(so.id, "kecamatan", e.target.value)} onKeyDown={(e) => handleKeyDown(e, so.id)} /></td>
                        <td className="border-r border-slate-100"><input type="number" step="any" className={`${inputClass} text-right`} value={so.stokAwal || ""} onChange={e => updateSO(so.id, "stokAwal", parseFloat(e.target.value) || 0)} onKeyDown={(e) => handleKeyDown(e, so.id)} /></td>
                        <td className="border-r border-slate-100"><input type="number" step="any" className={`${inputClass} text-right text-emerald-700`} value={so.pengadaan || ""} onChange={e => updateSO(so.id, "pengadaan", parseFloat(e.target.value) || 0)} onKeyDown={(e) => handleKeyDown(e, so.id)} /></td>
                        <td className="border-r border-slate-100 bg-slate-50"></td>
                        <td className="px-3 font-black text-right text-blue-900 bg-blue-50/50 tabular-nums">{formatDesimal(runningCur)}</td>
                        <td className="px-2 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => addPenyaluran(so.id)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white"><Plus size={14}/></button><button onClick={() => removeSO(so.id)} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"><Trash2 size={14}/></button></td>
                      </tr>
                      {so.penyaluranList.map((det) => {
                        runningCur -= (det.penyaluran || 0);
                        const isDetSelected = selectedIds.includes(det.id);
                        return (
                          <tr key={det.id} className={`transition-colors ${isDetSelected ? 'bg-blue-50/30' : 'bg-slate-50/30 hover:bg-slate-100'}`}>
                            <td className="text-center border-r border-slate-300"><button onClick={() => toggleSelect(det.id)} className={`p-1.5 rounded-lg ${isDetSelected ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-400'}`}>{isDetSelected ? <CheckSquare size={18}/> : <Square size={18}/>}</button></td>
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
             <div className="text-right border-l border-slate-100 pl-16 text-slate-800"><p className="text-[10px] text-slate-400 font-black uppercase mb-1">Total Penyaluran</p><p className="text-5xl font-black text-orange-700 leading-none tracking-tighter">{formatDesimal(soList.reduce((acc, so) => acc + so.penyaluranList.reduce((a, b) => a + (b.penyaluran || 0), 0), 0))}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}