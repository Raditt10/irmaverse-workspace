"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import Toast from "@/components/ui/Toast";
import {
  Calendar,
  User,
  Clock,
  ArrowLeft,
  Mail,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Target,
  MessageCircle,
  ListChecks,
  BarChart3,
  ChevronRight,
  Circle,
  Users,
  GraduationCap,
} from "lucide-react";

interface MaterialItem {
  id: string;
  title: string;
  description: string | null;
  date: string;
  startedAt: string | null;
  instructor: string;
  thumbnailUrl: string | null;
  order: number;
  isCompleted: boolean;
  attendanceStatus: string | null;
  enrollmentCount: number;
}

interface Program {
  id: string;
  title: string;
  description: string | null;
  duration: string;
  level: string;
  category: string;
  image?: string;
  instructor: {
    id: string;
    name: string;
    avatar: string | null;
    email: string | null;
  };
  syllabus: string[];
  requirements: string[];
  benefits: string[];
  materials: MaterialItem[];
  enrollmentCount: number;
  isEnrolled: boolean;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

const ProgramDetail = () => {
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const router = useRouter();
  const params = useParams();
  const programId = params.id as string;
  const { data: session } = useSession({ required: false });

  const isPrivileged =
    session?.user?.role === "instruktur" || session?.user?.role === "admin";

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    if (programId) fetchProgramDetail();
  }, [programId]);

  const fetchProgramDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/programs/${programId}`);
      if (!res.ok) throw new Error("Gagal mengambil data kursus");
      const data = await res.json();
      setProgram(data);
    } catch (error) {
      console.error("Error loading program:", error);
      setProgram(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const res = await fetch(`/api/programs/${programId}/enroll`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Gagal mendaftar");
      showToast("Berhasil mendaftar di kursus! 🎉", "success");
      fetchProgramDetail();
    } catch (error: any) {
      showToast(error.message || "Gagal mendaftar", "error");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <DashboardHeader />
        <div className="flex w-full">
          <Sidebar />
          <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh]">
            <Sparkles className="h-12 w-12 text-teal-400 animate-spin mb-4" />
            <p className="text-slate-500 font-bold animate-pulse">
              Sedang memuat detail kursus...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-[80vh]">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center border-4 border-dashed border-slate-300 mb-6">
              <Target className="h-10 w-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-700 mb-2">
              Kursus Tidak Ditemukan
            </h2>
            <button
              onClick={() => router.push("/programs")}
              className="mt-4 px-6 py-3 rounded-xl bg-teal-400 text-white font-black border-2 border-teal-600 border-b-4 hover:bg-teal-500 active:border-b-2 active:translate-y-0.5 transition-all"
            >
              Kembali ke Daftar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progressColor =
    program.progress.percentage === 100
      ? "bg-emerald-500"
      : program.progress.percentage > 50
        ? "bg-teal-500"
        : program.progress.percentage > 0
          ? "bg-amber-400"
          : "bg-slate-200";

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />

        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full max-w-[100vw] overflow-x-hidden">
          <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8">
            {/* Back */}
            <button
              onClick={() => router.push("/programs")}
              className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 font-bold transition-all group px-4 py-2 rounded-xl border-2 border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform stroke-3" />
              Kembali
            </button>

            {/* HERO */}
            <div className="relative bg-white rounded-4xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_8px_0_0_#cbd5e1] overflow-hidden group">
              <div className="relative h-64 md:h-80 lg:h-96 w-full overflow-hidden border-b-2 border-slate-200">
                <img
                  src={
                    program.image ||
                    "https://picsum.photos/seed/program/1200/600"
                  }
                  alt={program.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-10">
                  <div className="flex flex-wrap items-center gap-3 mb-3 lg:mb-4">
                    <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-white/90 text-slate-800 border-2 border-white uppercase tracking-wide backdrop-blur-sm">
                      {program.category}
                    </span>
                    <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-white/90 text-slate-800 border-2 border-white uppercase tracking-wide backdrop-blur-sm">
                      Level: {program.level}
                    </span>
                    <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-teal-500/90 text-white border-2 border-teal-400 uppercase tracking-wide backdrop-blur-sm flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" strokeWidth={3} />
                      {program.duration}
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white mb-3 drop-shadow-md leading-tight">
                    {program.title}
                  </h1>
                  <p className="text-slate-200 text-sm md:text-lg font-medium max-w-3xl line-clamp-2 leading-relaxed">
                    {program.description}
                  </p>
                </div>
              </div>
            </div>

            {/* PROGRESS BAR (for enrolled users) */}
            {program.isEnrolled && (
              <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-[0_6px_0_0_#cbd5e1]">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-2.5 bg-indigo-100 rounded-2xl border-2 border-indigo-200">
                    <BarChart3
                      className="h-6 w-6 text-indigo-600"
                      strokeWidth={3}
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-black text-slate-800">
                      Progress Kursus
                    </h2>
                    <p className="text-sm text-slate-500 font-bold">
                      {program.progress.completed} dari {program.progress.total}{" "}
                      materi selesai
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-slate-800">
                      {program.progress.percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${progressColor} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${program.progress.percentage}%` }}
                  />
                </div>
                {program.progress.percentage === 100 && (
                  <div className="mt-4 flex items-center gap-2 text-emerald-600 font-black">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Selamat! Kursus telah selesai 🎉</span>
                  </div>
                )}
              </div>
            )}

            {/* GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* LEFT */}
              <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                {/* Materials List */}
                <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-[0_6px_0_0_#cbd5e1]">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-teal-100 rounded-2xl border-2 border-teal-200">
                        <BookOpen
                          className="h-6 w-6 text-teal-600"
                          strokeWidth={3}
                        />
                      </div>
                      <div>
                        <h2 className="text-xl lg:text-2xl font-black text-slate-800">
                          Daftar Materi
                        </h2>
                        <p className="text-sm text-slate-500 font-bold italic">
                          {program.materials.length} materi dalam kursus ini
                        </p>
                      </div>
                    </div>

                    {isPrivileged && (
                      <button
                        onClick={() =>
                          router.push(
                            `/materials/create?programId=${program.id}`,
                          )
                        }
                        className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 text-white font-black text-sm rounded-2xl border-2 border-teal-600 shadow-[0_3px_0_0_#0f766e] hover:bg-teal-600 active:translate-y-0.5 active:shadow-none transition-all"
                      >
                        <ListChecks className="h-4 w-4" />
                        Tambah Materi
                      </button>
                    )}
                  </div>

                  {program.materials.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/30">
                      <div className="w-16 h-16 bg-white rounded-3xl border-2 border-slate-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <BookOpen className="w-8 h-8 text-slate-300" />
                      </div>
                      <h4 className="text-slate-500 font-black mb-1">
                        Belum ada materi
                      </h4>
                      <p className="text-slate-400 text-sm font-bold">
                        Instruktur belum menambahkan materi ke kursus ini.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {program.materials.map((material, idx) => (
                        <div
                          key={material.id}
                          onClick={() =>
                            router.push(`/materials/${material.id}`)
                          }
                          className={`flex gap-4 md:gap-6 p-5 md:p-6 rounded-[2rem] border-2 transition-all group cursor-pointer ${
                            material.isCompleted
                              ? "bg-emerald-50/50 border-emerald-200 hover:border-emerald-300"
                              : "bg-slate-50 border-slate-100 hover:border-teal-200 hover:bg-teal-50/30"
                          }`}
                        >
                          {/* Step number / check */}
                          <div className="flex flex-col items-center gap-2">
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-sm transition-colors ${
                                material.isCompleted
                                  ? "bg-emerald-500 text-white border-2 border-emerald-600"
                                  : "bg-white border-2 border-slate-200 text-teal-600 group-hover:border-teal-300"
                              }`}
                            >
                              {material.isCompleted ? (
                                <CheckCircle2 className="h-6 w-6" />
                              ) : (
                                <span>{material.order}</span>
                              )}
                            </div>
                            {idx < program.materials.length - 1 && (
                              <div
                                className={`w-0.5 flex-1 rounded-full min-h-[20px] ${
                                  material.isCompleted
                                    ? "bg-emerald-300"
                                    : "bg-slate-200"
                                }`}
                              />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 space-y-2 py-1">
                            <div className="flex items-start justify-between gap-3">
                              <h4
                                className={`font-black text-lg md:text-xl leading-tight transition-colors ${
                                  material.isCompleted
                                    ? "text-emerald-700"
                                    : "text-slate-800 group-hover:text-teal-700"
                                }`}
                              >
                                {material.title}
                              </h4>
                              <ChevronRight className="h-5 w-5 text-slate-300 shrink-0 mt-1 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
                            </div>

                            {material.description && (
                              <p className="text-slate-500 font-bold text-sm leading-relaxed line-clamp-2">
                                {material.description}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-400 pt-1">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-teal-400" />
                                <span>
                                  {new Date(material.date).toLocaleDateString(
                                    "id-ID",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}
                                </span>
                              </div>
                              {material.startedAt && (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 text-indigo-400" />
                                  <span>{material.startedAt} WIB</span>
                                </div>
                              )}
                              {material.isCompleted && (
                                <span className="text-emerald-600 font-black">
                                  ✓ Selesai
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Syllabus */}
                {program.syllabus.length > 0 && (
                  <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-[0_6px_0_0_#cbd5e1]">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-2.5 bg-purple-100 rounded-2xl border-2 border-purple-200">
                        <ListChecks
                          className="h-6 w-6 text-purple-600"
                          strokeWidth={3}
                        />
                      </div>
                      <h2 className="text-xl lg:text-2xl font-black text-slate-800">
                        Silabus
                      </h2>
                    </div>
                    <ul className="space-y-3">
                      {program.syllabus.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 hover:border-purple-200 hover:bg-purple-50 transition-colors group"
                        >
                          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-white border-2 border-slate-200 text-slate-500 font-black text-sm shrink-0 group-hover:border-purple-300 group-hover:text-purple-600 transition-colors">
                            {idx + 1}
                          </span>
                          <span className="text-slate-700 font-bold text-sm md:text-base leading-snug">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Requirements & Benefits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {program.requirements.length > 0 && (
                    <div className="bg-white p-6 rounded-4xl border-2 border-slate-200 shadow-[0_6px_0_0_#cbd5e1]">
                      <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-2 h-6 bg-amber-400 rounded-full" />
                        Persyaratan
                      </h3>
                      <ul className="space-y-3">
                        {program.requirements.map((req, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-sm font-bold text-slate-600 leading-snug"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {program.benefits.length > 0 && (
                    <div className="bg-white p-6 rounded-4xl border-2 border-slate-200 shadow-[0_6px_0_0_#cbd5e1]">
                      <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-2 h-6 bg-emerald-400 rounded-full" />
                        Manfaat
                      </h3>
                      <ul className="space-y-3">
                        {program.benefits.map((ben, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-sm font-bold text-slate-600 leading-snug"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            {ben}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-6 lg:space-y-8">
                {/* Instructor */}
                <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[0_6px_0_0_#cbd5e1] overflow-hidden p-6 lg:p-8 text-center">
                  <div className="w-28 h-28 mx-auto bg-slate-100 rounded-full mb-4 border-4 border-teal-100 overflow-hidden relative shadow-sm">
                    {program.instructor.avatar ? (
                      <img
                        src={program.instructor.avatar}
                        alt={program.instructor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-teal-500 text-white">
                        <User className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-slate-800 leading-tight mb-1">
                    {program.instructor.name}
                  </h3>
                  <p className="text-teal-600 text-xs font-bold uppercase tracking-wider mb-6 bg-teal-50 inline-block px-3 py-1 rounded-full border border-teal-100">
                    Instruktur Kursus
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={() =>
                        router.push(
                          `/instructors/chat?name=${encodeURIComponent(program.instructor.name)}`,
                        )
                      }
                      className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 border-indigo-600 bg-indigo-500 text-white shadow-[0_4px_0_0_#4338ca] hover:bg-indigo-600 hover:shadow-[0_4px_0_0_#3730a3] active:translate-y-0.5 active:shadow-none transition-all group"
                    >
                      <MessageCircle
                        className="w-5 h-5 group-hover:animate-bounce"
                        strokeWidth={3}
                      />
                      <span className="font-black">Mulai Chat</span>
                    </button>

                    {program.instructor.email && (
                      <a
                        href={`mailto:${program.instructor.email}`}
                        className="flex items-center gap-3 p-3.5 rounded-2xl border-2 border-slate-200 text-slate-600 hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50 hover:shadow-sm transition-all bg-white"
                      >
                        <Mail className="w-5 h-5 ml-1" strokeWidth={2.5} />
                        <span className="font-bold text-sm flex-1 text-left">
                          Email Instruktur
                        </span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[0_6px_0_0_#cbd5e1] p-6 lg:p-8">
                  <h3 className="text-lg font-black text-slate-800 mb-5">
                    Informasi Kursus
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal-50 rounded-xl border border-teal-100">
                        <BookOpen className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Total Materi
                        </p>
                        <p className="text-lg font-black text-slate-800">
                          {program.materials.length}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100">
                        <Users className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Total Peserta
                        </p>
                        <p className="text-lg font-black text-slate-800">
                          {program.enrollmentCount}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                        <Clock className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Durasi
                        </p>
                        <p className="text-lg font-black text-slate-800">
                          {program.duration}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Enroll */}
                {!program.isEnrolled && !isPrivileged && (
                  <div className="bg-linear-to-br from-teal-400 to-cyan-400 rounded-[2.5rem] p-6 lg:p-8 text-white border-2 border-teal-600 shadow-[0_6px_0_0_#0f766e] text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                    <GraduationCap className="h-10 w-10 mx-auto mb-3 text-white/80" />
                    <h3 className="text-2xl font-black mb-2 relative z-10">
                      Tertarik Bergabung?
                    </h3>
                    <p className="text-teal-50 text-sm font-bold mb-6 leading-relaxed relative z-10">
                      Daftar untuk mengikuti kursus dan mulai belajar.
                    </p>
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="w-full py-4 rounded-2xl bg-white text-teal-600 font-black border-2 border-teal-100 shadow-lg hover:bg-teal-50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 relative z-10 disabled:opacity-50"
                    >
                      {enrolling ? (
                        <Sparkles className="h-5 w-5 animate-spin" />
                      ) : (
                        "Daftar Sekarang"
                      )}
                    </button>
                  </div>
                )}

                {program.isEnrolled && (
                  <div className="bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-5 text-center">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm text-emerald-700 font-black">
                      Anda terdaftar di kursus ini
                    </p>
                  </div>
                )}

                {/* Edit button for instructor */}
                {isPrivileged && (
                  <button
                    onClick={() => router.push(`/programs/${program.id}/edit`)}
                    className="w-full py-4 rounded-2xl bg-white text-slate-700 font-black border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] hover:border-teal-400 hover:text-teal-600 active:translate-y-1 active:shadow-none transition-all"
                  >
                    Edit Kursus
                  </button>
                )}
              </div>
            </div>
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

export default ProgramDetail;
