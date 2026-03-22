"use client";
import { useRouter } from "next/navigation";
import MaterialRecapButton from "./ButtonRecapMaterial";

interface MaterialUserActionsProps {
  materialId: string;
  isJoined: boolean;
  attendedAt?: string;
  materialDate: string;
  onNoRekapan?: () => void;
  programId?: string | null;
  isEnrolledInProgram?: boolean;
  onShowToast?: (message: string, type: "success" | "error") => void;
}

export default function MaterialUserActions({
  materialId,
  isJoined,
  attendedAt,
  materialDate,
  onNoRekapan,
  programId,
  isEnrolledInProgram,
  onShowToast,
}: MaterialUserActionsProps) {
  const router = useRouter();

  if (attendedAt) {
    return <MaterialRecapButton materialId={materialId} onNoRekapan={onNoRekapan} />;
  }

  const handleAbsensi = () => {
    if (programId && !isEnrolledInProgram) {
      if (onShowToast) {
        onShowToast("mohon maaf, kamu belum terdaftar di program kurikulum kajian ini", "error");
      }
      return;
    }
    router.push(`/materials/${materialId}/absensi`);
  };

  return (
    <button
      onClick={handleAbsensi}
      className="w-full py-3 rounded-xl bg-teal-400 text-white font-black border-2 border-teal-600 border-b-4 hover:bg-teal-500 active:border-b-2 active:translate-y-0.5 transition-all shadow-lg hover:shadow-teal-200"
    >
      Aku Ikut! ✋
    </button>
  );
}
