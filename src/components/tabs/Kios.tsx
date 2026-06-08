/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Edit, Trash, Plus } from "lucide-react";
import InputRow from "../InputRow";

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function Kios({ masterData, viewMode, setViewMode, formData, setFormData, triggerDelete }: any) {
  if (viewMode === "list") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Daftar Pengecer (Kios)</h3>
          <button onClick={() => { setFormData({ id: generateId(), namaKios: "", kecamatan: "" }); setViewMode("form"); }} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 text-xs font-bold border border-slate-700 rounded transition flex items-center gap-2">
             <Plus size={14} /> TAMBAH MANUAL
          </button>
        </div>
        
        <div className="border border-slate-800 rounded bg-slate-900 overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
                <thead className="text-slate-400 uppercase border-b border-slate-800 bg-slate-950 font-bold tracking-wider">
                    <tr>
                        <th className="px-4 py-3">No</th>
                        <th className="px-4 py-3">Nama Kios</th>
                        <th className="px-4 py-3">Kecamatan</th>
                        <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                    {(!masterData.kiosList || masterData.kiosList.length === 0) && (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">Belum ada data kios.</td></tr>
                    )}
                    {masterData.kiosList?.map((k: any, idx: number) => (
                        <tr key={k.id} className="hover:bg-slate-800/30 transition">
                            <td className="px-4 py-3 font-medium text-slate-500">{idx + 1}</td>
                            <td className="px-4 py-3 font-semibold text-slate-200">{k.namaKios}</td>
                            <td className="px-4 py-3">{k.kecamatan || "-"}</td>
                            <td className="px-4 py-3">
                               <div className="flex justify-center gap-2">
                                 <button onClick={() => { setFormData(k); setViewMode("form"); }} className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded"><Edit size={14}/></button>
                                 <button onClick={() => triggerDelete(k.id)} className="p-1.5 text-red-500 hover:bg-red-900/20 rounded"><Trash size={14}/></button>
                               </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h3 className="text-sm font-bold text-slate-200 mb-6 uppercase border-b border-slate-800 pb-2">Editor Kios</h3>
      <div className="grid grid-cols-1 gap-x-6">
        <InputRow label="Nama Kios / Pengecer (Wajib)" value={formData.namaKios} onChange={(e: any) => setFormData({...formData, namaKios: e.target.value})} placeholder="Contoh: UD Tani Maju" />
        <InputRow label="Kecamatan" value={formData.kecamatan} onChange={(e: any) => setFormData({...formData, kecamatan: e.target.value})} placeholder="Contoh: Cihideung" />
      </div>
    </div>
  );
}