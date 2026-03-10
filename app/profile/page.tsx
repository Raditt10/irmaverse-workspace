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
    averageScore: number;
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
    name: string;
    description: string | null;
  };
  enrolledAt: string;
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

  const [gamification, setGamification] = useState<GamificationData | null>(
    null,
  );
  const [activities, setActivities] = useState<Activity[]>([]);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [programs, setPrograms] = useState<ProgramEnrollment[]>([]);
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
    } catch (err) {
      console.error("Error loading profile data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "quiz_completed":
        return <BarChart3 className="h-5 w-5 text-indigo-600" />;
      case "badge_earned":
        return <Award className="h-5 w-5 text-amber-600" />;
      case "forum_post":
        return <MessageCircle className="h-5 w-5 text-emerald-600" />;
      case "material_read":
        return <BookOpen className="h-5 w-5 text-blue-600" />;
      case "level_up":
        return <Trophy className="h-5 w-5 text-rose-600" />;
      case "course_enrolled":
        return <GraduationCap className="h-5 w-5 text-purple-600" />;
      case "program_enrolled":
        return <FileText className="h-5 w-5 text-teal-600" />;
      case "friend_added":
        return <Users className="h-5 w-5 text-pink-600" />;
      case "attendance_marked":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "streak_maintained":
        return <Flame className="h-5 w-5 text-orange-600" />;
      case "profile_completed":
        return <Star className="h-5 w-5 text-cyan-600" />;
      default:
        return <Zap className="h-5 w-5 text-slate-600" />;
    }
  };

  const getActivityBg = (type: string) => {
    switch (type) {
      case "quiz_completed":
        return "bg-indigo-100 border-indigo-200";
      case "badge_earned":
        return "bg-amber-100 border-amber-200";
      case "forum_post":
        return "bg-emerald-100 border-emerald-200";
      case "material_read":
        return "bg-blue-100 border-blue-200";
      case "level_up":
        return "bg-rose-100 border-rose-200";
      case "course_enrolled":
        return "bg-purple-100 border-purple-200";
      case "program_enrolled":
        return "bg-teal-100 border-teal-200";
      case "friend_added":
        return "bg-pink-100 border-pink-200";
      case "attendance_marked":
        return "bg-green-100 border-green-200";
      case "streak_maintained":
        return "bg-orange-100 border-orange-200";
      default:
        return "bg-slate-100 border-slate-200";
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* --- LEFT COLUMN (Profile Info & Activity) --- */}
              <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                {/* 1. Profile Form Card */}
                <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[4px_4px_0_0_#cbd5e1] p-6 lg:p-8">
                  <ProfileInformationForm
                    stats={
                      stats || {
                        points: 0,
                        badges: 0,
                        quizzes: 0,
                        streak: 0,
                        averageScore: 0,
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
                {!isInstruktur && xpProgress && (
                  <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[4px_4px_0_0_#cbd5e1] p-6 lg:p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                        <Zap
                          className="h-6 w-6 text-amber-500"
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
                        <span className="text-sm font-black text-amber-600">
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
                          className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 h-4 rounded-full transition-all duration-700 ease-out relative"
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
                {!isInstruktur && badges.length > 0 && (
                  <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[4px_4px_0_0_#cbd5e1] p-6 lg:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 rounded-xl border border-purple-100">
                          <Shield className="h-6 w-6 text-purple-500" />
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
                        className="flex items-center gap-1 text-xs font-black text-purple-500 hover:text-purple-700 transition-colors"
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
                              ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-sm"
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

                {/* 4. Activity History */}
                <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[4px_4px_0_0_#cbd5e1] p-6 lg:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className={`p-2 rounded-xl border ${isInstruktur ? "bg-emerald-50 border-emerald-100" : "bg-indigo-50 border-indigo-100"}`}
                    >
                      <Clock3
                        className={`h-6 w-6 ${isInstruktur ? "text-emerald-500" : "text-indigo-500"}`}
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
                      <Zap className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-400 font-bold text-sm">
                        Belum ada aktivitas. Mulai belajar untuk mendapatkan XP!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center gap-4 p-4 rounded-3xl border-2 border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all duration-300 group"
                        >
                          <div
                            className={`h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center border-2 ${getActivityBg(activity.type)}`}
                          >
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                              {activity.title}
                            </p>
                            <p className="text-xs font-bold text-slate-400 mt-0.5">
                              {formatDate(activity.createdAt)}
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
              </div>

              {/* --- RIGHT COLUMN (Stats) --- */}
              <div className="space-y-6 lg:space-y-8">
                {/* Stats Card */}
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
                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <Star className="h-5 w-5 text-emerald-500 fill-emerald-400" />
                          </div>
                          <span className="text-sm font-bold text-amber-800">
                            Level
                          </span>
                        </div>
                        <span className="text-xl font-black text-amber-600">
                          {stats?.level || 1}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <BookOpen className="h-5 w-5 text-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-emerald-800">
                            Total Poin
                          </span>
                        </div>
                        <span className="text-xl font-black text-emerald-600">
                          {stats?.points?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-sky-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <Users className="h-5 w-5 text-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-blue-800">
                            Badge
                          </span>
                        </div>
                        <span className="text-xl font-black text-blue-600">
                          {stats?.badges || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-purple-100 bg-gradient-to-r from-purple-50 to-fuchsia-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <GraduationCap className="h-5 w-5 text-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-purple-800">
                            Streak
                          </span>
                        </div>
                        <span className="text-xl font-black text-purple-600">
                          {stats?.streak || 0} Hari
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-amber-800">
                            Total Poin
                          </span>
                        </div>
                        <span className="text-xl font-black text-amber-600">
                          {stats?.points?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-sky-100 bg-gradient-to-r from-sky-50 to-blue-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <Award className="h-5 w-5 text-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-sky-800">
                            Badge
                          </span>
                        </div>
                        <span className="text-xl font-black text-sky-600">
                          {stats?.badges || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-purple-100 bg-gradient-to-r from-purple-50 to-fuchsia-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <BookOpen className="h-5 w-5 text-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-purple-800">
                            Quiz
                          </span>
                        </div>
                        <span className="text-xl font-black text-purple-600">
                          {stats?.quizzes || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-rose-100 bg-gradient-to-r from-rose-50 to-red-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <AlertCircle className="h-5 w-5 text-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-rose-800">
                            Streak
                          </span>
                        </div>
                        <span className="text-xl font-black text-rose-600">
                          {stats?.streak || 0} Hari
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <Target className="h-5 w-5 text-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-emerald-800">
                            Rata-rata
                          </span>
                        </div>
                        <span className="text-xl font-black text-emerald-600">
                          {stats?.averageScore || 0}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Program Diikuti — hanya untuk USER */}
                {!isInstruktur && (
                  <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[4px_4px_0_0_#cbd5e1] p-6 lg:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-teal-50 rounded-xl border border-teal-100">
                        <CheckCircle2 className="h-6 w-6 text-teal-500" />
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
                            <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 shadow-sm hover:border-teal-400 hover:shadow-[0_4px_0_0_#34d399] active:translate-y-0.5 active:shadow-none transition-all duration-200 flex flex-col gap-2 cursor-pointer">
                              <div className="flex justify-between items-start">
                                <p className="text-sm lg:text-base font-bold text-slate-800 leading-tight group-hover:text-teal-600 transition-colors line-clamp-2">
                                  {enrollment.program.name}
                                </p>
                                <Sparkles className="h-4 w-4 text-amber-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="flex flex-wrap items-center gap-3 mt-1">
                                <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                                  <Calendar className="h-3 w-3 text-slate-500" />
                                  <span className="text-[10px] font-bold text-slate-600 uppercase">
                                    {new Date(
                                      enrollment.enrolledAt,
                                    ).toLocaleDateString("id-ID", {
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </span>
                                </span>
                                <span className="bg-teal-50 px-2 py-1 rounded-lg border border-teal-100 text-[10px] font-bold text-teal-600 uppercase">
                                  Aktif
                                </span>
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
                        <PenSquare className="h-6 w-6 text-emerald-500" />
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

                    <div className="space-y-3">
                      {programs.length > 0 ? (
                        programs.map((enrollment) => (
                          <div
                            key={enrollment.id}
                            className="border-l-4 border-emerald-400 pl-4 py-2 hover:border-emerald-600 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="font-bold text-sm text-slate-800 group-hover:text-emerald-600 transition-colors line-clamp-1">
                                {enrollment.program.name}
                              </p>
                            </div>
                            <p className="text-xs text-slate-400 font-bold flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Sejak{" "}
                              {new Date(
                                enrollment.enrolledAt,
                              ).toLocaleDateString("id-ID", {
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
