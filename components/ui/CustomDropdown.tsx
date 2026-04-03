"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, User } from "lucide-react";

interface Option {
  value: string;
  label: string;
  image?: string;
}

interface CustomDropdownProps {
  label?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const CustomDropdown = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Pilih opsi...",
  className = "",
}: CustomDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Menutup dropdown jika klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);
  const hasImages = options.some((opt) => opt.image);

  return (
    <div className={`space-y-2 ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full flex items-center justify-between
            rounded-xl lg:rounded-2xl 
            bg-white px-4 py-3 lg:px-5 lg:py-4 
            text-sm lg:text-base font-bold text-slate-700 
            border-2 border-teal-400 
            shadow-[0_4px_0_0_#2dd4bf] 
            transition-all duration-200
            active:translate-y-0.5 active:shadow-none
            focus:outline-none
            ${isOpen ? "translate-y-0.5 shadow-none border-teal-500" : ""}
          `}
        >
          <span className={`flex items-center gap-2 ${selectedOption ? "text-slate-700" : "text-slate-400"}`}>
            {hasImages && selectedOption?.image && (
              <img
                src={selectedOption.image}
                alt={selectedOption.label}
                className="w-6 h-6 rounded-full object-cover border border-slate-200"
              />
            )}
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-teal-500 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            strokeWidth={3}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-teal-100 rounded-xl lg:rounded-2xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="p-1 space-y-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 text-sm font-bold rounded-lg transition-colors
                    ${
                      value === option.value
                        ? "bg-teal-50 text-teal-600"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                    }
                  `}
                >
                  <span className="flex items-center gap-2">
                    {hasImages && (
                      option.image ? (
                        <img
                          src={option.image}
                          alt={option.label}
                          className="w-6 h-6 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      )
                    )}
                    {option.label}
                  </span>
                  {value === option.value && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomDropdown;