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
  AlertCircle,
  UserCheck,
} from "lucide-react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ProfileInformationForm from "./_components/ProfileInformationForm";
import Loading from "@/components/ui/Loading";

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

  // ========== DYNAMIC USER STATS ==========
  const [userStats, setUserStats] = useState({
    totalAttended: 0,
    quizCompleted: 0,
    quizPending: 0,
    avgScore: 0,
    badges: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [friends, setFriends] = useState<any[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    if (!session?.user?.id || isInstruktur) return;

    const fetchUserData = async () => {
      try {
        const [attendanceRes, quizRes, membersRes] = await Promise.all([
          fetch("/api/materials/attendance"),
          fetch("/api/quiz"),
          fetch("/api/members"),
        ]);

        // --- Attendance data ---
        let attendedList: any[] = [];
        if (attendanceRes.ok) {
          const aData = await attendanceRes.json();
          attendedList = Array.isArray(aData) ? aData : [];
        }

        // --- Quiz data ---
        let completedQuizzes: any[] = [];
        let pendingCount = 0;
        let avgScore = 0;
        if (quizRes.ok) {
          const quizData = await quizRes.json();
          const allQuizzes = Array.isArray(quizData) ? quizData : [];
          completedQuizzes = allQuizzes.filter((q: any) => q.lastAttempt);
          const attendedIds = attendedList.map((a: any) => a.materialId);
          pendingCount = allQuizzes.filter(
            (q: any) => !q.lastAttempt && !q.isStandalone && attendedIds.includes(q.materialId)
          ).length;

          if (completedQuizzes.length > 0) {
            const totalPct = completedQuizzes.reduce((sum: number, q: any) => {
              const pct = q.lastAttempt.totalScore > 0
                ? Math.round((q.lastAttempt.score / q.lastAttempt.totalScore) * 100)
                : 0;
              return sum + pct;
            }, 0);
            avgScore = Math.round(totalPct / completedQuizzes.length);
          }
        }

        setUserStats({
          totalAttended: attendedList.length,
          quizCompleted: completedQuizzes.length,
          quizPending: pendingCount,
          avgScore,
          badges: 0,
        });
        setLoadingStats(false);

        // --- Build activities from real data ---
        const activities: any[] = [];

        // Add attendance activities
        attendedList
          .sort((a: any, b: any) => new Date(b.attendedAt).getTime() - new Date(a.attendedAt).getTime())
          .slice(0, 5)
          .forEach((att: any) => {
            activities.push({
              type: "material",
              title: `Menghadiri kajian "${att.materialTitle || "Kajian"}"`,
              date: formatActivityDate(att.attendedAt),
              sortDate: new Date(att.attendedAt).getTime(),
            });
          });

        // Add quiz activities
        completedQuizzes
          .sort((a: any, b: any) => new Date(b.lastAttempt.completedAt).getTime() - new Date(a.lastAttempt.completedAt).getTime())
          .slice(0, 5)
          .forEach((q: any) => {
            const pct = q.lastAttempt.totalScore > 0
              ? Math.round((q.lastAttempt.score / q.lastAttempt.totalScore) * 100)
              : 0;
            activities.push({
              type: "quiz",
              title: `Menyelesaikan kuis "${q.title}"`,
              date: formatActivityDate(q.lastAttempt.completedAt),
              sortDate: new Date(q.lastAttempt.completedAt).getTime(),
              points: `${pct}%`,
            });
          });

        // Sort all by date and take latest 5
        activities.sort((a, b) => b.sortDate - a.sortDate);
        setUserActivities(activities.slice(0, 5));
        setLoadingActivities(false);

        // --- Friends (other members) ---
        if (membersRes.ok) {
          const members = await membersRes.json();
          const otherMembers = Array.isArray(members)
            ? members.filter((m: any) => m.id !== session.user.id)
            : [];
          setFriends(otherMembers);
        }
        setLoadingFriends(false);
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setLoadingStats(false);
        setLoadingFriends(false);
        setLoadingActivities(false);
      }
    };

    fetchUserData();
  }, [session?.user?.id, isInstruktur]);

  const formatActivityDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    const time = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    if (diffDays === 0) return `Hari ini, ${time}`;
    if (diffDays === 1) return `Kemarin, ${time}`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  // ========== INSTRUKTUR STATS ==========
  const instrukturStats = {
    rating: 4.8,
    totalKajian: 12,
    totalSiswa: 148,
    totalSesi: 64,
    kepuasan: 92,
  };

  // ========== INSTRUKTUR ACTIVITIES ==========
  const instrukturActivities = [
    { type: "kajian", title: "Membuat kajian baru: Tauhid Bab 3", date: "Hari ini, 10:15" },
    { type: "sesi", title: "Memimpin sesi kajian kelas XI", date: "Hari ini, 08:00" },
    { type: "materi", title: "Mengunggah materi PDF Fiqih Ibadah", date: "Kemarin, 15:30" },
    { type: "siswa", title: "Mengundang 5 siswa baru ke kajian", date: "Kemarin, 11:00" },
    { type: "jadwal", title: "Membuat jadwal kajian minggu depan", date: "2 hari lalu, 16:00" },
  ];

  const getUserActivityIcon = (type: string) => {
    switch (type) {
      case "quiz": return <HelpCircle className="h-5 w-5 text-emerald-600" />;
      case "badge": return <Award className="h-5 w-5 text-amber-600" />;
      case "discussion": return <MessageCircle className="h-5 w-5 text-emerald-600" />;
      case "material": return <BookOpen className="h-5 w-5 text-teal-600" />;
      case "level": return <Trophy className="h-5 w-5 text-emerald-700" />;
      default: return <Star className="h-5 w-5 text-slate-600" />;
    }
  };

  const getUserActivityBg = (type: string) => {
    switch (type) {
      case "quiz": return "bg-emerald-100 border-emerald-200";
      case "badge": return "bg-emerald-50 border-emerald-200";
      case "discussion": return "bg-teal-100 border-teal-200";
      case "material": return "bg-teal-50 border-teal-200";
      case "level": return "bg-emerald-50 border-emerald-300";
      default: return "bg-slate-100 border-slate-200";
    }
  };

  const getInstrukturActivityIcon = (type: string) => {
    switch (type) {
      case "kajian": return <BookOpen className="h-5 w-5 text-emerald-600" />;
      case "sesi": return <GraduationCap className="h-5 w-5 text-emerald-600" />;
      case "materi": return <FileText className="h-5 w-5 text-emerald-600" />;
      case "siswa": return <Users className="h-5 w-5 text-emerald-600" />;
      case "jadwal": return <Calendar className="h-5 w-5 text-teal-600" />;
      default: return <Zap className="h-5 w-5 text-slate-600" />;
    }
  };

  const getInstrukturActivityBg = (type: string) => {
    switch (type) {
      case "kajian": return "bg-emerald-100 border-emerald-200";
      case "sesi": return "bg-emerald-100 border-emerald-200";
      case "materi": return "bg-emerald-50 border-emerald-200";
      case "siswa": return "bg-emerald-100 border-emerald-200";
      case "jadwal": return "bg-teal-100 border-teal-200";
      default: return "bg-slate-100 border-slate-200";
    }
  };

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
                    stats={userStats}
                    level={0}
                    rank={0}
                  />
                </div>

                {/* 2. Activity History */}
                <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[4px_4px_0_0_#cbd5e1] p-6 lg:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2 rounded-xl border ${isInstruktur ? "bg-emerald-50 border-emerald-100" : "bg-emerald-50 border-emerald-100"}`}>
                      <Clock3 className={`h-6 w-6 ${isInstruktur ? "text-emerald-500" : "text-emerald-500"}`} />
                    </div>
                    <h2 className="text-xl lg:text-2xl font-black text-slate-800">Aktivitas Terbaru</h2>
                  </div>

                  <div className="space-y-4">
                    {isInstruktur
                      ? instrukturActivities.map((activity, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-4 p-4 rounded-3xl border-2 border-slate-100 bg-slate-50/50 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all duration-300 group"
                          >
                            <div className={`h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center border-2 ${getInstrukturActivityBg(activity.type)}`}>
                              {getInstrukturActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 truncate group-hover:text-emerald-600 transition-colors">
                                {activity.title}
                              </p>
                              <p className="text-xs font-bold text-slate-400 mt-0.5">
                                {activity.date}
                              </p>
                            </div>
                          </div>
                        ))
                      : loadingActivities ? (
                          <Loading text="Memuat aktivitas..." />
                        ) : userActivities.length === 0 ? (
                          <div className="text-center py-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold text-sm">Belum ada aktivitas tercatat.</p>
                          </div>
                        ) : (
                          userActivities.map((activity, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-4 p-4 rounded-3xl border-2 border-slate-100 bg-slate-50/50 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all duration-300 group"
                            >
                              <div className={`h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center border-2 ${getUserActivityBg(activity.type)}`}>
                                {getUserActivityIcon(activity.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 truncate group-hover:text-emerald-600 transition-colors">
                                  {activity.title}
                                </p>
                                <p className="text-xs font-bold text-slate-400 mt-0.5">
                                  {activity.date}
                                </p>
                              </div>
                              {activity.points && (
                                <span className="text-emerald-500 font-black text-sm bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                  {activity.points}
                                </span>
                              )}
                            </div>
                          ))
                        )}
                  </div>
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
                    <h2 className="text-xl lg:text-2xl font-black text-slate-800">Statistik</h2>
                  </div>

                  {isInstruktur ? (
                    /* ===== INSTRUKTUR STATS ===== */
                    <div className="grid grid-cols-1 gap-4">
                      {/* Rating */}
                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-emerald-100 bg-linear-to-r from-emerald-50 to-teal-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <Star className="h-5 w-5 text-emerald-500 fill-emerald-400" />
                          </div>
                          <span className="text-sm font-bold text-emerald-800">Rating</span>
                        </div>
                        <span className="text-xl font-black text-emerald-600">⭐ {instrukturStats.rating}</span>
                      </div>

                      {/* Total Kajian */}
                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-emerald-100 bg-linear-to-r from-emerald-50 to-teal-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <BookOpen className="h-5 w-5 text-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-emerald-800">Total Kajian</span>
                        </div>
                        <span className="text-xl font-black text-emerald-600">{instrukturStats.totalKajian}</span>
                      </div>

                      {/* Total Siswa */}
                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-emerald-100 bg-linear-to-r from-emerald-50 to-teal-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <Users className="h-5 w-5 text-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-emerald-800">Total Siswa</span>
                        </div>
                        <span className="text-xl font-black text-emerald-600">{instrukturStats.totalSiswa}</span>
                      </div>

                      {/* Total Sesi */}
                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-emerald-100 bg-linear-to-r from-emerald-50 to-teal-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <GraduationCap className="h-5 w-5 text-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-emerald-800">Total Sesi</span>
                        </div>
                        <span className="text-xl font-black text-emerald-600">{instrukturStats.totalSesi}</span>
                      </div>

                      {/* Kepuasan Siswa */}
                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-emerald-100 bg-linear-to-r from-emerald-50 to-teal-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-emerald-800">Kepuasan</span>
                        </div>
                        <span className="text-xl font-black text-emerald-600">{instrukturStats.kepuasan}%</span>
                      </div>
                    </div>
                  ) : (
                    /* ===== USER STATS ===== */
                    loadingStats ? (
                      <Loading text="Memuat statistik..." />
                    ) : (
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-emerald-100 bg-linear-to-r from-emerald-50 to-teal-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-emerald-800">Kajian Dihadiri</span>
                        </div>
                        <span className="text-xl font-black text-emerald-600">{userStats.totalAttended}</span>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-emerald-100 bg-linear-to-r from-emerald-50 to-teal-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <Award className="h-5 w-5 text-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-emerald-800">Badge</span>
                        </div>
                        <span className="text-xl font-black text-emerald-600">{userStats.badges}</span>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-emerald-100 bg-linear-to-r from-emerald-50 to-teal-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <BookOpen className="h-5 w-5 text-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-emerald-800">Kuis Selesai</span>
                        </div>
                        <span className="text-xl font-black text-emerald-600">{userStats.quizCompleted}</span>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-emerald-100 bg-linear-to-r from-emerald-50 to-teal-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <AlertCircle className="h-5 w-5 text-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-emerald-800">Kuis Tertunda</span>
                        </div>
                        <span className="text-xl font-black text-emerald-600">{userStats.quizPending}</span>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-3xl border-2 border-emerald-100 bg-linear-to-r from-emerald-50 to-teal-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                            <Target className="h-5 w-5 text-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-emerald-800">Rata-rata Skor</span>
                        </div>
                        <span className="text-xl font-black text-emerald-600">{userStats.avgScore}%</span>
                      </div>
                    </div>
                    )
                  )}
                </div>

                {/* Teman di IRMA — hanya untuk USER */}
                {!isInstruktur && (
                  <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[4px_4px_0_0_#cbd5e1] p-6 lg:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-50 rounded-xl border border-teal-100">
                          <UserCheck className="h-6 w-6 text-teal-500" />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-slate-800 leading-tight">Teman di IRMA</h2>
                          <p className="text-xs font-bold text-slate-400">Anggota yang kamu kenal</p>
                        </div>
                      </div>
                      {friends.length > 0 && (
                        <span className="text-xs font-black text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                          {friends.length}
                        </span>
                      )}
                    </div>

                    {loadingFriends ? (
                      <Loading text="Memuat teman..." />
                    ) : friends.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-slate-100 shadow-sm">
                          <Users className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-bold text-sm">Belum ada teman.</p>
                        <Link href="/friends" className="mt-3 inline-block px-5 py-2 bg-teal-400 text-white text-xs font-black rounded-2xl border-b-4 border-teal-600 hover:bg-teal-500 active:border-b-0 active:translate-y-1 transition-all">
                          Cari Teman
                        </Link>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {friends.slice(0, 5).map((friend: any) => (
                          <Link
                            key={friend.id}
                            href={`/members/${friend.id}`}
                            className="flex items-center gap-3 p-3 rounded-2xl border-2 border-slate-100 hover:border-teal-300 hover:shadow-[0_4px_0_0_#5eead4] hover:-translate-y-0.5 transition-all group bg-white"
                          >
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-100 group-hover:border-teal-200 shrink-0 bg-slate-100 flex items-center justify-center">
                              {friend.avatar ? (
                                <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm font-black text-slate-400">
                                  {friend.name?.charAt(0)?.toUpperCase() || "?"}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate group-hover:text-teal-600 transition-colors">
                                {friend.name}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 capitalize">{friend.role || "Anggota"}</p>
                            </div>
                          </Link>
                        ))}
                        {friends.length > 5 && (
                          <Link
                            href="/friends"
                            className="w-full py-2.5 bg-teal-50 text-teal-600 text-xs font-black rounded-2xl border-2 border-teal-100 hover:bg-teal-100 transition-all text-center block mt-1"
                          >
                            Lihat Semua ({friends.length})
                          </Link>
                        )}
                      </div>
                    )}
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
                        <h2 className="text-xl font-black text-slate-800 leading-tight">Kajian Saya</h2>
                        <p className="text-xs font-bold text-slate-400">Yang sedang aktif dikelola</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {[
                        { title: "Tauhid — Bab Konsep Ketauhidan", students: 48, progress: 65 },
                        { title: "Fiqih Ibadah — Tata Cara Shalat", students: 52, progress: 40 },
                        { title: "Tajweed — Hukum Nun Sukun", students: 48, progress: 85 },
                      ].map((kajian, i) => (
                        <div key={i} className="border-l-4 border-emerald-400 pl-4 py-2 hover:border-emerald-600 transition-colors cursor-pointer group">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="font-bold text-sm text-slate-800 group-hover:text-emerald-600 transition-colors line-clamp-1">{kajian.title}</p>
                            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0 ml-2">{kajian.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1.5">
                            <div
                              className="bg-linear-to-r from-emerald-400 to-teal-400 h-1.5 rounded-full"
                              style={{ width: `${kajian.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-400 font-bold flex items-center gap-1">
                            <Users className="w-3 h-3" /> {kajian.students} siswa
                          </p>
                        </div>
                      ))}
                    </div>

                    <Link
                      href="/instructor/kajian"
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