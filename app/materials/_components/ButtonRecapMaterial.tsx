"use client";
import { useRouter } from "next/navigation";

interface MaterialRecapButtonProps {
  materialId: string;
}

export default function MaterialRecapButton({ materialId }: MaterialRecapButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/materials/${materialId}`)} // SEMENTARA langsung ke halaman materi, nanti diganti ke recap khusus
      className="w-full py-3 rounded-xl bg-emerald-500 text-white font-black border-2 border-emerald-600 border-b-4 hover:bg-emerald-400 active:border-b-2 active:translate-y-0.5 transition-all shadow-lg hover:shadow-emerald-200"
    >
      Lihat Rekapan Materi
    </button>
  );
}
