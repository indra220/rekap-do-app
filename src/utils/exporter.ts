/* eslint-disable @typescript-eslint/no-explicit-any */
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDesimal, formatTanggalIndo, formatTanggalEnglish } from "./helpers";
import { SOData, TemplateData } from "@/types";

// ==========================================
// EXPORT EXCEL (UPDATE: KOLOM I LEBIH LEBAR)
// ==========================================
export const exportToExcel = async (soList: SOData[], templateInfo: TemplateData, periode: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Rekap DO");
    
    // Konfigurasi Lebar Kolom
    worksheet.columns = [
      { width: 5 },  // A: NO
      { width: 15 }, // B: TANGGAL SO
      { width: 25 }, // C: NO SO/TGL SALUR
      { width: 30 }, // D: PENGECER
      { width: 20 }, // E: KECAMATAN
      { width: 12 }, // F: Stok Awal
      { width: 12 }, // G: Pengadaan
      { width: 12 }, // H: Penyaluran
      { width: 30 }  // I: Stok Akhir (DIPERLEBAR AGAR TTD TIDAK POTONG)
    ];

    // Style Definisi
    const borderStyle = { 
      top: { style: "thin" }, 
      left: { style: "thin" }, 
      bottom: { style: "thin" }, 
      right: { style: "thin" } 
    };
    const fontRegular = { name: 'Arial', size: 10 };
    const fontBold = { name: 'Arial', size: 10, bold: true };
    const decimalFormat = '#,##0.00';
    const dateFormat = 'dd-mmm-yy'; 

    // --- HELPER UNTUK BORDER ---
    const applyRowStyle = (row: ExcelJS.Row, isHeader = false) => {
      for (let i = 1; i <= 9; i++) {
        const cell = row.getCell(i);
        cell.border = borderStyle as any;
        cell.font = isHeader ? fontBold : fontRegular;
        if (i >= 6 && !isHeader) cell.numFmt = decimalFormat;
        
        if (isHeader) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'F2F2F2'} };
        }
      }
    };

    // 1. HEADER KANAN
    worksheet.getCell('G1').value = templateInfo.kepada;
    worksheet.getCell('G2').value = templateInfo.penerima_1;
    worksheet.getCell('G3').value = templateInfo.penerima_2;
    worksheet.getCell('G4').value = templateInfo.alamat_penerima_1;
    worksheet.getCell('G5').value = templateInfo.alamat_penerima_2;
    ['G1', 'G2', 'G3', 'G4', 'G5'].forEach(c => worksheet.getCell(c).font = fontBold);

    // 2. HEADER KIRI
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
      worksheet.getCell(`A${item.row}`).font = fontRegular;
      worksheet.getCell(`C${item.row}`).font = fontBold;
    });

    // 3. JUDUL (RATA KIRI)
    worksheet.getCell('I14').value = templateInfo.jenis_pupuk;
    worksheet.getCell('I14').font = fontBold;
    worksheet.getCell('I14').alignment = { horizontal: 'left' }; 

    // 4. HEADER TABEL
    const hRow = worksheet.getRow(15);
    hRow.values = ["NO", "TANGGAL SO", "NO SO/TGL SALUR", "PENGECER", "KECAMATAN", "Stok Awal", "Pengadaan", "Penyaluran", "Stok Akhir"];
    applyRowStyle(hRow, true);

    // 5. SPACER AWAL
    let currentRow = 16;
    const spacerRow = worksheet.getRow(currentRow++);
    spacerRow.values = ["", "", "", "", "", "", "", "", ""];
    applyRowStyle(spacerRow);

    // 6. ISI DATA
    let tAwal = 0, tAda = 0, tLur = 0;

    soList.forEach((so, idx) => {
        let cur = (so.stokAwal || 0) + (so.pengadaan || 0);
        tAwal += (so.stokAwal || 0); tAda += (so.pengadaan || 0);
        
        // --- Baris Induk ---
        const rSO = worksheet.getRow(currentRow++);
        rSO.values = [
            idx + 1,                                
            so.tanggalSO ? new Date(so.tanggalSO) : "", 
            so.noSO,                                
            "",                                     
            so.kecamatan,                           
            so.stokAwal || 0,                       
            (so.pengadaan && so.pengadaan !== 0) ? so.pengadaan : null, 
            null,                                   
            cur                                     
        ];
        applyRowStyle(rSO);

        // Style Khusus Baris Induk (Abu-abu & Center)
        for (let i = 1; i <= 9; i++) {
          rSO.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9D9D9' } };
        }
        rSO.getCell(1).alignment = { horizontal: 'center' }; // NO
        rSO.getCell(2).alignment = { horizontal: 'center' }; // TGL SO
        rSO.getCell(3).alignment = { horizontal: 'center' }; // NO SO
        rSO.getCell(2).numFmt = dateFormat;

        // --- Baris Anak ---
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
            
            // Kolom C (Index 3) = TGL SALUR -> CENTER
            rS.getCell(3).numFmt = dateFormat;
            rS.getCell(3).alignment = { horizontal: 'center' }; 
        });
        
        // Spacer Antar DO
        const itemSpacer = worksheet.getRow(currentRow++);
        itemSpacer.values = ["", "", "", "", "", "", "", "", ""];
        applyRowStyle(itemSpacer);
    });

    // 7. TOTAL ROW
    const totalRow = worksheet.getRow(currentRow);
    totalRow.values = ["", "", "", "", "", tAwal, tAda, tLur, (tAwal + tAda - tLur)];
    worksheet.mergeCells(currentRow, 1, currentRow, 5); // Merge A-E

    for (let i = 1; i <= 9; i++) {
      const cell = totalRow.getCell(i);
      cell.border = borderStyle as any;
      cell.font = fontBold;
      if (i >= 6) cell.numFmt = decimalFormat;
    }

    // --- FOOTER (TANDA TANGAN) ---
    const signRow = currentRow + 3;

    // Helper untuk set cell tanda tangan (Merge & Center)
    const setSignCell = (rowOffset: number, value: string, isBold: boolean = true) => {
        const r = signRow + rowOffset;
        worksheet.mergeCells(r, 7, r, 9);
        const cell = worksheet.getCell(r, 7);
        cell.value = value;
        cell.font = isBold ? fontBold : fontRegular;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    };

    setSignCell(0, `${templateInfo.kabupaten}, ${formatTanggalEnglish(periode)}`);
    setSignCell(1, templateInfo.nama_perusahaan);
    setSignCell(6, `(${templateInfo.direktur})`);
    setSignCell(7, templateInfo.jabatan);

    const temRow = signRow + 9;
    worksheet.getCell(`A${temRow}`).value = "Tembusan :";
    worksheet.getCell(`A${temRow}`).font = { ...fontRegular, underline: true };
    
    templateInfo.tembusan.forEach((t, i) => { 
      const cell = worksheet.getCell(`A${temRow + 1 + i}`);
      cell.value = `${i+1}. ${t}`; 
      cell.font = fontRegular;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Rekap_DO_${templateInfo.jenis_pupuk}_${periode}.xlsx`);
};

// ==========================================
// EXPORT PDF
// ==========================================
export const exportToPDF = (soList: SOData[], templateInfo: TemplateData, periode: string) => {
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
        doc.text(h.v, 45, yLeft);
        yLeft += 5;
    });

    doc.setFont("helvetica", "bold");
    doc.text(templateInfo.jenis_pupuk, pageWidth - 30, 85, { align: 'right' });

    // Build Table
    const tableData: any[] = [];
    tableData.push(["", "", "", "", "", "", "", "", ""]); // Spacer Awal

    let tAwal = 0, tAda = 0, tLur = 0;

    soList.forEach((so, idx) => {
      let cur = (so.stokAwal || 0) + (so.pengadaan || 0);
      tAwal += (so.stokAwal || 0); tAda += (so.pengadaan || 0);
      
      tableData.push([
        idx + 1, 
        formatTanggalIndo(so.tanggalSO), 
        so.noSO, "", so.kecamatan, 
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

      tableData.push(["", "", "", "", "", "", "", "", ""]); // Spacer Item
    });

    // Total Row
    tableData.push([
      { content: '', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }, 
      formatDesimal(tAwal), 
      formatDesimal(tAda), 
      formatDesimal(tLur), 
      formatDesimal(tAwal + tAda - tLur)
    ]);

    autoTable(doc, { 
      startY: 90, 
      head: [["NO", "TANGGAL SO", "NO SO/TGL SALUR", "PENGECER", "KECAMATAN", "Stok Awal", "Pengadaan", "Penyaluran", "Stok Akhir"]], 
      body: tableData, 
      theme: "plain", 
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1, lineColor: [0,0,0] },
      bodyStyles: { lineWidth: 0.1, lineColor: [200, 200, 200] }, 
      styles: { fontSize: 8, cellPadding: 1.5, valign: 'middle' },
      columnStyles: { 
        1: { halign: 'center' }, // Tanggal SO
        2: { halign: 'center' }, // No SO / Tgl Salur
        5: { halign: 'right' }, 
        6: { halign: 'right' }, 
        7: { halign: 'right' }, 
        8: { halign: 'right' } 
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Titik Tengah Tanda Tangan
    const signCenterX = pageWidth - 40; 

    doc.text(`${templateInfo.kabupaten}, ${formatTanggalEnglish(periode)}`, signCenterX, finalY, { align: 'center' });
    doc.text(templateInfo.nama_perusahaan, signCenterX, finalY + 5, { align: 'center' });
    doc.text(`(${templateInfo.direktur})`, signCenterX, finalY + 25, { align: 'center' });
    doc.text(templateInfo.jabatan, signCenterX, finalY + 30, { align: 'center' });

    doc.text("Tembusan :", 15, finalY + 35);
    doc.setFont("helvetica", "normal");
    templateInfo.tembusan.forEach((t, i) => doc.text(`${i+1}. ${t}`, 15, finalY + 40 + (i*5)));

    doc.save(`Rekap_DO_${templateInfo.jenis_pupuk}_${periode}.pdf`);
};