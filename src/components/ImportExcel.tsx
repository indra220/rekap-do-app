/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import { Upload, CheckCircle2, AlertCircle, FileType, X } from 'lucide-react';

interface PenyaluranData {
  id: string;
  tglSalur: string;
  pengecer: string;
  penyaluran: number;
}

interface SOData {
  id: string;
  tanggalSO: string;
  noSO: string;
  kecamatan: string;
  stokAwal: number;
  pengadaan: number;
  penyaluranList: PenyaluranData[];
}

interface ImportProps {
  onDataLoaded: (data: SOData[]) => void;
  onClose: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

// HELPER: Mengambil teks dan memaksa format tanggal menjadi YYYY-MM-DD
const getSafeText = (cell: ExcelJS.Cell | undefined, isDate: boolean = false): string => {
  try {
    if (!cell || cell.value === null || cell.value === undefined) return "";
    
    let textVal = "";
    if (typeof cell.value === 'object') {
      if ('result' in cell.value) {
        textVal = cell.value.result !== null ? String(cell.value.result).trim() : "";
      } else if ('richText' in cell.value) {
        textVal = cell.text ? String(cell.text).trim() : "";
      } else if (cell.value instanceof Date) {
        const d = cell.value;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    } else {
      textVal = cell.text ? String(cell.text).trim() : String(cell.value).trim();
    }

    if (isDate && textVal) {
      const parsedDate = new Date(textVal);
      if (!isNaN(parsedDate.getTime())) {
        return `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}`;
      }
    }
    
    return textVal;
  } catch (error) {
    return "";
  }
};

// HELPER BARU: Membersihkan kata 'urea'/'phonska' dan mengubah ke Title Case (cth: "Culamega")
const cleanKecamatan = (text: string): string => {
  if (!text) return "";
  // Hapus kata urea atau phonska (case insensitive) lalu bersihkan spasi berlebih
  let cleaned = text.replace(/urea|phonska/gi, '').replace(/\s+/g, ' ').trim();
  // Ubah menjadi Title Case (Huruf awal setiap kata menjadi besar)
  return cleaned.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function ImportExcel({ onDataLoaded, onClose }: ImportProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatus(null);

    const workbook = new ExcelJS.Workbook();
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        
        if (file.name.toLowerCase().endsWith('.csv')) {
          const textDecoder = new TextDecoder('utf-8');
          const csvText = textDecoder.decode(buffer);
          const worksheet = workbook.addWorksheet('Sheet1');
          const rows = csvText.split(/\r?\n/);
          rows.forEach(row => {
            if (!row.trim()) return;
            const delimiter = row.includes(';') && !row.includes(',') ? /;(?=(?:(?:[^"]*"){2})*[^"]*$)/ : /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
            const cols = row.split(delimiter).map(col => col.replace(/^"|"$/g, '').trim());
            worksheet.addRow(cols);
          });
        } else {
          await workbook.xlsx.load(buffer);
        }

        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) throw new Error("Gagal membaca isi tabel.");

        // --- STEP 1: PENCARIAN KOLOM (DYNAMIC SCANNER) ---
        let headerRowIndex = -1;
        let colMap: Record<string, number> = {};
        let maxFound = 0;

        for (let i = 1; i <= 20; i++) {
          const row = worksheet.getRow(i);
          let currentMap: Record<string, number> = {};
          let foundCount = 0;

          row.eachCell((cell, colNumber) => {
            const text = getSafeText(cell).toLowerCase().replace(/[^a-z0-9]/g, '');
            if (!text) return;
            
            if (text === 'tanggalso' || text === 'tglso' || text === 'tanggal') { currentMap.tanggalSO = colNumber; foundCount++; }
            else if (text === 'noso' || text === 'nosotglsalur' || text === 'nomorso') { currentMap.noSOTglSalur = colNumber; foundCount++; }
            else if (text.includes('pengecer') || text.includes('kios') || text.includes('pembeli') || text.includes('ppts')) { currentMap.pengecer = colNumber; foundCount++; }
            else if (text.includes('kecamatan') || text.includes('kec')) { currentMap.kecamatan = colNumber; foundCount++; }
            else if (text.includes('stokawal') || text.includes('saldoawal')) { currentMap.stokAwal = colNumber; foundCount++; }
            else if (text.includes('pengadaan') || text.includes('tebus') || text.includes('prty')) { currentMap.pengadaan = colNumber; foundCount++; }
            else if (text === 'penyaluran' || text === 'salur' || text === 'volume' || text === 'jumlah') { currentMap.penyaluran = colNumber; foundCount++; }
            else if (text === 'tanggalsalur' || text === 'tglsalur' || text === 'tgldo') { currentMap.tglSalur = colNumber; foundCount++; }
          });

          if (foundCount > maxFound) {
            maxFound = foundCount;
            colMap = currentMap;
            headerRowIndex = i;
          }
        }

        if (headerRowIndex === -1 || maxFound === 0) {
          throw new Error("Gagal menemukan baris judul. Pastikan format kolom dikenali aplikasi.");
        }

        // --- STEP 2: MAPPING DATA (DENGAN GROUPING NO SO) ---
        const finalData: SOData[] = [];
        const soMap = new Map<string, SOData>(); 
        let currentSO: SOData | null = null;

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber <= headerRowIndex) return; 

          const rawTglSO = colMap.tanggalSO ? getSafeText(row.getCell(colMap.tanggalSO), true) : "";
          const rawGabungan = colMap.noSOTglSalur ? getSafeText(row.getCell(colMap.noSOTglSalur)) : "";
          
          // Memanggil fungsi pembersih kecamatan di sini
          const rawKecamatan = colMap.kecamatan ? cleanKecamatan(getSafeText(row.getCell(colMap.kecamatan))) : "";
          
          const valStokAwal = colMap.stokAwal ? parseFloat(getSafeText(row.getCell(colMap.stokAwal))) || 0 : 0;
          const valPengadaan = colMap.pengadaan ? parseFloat(getSafeText(row.getCell(colMap.pengadaan))) || 0 : 0;
          
          const rawPengecer = colMap.pengecer ? getSafeText(row.getCell(colMap.pengecer)) : "";
          const valPenyaluran = colMap.penyaluran ? parseFloat(getSafeText(row.getCell(colMap.penyaluran))) || 0 : 0;
          const rawTglSalur = colMap.tglSalur ? getSafeText(row.getCell(colMap.tglSalur), true) : "";

          if (!rawTglSO && !rawGabungan && !rawPengecer && !rawKecamatan) {
            return; 
          }

          let targetSO = rawGabungan ? soMap.get(rawGabungan) : undefined;

          if (targetSO) {
            if (rawPengecer !== "" || valPenyaluran > 0) {
              const tglSalurFinal = rawTglSalur || rawTglSO || "";
              targetSO.penyaluranList.push({
                id: generateId(),
                tglSalur: tglSalurFinal,
                pengecer: rawPengecer,
                penyaluran: valPenyaluran
              });
            }
            currentSO = targetSO; 
          } else {
            const isParentRow = rawTglSO !== "" || rawKecamatan !== "" || valPengadaan > 0 || valStokAwal > 0 || (!currentSO && rawGabungan !== "");

            if (isParentRow) {
              currentSO = {
                id: generateId(),
                tanggalSO: rawTglSO,
                noSO: rawGabungan,
                kecamatan: rawKecamatan,
                stokAwal: valStokAwal,
                pengadaan: valPengadaan, 
                penyaluranList: []
              };
              finalData.push(currentSO);

              if (rawGabungan) {
                soMap.set(rawGabungan, currentSO);
              }

              if (rawPengecer !== "" || valPenyaluran > 0) {
                currentSO.penyaluranList.push({
                  id: generateId(),
                  tglSalur: rawTglSalur || rawTglSO || "", 
                  pengecer: rawPengecer,
                  penyaluran: valPenyaluran
                });
              }
            } else if (currentSO) {
              const formattedTglSalur = rawTglSalur || (colMap.noSOTglSalur ? getSafeText(row.getCell(colMap.noSOTglSalur), true) : ""); 

              currentSO.penyaluranList.push({
                id: generateId(),
                tglSalur: formattedTglSalur, 
                pengecer: rawPengecer,
                penyaluran: valPenyaluran
              });
            }
          }
        });

        if (finalData.length === 0) throw new Error("Tidak ada data transaksi yang bisa diimpor.");

        // --- STEP 3: PENGURUTAN (SORTING) BERDASARKAN NO SO DARI KECIL KE BESAR ---
        finalData.sort((a, b) => {
          return a.noSO.localeCompare(b.noSO, undefined, { numeric: true, sensitivity: 'base' });
        });

        onDataLoaded(finalData);
        setStatus({ type: 'success', msg: `Berhasil mengimpor, mengelompokkan, dan mengurutkan ${finalData.length} DO.` });
        
        setTimeout(() => onClose(), 1500);

      } catch (err: any) {
        setStatus({ type: 'error', msg: err.message || "Gagal memproses file." });
      } finally {
        setIsProcessing(false);
        e.target.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-white rounded-3xl shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition">
          <X size={18} />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl shadow-inner border border-blue-100">
            <FileType size={28} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Import Rekap DO</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Mendukung Grouping & Sorting Otomatis</p>
          </div>
        </div>

        <label className={`
          relative flex flex-col items-center justify-center w-full h-44 
          border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300
          ${isProcessing ? 'bg-slate-50 border-slate-300' : 'bg-blue-50/30 border-blue-300 hover:border-blue-500 hover:bg-blue-50'}
        `}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            {isProcessing ? (
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-600"></div>
            ) : (
              <>
                <Upload className="w-10 h-10 mb-3 text-blue-500 mx-auto" />
                <p className="text-sm text-slate-700 font-bold mb-1">Klik atau Drag file Excel/CSV</p>
                <p className="text-xs text-slate-400 font-medium">Auto-Format Kecamatan (Title Case)</p>
              </>
            )}
          </div>
          <input type="file" className="hidden" accept=".xlsx, .csv" onChange={handleFileUpload} disabled={isProcessing} />
        </label>

        {status && (
          <div className={`mt-4 flex items-start gap-3 p-4 rounded-2xl text-sm font-medium animate-in slide-in-from-bottom-2 ${
            status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {status.type === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
            <p className="leading-snug">{status.msg}</p>
          </div>
        )}
      </div>
    </div>
  );
}