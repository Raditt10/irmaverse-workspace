"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";

import Toast from "@/components/ui/Toast";
import CartoonConfirmDialog from "@/components/ui/ConfirmDialog"; // Import Confirm Dialog
import Loading from "@/components/ui/Loading";
import ButtonEdit from "@/components/ui/ButtonEdit";
import DeleteButton from "@/components/ui/DeleteButton";
import {
  Calendar,
  MapPin,
  User,
  Contact,
  Clock,
  ArrowLeft,
  Mail,
  CheckCircle2,
  Info,
  BookOpen,
  Book,
  Target,
  MessageCircle,
  Tag,
  Sparkles,
  Users,
  CheckCircle,
  XCircle,
  History,
  FileText,
  ListChecks,
  Plus,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface InviteDetail {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  status: string;
  createdAt: string;
}

interface Material {
  id: string;
  title: string;
  description: string;
  date: string;
  startedAt: string;
  location: string;
  instructor: string;
  instructorAvatar?: string;
  category: string;
  grade: string;
  thumbnailUrl?: string;
  isJoined?: boolean;
  points?: string[];
  attendedAt?: string;
  hasRekapan?: boolean;
  isEnrolledInProgram?: boolean;
  program?: { id: string; title: string } | null;
  inviteDetails?: InviteDetail[];
}

const MaterialDetail = () => {
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Quiz state for smart link
  const [materialQuizzes, setMaterialQuizzes] = useState<
    { id: string; title: string }[] | null
  >(null);
  const [quizLoading, setQuizLoading] = useState(false);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const router = useRouter();
  const params = useParams();
  const materialId = params.id as string;

  // 1. Session Check & Redirect
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      if (typeof window !== "undefined") {
        window.location.href = "/auth";
      }
    },
  });

  const role = session?.user?.role?.toLowerCase();
  const isPrivileged =
    role === "instruktur" || role === "admin" || role === "instructor" || role === "super_admin";

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    if (materialId) {
      fetchMaterialDetail();
      fetchMaterialQuizzes();
    }
  }, [materialId]);

  const fetchMaterialQuizzes = async () => {
    try {
      setQuizLoading(true);
      const res = await fetch(`/api/materials/${materialId}/quiz`);
      if (res.ok) {
        const data = await res.json();
        const quizzes = Array.isArray(data)
          ? data.map((q: any) => ({ id: q.id, title: q.title }))
          : data.quizzes
            ? data.quizzes.map((q: any) => ({ id: q.id, title: q.title }))
            : [];
        setMaterialQuizzes(quizzes);
      } else {
        setMaterialQuizzes([]);
      }
    } catch {
      setMaterialQuizzes([]);
    } finally {
      setQuizLoading(false);
    }
  };

  const fetchMaterialDetail = async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/materials/${materialId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Kajian tidak ditemukan");
        }
        const err = await res
          .json()
          .catch(() => ({ error: "Gagal mengambil data" }));
        throw new Error(err.error || "Gagal mengambil data kajian");
      }

      const data = await res.json();

      const mapped: Material = {
        id: data.id,
        title: data.title,
        description: data.description,
        date: data.date,
        startedAt: data.startedAt || "",
        location: data.location || "Belum ditentukan",
        instructor: data.instructor || (data.instructorName ?? "TBA"),
        instructorAvatar: data.instructorAvatar || null,
        category: data.category || "",
        grade: data.grade || "",
        thumbnailUrl: data.thumbnailUrl || null,
        isJoined: data.isJoined ?? false,
        points: data.points || [],
        attendedAt: data.attendedAt || undefined,
        hasRekapan: data.hasRekapan ?? false,
        isEnrolledInProgram: data.isEnrolledInProgram ?? false,
        program: data.program || null,
        inviteDetails: data.inviteDetails || [],
      };

      setMaterial(mapped);
    } catch (error: any) {
      console.error("Error loading material:", error);
      showToast(error.message || "Gagal memuat detail kajian", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/materials/${materialId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal menghapus kajian");
      }

      showToast("Kajian berhasil dihapus", "success");
      setTimeout(() => router.push("/materials"), 1500);
    } catch (error: any) {
      console.error("Delete Error:", error);
      showToast(error.message || "Terjadi kesalahan saat menghapus", "error");
    } finally {
      setShowConfirmDelete(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    let style = "bg-slate-100 text-slate-700 border-slate-200";
    if (category === "Program Wajib")
      style = "bg-rose-100 text-rose-700 border-rose-200";
    if (category === "Program Ekstra")
      style = "bg-purple-100 text-purple-700 border-purple-200";
    if (category === "Program Next Level" || category === "Program Susulan")
      style = "bg-amber-100 text-amber-700 border-amber-200";

    return (
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase border-2 shadow-sm ${style}`}
      >
        <Tag className="w-3.5 h-3.5" strokeWidth={3} />
        {category}
      </div>
    );
  };

  // --- STATE LOADING ---
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
            <Loading text="Sedang memuat detail kajian..." size="lg" />
          </div>
        </div>
      </div>
    );
  }

  // --- STATE DATA NOT FOUND ---
  if (!material) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center border-4 border-dashed border-slate-300 mb-6">
              <Target className="h-10 w-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-700 mb-2">
              Kajian Tidak Ditemukan
            </h2>
            <p className="text-slate-500 mb-6">
              Mungkin kajian ini sudah dihapus atau ID-nya salah.
            </p>
            <button
              onClick={() => router.push("/materials")}
              className="mt-4 px-6 py-3 rounded-xl bg-teal-400 text-white font-black border-2 border-teal-600 border-b-4 hover:bg-teal-500 active:border-b-2 active:translate-y-0.5 transition-all"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full max-w-[100vw] overflow-x-hidden">
          <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8">
            {/* --- HEADER NAVIGATION & ACTIONS --- */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <button
                  onClick={() => router.push("/materials")}
                  className="self-start inline-flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-xl bg-white border-2 border-slate-200 text-slate-500 font-bold hover:border-teal-400 hover:text-teal-600 hover:shadow-[0_4px_0_0_#cbd5e1] active:translate-y-0.5 active:shadow-none transition-all text-sm lg:text-base"
                >
                  <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" strokeWidth={3} />
                  Kembali
                </button>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-end sm:self-auto">
                    {isPrivileged && (
                        <>
                            <button
                              onClick={() => router.push(`/materials/${material.id}/attendance`)}
                              className="px-4 h-12 rounded-xl bg-cyan-400 text-white font-black border-2 border-cyan-600 border-b-4 hover:bg-cyan-500 active:border-b-2 active:translate-y-0.5 transition-all shadow-sm flex items-center justify-center gap-2 group"
                              title="Absensi"
                            >
                              <Book className="h-5 w-5 stroke-[2.5] group-hover:-rotate-12 transition-transform" />
                              <span className="hidden sm:inline">Absensi</span>
                            </button>
                            <ButtonEdit 
                                id={material.id} 
                                basePath="/materials" 
                                className="h-12 w-12" 
                            />
                            
                            <DeleteButton 
                                onClick={() => setShowConfirmDelete(true)}
                                variant="icon-only"
                                className="rounded-xl h-12 w-12"
                            />
                        </>
                    )}
                </div>
            </div>

            {/* --- HERO SECTION --- */}
            <div className="relative bg-[#334155] rounded-[40px] md:rounded-[60px] border-4 border-slate-200 shadow-[0_12px_0_0_#cbd5e1] overflow-hidden min-h-[300px] md:min-h-[400px] flex flex-col justify-end p-8 md:p-12 group">
              {/* Image with Gradient Overlay */}
              <div className="absolute inset-0">
                <img
                  src={
                    material.thumbnailUrl || "https://picsum.photos/1200/600"
                  }
                  alt={material.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-40 brightness-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b] via-[#334155]/60 to-transparent" />
              </div>

              <div className="relative z-10 w-full">
                <div className="mb-6 flex items-center gap-3">
                  <span className="px-5 py-2.5 rounded-full text-xs font-black bg-[#10b981] text-white border-2 border-[#059669] shadow-[0_4px_0_0_#065f46] uppercase tracking-wider">
                    {material.category}
                  </span>
                </div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 drop-shadow-xl leading-tight tracking-tight">
                  {material.title}
                </h1>

                <p className="text-slate-300 font-bold text-lg md:text-xl max-w-2xl leading-relaxed drop-shadow-md">
                  {material.description
                    ? material.description.split("\n")[0]
                    : "Deskripsi materi tidak tersedia..."}
                </p>
              </div>
            </div>

            {/* --- GRID LAYOUT --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* LEFT COLUMN (Details) */}
              <div className="lg:col-span-2 space-y-8">
                {/* Quick Stats Tiles */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Tanggal */}
                  <div className="bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-sm flex items-center gap-4 hover:-translate-y-1 transition-transform">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-emerald-50 flex items-center justify-center border-2 border-emerald-100">
                      <Calendar
                        className="h-6 w-6 text-emerald-500"
                        strokeWidth={2.5}
                      />
                    </div>
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                        Tanggal
                      </span>
                      <span className="text-slate-800 font-black text-sm md:text-base truncate">
                        {new Date(material.date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Waktu */}
                  <div className="bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-sm flex items-center gap-4 hover:-translate-y-1 transition-transform">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-emerald-50 flex items-center justify-center border-2 border-emerald-100">
                      <Clock
                        className="h-6 w-6 text-emerald-500"
                        strokeWidth={2.5}
                      />
                    </div>
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                        Waktu
                      </span>
                      <span className="text-slate-800 font-black text-sm md:text-base truncate">
                        {material.startedAt} WIB
                      </span>
                    </div>
                  </div>

                  {/* Lokasi */}
                  <div className="bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-sm flex items-center gap-4 hover:-translate-y-1 transition-transform">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-emerald-50 flex items-center justify-center border-2 border-emerald-100">
                      <MapPin
                        className="h-6 w-6 text-emerald-500"
                        strokeWidth={2.5}
                      />
                    </div>
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                        Lokasi
                      </span>
                      <span className="text-slate-800 font-black text-sm md:text-base truncate">
                        {material.location}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deskripsi Lengkap */}
                <div className="bg-white p-8 md:p-10 rounded-[45px] border-4 border-slate-200 shadow-[0_10px_0_0_#cbd5e1]">
                  <div className="flex items-center gap-5 mb-8">
                    <div className="w-14 h-14 bg-emerald-100 rounded-2xl border-4 border-emerald-200 flex items-center justify-center">
                      <Info
                        className="h-7 w-7 text-emerald-500"
                        strokeWidth={3}
                      />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                      Deskripsi Kajian
                    </h2>
                  </div>

                  <p className="text-slate-600 font-bold leading-relaxed mb-8 whitespace-pre-line text-lg">
                    {material.description}
                  </p>

                  {material.points && material.points.length > 0 && (
                    <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100">
                      <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Target className="h-5 w-5 text-teal-500" />
                        Poin Pembahasan
                      </h3>
                      <ul className="space-y-3">
                        {material.points.map((point, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-3 text-sm font-semibold text-slate-600"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-2 shrink-0" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Rekapan & Quiz Section — visible only to invited/privileged */}
                {(material.isJoined || isPrivileged) && (
                <div className="bg-white p-6 lg:p-8 rounded-4xl border-2 border-slate-200 shadow-[0_6px_0_0_#cbd5e1]">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-2.5 bg-emerald-100 rounded-2xl border-2 border-emerald-200">
                      <ListChecks
                        className="h-6 w-6 text-emerald-600"
                        strokeWidth={3}
                      />
                    </div>
                    <h2 className="text-xl lg:text-2xl font-black text-slate-800">
                      Belajar Mandiri
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Rekapan Button */}
                    <button
                      onClick={() => {
                        if (material.hasRekapan) {
                          router.push(`/materials/${material.id}/rekapan`);
                        } else {
                          showToast(
                            "Maaf, Kajian ini belum memuat rekapan materi",
                            "warning" as any,
                          );
                        }
                      }}
                      className="flex items-center gap-4 p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 transition-all text-left group shadow-[0_3px_0_0_#6ee7b7] hover:shadow-[0_3px_0_0_#34d399] active:translate-y-0.5 active:shadow-none"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-emerald-200 border-2 border-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <FileText className="h-6 w-6 text-emerald-700" />
                      </div>
                      <div>
                        <p className="font-black text-emerald-800 text-sm">
                          Rekapan Materi
                        </p>
                        <p className="text-xs text-emerald-600 font-medium">
                          Baca ringkasan kajian
                        </p>
                      </div>
                    </button>

                    {/* Quiz Button - Smart Link */}
                    <button
                      onClick={() => {
                        if (quizLoading) return;
                        if (materialQuizzes && materialQuizzes.length > 0) {
                          router.push(
                            `/quiz/${material.id}/${materialQuizzes[0].id}`,
                          );
                        }
                      }}
                      disabled={
                        quizLoading ||
                        !materialQuizzes ||
                        materialQuizzes.length === 0
                      }
                      className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left group active:translate-y-0.5 active:shadow-none ${
                        quizLoading
                          ? "border-slate-200 bg-slate-50 cursor-wait"
                          : materialQuizzes && materialQuizzes.length > 0
                            ? "border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 shadow-[0_3px_0_0_#fcd34d] hover:shadow-[0_3px_0_0_#f59e0b]"
                            : "border-slate-200 bg-slate-50 cursor-not-allowed opacity-70"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${
                          quizLoading
                            ? "bg-slate-200 border-slate-300"
                            : materialQuizzes && materialQuizzes.length > 0
                              ? "bg-amber-200 border-amber-300"
                              : "bg-slate-200 border-slate-300"
                        }`}
                      >
                        {quizLoading ? (
                          <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
                        ) : materialQuizzes && materialQuizzes.length > 0 ? (
                          <ListChecks className="h-6 w-6 text-amber-700" />
                        ) : (
                          <AlertCircle className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p
                          className={`font-black text-sm ${
                            materialQuizzes && materialQuizzes.length > 0
                              ? "text-amber-800"
                              : "text-slate-500"
                          }`}
                        >
                          {quizLoading
                            ? "Memuat Quiz..."
                            : materialQuizzes && materialQuizzes.length > 0
                              ? "Quiz Materi"
                              : "Quiz Belum Dibuat"}
                        </p>
                        <p
                          className={`text-xs font-medium ${
                            materialQuizzes && materialQuizzes.length > 0
                              ? "text-amber-600"
                              : "text-slate-400"
                          }`}
                        >
                          {quizLoading
                            ? "Mohon tunggu..."
                            : materialQuizzes && materialQuizzes.length > 0
                              ? `${materialQuizzes.length} quiz tersedia`
                              : "Instruktur belum membuat quiz"}
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Instructor: Create Quiz button */}
                  {isPrivileged && (
                    <button
                      onClick={() =>
                        router.push(`/materials/${material.id}/quiz/create`)
                      }
                      className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-amber-300 text-amber-500 font-bold text-sm hover:bg-amber-50 hover:border-amber-400 transition-all"
                    >
                      <Plus className="h-4 w-4" /> Buat Quiz Baru
                    </button>
                  )}
                </div>
                )}
              </div>

              {/* RIGHT COLUMN (Instructor & CTA) */}
              <div className="space-y-6 lg:space-y-8">
                {/* Instructor Card */}
                <div className="bg-white rounded-[45px] border-4 border-slate-200 shadow-[0_10px_0_0_#cbd5e1] overflow-hidden p-8 flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 bg-teal-500 rounded-full border-4 border-white shadow-xl overflow-hidden">
                      {material.instructorAvatar ? (
                        <img
                          src={material.instructorAvatar}
                          alt={material.instructor}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white">
                          <Contact className="h-16 w-16" strokeWidth={2.5} />
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-slate-800 leading-tight mb-8">
                    {material.instructor}
                  </h3>

                  <div className="w-full pt-6 border-t-2 border-slate-100">
                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4 text-center">
                      — HUBUNGI PEMATERI —
                    </p>
                    <button
                      onClick={() =>
                        router.push(
                          `/instructors/chat?name=${encodeURIComponent(material.instructor)}`,
                        )
                      }
                      className="w-full p-4 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-center gap-2 hover:border-teal-400 hover:bg-teal-50 transition-all group"
                    >
                      <MessageCircle
                        className="w-5 h-5 text-teal-500 group-hover:scale-110 transition-transform"
                        strokeWidth={3}
                      />
                      <span className="font-bold text-slate-600">
                        Kirim Pesan
                      </span>
                    </button>
                  </div>
                </div>

                {/* Invite Status Card - Instructor Only */}
                {isPrivileged &&
                  material.inviteDetails &&
                  material.inviteDetails.length > 0 && (
                    <div className="bg-white rounded-4xl border-2 border-slate-200 shadow-[0_6px_0_0_#cbd5e1] overflow-hidden p-6 lg:p-8">
                      <h3 className="text-lg font-black text-slate-800 mb-1 flex items-center gap-2">
                        <Users className="w-5 h-5 text-amber-500" /> Status
                        Undangan
                      </h3>
                      <p className="text-xs text-slate-400 font-semibold mb-4">
                        {
                          material.inviteDetails.filter(
                            (i) => i.status === "accepted",
                          ).length
                        }{" "}
                        diterima ·{" "}
                        {
                          material.inviteDetails.filter(
                            (i) => i.status === "pending",
                          ).length
                        }{" "}
                        menunggu ·{" "}
                        {
                          material.inviteDetails.filter(
                            (i) => i.status === "rejected",
                          ).length
                        }{" "}
                        ditolak
                      </p>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {material.inviteDetails.map((inv) => {
                          const statusConfig: Record<
                            string,
                            {
                              label: string;
                              color: string;
                              icon: React.ReactNode;
                            }
                          > = {
                            pending: {
                              label: "Menunggu",
                              color:
                                "bg-amber-100 text-amber-700 border-amber-200",
                              icon: <Clock className="w-3.5 h-3.5" />,
                            },
                            accepted: {
                              label: "Diterima",
                              color:
                                "bg-emerald-100 text-emerald-700 border-emerald-200",
                              icon: <CheckCircle className="w-3.5 h-3.5" />,
                            },
                            rejected: {
                              label: "Ditolak",
                              color: "bg-red-100 text-red-700 border-red-200",
                              icon: <XCircle className="w-3.5 h-3.5" />,
                            },
                          };
                          const cfg =
                            statusConfig[inv.status] || statusConfig.pending;
                          return (
                            <div
                              key={inv.id}
                              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {inv.avatar ? (
                                  <img
                                    src={inv.avatar}
                                    alt={inv.name || inv.email}
                                    className="w-8 h-8 rounded-full object-cover border-2 border-slate-200"
                                  />
                                ) : (
                                  <span className="w-8 h-8 flex items-center justify-center bg-slate-200 rounded-full text-slate-500 text-xs font-bold">
                                    {(inv.name || inv.email)
                                      .charAt(0)
                                      .toUpperCase()}
                                  </span>
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-700 truncate">
                                    {inv.name || inv.email}
                                  </p>
                                  {inv.name && (
                                    <p className="text-[10px] text-slate-400 truncate">
                                      {inv.email}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 ${cfg.color}`}
                              >
                                {cfg.icon} {cfg.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* CTA / Action Box */}
                {!isPrivileged && (
                  material.isJoined ? (
                  <div className="bg-linear-to-br from-teal-400 to-cyan-400 rounded-4xl p-6 lg:p-8 text-white border-2 border-teal-600 shadow-[0_6px_0_0_#0f766e] text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>

                    {material.attendedAt ? (
                      <>
                        <h3 className="text-2xl font-black mb-2 relative z-10">
                          Alhamdulillah! ✨
                        </h3>
                        <p className="text-teal-50 text-sm font-bold mb-6 leading-relaxed relative z-10">
                          Kamu sudah mengisi absensi untuk kajian ini. Semoga
                          ilmunya berkah dan bermanfaat ya!
                        </p>
                        <div className="w-full py-4 rounded-2xl bg-white/20 text-white font-black border-2 border-white/30 backdrop-blur-sm flex items-center justify-center gap-2 relative z-10">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                          Sudah Absen
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="text-2xl font-black mb-2 relative z-10">
                          Siap Hadir?
                        </h3>
                        <p className="text-teal-50 text-sm font-bold mb-6 leading-relaxed relative z-10">
                          Jangan lupa isi absensi saat kegiatan berlangsung
                          untuk mencatat kehadiranmu.
                        </p>
                        <button
                          onClick={() => {
                            if (material.program?.id && !material.isEnrolledInProgram) {
                              showToast("mohon maaf, kamu belum terdaftar di program kurikulum kajian ini", "error");
                              return;
                            }
                            router.push(`/materials/${material.id}/absensi`);
                          }}
                          className="w-full py-4 rounded-2xl bg-white text-teal-600 font-black border-2 border-teal-100 shadow-lg hover:bg-teal-50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 relative z-10"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          Aku Ikut! ✋
                        </button>
                      </>
                    )}
                  </div>
                  ) : (
                  <div className="bg-white rounded-4xl p-6 lg:p-8 border-2 border-slate-200 shadow-[0_6px_0_0_#cbd5e1] text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-slate-200">
                      <Info className="h-7 w-7 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-black text-slate-700 mb-2">Akses Dibatasi</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                      Mohon maaf, Kamu tidak terdaftar sebagai peserta kajian ini.
                    </p>
                  </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />

      {/* Confirm Dialog */}
      <CartoonConfirmDialog
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Hapus Kajian?"
        message="Apakah Anda yakin ingin menghapus kajian ini? Tindakan ini tidak dapat dibatalkan."
        type="warning"
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />
    </div>
  );
};

export default MaterialDetail;
