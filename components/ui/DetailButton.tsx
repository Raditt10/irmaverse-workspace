"use client";
import { Eye, Edit } from "lucide-react";
import DeleteButton from "./DeleteButton";

interface DetailButtonProps {
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  label?: string;
  className?: string;
  role?: "instruktur" | "admin" | "super_admin" | "member" | null;
  iconOnly?: boolean;
  showConfirm?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
}

export default function DetailButton({
  onClick,
  onEdit,
  onDelete,
  label = "Detail",
  className = "",
  role,
  iconOnly = false,
  showConfirm = true,
  confirmTitle,
  confirmMessage,
}: DetailButtonProps) {
  const isInstructor = role === "instruktur" || role === "admin" || role === "super_admin";

  // Base class untuk tombol utama (Detail)
  const mainButtonClass = `
    relative flex-1 flex items-center justify-center gap-2
    py-3 px-4 rounded-2xl
    font-black text-sm md:text-base
    border-2 border-b-4 transition-all duration-200
    active:border-b-2 active:translate-y-[2px]
    shadow-sm whitespace-nowrap
  `;

  // Base class untuk tombol aksi icon-only (Edit & Delete)
  // h-[52px] disesuaikan agar match dengan tinggi tombol detail yang punya py-3 + border
  const actionIconClass = `
    flex items-center justify-center
    h-[52px] w-[52px] shrink-0
    rounded-2xl border-2 border-b-4
    active:border-b-2 active:translate-y-[2px]
    transition-all duration-200 shadow-sm
  `;

  if (isInstructor && onEdit && onClick) {
    return (
      <div className={`flex items-center gap-2 w-full ${className}`}>
        {/* TOMBOL DETAIL (UTAMA) */}
        {iconOnly ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className={`
              ${actionIconClass}
              bg-teal-400 text-white border-teal-600 
              hover:bg-teal-500 hover:shadow-teal-100
            `}
            title="Lihat Detail"
          >
            <Eye className="w-5 h-5 stroke-[2.5]" />
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className={`
              ${mainButtonClass}
              bg-teal-400 text-white border-teal-600 
              hover:bg-teal-500 hover:shadow-teal-100
            `}
          >
            <Eye className="w-5 h-5 stroke-[2.5]" />
            <span>{label}</span>
          </button>
        )}

        {/* TOMBOL EDIT (ICON ONLY) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className={`
            ${actionIconClass}
            bg-emerald-400 text-white border-emerald-600 
            hover:bg-emerald-500 hover:shadow-emerald-100
          `}
          title="Edit Data"
        >
          <Edit className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* TOMBOL DELETE (ICON ONLY) */}
        {onDelete && (
          <DeleteButton
            onClick={onDelete}
            variant="icon-only"
            className={`${actionIconClass} p-0!`} // Override padding bawaan DeleteButton
            iconClassName="w-5 h-5 stroke-[2.5]"
            showConfirm={showConfirm}
            confirmTitle={confirmTitle}
            confirmMessage={confirmMessage}
          />
        )}
      </div>
    );
  }

  // TAMPILAN MEMBER (FULL WIDTH DETAIL)
  if (iconOnly) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick && onClick();
        }}
        className={`
          ${actionIconClass}
          bg-teal-400 text-white border-teal-600 hover:bg-teal-500
        `}
        title="Lihat Detail"
      >
        <Eye className="w-5 h-5 stroke-[2.5]" />
      </button>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick && onClick();
      }}
      className={`
        w-full ${mainButtonClass}
        bg-teal-400 text-white border-teal-600 hover:bg-teal-500
        py-3.5 text-base
      `}
    >
      <Eye className="w-5 h-5 stroke-[2.5]" /> {label}
    </button>
  );
}