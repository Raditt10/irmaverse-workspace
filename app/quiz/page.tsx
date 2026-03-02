"use client";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import SearchInput from "@/components/ui/SearchInput";
import Loading from "@/components/ui/Loading";
import { 
  Trophy, 
  Play, 
  Search, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Sparkles, 
  Infinity,
  Medal,
  Target,
  Plus,
  Trash2,
  XCircle
} from "lucide-react";

// --- MOCK DATA (Nanti diganti dengan fetch dari API) ---
interface Quiz {
  id: string;
  title: string;
  materialTitle: string;
  questionCount: number;
  status: "not_started" | "in_progress" | "completed";
  score?: number;
  coverColor: string; // Untuk variasi warna card ala Quizizz
}

const MOCK_QUIZZES: Quiz[] = [
  {
    id: "q1",
    title: "Pemahaman Dasar Fiqih",
    materialTitle: "Kajian Fiqih Bab Thaharah",
    questionCount: 15,
    status: "not_started",
    coverColor: "from-teal-400 to-emerald-400",
  },
  {
    id: "q2",
    title: "Kisah Nabi & Sahabat",
    materialTitle: "Sirah Nabawiyah: Perang Badar",
    questionCount: 20,
    status: "in_progress",
    coverColor: "from-blue-400 to-indigo-400",
  },
  {
    id: "q3",
    title: "Adab Menuntut Ilmu",
    materialTitle: "Kajian Rutin: Kitab Ta'lim Muta'allim",
    questionCount: 10,
    status: "completed",
    score: 90,
    coverColor: "from-purple-400 to-fuchsia-400",
  },
  {
    id: "q4",
    title: "Tajwid Dasar",
    materialTitle: "Tahsin Al-Quran Pertemuan 1",
    questionCount: 10,
    status: "not_started",
    coverColor: "from-orange-400 to-rose-400",
  }
];

const QuizHome = () => {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/auth");
    },
  });

  const isInstructor = session?.user?.role === "instruktur" || session?.user?.role === "admin";

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "not_started" | "completed">("all");

  // Filter & Search Logic
  const filteredQuizzes = useMemo(() => {
    return MOCK_QUIZZES.filter((quiz) => {
      const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            quiz.materialTitle.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = activeFilter === "all" ? true :
                            activeFilter === "completed" ? quiz.status === "completed" :
                            quiz.status !== "completed"; // not_started or in_progress

      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilter]);

  // Menghitung total poin dari kuis yang sudah selesai
  const totalPoints = useMemo(() => {
    return MOCK_QUIZZES.reduce((acc, quiz) => acc + (quiz.score || 0), 0);
  }, []);

  if (status === "loading") {
    return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loading text="Memuat Area Quiz..." /></div>;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      <DashboardHeader />
      
      <div className="flex flex-1">
        <div className="hidden lg:block h-[calc(100vh-64px)] sticky top-16">
          <Sidebar />
        </div>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          
          {/* --- HERO BANNER ALA QUIZIZZ --- */}
          {!isInstructor && (
            <div className="bg-gradient-to-r from-teal-500 to-emerald-400 rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-10 border-4 border-teal-700 shadow-[0_8px_0_0_#0f766e] text-white relative overflow-hidden mb-10 group">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute bottom-0 left-20 w-32 h-32 bg-teal-300 opacity-20 rounded-full blur-2xl" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-xs font-black uppercase tracking-wider mb-4">
                    <Sparkles className="h-4 w-4 text-yellow-300" />
                    Quiz Arena
                  </div>
                  <h1 className="text-3xl lg:text-5xl font-black tracking-tight mb-3 leading-tight">
                    Uji Pemahamanmu!
                  </h1>
                  <p className="text-teal-50 font-medium text-sm lg:text-base max-w-xl">
                    Kerjakan kuis dari kajian yang telah kamu selesaikan. <br className="hidden md:block"/>
                    <span className="font-bold underline decoration-2 underline-offset-4 decoration-yellow-300">Tanpa batas waktu</span>, dapatkan skor terbaikmu!
                  </p>
                </div>
                
                <div className="hidden md:flex shrink-0 w-32 h-32 lg:w-40 lg:h-40 bg-white/10 rounded-full border-4 border-white/20 backdrop-blur-md items-center justify-center shadow-inner transform rotate-12 group-hover:rotate-0 transition-all duration-500">
                  <Trophy className="h-16 w-16 lg:h-20 lg:w-20 text-yellow-300 drop-shadow-md" />
                </div>
              </div>
            </div>
          )}

          {isInstructor && (
            <div className="mb-8 lg:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight mb-2 flex items-center gap-3">
                  Kelola Kuis Kajian
                </h1>
                <p className="text-slate-500 font-medium text-sm lg:text-lg">
                  Atur dan kelola kuis untuk mengukur pemahaman santri pada materi kajian.
                </p>
              </div>
              <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-400 text-white font-bold border-2 border-teal-600 border-b-4 hover:bg-teal-500 hover:border-b-4 active:border-b-2 active:translate-y-0.5 transition-all w-full md:w-auto">
                <Plus className="h-5 w-5" />
                Tambah Kuis
              </button>
            </div>
          )}

          {/* --- SEARCH & FILTERS --- */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
            <div className="w-full md:w-96">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Cari kuis atau materi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-teal-400 focus:shadow-[0_0_0_4px_rgba(45,212,191,0.2)] transition-all font-medium text-slate-700 outline-none"
                />
              </div>
            </div>

            <div className="flex bg-slate-200/60 p-1.5 rounded-2xl w-full md:w-auto">
              <button
                onClick={() => setActiveFilter("all")}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                  activeFilter === "all" ? "bg-white text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setActiveFilter("not_started")}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                  activeFilter === "not_started" ? "bg-white text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Belum Selesai
              </button>
              <button
                onClick={() => setActiveFilter("completed")}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                  activeFilter === "completed" ? "bg-white text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Selesai
              </button>
            </div>
          </div>

          {/* --- BANNER TOTAL POIN --- */}
          {!isInstructor && (
            <div className="mb-8 flex flex-col sm:flex-row items-center justify-between bg-white border-2 border-slate-200 rounded-[1.5rem] p-4 lg:p-5 shadow-[0_4px_0_0_#cbd5e1] hover:border-yellow-400 hover:shadow-[0_4px_0_0_#facc15] transition-all duration-300 group cursor-default">
              
              {/* Bagian Kiri: Ikon & Angka Poin */}
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="w-14 h-14 bg-yellow-50 rounded-full border-2 border-yellow-200 flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300 shrink-0 shadow-sm">
                  <Trophy className="h-7 w-7 text-yellow-500 drop-shadow-sm" fill="currentColor" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Poin Kuis-mu</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl lg:text-3xl font-black text-slate-800 group-hover:text-yellow-500 transition-colors duration-300">
                      {totalPoints}
                    </span>
                    <span className="text-sm font-bold text-yellow-500">XP</span>
                  </div>
                </div>
              </div>
              
              {/* Bagian Kanan: Motivasi (Responsif) */}
              <div className="w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t-2 border-slate-100 sm:border-none flex items-center sm:justify-end">
                <div className="px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 inline-flex items-center gap-2 w-full sm:w-auto justify-center group-hover:bg-teal-50 group-hover:text-teal-600 group-hover:border-teal-200 transition-colors duration-300">
                  <Sparkles className="h-4 w-4 text-teal-500" />
                  <span>Terus tingkatkan skormu! 🚀</span>
                </div>
              </div>
              
            </div>
          )}
          {/* ------------------------------------------- */}

          {/* --- QUIZ GRID --- */}
          {filteredQuizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[3rem] border-4 border-slate-100 border-dashed">
              <Target className="h-20 w-20 text-slate-300 mb-4" />
              <h3 className="text-xl font-black text-slate-700 mb-2">Tidak Ada Kuis Ditemukan</h3>
              <p className="text-slate-500 font-medium">Coba gunakan kata kunci lain atau selesaikan kajian baru.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
              {filteredQuizzes.map((quiz) => (
                <div 
                  key={quiz.id} 
                  className="bg-white rounded-[2rem] border-2 border-slate-200 shadow-[0_6px_0_0_#cbd5e1] hover:border-teal-400 hover:shadow-[0_6px_0_0_#2dd4bf] hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group cursor-pointer"
                  onClick={() => router.push(`/quiz/${quiz.id}`)}
                >
                  {/* Card Header Illustration */}
                  <div className={`h-32 bg-gradient-to-br ${quiz.coverColor} relative p-5 flex items-end justify-between overflow-hidden`}>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay" />
                    
                    {/* Floating elements background */}
                    <div className="absolute top-4 right-4 w-12 h-12 bg-white/20 rounded-full blur-md" />
                    <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-black/10 rounded-full blur-xl" />

                    <div className="relative z-10 flex flex-col gap-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-black text-slate-700 shadow-sm w-max">
                        <BookOpen className="h-3 w-3 text-teal-500" />
                        {quiz.questionCount} Soal
                      </div>
                    </div>

                    <div className="relative z-10">
                      {quiz.status === "completed" ? (
                        <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center border-4 border-white shadow-md transform group-hover:rotate-12 transition-transform">
                          <Medal className="h-6 w-6 text-white" fill="currentColor" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-4 border-transparent shadow-md transform group-hover:scale-110 transition-transform">
                          <Play className="h-5 w-5 text-teal-500 ml-1" fill="currentColor" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-xs font-bold text-slate-400 mb-1 line-clamp-1">{quiz.materialTitle}</p>
                    <h3 className="text-lg font-black text-slate-800 mb-4 line-clamp-2 leading-tight group-hover:text-teal-600 transition-colors">
                      {quiz.title}
                    </h3>

                    <div className="mt-auto pt-4 border-t-2 border-slate-100 flex items-center justify-between">
                      {/* Status Indicator */}
                      <div className="flex items-center gap-2">
                        {quiz.status === "not_started" && (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                            <span className="text-xs font-bold text-slate-500">Belum Mulai</span>
                          </>
                        )}
                        {quiz.status === "in_progress" && (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                            <span className="text-xs font-bold text-slate-500">Belum Mulai</span>
                          </>
                        )}
                        {quiz.status === "completed" && (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                            <span className="text-xs font-bold text-emerald-600">Selesai • Skor: {quiz.score}</span>
                          </>
                        )}
                      </div>

                      {/* Action Button */}
                      {isInstructor ? (
                        <div className="flex z-10 items-center justify-end w-full gap-2 mt-2">
                           <button onClick={(e) => { e.stopPropagation(); }} className="px-3 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl border-2 border-slate-200 hover:bg-slate-200 transition-colors">
                              Edit Kuis
                           </button>
                           {quiz.status !== "completed" && (
                            <button onClick={(e) => { e.stopPropagation(); }} className="p-2 text-rose-500 bg-rose-50 border-2 border-rose-200 rounded-xl hover:bg-rose-100 transition-colors" title="Tutup Kuis">
                                <XCircle className="h-4 w-4" />
                            </button>
                           )}
                           <button onClick={(e) => { e.stopPropagation(); }} className="p-2 text-slate-400 bg-white border-2 border-slate-200 rounded-xl hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors" title="Hapus Kuis">
                               <Trash2 className="h-4 w-4" />
                           </button>
                        </div>
                      ) : (
                        <button className={`
                          px-4 py-2 rounded-xl text-xs font-black transition-all border-b-4 active:border-b-0 active:translate-y-1
                          ${quiz.status === "completed" 
                            ? "bg-slate-100 text-slate-600 border-slate-300 group-hover:bg-slate-200" 
                            : "bg-teal-400 text-white border-teal-600 group-hover:bg-teal-500 shadow-[0_2px_0_0_#0f766e] group-hover:shadow-none"}
                        `}>
                          {quiz.status === "completed" ? "Lihat Hasil" : quiz.status === "in_progress" ? "Lanjut" : "Mulai"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default QuizHome;