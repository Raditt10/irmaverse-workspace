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
  BookMarked,
  HelpCircle,
  Heart,
  Eye,
  User,
  AlertCircle,
  MapPin,
} from "lucide-react";
import Sidebar from "@/components/ui/Sidebar";
import DashboardHeader from "@/components/ui/Header";
import ChatbotButton from "@/components/ui/Chatbot";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Loading from "@/components/ui/Loading";

// --- KOMPONEN LEVEL CARD YANG DIPERBARUI ---
const LevelCardContent = ({
  level,
  levelTitle,
  points,
  currentLevelXp,
  nextLevelXp,
  progressPercent,
}: {
  level: number;
  levelTitle: string;
  points: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
}) => {
  const xpNeeded = nextLevelXp - points;
  return (
    <div className="bg-linear-to-r from-emerald-400 to-teal-400 p-5 rounded-[2.5rem] text-white shadow-[0_8px_0_0_#047857] border-2 border-emerald-600 relative overflow-hidden group transition-transform hover:scale-[1.02]">
      {/* Dekorasi background */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10 blur-sm" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8 blur-sm" />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <span className="font-black text-2xl tracking-tight drop-shadow-md block">
            LEVEL {level}
          </span>
          <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest bg-emerald-600/30 px-2 py-0.5 rounded-md">
            {levelTitle}
          </span>
        </div>

        {/* Badge title */}
        <div className="bg-red-500 text-white px-5 py-1.5 rounded-full text-sm font-black shadow-[0_4px_0_0_#b91c1c] border-2 border-white transform rotate-3 flex items-center justify-center">
          {levelTitle}
        </div>
      </div>

      {/* Progress Bar Kartun */}
      <div className="relative mt-2">
        <div className="flex justify-between text-[10px] font-bold mb-1 px-1 opacity-90">
          <span>{points.toLocaleString()} XP</span>
          <span>{nextLevelXp.toLocaleString()} XP</span>
        </div>
        <div className="h-5 bg-black/20 rounded-full overflow-hidden border-2 border-emerald-600/30 p-[2px]">
          <div
            className="h-full bg-yellow-400 rounded-full shadow-[0_2px_0_0_#ca8a04] relative transition-all duration-700"
            style={{ width: `${Math.max(5, progressPercent)}%` }}
          >
            {/* Kilau pada progress bar */}
            <div className="absolute top-0 right-2 w-2 h-full bg-white/40 rounded-full skew-x-[-20deg]" />
            <div className="absolute top-0 right-5 w-1 h-full bg-white/30 rounded-full skew-x-[-20deg]" />
          </div>
        </div>
      </div>

      <p className="text-[11px] mt-3 font-bold text-emerald-50 text-center bg-emerald-700/20 py-1.5 rounded-xl border border-emerald-300/20">
        {xpNeeded > 0
          ? `Semangat! ${xpNeeded.toLocaleString()} XP lagi naik level`
          : "🎉 Siap naik level!"}
      </p>
    </div>
  );
};

const Dashboard = () => {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      if (typeof window !== "undefined") {
        window.location.href = "/auth";
      }
    },
  });
  const router = useRouter();
  const [favoriteInstructors, setFavoriteInstructors] = useState<any[]>([]);
  const [loadingInstructors, setLoadingInstructors] = useState(true);
  const [finishedMaterials, setFinishedMaterials] = useState<any[]>([]);
  const [loadingFinished, setLoadingFinished] = useState(true);
  const [latestNews, setLatestNews] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [todayMaterials, setTodayMaterials] = useState<any[]>([]);
  const [loadingToday, setLoadingToday] = useState(true);
  const [dynamicStats, setDynamicStats] = useState({
    totalAttended: 0,
    quizCompleted: 0,
    quizPending: 0,
    avgScore: 0,
  });
  const [levelData, setLevelData] = useState({
    level: 1,
    levelTitle: "Pemula",
    points: 0,
    currentLevelXp: 0,
    nextLevelXp: 100,
    progressPercent: 0,
  });

  // Redirect non-user roles away from overview
  React.useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role === "instruktur") {
        router.replace("/academy");
      } else if (session?.user?.role === "admin" || session?.user?.role === "super_admin") {
        router.replace("/admin");
      }
    }
  }, [status, session, router]);

  // Load data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Load instructors, favorites, materials, and attendance
        const [
          instructorsRes,
          favoritesRes,
          materialsRes,
          attendanceRes,
          newsRes,
          quizRes,
          gamRes,
        ] = await Promise.all([
          fetch("/api/instructors"),
          fetch("/api/instructors/favorites"),
          fetch("/api/materials"),
          fetch("/api/materials/attendance"),
          fetch("/api/news"),
          fetch("/api/quiz"),
          fetch("/api/users/gamification"),
        ]);

        // Gamification data for level card
        if (gamRes.ok) {
          const gamData = await gamRes.json();
          setLevelData({
            level: gamData.stats?.level || 1,
            levelTitle: gamData.xpProgress?.levelTitle || "Pemula",
            points: gamData.stats?.points || 0,
            currentLevelXp: gamData.xpProgress?.currentLevelXp || 0,
            nextLevelXp: gamData.xpProgress?.nextLevelXp || 100,
            progressPercent: gamData.xpProgress?.progressPercent || 0,
          });
        }

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
            favoriteIds.includes(String(instructor.id)),
          );
          setFavoriteInstructors(favorites);
        }

        let allMaterialsData: any[] = [];
        if (materialsRes.ok) {
          allMaterialsData = await materialsRes.json();
          setMaterials(allMaterialsData.slice(0, 5));

          // Find today's kajian (materials scheduled for today that user has joined)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayEnd = new Date(today);
          todayEnd.setHours(23, 59, 59, 999);
          const todayKajian = allMaterialsData.filter((m: any) => {
            const mDate = new Date(m.date);
            return mDate >= today && mDate <= todayEnd && m.isJoined;
          });
          setTodayMaterials(todayKajian);
          setLoadingToday(false);
        } else {
          setLoadingToday(false);
        }

        if (attendanceRes.ok) {
          const aData = await attendanceRes.json();
          // Filter: only materials that have passed their date (status complete)
          // and have an attendance record (can see recap)
          const finished = Array.isArray(aData)
            ? aData.sort(
                (a: any, b: any) =>
                  new Date(b.attendedAt).getTime() -
                  new Date(a.attendedAt).getTime(),
              )
            : [];

          // Get rekapan for the attended materials. We only need max 2 real rekapans.
          const enrichedFinished = [];
          for (const att of finished) {
            if (enrichedFinished.length >= 2) break;
            try {
              const recRes = await fetch(
                `/api/materials/${att.materialId}/rekapan`,
              );
              if (recRes.ok) {
                const recData = await recRes.json();
                const mDataRef = materialsRes.ok
                  ? allMaterialsData.find((m: any) => m.id === att.materialId)
                  : null;

                let plainText = "";
                if (recData.content) {
                  plainText = recData.content
                    .replace(/<[^>]*>?/gm, "")
                    .substring(0, 120);
                  if (recData.content.length > 120) plainText += "...";
                }

                enrichedFinished.push({
                  ...att,
                  grade: mDataRef?.grade || "KELAS 10",
                  category: mDataRef?.category || "PROGRAM WAJIB",
                  materialTitle:
                    mDataRef?.title || att.materialTitle || "Kajian",
                  instructorName:
                    mDataRef?.instructor || att.instructorName || "TBA",
                  contentPreview: plainText,
                  link: recData.attachmentUrl || "",
                });
              }
            } catch (e) {
              console.error(
                "Error fetching rekapan for material",
                att.materialId,
                e,
              );
            }
          }

          setFinishedMaterials(enrichedFinished);

          if (quizRes.ok) {
            const quizData = await quizRes.json();
            const attendedMaterialIds = finished.map(
              (att: any) => att.materialId,
            );

            const allQuizzes = Array.isArray(quizData) ? quizData : [];
            const completedQuizzes = allQuizzes.filter(
              (q: any) => q.lastAttempt,
            );
            const pendingQuizzes = allQuizzes.filter(
              (q: any) =>
                !q.lastAttempt &&
                !q.isStandalone &&
                attendedMaterialIds.includes(q.materialId),
            );

            // Compute average score from completed quizzes
            let avgScore = 0;
            if (completedQuizzes.length > 0) {
              const totalPct = completedQuizzes.reduce(
                (sum: number, q: any) => {
                  const pct =
                    q.lastAttempt.totalScore > 0
                      ? Math.round(
                          (q.lastAttempt.score / q.lastAttempt.totalScore) *
                            100,
                        )
                      : 0;
                  return sum + pct;
                },
                0,
              );
              avgScore = Math.round(totalPct / completedQuizzes.length);
            }

            setDynamicStats({
              totalAttended: finished.length,
              quizCompleted: completedQuizzes.length,
              quizPending: pendingQuizzes.length,
              avgScore,
            });

            setUpcomingQuizzes(pendingQuizzes.slice(0, 3));
          }
        }

        if (newsRes.ok) {
          const nData = await newsRes.json();
          const sortedNews = Array.isArray(nData)
            ? nData.sort(
                (a: any, b: any) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )
            : [];
          setLatestNews(sortedNews.slice(0, 2));
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoadingInstructors(false);
        setLoadingMaterials(false);
        setLoadingFinished(false);
        setLoadingNews(false);
        setLoadingQuizzes(false);
      }
    };

    if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status]);

  // Random button colors for quizzes
  const quizButtonColors = [
    {
      bg: "bg-emerald-400",
      border: "border-emerald-600",
      shadow: "shadow-[0_4px_0_0_#10b981]",
      hover: "hover:bg-emerald-500",
    },
    {
      bg: "bg-teal-400",
      border: "border-teal-600",
      shadow: "shadow-[0_4px_0_0_#14b8a6]",
      hover: "hover:bg-teal-500",
    },
    {
      bg: "bg-emerald-500",
      border: "border-emerald-700",
      shadow: "shadow-[0_4px_0_0_#047857]",
      hover: "hover:bg-emerald-600",
    },
    {
      bg: "bg-teal-500",
      border: "border-teal-700",
      shadow: "shadow-[0_4px_0_0_#0f766e]",
      hover: "hover:bg-teal-600",
    },
    {
      bg: "bg-green-400",
      border: "border-green-600",
      shadow: "shadow-[0_4px_0_0_#16a34a]",
      hover: "hover:bg-green-500",
    },
    {
      bg: "bg-emerald-400",
      border: "border-emerald-600",
      shadow: "shadow-[0_4px_0_0_#10b981]",
      hover: "hover:bg-emerald-500",
    },
    {
      bg: "bg-teal-400",
      border: "border-teal-600",
      shadow: "shadow-[0_4px_0_0_#14b8a6]",
      hover: "hover:bg-teal-500",
    },
    {
      bg: "bg-emerald-500",
      border: "border-emerald-700",
      shadow: "shadow-[0_4px_0_0_#047857]",
      hover: "hover:bg-emerald-600",
    },
  ];

  const getRandomButtonColor = (index: number) => {
    return quizButtonColors[index % quizButtonColors.length];
  };

  const quickActions = [
    { title: "Pengumuman", icon: Bell, link: "/announcements" },
    { title: "Jadwal", icon: Calendar, link: "/materials" },
    { title: "Materi", icon: BookOpen, link: "/archivesch" },
    { title: "Kuis", icon: Trophy, link: "/quiz" },
    { title: "Diskusi", icon: MessageCircle, link: "/chat-rooms" },
    { title: "Peringkat", icon: TrendingUp, link: "/leaderboard" },
  ];

  const [materials, setMaterials] = useState<any[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);

  const [upcomingQuizzes, setUpcomingQuizzes] = useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);

  const programs = [
    {
      id: 1,
      title: "Program Basic Islam",
      progress: 60,
      members: 156,
      icon: BookOpen,
    },
    {
      id: 2,
      title: "Program Penghafal Quran",
      progress: 35,
      members: 89,
      icon: Trophy,
    },
    {
      id: 3,
      title: "Program Pemimpin Muda",
      progress: 50,
      members: 204,
      icon: Users,
    },
  ];

  if (status === "loading") return null;
  if (session?.user?.role !== "user") return null;

  const isLoading =
    loadingInstructors ||
    loadingFinished ||
    loadingNews ||
    loadingToday ||
    loadingQuizzes ||
    loadingMaterials;

  return (
    // Background hangat (Warm White)
    <div className="min-h-screen bg-[#FDFBF7]">
      {isLoading && <Loading fullScreen text="Memuat halaman..." size="lg" />}
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div className="w-full md:w-auto">
              <h1 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight">
                ٱلسَّلَامُ عَلَيْكُمْ,{" "}
                <span className="text-emerald-500 underline decoration-wavy decoration-2 underline-offset-4">
                  {session?.user?.name}
                </span>
              </h1>
              <p className="text-slate-500 mt-2 font-bold text-lg">
                Siap menambah ilmu hari ini?
              </p>

              {/* --- [MOBILE] CARD LEVEL --- */}
              <div className="mt-6 xl:hidden block w-full">
                <LevelCardContent {...levelData} />
              </div>
            </div>

            {/* Date Badge - Cartoon Style */}
            <div className="hidden md:flex items-center gap-2 bg-white px-5 py-3 rounded-full border-2 border-slate-200 shadow-[0_4px_0_0_#e2e8f0] transform hover:-translate-y-1 transition-transform">
              <Calendar className="w-5 h-5 text-emerald-600" strokeWidth={3} />
              <span className="text-sm font-black text-slate-700">
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* MAIN GRID LAYOUT */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
            {/* LEFT COLUMN */}
            <div className="xl:col-span-8 space-y-8">
              {/* Stats Row - Dynamic from user progress */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {/* Stat 1 - Kajian Dihadiri */}
                <div className="bg-white p-5 md:p-6 rounded-[2.5rem] border-2 border-emerald-100 shadow-[0_6px_0_0_#d1fae5] sm:shadow-[0_8px_0_0_#d1fae5] hover:shadow-[0_4px_0_0_#d1fae5] hover:translate-y-1 hover:border-emerald-200 transition-all duration-300 group max-md:aspect-square flex flex-col justify-between">
                  <div className="flex justify-between items-start md:mb-4">
                    <div className="p-2.5 md:p-3 bg-emerald-50 border-2 border-emerald-100 rounded-2xl group-hover:scale-110 transition-transform">
                      <CheckCircle
                        className="w-6 h-6 md:w-7 md:h-7 text-emerald-500"
                        strokeWidth={2.5}
                      />
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1 md:px-3 bg-emerald-100 text-emerald-600 rounded-full border border-emerald-200">
                      Total
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-2xl md:text-3xl font-black text-slate-800 leading-none">
                      {dynamicStats.totalAttended}
                    </div>
                    <div className="text-[10px] text-slate-400 font-black tracking-wide uppercase">
                      Kajian Dihadiri
                    </div>
                  </div>
                </div>

                {/* Stat 2 - Kuis Selesai */}
                <div className="bg-white p-5 md:p-6 rounded-[2.5rem] border-2 border-emerald-100 shadow-[0_6px_0_0_#d1fae5] sm:shadow-[0_8px_0_0_#d1fae5] hover:shadow-[0_4px_0_0_#d1fae5] hover:translate-y-1 hover:border-emerald-200 transition-all duration-300 group max-md:aspect-square flex flex-col justify-between">
                  <div className="flex justify-between items-start md:mb-4">
                    <div className="p-2.5 md:p-3 bg-emerald-50 border-2 border-emerald-100 rounded-2xl group-hover:scale-110 transition-transform">
                      <BarChart3
                        className="w-6 h-6 md:w-7 md:h-7 text-emerald-500"
                        strokeWidth={2.5}
                      />
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1 md:px-3 bg-emerald-100 text-emerald-600 rounded-full border border-emerald-200">
                      {dynamicStats.avgScore}%
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-2xl md:text-3xl font-black text-slate-800 leading-none">
                      {dynamicStats.quizCompleted}
                    </div>
                    <div className="text-[10px] text-slate-400 font-black tracking-wide uppercase">
                      Kuis Selesai
                    </div>
                  </div>
                </div>

                {/* Stat 3 - Kuis Pending */}
                <div className="bg-white p-5 md:p-6 rounded-[2.5rem] border-2 border-emerald-100 shadow-[0_6px_0_0_#d1fae5] sm:shadow-[0_8px_0_0_#d1fae5] hover:shadow-[0_4px_0_0_#d1fae5] hover:translate-y-1 hover:border-emerald-200 transition-all duration-300 group max-md:aspect-square flex flex-col justify-between">
                  <div className="flex justify-between items-start md:mb-4">
                    <div className="p-2.5 md:p-3 bg-emerald-50 border-2 border-emerald-100 rounded-2xl group-hover:scale-110 transition-transform">
                      <AlertCircle
                        className="w-6 h-6 md:w-7 md:h-7 text-emerald-500"
                        strokeWidth={2.5}
                      />
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1 md:px-3 bg-emerald-100 text-emerald-600 rounded-full border border-emerald-200">
                      {dynamicStats.quizPending > 0 ? "Segera!" : "Aman"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-2xl md:text-3xl font-black text-slate-800 leading-none">
                      {dynamicStats.quizPending}
                    </div>
                    <div className="text-[10px] text-slate-400 font-black tracking-wide uppercase">
                      Kuis Tertunda
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's Kajian Section */}
              {!loadingToday && todayMaterials.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-5 px-2">
                    <div className="p-2 bg-emerald-50 border-2 border-emerald-200 rounded-xl shadow-[0_3px_0_0_#6ee7b7]">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-800">
                        Kajian Hari Ini
                      </h2>
                      <p className="text-[11px] text-slate-400 font-bold">
                        Jangan sampai ketinggalan!
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {todayMaterials.map((material) => (
                      <div
                        key={material.id}
                        onClick={() => router.push(`/materials/${material.id}`)}
                        className="bg-linear-to-r from-emerald-50 to-white rounded-3xl border-2 border-emerald-200 p-5 lg:p-6 hover:border-emerald-400 hover:shadow-[0_4px_0_0_#34d399] transition-all duration-300 cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-100/50 rounded-full -mr-6 -mt-6" />
                        <div className="flex-1 min-w-0 relative z-10">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border bg-emerald-100 text-emerald-700 border-emerald-300 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {material.startedAt ||
                                new Date(material.date).toLocaleTimeString(
                                  "id-ID",
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                            </span>
                            <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border bg-emerald-50 text-emerald-600 border-emerald-200">
                              {material.category}
                            </span>
                            {finishedMaterials.some((att: any) => att.materialId === material.id) && (
                              <span className="px-3 py-1 rounded-lg text-[10px] font-black tracking-wide border bg-white text-emerald-600 border-emerald-200 shadow-sm flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 fill-emerald-500 text-white" />
                                SELESAI
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg md:text-xl font-black text-slate-800 leading-tight mb-1 group-hover:text-emerald-700 transition-colors">
                            {material.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-400 mt-2">
                            <div className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5" />
                              {material.instructor}
                            </div>
                            {material.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" />
                                {material.location}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5" />
                              {material.grade}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 relative z-10">
                          <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-400 text-white font-black border-2 border-emerald-500 border-b-4 hover:bg-emerald-500 active:border-b-2 active:translate-y-0.5 transition-all text-sm shadow-[0_4px_0_0_#047857]">
                            Lihat Kajian
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* News Section */}
              <section>
                <div className="flex items-center gap-3 mb-5 px-2">
                  <div className="p-2 bg-white border-2 border-slate-200 rounded-xl shadow-[0_3px_0_0_#e2e8f0]">
                    <Newspaper className="w-5 h-5 text-slate-800" />
                  </div>
                  <h2 className="text-xl font-black text-slate-800">
                    Kabar IRMA Terkini
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {latestNews.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 font-bold py-10 col-span-1 md:col-span-2">
                      Belum ada kabar terbaru
                    </p>
                  ) : (
                    latestNews.map((news) => (
                      <Link
                        href={`/news/${news.slug}`}
                        key={news.id}
                        className="flex gap-4 p-4 bg-white rounded-4xl border-2 border-slate-100 hover:border-emerald-400 hover:shadow-[0_6px_0_0_#10b981] hover:-translate-y-1 transition-all cursor-pointer group"
                      >
                        <div className="w-24 h-24 rounded-2xl bg-slate-200 overflow-hidden shrink-0 border-2 border-slate-100 group-hover:border-emerald-200">
                          <img
                            src={
                              news.image ||
                              `https://images.unsplash.com/photo-1633613286991-611bcfb63dba?auto=format&fit=crop&w=800&q=80`
                            }
                            alt={news.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="inline-block w-fit px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-black border border-emerald-600 shadow-sm mb-2 uppercase tracking-wide">
                            {news.category}
                          </span>
                          <h3 className="font-bold text-slate-800 leading-snug mb-2 text-base group-hover:text-emerald-600 transition-colors line-clamp-2">
                            {news.title}
                          </h3>
                          <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />{" "}
                            {new Date(news.createdAt).toLocaleDateString(
                              "id-ID",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </section>

              {/* Materi Terbaru Section */}
              <section>
                <div className="flex items-center justify-between mb-5 px-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white border-2 border-slate-200 rounded-xl shadow-[0_3px_0_0_#e2e8f0]">
                      <BookMarked className="w-5 h-5 text-slate-800" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800">
                      Rekapan Materi Kajian Terbaru
                    </h2>
                  </div>
                  <Link
                    href="/materials"
                    className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    Lihat Semua <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {finishedMaterials.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 font-bold py-10">
                      Belum ada kajian yang diselesaikan
                    </p>
                  ) : (
                    finishedMaterials.map((material) => (
                      <div
                        key={material.id}
                        onClick={() =>
                          router.push(
                            `/materials/${material.materialId}/rekapan`,
                          )
                        }
                        className="bg-white rounded-3xl border-2 border-emerald-400 p-5 lg:p-6 hover:shadow-[0_4px_0_0_#34d399] transition-all duration-300 cursor-pointer group flex flex-col md:flex-row md:items-start justify-between gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          {/* Category & Grade badges */}
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border bg-emerald-100 text-emerald-700 border-emerald-200">
                              {material.category || "PROGRAM WAJIB"}
                            </span>
                            <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border bg-slate-50 text-slate-600 border-slate-200">
                              {material.grade || "KELAS 10"}
                            </span>
                          </div>

                          <h3 className="text-lg md:text-xl font-black text-teal-600 leading-tight mb-2 group-hover:text-teal-700 transition-colors">
                            {material.materialTitle || "Kajian Tanpa Judul"}
                          </h3>

                          <p className="text-sm text-slate-500 font-medium leading-relaxed mb-3 line-clamp-1 truncate">
                            {material.link ||
                              material.contentPreview ||
                              "Terdapat rekapan materi untuk kajian ini."}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5" />
                              {material.instructorName || "Instruktur"}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(material.attendedAt).toLocaleDateString(
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

                        <div className="flex flex-col items-end gap-3 shrink-0">
                          <button className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-teal-600 font-bold border-2 border-teal-200 border-b-4 hover:bg-teal-50 hover:border-teal-400 active:border-b-2 active:translate-y-0.5 transition-all text-sm shrink-0">
                            <Eye className="h-4 w-4" strokeWidth={2.5} />
                            Baca
                          </button>
                        </div>
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
                    <h2 className="text-xl font-black text-slate-800">
                      Kuis Yang Belum Dikerjakan
                    </h2>
                  </div>
                  <Link
                    href="/quiz"
                    className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    Lihat Semua <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingQuizzes.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 font-bold py-10 col-span-1 md:col-span-2 lg:col-span-3">
                      Yey! Tidak ada kuis kajian yang tertunda.
                    </p>
                  ) : (
                    upcomingQuizzes.map((quiz, index) => {
                      const buttonColor = getRandomButtonColor(index);
                      return (
                        <div
                          key={quiz.id}
                          className="bg-white p-5 rounded-4xl border-2 border-slate-100 hover:border-slate-300 shadow-[0_4px_0_0_#f1f5f9] hover:shadow-[0_6px_0_0_#cbd5e1] hover:-translate-y-1 transition-all group flex flex-col"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-bold text-slate-800 text-sm line-clamp-2">
                              {quiz.title}
                            </h3>
                          </div>

                          <div className="space-y-2 flex-grow">
                            <p className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5" /> Kajian{" "}
                              {quiz.materialTitle || "Terkait"}
                            </p>
                            <p className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5" />{" "}
                              {quiz.questionCount || 0} soal
                            </p>
                          </div>

                          <button
                            onClick={() =>
                              router.push(`/quiz/${quiz.materialId}/${quiz.id}`)
                            }
                            className={`w-full mt-4 py-3 text-white text-xs font-black rounded-2xl h-12 flex items-center justify-center transition-all border-b-4 active:border-b-0 active:translate-y-1 ${buttonColor.bg} ${buttonColor.border} ${buttonColor.shadow} ${buttonColor.hover} hover:shadow-lg`}
                          >
                            Mulai Kuis
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN */}
            <div className="xl:col-span-4 space-y-6">
              {/* --- [DESKTOP] CARD LEVEL --- */}
              <div className="hidden xl:block transform hover:scale-[1.02] transition-transform duration-300">
                <LevelCardContent {...levelData} />
              </div>

              {/* Feature Cards Stack */}
              <div className="space-y-4">
                {/* Dynamic Mission Card */}
                <div className="bg-white p-5 rounded-[2rem] border-2 border-slate-100 shadow-sm hover:border-emerald-300 hover:shadow-[0_4px_0_0_#6ee7b7] transition-all group">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
                      <Zap className="w-7 h-7 text-emerald-500 fill-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-800 text-lg">
                        Misi Kamu
                      </h4>
                      <p className="text-xs text-slate-500 font-bold">
                        Progress hari ini
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {todayMaterials.length > 0 && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                        <p className="text-xs font-bold text-slate-700 flex-1">
                          {todayMaterials.filter(m => finishedMaterials.some((att: any) => att.materialId === m.id)).length}/{todayMaterials.length} kajian selesai hari ini
                        </p>
                        <Link
                          href="/materials"
                          className="text-[10px] font-black text-emerald-600 hover:text-emerald-700"
                        >
                          Lihat
                        </Link>
                      </div>
                    )}
                    {dynamicStats.quizPending > 0 && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <HelpCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <p className="text-xs font-bold text-slate-700 flex-1">
                          {dynamicStats.quizPending} kuis belum dikerjakan
                        </p>
                        <Link
                          href="/quiz"
                          className="text-[10px] font-black text-emerald-600 hover:text-emerald-700"
                        >
                          Kerjakan
                        </Link>
                      </div>
                    )}
                    {todayMaterials.length > 0 && 
                      todayMaterials.every(m => finishedMaterials.some((att: any) => att.materialId === m.id)) &&
                      dynamicStats.quizPending === 0 && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100 shadow-sm animate-pulse">
                          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                          <p className="text-xs font-bold text-emerald-700">
                            Semua misi selesai! Mashaallah 🌟
                          </p>
                        </div>
                      )}
                    {todayMaterials.length === 0 &&
                      dynamicStats.quizPending === 0 && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <CheckCircle className="w-4 h-4 text-slate-400 shrink-0" />
                          <p className="text-xs font-bold text-slate-500">
                            Belum ada misi untuk hari ini.
                          </p>
                        </div>
                      )}
                  </div>
                </div>

                {/* Instruktur Favoritmu */}
                <div className="bg-white p-5 rounded-[2rem] border-2 border-emerald-100 shadow-[0_6px_0_0_#d1fae5] hover:shadow-[0_4px_0_0_#d1fae5] hover:translate-y-1 transition-all duration-300 group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-50 border-2 border-emerald-100 rounded-xl shadow-sm group-hover:rotate-12 transition-transform duration-300">
                      <Heart className="w-5 h-5 fill-emerald-500 text-emerald-500" />
                    </div>
                    <h4 className="font-black text-slate-800 text-lg">
                      Instruktur Favorit
                    </h4>
                  </div>

                  {favoriteInstructors.length === 0 ? (
                    <div className="text-center py-8 bg-emerald-50/50 rounded-3xl border-2 border-dashed border-emerald-200">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-emerald-100 shadow-sm">
                        <Heart className="w-6 h-6 text-emerald-300" />
                      </div>
                      <p className="text-xs text-slate-400 font-bold mb-4 px-4">
                        Kamu belum menambahkan instruktur favorit.
                      </p>
                      <Link
                        href="/instructors"
                        className="px-6 py-2.5 bg-emerald-400 text-white text-xs font-black rounded-2xl border-b-4 border-emerald-600 hover:bg-emerald-500 active:border-b-0 active:translate-y-1 transition-all inline-block shadow-lg shadow-emerald-200"
                      >
                        Cari Instruktur
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {favoriteInstructors.slice(0, 3).map((instructor) => (
                        <div
                          key={instructor.id}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-white border-2 border-slate-100 hover:border-emerald-300 hover:shadow-[0_4px_0_0_#6ee7b7] hover:-translate-y-1 transition-all group cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 border-2 border-slate-100 group-hover:border-rose-200 transition-colors">
                            <img
                              src={
                                instructor.avatar ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${instructor.name}`
                              }
                              alt={instructor.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-800 truncate group-hover:text-emerald-600 transition-colors">
                              {instructor.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold truncate bg-slate-100 w-fit px-2 py-0.5 rounded-md mt-1 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                              {instructor.bidangKeahlian ||
                                instructor.specialization ||
                                "Umum"}
                            </p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="w-4 h-4" strokeWidth={3} />
                          </div>
                        </div>
                      ))}
                      {favoriteInstructors.length > 3 && (
                        <Link
                          href="/instructors"
                          className="w-full py-3 bg-emerald-50 text-emerald-600 text-xs font-black rounded-2xl border-2 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 transition-all text-center block mt-2"
                        >
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
                    {finishedMaterials.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border-2 border-slate-100">
                          <BookOpen className="w-6 h-6 text-slate-200" />
                        </div>
                        <p className="text-xs text-slate-400 font-bold">
                          Belum ada kajian yang diselesaikan
                        </p>
                      </div>
                    ) : (
                      finishedMaterials.map((item) => (
                        <div
                          key={item.id}
                          className="group relative p-4 rounded-2xl border-2 border-slate-50 hover:border-emerald-100 bg-slate-50/30 hover:bg-white transition-all cursor-pointer"
                          onClick={() =>
                            router.push(`/materials/${item.materialId}`)
                          }
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-black text-sm text-slate-800 group-hover:text-emerald-600 transition-colors line-clamp-1 truncate pr-4">
                              {item.materialTitle ||
                                item.material?.title ||
                                "Kajian"}
                            </h5>
                            <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 whitespace-nowrap">
                              <CheckCircle className="w-3 h-3 fill-emerald-500 text-white" />{" "}
                              SELESAI
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <p className="text-[10px] text-slate-400 font-bold tracking-tight">
                              {item.instructorName ||
                                item.material?.instructor ||
                                "Instruktur"}
                            </p>
                            <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest pl-2">
                              {new Date(
                                item.createdAt || item.attendedAt,
                              ).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
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
