"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import Toast from "@/components/ui/Toast";
import EmptyState from "@/components/ui/EmptyState";
import CategoryFilter from "@/components/ui/CategoryFilter";
import SearchInput from "@/components/ui/SearchInput";
import MaterialInstructorActions from "@/components/ui/AbsensiButton";
import MaterialUserActions from "@/app/materials/_components/ButtonUserAbsenMaterial";
import Loading from "@/components/ui/Loading"; // Import Loading baru
import SuccessDataFound from "@/components/ui/SuccessDataFound";
import { Calendar, Clock, Plus, Sparkles, BookOpen, CheckCheck } from "lucide-react";
import AddButton from "@/components/ui/AddButton";
import DeleteButton from "@/components/ui/DeleteButton";
import DetailButton from "@/components/ui/DetailButton";

interface Material {
  id: string;
  title: string;
  description: string;
  instructor: string;
  category?: string;
  grade?: string;
  startedAt?: string;
  date: string;
  participants?: number;
  thumbnailUrl?: string;
  isJoined: boolean;
  attendedAt?: string;
  createdAt?: string;
}

const Materials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [selectedProgram, setSelectedProgram] = useState("Semua");
  const [selectedGrade, setSelectedGrade] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [showJoinedOnly, setShowJoinedOnly] = useState(false);
  
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const router = useRouter();

  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      if (typeof window !== "undefined") {
        window.location.href = "/auth";
      }
    },
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const role = session?.user?.role?.toLowerCase();
  const isPrivileged = role === "instruktur" || role === "admin" || role === "instructor";
  const programCategories = ["Semua", "Program Wajib", "Program Ekstra", "Program Next Level"];
  const classCategories = ["Semua", "Kelas 10", "Kelas 11", "Kelas 12"];

  useEffect(() => {
    fetchMaterials();

    // Listen for material-related actions (like accepting invitations) to refresh the list
    const handleAction = () => {
      console.log("[MaterialsPage] Action detected, refreshing list (with delay)...");
      setTimeout(() => {
        fetchMaterials();
      }, 500); // delay 500ms agar backend pasti update
    };

    window.addEventListener("materialAction", handleAction);
    return () => window.removeEventListener("materialAction", handleAction);
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [materials, selectedProgram, selectedGrade, searchQuery, showJoinedOnly]);

  const filterMaterials = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filtered = materials.filter((material) => {
      const matchesProgram = selectedProgram === "Semua" || material.category === selectedProgram;
      const matchesGrade = selectedGrade === "Semua" || material.grade === selectedGrade;
      const matchesSearch =
        material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.instructor.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Dynamic logic for second filter button
      let matchesFilter = true;
      if (showJoinedOnly) {
        if (isPrivileged) {
          // Instructors/Admins: filter by today's date
          const materialDate = new Date(material.date);
          materialDate.setHours(0, 0, 0, 0);
          matchesFilter = materialDate.getTime() === today.getTime();
        } else {
          // Regular users: show enrolled/joined materials
          matchesFilter = material.isJoined && !material.attendedAt;
        }
      }

      return matchesProgram && matchesGrade && matchesSearch && matchesFilter;
    });

    setFilteredMaterials(filtered);
  };

  const fetchMaterials = async () => {
    try {
      const res = await fetch("/api/materials");
      if (!res.ok) throw new Error("Failed fetch materials");

      const data = await res.json();

      const materialsWithAttendance = await Promise.all(
        data.map(async (material: Material) => {
          try {
            const attendanceRes = await fetch(
              `/api/materials/attendance?materialId=${material.id}`
            );
            if (attendanceRes.ok) {
              const attendanceData = await attendanceRes.json();
              return {
                ...material,
                attendedAt: attendanceData.attendedAt,
                // isJoined tetap dari API (enrollment)
                isJoined: material.isJoined,
              };
            }
            return material;
          } catch (error) {
            console.error("Error fetching attendance:", error);
            return material;
          }
        })
      );

      setMaterials(materialsWithAttendance);
      setFilteredMaterials(materialsWithAttendance);
    } catch (error: any) {
      console.error("Error fetching materials:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      const res = await fetch(`/api/materials/${materialId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal menghapus kajian");
      }

      setMaterials(materials.filter((m) => m.id !== materialId));
      showToast("Kajian berhasil dihapus", "success");
    } catch (error: any) {
      console.error("Error deleting material:", error);
      showToast(error.message || "Gagal menghapus kajian", "error");
    }
  };

  const getTodayMaterial = () => {
    if (!isPrivileged || materials.length === 0) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayMaterial = materials.find((m) => {
      const materialDate = new Date(m.date);
      materialDate.setHours(0, 0, 0, 0);
      return materialDate.getTime() === today.getTime();
    });

    return todayMaterial || null;
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        
        <div className="flex-1 w-full max-w-[100vw] overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
          <div className="max-w-7xl mx-auto">
            
            <div className="mb-8 lg:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-2xl lg:text-4xl font-black text-slate-800 tracking-tight mb-1.5 leading-tight">
                  {isPrivileged ? "Kelola Kajian" : "Jadwal Kajianku"}
                </h1>
                <p className="text-slate-500 font-medium text-xs lg:text-lg">
                  {isPrivileged
                    ? "Atur jadwal dan materi kajian untuk anggota"
                    : "Ikuti kajian seru bareng teman-teman!"}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                {isPrivileged && (
                  <AddButton
                    label="Buat Kajian"
                    onClick={() => router.push("/materials/create")}
                    icon={<Plus className="h-5 w-5" />}
                    color="emerald"
                    hideIcon={false}
                  />
                )}
              </div>
            </div>

            {/* --- LATEST MATERIAL CARD --- */}
            {isPrivileged && getTodayMaterial() && (
              <div className="mb-8 bg-linear-to-br from-teal-50 to-cyan-50 rounded-3xl lg:rounded-[2.5rem] border-2 border-teal-200 p-5 lg:p-8 shadow-[0_4px_0_0_#cbd5e1] relative overflow-hidden group hover:border-teal-300 transition-all">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-teal-100 rounded-full blur-3xl opacity-60" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4 lg:mb-5">
                    <div className="p-1.5 lg:p-2 bg-white rounded-lg lg:rounded-xl border border-teal-100 shadow-sm">
                        <Sparkles className="h-4 w-4 lg:h-5 lg:w-5 text-teal-500" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-sm lg:text-lg font-black text-slate-800 tracking-tight">Jadwal Kajianmu Hari Ini</h2>
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 lg:gap-8">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl md:text-3xl font-black text-slate-800 mb-2 lg:mb-3 leading-tight truncate">
                        {getTodayMaterial()?.title}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-600 bg-white/80 px-3 py-2 rounded-xl border border-teal-100 shadow-sm">
                            <Calendar className="h-4 w-4 text-teal-500" />
                            {new Date(getTodayMaterial()!.date).toLocaleDateString("id-ID", { 
                                day: 'numeric', month: 'long', year: 'numeric' 
                            })}
                          </div>
                          
                          {getTodayMaterial()?.startedAt && (
                          <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-600 bg-white/80 px-3 py-2 rounded-xl border border-teal-100 shadow-sm">
                              <Clock className="h-4 w-4 text-teal-500" />
                              {getTodayMaterial()?.startedAt} WIB
                          </div>
                          )}
                      </div>
                    </div>

                    <div className="flex flex-row items-center gap-3 w-full lg:w-auto shrink-0 mt-1 lg:mt-0">
                      <button
                        onClick={() => router.push(`/materials/${getTodayMaterial()?.id}/edit`)}
                        className="flex-1 lg:flex-none lg:w-36 flex justify-center items-center px-6 py-2.5 rounded-xl bg-teal-400 text-white font-bold border-2 border-teal-600 border-b-4 hover:bg-teal-500 hover:border-b-4 active:border-b-2 active:translate-y-0.5 transition-all text-sm md:text-base"
                      >
                        Edit
                      </button>
                      
                      <div className="flex-1 lg:flex-none">
                        <DeleteButton
                          label="Hapus"
                          onClick={() => handleDeleteMaterial(getTodayMaterial()!.id)}
                          variant="with-label"
                          showConfirm={true}
                          className="w-full lg:w-36 justify-center text-sm md:text-base"
                        />
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col gap-6 mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Toggle Filter (Mobile & Desktop) */}
                <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200">
                  <button
                    onClick={() => setShowJoinedOnly(false)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs lg:text-sm font-black transition-all ${
                      !showJoinedOnly
                        ? "bg-white text-emerald-600 shadow-sm border border-slate-200"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <BookOpen className="h-4 w-4" />
                    Semua Kajian
                  </button>
                  <button
                    onClick={() => setShowJoinedOnly(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs lg:text-sm font-black transition-all ${
                      showJoinedOnly
                        ? "bg-white text-emerald-600 shadow-sm border border-slate-200"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {isPrivileged ? <Calendar className="h-4 w-4" /> : <CheckCheck className="h-4 w-4" />}
                    {isPrivileged ? "Kajian Hari Ini" : "Kajian Diikuti"}
                  </button>
                </div>

                <SearchInput
                  placeholder="Cari materi / ustadz..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                />
              </div>

              <div className="space-y-4">
                <CategoryFilter
                  categories={programCategories}
                  subCategories={classCategories}
                  selectedCategory={selectedProgram}
                  selectedSubCategory={selectedGrade}
                  onCategoryChange={setSelectedProgram}
                  onSubCategoryChange={setSelectedGrade}
                />
              </div>
            </div>

            {/* Content Grid */}
            {loading ? (
              <div className="flex justify-center py-20">
                <Loading text="Memuat kajian..." size="lg" />
              </div>
            ) : filteredMaterials.length === 0 ? (
              <EmptyState
                icon={materials.length === 0 ? "calendar" : "search"}
                title={
                  materials.length === 0
                    ? "Yah, tidak ada kajian tersedia sekarang"
                    : "Yah, kajian tidak ditemukan..."
                }
                description={
                  materials.length === 0
                    ? "Belum ada kajian yang dibuat. Cek lagi nanti ya!"
                    : "Coba cari dengan kata kunci atau filter lain ya!"
                }
                actionLabel={
                  materials.length === 0 ? undefined : "Reset Filter"
                }
                onAction={
                  materials.length === 0
                    ? undefined
                    : () => {
                        setSelectedProgram("Semua");
                        setSelectedGrade("Semua");
                        setSearchQuery("");
                      }
                }
              />
            ) : (
              <>
                {searchQuery && (
                  <SuccessDataFound
                    message={`Ditemukan ${filteredMaterials.length} kajian sesuai pencarian`}
                    icon="sparkles"
                  />
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                  {filteredMaterials.map((material) => (
                    <div
                      key={material.id}
                      className="bg-white rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_6px_0_0_#cbd5e1] sm:shadow-[0_8px_0_0_#cbd5e1] hover:border-emerald-400 hover:shadow-[0_8px_0_0_#34d399] transition-all duration-300 overflow-hidden group hover:-translate-y-2 flex flex-col h-full"
                    >
                      {/* Thumbnail */}
                      <div className="relative h-40 md:h-52 overflow-hidden border-b-2 border-slate-100">
                        <img
                          src={material.thumbnailUrl}
                          alt={material.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />

                        {material.createdAt && (new Date().getTime() - new Date(material.createdAt).getTime() < 10 * 60 * 1000) && (
                          <span className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full border-2 border-white shadow-md animate-bounce">
                            BARU!
                          </span>
                        )}

                        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                          <span className="px-3 py-1 rounded-lg bg-emerald-400 text-white text-[10px] md:text-xs font-bold border-2 border-emerald-600 shadow-[0_2px_0_0_#065f46]">
                            {material.category}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 sm:p-6 flex flex-col flex-1">
                        <div className="flex-1">
                          {material.grade && (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-black border border-emerald-200 mb-2 uppercase tracking-wide">
                              {material.grade}
                            </span>
                          )}

                          <h3 className="text-lg md:text-xl font-black text-slate-800 mb-2 leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2">
                            {material.title}
                          </h3>

                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                              <span className="text-xs">👤</span>
                            </div>
                            <p className="text-slate-500 font-bold text-sm">
                              {material.instructor || "TBA"}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 md:gap-4 mb-6 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                              <Calendar className="h-4 w-4 text-emerald-400" />
                              <span>
                                {new Date(material.date).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "short",
                                  }
                                )}
                              </span>
                            </div>
                            <div className="w-px h-4 bg-slate-300"></div>
                            {material.startedAt && (
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                <Clock className="h-4 w-4 text-emerald-400" />
                                <span>{material.startedAt}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* --- BUTTON ACTION DINAMIS (LAYOUT BARU) --- */}
                        <div className="mt-auto flex gap-3 items-end">
                          {/* Tombol Absensi / Manage di Kiri (Lebar) */}
                          <div className="flex-1">
                            {isPrivileged ? (
                              <MaterialInstructorActions
                                materialId={material.id}
                                onDelete={handleDeleteMaterial}
                              />
                            ) : (
                              <MaterialUserActions
                                materialId={material.id}
                                isJoined={material.isJoined}
                                attendedAt={material.attendedAt}
                                materialDate={material.date}
                              />
                            )}
                          </div>

                          {/* Tombol Detail (Icon Only) di Kanan */}
                          <DetailButton
                            onClick={() => router.push(`/materials/${material.id}`)}
                            iconOnly
                          />
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

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
};

export default Materials;