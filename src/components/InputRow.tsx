import React from "react";

export default function InputRow({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (e: any) => void, placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5 mb-5">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
      <input 
        type="text" 
        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-900/50 rounded-xl px-4 py-3 font-semibold outline-none text-slate-200 transition-all placeholder:text-slate-600 [color-scheme:dark]" 
        value={value || ""} 
        onChange={onChange} 
        placeholder={placeholder}
      />
    </div>
  );
}