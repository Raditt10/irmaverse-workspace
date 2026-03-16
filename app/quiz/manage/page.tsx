"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import Toast from "@/components/ui/Toast";
import CartoonConfirmDialog from "@/components/ui/ConfirmDialog";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import {
  Settings,
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  Zap,
  HelpCircle,
  ListChecks,
  ChevronRight,
  Users,
  Trophy,
  Search,
  Filter,
} from "lucide-react";

interface ManagedQuiz {
  id: string;
  title: string;
  description: string | null;
  materialId: string | null;
  materialTitle: string | null;
  creatorName: string | null;
  questionCount: number;
  attemptCount: number;
  createdAt: string;
  isStandalone: boolean;
}

type FilterType = "all" | "standalone" | "material";

export default function QuizManagePage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/auth");
    },
  });

  const [quizzes, setQuizzes] = useState<ManagedQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ManagedQuiz | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const role = session?.user?.role?.toLowerCase();
  const isPrivileged =
    role === "instruktur" || role === "admin" || role === "instructor" || role === "super_admin";

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchQuizzes();
    }
  }, [authStatus]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/quiz/manage");
      if (!res.ok) throw new Error("Gagal mengambil data quiz");
      const data = await res.json();
      setQuizzes(data);
    } catch (error) {
      showToast("Gagal memuat daftar quiz", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/quiz/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus quiz");
      showToast("Quiz berhasil dihapus", "success");
      setQuizzes((prev) => prev.filter((q) => q.id !== deleteTarget.id));
    } catch {
      showToast("Gagal menghapus quiz", "error");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const filtered = quizzes.filter((q) => {
    const matchFilter =
      filter === "all" ||
      (filter === "standalone" && q.isStandalone) ||
      (filter === "material" && !q.isStandalone);
    const matchSearch =
      !search ||
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.materialTitle?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-80px)]">
            <Loading text="Memuat quiz..." />
          </div>
        </div>
      </div>
    );
  }

  if (!isPrivileged) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
            <HelpCircle className="h-16 w-16 text-slate-300 mb-4" />
            <h2 className="text-xl font-black text-slate-700 mb-2">
              Akses Ditolak
            </h2>
            <p className="text-slate-500 mb-4">
              Hanya instruktur atau admin yang bisa mengelola quiz.
            </p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 rounded-xl bg-emerald-400 text-white font-black border-2 border-emerald-600 border-b-4 hover:bg-emerald-500 active:border-b-2 active:translate-y-0.5 transition-all"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "Semua", count: quizzes.length },
    {
      key: "standalone",
      label: "Mandiri",
      count: quizzes.filter((q) => q.isStandalone).length,
    },
    {
      key: "material",
      label: "Materi",
      count: quizzes.filter((q) => !q.isStandalone).length,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex flex-col lg:flex-row">
        <Sidebar />
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-12 w-full max-w-[100vw] overflow-hidden">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl lg:text-4xl font-black text-slate-800 tracking-tight mb-1 flex items-center gap-3">
                 Kelola Quiz
                </h1>
                <p className="text-slate-500 font-medium text-sm lg:text-base">
                  Edit, hapus, dan pantau semua quiz yang kamu buat
                </p>
              </div>
              <button
                onClick={() => router.push("/quiz/create")}
                className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 text-white font-black border-2 border-emerald-700 border-b-4 hover:bg-emerald-600 active:border-b-2 active:translate-y-0.5 transition-all shadow-sm"
              >
                <Plus className="h-5 w-5" strokeWidth={3} /> Quiz Baru
              </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                {
                  label: "Total Quiz",
                  value: quizzes.length,
                  icon: ListChecks,
                  color: "text-emerald-500 bg-emerald-50 border-emerald-100",
                },
                {
                  label: "Quiz Mandiri",
                  value: quizzes.filter((q) => q.isStandalone).length,
                  icon: Zap,
                  color: "text-emerald-500 bg-emerald-50 border-emerald-100",
                },
                {
                  label: "Quiz Materi",
                  value: quizzes.filter((q) => !q.isStandalone).length,
                  icon: BookOpen,
                  color: "text-emerald-500 bg-emerald-50 border-emerald-100",
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="bg-white rounded-2xl border-2 border-slate-200 shadow-[0_3px_0_0_#cbd5e1] p-4 text-center"
                >
                  <div
                    className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center mx-auto mb-2 ${color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-black text-slate-800">{value}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari judul quiz atau nama materi..."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-200 bg-white text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>
              <div className="flex gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`px-4 py-2.5 rounded-2xl text-sm font-black border-2 transition-all ${
                      filter === tab.key
                        ? "bg-emerald-500 text-white border-emerald-700 border-b-4 active:border-b-2 active:translate-y-0.5"
                        : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-600"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                        filter === tab.key
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon="search"
                title={search ? "Tidak ada hasil pencarian" : "Belum ada quiz"}
                description={
                  search ? "Coba kata kunci lain" : "Mulai buat quiz pertamamu!"
                }
                actionLabel={!search ? "Buat Quiz" : undefined}
                onAction={
                  !search ? () => router.push("/quiz/create") : undefined
                }
              />
            ) : (
              <div className="space-y-3">
                {filtered.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-white rounded-2xl border-2 border-slate-200 shadow-[0_3px_0_0_#cbd5e1] overflow-hidden hover:border-teal-200 hover:shadow-[0_3px_0_0_#99f6e4] transition-all group"
                  >
                    <div className="flex items-center gap-4 p-4 lg:p-5">
                      {/* Icon */}
                      <div
                        className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center shrink-0 ${
                          quiz.isStandalone
                            ? "bg-emerald-100 border-emerald-200 text-emerald-600"
                            : "bg-emerald-100 border-emerald-200 text-emerald-600"
                        }`}
                      >
                        {quiz.isStandalone ? (
                          <Zap className="h-6 w-6" />
                        ) : (
                          <BookOpen className="h-6 w-6" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <h3 className="font-black text-slate-800 text-sm lg:text-base truncate">
                            {quiz.title}
                          </h3>
                          <span
                            className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full border ${
                              quiz.isStandalone
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                : "bg-emerald-50 text-emerald-600 border-emerald-200"
                            }`}
                          >
                            {quiz.isStandalone ? "Mandiri" : "Materi"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium truncate">
                          {quiz.isStandalone
                            ? `Dibuat oleh ${quiz.creatorName || "kamu"}`
                            : `Materi: ${quiz.materialTitle || "-"}`}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1 text-xs text-slate-500 font-bold">
                            <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                            {quiz.questionCount} soal
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-500 font-bold">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            {quiz.attemptCount} percobaan
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {new Date(quiz.createdAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => router.push(`/quiz/manage/${quiz.id}`)}
                          className="p-2.5 rounded-xl border-2 border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                          title="Edit quiz"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(quiz)}
                          className="p-2.5 rounded-xl border-2 border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all"
                          title="Hapus quiz"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            quiz.isStandalone
                              ? router.push(`/quiz/standalone/${quiz.id}`)
                              : router.push(
                                  `/quiz/${quiz.materialId}/${quiz.id}`,
                                )
                          }
                          className="p-2.5 rounded-xl border-2 border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                          title="Lihat / Preview quiz"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <CartoonConfirmDialog
        isOpen={!!deleteTarget}
        title="Hapus Quiz?"
        message={`Quiz "${deleteTarget?.title}" beserta semua soal dan data percobaan akan dihapus permanen.`}
        confirmText={deleting ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
        type="warning"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}
