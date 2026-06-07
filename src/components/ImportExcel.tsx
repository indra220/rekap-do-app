/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import { Upload, CheckCircle2, AlertCircle, FileType, X, List, ChevronRight } from 'lucide-react';

interface PenyaluranData { id: string; tglSalur: string; pengecer: string; penyaluran: number; }
interface SOData { id: string; tanggalSO: string; noSO: string; kecamatan: string; stokAwal: number; pengadaan: number; penyaluranList: PenyaluranData[]; }

interface ImportProps {
  onDataLoaded: (data: SOData[]) => void;
  onClose: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);
const cleanKecamatan = (text: string): string => {
  if (!text) return "";
  let cleaned = text.replace(/urea|phonska|npk/gi, '').replace(/\s+/g, ' ').trim();
  return cleaned.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const getSafeText = (cell: ExcelJS.Cell | undefined, isDate: boolean = false): string => {
  try {
    if (!cell || cell.value === null || cell.value === undefined) return "";
    let textVal = "";
    if (typeof cell.value === 'object') {
      if ('result' in cell.value) { textVal = cell.value.result !== null ? String(cell.value.result).trim() : ""; } 
      else if ('richText' in cell.value) { textVal = cell.text ? String(cell.text).trim() : ""; } 
      else if (cell.value instanceof Date) { const d = cell.value; return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
    } else {
      textVal = cell.text ? String(cell.text).trim() : String(cell.value).trim();
    }
    if (isDate && textVal) {
      const indoDateMatch = textVal.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (indoDateMatch) return `${indoDateMatch[3]}-${indoDateMatch[2].padStart(2, '0')}-${indoDateMatch[1].padStart(2, '0')}`;
      const parsedDate = new Date(textVal);
      if (!isNaN(parsedDate.getTime())) return `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}`;
    }
    return textVal;
  } catch (error) { return ""; }
};

export default function ImportExcel({ onDataLoaded, onClose }: ImportProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [workbookData, setWorkbookData] = useState<ExcelJS.Workbook | null>(null);
  const [sheetOptions, setSheetOptions] = useState<string[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatus(null);
    setSheetOptions([]);
    setWorkbookData(null);

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

        const validSheets = workbook.worksheets.filter(ws => ws.rowCount > 0).map(ws => ws.name);
        if (validSheets.length === 0) throw new Error("File Excel kosong atau tidak memiliki data yang valid.");

        if (validSheets.length === 1) processWorksheet(workbook.getWorksheet(validSheets[0])!);
        else { setWorkbookData(workbook); setSheetOptions(validSheets); setIsProcessing(false); }
      } catch (err: any) {
        setStatus({ type: 'error', msg: err.message || "Gagal membaca file." });
        setIsProcessing(false);
      } finally { e.target.value = ''; }
    };
    reader.readAsArrayBuffer(file);
  };

  const processWorksheet = (worksheet: ExcelJS.Worksheet) => {
    setIsProcessing(true);
    setStatus(null);

    setTimeout(() => {
      try {
        let headerRowIndex = -1, colMap: Record<string, number> = {}, maxFound = 0;
        for (let i = 1; i <= 20; i++) {
          const row = worksheet.getRow(i);
          let currentMap: Record<string, number> = {}, foundCount = 0;
          row.eachCell((cell, colNumber) => {
            const text = getSafeText(cell).toLowerCase().replace(/[^a-z0-9]/g, '');
            if (!text) return;
            if (['tanggalso', 'tglso', 'tanggaldo', 'tgldo'].includes(text)) { currentMap.tanggalSO = colNumber; foundCount++; }
            else if (['noso', 'nosotglsalur', 'nomorso'].includes(text)) { currentMap.noSOTglSalur = colNumber; foundCount++; }
            else if (text.includes('pengecer') || text.includes('kios') || text.includes('pembeli') || text.includes('namappts') || text === 'ppts') { currentMap.pengecer = colNumber; foundCount++; }
            else if (text.includes('kecamatan') || text.includes('kec')) { currentMap.kecamatan = colNumber; foundCount++; }
            else if (text.includes('stokawal') || text.includes('saldoawal') || text === 'awal') { currentMap.stokAwal = colNumber; foundCount++; }
            else if (text.includes('pengadaan') || text.includes('tebus') || text.includes('masuk') || text === 'jumlah' || text === 'qty') { currentMap.pengadaan = colNumber; foundCount++; }
            else if (text.includes('penyaluran') || text.includes('salur') || text.includes('keluar')) { currentMap.penyaluran = colNumber; foundCount++; }
            else if (['tanggalsalur', 'tglsalur', 'tanggal', 'tgl'].includes(text)) { currentMap.tglSalur = colNumber; foundCount++; }
          });
          if (foundCount > maxFound) { maxFound = foundCount; colMap = currentMap; headerRowIndex = i; }
        }

        if (headerRowIndex === -1 || maxFound < 3) throw new Error(`Gagal menemukan format tabel di Sheet "${worksheet.name}". Pastikan tabel DO dikenali.`);

        const finalData: SOData[] = [];
        const soMap = new Map<string, SOData>(); 
        let currentSO: SOData | null = null;

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber <= headerRowIndex) return; 

          const rawTglSO = colMap.tanggalSO ? getSafeText(row.getCell(colMap.tanggalSO), true) : "";
          const rawGabungan = colMap.noSOTglSalur ? getSafeText(row.getCell(colMap.noSOTglSalur)) : "";
          const rawKecamatan = colMap.kecamatan ? cleanKecamatan(getSafeText(row.getCell(colMap.kecamatan))) : "";
          const valStokAwal = colMap.stokAwal ? parseFloat(getSafeText(row.getCell(colMap.stokAwal))) || 0 : 0;
          const valPengadaan = colMap.pengadaan ? parseFloat(getSafeText(row.getCell(colMap.pengadaan))) || 0 : 0;
          const rawPengecer = colMap.pengecer ? getSafeText(row.getCell(colMap.pengecer)) : "";
          let valPenyaluran = colMap.penyaluran ? parseFloat(getSafeText(row.getCell(colMap.penyaluran))) || 0 : 0;
          const rawTglSalur = colMap.tglSalur ? getSafeText(row.getCell(colMap.tglSalur), true) : "";

          if (!rawTglSO && !rawGabungan && !rawPengecer && !rawKecamatan && !rawTglSalur) return; 
          const isSummaryText = (textVal: string) => ['total', 'jumlah', 'grandtotal', 'subtotal'].includes(textVal.toLowerCase().replace(/[^a-z]/g, ''));
          if (isSummaryText(rawTglSO) || isSummaryText(rawGabungan) || isSummaryText(rawPengecer) || isSummaryText(rawKecamatan)) return; 

          if (valPenyaluran === 0 && valPengadaan > 0 && rawPengecer !== "") valPenyaluran = valPengadaan;

          let targetSO = rawGabungan ? soMap.get(rawGabungan) : undefined;

          if (targetSO) {
            if (valPengadaan > 0 && rawPengecer !== "") targetSO.pengadaan += valPengadaan;
            if (rawPengecer !== "" || valPenyaluran > 0) targetSO.penyaluranList.push({ id: generateId(), tglSalur: rawTglSalur || rawTglSO || "", pengecer: rawPengecer, penyaluran: valPenyaluran });
            currentSO = targetSO; 
          } else {
            const isParentRow = rawTglSO !== "" || rawKecamatan !== "" || valPengadaan > 0 || valStokAwal > 0 || (!currentSO && rawGabungan !== "");
            if (isParentRow) {
              currentSO = { id: generateId(), tanggalSO: rawTglSO, noSO: rawGabungan, kecamatan: rawKecamatan, stokAwal: valStokAwal, pengadaan: valPengadaan, penyaluranList: [] };
              finalData.push(currentSO);
              if (rawGabungan) soMap.set(rawGabungan, currentSO);
              if (rawPengecer !== "" || valPenyaluran > 0) currentSO.penyaluranList.push({ id: generateId(), tglSalur: rawTglSalur || rawTglSO || "", pengecer: rawPengecer, penyaluran: valPenyaluran });
            } else if (currentSO) {
              currentSO.penyaluranList.push({ id: generateId(), tglSalur: rawTglSalur || (colMap.noSOTglSalur ? getSafeText(row.getCell(colMap.noSOTglSalur), true) : ""), pengecer: rawPengecer, penyaluran: valPenyaluran });
            }
          }
        });

        if (finalData.length === 0) throw new Error(`Tidak ada data transaksi yang bisa diimpor dari Sheet "${worksheet.name}".`);

        finalData.sort((a, b) => a.noSO.localeCompare(b.noSO, undefined, { numeric: true, sensitivity: 'base' }));
        onDataLoaded(finalData);
        setStatus({ type: 'success', msg: `Berhasil mengimpor ${finalData.length} DO dari Sheet "${worksheet.name}".` });
        setTimeout(() => onClose(), 1500);
      } catch (err: any) {
        setStatus({ type: 'error', msg: err.message || "Gagal memproses file." });
        setIsProcessing(false);
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 border border-slate-700 hover:bg-slate-700 p-2 rounded-full transition">
          <X size={18} />
        </button>

        <div className="flex items-center gap-4 mb-6 shrink-0">
          <div className="p-3.5 bg-blue-900/30 text-blue-400 rounded-2xl border border-blue-900/50">
            {sheetOptions.length > 0 ? <List size={28} /> : <FileType size={28} />}
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">Import Rekap DO</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {sheetOptions.length > 0 ? "Pilih Sheet Data" : "Pendeteksi Multi-Format"}
            </p>
          </div>
        </div>

        {sheetOptions.length === 0 && (
          <label className={`
            relative flex flex-col items-center justify-center w-full h-44 shrink-0
            border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300
            ${isProcessing ? 'bg-slate-900 border-slate-700' : 'bg-blue-950/20 border-blue-900 hover:border-blue-700 hover:bg-blue-900/20'}
          `}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
              {isProcessing ? (
                <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-500"></div>
              ) : (
                <>
                  <Upload className="w-10 h-10 mb-3 text-blue-500 mx-auto" />
                  <p className="text-sm text-slate-300 font-bold mb-1">Klik atau Drag file Excel/CSV</p>
                  <p className="text-xs text-slate-500 px-4">File akan otomatis diproses setelah dipilih. Pastikan format tabel DO dikenali.</p>
                </>
              )}
            </div>
            <input type="file" className="hidden" accept=".xlsx, .csv" onChange={handleFileUpload} disabled={isProcessing} />
          </label>
        )}

        {sheetOptions.length > 0 && (
          <div className="flex-1 overflow-auto custom-scrollbar pr-2 pb-2">
            <p className="text-sm font-bold text-slate-300 mb-3">File ini memiliki beberapa Sheet. Pilih data mana yang ingin di-import:</p>
            <div className="space-y-2">
              {sheetOptions.map((sheetName, idx) => (
                <button 
                  key={idx}
                  onClick={() => processWorksheet(workbookData!.getWorksheet(sheetName)!)}
                  disabled={isProcessing}
                  className="w-full text-left bg-slate-950 border border-slate-800 hover:border-blue-500/50 hover:bg-blue-900/20 p-4 rounded-2xl flex items-center justify-between group transition-all disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-700 text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/50 transition-colors">
                      <FileType size={16} />
                    </div>
                    <span className="font-bold text-slate-300 group-hover:text-blue-300">{sheetName}</span>
                  </div>
                  {isProcessing ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div> : <ChevronRight size={18} className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {status && (
          <div className={`mt-4 shrink-0 flex items-start gap-3 p-4 rounded-2xl text-sm font-medium animate-in slide-in-from-bottom-2 border ${
            status.type === 'success' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50' : 'bg-red-950/30 text-red-400 border-red-900/50'
          }`}>
            {status.type === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
            <p className="leading-snug">{status.msg}</p>
          </div>
        )}
      </div>
    </div>
  );
}