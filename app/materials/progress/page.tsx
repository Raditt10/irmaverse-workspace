"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import Loading from "@/components/ui/Loading";
import SearchInput from "@/components/ui/SearchInput";
import EmptyState from "@/components/ui/EmptyState";
import {
  Users,
  BookOpen,
  Calendar,
  BarChart3,
  GraduationCap,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Percent,
  Eye,
  UserCheck,
  UserX,
  Filter,
} from "lucide-react";

interface MaterialProgress {
  materialId: string;
  materialTitle: string;
  kajianOrder: number | null;
  attended: boolean;
}

interface EnrolledUser {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  enrolledAt: string;
  attendedCount: number;
  totalMaterials: number;
  progressPercent: number;
  materialProgress: MaterialProgress[];
}

interface ProgramMaterial {
  id: string;
  title: string;
  kajianOrder: number | null;
  date: string;
  startedAt: string | null;
  attendanceCount: number;
}

interface ProgramData {
  id: string;
  title: string;
  description: string | null;
  grade: string;
  category: string;
  thumbnailUrl: string | null;
  instructor: string;
  instructorAvatar: string | null;
  totalKajian: number;
  materialCount: number;
  enrollmentCount: number;
  materials: ProgramMaterial[];
  enrolledUsers: EnrolledUser[];
}

interface Stats {
  totalPrograms: number;
  totalEnrollments: number;
  uniqueEnrolledUsers: number;
  totalMaterials: number;
  avgAttendance: number;
}

export default function KajianManagement() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalPrograms: 0,
    totalEnrollments: 0,
    uniqueEnrolledUsers: 0,
    totalMaterials: 0,
    avgAttendance: 0,
  });
  const [programs, setPrograms] = useState<ProgramData[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "completed" | "incomplete"
  >("all");
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState<
    string | null
  >(null);
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      const role = session?.user?.role?.toLowerCase();
      if (
        role !== "instruktur" &&
        role !== "admin" &&
        role !== "super_admin"
      ) {
        router.replace("/overview");
        return;
      }
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/kajian-progress");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStats(data.stats);
      setPrograms(data.programs);
      if (data.programs.length > 0) {
        setSelectedProgramId(data.programs[0].id);
      }
    } catch (error) {
      console.error("Error fetching kajian progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedProgram = programs.find((p) => p.id === selectedProgramId);

  // Filter enrolled users based on search + status + material filter
  const filteredUsers = (selectedProgram?.enrolledUsers || []).filter(
    (user) => {
      const matchSearch =
        (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());

      let matchStatus = true;
      if (filterStatus === "completed") {
        matchStatus = user.progressPercent === 100;
      } else if (filterStatus === "incomplete") {
        matchStatus = user.progressPercent < 100;
      }

      let matchMaterial = true;
      if (selectedMaterialFilter) {
        const progress = user.materialProgress.find(
          (mp) => mp.materialId === selectedMaterialFilter
        );
        matchMaterial = progress ? !progress.attended : true;
      }

      return matchSearch && matchStatus && matchMaterial;
    }
  );

  if (status === "loading" || loading) {
    return <Loading fullScreen text="Memuat data manajemen kajian..." />;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />

        <main className="flex-1 min-w-0 w-full overflow-x-hidden p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {/* ===== HEADER ===== */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight mb-1">
                Perkembangan Kajian
              </h1>
              <p className="text-slate-500 mt-1 font-bold text-base md:text-lg ml-1">
                Pantau kehadiran dan kelola anggota terdaftar di program kurikulum
              </p>
            </div>


          </div>

          {/* ===== STATS GRID ===== */}
          {/* ===== PREMIUM STATS BANNER ===== */}
          <div className="relative group mb-10">
            {/* Decorative background glow */}
            <div className="absolute -inset-1 bg-linear-to-r from-emerald-500/10 to-teal-500/10 rounded-[3rem] blur-2xl group-hover:opacity-100 transition duration-1000 opacity-0" />
            
            <div className="relative flex flex-col lg:flex-row bg-white border-2 border-slate-100 rounded-[3rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:border-emerald-200 transition-all duration-500">
              
              {/* Total Programs */}
              <div className="lg:w-1/3 p-6 lg:p-8 bg-linear-to-br from-emerald-50/50 via-white to-white border-b-2 lg:border-b-0 lg:border-r-2 border-slate-50 flex items-center gap-6 group/stat transition-all">
                <div className="relative">
                  <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-200 transition-all duration-500">
                    <GraduationCap className="h-8 w-8 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">
                    Program Kurikulum
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl lg:text-5xl font-black text-slate-800 tracking-tight">
                      {stats.totalPrograms}
                    </span>
                    <span className="text-[10px] font-black text-emerald-500 uppercase px-2 py-0.5 bg-emerald-50 rounded-lg border border-emerald-100">
                      Aktif
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Enrolled */}
              <div className="lg:w-1/3 p-6 lg:p-8 bg-white border-b-2 lg:border-b-0 lg:border-r-2 border-slate-50 flex items-center gap-6 group/stat transition-all">
                <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-100 transition-all duration-500">
                  <Users className="h-8 w-8 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">
                    Anggota Terdaftar
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl lg:text-5xl font-black text-slate-800 tracking-tight">
                      {stats.uniqueEnrolledUsers}
                    </span>
                    <span className="text-[10px] font-black text-emerald-600 uppercase px-2 py-0.5 bg-emerald-50 rounded-lg border border-emerald-100">
                      Peserta
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Materials */}
              <div className="lg:w-1/3 p-6 lg:p-8 bg-linear-to-bl from-emerald-50/50 via-white to-white flex items-center gap-6 group/stat transition-all">
                <div className="relative">
                  <div className="w-16 h-16 bg-teal-500 rounded-3xl flex items-center justify-center shadow-lg shadow-teal-100 transition-all duration-500">
                    <BookOpen className="h-8 w-8 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">
                    Total Kajian
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl lg:text-5xl font-black text-slate-800 tracking-tight">
                      {stats.totalMaterials}
                    </span>
                    <span className="text-[10px] font-black text-teal-500 uppercase px-2 py-0.5 bg-teal-50 rounded-lg border border-teal-100">
                      Materi
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ===== PROGRAM SELECTOR ===== */}
          {programs.length === 0 ? (
            <EmptyState
              icon="search"
              title="Belum ada Program Kurikulum"
              description="Buat program kurikulum terlebih dahulu untuk melihat progress peserta"
              actionLabel="Buat Program"
              onAction={() => router.push("/programs/create")}
            />
          ) : (
            <>
              <div className="mb-8">
                {/* Program Pills */}
                <div className="flex flex-wrap gap-3">
                  {programs.map((program) => (
                    <button
                      key={program.id}
                      onClick={() => {
                        setSelectedProgramId(program.id);
                        setSearchTerm("");
                        setFilterStatus("all");
                        setSelectedMaterialFilter(null);
                        setExpandedUserId(null);
                      }}
                      className={`px-5 py-3 rounded-2xl font-black text-sm border-2 transition-all duration-300 ${
                        selectedProgramId === program.id
                          ? "bg-emerald-500 text-white border-emerald-600 shadow-[0_4px_0_0_#047857] -translate-y-0.5"
                          : "bg-white text-slate-600 border-slate-200 shadow-[0_4px_0_0_#e2e8f0] hover:border-emerald-300 hover:text-emerald-600 hover:-translate-y-0.5"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        {program.title}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            selectedProgramId === program.id
                              ? "bg-white/20"
                              : "bg-slate-100"
                          }`}
                        >
                          {program.enrollmentCount} terdaftar
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ===== SELECTED PROGRAM DETAIL ===== */}
              {selectedProgram && (
                <div className="space-y-8">
                  {/* Program Info Card */}
                  <div className="bg-linear-to-br from-emerald-400 to-teal-500 p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] text-white shadow-[0_6px_0_0_#047857] border-2 border-emerald-600 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-sm" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-sm" />

                    <div className="relative z-10">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-lg">
                              {selectedProgram.category}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-lg">
                              {selectedProgram.grade}
                            </span>
                          </div>
                          <h3 className="text-2xl md:text-3xl font-black drop-shadow-md">
                            {selectedProgram.title}
                          </h3>
                          {selectedProgram.description && (
                            <p className="text-emerald-50 text-sm mt-2 max-w-xl leading-relaxed font-medium">
                              {selectedProgram.description}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <div className="bg-white/20 backdrop-blur px-4 py-3 rounded-2xl text-center min-w-22.5">
                            <div className="text-2xl font-black">
                              {selectedProgram.materialCount}
                              {selectedProgram.totalKajian > 0 && (
                                <span className="text-sm font-bold opacity-80">
                                  /{selectedProgram.totalKajian}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-wider opacity-80">
                              Kajian
                            </div>
                          </div>
                          <div className="bg-white/20 backdrop-blur px-4 py-3 rounded-2xl text-center min-w-22.5">
                            <div className="text-2xl font-black">
                              {selectedProgram.enrollmentCount}
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-wider opacity-80">
                              Terdaftar
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Kajian Overview Chips */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        {selectedProgram.materials.map((m, idx) => (
                          <div
                            key={m.id}
                            className="bg-white/15 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2"
                          >
                            <span className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center text-[10px] font-black">
                              {m.kajianOrder || idx + 1}
                            </span>
                            <span className="truncate max-w-30">
                              {m.title}
                            </span>
                            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px]">
                              {m.attendanceCount} hadir
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ===== FILTERS & SEARCH ===== */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <SearchInput
                        placeholder="Cari anggota berdasarkan nama atau email..."
                        value={searchTerm}
                        onChange={setSearchTerm}
                        className="w-full"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {/* Status Filter */}
                      {[
                        {
                          key: "all" as const,
                          label: "Semua",
                          icon: Users,
                        },
                        {
                          key: "completed" as const,
                          label: "Tuntas",
                          icon: UserCheck,
                        },
                        {
                          key: "incomplete" as const,
                          label: "Belum Tuntas",
                          icon: UserX,
                        },
                      ].map((f) => (
                        <button
                          key={f.key}
                          onClick={() => setFilterStatus(f.key)}
                          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs border-2 transition-all ${
                            filterStatus === f.key
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <f.icon className="w-3.5 h-3.5" />
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Material-specific filter */}
                  {selectedProgram.materials.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-black text-slate-500 uppercase tracking-wider mr-2 py-2">
                        <Filter className="w-3.5 h-3.5" />
                        Belum hadir di:
                      </span>
                      <button
                        onClick={() => setSelectedMaterialFilter(null)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          selectedMaterialFilter === null
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        Semua
                      </button>
                      {selectedProgram.materials.map((m, idx) => (
                        <button
                          key={m.id}
                          onClick={() =>
                            setSelectedMaterialFilter(
                              selectedMaterialFilter === m.id ? null : m.id
                            )
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            selectedMaterialFilter === m.id
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          Kajian {m.kajianOrder || idx + 1}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ===== USER LIST ===== */}
                  <div className="bg-white rounded-3xl md:rounded-[2.5rem] border-2 border-slate-100 shadow-sm overflow-hidden">
                    {/* Table Header */}
                    <div className="px-4 md:px-6 py-4 md:py-5 border-b-2 border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white border-2 border-slate-200 rounded-xl shadow-[0_3px_0_0_#e2e8f0]">
                          <Users className="w-5 h-5 text-slate-800" />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-800 text-lg">
                            Daftar Anggota Terdaftar
                          </h3>
                          <p className="text-xs text-slate-400 font-bold">
                            {filteredUsers.length} dari{" "}
                            {selectedProgram.enrollmentCount} anggota
                            {selectedMaterialFilter &&
                              " (difilter berdasarkan kajian)"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* User Rows */}
                    <div 
                      className="divide-y divide-slate-50 max-h-[60vh] md:max-h-150 overflow-y-auto overflow-x-hidden scrollbar-thin"
                      style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}
                    >
                      {filteredUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                          <div className="p-4 bg-slate-50 rounded-2xl mb-4">
                            <Users
                              className="w-10 h-10 text-slate-300"
                              strokeWidth={1.5}
                            />
                          </div>
                          <p className="text-sm text-slate-500 font-bold">
                            {selectedProgram.enrollmentCount === 0
                              ? "Belum ada anggota terdaftar"
                              : "Tidak ada anggota yang sesuai filter"}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {selectedProgram.enrollmentCount === 0
                              ? "Ajak anggota untuk mendaftar di program ini"
                              : "Coba ubah kata kunci pencarian atau filter"}
                          </p>
                        </div>
                      ) : (
                        filteredUsers.map((user) => {
                          const isExpanded = expandedUserId === user.id;

                          return (
                            <div key={user.id} className="group">
                              {/* Main Row */}
                              <div
                                onClick={() =>
                                  setExpandedUserId(
                                    isExpanded ? null : user.id
                                  )
                                }
                                className="flex items-center gap-2.5 md:gap-4 px-4 md:px-6 py-3 md:py-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                              >
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center overflow-hidden">
                                    {user.avatar ? (
                                      <img
                                        src={user.avatar}
                                        alt={user.name || ""}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-emerald-600 font-black text-lg">
                                        {(user.name || "?")
                                          .charAt(0)
                                          .toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <div
                                    className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full shadow-sm ${
                                      user.progressPercent === 100
                                        ? "bg-emerald-500"
                                        : user.progressPercent > 50
                                          ? "bg-amber-400"
                                          : "bg-slate-300"
                                    }`}
                                  />
                                </div>

                                {/* User Info */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-black text-slate-800 truncate text-sm">
                                    {user.name || "Tanpa Nama"}
                                  </h4>
                                  <p className="text-xs text-slate-400 font-bold truncate">
                                    {user.email}
                                  </p>
                                </div>

                                {/* Attendance Dots (Desktop) */}
                                <div className="hidden md:flex items-center gap-1.5">
                                  {user.materialProgress.map((mp, idx) => (
                                    <div
                                      key={mp.materialId}
                                      title={`${mp.materialTitle}: ${mp.attended ? "Hadir" : "Belum Hadir"}`}
                                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black border ${
                                        mp.attended
                                          ? "bg-emerald-100 text-emerald-600 border-emerald-200"
                                          : "bg-red-50 text-red-400 border-red-100"
                                      }`}
                                    >
                                      {mp.attended ? (
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                      ) : (
                                        <XCircle className="w-3.5 h-3.5" />
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {/* Progress Badge */}
                                <div className="flex items-center gap-3 shrink-0">
                                  <div
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black border ${
                                      user.progressPercent === 100
                                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                        : user.progressPercent > 50
                                          ? "bg-amber-50 text-amber-600 border-amber-200"
                                          : "bg-slate-50 text-slate-500 border-slate-200"
                                    }`}
                                  >
                                    {user.progressPercent}%
                                  </div>

                                  <ChevronDown
                                    className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${
                                      isExpanded ? "rotate-180" : ""
                                    }`}
                                  />
                                </div>
                              </div>

                              {/* Expanded Detail - Professional Progress Panel */}
                              {isExpanded && (
                                <div className="border-t-2 border-slate-100 bg-linear-to-b from-slate-50/80 to-white">
                                  {/* User Profile Header */}
                                  <div className="px-4 md:px-6 pt-4 md:pt-6 pb-4">
                                      <div className="bg-white rounded-2xl md:rounded-3xl border-2 border-slate-100 shadow-[0_4px_0_0_#e2e8f0] p-4 md:p-6">
                                      <div className="flex flex-col md:flex-row md:items-center gap-5">
                                        {/* Big Avatar */}
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                            {user.avatar ? (
                                              <img
                                                src={user.avatar}
                                                alt={user.name || ""}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <span className="text-emerald-600 font-black text-3xl">
                                                {(user.name || "?").charAt(0).toUpperCase()}
                                              </span>
                                            )}
                                          </div>
                                          <div className="min-w-0">
                                            <h4 className="text-xl md:text-2xl font-black text-slate-800 truncate tracking-tight">
                                              {user.name || "Tanpa Nama"}
                                            </h4>
                                            <p className="text-sm text-slate-400 font-bold truncate">
                                              {user.email}
                                            </p>
                                            <p className="text-[11px] text-slate-400 font-bold mt-1 flex items-center gap-1.5">
                                              <Calendar className="w-3 h-3" />
                                              Terdaftar: {new Date(user.enrolledAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Summary Stats Mini Cards */}
                                        <div className="flex sm:flex-none gap-2 shrink-0">
                                          <div className="bg-emerald-50 border-2 border-emerald-100 rounded-xl md:rounded-2xl px-3 md:px-4 py-2 md:py-3 text-center flex-1 sm:min-w-20">
                                            <div className="text-xl md:text-2xl font-black text-emerald-600">{user.attendedCount}</div>
                                            <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Hadir</div>
                                          </div>
                                          <div className="bg-red-50 border-2 border-red-100 rounded-xl md:rounded-2xl px-3 md:px-4 py-2 md:py-3 text-center flex-1 sm:min-w-20">
                                            <div className="text-xl md:text-2xl font-black text-red-500">{user.totalMaterials - user.attendedCount}</div>
                                            <div className="text-[9px] font-black text-red-400 uppercase tracking-widest">Belum</div>
                                          </div>
                                          <div className={`border-2 rounded-xl md:rounded-2xl px-3 md:px-4 py-2 md:py-3 text-center flex-1 sm:min-w-20 ${
                                            user.progressPercent === 100
                                              ? "bg-emerald-50 border-emerald-200"
                                              : user.progressPercent > 50
                                                ? "bg-amber-50 border-amber-200"
                                                : "bg-slate-50 border-slate-200"
                                          }`}>
                                            <div className={`text-2xl font-black ${
                                              user.progressPercent === 100
                                                ? "text-emerald-600"
                                                : user.progressPercent > 50
                                                  ? "text-amber-600"
                                                  : "text-slate-600"
                                            }`}>{user.progressPercent}%</div>
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progress</div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Full Progress Bar */}
                                      <div className="mt-5">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progress Keseluruhan</span>
                                          <span className="text-xs font-black text-slate-600">
                                            {user.attendedCount} dari {user.totalMaterials} kajian selesai
                                          </span>
                                        </div>
                                        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
                                          <div
                                            className={`h-full rounded-full transition-all duration-700 relative ${
                                              user.progressPercent === 100
                                                ? "bg-linear-to-r from-emerald-400 to-emerald-500"
                                                : user.progressPercent > 50
                                                  ? "bg-linear-to-r from-amber-300 to-amber-400"
                                                  : user.progressPercent > 0
                                                    ? "bg-linear-to-r from-red-300 to-red-400"
                                                    : "bg-slate-200"
                                            }`}
                                            style={{ width: `${Math.max(user.progressPercent, 2)}%` }}
                                          >
                                            {user.progressPercent > 10 && (
                                              <div className="absolute top-0 right-2 w-2 h-full bg-white/30 rounded-full skew-x-[-20deg]" />
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Kajian Timeline / Step-by-Step - Scrollable */}
                                  <div className="px-4 md:px-6 pb-4 md:pb-6 relative">
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-slate-500" />
                                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Detail Kehadiran Per Kajian</span>
                                      </div>
                                      <span className="text-[10px] font-bold text-slate-400">
                                        {user.materialProgress.length} kajian
                                      </span>
                                    </div>

                                    <div className="max-h-[420px] overflow-y-auto pr-1 scrollbar-thin" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
                                      <div className="space-y-3">
                                        {user.materialProgress.map((mp, idx) => {
                                          const materialInfo = selectedProgram?.materials.find(m => m.id === mp.materialId);
                                          return (
                                            <div
                                              key={mp.materialId}
                                              className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl md:rounded-3xl border-2 transition-all ${
                                                mp.attended
                                                  ? "bg-emerald-50/60 border-emerald-200 hover:border-emerald-300"
                                                  : "bg-red-50/40 border-red-100 hover:border-red-200"
                                              }`}
                                            >
                                              {/* Step Number */}
                                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 border-2 shadow-sm ${
                                                mp.attended
                                                  ? "bg-emerald-500 text-white border-emerald-600"
                                                  : "bg-white text-slate-400 border-slate-200"
                                              }`}>
                                                {mp.attended ? (
                                                  <CheckCircle2 className="w-6 h-6" />
                                                ) : (
                                                  <span>{mp.kajianOrder || idx + 1}</span>
                                                )}
                                              </div>

                                              {/* Content */}
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                  <h5 className={`font-black text-sm truncate ${
                                                    mp.attended ? "text-emerald-700" : "text-slate-700"
                                                  }`}>
                                                    Kajian {mp.kajianOrder || idx + 1}: {mp.materialTitle}
                                                  </h5>
                                                </div>
                                                {materialInfo && (
                                                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                      <Calendar className="w-3 h-3" />
                                                      {new Date(materialInfo.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                                    </span>
                                                    {materialInfo.startedAt && (
                                                      <span className="flex items-center gap-1">
                                                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                                        {materialInfo.startedAt} WIB
                                                      </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                      <Users className="w-3 h-3" />
                                                      {materialInfo.attendanceCount} anggota hadir
                                                    </span>
                                                  </div>
                                                )}
                                              </div>

                                              {/* Status Badge */}
                                              <div className="shrink-0">
                                                <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black border-2 ${
                                                  mp.attended
                                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200 shadow-[0_2px_0_0_#a7f3d0]"
                                                    : "bg-red-100 text-red-600 border-red-200 shadow-[0_2px_0_0_#fecaca]"
                                                }`}>
                                                  {mp.attended ? (
                                                    <>
                                                      <CheckCircle2 className="w-4 h-4" />
                                                      <span className="hidden sm:inline">Sudah Hadir</span>
                                                      <span className="sm:hidden">Hadir</span>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <XCircle className="w-4 h-4" />
                                                      <span className="hidden sm:inline">Belum Hadir</span>
                                                      <span className="sm:hidden">Belum</span>
                                                    </>
                                                  )}
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {/* Summary Footer */}
                                      {user.progressPercent === 100 && (
                                        <div className="mt-4 flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-200">
                                          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0 shadow-[0_2px_0_0_#047857]">
                                            <CheckCircle2 className="w-6 h-6 text-white" />
                                          </div>
                                          <div>
                                            <p className="text-sm font-black text-emerald-700">Program Selesai! 🎉</p>
                                            <p className="text-[11px] font-bold text-emerald-600">Anggota ini telah menyelesaikan seluruh kajian dalam program ini</p>
                                          </div>
                                        </div>
                                      )}
                                      {user.progressPercent > 0 && user.progressPercent < 100 && (
                                        <div className="mt-4 flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border-2 border-amber-200">
                                          <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center shrink-0 shadow-[0_2px_0_0_#d97706]">
                                            <BarChart3 className="w-5 h-5 text-white" />
                                          </div>
                                          <div>
                                            <p className="text-sm font-black text-amber-700">Sedang Berjalan</p>
                                            <p className="text-[11px] font-bold text-amber-600">
                                              Masih {user.totalMaterials - user.attendedCount} kajian lagi untuk menyelesaikan program ini
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                      {user.progressPercent === 0 && (
                                        <div className="mt-4 flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border-2 border-slate-200">
                                          <div className="w-10 h-10 bg-slate-300 rounded-xl flex items-center justify-center shrink-0 shadow-[0_2px_0_0_#94a3b8]">
                                            <XCircle className="w-5 h-5 text-white" />
                                          </div>
                                          <div>
                                            <p className="text-sm font-black text-slate-600">Belum Ada Kehadiran</p>
                                            <p className="text-[11px] font-bold text-slate-500">Anggota ini belum menghadiri kajian apapun di program ini</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Fade-out gradient at bottom when scrollable */}
                                    {user.materialProgress.length > 4 && (
                                      <div className="pointer-events-none absolute bottom-6 left-6 right-6 h-8 bg-linear-to-t from-white to-transparent rounded-b-2xl" />
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <ChatbotButton />
    </div>
  );
}
