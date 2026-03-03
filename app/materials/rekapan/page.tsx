"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import SearchInput from "@/components/ui/SearchInput";
import Loading from "@/components/ui/Loading";
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
} from "lucide-react";

interface RekapanItem {
  id: string;
  materialId: string;
  materialTitle: string;
  instructor: string;
  date: string;
  category: string;
  grade: string;
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

      // Filter hanya materials yang diajar oleh user (instructor)
      const instructorMats = allMaterials.filter(
        (mat: any) =>
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
              content: rekapanData.content || "",
              link: rekapanData.attachmentUrl || "",
            };
          } catch {
            return {
              id: mat.id,
              title: mat.title,
              date: mat.date,
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

  const filteredRekapan = rekapanList.filter(
    (item) =>
      item.materialTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.instructor.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const CATEGORY_STYLE: Record<string, string> = {
    "Program Wajib": "bg-rose-100 text-rose-700 border-rose-200",
    "Program Ekstra": "bg-purple-100 text-purple-700 border-purple-200",
    "Program Next Level": "bg-amber-100 text-amber-700 border-amber-200",
    "Program Susulan": "bg-slate-100 text-slate-700 border-slate-200",
  };

  const totalHadir = rekapanList.length;
  const totalKajian = totalMaterials || rekapanList.length;
  const persentaseKehadiran =
    totalKajian > 0 ? Math.round((totalHadir / totalKajian) * 100) : 0;

  const isInstructor =
    session?.user?.role === "instruktur" || session?.user?.role === "admin";

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
            <div className="mb-8 lg:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight mb-2 flex items-center gap-3">
                  {isInstructor ? "Kelola Rekapan Materi" : "Rekapan Kajian"}
                </h1>
                <p className="text-slate-500 font-medium text-sm lg:text-lg">
                  Pantau riwayat kehadiran dan materi kajian yang telah kamu
                  ikuti.
                </p>
              </div>
              {session?.user?.role === "admin" ||
              session?.user?.role === "instruktur" ? (
                <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-400 text-white font-bold border-2 border-teal-600 border-b-4 hover:bg-teal-500 hover:border-b-4 active:border-b-2 active:translate-y-0.5 transition-all">
                  <Download className="h-5 w-5" />
                  Cetak Laporan
                </button>
              ) : null}
            </div>

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

                {/* --- LIST DATA REKAPAN INSTRUKTUR --- */}
                <div className="space-y-4">
                  {filteredInstructorMaterials.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-300">
                      <FileText className="h-16 w-16 text-slate-300 mb-4" />
                      <h3 className="text-xl font-black text-slate-800 mb-2">
                        Belum ada kajian
                      </h3>
                      <p className="text-slate-500">
                        Kajian yang kamu cari tidak ditemukan.
                      </p>
                    </div>
                  ) : (
                    filteredInstructorMaterials.map((material) => (
                      <div
                        key={material.id}
                        className="bg-white rounded-3xl border-2 border-slate-200 p-5 lg:p-6 hover:border-emerald-400 hover:shadow-[0_4px_0_0_#34d399] transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-5 group"
                      >
                        {/* Info Kiri */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {material.content || material.link ? (
                              <span className="px-3 py-1 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-wide border bg-emerald-50 text-emerald-600 border-emerald-200">
                                Tersedia
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-wide border bg-red-50 text-red-600 border-red-200">
                                Belum Ada
                              </span>
                            )}
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              {new Date(material.date).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                },
                              )}
                            </div>
                          </div>

                          <h3 className="text-lg md:text-xl font-black text-slate-800 leading-tight group-hover:text-emerald-600 transition-colors">
                            {material.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500 mt-3">
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-xs">
                                👤
                              </div>
                              Anda (Instruktur)
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 hidden sm:block"></div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4 text-slate-400" />-
                            </div>
                          </div>
                        </div>

                        {/* Tombol Kanan */}
                        <div className="flex flex-col md:items-end justify-center shrink-0 border-t-2 border-dashed border-slate-200 md:border-none pt-4 md:pt-0 gap-3">
                          <button
                            onClick={() =>
                              router.push(
                                `/materials/${material.id}/rekapan/edit`,
                              )
                            }
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-emerald-600 font-bold border-2 border-emerald-200 border-b-4 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 active:border-b-2 active:translate-y-0.5 transition-all text-sm w-full md:w-auto"
                          >
                            {material.content || material.link
                              ? "Edit Rekapan"
                              : "Tambah Rekapan"}
                          </button>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  <div className="bg-white rounded-[2rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] p-6 flex items-center gap-5">
                    <div className="p-4 bg-emerald-100 rounded-2xl border border-emerald-200">
                      <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">
                        Total Hadir
                      </p>
                      <p className="text-3xl font-black text-slate-800">
                        {totalHadir}{" "}
                        <span className="text-base text-slate-500 font-semibold">
                          Kajian
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-[2rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] p-6 flex items-center gap-5">
                    <div className="p-4 bg-amber-100 rounded-2xl border border-amber-200">
                      <TrendingUp className="h-8 w-8 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">
                        Persentase
                      </p>
                      <p className="text-3xl font-black text-slate-800">
                        {persentaseKehadiran}%
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-[2rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] p-6 flex items-center gap-5">
                    <div className="p-4 bg-red-100 rounded-2xl border border-red-200">
                      <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <div>
                      <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">
                        Tidak Hadir
                      </p>
                      <p className="text-3xl font-black text-slate-800">
                        {totalKajian - totalHadir}{" "}
                        <span className="text-base text-slate-500 font-semibold">
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

                {/* List */}
                <div className="space-y-4">
                  {filteredRekapan.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-300">
                      <FileText className="h-16 w-16 text-slate-300 mb-4" />
                      <h3 className="text-xl font-black text-slate-800 mb-2">
                        Belum ada rekapan
                      </h3>
                      <p className="text-slate-500">
                        {searchQuery
                          ? "Rekapan yang kamu cari tidak ditemukan."
                          : "Instruktur belum membuat rekapan untuk kajian yang kamu ikuti."}
                      </p>
                    </div>
                  ) : (
                    filteredRekapan.map((item) => (
                      <div
                        key={item.id}
                        onClick={() =>
                          router.push(`/materials/${item.materialId}/rekapan`)
                        }
                        className="bg-white rounded-3xl border-2 border-slate-200 p-5 lg:p-6 hover:border-teal-400 hover:shadow-[0_4px_0_0_#34d399] transition-all duration-300 cursor-pointer group"
                      >
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Category & Grade badges */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              {item.category && (
                                <span
                                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${CATEGORY_STYLE[item.category] || "bg-slate-100 text-slate-600 border-slate-200"}`}
                                >
                                  {item.category}
                                </span>
                              )}
                              {item.grade && (
                                <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border bg-slate-50 text-slate-600 border-slate-200">
                                  {item.grade}
                                </span>
                              )}
                            </div>

                            <h3 className="text-lg md:text-xl font-black text-slate-800 leading-tight mb-2 group-hover:text-teal-600 transition-colors">
                              {item.materialTitle}
                            </h3>

                            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-3 line-clamp-2">
                              {item.contentPreview}
                            </p>

                            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5" />
                                {item.instructor}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(item.date).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  },
                                )}
                              </div>
                            </div>
                          </div>

                          <button className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-teal-600 font-bold border-2 border-teal-200 border-b-4 hover:bg-teal-50 hover:border-teal-400 active:border-b-2 active:translate-y-0.5 transition-all text-sm shrink-0">
                            <Eye className="h-4 w-4" strokeWidth={2.5} />
                            Baca
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
      <ChatbotButton />
    </div>
  );
};

export default RekapanListPage;
