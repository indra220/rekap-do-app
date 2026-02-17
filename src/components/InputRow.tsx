import React from "react";

export default function InputRow({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (e: any) => void, placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5 mb-5">
      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
      <input 
        type="text" 
        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 font-bold outline-none text-slate-800 transition-colors" 
        value={value || ""} 
        onChange={onChange} 
        placeholder={placeholder}
      />
    </div>
  );
}