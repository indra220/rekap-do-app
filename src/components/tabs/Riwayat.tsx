/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import { Archive, FileText, FileSpreadsheet, Clock, Eye, Edit3, ChevronDown, CornerDownRight, Trash, ArrowLeft } from "lucide-react"; 
import { formatTanggalIndo, formatDesimal } from "@/utils/helpers";
import { SOData } from "@/types";

export default function Riwayat({ masterData, triggerDeleteHistory, triggerLoadHistory, onReExportHistory, showToast }: any) {
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const groupedHistory = (masterData.exportHistory || []).reduce((acc: any, item: any) => {
    if (!acc[item.periode_laporan]) acc[item.periode_laporan] = [];
    acc[item.periode_laporan].push(item);
    return acc;
  }, {});
  const sortedPeriodeKeys = Object.keys(groupedHistory).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const historyItemDetail = selectedHistoryId ? (masterData.exportHistory || []).find((h: any) => h.id === selectedHistoryId) : null;

  if (!selectedHistoryId) {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="mb-8 border-b border-slate-100 pb-4">
          <h3 className="text-xl font-black text-slate-800">Riwayat Export Laporan</h3>
          <p className="text-sm text-slate-500 font-medium mt-1">Daftar file yang pernah diexport. Snapshot tabel otomatis tersimpan.</p>
        </div>

        <div className="space-y-8">
          {sortedPeriodeKeys.length === 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center">
              <Archive size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-bold">Belum ada riwayat export.</p>
            </div>
          )}

          {sortedPeriodeKeys.map((periode: string) => (
            <div key={periode} className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
                <Clock className="text-slate-400" size={18} />
                <h4 className="font-black text-slate-700 uppercase tracking-widest text-sm">Periode: {formatTanggalIndo(periode)}</h4>
              </div>
              
              <div className="divide-y divide-slate-100">
                {groupedHistory[periode].map((item: any) => {
                  const exportTime = new Date(item.waktu_export).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={item.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition">
                      <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-2xl ${item.format === 'EXCEL' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                          {item.format === 'EXCEL' ? <FileSpreadsheet size={28} /> : <FileText size={28} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded font-black tracking-widest">{item.jenis_pupuk}</span>
                            <p className="font-black text-slate-800 text-lg">Pukul {exportTime}</p>
                          </div>
                          <div className="flex gap-4 text-xs font-bold text-slate-500">
                            <span><b className="text-slate-700">{item.total_do}</b> SO</span>
                            <span><b className="text-emerald-600">{formatDesimal(item.total_pengadaan)}</b> Masuk</span>
                            <span><b className="text-orange-600">{formatDesimal(item.total_penyaluran)}</b> Salur</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedHistoryId(item.id)} className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-2">
                          <Eye size={14} /> Lihat Detail
                        </button>
                        <button onClick={() => triggerDeleteHistory(item.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition" title="Hapus Riwayat">
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <button onClick={() => { setSelectedHistoryId(null); setIsExportMenuOpen(false); }} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm bg-slate-50 px-4 py-2 rounded-xl w-fit transition">
        <ArrowLeft size={16} /> Kembali ke Daftar
      </button>

      <div className="flex justify-between items-end mb-6 relative">
        <div>
          <h3 className="text-2xl font-black text-slate-800">Detail Riwayat Export</h3>
          <p className="text-slate-500 font-medium">Periode {formatTanggalIndo(historyItemDetail.periode_laporan)} • Jam {new Date(historyItemDetail.waktu_export).toLocaleTimeString('id-ID')}</p>
        </div>
        <div className="flex gap-2 relative">
            <button onClick={() => triggerLoadHistory(historyItemDetail.data_snapshot, historyItemDetail.periode_laporan)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200">
              <Edit3 size={16} /> Edit Data Ini (Ke Dashboard)
            </button>
            <div className="relative" ref={exportDropdownRef}>
              <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 border-2 border-emerald-500">
                Export Ulang <ChevronDown size={16} className={`transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`}/>
              </button>
              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <button onClick={() => { onReExportHistory('EXCEL', historyItemDetail.data_snapshot, historyItemDetail.periode_laporan); setIsExportMenuOpen(false); showToast("File Excel berhasil di-export ulang", "success"); }} className="w-full text-left px-5 py-3 text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 transition">
                    Format Excel (.xlsx)
                  </button>
                  <button onClick={() => { onReExportHistory('PDF', historyItemDetail.data_snapshot, historyItemDetail.periode_laporan); setIsExportMenuOpen(false); showToast("File PDF berhasil di-export ulang", "success"); }} className="w-full text-left px-5 py-3 text-sm font-bold text-slate-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 transition border-t border-slate-50">
                    Format PDF (.pdf)
                  </button>
                </div>
              )}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
            <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Total DO Tercatat</p>
            <p className="text-3xl font-black text-slate-800 leading-none">{historyItemDetail.total_do}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl">
            <p className="text-[10px] text-emerald-500 font-black uppercase mb-1">Total Pengadaan (Masuk)</p>
            <p className="text-3xl font-black text-emerald-700 leading-none">{formatDesimal(historyItemDetail.total_pengadaan)}</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 p-5 rounded-2xl">
            <p className="text-[10px] text-orange-500 font-black uppercase mb-1">Total Penyaluran (Keluar)</p>
            <p className="text-3xl font-black text-orange-700 leading-none">{formatDesimal(historyItemDetail.total_penyaluran)}</p>
          </div>
      </div>

      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
        <div className="bg-slate-800 text-white px-5 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2">
          <Eye size={14} /> Preview Isi Data (Hanya Baca)
        </div>
        <div className="overflow-auto max-h-[400px] custom-scrollbar">
          <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 uppercase font-black sticky top-0 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 border-r border-slate-200 w-10 text-center">No</th>
                <th className="px-4 py-3 border-r border-slate-200">Tgl SO/Salur</th>
                <th className="px-4 py-3 border-r border-slate-200">No SO / Kios</th>
                <th className="px-4 py-3 border-r border-slate-200 text-right">Awal</th>
                <th className="px-4 py-3 border-r border-slate-200 text-right">Pengadaan</th>
                <th className="px-4 py-3 text-right">Penyaluran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {historyItemDetail.data_snapshot?.map((so: SOData, idx: number) => (
                <React.Fragment key={so.id}>
                  <tr className="bg-slate-50/50">
                    <td className="px-4 py-2 border-r border-slate-200 text-center font-bold">{idx + 1}</td>
                    <td className="px-4 py-2 border-r border-slate-200">{formatTanggalIndo(so.tanggalSO)}</td>
                    <td className="px-4 py-2 border-r border-slate-200 font-bold text-blue-700">{so.noSO}</td>
                    <td className="px-4 py-2 border-r border-slate-200 text-right">{formatDesimal(so.stokAwal)}</td>
                    <td className="px-4 py-2 border-r border-slate-200 text-right text-emerald-600 font-bold">{so.pengadaan > 0 ? formatDesimal(so.pengadaan) : '-'}</td>
                    <td className="px-4 py-2 text-right">-</td>
                  </tr>
                  {so.penyaluranList?.map(det => (
                    <tr key={det.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 border-r border-slate-200"></td>
                      <td className="px-4 py-2 border-r border-slate-200 text-slate-400 flex items-center gap-1"><CornerDownRight size={12}/> {formatTanggalIndo(det.tglSalur)}</td>
                      <td className="px-4 py-2 border-r border-slate-200 italic">{det.pengecer}</td>
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
    </div>
  );
}