/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useEffect } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { 
  Plus, Trash2, FileSpreadsheet, CornerDownRight, Box, 
  Save, RefreshCw, ArrowLeft, CheckCircle2, X, MapPin, Building, User, Mail, Phone, Layers, Calendar
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
  tembusan: string[];
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const formatTanggalIndo = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
};

// Template default disetel persis sesuai isi file CSV
const defaultTemplate: TemplateData = {
  kepada: "Kepada Yth",
  penerima_1: "Manager Penjualan PSO",
  penerima_2: "PT.PUPUK KUJANG",
  alamat_penerima_1: "Jl Jend.A.Yani No.39 Cikampek",
  alamat_penerima_2: "Kab Karawang",
  code: "F-5 B",
  provinsi: "Jawa Barat",
  nama_perusahaan: "PT Mega Agro Sanjaya",
  alamat_perusahaan: "Jl. Ir. H. Juanda Kel. Argasari Kec. Cihideung",
  telp: "081320599599",
  email: "ptmegaagrosanjaya@gmail.com",
  kabupaten: "Tasikmalaya",
  direktur: "Megaria Kusuma",
  jabatan: "Direktur",
  tembusan: [
    "Kepala Dinas Perdagangan Propinsi Jawa Barat",
    "Kepala Dinas Pertanian Propinsi Jawa Barat",
    "Komisi Pengawasan Pupuk & Pestisida Propinsi Jawa Barat",
    "Kepala Dinas Perdagangan KAB. TASIKMALAYA",
    "Kepala Dinas Pertanian KAB. TASIKMALAYA",
    "Komisi Pengawasan Pupuk & Pestisida KAB. TASIKMALAYA"
  ]
};

export default function Home() {
  const [view, setView] = useState<"dashboard" | "template">("dashboard");
  const [isSyncing, setIsSyncing] = useState(true);
  const [periode, setPeriode] = useState(new Date().toISOString().slice(0, 10));
  const [templateInfo, setTemplateInfo] = useState<TemplateData>(defaultTemplate);
  const [soList, setSoList] = useState<SOData[]>([{ id: generateId(), tanggalSO: "", noSO: "", kecamatan: "", stokAwal: 0, pengadaan: 0, penyaluranList: [] }]);

  const focusTargetIdRef = useRef<string | null>(null);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    if (!ipcRenderer) { setIsSyncing(false); return; }
    (async () => {
      try {
        const { template, solist } = await ipcRenderer.invoke('db-get-init');
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

  useEffect(() => {
    if (focusTargetIdRef.current && inputRefs.current[focusTargetIdRef.current]) {
      inputRefs.current[focusTargetIdRef.current]?.focus();
      focusTargetIdRef.current = null;
    }
  }, [soList]);

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Rekap DO");
    const border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    
    worksheet.columns = [{ width: 5 }, { width: 18 }, { width: 25 }, { width: 30 }, { width: 18 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }];

    // Header Kanan (Sesuai CSV baris 1-5)
    worksheet.getCell('G1').value = templateInfo.kepada;
    worksheet.getCell('G2').value = templateInfo.penerima_1;
    worksheet.getCell('G3').value = templateInfo.penerima_2;
    worksheet.getCell('G4').value = templateInfo.alamat_penerima_1;
    worksheet.getCell('G5').value = templateInfo.alamat_penerima_2;

    // Identitas Kiri (Sesuai CSV baris 6-13)
    worksheet.getCell('A6').value = "Code"; worksheet.getCell('C6').value = `: ${templateInfo.code}`;
    worksheet.getCell('A7').value = "Provinsi"; worksheet.getCell('C7').value = `: ${templateInfo.provinsi}`;
    worksheet.getCell('A8').value = "Nama Perusahaan"; worksheet.getCell('C8').value = `: ${templateInfo.nama_perusahaan}`;
    worksheet.getCell('A9').value = "Alamat"; worksheet.getCell('C9').value = `: ${templateInfo.alamat_perusahaan}`;
    worksheet.getCell('A10').value = "Telp/Fax"; worksheet.getCell('C10').value = `: ${templateInfo.telp}`;
    worksheet.getCell('A11').value = "E-mail"; worksheet.getCell('C11').value = `: ${templateInfo.email}`;
    worksheet.getCell('A12').value = "Kabupaten"; worksheet.getCell('C12').value = `: ${templateInfo.kabupaten}`;
    worksheet.getCell('A13').value = "Periode"; worksheet.getCell('C13').value = `${formatTanggalIndo(periode)}`;

    worksheet.getCell('I14').value = "UREA";
    worksheet.getCell('I14').font = { bold: true };

    const hRow = worksheet.addRow(["NO", "TANGGAL SO", "NO SO / TGL SALUR", "PENGECER", "KECAMATAN", "Stok Awal", "Pengadaan", "Penyaluran", "Stok Akhir"]);
    hRow.eachCell(c => { c.font = { bold: true }; c.border = border as any; c.alignment = { horizontal: 'center' }; });

    soList.forEach((so, idx) => {
        let cur = (so.stokAwal || 0) + (so.pengadaan || 0);
        const rSO = worksheet.addRow([idx+1, formatTanggalIndo(so.tanggalSO), so.noSO, "", so.kecamatan, so.stokAwal || 0, so.pengadaan || 0, "", cur]);
        rSO.eachCell({ includeEmpty: true }, c => c.border = border as any);
        
        so.penyaluranList.forEach(s => {
            cur -= (s.penyaluran || 0);
            const rS = worksheet.addRow(["", "", formatTanggalIndo(s.tglSalur), s.pengecer, "", "", "", s.penyaluran || 0, cur]);
            rS.eachCell({ includeEmpty: true }, c => c.border = border as any);
        });
    });

    // Bagian Tanda Tangan (Sesuai footer CSV)
    const lastRow = worksheet.lastRow ? worksheet.lastRow.number + 2 : 25;
    worksheet.getCell(`G${lastRow}`).value = `${templateInfo.kabupaten}, ${formatTanggalIndo(periode)}`;
    worksheet.getCell(`G${lastRow+1}`).value = templateInfo.nama_perusahaan;
    worksheet.getCell(`G${lastRow+6}`).value = `(${templateInfo.direktur})`;
    worksheet.getCell(`G${lastRow+7}`).value = templateInfo.jabatan;

    // Bagian Tembusan (Sesuai baris terakhir CSV)
    const tembusanRow = lastRow + 9;
    worksheet.getCell(`A${tembusanRow}`).value = "Tembusan :";
    templateInfo.tembusan.forEach((t, i) => {
      worksheet.getCell(`A${tembusanRow + 1 + i}`).value = `${i+1}. ${t}`;
    });

    saveAs(new Blob([await workbook.xlsx.writeBuffer()]), `Rekap_DO_${periode}.xlsx`);
  };

  const inputClass = "w-full bg-transparent border-none focus:ring-0 px-2 py-1 text-sm font-bold text-slate-800 outline-none";

  if (view === "template") {
    return (
      <div className="min-h-screen bg-slate-200 p-8 flex flex-col items-center">
        <div className="max-w-[1000px] w-full bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col h-[90vh]">
          {/* Editor Header */}
          <div className="bg-slate-900 px-8 py-4 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-4">
              <button onClick={() => setView("dashboard")} className="hover:bg-white/10 p-2 rounded-xl transition text-slate-400 hover:text-white"><ArrowLeft size={24}/></button>
              <div>
                <h2 className="font-black text-sm tracking-widest uppercase">Editor Template Laporan</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Sama Persis Dengan Format Urea Kota</p>
              </div>
            </div>
            <button onClick={async () => { await ipcRenderer.invoke('db-save', { table: 'rekapdotemplate', id: 'current_session', data: templateInfo }); setView("dashboard"); }} className="bg-blue-600 hover:bg-blue-700 px-8 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg transition"><Save size={18}/> Simpan Format</button>
          </div>

          <div className="flex-1 overflow-auto bg-slate-100 p-10 custom-scrollbar">
            <div className="bg-white mx-auto shadow-sm border border-slate-200 p-16 min-h-[1200px] w-full flex flex-col text-slate-800">
              
              {/* Bagian Tujuan Pengiriman (G1-G5) */}
              <div className="flex justify-end mb-12">
                <div className="w-[380px] space-y-1.5 p-4 hover:bg-blue-50/50 rounded-xl transition-colors border border-dashed border-transparent hover:border-blue-200">
                  <p className="text-[10px] font-black text-blue-500 uppercase mb-2 flex items-center gap-2"><MapPin size={12}/> Tujuan Pengiriman (G1-G5)</p>
                  <input type="text" className="w-full text-right font-black text-slate-900 bg-transparent outline-none border-b border-transparent hover:border-slate-200 focus:border-blue-500" value={templateInfo.kepada} onChange={e => setTemplateInfo({...templateInfo, kepada: e.target.value})} />
                  <input type="text" className="w-full text-right font-black text-slate-900 bg-transparent outline-none border-b border-transparent hover:border-slate-200 focus:border-blue-500" value={templateInfo.penerima_1} onChange={e => setTemplateInfo({...templateInfo, penerima_1: e.target.value})} />
                  <input type="text" className="w-full text-right font-black text-slate-900 bg-transparent outline-none border-b border-transparent hover:border-slate-200 focus:border-blue-500" value={templateInfo.penerima_2} onChange={e => setTemplateInfo({...templateInfo, penerima_2: e.target.value})} />
                  <input type="text" className="w-full text-right font-bold text-slate-500 text-sm bg-transparent outline-none border-b border-transparent hover:border-slate-200 focus:border-blue-500" value={templateInfo.alamat_penerima_1} onChange={e => setTemplateInfo({...templateInfo, alamat_penerima_1: e.target.value})} />
                  <input type="text" className="w-full text-right font-bold text-slate-500 text-sm bg-transparent outline-none border-b border-transparent hover:border-slate-200 focus:border-blue-500" value={templateInfo.alamat_penerima_2} onChange={e => setTemplateInfo({...templateInfo, alamat_penerima_2: e.target.value})} />
                </div>
              </div>

              {/* Bagian Identitas PT (A6-A13) */}
              <div className="grid grid-cols-2 gap-10 mb-20">
                <div className="space-y-4 p-4 hover:bg-emerald-50/50 rounded-xl transition-colors border border-dashed border-transparent hover:border-emerald-200">
                   <p className="text-[10px] font-black text-emerald-600 uppercase mb-2 flex items-center gap-2"><Building size={12}/> Identitas Perusahaan (A6-A13)</p>
                   {[
                     { label: "Code", key: "code", icon: Layers },
                     { label: "Provinsi", key: "provinsi", icon: MapPin },
                     { label: "Nama PT", key: "nama_perusahaan", icon: Building },
                     { label: "Alamat", key: "alamat_perusahaan", icon: MapPin },
                     { label: "Telp/Fax", key: "telp", icon: Phone },
                     { label: "E-mail", key: "email", icon: Mail },
                     { label: "Kabupaten", key: "kabupaten", icon: Layers },
                   ].map(item => (
                     <div key={item.key} className="flex items-center gap-3">
                        <item.icon size={14} className="text-slate-300" />
                        <span className="w-24 text-[10px] font-black text-slate-400 uppercase">{item.label}</span>
                        <input type="text" className="flex-1 bg-transparent border-b border-slate-100 focus:border-emerald-500 py-1 font-black text-sm text-slate-800 outline-none" value={(templateInfo as any)[item.key]} onChange={e => setTemplateInfo({...templateInfo, [item.key]: e.target.value})} />
                     </div>
                   ))}
                   {/* Visual Periode */}
                   <div className="flex items-center gap-3">
                        <Calendar size={14} className="text-slate-300" />
                        <span className="w-24 text-[10px] font-black text-slate-400 uppercase">Periode</span>
                        <div className="flex-1 font-black text-sm text-slate-400 py-1 border-b border-transparent italic">Diambil dari tanggal export</div>
                   </div>
                </div>
                <div className="border-2 border-slate-50 rounded-xl flex items-center justify-center bg-slate-50/50">
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Tabel Data Transaksi</span>
                </div>
              </div>

              {/* Bagian Tanda Tangan */}
              <div className="mt-auto flex justify-end pr-10">
                <div className="w-[320px] text-center space-y-2 p-6 hover:bg-orange-50/50 rounded-xl transition-colors border border-dashed border-transparent hover:border-orange-200">
                    <p className="text-[10px] font-black text-orange-600 uppercase mb-4 flex justify-center gap-2"><User size={12}/> Tanda Tangan</p>
                    <p className="text-xs font-bold text-slate-900 mb-1">{templateInfo.kabupaten}, {formatTanggalIndo(periode)}</p>
                    <input type="text" className="w-full text-center font-black text-slate-900 bg-transparent outline-none border-b-2 border-slate-200 focus:border-orange-500 py-2 mb-20 uppercase" value={templateInfo.nama_perusahaan} readOnly />
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-1 font-black text-slate-900">
                        <span>(</span>
                        <input type="text" className="text-center bg-transparent outline-none border-b border-transparent hover:border-slate-200 focus:border-orange-500 w-48" value={templateInfo.direktur} onChange={e => setTemplateInfo({...templateInfo, direktur: e.target.value})} />
                        <span>)</span>
                      </div>
                      <input type="text" className="w-full text-center font-bold text-slate-500 text-xs bg-transparent outline-none border-b border-transparent hover:border-slate-200 focus:border-orange-500" value={templateInfo.jabatan} onChange={e => setTemplateInfo({...templateInfo, jabatan: e.target.value})} />
                    </div>
                </div>
              </div>

              {/* Bagian Tembusan */}
              <div className="mt-20 border-t border-slate-100 pt-8">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tembusan Laporan</p>
                    <button onClick={() => setTemplateInfo({...templateInfo, tembusan: [...templateInfo.tembusan, ""]})} className="text-blue-500 hover:text-blue-700 font-black text-[10px] uppercase flex items-center gap-1"><Plus size={14}/> Tambah Tembusan</button>
                  </div>
                  <div className="space-y-2">
                    {templateInfo.tembusan.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 group max-w-xl">
                        <span className="text-xs font-bold text-slate-400 w-4">{i+1}.</span>
                        <input type="text" className="flex-1 bg-transparent border-b border-transparent group-hover:border-slate-100 focus:border-blue-500 py-1 text-xs font-bold text-slate-700 outline-none" value={item} onChange={e => {
                          const newT = [...templateInfo.tembusan];
                          newT[i] = e.target.value;
                          setTemplateInfo({...templateInfo, tembusan: newT});
                        }} />
                        <button onClick={() => setTemplateInfo({...templateInfo, tembusan: templateInfo.tembusan.filter((_, idx) => idx !== i)})} className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 transition-opacity"><X size={14}/></button>
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

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-8">
      {/* UI Dashboard Utama Tetap Sama */}
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
          <div className="flex items-center gap-5">
            <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-xl shadow-blue-200"><FileSpreadsheet size={32} /></div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight italic">Rekapitulasi DO Urea</h1>
              <div className="flex items-center gap-2 mt-1">
                {isSyncing ? <span className="text-[10px] text-blue-500 font-black uppercase animate-pulse flex items-center gap-1"><RefreshCw size={12} className="animate-spin"/> Syncing...</span> : <span className="text-[10px] text-emerald-600 font-black uppercase flex items-center gap-1"><CheckCircle2 size={12}/> Database Active</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setView("template")} className="bg-slate-100 px-6 py-2.5 rounded-2xl font-black text-sm text-slate-700 hover:bg-slate-200 transition">Edit Template</button>
            <input type="date" className="border border-slate-200 px-4 py-2.5 rounded-2xl text-sm font-black bg-slate-50 text-slate-900 outline-none" value={periode} onChange={e => setPeriode(e.target.value)} />
            <button onClick={exportToExcel} className="bg-blue-600 text-white px-8 py-2.5 rounded-2xl font-black hover:bg-blue-700 transition shadow-xl shadow-blue-200 uppercase text-xs tracking-widest">Export Excel</button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-220px)]">
          {/* Bagian Input Transaksi Tetap Sama */}
          <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white z-20">
            <h2 className="font-black text-lg flex items-center gap-2 text-slate-800 uppercase tracking-tighter"><Box size={24} className="text-blue-600"/> Data Input Transaksi</h2>
            <button onClick={addSO} className="bg-slate-900 text-white px-8 py-2.5 rounded-xl flex items-center gap-2 text-sm font-black hover:bg-slate-800 transition shadow-lg"><Plus size={20}/> Tambah DO Baru</button>
          </div>
          <div className="overflow-auto flex-1 custom-scrollbar pb-36">
            <table className="w-full text-sm text-left border-collapse table-fixed">
              <thead className="text-[11px] text-slate-900 uppercase bg-slate-50 sticky top-0 z-30 border-b border-slate-300 font-black">
                <tr>
                  <th className="w-14 text-center border-r border-slate-300 py-4 bg-slate-100/80">No</th>
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
                  let cur = (so.stokAwal || 0) + (so.pengadaan || 0);
                  return (
                    <React.Fragment key={so.id}>
                      <tr className="bg-white group transition-colors border-b-2 border-slate-100">
                        <td className="text-center font-black text-slate-900 border-r border-slate-300 bg-slate-50/50 text-base">{idx + 1}</td>
                        <td className="border-r border-slate-100"><input type="date" className={inputClass} value={so.tanggalSO} onChange={e => updateSO(so.id, "tanggalSO", e.target.value)} /></td>
                        <td className="border-r border-slate-100 bg-blue-50/20"><input type="text" className={`${inputClass} text-blue-800 uppercase`} placeholder="Nomor SO..." value={so.noSO} onChange={e => updateSO(so.id, "noSO", e.target.value)} /></td>
                        <td className="border-r border-slate-100 bg-slate-50"></td>
                        <td className="border-r border-slate-100"><input type="text" className={inputClass} placeholder="Kecamatan..." value={so.kecamatan} onChange={e => updateSO(so.id, "kecamatan", e.target.value)} /></td>
                        <td className="border-r border-slate-100"><input type="number" className={`${inputClass} text-right`} value={so.stokAwal || ""} onChange={e => updateSO(so.id, "stokAwal", Number(e.target.value))} /></td>
                        <td className="border-r border-slate-100"><input type="number" className={`${inputClass} text-right text-emerald-700`} value={so.pengadaan || ""} onChange={e => updateSO(so.id, "pengadaan", Number(e.target.value))} /></td>
                        <td className="border-r border-slate-100 bg-slate-50"></td>
                        <td className="px-3 font-black text-right text-blue-900 bg-blue-50/50 tabular-nums">{cur.toLocaleString('id-ID')}</td>
                        <td className="px-2 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => addPenyaluran(so.id)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white"><Plus size={14}/></button>
                            <button onClick={() => removeSO(so.id)} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"><Trash2 size={14}/></button>
                        </td>
                      </tr>
                      {so.penyaluranList.map((s) => {
                        cur -= (s.penyaluran || 0);
                        return (
                          <tr key={s.id} className="bg-slate-50/30 hover:bg-slate-100 transition-colors">
                            <td className="border-r border-slate-300 bg-slate-50/30"></td>
                            <td className="border-r border-slate-100"></td>
                            <td className="border-r border-slate-100 flex items-center px-1">
                                <CornerDownRight size={14} className="text-slate-300 mr-1 shrink-0" />
                                <input type="date" className={inputClass + " bg-transparent"} value={s.tglSalur} onChange={e => updatePenyaluran(so.id, s.id, "tglSalur", e.target.value)} />
                            </td>
                            <td className="border-r border-slate-100"><input type="text" className={inputClass} placeholder="Pengecer..." value={s.pengecer} onChange={e => updatePenyaluran(so.id, s.id, "pengecer", e.target.value)} /></td>
                            <td colSpan={3} className="border-r border-slate-100"></td>
                            <td className="border-r border-slate-100"><input type="number" className={`${inputClass} text-right text-orange-700`} value={s.penyaluran || ""} onChange={e => updatePenyaluran(so.id, s.id, "penyaluran", Number(e.target.value))} /></td>
                            <td className="px-3 text-right font-bold text-slate-500 tabular-nums">{cur.toLocaleString('id-ID')}</td>
                            <td className="px-2 flex justify-center"><button onClick={() => removePenyaluran(so.id, s.id)} className="p-1 text-slate-300 hover:text-red-500 transition-colors"><X size={14}/></button></td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Panel Footer Ringkasan */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-8 z-20 flex justify-between items-center shadow-2xl">
             <div className="flex gap-10">
                <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total DO</p>
                    <p className="text-2xl font-black text-slate-800 leading-none">{soList.length}</p>
                </div>
                <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-1">Total Pengadaan</p>
                    <p className="text-2xl font-black text-emerald-700 leading-none">{soList.reduce((acc, so) => acc + (so.pengadaan || 0), 0).toLocaleString('id-ID')}</p>
                </div>
             </div>
             <div className="text-right border-l border-slate-100 pl-16">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Penyaluran</p>
                <p className="text-5xl font-black text-orange-700 leading-none tracking-tighter">{soList.reduce((acc, so) => acc + so.penyaluranList.reduce((a, b) => a + (b.penyaluran || 0), 0), 0).toLocaleString('id-ID')}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}