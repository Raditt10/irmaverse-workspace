"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  Trophy,
  Star,
  Target,
  Flame,
  BookOpen,
  MessageCircle,
  BarChart3,
  Clock3,
  CheckCircle2,
  Sparkles,
  Users,
  Calendar,
  HelpCircle,
  PenSquare,
  FileText,
  GraduationCap,
  TrendingUp,
  Zap,
  Shield,
  ArrowUpRight,
  AlertCircle,
  UserCheck,
  Newspaper,
} from "lucide-react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ProfileInformationForm from "./_components/ProfileInformationForm";
import Loading from "@/components/ui/Loading";

interface GamificationData {
  stats: {
    points: number;
    badges: number;
    quizzes: number;
    streak: number;
    level: number;
    rank: number;
  };
  xpProgress: {
    currentLevel: number;
    currentLevelXp: number;
    nextLevelXp: number;
    progressXp: number;
    progressPercent: number;
    levelTitle: string;
  };
  completedPrograms: number;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  xpEarned: number;
  createdAt: string;
  user?: {
    name: string;
  };
}

interface BadgeData {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement: string;
  xpReward: number;
  earned: boolean;
  earnedAt: string | null;
}

interface ProgramEnrollment {
  id: string;
  program: {
    id: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
  };
  enrolledAt: string;
  isCompleted: boolean;
}

const Profile = () => {
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      if (typeof window !== "undefined") {
        window.location.href = "/auth";
      }
    },
  });

  const isInstruktur = session?.user?.role === "instruktur";
  const isUser = session?.user?.role === "user";
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "super_admin";

  const [gamification, setGamification] = useState<GamificationData | null>(
    null,
  );
  const [activities, setActivities] = useState<Activity[]>([]);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [programs, setPrograms] = useState<ProgramEnrollment[]>([]);
  const [instructorStats, setInstructorStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session?.user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [gamRes, actRes, badgeRes, progRes] = await Promise.all([
        fetch("/api/users/gamification"),
        fetch("/api/activities?limit=8"),
        fetch("/api/badges"),
        fetch("/api/programs/enrolled"),
      ]);

      if (gamRes.ok) {
        const data = await gamRes.json();
        setGamification(data);
      }
      if (actRes.ok) {
        const data = await actRes.json();
        setActivities(data.activities || []);
      }
      if (badgeRes.ok) {
        const data = await badgeRes.json();
        setBadges(data.badges || []);
      }
      if (progRes.ok) {
        const data = await progRes.json();
        setPrograms(data.enrollments || []);
      }

      // If instructor, fetch academy activities as well
      if (session?.user?.role === "instruktur") {
        const acadRes = await fetch("/api/academy/overview");
        if (acadRes.ok) {
          const acadData = await acadRes.json();
          setInstructorStats(acadData.stats);
          if (acadData.recentActivities) {
            // Map academy activity to match the display needs
            const mappedActivities = acadData.recentActivities.map((act: any) => ({
              id: act.id,
              type: act.type,
              title: act.title,
              time: act.time, // formatted string like "5 menit yang lalu"
              createdAt: new Date().toISOString() // fallback for formatDate if needed
            }));
            setActivities(mappedActivities);
          }
        }
      }
      

    } catch (err) {
      console.error("Error loading profile data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "quiz_completed":
        return <HelpCircle className="h-5 w-5 text-emerald-600" />;
      case "badge_earned":
        return <Award className="h-5 w-5 text-emerald-600" />;
      case "forum_post":
        return <MessageCircle className="h-5 w-5 text-emerald-600" />;
      case "material_read":
        return <BookOpen className="h-5 w-5 text-emerald-600" />;
      case "level_up":
        return <Trophy className="h-5 w-5 text-emerald-600" />;
      case "course_enrolled":
        return <GraduationCap className="h-5 w-5 text-emerald-600" />;
      case "program_enrolled":
        return <FileText className="h-5 w-5 text-emerald-600" />;
      case "friend_added":
        return <Users className="h-5 w-5 text-emerald-600" />;
      case "attendance_marked":
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case "streak_maintained":
        return <Flame className="h-5 w-5 text-emerald-600" />;
      case "profile_completed":
        return <Star className="h-5 w-5 text-emerald-600" />;
      // Academy types
      case "material":
        return <BookOpen className="h-5 w-5 text-emerald-600" />;
      case "schedule":
        return <Calendar className="h-5 w-5 text-emerald-600" />;
      case "competition":
        return <Award className="h-5 w-5 text-emerald-600" />;
      case "news":
        return <Newspaper className="h-5 w-5 text-emerald-600" />;
      case "admin_user_managed":
        return <UserCheck className="h-5 w-5 text-emerald-600" />;
      case "admin_program_managed":
        return <BookOpen className="h-5 w-5 text-emerald-600" />;
      case "admin_news_managed":
        return <Newspaper className="h-5 w-5 text-emerald-600" />;
      case "admin_schedule_managed":
        return <Calendar className="h-5 w-5 text-emerald-600" />;
      case "admin_competition_managed":
        return <Award className="h-5 w-5 text-emerald-600" />;
      case "admin_admin_managed":
        return <Shield className="h-5 w-5 text-emerald-600" />;
      default:
        return <Zap className="h-5 w-5 text-emerald-600" />;
    }
  };

  const getActivityBg = (type: string) => {
    switch (type) {
      case "quiz_completed":
      case "forum_post":
      case "material_read":
      case "course_enrolled":
      case "program_enrolled":
      case "friend_added":
      case "attendance_marked":
      case "profile_completed":
      case "badge_earned":
      case "level_up":
      case "streak_maintained":
      case "material":
      case "schedule":
      case "competition":
      case "news":
      case "admin_user_managed":
      case "admin_program_managed":
      case "admin_news_managed":
      case "admin_schedule_managed":
      case "admin_competition_managed":
      case "admin_admin_managed":
        return "bg-emerald-100 border-emerald-200";
      default:
        return "bg-emerald-100 border-emerald-200";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return "Baru saja";
    if (diffMin < 60) return `${diffMin} menit lalu`;
    if (diffHour < 24) return `${diffHour} jam lalu`;
    if (diffDay < 7) return `${diffDay} hari lalu`;
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const stats = gamification?.stats;
  const xpProgress = gamification?.xpProgress;

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />

      <div className="flex">
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 w-full max-w-[100vw] overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
          <div className="max-w-7xl mx-auto">
            {/* Profile Header */}
            <div className="mb-8 lg:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight mb-2">
                  Profile Saya
                </h1>
                <p className="text-slate-500 font-medium text-sm lg:text-lg">
                  {isInstruktur
                    ? "Kelola informasi akun dan lihat performa mengajarmu."
                    : "Kelola informasi akun dan pantau pencapaianmu di sini."}
                </p>
              </div>
            </div>

            <div
              className={
                isAdmin
                  ? "w-full"
                  : "grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8"
              }
            >
              {/* --- LEFT COLUMN (Profile Info & Activity) --- */}
              <div
                className={
                  isAdmin ? "space-y-6 lg:space-y-8" : "lg:col-span-2 space-y-6 lg:space-y-8"
                }
              >
                {/* 1. Profile Form Card */}
                <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[4px_4px_0_0_#cbd5e1] p-6 lg:p-8">
                  <ProfileInformationForm
                    stats={
                      stats || {
                        points: 0,
                        badges: 0,
                        quizzes: 0,
                        streak: 0,
                        level: 1,
                        rank: 0,
                      }
                    }
                    level={stats?.level || 1}
                    rank={stats?.rank || 0}
                    levelTitle={xpProgress?.levelTitle || "Pemula"}
                  />
                </div>

                {/* 2. XP Progress Bar — hanya untuk USER */}
                {isUser && xpProgress && (
                  <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[4px_4px_0_0_#cbd5e1] p-6 lg:p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                        <Zap
                          className="h-6 w-6 text-emerald-500"
                          fill="currentColor"
                        />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl lg:text-2xl font-black text-slate-800">
                          Level {xpProgress.currentLevel}
                        </h2>
                        <p className="text-xs font-bold text-slate-400">
                          {xpProgress.levelTitle}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-600">
                          {stats?.points?.toLocaleString() || 0} XP
                        </span>
                        <p className="text-[10px] font-bold text-slate-400">
                          Peringkat #{stats?.rank || "-"}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative">
                      <div className="w-full bg-slate-100 rounded-full h-4 border border-slate-200 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 h-4 rounded-full transition-all duration-700 ease-out relative"
                          style={{ width: `${xpProgress.progressPercent}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                        </div>
                      </div>
                      <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400">
                        <span>Level {xpProgress.currentLevel}</span>
                        <span>
                          {xpProgress.progressXp} /{" "}
                          {xpProgress.nextLevelXp - xpProgress.currentLevelXp}{" "}
                          XP
                        </span>
                        <span>Level {xpProgress.currentLevel + 1}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Badge Showcase — hanya untuk USER */}
                {isUser && badges.length > 0 && (
                  <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[4px_4px_0_0_#cbd5e1] p-6 lg:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                          <Shield className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div>
                          <h2 className="text-xl lg:text-2xl font-black text-slate-800">
                            Badge Saya
                          </h2>
                          <p className="text-xs font-bold text-slate-400">
                            {badges.filter((b) => b.earned).length} /{" "}
                            {badges.length} terkumpul
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/level"
                        className="flex items-center gap-1 text-xs font-black text-emerald-500 hover:text-emerald-700 transition-colors"
                      >
                        Lihat Semua <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {badges.slice(0, 6).map((badge) => (
                        <div
                          key={badge.id}
                          className={`relative p-4 rounded-2xl border-2 text-center transition-all ${
                            badge.earned
                              ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-sm"
                              : "bg-slate-50 border-slate-200 opacity-50 grayscale"
                          }`}
                        >
                          <div className="text-3xl mb-2">{badge.icon}</div>
                          <p className="text-xs font-black text-slate-700 leading-tight">
                            {badge.name}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400 mt-1 line-clamp-2">
                            {badge.requirement}
                          </p>
                          {badge.earned && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Activity History - Hanya untuk User dan Instruktur */}
                {(isUser || isInstruktur) && (
                  <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[4px_4px_0_0_#cbd5e1] p-6 lg:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div
                        className={`p-2 rounded-xl border bg-emerald-50 border-emerald-100`}
                      >
                        <Clock3
                          className={`h-6 w-6 text-emerald-500`}
                        />
                      </div>
                      <h2 className="text-xl lg:text-2xl font-black text-slate-800">
                        Aktivitas Terbaru
                      </h2>
                    </div>

                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <Loading text="Memuat aktivitas..." />
                      </div>
                    ) : activities.length === 0 ? (
                      <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        {isInstruktur ? (
                          <Clock3 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        ) : (
                          <Zap className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        )}
                        <p className="text-slate-400 font-bold text-sm">
                          {isInstruktur ? "belum ada aktivitas yang kamu kerjakan" : "Belum ada aktivitas. Mulai belajar untuk mendapatkan XP!"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-130 overflow-y-auto pr-2 custom-scrollbar">
                        {activities.slice(0, 7).map((activity) => (
                          <div
                            key={activity.id}
                            className="flex items-center gap-4 p-4 rounded-3xl border-2 border-slate-100 bg-slate-50/50 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all duration-300 group"
                          >
                            <div
                              className={`h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center border-2 ${getActivityBg(activity.type)}`}
                            >
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 truncate group-hover:text-emerald-600 transition-colors">
                                {activity.title}
                              </p>
                              <p className="text-xs font-bold text-slate-400 mt-0.5">
                                {(activity as any).time || formatDate(activity.createdAt)}
                              </p>
                            </div>
                            {activity.xpEarned > 0 && (
                              <span className="text-emerald-500 font-black text-sm bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 shrink-0">
                                +{activity.xpEarned}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* --- RIGHT COLUMN (Stats) --- */}
              {!isAdmin && (
                <div className="space-y-6 lg:space-y-8">
                  {/* Stats Card - Hanya untuk User dan Instruktur */}
                {(isUser || isInstruktur) && (
                  <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[4px_4px_0_0_#cbd5e1] p-6 lg:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                        <BarChart3 className="h-6 w-6 text-emerald-500" />
                      </div>
                      <h2 className="text-xl lg:text-2xl font-black text-slate-800">
                        Statistik
                      </h2>
                    </div>

                  {isInstruktur ? (
                    <div className="grid grid-cols-1 gap-4">
                      {/* Active Courses */}
                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <BookOpen className="h-5 w-5 text-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-emerald-800">
                            Kajian Aktif
                          </span>
                        </div>
                        <span className="text-xl font-black text-emerald-600">
                          {instructorStats?.activeCourses || 0}
                        </span>
                      </div>

                      {/* Completed Sessions */}
                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-emerald-800">
                            Kajian Selesai
                          </span>
                        </div>
                        <span className="text-xl font-black text-emerald-600">
                          {instructorStats?.completedSessions || 0}
                        </span>
                      </div>

                      {/* Average Rating */}
                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <Star className="h-5 w-5 text-emerald-500 fill-emerald-400" />
                          </div>
                          <span className="text-sm font-bold text-amber-800">
                            Rating Rata-rata
                          </span>
                        </div>
                        <span className="text-xl font-black text-emerald-600">
                          {instructorStats?.averageRating || "0"}
                        </span>
                      </div>

                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <Zap className="h-5 w-5 text-emerald-500 fill-emerald-400" />
                          </div>
                          <span className="text-sm font-bold text-emerald-800">
                            Total EXP
                          </span>
                        </div>
                        <span className="text-xl font-black text-emerald-600">
                          {stats?.points?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <Award className="h-5 w-5 text-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-emerald-800">
                            Badge
                          </span>
                        </div>
                        <span className="text-xl font-black text-emerald-600">
                          {stats?.badges || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <HelpCircle className="h-5 w-5 text-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-emerald-800">
                            Quiz telah diselesaikan
                          </span>
                        </div>
                        <span className="text-xl font-black text-emerald-600">
                          {stats?.quizzes || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <Flame className="h-5 w-5 text-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-emerald-800">
                            Streak
                          </span>
                        </div>
                        <span className="text-xl font-black text-emerald-600">
                          {stats?.streak || 0} Hari
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                )}

                {/* Program Diikuti — hanya untuk USER */}
                {isUser && (
                  <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[4px_4px_0_0_#cbd5e1] p-6 lg:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                        <GraduationCap className="h-6 w-6 text-emerald-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-800 leading-tight">
                          Program Diikuti
                        </h2>
                        <p className="text-xs font-bold text-slate-400">
                          Program yang sedang kamu ikuti
                        </p>
                      </div>
                      {programs.length > 0 && (
                        <span className="text-xs font-black text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                          {programs.length}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-4">
                      {programs.length > 0 ? (
                        programs.map((enrollment) => (
                          <Link
                            key={enrollment.id}
                            href={`/programs/${enrollment.program.id}`}
                            className="relative group block"
                          >
                            <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 shadow-sm hover:border-teal-400 hover:shadow-[0_4px_0_0_#34d399] active:translate-y-0.5 active:shadow-none transition-all duration-200 flex items-center gap-4 cursor-pointer overflow-hidden">
                              {/* Thumbnail Container */}
                              <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50 group-hover:border-teal-200 transition-colors">
                                {enrollment.program.thumbnailUrl ? (
                                  <img
                                    src={enrollment.program.thumbnailUrl}
                                    alt={enrollment.program.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-teal-50">
                                    <GraduationCap className="h-8 w-8 text-teal-200" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 flex flex-col gap-2">
                                <div className="flex justify-between items-start gap-2">
                                  <p className="text-sm lg:text-base font-black text-slate-800 leading-tight group-hover:text-teal-600 transition-colors line-clamp-2">
                                    {enrollment.program.title}
                                  </p>
                                  <GraduationCap className="h-4 w-4 text-teal-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                    <Calendar className="h-3 w-3 text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                      {new Date(
                                        enrollment.enrolledAt,
                                      ).toLocaleDateString("id-ID", {
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </span>
                                  </span>
                                  <span className={`px-2 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                                    enrollment.isCompleted
                                      ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                      : "bg-teal-50 border-teal-100 text-teal-600"
                                  }`}>
                                    <div className={`w-1 h-1 rounded-full ${
                                      enrollment.isCompleted 
                                        ? "bg-emerald-500" 
                                        : "bg-teal-500 animate-pulse"
                                    }`} />
                                    {enrollment.isCompleted ? "Sudah selesai" : "dalam proses"}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 group-hover:bg-teal-50 group-hover:border-teal-200 group-hover:text-teal-500 transition-all">
                                <ArrowUpRight className="h-5 w-5" />
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="text-center py-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                          <p className="text-slate-400 font-bold text-sm">
                            Belum ada program yang diikuti.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Kajian yang dikelola — hanya untuk INSTRUKTUR */}
                {isInstruktur && (
                  <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[4px_4px_0_0_#cbd5e1] p-6 lg:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                        <GraduationCap className="h-6 w-6 text-emerald-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-800 leading-tight">
                          Kajian Saya
                        </h2>
                        <p className="text-xs font-bold text-slate-400">
                          Yang sedang aktif dikelola
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      {programs.length > 0 ? (
                        programs.map((enrollment) => (
                          <div
                            key={enrollment.id}
                            className="bg-white rounded-3xl border-2 border-slate-200 p-3 shadow-sm hover:border-emerald-400 hover:shadow-[0_4px_0_0_#10b981] active:translate-y-0.5 active:shadow-none transition-all duration-200 flex items-center gap-4 cursor-pointer overflow-hidden group"
                          >
                            {/* Thumbnail */}
                            <div className="relative h-20 w-20 shrink-0 rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50 group-hover:border-emerald-200 transition-colors">
                              {enrollment.program.thumbnailUrl ? (
                                <img
                                  src={enrollment.program.thumbnailUrl}
                                  alt={enrollment.program.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-emerald-50">
                                  <GraduationCap className="h-8 w-8 text-emerald-200" />
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 flex flex-col gap-1">
                              <div className="flex justify-between items-start gap-2">
                                <p className="text-sm lg:text-base font-black text-slate-800 leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2">
                                  {enrollment.program.title}
                                </p>
                                <GraduationCap className="h-4 w-4 text-emerald-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  {new Date(
                                    enrollment.enrolledAt,
                                  ).toLocaleDateString("id-ID", {
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                                <span className="bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                                  Dikelola
                                </span>
                              </div>
                            </div>
                            
                            <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                              <ArrowUpRight className="h-4 w-4" />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                          <p className="text-slate-400 font-bold text-sm">
                            Belum ada kajian.
                          </p>
                        </div>
                      )}
                    </div>

                    <Link
                      href="/materials"
                      className="flex items-center justify-center gap-1 mt-5 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 font-black text-sm hover:bg-emerald-100 transition-colors"
                    >
                      Kelola Semua Kajian →
                    </Link>
                  </div>
                )}
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
