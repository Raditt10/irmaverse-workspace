"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface DatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  label?: string;
  placeholder?: string;
}

export default function DatePicker({
  value = "",
  onChange,
  label = "Tanggal",
  placeholder = "Pilih tanggal",
}: DatePickerProps) {
  const pad2 = (n: number) => String(n).padStart(2, "0");

  const formatDateOnlyLocal = (date: Date) => {
    // Format as YYYY-MM-DD in local time (avoid UTC shifting from toISOString)
    const y = date.getFullYear();
    const m = pad2(date.getMonth() + 1);
    const d = pad2(date.getDate());
    return `${y}-${m}-${d}`;
  };

  const parseValueToDate = (dateString: string): Date | null => {
    if (!dateString) return null;

    // If has time component, rely on native Date parsing
    if (dateString.includes("T")) {
      const dt = new Date(dateString);
      return isNaN(dt.getTime()) ? null : dt;
    }

    // Date-only string like YYYY-MM-DD should be treated as local date
    const m = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const dt = new Date(y, mo - 1, d);
    return isNaN(dt.getTime()) ? null : dt;
  };

  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const parsed = value ? parseValueToDate(value) : null;
    return parsed ?? new Date();
  });

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    );
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    const dateString = formatDateOnlyLocal(selectedDate);
    onChange?.(dateString);
    setIsOpen(false);
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return placeholder;

    const date = parseValueToDate(dateString);
    if (!date) return placeholder;

    return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days: Array<number | null> = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!value || !day) return false;
    const date = parseValueToDate(value);
    if (!date) return false;
    return (
      day === date.getDate() &&
      currentMonth.getMonth() === date.getMonth() &&
      currentMonth.getFullYear() === date.getFullYear()
    );
  };

  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-sm font-bold text-slate-700 mb-2">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-2xl border-2 border-slate-300 bg-white text-slate-700 font-bold flex items-center justify-between gap-2 shadow-[0_4px_0_0_#cbd5e1] hover:border-teal-400 hover:shadow-[0_4px_0_0_#14b8a6] transition-all active:translate-y-0.5 active:shadow-none"
      >
        <span className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-teal-500" />
          {formatDisplayDate(value)}
        </span>
        <ChevronRight
          className={`h-5 w-5 text-slate-400 transition-transform ${
            isOpen ? "rotate-90" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="fixed md:absolute bottom-0 md:bottom-full md:left-0 md:mb-2 z-50 bg-white rounded-t-3xl md:rounded-3xl border-4 border-slate-300 shadow-[0_8px_16px_rgba(0,0,0,0.1)] p-4 w-full md:max-w-sm md:w-auto inset-x-0 md:inset-auto md:mt-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </button>

            <div className="text-center">
              <div className="font-black text-lg text-slate-800">
                {monthNames[currentMonth.getMonth()]}{" "}
                {currentMonth.getFullYear()}
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-bold text-slate-600"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {days.map((day, index) => (
              <button
                type="button"
                key={index}
                onClick={() => day && handleDateSelect(day)}
                disabled={!day}
                className={`aspect-square rounded-lg font-bold text-sm transition-all ${
                  !day
                    ? "text-slate-200 cursor-default"
                    : isToday(day)
                      ? "bg-cyan-400 text-white border-2 border-cyan-600 shadow-[0_2px_0_0_#06b6d4] font-black"
                      : isSelected(day)
                        ? "bg-teal-400 text-white border-2 border-teal-600 shadow-[0_2px_0_0_#0f766e] font-black"
                        : "text-slate-700 hover:bg-slate-100 border-2 border-transparent hover:border-slate-300"
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Selected date display */}
          {value && (
            <div className="text-center p-3 bg-linear-to-r from-teal-50 to-cyan-50 rounded-2xl border-2 border-teal-200 mb-4">
              <div className="text-xs text-slate-500 font-bold mb-1">
                Tanggal Dipilih
              </div>
              <div className="text-lg font-black text-teal-600">
                {formatDisplayDate(value)}
              </div>
            </div>
          )}

          {/* Close button */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors"
          >
            Tutup
          </button>
        </div>
      )}
    </div>
  );
}
