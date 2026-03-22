"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import SuccessDataFound from "@/components/ui/SuccessDataFound";
import {
  Trophy,
  Play,
  Search,
  BookOpen,
  Sparkles,
  Medal,
  Target,
  Plus,
  Zap,
  Settings,
  Trash2,
  XCircle,
  HelpCircle,
  CheckCircle2,
  Check,
} from "lucide-react";

interface Quiz {
  id: string;
  materialId: string | null;
  title: string;
  materialTitle: string | null;
  description: string | null;
  questionCount: number;
  creatorName: string | null;
  isStandalone: boolean;
  status: "not_started" | "completed";
  score?: number;
  totalScore?: number;
  coverColor: string;
  materialThumbnail?: string | null;
}

const COVER_COLORS = [
  "from-teal-400 to-emerald-400",
  "from-blue-400 to-indigo-400",
  "from-purple-400 to-fuchsia-400",
  "from-orange-400 to-rose-400",
  "from-cyan-400 to-sky-400",
  "from-amber-400 to-yellow-400",
];

const QuizHome = () => {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/auth");
    },
  });

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const isInstructor =
    session?.user?.role === "instruktur" || session?.user?.role === "admin" || session?.user?.role === "super_admin";

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "not_started" | "completed" | "standalone" | "material"
  >("all");

  const role = session?.user?.role?.toLowerCase();
  const isPrivileged =
    role === "instruktur" || role === "admin" || role === "instructor" || role === "super_admin";
  const isStaffRole = role === "admin" || role === "super_admin" || role === "instruktur" || role === "instructor";

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchQuizzes();
    }
  }, [authStatus]);

  const [totalQuizXpFromServer, setTotalQuizXpFromServer] = useState(0);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/quiz");
      if (!res.ok) throw new Error("Failed to fetch quizzes");
      const data = await res.json();

      let colorIdx = 0;
      const mapped: Quiz[] = (data.quizzes || []).map((q: any) => {
        const quiz: Quiz = {
          id: q.id,
          materialId: q.materialId,
          title: q.title,
          materialTitle: q.materialTitle,
          description: q.description,
          questionCount: q.questionCount,
          creatorName: q.creatorName,
          isStandalone: q.isStandalone,
          status: q.lastAttempt ? "completed" : "not_started",
          score: q.lastAttempt?.score,
          totalScore: q.lastAttempt?.totalScore,
          coverColor: COVER_COLORS[colorIdx % COVER_COLORS.length],
          materialThumbnail: q.materialThumbnail,
        };
        colorIdx++;
        return quiz;
      });

      setQuizzes(mapped);
      setTotalQuizXpFromServer(data.totalQuizXp || 0);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const matchesSearch =
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (quiz.materialTitle || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      let matchesFilter = true;
      if (activeFilter === "completed")
        matchesFilter = quiz.status === "completed";
      else if (activeFilter === "not_started")
        matchesFilter = quiz.status !== "completed";
      else if (activeFilter === "standalone") matchesFilter = quiz.isStandalone;
      else if (activeFilter === "material") matchesFilter = !quiz.isStandalone;
      return matchesSearch && matchesFilter;
    });
  }, [quizzes, searchQuery, activeFilter]);

  const quizStats = useMemo(() => {
    const completed = quizzes.filter((q) => q.status === "completed");
    const totalEarnedRaw = completed.reduce((acc, q) => acc + (q.score || 0), 0);
    const totalPossibleRaw = completed.reduce(
      (acc, q) => acc + (q.totalScore || 0),
      0,
    );
    const accuracy =
      totalPossibleRaw > 0
        ? Math.round((totalEarnedRaw / totalPossibleRaw) * 100)
        : 0;

    return {
      totalXP: totalQuizXpFromServer,
      completedCount: completed.length,
      totalQuizzes: quizzes.length,
      accuracy,
    };
  }, [quizzes, totalQuizXpFromServer]);

  const handleQuizClick = (quiz: Quiz, mode?: "review" | "retake") => {
    const baseUrl = quiz.materialId
      ? `/quiz/${quiz.materialId}/${quiz.id}`
      : `/quiz/standalone/${quiz.id}`;
    
    // Staff roles always go to the detailed stats/management page
    if (isStaffRole) {
      router.push(`/quiz/manage/${quiz.id}/stats`);
      return;
    }

    const isReview = mode === "review";
    const url = isReview ? `${baseUrl}?review=true` : baseUrl;
    router.push(url);
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loading text="Memuat Area Quiz..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      <DashboardHeader />

      <div className="flex flex-1">
        <div className="hidden lg:block h-[calc(100vh-64px)] sticky top-16">
          <Sidebar />
        </div>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          {/* --- HERO BANNER --- */}
          <div className="bg-linear-to-r from-teal-500 to-emerald-400 rounded-4xl lg:rounded-[3rem] p-6 lg:p-10 border-4 border-teal-700 shadow-[0_8px_0_0_#0f766e] text-white relative overflow-hidden mb-10 group">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute bottom-0 left-20 w-32 h-32 bg-teal-300 opacity-20 rounded-full blur-2xl" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left flex-1 w-full relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-xs font-black uppercase tracking-wider mb-4">
                  <HelpCircle className="h-4 w-4 text-white" />
                  Quiz Arena
                </div>
                {/* Moved specific quiz header into Hero Banner for better alignment and display */}
                <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight mb-2 flex items-center gap-3 justify-center md:justify-start">
                  {isPrivileged ? "Kelola Kuis Kajian" : "Kerjakan Kuis"}
                </h1>
                <p className="text-teal-50 font-medium text-sm lg:text-base max-w-xl mx-auto md:mx-0">
                  Kerjakan kuis dari kajian atau quiz mandiri buatan instruktur.
                  <br className="hidden md:block" />
                  Dapatkan skor terbaikmu!
                </p>
              </div>

              {isInstructor && isPrivileged && (
                  <div className="flex flex-col gap-2 shrink-0 z-10">
                    <button
                      onClick={() => router.push("/quiz/create")}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-teal-600 font-black text-sm border-2 border-white/80 shadow-[0_4px_0_0_#0f766e] hover:shadow-[0_2px_0_0_#0f766e] hover:translate-y-0.5 active:translate-y-1 active:shadow-none transition-all"
                    >
                      <Plus className="h-4 w-4" strokeWidth={3} /> Buat Quiz Baru
                    </button>
                    <button
                      onClick={() => router.push("/quiz/manage")}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-white/20 text-white font-black text-sm border-2 border-white/30 hover:bg-white/30 transition-all backdrop-blur-sm"
                    >
                      <Settings className="h-4 w-4" strokeWidth={2.5} /> Kelola Quiz
                    </button>
                  </div>
              )}
            </div>
            
            <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:flex w-32 h-32 lg:w-40 lg:h-40 bg-white/10 rounded-full border-4 border-white/20 backdrop-blur-md items-center justify-center shadow-inner transform rotate-12 group-hover:rotate-0 transition-all duration-500 opacity-60">
              <Zap className="h-16 w-16 lg:h-20 lg:w-20 text-white drop-shadow-md" fill="currentColor" />
            </div>
          </div>

          {/* --- SEARCH & FILTERS --- */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
            <div className="w-full md:w-96">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Cari kuis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-teal-400 focus:shadow-[0_0_0_4px_rgba(45,212,191,0.2)] transition-all font-medium text-slate-700 outline-none"
                />
              </div>
            </div>

            <div className="flex bg-slate-200/60 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto">
              {(
                [
                  { key: "all", label: "Semua" },
                  ...(!isInstructor
                    ? ([
                        { key: "not_started", label: "Belum" },
                        { key: "completed", label: "Selesai" },
                      ] as const)
                    : []),
                  { key: "standalone", label: "Mandiri" },
                  { key: "material", label: "Kajian" },
                ] as const
              ).map((f: any) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`shrink-0 px-4 lg:px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
                    activeFilter === f.key
                      ? "bg-white text-teal-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* --- PROFESSIONAL XP DASHBOARD BANNER --- */}
          {!isInstructor && (
            <div className="mb-10 relative group">
              {/* Decorative side shape */}
              <div className="absolute -inset-0.5 bg-linear-to-r from-emerald-500 to-teal-500 rounded-[2.5rem] opacity-20 blur-sm group-hover:opacity-30 transition-opacity duration-500" />
              
              <div className="relative flex flex-col lg:flex-row bg-white border-2 border-slate-200 rounded-[2.5rem] overflow-hidden shadow-[0_8px_0_0_#cbd5e1] group-hover:border-emerald-400 group-hover:shadow-[0_8px_0_0_#10b981] transition-all duration-500">
                {/* Primary Section: Total XP */}
                <div className="lg:w-1/3 p-6 lg:p-8 bg-linear-to-br from-emerald-50 via-white to-white border-b-2 lg:border-b-0 lg:border-r-2 border-slate-100 flex items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center transform rotate-3 shadow-lg shadow-emerald-200 group-hover:rotate-6 transition-transform duration-500">
                      <Zap className="h-10 w-10 text-white" fill="currentColor" />
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">
                      Total XP dari Kuis
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl lg:text-5xl font-black text-slate-800 tracking-tight">
                        {quizStats.totalXP.toLocaleString()}
                      </span>
                      <span className="text-lg font-black text-emerald-500">XP</span>
                    </div>
                  </div>
                </div>

                {/* Secondary Stats Section */}
                <div className="flex-1 p-6 lg:p-8 flex flex-col sm:flex-row items-center justify-around gap-8 bg-white/50 backdrop-blur-sm">
                  {/* Quizzes Completed */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                        Kuis Selesai
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-slate-800">
                          {quizStats.completedCount}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">/ {quizStats.totalQuizzes}</span>
                      </div>
                    </div>
                  </div>

                  {/* Average Accuracy */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                      <Target className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                        Akurasi Rata-rata
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-slate-800">
                          {quizStats.accuracy}%
                        </span>
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden ml-2">
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                            style={{ width: `${quizStats.accuracy}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Motivational Text / Badge */}
                  <div className="hidden xl:flex flex-col items-center gap-2">
                    <div className="px-5 py-2.5 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs font-black text-emerald-600 flex items-center gap-2 shadow-inner group-hover:scale-105 transition-transform">
                      <Sparkles className="h-4 w-4" />
                      Terus Berkembang! 🚀
                    </div>
                    <p className="text-[10px] font-bold text-slate-400">Tingkatkan skor untuk lebih banyak XP</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- QUIZ GRID --- */}
          {filteredQuizzes.length === 0 ? (
            <div className="bg-white rounded-[3rem] border-4 border-slate-100 shadow-sm overflow-hidden">
              <EmptyState
                icon="search"
                title="Tidak Ada Kuis Ditemukan"
                description="Coba gunakan kata kunci lain atau selesaikan kajian baru."
              />
            </div>
          ) : (
            <div className="space-y-6">
              {searchQuery && (
                <SuccessDataFound message={`Ditemukan ${filteredQuizzes.length} kuis`} />
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
              {filteredQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white rounded-3xl border-2 border-slate-200 shadow-[0_6px_0_0_#e2e8f0] hover:border-teal-300 hover:shadow-[0_6px_0_0_#99f6e4] hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group cursor-pointer"
                  onClick={() => handleQuizClick(quiz)}
                >
                  {/* Card Cover — unified for both types */}
                  <div className="h-36 relative overflow-hidden">
                    {quiz.materialThumbnail ? (
                      <img 
                        src={quiz.materialThumbnail} 
                        alt={quiz.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className={`w-full h-full bg-linear-to-br ${quiz.coverColor}`}>
                        <div className="absolute inset-0 opacity-[0.08]" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}} />
                      </div>
                    )}
                    {/* Gradient overlay for readability */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />

                    {/* Floating decoratives */}
                    <div className="absolute top-3 right-3 w-10 h-10 bg-white/15 rounded-full blur-sm" />

                    {/* Top-left badges */}
                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-black text-slate-700 shadow-sm w-max">
                        <BookOpen className="h-3 w-3 text-teal-500" />
                        {quiz.questionCount} Soal
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 backdrop-blur-sm rounded-lg text-[10px] font-black w-max shadow-sm ${
                        quiz.isStandalone 
                          ? "bg-indigo-500/90 text-white" 
                          : "bg-emerald-500/90 text-white"
                      }`}>
                        {quiz.isStandalone ? <Zap className="h-3 w-3" /> : <BookOpen className="h-3 w-3" />}
                        {quiz.isStandalone ? "Mandiri" : "Kajian"}
                      </span>
                    </div>

                    {/* Bottom-right play/medal icon */}
                    {!isStaffRole && (
                      <div className="absolute bottom-3 right-3 z-10">
                        {quiz.status === "completed" ? (
                          <div className="w-11 h-11 bg-emerald-500 rounded-xl flex items-center justify-center border-2 border-white shadow-[0_3px_0_0_#059669] group-hover:rotate-6 transition-transform">
                            <Check className="h-6 w-6 text-white" strokeWidth={4} />
                          </div>
                        ) : (
                          <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center border-2 border-slate-100 shadow-[0_3px_0_0_#e2e8f0] group-hover:scale-110 transition-transform">
                            <Play className="h-5 w-5 text-teal-500 ml-0.5" fill="currentColor" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1 line-clamp-1">
                      {quiz.isStandalone
                        ? quiz.creatorName
                          ? `Oleh ${quiz.creatorName}`
                          : "Quiz Mandiri"
                        : quiz.materialTitle || "Kajian"}
                    </p>
                    <h3 className="text-base font-black text-slate-800 mb-3 line-clamp-2 leading-snug group-hover:text-teal-600 transition-colors">
                      {quiz.title}
                    </h3>
                    {quiz.description && (
                      <p className="text-xs text-slate-400 font-medium line-clamp-2 mb-3">{quiz.description}</p>
                    )}

                    {/* Footer */}
                    <div className="mt-auto pt-3 border-t-2 border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 shrink-0">
                        {quiz.status === "not_started" && (
                          <>
                            <span className="w-2 h-2 rounded-full bg-slate-300" />
                            <span className="text-[11px] font-bold text-slate-400">Belum Mulai</span>
                          </>
                        )}
                        {quiz.status === "completed" && (
                          <>
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="text-[11px] font-bold text-emerald-600">
                              Skor: {quiz.score}/{quiz.totalScore}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {quiz.status === "completed" || isStaffRole ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuizClick(quiz, "review");
                              }}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-slate-100 text-slate-600 hover:bg-slate-200 active:translate-y-0.5 transition-all whitespace-nowrap"
                            >
                              Detail
                            </button>
                            {!isStaffRole && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuizClick(quiz, "retake");
                                }}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-teal-500 text-white hover:bg-teal-600 active:translate-y-0.5 transition-all shadow-sm whitespace-nowrap"
                              >
                                Ulang
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuizClick(quiz);
                            }}
                            className="px-4 py-1.5 rounded-lg text-[11px] font-black bg-teal-500 text-white hover:bg-teal-600 active:translate-y-0.5 transition-all shadow-sm whitespace-nowrap"
                          >
                            Mulai →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default QuizHome;
