"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import Toast from "@/components/ui/Toast";
import EmptyState from "@/components/ui/EmptyState";
import CategoryFilter from "@/components/ui/CategoryFilter";
import SearchInput from "@/components/ui/SearchInput";
import MaterialInstructorActions from "@/components/ui/AbsensiButton";
import MaterialUserActions from "@/app/materials/_components/ButtonUserAbsenMaterial";
import Loading from "@/components/ui/Loading"; // Import Loading baru
import SuccessDataFound from "@/components/ui/SuccessDataFound";
import PageBanner from "@/components/ui/PageBanner";
import { Calendar, Clock, Plus, BookOpen, CheckCheck, User as UserIcon, ClipboardList } from "lucide-react";
import AddButton from "@/components/ui/AddButton";
import DeleteButton from "@/components/ui/DeleteButton";
import DetailButton from "@/components/ui/DetailButton";

interface Material {
  id: string;
  title: string;
  description: string;
  instructor: string;
  instructorId: string;
  instructorAvatar?: string | null;
  category?: string;
  grade?: string;
  startedAt?: string;
  date: string;
  participants?: number;
  thumbnailUrl?: string;
  isJoined: boolean;
  attendedAt?: string;
  createdAt?: string;
  isCompleted?: boolean;
  isEnrolledInProgram?: boolean;
  program?: { id: string; title: string } | null;
}

const Materials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [selectedProgram, setSelectedProgram] = useState("Semua");
  const [selectedGrade, setSelectedGrade] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "today" | "mine">("all");
  
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
  const isPrivileged = role === "instruktur" || role === "admin" || role === "instructor" || role === "super_admin";
  const programCategories = ["Semua", "Program Wajib", "Program Ekstra", "Program Susulan"];
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
  }, [materials, selectedProgram, selectedGrade, searchQuery, activeFilter]);

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
      
      // Dynamic logic for filter buttons
      let matchesFilter = true;
      if (activeFilter === "today") {
        const materialDate = new Date(material.date);
        materialDate.setHours(0, 0, 0, 0);
        matchesFilter = materialDate.getTime() === today.getTime();
      } else if (activeFilter === "mine") {
        if (isPrivileged) {
          matchesFilter = material.instructorId === session?.user?.id;
        } else {
          // Regular users: "Kajian Diikuti" (joined and attended)
          matchesFilter = material.isJoined && !!material.attendedAt;
        }
      }

      return matchesProgram && matchesGrade && matchesSearch && matchesFilter;
    });

    setFilteredMaterials(filtered);
  };

  const fetchMaterials = async () => {
    try {
      const res = await fetch("/api/materials");
      if (!res.ok) {
        let errMessage = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          errMessage = errData.error || errMessage;
        } catch {
          errMessage = await res.text();
        }
        throw new Error(`Failed to fetch materials: ${errMessage}`);
      }

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

  const getTodayMaterials = () => {
    if (!isPrivileged || materials.length === 0) return [];
    
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    
    const currentTimeStr = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');

    return materials.filter((m) => {
      const materialDate = new Date(m.date);
      materialDate.setHours(0, 0, 0, 0);
      
      const isToday = materialDate.getTime() === todayTimestamp;
      if (!isToday) return false;

      // Filter out past materials
      const startTime = m.startedAt || "00:00";
      return currentTimeStr < startTime;
    });
  };

  const todayMaterials = getTodayMaterials();
  const firstTodayMaterial = todayMaterials[0] || null;
  const isOwnMaterial = firstTodayMaterial?.instructorId === session?.user?.id;
  const reminderTitle = isOwnMaterial ? "Jadwal Kajianmu Hari Ini" : `Jadwal Kajian ${firstTodayMaterial?.instructor} Hari Ini`;

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        
        <div className="flex-1 w-full max-w-[100vw] overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
          <div className="max-w-7xl mx-auto">
            
            <PageBanner
              title={isPrivileged ? "Kelola Jadwal Kajian" : "Jadwal Kajianku"}
              description={isPrivileged ? "Atur jadwal dan materi kajian untuk anggota" : "Ikuti kajian seru bareng teman-teman!"}
              icon={BookOpen}
              tag="Kajian"
              tagIcon={BookOpen}
              action={
                isPrivileged && (
                  <>
                    <button
                      onClick={() => router.push("/materials/create")}
                      className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-white text-teal-600 font-black text-sm border-2 border-white/80 shadow-[0_4px_0_0_#0f766e] hover:shadow-[0_2px_0_0_#0f766e] hover:translate-y-0.5 active:translate-y-1 active:shadow-none transition-all w-full max-w-[240px] md:w-auto mx-auto md:mx-0"
                    >
                      <Plus className="h-5 w-5" strokeWidth={3} /> Buat Kajian Baru
                    </button>
                    <button
                      onClick={() => router.push("/materials/rekapan")}
                      className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-white/20 text-white font-black text-sm border-2 border-white/30 hover:bg-white/30 transition-all backdrop-blur-sm w-full max-w-[180px] md:w-auto mx-auto md:mx-0"
                    >
                      <ClipboardList className="h-5 w-5" strokeWidth={2.5} /> Rekapan Kajian
                    </button>
                  </>
                )
              }
            />

            {/* --- LATEST MATERIAL CARD --- */}
            {isPrivileged && firstTodayMaterial && (
              <div className="mb-8 bg-linear-to-br from-teal-50 to-cyan-50 rounded-3xl lg:rounded-[2.5rem] border-2 border-teal-200 p-5 lg:p-8 shadow-[0_4px_0_0_#cbd5e1] relative overflow-hidden group hover:border-teal-300 transition-all">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-teal-100 rounded-full blur-3xl opacity-60" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4 lg:mb-5">
                    <div className="p-1.5 lg:p-2 bg-white rounded-lg lg:rounded-xl border border-teal-100 shadow-sm">
                      <BookOpen className="h-4 w-4 lg:h-5 lg:w-5 text-teal-500" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-sm lg:text-lg font-black text-slate-800 tracking-tight">{reminderTitle}</h2>
                    {todayMaterials.length > 1 && (
                      <span className="px-2.5 py-1 bg-white border border-teal-200 text-teal-600 text-[10px] lg:text-xs font-black rounded-lg shadow-sm">
                        Dan {todayMaterials.length - 1} lainnya
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 lg:gap-8">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl md:text-3xl font-black text-slate-800 mb-3 lg:mb-4 leading-tight truncate">
                        {firstTodayMaterial?.title}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-4 mb-5">
                        <div className="flex items-center gap-2.5 bg-white/60 px-3 py-1.5 rounded-2xl border border-teal-100 shadow-xs">
                          {firstTodayMaterial?.instructorAvatar ? (
                            <img
                              src={firstTodayMaterial.instructorAvatar}
                              alt={firstTodayMaterial.instructor}
                              className="w-6 h-6 lg:w-8 lg:h-8 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                          ) : (
                            <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-teal-100 flex items-center justify-center border border-teal-200 shadow-xs">
                              <UserIcon className="w-3 h-3 lg:w-4 lg:h-4 text-teal-600" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-teal-600/70 uppercase tracking-tighter leading-none mb-0.5">Oleh Pengajar</span>
                            <span className="text-xs lg:text-sm font-black text-slate-700 leading-none">
                              {firstTodayMaterial?.instructor}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-600 bg-white/80 px-3 py-2 rounded-xl border border-teal-100 shadow-sm">
                          <Calendar className="h-4 w-4 text-teal-500" />
                          {new Date(firstTodayMaterial!.date).toLocaleDateString("id-ID", { 
                            day: 'numeric', month: 'long', year: 'numeric' 
                          })}
                        </div>
                        
                        {firstTodayMaterial?.startedAt && (
                          <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-600 bg-white/80 px-3 py-2 rounded-xl border border-teal-100 shadow-sm">
                            <Clock className="h-4 w-4 text-teal-500" />
                            {firstTodayMaterial?.startedAt} WIB
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col gap-6 mb-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Left Side: Filter Toggles & Search */}
                <div className="flex flex-col md:flex-row gap-4 flex-1">
                  {/* Toggle Filter (Mobile & Desktop) */}
                  <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200 shrink-0">
                    <button
                      onClick={() => setActiveFilter("all")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs lg:text-sm font-black transition-all ${
                        activeFilter === "all"
                          ? "bg-white text-emerald-600 shadow-sm border border-slate-200"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <BookOpen className="h-4 w-4" />
                      Semua
                    </button>
                    <button
                      onClick={() => setActiveFilter("today")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs lg:text-sm font-black transition-all ${
                        activeFilter === "today"
                          ? "bg-white text-emerald-600 shadow-sm border border-slate-200"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <Calendar className="h-4 w-4" />
                      Hari Ini
                    </button>
                    {isPrivileged && role !== "instruktur" && role !== "instructor" && (
                      <button
                        onClick={() => setActiveFilter("mine")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs lg:text-sm font-black transition-all ${
                          activeFilter === "mine"
                            ? "bg-white text-emerald-600 shadow-sm border border-slate-200"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <UserIcon className="h-4 w-4" />
                        Kajian Saya
                      </button>
                    )}
                  </div>

                  <div className="w-full max-w-md">
                    <SearchInput
                      placeholder="Cari materi / ustadz..."
                      value={searchQuery}
                      onChange={setSearchQuery}
                      className="w-full"
                    />
                  </div>
                </div>
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
                          <span className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full border-2 border-white shadow-md">
                            BARU!
                          </span>
                        )}

                        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                          {isPrivileged && material.isCompleted !== undefined && (
                            <span className={`px-2 py-1 rounded-lg text-white text-[10px] md:text-xs font-bold border-2 shadow-[0_2px_0_0_rgba(0,0,0,0.15)] ${
                              material.isCompleted
                                ? "bg-emerald-500 border-emerald-700 shadow-[#047857]"
                                : "bg-emerald-500 border-emerald-700 shadow-[#047857]"
                            }`}>
                              {material.isCompleted ? "Tuntas" : "Belum Tuntas"}
                            </span>
                          )}
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

                            <div className="flex items-center gap-2.5 mb-4 group/inst">
                              {material.instructorAvatar ? (
                                <img
                                  src={material.instructorAvatar}
                                  alt={material.instructor || "Instructor"}
                                  className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-md group-hover/inst:scale-110 transition-transform"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-xs group-hover/inst:scale-110 transition-transform">
                                  <UserIcon className="w-4 h-4 text-indigo-500" fill="currentColor" />
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pengajar</span>
                                <p className="text-slate-800 font-extrabold text-sm leading-none">
                                  {material.instructor || "TBA"}
                                </p>
                              </div>
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
                        <div className="mt-auto flex w-full">
                            {isPrivileged ? (
                              <MaterialInstructorActions
                                materialId={material.id}
                                onDelete={handleDeleteMaterial}
                                detailButton={
                                  <DetailButton
                                    onClick={() => router.push(`/materials/${material.id}`)}
                                    iconOnly
                                  />
                                }
                              />
                            ) : (
                              <div className="flex gap-3 w-full items-center">
                                <div className="flex-1">
                                  <MaterialUserActions
                                    materialId={material.id}
                                    isJoined={material.isJoined}
                                    attendedAt={material.attendedAt}
                                    materialDate={material.date}
                                    onNoRekapan={() => showToast("Maaf, untuk kajian ini belum tersedia rekapan materinya", "error")}
                                    programId={material.program?.id}
                                    isEnrolledInProgram={material.isEnrolledInProgram}
                                    onShowToast={showToast}
                                  />
                                </div>
                                <DetailButton
                                  onClick={() => router.push(`/materials/${material.id}`)}
                                  iconOnly
                                />
                              </div>
                            )}
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