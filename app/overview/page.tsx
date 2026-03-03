"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  Bell,
  Award,
  Trophy,
  MessageCircle,
  TrendingUp,
  BarChart3,
  Sparkles,
  Flame,
  Star,
  MessageSquare,
  Newspaper,
  ArrowRight,
  Zap,
  Clock,
  CheckCircle,
  Lightbulb,
  Users,
  Play,
  BookMarked,
  HelpCircle,
  Heart,
} from "lucide-react";
import Sidebar from "@/components/ui/Sidebar";
import DashboardHeader from "@/components/ui/Header";
import ChatbotButton from "@/components/ui/Chatbot";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// --- KOMPONEN LEVEL CARD YANG DIPERBARUI ---
const LevelCardContent = () => (
  <div className="bg-linear-to-r from-emerald-400 to-teal-400 p-5 rounded-[2.5rem] text-white shadow-[0_8px_0_0_#047857] border-2 border-emerald-600 relative overflow-hidden group transition-transform hover:scale-[1.02]">
    {/* Dekorasi background */}
    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10 blur-sm" />
    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8 blur-sm" />
    
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div>
        <span className="font-black text-2xl tracking-tight drop-shadow-md block">LEVEL 5</span>
        <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest bg-emerald-600/30 px-2 py-0.5 rounded-md">Explorer</span>
      </div>

      {/* --- BADGE MASHAALLAH SESUAI GAMBAR --- */}
      <div className="bg-amber-500 text-white px-5 py-1.5 rounded-full text-sm font-black shadow-[0_4px_0_0_#d97706] border-2 border-white transform rotate-3 flex items-center justify-center">
        Mashaallah
      </div>
    </div>

    {/* Progress Bar Kartun */}
    <div className="relative mt-2">
      <div className="flex justify-between text-[10px] font-bold mb-1 px-1 opacity-90">
        <span>2450 XP</span>
        <span>3000 XP</span>
      </div>
      <div className="h-5 bg-black/20 rounded-full overflow-hidden border-2 border-emerald-600/30 p-[2px]">
        <div className="h-full bg-emerald-400 w-3/4 rounded-full shadow-[0_2px_0_0_#059669] relative">
            {/* Kilau pada progress bar */}
            <div className="absolute top-0 right-2 w-2 h-full bg-white/40 rounded-full skew-x-[-20deg]" />
            <div className="absolute top-0 right-5 w-1 h-full bg-white/30 rounded-full skew-x-[-20deg]" />
        </div>
      </div>
    </div>
    
    <p className="text-[11px] mt-3 font-bold text-emerald-50 text-center bg-emerald-700/20 py-1.5 rounded-xl border border-emerald-300/20">
       Semangat! 550 XP lagi naik level
    </p>
  </div>
);

const Dashboard = () => {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      if (typeof window !== "undefined") {
        window.location.href = "/auth";
      }
    }
  });
  const router = useRouter();
  const [favoriteInstructors, setFavoriteInstructors] = useState<any[]>([]);
  const [loadingInstructors, setLoadingInstructors] = useState(true);
  const [finishedMaterials, setFinishedMaterials] = useState<any[]>([]);
  const [loadingFinished, setLoadingFinished] = useState(true);

  // Redirect non-user roles away from overview
  React.useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role === "instruktur") {
        router.replace("/academy");
      } else if (session?.user?.role === "admin") {
        router.replace("/admin");
      }
    }
  }, [status, session, router]);

  // Load data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Load instructors, favorites, materials, and attendance
        const [instructorsRes, favoritesRes, materialsRes, attendanceRes] = await Promise.all([
          fetch("/api/instructors"),
          fetch("/api/instructors/favorites"),
          fetch("/api/materials"),
          fetch("/api/materials/attendance"),
        ]);

        if (instructorsRes.ok) {
          const data = await instructorsRes.json();
          let favoriteIds: string[] = [];
          if (favoritesRes.ok) {
            const favData = await favoritesRes.json();
            favoriteIds = Array.isArray(favData.favoriteIds)
              ? favData.favoriteIds.map((id: any) => String(id))
              : [];
          }
          const favorites = data.filter((instructor: any) =>
            favoriteIds.includes(String(instructor.id))
          );
          setFavoriteInstructors(favorites);
        }

        if (materialsRes.ok) {
          const mData = await materialsRes.json();
          setMaterials(mData.slice(0, 5));
        }

        if (attendanceRes.ok) {
          const aData = await attendanceRes.json();
          // Filter: only materials that have passed their date (status complete)
          // and have an attendance record (can see recap)
          const now = new Date();
          const finished = Array.isArray(aData) 
            ? aData
                .sort((a: any, b: any) => 
                  new Date(b.attendedAt).getTime() - new Date(a.attendedAt).getTime()
                )
            : [];
          setFinishedMaterials(finished.slice(0, 5));
        }

      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoadingInstructors(false);
        setLoadingMaterials(false);
        setLoadingFinished(false);
      }
    };

    if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status]);

    
  // Random button colors for quizzes
  const quizButtonColors = [
    { bg: "bg-emerald-400", border: "border-emerald-600", shadow: "shadow-[0_4px_0_0_#10b981]", hover: "hover:bg-emerald-500" },
    { bg: "bg-teal-400", border: "border-teal-600", shadow: "shadow-[0_4px_0_0_#14b8a6]", hover: "hover:bg-teal-500" },
    { bg: "bg-cyan-400", border: "border-cyan-600", shadow: "shadow-[0_4px_0_0_#0891b2]", hover: "hover:bg-cyan-500" },
    { bg: "bg-blue-400", border: "border-blue-600", shadow: "shadow-[0_4px_0_0_#2563eb]", hover: "hover:bg-blue-500" },
    { bg: "bg-indigo-400", border: "border-indigo-600", shadow: "shadow-[0_4px_0_0_#4f46e5]", hover: "hover:bg-indigo-500" },
    { bg: "bg-purple-400", border: "border-purple-600", shadow: "shadow-[0_4px_0_0_#7c3aed]", hover: "hover:bg-purple-500" },
    { bg: "bg-pink-400", border: "border-pink-600", shadow: "shadow-[0_4px_0_0_#db2777]", hover: "hover:bg-pink-500" },
    { bg: "bg-rose-400", border: "border-rose-600", shadow: "shadow-[0_4px_0_0_#e11d48]", hover: "hover:bg-rose-500" },
  ];

  const getRandomButtonColor = (index: number) => {
    return quizButtonColors[index % quizButtonColors.length];
  };
    
  const stats = {
    totalPoints: 2450,
    totalBadges: 8,
    totalQuizzes: 24,
    averageScore: 87,
    streak: 7,
  };

  const quickActions = [
    { title: "Pengumuman", icon: Bell, link: "/announcements" },
    { title: "Jadwal", icon: Calendar, link: "/materials" },
    { title: "Materi", icon: BookOpen, link: "/archivesch" },
    { title: "Kuis", icon: Trophy, link: "/quiz" },
    { title: "Diskusi", icon: MessageCircle, link: "/chat-rooms" },
    { title: "Peringkat", icon: TrendingUp, link: "/leaderboard" },
  ];

  const newsItems = [
    {
      id: 1,
      title: "Kegiatan Ramadhan 1446H Dimulai!",
      category: "Event",
      date: "12 Maret 2025",
      imageId: "10"
    },
    {
      id: 2,
      title: "Selamat Kepada Juara Lomba Adzan",
      category: "Prestasi",
      date: "10 Maret 2025",
      imageId: "15"
    }
  ];

  const [materials, setMaterials] = useState<any[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);

  const upcomingQuizzes = [
    { id: 1, title: "Kuis Tauhid Bab 1", dueDate: "5 Feb 2026", difficulty: "Mudah", questions: 10 },
    { id: 2, title: "Kuis Fiqih Ibadah", dueDate: "7 Feb 2026", difficulty: "Sedang", questions: 15 },
    { id: 3, title: "Kuis Tajweed Praktik", dueDate: "10 Feb 2026", difficulty: "Sulit", questions: 20 },
  ];

  const programs = [
    { id: 1, title: "Program Basic Islam", progress: 60, members: 156, icon: BookOpen },
    { id: 2, title: "Program Penghafal Quran", progress: 35, members: 89, icon: Trophy },
    { id: 3, title: "Program Pemimpin Muda", progress: 50, members: 204, icon: Users },
  ];

  if (status === "loading") return null;
  if (session?.user?.role !== "user") return null;

  return (
    // Background hangat (Warm White)
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div className="w-full md:w-auto">
              <h1 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight">
                ٱلسَّلَامُ عَلَيْكُمْ, <span className="text-emerald-500 underline decoration-wavy decoration-2 underline-offset-4">{session?.user?.name}</span>
              </h1>
              <p className="text-slate-500 mt-2 font-bold text-lg">Siap menambah ilmu hari ini?</p>
              
              {/* --- [MOBILE] CARD LEVEL --- */}
              <div className="mt-6 xl:hidden block w-full">
                <LevelCardContent />
              </div>
            </div>

            {/* Date Badge - Cartoon Style */}
            <div className="hidden md:flex items-center gap-2 bg-white px-5 py-3 rounded-full border-2 border-slate-200 shadow-[0_4px_0_0_#e2e8f0] transform hover:-translate-y-1 transition-transform">
              <Calendar className="w-5 h-5 text-emerald-600" strokeWidth={3} />
              <span className="text-sm font-black text-slate-700">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* MAIN GRID LAYOUT */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
            {/* LEFT COLUMN */}
            <div className="xl:col-span-8 space-y-8">
              
              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {/* Stat 1 */}
                {/* Stat 1 - Badges (Amber) */}
                <div className="bg-white p-5 md:p-6 rounded-[2.5rem] border-2 border-amber-100 shadow-[0_6px_0_0_#fef3c7] sm:shadow-[0_8px_0_0_#fef3c7] hover:shadow-[0_4px_0_0_#fef3c7] hover:translate-y-1 hover:border-amber-200 transition-all duration-300 group max-md:aspect-square flex flex-col justify-between">
                  <div className="flex justify-between items-start md:mb-4">
                    <div className="p-2.5 md:p-3 bg-amber-50 border-2 border-amber-100 rounded-2xl group-hover:scale-110 transition-transform">
                      <Award className="w-6 h-6 md:w-7 md:h-7 text-amber-500" strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1 md:px-3 bg-amber-100 text-amber-600 rounded-full border border-amber-200">Total</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-2xl md:text-3xl font-black text-slate-800 leading-none">{stats.totalBadges}</div>
                    <div className="text-[10px] text-slate-400 font-black tracking-wide uppercase">Badges Koleksi</div>
                  </div>
                </div>

                {/* Stat 2 */}
                {/* Stat 2 - Kuis (Emerald) */}
                <div className="bg-white p-5 md:p-6 rounded-[2.5rem] border-2 border-emerald-100 shadow-[0_6px_0_0_#d1fae5] sm:shadow-[0_8px_0_0_#d1fae5] hover:shadow-[0_4px_0_0_#d1fae5] hover:translate-y-1 hover:border-emerald-200 transition-all duration-300 group max-md:aspect-square flex flex-col justify-between">
                  <div className="flex justify-between items-start md:mb-4">
                    <div className="p-2.5 md:p-3 bg-emerald-50 border-2 border-emerald-100 rounded-2xl group-hover:scale-110 transition-transform">
                      <BarChart3 className="w-6 h-6 md:w-7 md:h-7 text-emerald-500" strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1 md:px-3 bg-emerald-100 text-emerald-600 rounded-full border border-emerald-200">{stats.averageScore}%</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-2xl md:text-3xl font-black text-slate-800 leading-none">{stats.totalQuizzes}</div>
                    <div className="text-[10px] text-slate-400 font-black tracking-wide uppercase">Kuis Selesai</div>
                  </div>
                </div>

                {/* Stat 3 */}
                {/* Stat 3 - Streak (Rose) */}
                <div className="bg-white p-5 md:p-6 rounded-[2.5rem] border-2 border-rose-100 shadow-[0_6px_0_0_#ffe4e6] sm:shadow-[0_8px_0_0_#ffe4e6] hover:shadow-[0_4px_0_0_#ffe4e6] hover:translate-y-1 hover:border-rose-200 transition-all duration-300 group max-md:aspect-square flex flex-col justify-between">
                  <div className="flex justify-between items-start md:mb-4">
                    <div className="p-2.5 md:p-3 bg-rose-50 border-2 border-rose-100 rounded-2xl group-hover:scale-110 transition-transform">
                      <Flame className="w-6 h-6 md:w-7 md:h-7 text-rose-500" strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1 md:px-3 bg-rose-100 text-rose-600 rounded-full border border-rose-200">Mantap!</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-2xl md:text-3xl font-black text-slate-800 leading-none">{stats.streak} Hari</div>
                    <div className="text-[10px] text-slate-400 font-black tracking-wide uppercase">Konsistensi</div>
                  </div>
                </div>
              </div>

              {/* News Section */}
              <section>
                <div className="flex items-center gap-3 mb-5 px-2">
                  <div className="p-2 bg-white border-2 border-slate-200 rounded-xl shadow-[0_3px_0_0_#e2e8f0]">
                    <Newspaper className="w-5 h-5 text-slate-800" />
                  </div>
                  <h2 className="text-xl font-black text-slate-800">Kabar IRMA Terkini</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {newsItems.map((news) => (
                    <div key={news.id} className="flex gap-4 p-4 bg-white rounded-4xl border-2 border-slate-100 hover:border-emerald-400 hover:shadow-[0_6px_0_0_#10b981] hover:-translate-y-1 transition-all cursor-pointer group">
                      <div className="w-24 h-24 rounded-2xl bg-slate-200 overflow-hidden shrink-0 border-2 border-slate-100 group-hover:border-emerald-200">
                        <img src={`https://picsum.photos/200/200?random=${news.imageId}`} alt={news.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="inline-block w-fit px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-black border border-emerald-600 shadow-sm mb-2 uppercase tracking-wide">
                          {news.category}
                        </span>
                        <h3 className="font-bold text-slate-800 leading-snug mb-2 text-base group-hover:text-emerald-600 transition-colors line-clamp-2">
                          {news.title}
                        </h3>
                        <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> {news.date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Materi Terbaru Section */}
              <section>
                <div className="flex items-center justify-between mb-5 px-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white border-2 border-slate-200 rounded-xl shadow-[0_3px_0_0_#e2e8f0]">
                      <BookMarked className="w-5 h-5 text-slate-800" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800">Rekapan Materi Kajian Terbaru</h2>
                  </div>
                  <Link href="/materials" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                    Lihat Semua <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                
                <div className="space-y-3">
                  {loadingMaterials ? (
                    <p className="text-center text-xs text-slate-400 font-bold py-10">Memuat kajian...</p>
                  ) : materials.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 font-bold py-10">Belum ada kajian terbaru</p>
                  ) : (
                    materials.map((material) => (
                      <div key={material.id} onClick={() => router.push(`/materials`)} className="bg-white p-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-400 hover:shadow-[0_4px_0_0_#10b981] transition-all group cursor-pointer">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-black text-slate-800 group-hover:text-emerald-600 transition-colors">{material.title}</h3>
                            <p className="text-xs text-slate-500 font-bold mt-1">{material.instructor}</p>
                          </div>
                          {!material.isJoined && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-600 text-[10px] font-black rounded-lg border border-amber-200">Undangan</span>
                          )}
                          <button className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl group-hover:bg-emerald-100 transition-colors">
                            <Play className="h-4 w-4 text-emerald-600 fill-emerald-600" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-full bg-slate-100 rounded-full h-2 mr-3">
                            <div 
                              className="bg-linear-to-r from-emerald-400 to-teal-400 h-2 rounded-full transition-all" 
                              style={{ width: material.isJoined ? '100%' : '0%' }}
                            />
                          </div>
                          <span className="text-xs font-black text-slate-600 whitespace-nowrap">{material.isJoined ? '100%' : '0%'}</span>
                        </div>
                        <p className="text-xs text-slate-400 font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(material.date).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Upcoming Quizzes Section */}
              <section>
                <div className="flex items-center justify-between mb-5 px-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white border-2 border-slate-200 rounded-xl shadow-[0_3px_0_0_#e2e8f0]">
                      <HelpCircle className="w-5 h-5 text-slate-800" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800">Kuis Yang Belum Dikerjakan</h2>
                  </div>
                  <Link href="/quiz" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                    Lihat Semua <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingQuizzes.map((quiz, index) => {
                    const buttonColor = getRandomButtonColor(index);
                    return (
                    <div key={quiz.id} className="bg-white p-5 rounded-4xl border-2 border-slate-100 hover:border-slate-300 shadow-[0_4px_0_0_#f1f5f9] hover:shadow-[0_6px_0_0_#cbd5e1] hover:-translate-y-1 transition-all group">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-slate-800 text-sm">{quiz.title}</h3>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> Deadline: {quiz.dueDate}
                        </p>
                        <p className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5" /> {quiz.questions} soal
                        </p>
                      </div>
                      
                      <button className={`w-full mt-4 py-3 text-white text-xs font-black rounded-2xl h-12 flex items-center justify-center transition-all border-b-4 active:border-b-0 active:translate-y-1 ${buttonColor.bg} ${buttonColor.border} ${buttonColor.shadow} ${buttonColor.hover} hover:shadow-lg`}>
                        Mulai Kuis
                      </button>
                    </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN */}
            <div className="xl:col-span-4 space-y-6">
              
              {/* --- [DESKTOP] CARD LEVEL --- */}
              <div className="hidden xl:block transform hover:scale-[1.02] transition-transform duration-300">
                <LevelCardContent />
              </div>

              {/* Feature Cards Stack */}
              <div className="space-y-4">
                
                {/* Daily Challenge Card */}
                <div className="bg-white p-5 rounded-[2rem] border-2 border-slate-100 shadow-sm flex items-center gap-4 hover:border-amber-300 hover:shadow-[0_4px_0_0_#fcd34d] transition-all group">
                  <div className="w-14 h-14 rounded-full bg-amber-50 border-2 border-amber-100 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
                    <Zap className="w-7 h-7 text-amber-500 fill-amber-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-slate-800 text-lg">Misi Harian</h4>
                    <p className="text-xs text-slate-500 font-bold">Selesaikan 2 Kuis</p>
                  </div>
                  <button className="px-6 py-2.5 bg-emerald-400 text-white text-xs font-black rounded-2xl h-11 border-b-4 border-emerald-600 hover:bg-emerald-500 hover:shadow-[0_4px_0_0_#10b981] active:border-b-0 active:translate-y-1 transition-all shadow-[0_4px_0_0_#059669]">
                    Mulai
                  </button>
                </div>

                {/* Ci Irma Chatbot Promo */}
                <div className="bg-emerald-50 p-5 rounded-[2rem] border-2 border-emerald-200 relative overflow-hidden group">
                  {/* Decorative blobs */}
                  <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-cyan-200 rounded-full opacity-20 group-hover:scale-125 transition-transform" />
                  
                  <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
                      <img src="/ciirma.webp" alt="AI" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-base">Ci Irma AI</h4>
                      <span className="text-xs text-emerald-600 flex items-center gap-1.5 font-bold bg-white px-2 py-0.5 rounded-full border border-emerald-100 w-fit">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-4 font-bold relative z-10 leading-relaxed">
                    "Ada PR yang susah? Atau mau curhat? Irma siap bantu kamu!"
                  </p>
                  <button className="w-full py-3 bg-white text-slate-800 font-black text-sm rounded-2xl shadow-[0_4px_0_0_#cbd5e1] border-2 border-slate-200 hover:shadow-[0_2px_0_0_#cbd5e1] hover:translate-y-[2px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 relative z-10">
                    <MessageSquare className="w-5 h-5 text-cyan-500" strokeWidth={3} /> Chat Sekarang
                  </button>
                </div>

                {/* Instruktur Favoritmu */}
                <div className="bg-white p-5 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                  <h4 className="font-black mb-4 text-sm tracking-wide uppercase text-center bg-rose-50 rounded-lg py-1 border border-rose-100 text-rose-600 flex items-center justify-center gap-2">
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500" /> Instruktur Favoritmu
                  </h4>
                  
                  {loadingInstructors ? (
                    <div className="text-center py-6">
                      <p className="text-xs text-slate-400 font-bold">Memuat...</p>
                    </div>
                  ) : favoriteInstructors.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-xs text-slate-500 font-bold mb-4">Belum ada instruktur favorit</p>
                      <Link href="/instructors" className="w-full py-2 bg-rose-400 text-white text-xs font-black rounded-xl hover:bg-rose-500 transition-all inline-block">
                        Tambah Favorit
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {favoriteInstructors.slice(0, 3).map((instructor) => (
                        <div key={instructor.id} className="flex items-center gap-3 p-3 rounded-2xl bg-rose-50 border border-rose-100 hover:border-rose-300 hover:bg-rose-100 transition-all group cursor-pointer">
                          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 border-rose-200">
                            <img 
                              src={instructor.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${instructor.name}`}
                              alt={instructor.name} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-900 truncate">{instructor.name}</p>
                            <p className="text-xs text-rose-600 font-bold truncate">{instructor.bidangKeahlian || instructor.specialization || 'Umum'}</p>
                          </div>
                        </div>
                      ))}
                      {favoriteInstructors.length > 3 && (
                        <Link href="/instructors" className="w-full py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition-all text-center block">
                          Lihat Semua ({favoriteInstructors.length})
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                {/* Kajian Selesai Section */}
                <div className="bg-white p-5 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                  <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    Kajian Selesai Baru-baru Ini
                  </h4>
                  
                  <div className="space-y-4">
                    {loadingFinished ? (
                      <div className="flex flex-col items-center justify-center py-6 gap-2">
                        <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Memuat data...</p>
                      </div>
                    ) : finishedMaterials.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border-2 border-slate-100">
                          <BookOpen className="w-6 h-6 text-slate-200" />
                        </div>
                        <p className="text-xs text-slate-400 font-bold">Belum ada kajian yang diselesaikan</p>
                      </div>
                    ) : (
                      finishedMaterials.map((item) => (
                        <div 
                          key={item.id} 
                          className="group relative p-4 rounded-2xl border-2 border-slate-50 hover:border-emerald-100 bg-slate-50/30 hover:bg-white transition-all cursor-pointer"
                          onClick={() => router.push(`/materials/${item.materialId}`)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-black text-sm text-slate-800 group-hover:text-emerald-600 transition-colors line-clamp-1 truncate pr-4">
                              {item.materialTitle || item.material?.title || "Kajian"}
                            </h5>
                            <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 whitespace-nowrap">
                              <CheckCircle className="w-3 h-3 fill-emerald-500 text-white" /> SELESAI
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] text-slate-400 font-bold tracking-tight">
                              {item.instructorName || item.material?.instructor || "Instruktur"}
                            </p>
                            <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest pl-2">
                              {new Date(item.createdAt || item.attendedAt).toLocaleDateString("id-ID", {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>
      <ChatbotButton />
    </div>
  );
};

export default Dashboard;