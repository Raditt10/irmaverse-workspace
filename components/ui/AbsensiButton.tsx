"use client";
import { useRouter } from "next/navigation";
import { Book } from "lucide-react";
import DeleteButton from "./DeleteButton";
import MaterialEditButton from "./ButtonEdit";

interface MaterialInstructorActionsProps {
  materialId: string;
  onDelete: (materialId: string) => void;
  detailButton?: React.ReactNode;
}

export default function MaterialInstructorActions({
  materialId,
  onDelete,
  detailButton,
}: MaterialInstructorActionsProps) {
  const router = useRouter();

  return (
    <div className="flex gap-2 w-full items-center">
      <button
        onClick={() => router.push(`/materials/${materialId}/attendance`)}
        className="flex-1 min-w-0 py-3 px-4 rounded-xl bg-cyan-400 text-white font-black text-sm border-2 border-cyan-600 border-b-4 hover:bg-cyan-500 active:border-b-2 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
      >
        <Book className="w-4 h-4" /> Absensi
      </button>
      {detailButton}
      <MaterialEditButton id={materialId} />
      <DeleteButton
        onClick={() => onDelete(materialId)}
        variant="icon-only"
        showConfirm={true}
      />
    </div>
  );
}
