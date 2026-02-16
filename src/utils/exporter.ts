/* eslint-disable @typescript-eslint/no-explicit-any */
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDesimal, formatTanggalIndo, formatTanggalEnglish } from "./helpers";
import { SOData, TemplateData } from "@/types";

// ==========================================
// EXPORT EXCEL
// ==========================================
export const exportToExcel = async (soList: SOData[], templateInfo: TemplateData, periode: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Rekap DO");
    
    worksheet.columns = [
      { width: 5 },  
      { width: 15 }, 
      { width: 25 }, 
      { width: 30 }, 
      { width: 20 }, 
      { width: 12 }, 
      { width: 12 }, 
      { width: 12 }, 
      { width: 30 }  
    ];

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

    worksheet.getCell('G1').value = templateInfo.kepada;
    worksheet.getCell('G2').value = templateInfo.penerima_1;
    worksheet.getCell('G3').value = templateInfo.penerima_2;
    worksheet.getCell('G4').value = templateInfo.alamat_penerima_1;
    worksheet.getCell('G5').value = templateInfo.alamat_penerima_2;
    ['G1', 'G2', 'G3', 'G4', 'G5'].forEach(c => worksheet.getCell(c).font = fontBold);

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

    worksheet.getCell('I14').value = templateInfo.jenis_pupuk;
    worksheet.getCell('I14').font = fontBold;
    worksheet.getCell('I14').alignment = { horizontal: 'left' }; 

    const hRow = worksheet.getRow(15);
    hRow.values = ["NO", "TANGGAL SO", "NO SO/TGL SALUR", "PENGECER", "KECAMATAN", "Stok Awal", "Pengadaan", "Penyaluran", "Stok Akhir"];
    applyRowStyle(hRow, true);

    let currentRow = 16;
    const spacerRow = worksheet.getRow(currentRow++);
    spacerRow.values = ["", "", "", "", "", "", "", "", ""];
    applyRowStyle(spacerRow);

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
        rSO.getCell(1).alignment = { horizontal: 'center' }; 
        rSO.getCell(2).alignment = { horizontal: 'center' }; 
        rSO.getCell(3).alignment = { horizontal: 'center' }; 
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
            rS.getCell(3).alignment = { horizontal: 'center' }; 
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
    }

    const signRow = currentRow + 3;

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
// EXPORT PDF (UPDATE: KERTAS F4 / FOLIO)
// ==========================================
export const exportToPDF = (soList: SOData[], templateInfo: TemplateData, periode: string) => {
    // F-5 B Standar Indonesia menggunakan kertas F4/Folio (330.2 x 215.9 mm) Landscape
    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [330.2, 215.9] // Panjang x Lebar F4
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    
    // Karena kertas F4 lebih panjang dari A4, kita sesuaikan margin kanan
    const rightX = pageWidth - 90;

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

    // Tabel
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
        formatTanggalIndo(so.tanggalSO), 
        finalNoSO, "", so.kecamatan, 
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
      startY: 90, 
      head: [["NO", "TANGGAL SO", "NO SO/TGL SALUR", "PENGECER", "KECAMATAN", "Stok Awal", "Pengadaan", "Penyaluran", "Stok Akhir"]], 
      body: tableData, 
      theme: "plain", 
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1, lineColor: [0,0,0] },
      bodyStyles: { lineWidth: 0.1, lineColor: [200, 200, 200] }, 
      styles: { fontSize: 8, cellPadding: 1.5, valign: 'middle' },
      columnStyles: { 
        1: { halign: 'center' }, 
        2: { halign: 'center', cellWidth: 35 }, // Kolom No SO sedikit diperlebar
        3: { cellWidth: 70 }, // Kolom Pengecer diperlebar menyesuaikan kertas F4
        5: { halign: 'right' }, 
        6: { halign: 'right' }, 
        7: { halign: 'right' }, 
        8: { halign: 'right' } 
      }
    });

    // Auto Page-Break & Tanda Tangan
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Hitung sisa ruang untuk TTD & Tembusan
    const spaceNeeded = 45 + (templateInfo.tembusan.length * 5);

    // Jika tertabrak batas kertas bawah (Folio Height: 215.9 mm)
    if (finalY + spaceNeeded > pageHeight) {
      doc.addPage();
      finalY = 20; 
    }

    const signCenterX = pageWidth - 45; 

    doc.text(`${templateInfo.kabupaten}, ${formatTanggalEnglish(periode)}`, signCenterX, finalY, { align: 'center' });
    doc.text(templateInfo.nama_perusahaan, signCenterX, finalY + 5, { align: 'center' });
    doc.text(`(${templateInfo.direktur})`, signCenterX, finalY + 25, { align: 'center' });
    doc.text(templateInfo.jabatan, signCenterX, finalY + 30, { align: 'center' });

    doc.text("Tembusan :", 15, finalY + 35);
    doc.setFont("helvetica", "normal");
    templateInfo.tembusan.forEach((t, i) => doc.text(`${i+1}. ${t}`, 15, finalY + 40 + (i*5)));

    doc.save(`Rekap_DO_${templateInfo.jenis_pupuk}_${periode}.pdf`);
};