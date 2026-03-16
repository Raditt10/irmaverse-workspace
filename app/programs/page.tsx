"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import Loading from "@/components/ui/Loading";
import SuccessDataFound from "@/components/ui/SuccessDataFound";
import SearchInput from "@/components/ui/SearchInput";
import EmptyState from "@/components/ui/EmptyState";
import DetailButton from "@/components/ui/DetailButton";
import CartoonConfirmDialog from "@/components/ui/ConfirmDialog";
import Toast from "@/components/ui/Toast";
import CategoryFilter from "@/components/ui/CategoryFilter";
import AddButton from "@/components/ui/AddButton";
import {
  BookOpen,
  ChevronDown,
  Plus,
  Target,
  Clock3,
  Users,
  BarChart3,
  GraduationCap,
} from "lucide-react";

interface Program {
  id: string;
  title: string;
  description: string | null;
  duration: string;
  level: string;
  category: string;
  thumbnail?: string;
  instructor: string;
  materialCount: number;
  enrollmentCount: number;
  isEnrolled: boolean;
  isCompleted: boolean;
}

const OurPrograms = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua Kategori");
  const [selectedStatus, setSelectedStatus] = useState("Semua Status");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<string | null>(null);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const router = useRouter();
  const { data: session } = useSession({ required: false });

  const isPrivileged =
    session?.user?.role === "instruktur" || session?.user?.role === "admin" || session?.user?.role === "super_admin";

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const res = await fetch("/api/programs");
      if (!res.ok) throw new Error("Gagal mengambil data program");
      const data = await res.json();
      setPrograms(
        data.map((p: any, i: number) => ({
          ...p,
          thumbnail:
            p.thumbnail || `https://picsum.photos/seed/program${i + 1}/400/250`,
        })),
      );
    } catch (error: any) {
      console.error("Error fetching programs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProgram = (programId: string) => {
    setProgramToDelete(programId);
    setShowConfirmDelete(true);
  };

  const confirmDeleteProgram = async () => {
    if (!programToDelete) return;
    try {
      const res = await fetch(`/api/programs/${programToDelete}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menghapus program");
      }
      setPrograms(programs.filter((p) => p.id !== programToDelete));
      showToast("Program berhasil dihapus", "success");
    } catch (error: any) {
      showToast(error.message || "Gagal menghapus program", "error");
    } finally {
      setShowConfirmDelete(false);
      setProgramToDelete(null);
    }
  };

  const filteredPrograms = programs.filter((program) => {
    const matchSearch = (program?.title?.toLowerCase() ?? "").includes(
      searchTerm.toLowerCase(),
    );

    let matchCategory = true;
    if (selectedCategory !== "Semua Kategori") {
      if (selectedCategory === "Next Level") {
        matchCategory = program.category === "Program Next Level";
      } else {
        matchCategory = program.category === selectedCategory;
      }
    }

    let matchStatus = true;
    if (selectedStatus === "Selesai") {
      matchStatus = program.isCompleted === true;
    } else if (selectedStatus === "Belum Selesai") {
      matchStatus = program.isCompleted === false;
    }

    return matchSearch && matchCategory && matchStatus;
  });

  const categories = [
    "Semua Kategori",
    "Program Wajib",
    "Program Ekstra",
    "Next Level",
  ];
  
  const subCategories = isPrivileged ? [] : ["Semua Status", "Belum Selesai", "Selesai"];

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />

        <div className="flex-1 w-full max-w-[100vw] overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 lg:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-2xl lg:text-4xl font-black text-slate-800 tracking-tight mb-1.5 leading-tight">
                  {isPrivileged ? "Kelola Program" : "Program Kurikulum"}
                </h1>
                <p className="text-slate-500 font-medium text-xs lg:text-lg">
                  {isPrivileged
                    ? "Buat dan kelola program kurikulum untuk anggota"
                    : "Ikuti program untuk meningkatkan pengetahuan keagamaan"}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                {isPrivileged && (
                  <div className="flex flex-wrap gap-3 text-xs font-bold">
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 shadow-sm">
                      <GraduationCap className="h-3.5 w-3.5" />
                      <span>{programs.length} Program</span>
                    </div>
                  </div>
                )}

                {isPrivileged && (
                  <AddButton
                    label="Buat Program"
                    onClick={() => router.push("/programs/create")}
                    icon={<Plus className="h-5 w-5" />}
                    color="emerald"
                    hideIcon={false}
                  />
                )}
              </div>
            </div>

            {!loading && programs.length > 0 && (
              <div className="mb-8 flex flex-col gap-4">
                <div className="w-full">
                  <SearchInput
                    placeholder="Cari program ..."
                    value={searchTerm}
                    onChange={setSearchTerm}
                    className="w-full"
                  />
                </div>

                <CategoryFilter
                  categories={categories}
                  subCategories={subCategories}
                  selectedCategory={selectedCategory}
                  selectedSubCategory={selectedStatus}
                  onCategoryChange={setSelectedCategory}
                  onSubCategoryChange={setSelectedStatus}
                />
              </div>
            )}

            {loading ? (
              <div className="text-center py-20">
                <Loading text="Memuat Program..." />
              </div>
            ) : programs.length === 0 ? (
              <EmptyState
                icon="search"
                title="Belum ada Program"
                description="Program kurikulum belum tersedia saat ini. Cek lagi nanti ya!"
              />
            ) : filteredPrograms.length === 0 ? (
              <EmptyState
                icon="search"
                title="Tidak ada Program yang cocok"
                description="Coba cari dengan kata kunci lain atau ubah filter kategorinya!"
                actionLabel="Reset Pencarian"
                onAction={() => {
                  setSearchTerm("");
                  setSelectedCategory("Semua Kategori");
                  setSelectedStatus("Semua Status");
                }}
              />
            ) : (
              <>
                {searchTerm && (
                  <div className="mb-8">
                    <SuccessDataFound
                      message={`Ditemukan ${filteredPrograms.length} program sesuai pencarian`}
                      icon="sparkles"
                    />
                  </div>
                )}

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                  {filteredPrograms.map((program) => (
                    <div
                      key={program.id}
                      onClick={() => router.push(`/programs/${program.id}`)}
                      className="bg-white rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_6px_0_0_#cbd5e1] sm:shadow-[0_8px_0_0_#cbd5e1] hover:border-teal-400 hover:shadow-[0_8px_0_0_#34d399] transition-all duration-300 overflow-hidden group hover:-translate-y-2 flex flex-col h-full cursor-pointer"
                    >
                      {/* Image */}
                      <div className="relative h-40 md:h-52 overflow-hidden border-b-2 border-slate-100">
                        <img
                          src={program.thumbnail}
                          alt={program.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />

                        {/* Category Badge */}
                        <div className="absolute top-4 right-4 px-3 py-1 rounded-full flex items-center gap-1.5 border-2 shadow-sm bg-white/90 border-white/80">
                          <GraduationCap
                            className="h-3.5 w-3.5 text-teal-600"
                            strokeWidth={3}
                          />
                          <span className="text-[10px] font-black uppercase tracking-wide text-teal-700">
                            {program.category}
                          </span>
                        </div>

                        {/* Material Count */}
                        <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl flex items-center gap-1.5 bg-black/50 backdrop-blur-sm">
                          <BookOpen
                            className="h-3.5 w-3.5 text-white"
                            strokeWidth={2.5}
                          />
                          <span className="text-[11px] font-bold text-white">
                            {program.materialCount} Materi
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 sm:p-6 flex flex-col justify-between flex-1">
                        <div className="mb-4">
                          <h3 className="text-lg sm:text-xl font-black text-slate-800 leading-tight group-hover:text-teal-600 transition-colors line-clamp-2 mb-2">
                            {program.title}
                          </h3>

                          {program.description && (
                            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed mb-4 line-clamp-2">
                              {program.description}
                            </p>
                          )}

                          {/* Meta */}
                          <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-[11px] font-bold text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <Clock3 className="h-3.5 w-3.5 text-teal-400" />
                              <span>{program.duration}</span>
                            </div>

                          </div>

                          {/* Progress bar for enrolled users */}
                          {program.isEnrolled && (
                            <div className="mt-4">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                  Progress
                                </span>
                                {program.isCompleted ? (
                                  <span className="text-[10px] font-black text-amber-600">
                                    Selesai 🏆
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-black text-emerald-600">
                                    Terdaftar ✓
                                  </span>
                                )}
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    program.isCompleted
                                      ? "bg-amber-400"
                                      : "bg-emerald-400"
                                  }`}
                                  style={{
                                    width: program.isCompleted ? "100%" : "30%",
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="mt-auto pt-4 border-t-2 border-slate-50 flex items-center justify-between gap-2">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50/50 border border-teal-100 text-teal-600 font-bold">
                            <Target className="h-3 w-3" strokeWidth={3} />
                            <span className="text-[9px] uppercase tracking-widest whitespace-nowrap">
                              {program.level}
                            </span>
                          </div>

                          <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DetailButton
                              role={session?.user?.role as any}
                              onClick={() =>
                                router.push(`/programs/${program.id}`)
                              }
                              onEdit={() =>
                                router.push(`/programs/${program.id}/edit`)
                              }
                              onDelete={() => handleDeleteProgram(program.id)}
                              label="Detail"
                              className="w-auto!"
                              showConfirm={false}
                              iconOnly={true}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <ChatbotButton />

      <CartoonConfirmDialog
        type="warning"
        title="Hapus Program?"
        message="Apakah Anda yakin ingin menghapus program ini? Materi di dalamnya tidak akan terhapus."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        isOpen={showConfirmDelete}
        onConfirm={confirmDeleteProgram}
        onCancel={() => {
          setShowConfirmDelete(false);
          setProgramToDelete(null);
        }}
      />

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
};

export default OurPrograms;
