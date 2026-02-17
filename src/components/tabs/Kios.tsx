/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Edit, Trash, Plus, Store } from "lucide-react";
import InputRow from "../InputRow";

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function Kios({ masterData, viewMode, setViewMode, formData, setFormData, triggerDelete }: any) {
  if (viewMode === "list") {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Store size={22} className="text-blue-600"/> Data Kios</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">Data Kios akan bertambah otomatis saat file Excel di-import.</p>
          </div>
          <button onClick={() => { setFormData({ id: generateId(), namaKios: "", kecamatan: "" }); setViewMode("form"); }} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition shadow-lg">
            <Plus size={16} /> Tambah Manual
          </button>
        </div>

        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
          <div className="overflow-auto max-h-[500px] custom-scrollbar">
            <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 uppercase font-black sticky top-0 border-b border-slate-200 z-10">
                <tr>
                  <th className="px-6 py-4 border-r border-slate-200 w-16 text-center">No</th>
                  <th className="px-6 py-4 border-r border-slate-200">Nama Pengecer / Kios</th>
                  <th className="px-6 py-4 border-r border-slate-200">Kecamatan</th>
                  <th className="px-6 py-4 text-center w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {(!masterData.kiosList || masterData.kiosList.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic">Belum ada data kios. Silakan import file atau tambah manual.</td>
                  </tr>
                )}
                {masterData.kiosList?.map((kios: any, idx: number) => (
                  <tr key={kios.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 border-r border-slate-200 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-6 py-3 border-r border-slate-200 font-bold text-slate-800">{kios.namaKios}</td>
                    <td className="px-6 py-3 border-r border-slate-200 text-slate-500">{kios.kecamatan || "- Kosong -"}</td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => { setFormData(kios); setViewMode("form"); }} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition" title="Edit Data">
                          <Edit size={16}/>
                        </button>
                        <button onClick={() => triggerDelete(kios.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition" title="Hapus Data">
                          <Trash size={16}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-3xl mx-auto">
      <div className="mb-8 border-b border-slate-100 pb-4">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Edit size={24} className="text-blue-500"/> Editor Data Kios</h3>
      </div>
      <div className="bg-blue-50 p-6 rounded-2xl mb-8 border border-blue-200">
        <p className="text-sm font-bold text-blue-800">Lengkapi informasi Kios/Pengecer di bawah ini. Data ini dapat digunakan untuk fitur Auto-Fill nantinya.</p>
      </div>
      <div className="grid grid-cols-1 gap-x-6">
        <InputRow label="Nama Kios / Pengecer (Wajib)" value={formData.namaKios} onChange={(e: any) => setFormData({...formData, namaKios: e.target.value})} placeholder="Contoh: UD Tani Maju" />
        <InputRow label="Kecamatan" value={formData.kecamatan} onChange={(e: any) => setFormData({...formData, kecamatan: e.target.value})} placeholder="Contoh: Cihideung" />
      </div>
    </div>
  );
}