import React from "react";
import { Eye, X, FileSpreadsheet, FileText, CornerDownRight, FileBadge } from "lucide-react";
import { formatDesimal } from "@/utils/helpers";
import { SOData } from "@/types";

interface PreviewExportModalProps {
  isOpen: boolean;
  dataList: SOData[];
  templateInfo: any;
  onCancel: () => void;
  onExport: (format: 'EXCEL' | 'PDF') => void;
}

export default function PreviewExportModal({ isOpen, dataList, templateInfo, onCancel, onExport }: PreviewExportModalProps) {
  if (!isOpen) return null;

  const isTujuanEmpty = !templateInfo?.kepada && !templateInfo?.penerima_1 && !templateInfo?.penerima_2;
  const isTtdEmpty = !templateInfo?.direktur && !templateInfo?.jabatan;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 text-slate-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="px-8 py-5 bg-slate-950 text-white flex justify-between items-center border-b border-slate-800">
          <div>
            <h3 className="text-lg font-black flex items-center gap-2"><Eye size={20} className="text-blue-400"/> Preview Data Export</h3>
            <p className="text-xs text-slate-400 mt-1">Periksa kembali data Anda. Setelah proses export selesai, data di layar dashboard akan <b className="text-red-400 bg-red-950 border border-red-900/50 px-1.5 py-0.5 rounded ml-1">Dibersihkan / Reset</b>.</p>
          </div>
          <button onClick={onCancel} className="p-2 bg-slate-900 border border-slate-800 hover:bg-red-900/50 hover:text-red-400 rounded-xl transition text-slate-400">
            <X size={20}/>
          </button>
        </div>

        <div className="p-8 overflow-auto flex-1 bg-slate-950 custom-scrollbar">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 shadow-sm flex flex-wrap gap-y-4 gap-x-8 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-900/30 p-2 rounded-lg text-blue-400 border border-blue-900/30">
                <FileBadge size={20} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-black uppercase">Tipe Template</p>
                <p className="text-sm font-black text-blue-400">{templateInfo?.jenis_pupuk || "Tidak ada"}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-800 hidden md:block"></div>
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase">Tujuan Laporan</p>
              <p className="text-sm font-bold text-slate-200">{isTujuanEmpty ? "Tidak ada" : (templateInfo?.kepada || templateInfo?.penerima_1 || "Ada")}</p>
            </div>
            <div className="w-px h-8 bg-slate-800 hidden md:block"></div>
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase">Otorisasi (TTD)</p>
              <p className="text-sm font-bold text-slate-200">{isTtdEmpty ? "Tidak ada" : (templateInfo?.direktur || templateInfo?.jabatan || "Ada")}</p>
            </div>
            <div className="w-px h-8 bg-slate-800 hidden md:block"></div>
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase">Daftar Tembusan</p>
              <p className="text-sm font-bold text-slate-200">{templateInfo?.tembusan?.length > 0 ? `${templateInfo.tembusan.length} Item` : "Tidak ada"}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Total DO Tercatat</p>
              <p className="text-2xl font-black text-white leading-none">{dataList.length}</p>
            </div>
            <div className="bg-emerald-950/30 border border-emerald-900/30 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-emerald-500 font-black uppercase mb-1">Total Pengadaan (Masuk)</p>
              <p className="text-2xl font-black text-emerald-400 leading-none">{formatDesimal(dataList.reduce((acc, so) => acc + (so.pengadaan || 0), 0))}</p>
            </div>
            <div className="bg-orange-950/30 border border-orange-900/30 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-orange-500 font-black uppercase mb-1">Total Penyaluran (Keluar)</p>
              <p className="text-2xl font-black text-orange-400 leading-none">{formatDesimal(dataList.reduce((acc, so) => acc + so.penyaluranList.reduce((a, b) => a + (b.penyaluran || 0), 0), 0))}</p>
            </div>
          </div>

          <div className="overflow-auto max-h-[250px] custom-scrollbar border border-slate-800 rounded-2xl bg-slate-900 shadow-sm">
            <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-950 text-slate-400 uppercase font-black sticky top-0 border-b border-slate-800 z-10">
                <tr>
                  <th className="px-4 py-3 border-r border-slate-800 w-10 text-center">No</th>
                  <th className="px-4 py-3 border-r border-slate-800">Tgl SO/Salur</th>
                  <th className="px-4 py-3 border-r border-slate-800">No SO / Kios</th>
                  <th className="px-4 py-3 border-r border-slate-800">Kecamatan</th>
                  <th className="px-4 py-3 border-r border-slate-800 text-right">Stok Awal</th>
                  <th className="px-4 py-3 border-r border-slate-800 text-right">Pengadaan</th>
                  <th className="px-4 py-3 text-right">Penyaluran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300 font-medium">
                {dataList.map((so: SOData, idx: number) => (
                  <React.Fragment key={so.id}>
                    <tr className="bg-slate-900/50 hover:bg-slate-800/50 transition">
                      <td className="px-4 py-2 border-r border-slate-800 text-center font-bold">{idx + 1}</td>
                      <td className="px-4 py-2 border-r border-slate-800">{so.tanggalSO}</td>
                      <td className="px-4 py-2 border-r border-slate-800 font-bold text-blue-400">{so.noSO}</td>
                      <td className="px-4 py-2 border-r border-slate-800">{so.kecamatan}</td>
                      <td className="px-4 py-2 border-r border-slate-800 text-right">{formatDesimal(so.stokAwal)}</td>
                      <td className="px-4 py-2 border-r border-slate-800 text-right text-emerald-400 font-bold">{so.pengadaan > 0 ? formatDesimal(so.pengadaan) : '-'}</td>
                      <td className="px-4 py-2 text-right">-</td>
                    </tr>
                    {so.penyaluranList?.map(det => (
                      <tr key={det.id} className="hover:bg-slate-800/50 transition">
                        <td className="px-4 py-2 border-r border-slate-800"></td>
                        <td className="px-4 py-2 border-r border-slate-800 text-slate-500 flex items-center gap-1"><CornerDownRight size={12}/> {det.tglSalur}</td>
                        <td className="px-4 py-2 border-r border-slate-800 italic">{det.pengecer}</td>
                        <td className="px-4 py-2 border-r border-slate-800"></td>
                        <td className="px-4 py-2 border-r border-slate-800"></td>
                        <td className="px-4 py-2 border-r border-slate-800"></td>
                        <td className="px-4 py-2 text-right text-orange-400 font-bold">{det.penyaluran > 0 ? formatDesimal(det.penyaluran) : '-'}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-8 py-5 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
           <button onClick={onCancel} className="px-6 py-3 rounded-xl font-black text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 transition border border-slate-700">Batal & Kembali Edit</button>
           <div className="flex gap-3">
             <button onClick={() => onExport('EXCEL')} className="flex items-center gap-2 bg-emerald-700 text-white px-6 py-3 rounded-xl font-black hover:bg-emerald-600 transition shadow-lg shadow-emerald-900/30"><FileSpreadsheet size={18}/> Lanjut Export Excel</button>
             <button onClick={() => onExport('PDF')} className="flex items-center gap-2 bg-red-700 text-white px-6 py-3 rounded-xl font-black hover:bg-red-600 transition shadow-lg shadow-red-900/30"><FileText size={18}/> Lanjut Export PDF</button>
           </div>
        </div>

      </div>
    </div>
  );
}