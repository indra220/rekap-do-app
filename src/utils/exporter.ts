/* eslint-disable @typescript-eslint/no-explicit-any */
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDesimal, formatTanggalIndo } from "./helpers";
import { SOData, TemplateData } from "@/types";

const formatTanggalSignature = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

// ==========================================
// EXPORT EXCEL
// ==========================================
export const exportToExcel = async (soList: SOData[], templateInfo: TemplateData, periode: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Rekap DO");
    
    worksheet.pageSetup = {
      paperSize: 9, 
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }
    };

    worksheet.columns = [
      { width: 5 },   
      { width: 14 },  
      { width: 22 },  
      { width: 26 },  
      { width: 16 },  
      { width: 12 },  
      { width: 12 },  
      { width: 12 },  
      { width: 12 }   
    ];

    const borderStyle = { 
      top: { style: "thin" }, left: { style: "thin" }, 
      bottom: { style: "thin" }, right: { style: "thin" } 
    };
    const fontRegular = { name: 'Arial', size: 9 }; 
    const fontBold = { name: 'Arial', size: 9, bold: true };
    const decimalFormat = '#,##0.00';
    const dateFormat = 'dd-mmm-yy'; 

    const applyRowStyle = (row: ExcelJS.Row, isHeader = false) => {
      for (let i = 1; i <= 9; i++) {
        const cell = row.getCell(i);
        cell.border = borderStyle as any;
        cell.font = isHeader ? fontBold : fontRegular;
        if (i >= 6 && !isHeader) cell.numFmt = decimalFormat;
        
        if (isHeader) {
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'F2F2F2'} };
        } else {
          const halign = (i >= 6) ? 'right' : (i === 1 || i === 2 || i === 3) ? 'center' : 'left';
          cell.alignment = { horizontal: halign, vertical: 'middle', wrapText: true };
        }
      }
    };

    let currentRow = 0;

    // --- KONDISI: HEADER PHONSKA vs UREA ---
    // PERBAIKAN: Menggunakan toUpperCase() agar kebal huruf besar/kecil
    if (templateInfo.jenis_pupuk?.toUpperCase() === "PHONSKA") {
      worksheet.getCell('A1').value = templateInfo.phonska_a1 || "LAPORAN ALUR DO PT MEGA AGRO SANJAYA";
      worksheet.getCell('A2').value = templateInfo.phonska_a2 || "KAB.TASIKMALAYA PROVINSI JAWA BARAT";
      
      const thn = new Date(periode).getFullYear();
      let a3 = templateInfo.phonska_a3 || "PERIODE TAHUN";
      if (!/\d{4}/.test(a3)) a3 = `${a3} ${thn}`;
      worksheet.getCell('A3').value = a3;
      
      worksheet.getCell('A4').value = templateInfo.phonska_a4 || "SIP3-Sistem informasi Penebusan & Penyaluran Pupuk Bersubsidi PT Petrokimia Gresik";
      
      ['A1', 'A2', 'A3', 'A4'].forEach(c => worksheet.getCell(c).font = fontBold);
      
      worksheet.getCell('I5').value = "PHONSKA";
      worksheet.getCell('I5').font = fontBold;
      worksheet.getCell('I5').alignment = { horizontal: 'right' };
      
      const hRow = worksheet.getRow(6);
      hRow.values = ["NO", "TANGGAL", "NO SO/TGL SALUR", "PENGECER", "KECAMATAN", "Stok Awal", "Pengadaan", "Penyaluran", "Stok Akhir"];
      applyRowStyle(hRow, true);
      
      currentRow = 7;
      const spacerRow = worksheet.getRow(currentRow++);
      spacerRow.values = ["", "", "", "", "", "", "", "", ""];
      applyRowStyle(spacerRow);

    } else {
      // HEADER KANAN (TUJUAN - UREA SAJA)
      const rightHeaders = [
        { cell: 'G1', val: templateInfo.kepada },
        { cell: 'G2', val: templateInfo.penerima_1 },
        { cell: 'G3', val: templateInfo.penerima_2 },
        { cell: 'G4', val: templateInfo.alamat_penerima_1 },
        { cell: 'G5', val: templateInfo.alamat_penerima_2 },
      ];
      rightHeaders.forEach(item => {
        if (item.val) {
          worksheet.getCell(item.cell).value = item.val;
          worksheet.getCell(item.cell).font = fontBold;
        }
      });

      // HEADER KIRI (PROFIL - UREA SAJA)
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
        if (item.val) {
          worksheet.getCell(`A${item.row}`).value = item.label;
          worksheet.getCell(`C${item.row}`).value = `: ${item.val}`;
          worksheet.getCell(`A${item.row}`).font = fontRegular;
          worksheet.getCell(`C${item.row}`).font = fontBold;
        }
      });

      if (templateInfo.jenis_pupuk) {
          worksheet.getCell('I14').value = templateInfo.jenis_pupuk;
          worksheet.getCell('I14').font = fontBold;
          worksheet.getCell('I14').alignment = { horizontal: 'right' }; 
      }

      const hRow = worksheet.getRow(15);
      hRow.values = ["NO", "TANGGAL SO", "NO SO/TGL SALUR", "PENGECER", "KECAMATAN", "Stok Awal", "Pengadaan", "Penyaluran", "Stok Akhir"];
      applyRowStyle(hRow, true);

      currentRow = 16;
      const spacerRow = worksheet.getRow(currentRow++);
      spacerRow.values = ["", "", "", "", "", "", "", "", ""];
      applyRowStyle(spacerRow);
    }

    // --- RENDER ISI TABEL ---
    let tAwal = 0, tAda = 0, tLur = 0;

    soList.forEach((so, idx) => {
        let cur = (so.stokAwal || 0) + (so.pengadaan || 0);
        tAwal += (so.stokAwal || 0); tAda += (so.pengadaan || 0);
        
        let finalNoSO = so.noSO;
        const prefix = (templateInfo as any).no_so_prefix;
        if (prefix && finalNoSO && !finalNoSO.startsWith(prefix)) {
            finalNoSO = `${prefix}${finalNoSO}`;
        }

        const rSO = worksheet.getRow(currentRow++);
        rSO.values = [
            idx + 1,                                
            so.tanggalSO ? new Date(so.tanggalSO) : "", 
            finalNoSO,                                
            "",                                     
            so.kecamatan,                           
            so.stokAwal || 0,                       
            (so.pengadaan && so.pengadaan !== 0) ? so.pengadaan : null, 
            null,                                   
            cur                                     
        ];
        applyRowStyle(rSO);

        for (let i = 1; i <= 9; i++) {
          rSO.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9D9D9' } };
        }
        
        rSO.getCell(2).font = fontBold;
        rSO.getCell(3).font = fontBold;
        rSO.getCell(2).numFmt = dateFormat;

        so.penyaluranList.forEach(det => {
            cur -= (det.penyaluran || 0); 
            tLur += (det.penyaluran || 0);
            
            const rS = worksheet.getRow(currentRow++);
            rS.values = [
                "", "", 
                det.tglSalur ? new Date(det.tglSalur) : "", 
                det.pengecer, "", "", "", 
                (det.penyaluran && det.penyaluran !== 0) ? det.penyaluran : null, 
                cur                                     
            ];
            applyRowStyle(rS);
            rS.getCell(3).numFmt = dateFormat;
        });
        
        const itemSpacer = worksheet.getRow(currentRow++);
        itemSpacer.values = ["", "", "", "", "", "", "", "", ""];
        applyRowStyle(itemSpacer);
    });

    const totalRow = worksheet.getRow(currentRow);
    totalRow.values = ["", "", "", "", "", tAwal, tAda, tLur, (tAwal + tAda - tLur)];
    worksheet.mergeCells(currentRow, 1, currentRow, 5); 

    for (let i = 1; i <= 9; i++) {
      const cell = totalRow.getCell(i);
      cell.border = borderStyle as any;
      cell.font = fontBold;
      if (i >= 6) cell.numFmt = decimalFormat;
      if (i === 1) cell.alignment = { horizontal: 'right', vertical: 'middle' };
    }

    // --- TTD & TEMBUSAN ---
    let nextRow = currentRow + 3;
    const hasTTD = !!templateInfo.direktur || !!templateInfo.jabatan;

    if (hasTTD) {
        const setSignCell = (rowOffset: number, value: string, isBold: boolean = true) => {
            const r = nextRow + rowOffset;
            worksheet.mergeCells(r, 7, r, 9);
            const cell = worksheet.getCell(r, 7);
            cell.value = value;
            cell.font = isBold ? fontBold : fontRegular;
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        };

        const ttdCity = templateInfo.kabupaten || "Tasikmalaya";
        setSignCell(0, `${ttdCity}, ${formatTanggalSignature(periode)}`);
        if (templateInfo.nama_perusahaan) setSignCell(1, templateInfo.nama_perusahaan);
        
        setSignCell(6, `(${templateInfo.direktur || "........................"})`);
        if (templateInfo.jabatan) setSignCell(7, templateInfo.jabatan);

        nextRow += 9; 
    }

    if (templateInfo.tembusan && templateInfo.tembusan.length > 0) {
      worksheet.getCell(`A${nextRow}`).value = "Tembusan :";
      worksheet.getCell(`A${nextRow}`).font = { ...fontRegular, underline: true };
      
      templateInfo.tembusan.forEach((t, i) => { 
        const cell = worksheet.getCell(`A${nextRow + 1 + i}`);
        cell.value = `${i+1}. ${t}`; 
        cell.font = fontRegular;
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Rekap_DO_${templateInfo.jenis_pupuk || "Data"}_${periode}.xlsx`);
};


// ==========================================
// EXPORT PDF
// ==========================================
export const exportToPDF = (soList: SOData[], templateInfo: TemplateData, periode: string) => {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "legal" 
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    
    let startY = 0;
    let tableHeaders: string[][] = [];

    // --- KONDISI: HEADER PHONSKA vs UREA ---
    // PERBAIKAN: Menggunakan toUpperCase() agar kebal huruf besar/kecil
    if (templateInfo.jenis_pupuk?.toUpperCase() === "PHONSKA") {
        let yLeft = 15;
        doc.text(templateInfo.phonska_a1 || "LAPORAN ALUR DO PT MEGA AGRO SANJAYA", 15, yLeft); yLeft += 5;
        doc.text(templateInfo.phonska_a2 || "KAB.TASIKMALAYA PROVINSI JAWA BARAT", 15, yLeft); yLeft += 5;
        
        const thn = new Date(periode).getFullYear();
        let a3 = templateInfo.phonska_a3 || "PERIODE TAHUN";
        if (!/\d{4}/.test(a3)) a3 = `${a3} ${thn}`;
        doc.text(a3, 15, yLeft); yLeft += 5;
        
        doc.text(templateInfo.phonska_a4 || "SIP3-Sistem informasi Penebusan & Penyaluran Pupuk Bersubsidi PT Petrokimia Gresik", 15, yLeft); yLeft += 5;
        
        doc.setFont("helvetica", "bold");
        doc.text("PHONSKA", pageWidth - 10, yLeft, { align: 'right' }); 
        
        startY = yLeft + 5;
        tableHeaders = [["NO", "TANGGAL", "NO SO/TGL SALUR", "PENGECER", "KECAMATAN", "Stok Awal", "Pengadaan", "Penyaluran", "Stok Akhir"]];
    } else {
        const rightX = pageWidth - 70;
        let yRight = 15;
        [templateInfo.kepada, templateInfo.penerima_1, templateInfo.penerima_2, templateInfo.alamat_penerima_1, templateInfo.alamat_penerima_2].forEach(val => {
            if (val) {
                doc.text(val, rightX, yRight);
                yRight += 5;
            }
        });

        doc.setFont("helvetica", "normal");
        let yLeft = 45;
        const leftHeader = [
          { l: "Code", v: templateInfo.code },
          { l: "Provinsi", v: templateInfo.provinsi },
          { l: "Nama Perusahaan", v: templateInfo.nama_perusahaan },
          { l: "Alamat", v: templateInfo.alamat_perusahaan },
          { l: "Telp/Fax", v: templateInfo.telp },
          { l: "E-mail", v: templateInfo.email },
          { l: "Kabupaten", v: templateInfo.kabupaten },
          { l: "Periode", v: formatTanggalIndo(periode) },
        ];

        leftHeader.forEach(h => {
            if (h.v) {
                doc.text(h.l, 15, yLeft);
                doc.text(`: ${h.v}`, 45, yLeft);
                yLeft += 5;
            }
        });

        if (templateInfo.jenis_pupuk) {
            doc.setFont("helvetica", "bold");
            doc.text(templateInfo.jenis_pupuk, pageWidth - 10, 85, { align: 'right' }); 
        }

        startY = 90;
        tableHeaders = [["NO", "TANGGAL SO", "NO SO/TGL SALUR", "PENGECER", "KECAMATAN", "Stok Awal", "Pengadaan", "Penyaluran", "Stok Akhir"]];
    }

    // --- TABEL KONTEN ---
    const tableData: any[] = [];
    tableData.push(["", "", "", "", "", "", "", "", ""]); 

    let tAwal = 0, tAda = 0, tLur = 0;

    soList.forEach((so, idx) => {
      let cur = (so.stokAwal || 0) + (so.pengadaan || 0);
      tAwal += (so.stokAwal || 0); tAda += (so.pengadaan || 0);
      
      let finalNoSO = so.noSO;
      const prefix = (templateInfo as any).no_so_prefix;
      if (prefix && finalNoSO && !finalNoSO.startsWith(prefix)) {
          finalNoSO = `${prefix}${finalNoSO}`;
      }

      tableData.push([
        idx + 1, 
        { content: formatTanggalIndo(so.tanggalSO), styles: { fontStyle: 'bold' } }, 
        { content: finalNoSO, styles: { fontStyle: 'bold' } }, 
        "", 
        so.kecamatan, 
        formatDesimal(so.stokAwal || 0), 
        (so.pengadaan && so.pengadaan !== 0) ? formatDesimal(so.pengadaan) : "", 
        "", 
        formatDesimal(cur)
      ]);
      
      so.penyaluranList.forEach(det => {
        cur -= (det.penyaluran || 0); tLur += (det.penyaluran || 0);
        tableData.push([
          "", "", 
          formatTanggalIndo(det.tglSalur), 
          det.pengecer, "", "", "", 
          (det.penyaluran && det.penyaluran !== 0) ? formatDesimal(det.penyaluran) : "", 
          formatDesimal(cur)
        ]);
      });

      tableData.push(["", "", "", "", "", "", "", "", ""]); 
    });

    tableData.push([
      { content: '', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }, 
      formatDesimal(tAwal), 
      formatDesimal(tAda), 
      formatDesimal(tLur), 
      formatDesimal(tAwal + tAda - tLur)
    ]);

    autoTable(doc, { 
      startY: startY, 
      head: tableHeaders, 
      body: tableData, 
      theme: "plain", 
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1, lineColor: [0,0,0], halign: 'center' },
      bodyStyles: { lineWidth: 0.1, lineColor: [200, 200, 200] }, 
      styles: { fontSize: 7.5, cellPadding: 1.5, valign: 'middle' },
      
      columnStyles: { 
        0: { halign: 'center', cellWidth: 8 }, 
        1: { halign: 'center', cellWidth: 'auto' }, 
        2: { halign: 'center', cellWidth: 'auto' }, 
        3: { cellWidth: 'auto' },               
        4: { cellWidth: 'auto' },                   
        5: { halign: 'right', cellWidth: 16 }, 
        6: { halign: 'right', cellWidth: 16 }, 
        7: { halign: 'right', cellWidth: 16 }, 
        8: { halign: 'right', cellWidth: 16 } 
      },
      margin: { left: 10, right: 10 }
    });

    // --- TTD & TEMBUSAN ---
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    
    const hasTTD = !!templateInfo.direktur || !!templateInfo.jabatan;
    const jumlahTembusan = templateInfo.tembusan ? templateInfo.tembusan.length : 0;
    
    const spaceNeeded = (hasTTD ? 35 : 0) + (jumlahTembusan > 0 ? (jumlahTembusan * 5) + 10 : 0);

    if (finalY + spaceNeeded > pageHeight) {
      doc.addPage();
      finalY = 20; 
    }

    if (hasTTD) {
      const signCenterX = pageWidth - 40; 
      const ttdCity = templateInfo.kabupaten || "Tasikmalaya";

      doc.text(`${ttdCity}, ${formatTanggalSignature(periode)}`, signCenterX, finalY, { align: 'center' });
      if (templateInfo.nama_perusahaan) doc.text(templateInfo.nama_perusahaan, signCenterX, finalY + 5, { align: 'center' });
      
      doc.text(`(${templateInfo.direktur || "........................"})`, signCenterX, finalY + 25, { align: 'center' });
      if (templateInfo.jabatan) doc.text(templateInfo.jabatan, signCenterX, finalY + 30, { align: 'center' });
    }

    if (jumlahTembusan > 0) {
      const tembusanY = finalY + (hasTTD ? 35 : 0); 
      doc.text("Tembusan :", 15, tembusanY);
      doc.setFont("helvetica", "normal");
      templateInfo.tembusan.forEach((t, i) => doc.text(`${i+1}. ${t}`, 15, tembusanY + 5 + (i*5)));
    }

    doc.save(`Rekap_DO_${templateInfo.jenis_pupuk || "Data"}_${periode}.pdf`);
};