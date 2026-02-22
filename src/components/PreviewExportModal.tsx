import React from "react";
import { Eye, X, FileSpreadsheet, FileText, CornerDownRight, FileBadge } from "lucide-react";
import { formatDesimal } from "@/utils/helpers";
import { SOData } from "@/types";

interface PreviewExportModalProps {
  isOpen: boolean;
  dataList: SOData[];
  templateInfo: any; // Menerima data template aktif
  onCancel: () => void;
  onExport: (format: 'EXCEL' | 'PDF') => void;
}

export default function PreviewExportModal({ isOpen, dataList, templateInfo, onCancel, onExport }: PreviewExportModalProps) {
  if (!isOpen) return null;

  // Pengecekan cerdas apakah data benar-benar kosong
  const isTujuanEmpty = !templateInfo?.kepada && !templateInfo?.penerima_1 && !templateInfo?.penerima_2;
  const isTtdEmpty = !templateInfo?.direktur && !templateInfo?.jabatan;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="px-8 py-5 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black flex items-center gap-2"><Eye size={20} className="text-blue-400"/> Preview Data Export</h3>
            <p className="text-xs text-slate-400 mt-1">Periksa kembali data Anda. Setelah proses export selesai, data di layar dashboard akan <b className="text-white bg-red-500 px-1.5 py-0.5 rounded ml-1">Dibersihkan / Reset</b>.</p>
          </div>
          <button onClick={onCancel} className="p-2 bg-slate-800 hover:bg-red-500 rounded-xl transition text-slate-300 hover:text-white">
            <X size={20}/>
          </button>
        </div>

        <div className="p-8 overflow-auto flex-1 bg-slate-50 custom-scrollbar">
          
          {/* INFORMASI TEMPLATE AKTIF (VERSI MINIMALIS) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm flex flex-wrap gap-y-4 gap-x-8 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                <FileBadge size={20} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase">Tipe Template</p>
                <p className="text-sm font-black text-blue-700">{templateInfo?.jenis_pupuk || "Tidak ada"}</p>
              </div>
            </div>
            
            <div className="w-px h-8 bg-slate-200 hidden md:block"></div>
            
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase">Tujuan Laporan</p>
              <p className="text-sm font-bold text-slate-700">{isTujuanEmpty ? "Tidak ada" : (templateInfo?.kepada || templateInfo?.penerima_1 || "Ada")}</p>
            </div>
            
            <div className="w-px h-8 bg-slate-200 hidden md:block"></div>
            
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase">Otorisasi (TTD)</p>
              <p className="text-sm font-bold text-slate-700">{isTtdEmpty ? "Tidak ada" : (templateInfo?.direktur || templateInfo?.jabatan || "Ada")}</p>
            </div>
            
            <div className="w-px h-8 bg-slate-200 hidden md:block"></div>
            
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase">Daftar Tembusan</p>
              <p className="text-sm font-bold text-slate-700">
                {templateInfo?.tembusan?.length > 0 ? `${templateInfo.tembusan.length} Item` : "Tidak ada"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Total DO Tercatat</p>
              <p className="text-2xl font-black text-slate-800 leading-none">{dataList.length}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-emerald-500 font-black uppercase mb-1">Total Pengadaan (Masuk)</p>
              <p className="text-2xl font-black text-emerald-700 leading-none">{formatDesimal(dataList.reduce((acc, so) => acc + (so.pengadaan || 0), 0))}</p>
            </div>
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-orange-500 font-black uppercase mb-1">Total Penyaluran (Keluar)</p>
              <p className="text-2xl font-black text-orange-700 leading-none">{formatDesimal(dataList.reduce((acc, so) => acc + so.penyaluranList.reduce((a, b) => a + (b.penyaluran || 0), 0), 0))}</p>
            </div>
          </div>

          <div className="overflow-auto max-h-[250px] custom-scrollbar border border-slate-200 rounded-2xl bg-white shadow-sm">
            <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-100 text-slate-600 uppercase font-black sticky top-0 border-b border-slate-200 z-10">
                <tr>
                  <th className="px-4 py-3 border-r border-slate-200 w-10 text-center">No</th>
                  <th className="px-4 py-3 border-r border-slate-200">Tgl SO/Salur</th>
                  <th className="px-4 py-3 border-r border-slate-200">No SO / Kios</th>
                  <th className="px-4 py-3 border-r border-slate-200">Kecamatan</th>
                  <th className="px-4 py-3 border-r border-slate-200 text-right">Stok Awal</th>
                  <th className="px-4 py-3 border-r border-slate-200 text-right">Pengadaan</th>
                  <th className="px-4 py-3 text-right">Penyaluran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {dataList.map((so: SOData, idx: number) => (
                  <React.Fragment key={so.id}>
                    <tr className="bg-slate-50/50">
                      <td className="px-4 py-2 border-r border-slate-200 text-center font-bold">{idx + 1}</td>
                      <td className="px-4 py-2 border-r border-slate-200">{so.tanggalSO}</td>
                      <td className="px-4 py-2 border-r border-slate-200 font-bold text-blue-700">{so.noSO}</td>
                      <td className="px-4 py-2 border-r border-slate-200">{so.kecamatan}</td>
                      <td className="px-4 py-2 border-r border-slate-200 text-right">{formatDesimal(so.stokAwal)}</td>
                      <td className="px-4 py-2 border-r border-slate-200 text-right text-emerald-600 font-bold">{so.pengadaan > 0 ? formatDesimal(so.pengadaan) : '-'}</td>
                      <td className="px-4 py-2 text-right">-</td>
                    </tr>
                    {so.penyaluranList?.map(det => (
                      <tr key={det.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2 border-r border-slate-200"></td>
                        <td className="px-4 py-2 border-r border-slate-200 text-slate-400 flex items-center gap-1"><CornerDownRight size={12}/> {det.tglSalur}</td>
                        <td className="px-4 py-2 border-r border-slate-200 italic">{det.pengecer}</td>
                        <td className="px-4 py-2 border-r border-slate-200"></td>
                        <td className="px-4 py-2 border-r border-slate-200"></td>
                        <td className="px-4 py-2 border-r border-slate-200"></td>
                        <td className="px-4 py-2 text-right text-orange-600 font-bold">{det.penyaluran > 0 ? formatDesimal(det.penyaluran) : '-'}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-8 py-5 bg-white border-t border-slate-200 flex justify-between items-center">
           <button onClick={onCancel} className="px-6 py-3 rounded-xl font-black text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Batal & Kembali Edit</button>
           <div className="flex gap-3">
             <button onClick={() => onExport('EXCEL')} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-black hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"><FileSpreadsheet size={18}/> Lanjut Export Excel</button>
             <button onClick={() => onExport('PDF')} className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-black hover:bg-red-700 transition shadow-lg shadow-red-200"><FileText size={18}/> Lanjut Export PDF</button>
           </div>
        </div>

      </div>
    </div>
  );
}