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
  Layers,
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
}

const OurPrograms = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<string | null>(null);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data: session } = useSession({ required: false });

  const isPrivileged =
    session?.user?.role === "instruktur" || session?.user?.role === "admin";

  const categoryOptions = [
    { value: "all", label: "Semua Kategori" },
    { value: "Program Wajib", label: "Program Wajib" },
    { value: "Program Ekstra", label: "Program Ekstra" },
    { value: "Program Next Level", label: "Next Level" },
  ];

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const filteredPrograms = programs.filter(
    (program) =>
      (program?.title?.toLowerCase() ?? "").includes(
        searchTerm.toLowerCase(),
      ) &&
      (categoryFilter === "all" || program.category === categoryFilter),
  );

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
                  {isPrivileged ? "Kelola Kursus" : "Kursus Tersedia"}
                </h1>
                <p className="text-slate-500 font-medium text-xs lg:text-lg">
                  {isPrivileged
                    ? "Buat dan kelola kursus kurikulum untuk anggota"
                    : "Ikuti kursus untuk meningkatkan pengetahuan keagamaan"}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="flex flex-wrap gap-3 text-xs font-bold">
                  <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 shadow-sm">
                    <Layers className="h-3.5 w-3.5" />
                    <span>{programs.length} Kursus</span>
                  </div>
                </div>

                {isPrivileged && (
                  <AddButton
                    label="Buat Kursus"
                    onClick={() => router.push("/programs/create")}
                    icon={<Plus className="h-5 w-5" />}
                    color="emerald"
                    hideIcon={false}
                  />
                )}
              </div>
            </div>

            {/* Filters */}
            {!loading && programs.length > 0 && (
              <div className="mb-8 flex flex-col gap-4">
                <div className="w-full">
                  <SearchInput
                    placeholder="Cari kursus seru..."
                    value={searchTerm}
                    onChange={setSearchTerm}
                    className="w-full"
                  />
                </div>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full flex items-center justify-between rounded-2xl border-2 bg-white px-5 py-3.5 lg:py-4 font-bold text-slate-700 transition-all cursor-pointer ${
                      isDropdownOpen
                        ? "border-teal-400 shadow-[0_4px_0_0_#34d399] -translate-y-0.5"
                        : "border-slate-200 shadow-[0_4px_0_0_#e2e8f0] hover:border-teal-300"
                    }`}
                  >
                    <span className="truncate mr-2">
                      {categoryOptions.find((o) => o.value === categoryFilter)
                        ?.label || "Semua Kategori"}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                        isDropdownOpen ? "rotate-180 text-teal-500" : ""
                      }`}
                      strokeWidth={3}
                    />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-white border-2 border-slate-200 rounded-2xl shadow-[0_8px_0_0_#cbd5e1] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-1.5 space-y-1">
                        {categoryOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setCategoryFilter(option.value);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                              categoryFilter === option.value
                                ? "bg-teal-50 text-teal-600"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-20">
                <Loading text="Memuat kursus..." />
              </div>
            ) : programs.length === 0 ? (
              <EmptyState
                icon="search"
                title="Belum ada kursus"
                description="Kursus kurikulum belum tersedia saat ini. Cek lagi nanti ya!"
              />
            ) : filteredPrograms.length === 0 ? (
              <EmptyState
                icon="search"
                title="Tidak ada kursus yang cocok"
                description="Coba cari dengan kata kunci lain atau ubah filter kategorinya!"
                actionLabel="Reset Pencarian"
                onAction={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                }}
              />
            ) : (
              <>
                {searchTerm && (
                  <div className="mb-8">
                    <SuccessDataFound
                      message={`Ditemukan ${filteredPrograms.length} kursus sesuai pencarian`}
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
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-indigo-400" />
                              <span>{program.enrollmentCount} Peserta</span>
                            </div>
                          </div>

                          {/* Progress bar for enrolled users */}
                          {program.isEnrolled && (
                            <div className="mt-4">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                  Progress
                                </span>
                                <span className="text-[10px] font-black text-emerald-600">
                                  Terdaftar ✓
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                                  style={{ width: "0%" }}
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
        title="Hapus Kursus?"
        message="Apakah Anda yakin ingin menghapus kursus ini? Materi di dalamnya tidak akan terhapus."
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
