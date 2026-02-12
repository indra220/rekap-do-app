/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useEffect } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  Plus, Trash2, FileSpreadsheet, CornerDownRight, Box, 
  Save, RefreshCw, ArrowLeft, CheckCircle2, X, ChevronDown, FileText, CheckSquare, Square
} from "lucide-react";

let ipcRenderer: any = null;
if (typeof window !== "undefined" && (window as any).require) {
  ipcRenderer = (window as any).require("electron").ipcRenderer;
}

const appVersion = "1.0.1";

interface PenyaluranData { id: string; tglSalur: string; pengecer: string; penyaluran: number; }
interface SOData { id: string; tanggalSO: string; noSO: string; kecamatan: string; stokAwal: number; pengadaan: number; penyaluranList: PenyaluranData[]; }

// Interface Template sesuai CSV
interface TemplateData {
  kepada: string; 
  penerima_1: string; 
  penerima_2: string;
  alamat_penerima_1: string; 
  alamat_penerima_2: string;
  code: string; 
  provinsi: string; 
  nama_perusahaan: string;
  alamat_perusahaan: string; 
  telp: string; 
  email: string;
  kabupaten: string; 
  jenis_pupuk: string;
  direktur: string; 
  jabatan: string;
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

// DATA DEFAULT DISESUAIKAN PERSIS DENGAN FILE 'Urea Kota.xlsx - Jan.csv'
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
  jenis_pupuk: "UREA",
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
  const [view, setView] = useState<"dashboard" | "template" | "update">("dashboard");
  const [isSyncing, setIsSyncing] = useState(true);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [periode, setPeriode] = useState(new Date().toISOString().slice(0, 10));
  const [templateInfo, setTemplateInfo] = useState<TemplateData>(defaultTemplate);
  const [soList, setSoList] = useState<SOData[]>([{ id: generateId(), tanggalSO: "", noSO: "", kecamatan: "", stokAwal: 0, pengadaan: 0, penyaluranList: [] }]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  useEffect(() => {
    if (focusTargetIdRef.current && inputRefs.current[focusTargetIdRef.current]) {
      inputRefs.current[focusTargetIdRef.current]?.focus();
      focusTargetIdRef.current = null;
    }
  }, [soList]);

  // --- EXPORT TO EXCEL: LOGIKA DIPERBARUI AGAR SAMA PERSIS DENGAN CSV ---
  const exportToExcel = async () => {
    setIsExportMenuOpen(false);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Rekap DO");
    
    // Setup kolom agar proporsional
    worksheet.columns = [
      { width: 5 },  // A (NO)
      { width: 15 }, // B (TGL)
      { width: 25 }, // C (NO SO)
      { width: 30 }, // D (PENGECER)
      { width: 20 }, // E (KECAMATAN)
      { width: 12 }, // F (STOK AWAL)
      { width: 12 }, // G (PENGADAAN)
      { width: 12 }, // H (PENYALURAN)
      { width: 12 }  // I (STOK AKHIR)
    ];

    const borderStyle = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    const decimalFormat = '#,##0.00';

    // 1. HEADER KANAN (KEPADA YTH) - Mulai Kolom G (Sesuai Visual Excel standard)
    worksheet.getCell('G1').value = templateInfo.kepada;
    worksheet.getCell('G2').value = templateInfo.penerima_1;
    worksheet.getCell('G3').value = templateInfo.penerima_2;
    worksheet.getCell('G4').value = templateInfo.alamat_penerima_1;
    worksheet.getCell('G5').value = templateInfo.alamat_penerima_2;
    
    // Styling Header Kanan: SEMUA DI-BOLD (Agar alamat sama dengan bagian atasnya)
    ['G1', 'G2', 'G3', 'G4', 'G5'].forEach(cell => {
      worksheet.getCell(cell).font = { name: 'Arial', size: 10, bold: true };
    });

    // 2. HEADER KIRI (DATA PERUSAHAAN)
    // Sesuai CSV: Kolom A = Label, Kolom C = Isi (Dengan prefix ": ")
    const leftHeaderMap = [
      { row: 6, label: "Code", val: templateInfo.code },
      { row: 7, label: "Provinsi", val: templateInfo.provinsi },
      { row: 8, label: "Nama Perusahaan", val: templateInfo.nama_perusahaan },
      { row: 9, label: "Alamat", val: templateInfo.alamat_perusahaan },
      { row: 10, label: "Telp/Fax", val: templateInfo.telp },
      { row: 11, label: "E-mail", val: templateInfo.email },
      { row: 12, label: "Kabupaten", val: templateInfo.kabupaten },
      { row: 13, label: "Periode", val: formatTanggalIndo(periode) },
    ];

    leftHeaderMap.forEach(item => {
      worksheet.getCell(`A${item.row}`).value = item.label;
      worksheet.getCell(`C${item.row}`).value = `: ${item.val}`;
      worksheet.getCell(`A${item.row}`).font = { name: 'Arial', size: 10 };
      worksheet.getCell(`C${item.row}`).font = { name: 'Arial', size: 10, bold: true };
    });

    // 3. JUDUL JENIS PUPUK
    // Sesuai CSV: Baris 14, Kolom I, Alignment Right
    worksheet.getCell('I14').value = templateInfo.jenis_pupuk;
    worksheet.getCell('I14').font = { name: 'Arial', size: 10, bold: true };
    worksheet.getCell('I14').alignment = { horizontal: 'right' };

    // 4. HEADER TABEL
    const hRow = worksheet.getRow(15);
    // Label header disamakan persis dengan CSV
    hRow.values = ["NO", "TANGGAL SO", "NO SO/TGL SALUR", "PENGECER", "KECAMATAN", "Stok Awal", "Pengadaan", "Penyaluran", "Stok Akhir"];
    hRow.eachCell(c => { 
      c.font = { name: 'Arial', size: 10, bold: true }; 
      c.border = borderStyle as any; 
      c.alignment = { horizontal: 'center', vertical: 'middle' }; 
      c.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'F2F2F2'} };
    });

    // 5. ISI TABEL
    let tAwal = 0, tAda = 0, tLur = 0;
    let currentRow = 16;

    soList.forEach((so, idx) => {
        let cur = (so.stokAwal || 0) + (so.pengadaan || 0);
        tAwal += (so.stokAwal || 0); tAda += (so.pengadaan || 0);
        
        // Baris Induk (SO)
        const rSO = worksheet.getRow(currentRow++);
        rSO.values = [
            idx + 1, 
            so.tanggalSO ? new Date(so.tanggalSO) : "", // Format Date asli untuk Excel
            so.noSO, 
            "", 
            so.kecamatan, 
            so.stokAwal || 0, 
            so.pengadaan || 0, 
            "", 
            cur
        ];
        
        // Formatting Baris Induk
        rSO.getCell(2).numFmt = 'dd-mmm-yy'; // Format tanggal Excel
        rSO.eachCell({ includeEmpty: true }, (c, col) => { 
            c.border = borderStyle as any;
            c.font = { name: 'Arial', size: 10 };
            if (col === 1) c.alignment = { horizontal: 'center' };
            if (col >= 6) c.numFmt = decimalFormat;
        });

        // Baris Anak (Penyaluran)
        so.penyaluranList.forEach(det => {
            cur -= (det.penyaluran || 0); 
            tLur += (det.penyaluran || 0);
            
            const rS = worksheet.getRow(currentRow++);
            rS.values = [
                "", 
                "", 
                det.tglSalur ? new Date(det.tglSalur) : "", // Format Date
                det.pengecer, 
                "", 
                "", 
                "", 
                det.penyaluran || 0, 
                cur
            ];

            // Formatting Baris Anak
            rS.getCell(3).numFmt = 'dd-mmm-yy';
            rS.eachCell({ includeEmpty: true }, (c, col) => { 
                c.border = borderStyle as any;
                c.font = { name: 'Arial', size: 10 };
                if (col >= 6) c.numFmt = decimalFormat;
            });
        });
        
        // Baris Kosong Pemisah antar SO (Sesuai pola CSV)
        currentRow++; 
    });

    // 6. TOTAL ROW
    const totalRow = worksheet.getRow(currentRow);
    totalRow.values = ["", "", "", "", "TOTAL", tAwal, tAda, tLur, (tAwal + tAda - tLur)];
    totalRow.eachCell({ includeEmpty: true }, (c, col) => { 
      if (col >= 5) { // Mulai dari kolom TOTAL
        c.font = { name: 'Arial', size: 10, bold: true }; 
        c.border = borderStyle as any; 
        if (col >= 6) c.numFmt = decimalFormat; 
      } 
    });

    // 7. TANDA TANGAN
    const signRow = currentRow + 3;
    worksheet.getCell(`F${signRow}`).value = `${templateInfo.kabupaten}, ${formatTanggalIndo(periode)}`;
    worksheet.getCell(`G${signRow+1}`).value = templateInfo.nama_perusahaan;
    worksheet.getCell(`G${signRow+6}`).value = `(${templateInfo.direktur})`;
    worksheet.getCell(`G${signRow+7}`).value = templateInfo.jabatan;
    
    // Formatting Tanda Tangan
    [`F${signRow}`, `G${signRow+1}`, `G${signRow+6}`, `G${signRow+7}`].forEach(addr => {
        worksheet.getCell(addr).font = { name: 'Arial', size: 10, bold: true };
    });

    // 8. TEMBUSAN
    const temRow = signRow + 9;
    worksheet.getCell(`A${temRow}`).value = "Tembusan :";
    worksheet.getCell(`A${temRow}`).font = { name: 'Arial', size: 10, underline: true };
    
    templateInfo.tembusan.forEach((t, i) => { 
      const cell = worksheet.getCell(`A${temRow + 1 + i}`);
      cell.value = `${i+1}. ${t}`; 
      cell.font = { name: 'Arial', size: 10 };
    });

    // Download File
    saveAs(new Blob([await workbook.xlsx.writeBuffer()]), `Rekap_DO_${templateInfo.jenis_pupuk}_${periode}.xlsx`);
  };

  const exportToPDF = () => {
    setIsExportMenuOpen(false);
    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    const rightX = pageWidth - 80;

    // Header Kanan
    doc.text(templateInfo.kepada, rightX, 15);
    doc.text(templateInfo.penerima_1, rightX, 20);
    doc.text(templateInfo.penerima_2, rightX, 25);
    doc.text(templateInfo.alamat_penerima_1, rightX, 30);
    doc.text(templateInfo.alamat_penerima_2, rightX, 35);

    // Header Kiri
    doc.setFont("helvetica", "normal");
    const leftHeader = [
      { l: "Code", v: `: ${templateInfo.code}` },
      { l: "Provinsi", v: `: ${templateInfo.provinsi}` },
      { l: "Nama Perusahaan", v: `: ${templateInfo.nama_perusahaan}` },
      { l: "Alamat", v: `: ${templateInfo.alamat_perusahaan}` },
      { l: "Telp/Fax", v: `: ${templateInfo.telp}` },
      { l: "E-mail", v: `: ${templateInfo.email}` },
      { l: "Kabupaten", v: `: ${templateInfo.kabupaten}` },
      { l: "Periode", v: `: ${formatTanggalIndo(periode)}` },
    ];

    let yLeft = 45;
    leftHeader.forEach(h => {
        doc.text(h.l, 15, yLeft);
        doc.text(h.v, 45, yLeft); // Align titik dua
        yLeft += 5;
    });

    doc.setFont("helvetica", "bold");
    doc.text(templateInfo.jenis_pupuk, pageWidth - 30, 85, { align: 'right' });

    const tableData: any[] = [];
    let tAwal = 0, tAda = 0, tLur = 0;

    soList.forEach((so, idx) => {
      let cur = (so.stokAwal || 0) + (so.pengadaan || 0);
      tAwal += (so.stokAwal || 0); tAda += (so.pengadaan || 0);
      
      // Row Induk
      tableData.push([
        idx + 1, 
        formatTanggalIndo(so.tanggalSO), 
        so.noSO, 
        "", 
        so.kecamatan, 
        formatDesimal(so.stokAwal || 0), 
        formatDesimal(so.pengadaan || 0), 
        "", 
        formatDesimal(cur)
      ]);
      
      // Row Anak
      so.penyaluranList.forEach(det => {
        cur -= (det.penyaluran || 0); tLur += (det.penyaluran || 0);
        tableData.push([
          "", 
          "", 
          formatTanggalIndo(det.tglSalur), 
          det.pengecer, 
          "", 
          "", 
          "", 
          formatDesimal(det.penyaluran || 0), 
          formatDesimal(cur)
        ]);
      });
    });

    tableData.push([
      { content: 'TOTAL', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }, 
      formatDesimal(tAwal), 
      formatDesimal(tAda), 
      formatDesimal(tLur), 
      formatDesimal(tAwal + tAda - tLur)
    ]);

    autoTable(doc, { 
      startY: 90, 
      head: [["NO", "TANGGAL SO", "NO SO/TGL SALUR", "PENGECER", "KECAMATAN", "Stok Awal", "Pengadaan", "Penyaluran", "Stok Akhir"]], 
      body: tableData, 
      theme: "grid",
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
      styles: { fontSize: 8, cellPadding: 1.5 },
      columnStyles: {
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'right' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Tanda Tangan PDF
    doc.text(`${templateInfo.kabupaten}, ${formatTanggalIndo(periode)}`, pageWidth - 60, finalY);
    doc.text(templateInfo.nama_perusahaan, pageWidth - 60, finalY + 5);
    doc.text(`(${templateInfo.direktur})`, pageWidth - 60, finalY + 25);
    doc.text(templateInfo.jabatan, pageWidth - 60, finalY + 30);

    // Tembusan PDF
    doc.text("Tembusan :", 15, finalY + 35);
    doc.setFont("helvetica", "normal");
    templateInfo.tembusan.forEach((t, i) => {
        doc.text(`${i+1}. ${t}`, 15, finalY + 40 + (i*5));
    });

    doc.save(`Rekap_DO_${templateInfo.jenis_pupuk}_${periode}.pdf`);
  };

  const inputClass = "w-full bg-transparent border-none focus:ring-0 px-2 py-1 text-sm font-bold text-slate-800 outline-none";

  if (view === "template") {
    return (
      <div className="min-h-screen bg-slate-200 p-8 flex flex-col items-center">
        <div className="max-w-[1200px] w-full bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col h-[95vh]">
          <div className="bg-slate-900 px-8 py-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-4">
              <button onClick={() => setView("dashboard")} className="hover:bg-white/10 p-2 rounded-xl transition"><ArrowLeft size={24}/></button>
              <h2 className="font-black text-sm tracking-widest uppercase">Editor Template Laporan</h2>
            </div>
            <button onClick={async () => { await ipcRenderer.invoke('db-save', { table: 'rekapdotemplate', id: 'current_session', data: templateInfo }); setView("dashboard"); }} className="bg-blue-600 hover:bg-blue-700 px-8 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 transition"><Save size={18}/> Simpan Perubahan</button>
          </div>
          
          <div className="flex-1 overflow-auto bg-slate-100 p-10 custom-scrollbar">
            <div className="bg-white mx-auto shadow-sm border border-slate-200 p-16 w-full flex flex-col space-y-12">
              
              <div className="flex justify-end">
                <div className="w-[450px] space-y-2 p-6 bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-2xl">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Tujuan Laporan (Kanan Atas)</p>
                  <input type="text" className="w-full text-right font-black bg-transparent outline-none border-b border-blue-100 focus:border-blue-400 py-1" value={templateInfo.kepada} onChange={e => setTemplateInfo({...templateInfo, kepada: e.target.value})} placeholder="Kepada Yth" />
                  <input type="text" className="w-full text-right font-black bg-transparent outline-none border-b border-blue-100 focus:border-blue-400 py-1" value={templateInfo.penerima_1} onChange={e => setTemplateInfo({...templateInfo, penerima_1: e.target.value})} placeholder="Jabatan Penerima" />
                  <input type="text" className="w-full text-right font-black bg-transparent outline-none border-b border-blue-100 focus:border-blue-400 py-1" value={templateInfo.penerima_2} onChange={e => setTemplateInfo({...templateInfo, penerima_2: e.target.value})} placeholder="Instansi Penerima" />
                  <input type="text" className="w-full text-right font-medium text-xs bg-transparent outline-none border-b border-blue-100 focus:border-blue-400 py-1" value={templateInfo.alamat_penerima_1} onChange={e => setTemplateInfo({...templateInfo, alamat_penerima_1: e.target.value})} placeholder="Alamat 1" />
                  <input type="text" className="w-full text-right font-medium text-xs bg-transparent outline-none border-b border-blue-100 focus:border-blue-400 py-1" value={templateInfo.alamat_penerima_2} onChange={e => setTemplateInfo({...templateInfo, alamat_penerima_2: e.target.value})} placeholder="Alamat 2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4 p-8 bg-emerald-50/30 border-2 border-dashed border-emerald-200 rounded-2xl text-slate-800">
                   <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Profil Perusahaan & Metadata (Kiri Atas)</p>
                   {[
                     { label: "Code", key: "code" }, 
                     { label: "Provinsi", key: "provinsi" },
                     { label: "Nama PT", key: "nama_perusahaan" },
                     { label: "Alamat", key: "alamat_perusahaan" },
                     { label: "Telp/Fax", key: "telp" },
                     { label: "E-mail", key: "email" },
                     { label: "Kabupaten", key: "kabupaten" },
                     { label: "Jenis Pupuk", key: "jenis_pupuk" }
                   ].map(item => (
                     <div key={item.key} className="flex items-center gap-4 border-b border-emerald-100 pb-2">
                        <span className="w-32 text-[10px] font-black text-slate-400 uppercase tracking-tighter">{item.label}</span>
                        <input type="text" className="flex-1 bg-transparent font-black text-sm outline-none focus:text-emerald-700" value={(templateInfo as any)[item.key]} onChange={e => setTemplateInfo({...templateInfo, [item.key]: e.target.value})} />
                     </div>
                   ))}
                </div>

                <div className="space-y-6">
                  <div className="p-8 bg-orange-50/30 border-2 border-dashed border-orange-200 rounded-2xl">
                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-4">Otorisasi (Tanda Tangan)</p>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <span className="w-24 text-[10px] font-black text-slate-400 uppercase">Nama</span>
                        <input type="text" className="flex-1 bg-transparent border-b border-orange-100 font-black text-sm outline-none" value={templateInfo.direktur} onChange={e => setTemplateInfo({...templateInfo, direktur: e.target.value})} />
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="w-24 text-[10px] font-black text-slate-400 uppercase">Jabatan</span>
                        <input type="text" className="flex-1 bg-transparent border-b border-orange-100 font-black text-sm outline-none" value={templateInfo.jabatan} onChange={e => setTemplateInfo({...templateInfo, jabatan: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Daftar Tembusan</p>
                    <div className="space-y-2">
                      {templateInfo.tembusan.map((t, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-xs font-black text-slate-400">{i+1}.</span>
                          <input type="text" className="flex-1 bg-transparent border-b border-slate-200 text-xs font-bold outline-none" value={t} 
                            onChange={e => {
                              const newTem = [...templateInfo.tembusan];
                              newTem[i] = e.target.value;
                              setTemplateInfo({...templateInfo, tembusan: newTem});
                            }} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "update") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-12 flex flex-col items-center justify-center">
        <div className="max-w-[600px] w-full bg-white p-12 rounded-[40px] shadow-2xl border border-slate-100 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
          <button onClick={() => setView("dashboard")} className="absolute top-8 left-8 p-2 text-slate-400 hover:text-slate-600 transition"><ArrowLeft size={24}/></button>
          <div className="inline-flex p-6 bg-blue-50 rounded-3xl text-blue-600 mb-4"><RefreshCw size={48} className="animate-spin"/></div>
          <div><h2 className="text-3xl font-black text-slate-900 tracking-tight">Pusat Pembaruan</h2><p className="text-slate-500 font-medium mt-2">Versi saat ini: <span className="font-black text-blue-600">v{appVersion}</span></p></div>
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-left"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Status Sistem</p><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div><span className="text-sm font-black text-slate-700">Aplikasi Mutakhir</span></div></div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex justify-between items-center relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-600 rounded-l-3xl"></div>
          <div className="flex items-center gap-5">
            <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-xl shadow-blue-200"><FileSpreadsheet size={32} /></div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight italic">Rekapitulasi DO {templateInfo.jenis_pupuk}</h1>
              <div className="flex items-center gap-2 mt-1">
                {isSyncing ? <span className="text-[10px] text-blue-500 font-black uppercase animate-pulse flex items-center gap-1"><RefreshCw size={12} className="animate-spin"/> Syncing...</span> : <span className="text-[10px] text-emerald-600 font-black uppercase flex items-center gap-1"><CheckCircle2 size={12}/> Database Active</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setView("update")} className="bg-white border border-slate-200 text-slate-500 px-6 py-2.5 rounded-2xl font-black text-sm hover:bg-slate-50 transition flex items-center gap-2">Update v{appVersion}</button>
            <button onClick={() => setView("template")} className="bg-slate-100 px-6 py-2.5 rounded-2xl font-black text-sm text-slate-700 hover:bg-slate-200 transition">Edit Template</button>
            <input type="date" className="border border-slate-200 px-4 py-2.5 rounded-2xl text-sm font-black bg-slate-50 text-slate-900 outline-none" value={periode} onChange={e => setPeriode(e.target.value)} />
            <div className="relative" ref={exportMenuRef}>
              <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="bg-blue-600 text-white px-10 py-3 rounded-2xl font-black hover:bg-blue-700 transition shadow-xl shadow-blue-200 uppercase text-xs tracking-widest flex items-center gap-3 border-2 border-blue-500">Export <ChevronDown size={20}/></button>
              {isExportMenuOpen && (
                <div className="absolute right-0 mt-4 w-64 bg-white shadow-2xl rounded-3xl border border-slate-100 py-3 z-[9999]">
                  <button onClick={exportToExcel} className="w-full text-left px-5 py-4 text-[13px] font-black text-slate-700 hover:bg-blue-50 flex items-center gap-4"><FileSpreadsheet size={20} className="text-emerald-500"/><span>Excel Document (.xlsx)</span></button>
                  <button onClick={exportToPDF} className="w-full text-left px-5 py-4 text-[13px] font-black text-slate-700 hover:bg-red-50 flex items-center gap-4"><FileText size={20} className="text-red-500"/><span>PDF Document (.pdf)</span></button>
                </div>
              )}
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
            <table className="w-full text-sm text-left border-collapse table-fixed">
              <thead className="text-[11px] text-slate-900 uppercase bg-slate-50 sticky top-0 z-30 border-b border-slate-300 font-black">
                <tr>
                  <th className="w-12 text-center border-r border-slate-300"><button onClick={toggleSelectAll} className="p-1.5">{selectedIds.length === getAllRowIds().length ? <CheckSquare size={18}/> : <Square size={18}/>}</button></th>
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
                        <td className="border-r border-slate-100 bg-blue-50/20"><input type="text" className={`${inputClass} text-blue-800 uppercase`} placeholder="Nomor SO..." value={so.noSO} onChange={e => updateSO(so.id, "noSO", e.target.value)} onKeyDown={(e) => handleKeyDown(e, so.id)} /></td>
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