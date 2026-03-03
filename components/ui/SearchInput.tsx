"use client";
import React from "react";
import { Search } from "lucide-react";

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Cari...",
  value,
  onChange,
  className = "w-full lg:w-80",
}) => {
  return (
    <div className={`relative flex items-center group ${className}`}>
      {/* Icon: Geser ke left-5, tebal stroke 2.5, berubah hijau saat fokus */}
      <Search 
        className="absolute left-5 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" 
        strokeWidth={2.5}
      />
      
      {/* Input: Rounded-2xl, Background Slate-50, Font Bold, Shadow Pop */}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-14 pr-5 py-3 rounded-2xl bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:shadow-[3px_3px_0_0_#34d399] transition-all font-bold text-sm"
      />
    </div>
  );
};

export default SearchInput;