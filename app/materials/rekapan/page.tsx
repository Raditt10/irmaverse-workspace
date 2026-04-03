"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import SearchInput from "@/components/ui/SearchInput";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import SuccessDataFound from "@/components/ui/SuccessDataFound";
import DetailButton from "@/components/ui/DetailButton";
import DeleteButton from "@/components/ui/DeleteButton";
import PageBanner from "@/components/ui/PageBanner";
import { toast } from "sonner";
import {
  BookOpen,
  FileText,
  Calendar,
  ArrowLeft,
  Eye,
  User,
  Download,
  CheckCircle2,
  TrendingUp,
  XCircle,
  Clock,
  ClipboardList,
} from "lucide-react";

interface RekapanItem {
  id: string;
  materialId: string;
  materialTitle: string;
  instructor: string;
  date: string;
  category: string;
  grade: string;
  instructorAvatar?: string | null;
  contentPreview: string;
  updatedAt: string;
}

const RekapanListPage = () => {
  const router = useRouter();
  const [rekapanList, setRekapanList] = useState<RekapanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalMaterials, setTotalMaterials] = useState(0);
  const [instructorMaterials, setInstructorMaterials] = useState<any[]>([]);

  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      if (typeof window !== "undefined") {
        window.location.href = "/auth";
      }
    },
  });

  useEffect(() => {
    if (status === "authenticated") {
      fetchRekapan();
      fetchInstructorMaterials();
    }
  }, [status]);

  const fetchInstructorMaterials = async () => {
    try {
      // Fetch materials dimana user adalah instructor
      const res = await fetch("/api/materials");
      if (!res.ok) return;
      const allMaterials = await res.json();

      // Filter hanya materials yang diajar oleh user (instructor) atau semua jika admin
      const isAdmin = session?.user?.role?.toLowerCase() === "admin" || session?.user?.role?.toLowerCase() === "super_admin";
      const instructorMats = allMaterials.filter(
        (mat: any) =>
          isAdmin ||
          mat.instructor === session?.user?.name ||
          mat.instructorId === session?.user?.id,
      );

      // Fetch rekapan untuk setiap material
      const materialsWithRekapan = await Promise.all(
        instructorMats.map(async (mat: any) => {
          try {
            const rekapanRes = await fetch(`/api/materials/${mat.id}/rekapan`);
            if (!rekapanRes.ok) {
              return {
                id: mat.id,
                title: mat.title,
                date: mat.date,
                content: "",
                link: "",
              };
            }
            const rekapanData = await rekapanRes.json();
            return {
              id: mat.id,
              title: mat.title,
              date: mat.date,
              instructor: mat.instructor,
              instructorId: mat.instructorId,
              instructorAvatar: mat.instructorAvatar,
              content: rekapanData.content || "",
              link: rekapanData.attachmentUrl || "",
            };
          } catch {
            return {
              id: mat.id,
              title: mat.title,
              date: mat.date,
              instructor: mat.instructor,
              instructorId: mat.instructorId,
              instructorAvatar: mat.instructorAvatar,
              content: "",
              link: "",
            };
          }
        }),
      );

      setInstructorMaterials(materialsWithRekapan);
    } catch (error) {
      console.error("Error fetching instructor materials:", error);
    }
  };

  const fetchRekapan = async () => {
    try {
      setLoading(true);
      // Fetch all materials the user has access to
      const matRes = await fetch("/api/materials");
      if (!matRes.ok) throw new Error("Gagal mengambil data");
      const materials = await matRes.json();
      setTotalMaterials(materials.length);

      // For each material, try to fetch its rekapan
      const rekapanPromises = materials.map(async (mat: any) => {
        try {
          const res = await fetch(`/api/materials/${mat.id}/rekapan`);
          if (!res.ok) return null;
          const data = await res.json();
          return {
            id: data.id,
            materialId: mat.id,
            materialTitle: mat.title,
            instructor: mat.instructor || "TBA",
            instructorAvatar: mat.instructorAvatar || null,
            date: mat.date,
            category: mat.category || "",
            grade: mat.grade || "",
            contentPreview:
              data.content.replace(/<[^>]*>/g, "").substring(0, 200) + "...",
            updatedAt: data.updatedAt,
          };
        } catch {
          return null;
        }
      });

      const results = (await Promise.all(rekapanPromises)).filter(Boolean);
      setRekapanList(results as RekapanItem[]);
    } catch (error) {
      console.error("Error fetching rekapan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRekapan = async (materialId: string) => {
    try {
      const res = await fetch(`/api/materials/${materialId}/rekapan`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus rekapan");
      }

      toast.success("Rekapan berhasil dihapus");
      // Refresh data
      fetchRekapan();
      fetchInstructorMaterials();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Terjadi kesalahan saat menghapus");
    }
  };

  const filteredRekapan = rekapanList.filter(
    (item) =>
      item.materialTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.instructor.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const CATEGORY_STYLE: Record<string, string> = {
    "Program Wajib": "bg-rose-100 text-rose-700 border-rose-200",
    "Program Ekstra": "bg-purple-100 text-purple-700 border-purple-200",
    "Program Susulan": "bg-amber-100 text-amber-700 border-amber-200",
  };

  const totalHadir = rekapanList.length;
  const totalKajian = totalMaterials || rekapanList.length;
  const persentaseKehadiran =
    totalKajian > 0 ? Math.round((totalHadir / totalKajian) * 100) : 0;

  const isInstructor =
    session?.user?.role === "instruktur" || session?.user?.role === "admin" || session?.user?.role === "super_admin";

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
            <Loading text="Memuat rekapan kajian..." size="lg" />
          </div>
        </div>
      </div>
    );
  }

  const filteredInstructorMaterials = instructorMaterials.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 w-full max-w-[100vw] overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
          <div className="max-w-6xl mx-auto">
            {/* --- HEADER SECTION --- */}
            <PageBanner
              title={isInstructor ? "Kelola Rekapan Materi" : "Rekapan Kajian"}
              description="Pantau riwayat kehadiran dan materi kajian yang telah kamu ikuti."
              icon={ClipboardList}
              tag="Rekapan"
              tagIcon={ClipboardList}
            />

            {isInstructor ? (
              /* --- INSTRUCTOR VIEW --- */
              <div className="space-y-6">
                {/* --- FILTER & SEARCH BAR INSTRUKTUR --- */}
                <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div className="w-full md:w-96">
                    <SearchInput
                      placeholder="Cari materi kajian..."
                      value={searchQuery}
                      onChange={setSearchQuery}
                      className="w-full border-2 border-emerald-400 focus-within:border-emerald-500 rounded-2xl shadow-none"
                    />
                  </div>
                </div>

                {/* List data rekapan instruktur in Vertical Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchQuery && filteredInstructorMaterials.length > 0 && (
                    <div className="col-span-full">
                      <SuccessDataFound
                        message={`Ditemukan ${filteredInstructorMaterials.length} kajian sesuai pencarian`}
                        icon="sparkles"
                      />
                    </div>
                  )}
                  {filteredInstructorMaterials.length === 0 ? (
                    <div className="col-span-full">
                      <EmptyState
                        icon="search"
                        title="Belum ada rekapan kajian"
                        description="Rekapan kajian saat ini tidak tersedia."
                      />
                    </div>
                  ) : (
                    filteredInstructorMaterials.map((material) => (
                      <div
                        key={material.id}
                        onClick={() => router.push(`/materials/${material.id}/rekapan`)}
                        className="bg-white rounded-4xl border-2 border-slate-200 p-6 hover:border-emerald-400 hover:shadow-[0_12px_0_0_#34d399] transition-all duration-300 flex flex-col h-full group relative overflow-hidden cursor-pointer"
                      >
                        {/* Background Decoration */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl z-0"></div>

                        <div className="relative z-10 flex flex-col h-full">
                          {/* Top Badges & Date */}
                          <div className="flex items-center justify-between mb-4">
                            {material.content || material.link ? (
                              <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide border bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm">
                                Tersedia
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide border bg-red-50 text-red-600 border-red-200 shadow-sm">
                                Belum Ada
                              </span>
                            )}
                            <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(material.date).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </div>
                          </div>

                          <h3 className="text-xl font-black text-slate-800 leading-tight mb-4 group-hover:text-emerald-600 transition-colors line-clamp-2">
                            {material.title}
                          </h3>

                          {/* Instructor Info Badge */}
                          <div className="flex items-center gap-3 mb-6 p-3 rounded-2xl bg-slate-50 border-2 border-slate-100 group-hover:border-emerald-100 group-hover:bg-emerald-50/50 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                              {material.instructorId === session?.user?.id || material.instructor === session?.user?.name ? (
                                session?.user?.image ? (
                                  <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xs">👤</span>
                                )
                              ) : material.instructorAvatar ? (
                                <img src={material.instructorAvatar} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs">👤</span>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider leading-none mb-1">Pengelola</span>
                              <span className="text-xs font-bold text-slate-600">
                                {material.instructorId === session?.user?.id || material.instructor === session?.user?.name
                                  ? `Anda (${session?.user?.role?.toLowerCase() === "instruktur" ? "Instruktur" : session?.user?.role?.toLowerCase() === "admin" ? "Admin" : "Super Admin"})`
                                  : material.instructor || "Instruktur"}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons Container */}
                          <div className="mt-auto space-y-3 pt-5 border-t-4 border-dotted border-slate-100" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <DetailButton
                                  onClick={() =>
                                    router.push(`/materials/${material.id}/rekapan`)
                                  }
                                  className="w-full text-xs h-12 rounded-xl"
                                />
                              </div>
                              {(material.content || material.link) && (
                                <DeleteButton
                                  onClick={() => handleDeleteRekapan(material.id)}
                                  variant="icon-only"
                                  className="h-12 w-12 rounded-xl flex items-center justify-center"
                                  confirmMessage={`Apakah Anda yakin ingin menghapus rekapan untuk "${material.title}"?`}
                                />
                              )}
                            </div>
                            
                            <button
                              onClick={() =>
                                router.push(`/materials/${material.id}/rekapan/edit`)
                              }
                              className="w-full h-13 rounded-xl bg-white text-emerald-600 font-bold border-2 border-emerald-200 border-b-4 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 active:border-b-2 active:translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2"
                            >
                              <FileText className="h-4 w-4" />
                              {material.content || material.link
                                ? "Edit Rekapan"
                                : "Tambah Rekapan"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* --- USER VIEW (LAMA) --- */
              <>
                {/* --- STATISTIK CARDS --- */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-10">
                    <div className="bg-white rounded-3xl sm:rounded-4xl border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] p-4 sm:p-6 flex flex-col sm:flex-row items-center text-center sm:text-left gap-3 sm:gap-5">
                      <div className="p-3 sm:p-4 bg-emerald-100 rounded-xl sm:rounded-2xl border border-emerald-200 shrink-0">
                        <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-slate-500 font-bold text-[10px] sm:text-sm uppercase tracking-wider mb-0.5 sm:mb-0">
                          Total Hadir
                        </p>
                        <p className="text-xl sm:text-3xl font-black text-slate-800 leading-tight">
                          {totalHadir}{" "}
                          <span className="text-[10px] sm:text-base text-slate-500 font-semibold">
                            Kajian
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl sm:rounded-4xl border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] p-4 sm:p-6 flex flex-col sm:flex-row items-center text-center sm:text-left gap-3 sm:gap-5">
                      <div className="p-3 sm:p-4 bg-red-100 rounded-xl sm:rounded-2xl border border-red-200 shrink-0">
                        <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-slate-500 font-bold text-[10px] sm:text-sm uppercase tracking-wider mb-0.5 sm:mb-0">
                          Tidak Hadir
                        </p>
                        <p className="text-xl sm:text-3xl font-black text-slate-800 leading-tight">
                          {totalKajian - totalHadir}{" "}
                          <span className="text-[10px] sm:text-base text-slate-500 font-semibold">
                            Kajian
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                {/* Search */}
                <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-4 mb-6">
                  <SearchInput
                    placeholder="Cari judul kajian atau pemateri..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    className="w-full md:w-96"
                  />
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-white px-5 py-3 rounded-2xl border-2 border-slate-200 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Total Rekapan
                    </span>
                    <p className="text-2xl font-black text-slate-800">
                      {rekapanList.length}
                    </p>
                  </div>
                </div>

                {/* List of Rekapan in Vertical Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchQuery && filteredRekapan.length > 0 && (
                    <div className="col-span-full">
                      <SuccessDataFound
                        message={`Ditemukan ${filteredRekapan.length} rekapan sesuai pencarian`}
                        icon="sparkles"
                      />
                    </div>
                  )}
                  {filteredRekapan.length === 0 ? (
                    <div className="col-span-full">
                      <EmptyState
                        icon="search"
                        title="Belum ada rekapan"
                        description={
                          searchQuery
                            ? "Rekapan yang kamu cari tidak ditemukan."
                            : "Instruktur belum membuat rekapan untuk kajian yang kamu ikuti."
                        }
                      />
                    </div>
                  ) : (
                    filteredRekapan.map((item) => (
                        <div
                          key={item.id}
                          onClick={() =>
                            router.push(`/materials/${item.materialId}/rekapan`)
                          }
                          className="bg-white rounded-[2.5rem] border-2 border-slate-200 p-8 hover:border-teal-400 hover:shadow-[0_12px_0_0_#34d399] transition-all duration-300 cursor-pointer group flex flex-col h-full relative overflow-hidden"
                        >
                        {/* Background Decoration */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl z-0"></div>

                        <div className="relative z-10 flex flex-col h-full">
                          {/* Category & Grade badges */}
                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            {item.category && (
                              <span
                                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide border shadow-sm ${CATEGORY_STYLE[item.category] || "bg-slate-100 text-slate-600 border-slate-200"}`}
                              >
                                {item.category}
                              </span>
                            )}
                            {item.grade && (
                              <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide border bg-slate-50 text-slate-600 border-slate-200 shadow-sm">
                                {item.grade}
                              </span>
                            )}
                          </div>

                          <h3 className="text-2xl font-black text-slate-800 leading-tight mb-4 group-hover:text-teal-600 transition-colors line-clamp-2">
                            {item.materialTitle}
                          </h3>

                          <p className="text-base text-slate-500 font-medium leading-relaxed mb-6 line-clamp-3">
                            {item.contentPreview}
                          </p>

                          {/* Divider & Metadata */}
                          <div className="mt-auto pt-5 border-t-4 border-dotted border-slate-100 flex flex-col gap-3.5 mb-6">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-center justify-center group-hover:bg-teal-50 group-hover:border-teal-200 transition-colors overflow-hidden">
                                {item.instructorAvatar ? (
                                  <img src={item.instructorAvatar} alt={item.instructor} className="w-full h-full object-cover" />
                                ) : (
                                  <User className="h-4 w-4 text-slate-400 group-hover:text-teal-500" />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider leading-none mb-1">Pemateri</span>
                                <span className="text-xs font-bold text-slate-600 truncate max-w-37.5">{item.instructor}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-center justify-center group-hover:bg-teal-50 group-hover:border-teal-200 transition-colors">
                                <Calendar className="h-4 w-4 text-slate-400 group-hover:text-teal-500" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider leading-none mb-1">Tanggal</span>
                                <span className="text-xs font-bold text-slate-600">
                                  {new Date(item.date).toLocaleDateString(
                                    "id-ID",
                                    {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    },
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Professional Button */}
                          <button className="w-full h-14 rounded-2xl bg-teal-400 text-white font-black border-2 border-teal-600 border-b-4 hover:bg-teal-500 hover:shadow-[0_8px_20px_-10px_#2dd4bf] active:border-b-2 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 group/btn">
                            <Eye className="h-5 w-5 group-hover/btn:scale-110 transition-transform" strokeWidth={3} />
                            BACA REKAPAN
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default RekapanListPage;
