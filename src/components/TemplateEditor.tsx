/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import { ArrowLeft, Save } from "lucide-react";
import { TemplateData } from "@/types";

interface TemplateEditorProps {
  templateInfo: TemplateData;
  setTemplateInfo: (data: TemplateData) => void;
  onSave: () => void;
  onBack: () => void;
}

export default function TemplateEditor({ templateInfo, setTemplateInfo, onSave, onBack }: TemplateEditorProps) {
  return (
    <div className="min-h-screen bg-slate-200 p-8 flex flex-col items-center">
      <div className="max-w-[1200px] w-full bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col h-[95vh]">
        <div className="bg-slate-900 px-8 py-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="hover:bg-white/10 p-2 rounded-xl transition"><ArrowLeft size={24}/></button>
            <h2 className="font-black text-sm tracking-widest uppercase">Editor Template Laporan</h2>
          </div>
          <button onClick={onSave} className="bg-blue-600 hover:bg-blue-700 px-8 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 transition"><Save size={18}/> Simpan Perubahan</button>
        </div>
        
        <div className="flex-1 overflow-auto bg-slate-100 p-10 custom-scrollbar">
          <div className="bg-white mx-auto shadow-sm border border-slate-200 p-16 w-full flex flex-col space-y-12">
            {/* Bagian Penerima */}
            <div className="flex justify-end">
              <div className="w-[450px] space-y-2 p-6 bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-2xl">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Tujuan Laporan (Kanan Atas)</p>
                <input type="text" className="w-full text-right font-black bg-transparent outline-none border-b border-blue-100 focus:border-blue-400 py-1" value={templateInfo.kepada} onChange={e => setTemplateInfo({...templateInfo, kepada: e.target.value})} placeholder="Kepada Yth" />
                <input type="text" className="w-full text-right font-black bg-transparent outline-none border-b border-blue-100 focus:border-blue-400 py-1" value={templateInfo.penerima_1} onChange={e => setTemplateInfo({...templateInfo, penerima_1: e.target.value})} placeholder="Jabatan Penerima" />
                <input type="text" className="w-full text-right font-black bg-transparent outline-none border-b border-blue-100 focus:border-blue-400 py-1" value={templateInfo.penerima_2} onChange={e => setTemplateInfo({...templateInfo, penerima_2: e.target.value})} placeholder="Instansi Penerima" />
                <input type="text" className="w-full text-right font-medium text-xs bg-transparent outline-none border-b border-blue-100 focus:border-blue-400 py-1" value={templateInfo.alamat_penerima_1} onChange={e => setTemplateInfo({...templateInfo, alamat_penerima_1: e.target.value})} placeholder="Alamat 1" />
                <input type="text" className="w-full text-right font-medium text-xs bg-transparent outline-none border-b border-blue-100 focus:border-blue-400 py-1" value={templateInfo.alamat_penerima_2} onChange={e => setTemplateInfo({...templateInfo, alamat_penerima_2: e.target.value})} placeholder="Alamat 2" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-10">
              {/* Bagian Perusahaan */}
              <div className="space-y-4 p-8 bg-emerald-50/30 border-2 border-dashed border-emerald-200 rounded-2xl text-slate-800">
                 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Profil Perusahaan & Metadata (Kiri Atas)</p>
                 {[
                   { label: "Code", key: "code" }, 
                   { label: "Provinsi", key: "provinsi" },
                   { label: "Nama PT", key: "nama_perusahaan" },
                   { label: "Alamat", key: "alamat_perusahaan" },
                   { label: "Telp/Fax", key: "telp" },
                   { label: "E-mail", key: "email" },
                   { label: "Kabupaten", key: "kabupaten" },
                   { label: "Jenis Pupuk", key: "jenis_pupuk" }
                 ].map(item => (
                   <div key={item.key} className="flex items-center gap-4 border-b border-emerald-100 pb-2">
                      <span className="w-32 text-[10px] font-black text-slate-400 uppercase tracking-tighter">{item.label}</span>
                      <input type="text" className="flex-1 bg-transparent font-black text-sm outline-none focus:text-emerald-700" value={(templateInfo as any)[item.key]} onChange={e => setTemplateInfo({...templateInfo, [item.key]: e.target.value})} />
                   </div>
                 ))}
              </div>

              {/* Bagian Tanda Tangan */}
              <div className="space-y-6">
                <div className="p-8 bg-orange-50/30 border-2 border-dashed border-orange-200 rounded-2xl">
                  <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-4">Otorisasi (Tanda Tangan)</p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="w-24 text-[10px] font-black text-slate-400 uppercase">Nama</span>
                      <input type="text" className="flex-1 bg-transparent border-b border-orange-100 font-black text-sm outline-none" value={templateInfo.direktur} onChange={e => setTemplateInfo({...templateInfo, direktur: e.target.value})} />
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="w-24 text-[10px] font-black text-slate-400 uppercase">Jabatan</span>
                      <input type="text" className="flex-1 bg-transparent border-b border-orange-100 font-black text-sm outline-none" value={templateInfo.jabatan} onChange={e => setTemplateInfo({...templateInfo, jabatan: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Daftar Tembusan</p>
                  <div className="space-y-2">
                    {templateInfo.tembusan.map((t, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-xs font-black text-slate-400">{i+1}.</span>
                        <input type="text" className="flex-1 bg-transparent border-b border-slate-200 text-xs font-bold outline-none" value={t} 
                          onChange={e => {
                            const newTem = [...templateInfo.tembusan];
                            newTem[i] = e.target.value;
                            setTemplateInfo({...templateInfo, tembusan: newTem});
                          }} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}