"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import FollowButton from "@/components/ui/FollowButton";
import Loading from "@/components/ui/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Award,
  BookOpen,
  Star,
  Activity,
  Trophy,
  Users,
  MessageCircle,
  Zap,
  Target,
  TrendingUp,
  GraduationCap,
  Brain,
  Flame,
  Shield,
  CheckCircle2,
  BarChart3,
  FileText,
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  level: number;
  points: number;
  badges: number;
  streak: number;
  averageScore: number;
  quizzes: number;
  role: string;
  createdAt: string;
  lastSeen: string;
  bidangKeahlian: string | null;
}
interface ProfileStats {
  followersCount: number;
  followingCount: number;
  quizAttemptCount: number;
  averageQuizScore: number;
  programEnrollCount: number;
  courseEnrollCount: number;
  totalEnrollments: number;
}
interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  xpEarned?: number;
  date: string;
  score?: number;
  totalScore?: number;
}
interface EarnedBadge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earnedAt: string;
}
interface XpProgress {
  currentLevel: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressXp: number;
  progressPercent: number;
  levelTitle: string;
}
interface FriendshipStatus {
  isOwnProfile: boolean;
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMutual: boolean;
}

export default function UserPublicProfile() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const userId = params?.id as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [xpProgress, setXpProgress] = useState<XpProgress | null>(null);
  const [friendshipStatus, setFriendshipStatus] =
    useState<FriendshipStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchProfile();
      if (session?.user?.id) fetchFriendshipStatus();
    }
  }, [userId, session?.user?.id]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/friends/profile/${userId}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setProfile(data.user);
      setStats(data.stats);
      setActivities(data.recentActivities || []);
      setEarnedBadges(data.earnedBadges || []);
      setXpProgress(data.xpProgress || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendshipStatus = async () => {
    try {
      const res = await fetch(`/api/friends/status/${userId}`);
      if (res.ok) setFriendshipStatus(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartChat = () => router.push(`/chat-rooms?userId=${userId}`);
  const isOnline = (ls: string) => Date.now() - new Date(ls).getTime() < 300000;

  const formatLastSeen = (ls: string) => {
    const m = Math.floor((Date.now() - new Date(ls).getTime()) / 60000);
    if (m < 5) return "Online";
    if (m < 60) return `${m} menit yang lalu`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} jam yang lalu`;
    return `${Math.floor(h / 24)} hari yang lalu`;
  };

  const formatDate = (d: string) => {
    const ms = Date.now() - new Date(d).getTime();
    const min = Math.floor(ms / 60000);
    if (min < 1) return "Baru saja";
    if (min < 60) return `${min} menit lalu`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} jam lalu`;
    const dy = Math.floor(hr / 24);
    if (dy < 7) return `${dy} hari lalu`;
    return new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getIcon = (t: string) => {
    const map: Record<string, React.ReactNode> = {
      quiz_completed: <BarChart3 className="h-5 w-5 text-indigo-600" />,
      badge_earned: <Award className="h-5 w-5 text-amber-600" />,
      forum_post: <MessageCircle className="h-5 w-5 text-emerald-600" />,
      material_read: <BookOpen className="h-5 w-5 text-blue-600" />,
      level_up: <Trophy className="h-5 w-5 text-rose-600" />,
      course_enrolled: <GraduationCap className="h-5 w-5 text-purple-600" />,
      program_enrolled: <FileText className="h-5 w-5 text-teal-600" />,
      friend_added: <Users className="h-5 w-5 text-pink-600" />,
      attendance_marked: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      streak_maintained: <Flame className="h-5 w-5 text-orange-600" />,
    };
    return map[t] || <Brain className="h-5 w-5 text-blue-600" />;
  };

  const getBg = (t: string) => {
    const map: Record<string, string> = {
      quiz_completed: "bg-indigo-50",
      badge_earned: "bg-amber-50",
      level_up: "bg-rose-50",
      course_enrolled: "bg-purple-50",
      program_enrolled: "bg-teal-50",
      friend_added: "bg-pink-50",
    };
    return map[t] || "bg-blue-50";
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loading text="Memuat profil..." size="lg" />
      </div>
    );

  if (!profile)
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
        <DashboardHeader />
        <div className="flex flex-1">
          <div className="hidden lg:block h-[calc(100vh-80px)] sticky top-20">
            <Sidebar />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-12 w-12 text-slate-300" />
              </div>
              <h2 className="text-2xl font-black text-slate-700 mb-2">
                User Tidak Ditemukan
              </h2>
              <p className="text-slate-500 mb-6">
                Profil yang kamu cari tidak tersedia.
              </p>
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Kembali
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  const online = isOnline(profile.lastSeen);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans">
      <DashboardHeader />
      <div className="flex flex-1">
        <div className="hidden lg:block h-[calc(100vh-80px)] sticky top-20">
          <Sidebar />
        </div>
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 mb-6 transition-colors font-bold text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* LEFT: Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white border-2 border-slate-200 rounded-[2rem] shadow-[0_6px_0_0_#cbd5e1] overflow-hidden sticky top-24">
                <div className="h-28 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 relative">
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${online ? "bg-emerald-400 animate-pulse" : "bg-slate-300"}`}
                    />
                    <span className="text-[10px] font-black text-white uppercase tracking-tight">
                      {formatLastSeen(profile.lastSeen)}
                    </span>
                  </div>
                </div>
                <div className="px-6 pb-6 -mt-14">
                  <div className="flex justify-center mb-4">
                    <Avatar className="h-28 w-28 border-4 border-white shadow-xl">
                      <AvatarImage
                        src={
                          profile.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`
                        }
                        alt={profile.name || "User"}
                      />
                      <AvatarFallback className="bg-emerald-500 text-white font-black text-3xl">
                        {(profile.name || "U").substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="text-center mb-4">
                    <h1 className="text-2xl font-black text-slate-800 mb-1">
                      {profile.name || "Pengguna"}
                    </h1>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-black text-emerald-700 uppercase tracking-wider">
                      {profile.role === "instruktur" ? (
                        <GraduationCap className="h-3.5 w-3.5" />
                      ) : profile.role === "admin" ? (
                        <Star className="h-3.5 w-3.5" />
                      ) : (
                        <Users className="h-3.5 w-3.5" />
                      )}
                      {profile.role}
                    </div>
                    {xpProgress && (
                      <div className="mt-2">
                        <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black shadow-sm">
                          {xpProgress.levelTitle}
                        </span>
                      </div>
                    )}
                    {profile.bidangKeahlian && (
                      <p className="text-xs text-slate-400 font-medium mt-2">
                        {profile.bidangKeahlian}
                      </p>
                    )}
                  </div>
                  {profile.bio && (
                    <p className="text-sm text-slate-600 text-center leading-relaxed mb-4 px-2">
                      {profile.bio}
                    </p>
                  )}
                  {stats && (
                    <div className="flex items-center justify-center gap-6 mb-5">
                      <div className="text-center">
                        <div className="text-xl font-black text-slate-800">
                          {stats.followersCount}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Pengikut
                        </div>
                      </div>
                      <div className="w-px h-8 bg-slate-200" />
                      <div className="text-center">
                        <div className="text-xl font-black text-slate-800">
                          {stats.followingCount}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Mengikuti
                        </div>
                      </div>
                    </div>
                  )}
                  {friendshipStatus && !friendshipStatus.isOwnProfile && (
                    <div className="space-y-3">
                      <FollowButton
                        targetUserId={profile.id}
                        initialIsFollowing={friendshipStatus.isFollowing}
                        initialIsMutual={friendshipStatus.isMutual}
                        className="w-full"
                        size="md"
                      />
                      {friendshipStatus.isMutual && (
                        <button
                          onClick={handleStartChat}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 font-bold rounded-xl border-2 border-blue-100 hover:bg-blue-100 transition-colors text-sm"
                        >
                          <MessageCircle className="h-4 w-4" /> Kirim Pesan
                        </button>
                      )}
                    </div>
                  )}
                  {friendshipStatus?.isOwnProfile && (
                    <button
                      onClick={() => router.push("/profile")}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 text-slate-600 font-bold rounded-xl border-2 border-slate-200 hover:bg-slate-100 transition-colors text-sm"
                    >
                      Edit Profil
                    </button>
                  )}
                  <div className="mt-5 space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-4 w-4 text-teal-600" />
                      </div>
                      <span className="text-slate-600 font-medium truncate text-xs">
                        {profile.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="text-slate-600 font-medium text-xs">
                        Bergabung{" "}
                        {new Date(profile.createdAt).toLocaleDateString(
                          "id-ID",
                          { year: "numeric", month: "long", day: "numeric" },
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Stats & Activity */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    icon: (
                      <Zap
                        className="h-6 w-6 text-amber-500"
                        fill="currentColor"
                      />
                    ),
                    val: profile.level,
                    lbl: "Level",
                    bg: "bg-amber-50",
                    bdr: "border-amber-100",
                    hv: "hover:border-amber-300 hover:shadow-[0_4px_0_0_#fbbf24]",
                  },
                  {
                    icon: (
                      <Star
                        className="h-6 w-6 text-emerald-500"
                        fill="currentColor"
                      />
                    ),
                    val: profile.points.toLocaleString(),
                    lbl: "Poin",
                    bg: "bg-emerald-50",
                    bdr: "border-emerald-100",
                    hv: "hover:border-emerald-300 hover:shadow-[0_4px_0_0_#34d399]",
                  },
                  {
                    icon: <Flame className="h-6 w-6 text-orange-500" />,
                    val: profile.streak,
                    lbl: "Streak",
                    bg: "bg-orange-50",
                    bdr: "border-orange-100",
                    hv: "hover:border-orange-300 hover:shadow-[0_4px_0_0_#fb923c]",
                  },
                  {
                    icon: <Trophy className="h-6 w-6 text-purple-500" />,
                    val: profile.badges,
                    lbl: "Badge",
                    bg: "bg-purple-50",
                    bdr: "border-purple-100",
                    hv: "hover:border-purple-300 hover:shadow-[0_4px_0_0_#a855f7]",
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className={`bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-[0_4px_0_0_#cbd5e1] text-center ${s.hv} transition-all`}
                  >
                    <div
                      className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-3 border ${s.bdr}`}
                    >
                      {s.icon}
                    </div>
                    <div className="text-2xl font-black text-slate-800">
                      {s.val}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {s.lbl}
                    </div>
                  </div>
                ))}
              </div>

              {/* XP Progress */}
              {xpProgress && (
                <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-[0_6px_0_0_#cbd5e1]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap
                        className="h-5 w-5 text-amber-500"
                        fill="currentColor"
                      />
                      <span className="font-black text-slate-800">
                        Level {xpProgress.currentLevel}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        • {xpProgress.levelTitle}
                      </span>
                    </div>
                    <span className="text-sm font-black text-amber-600">
                      {profile.points.toLocaleString()} XP
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 border border-slate-200 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 h-3 rounded-full transition-all duration-700"
                      style={{ width: `${xpProgress.progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-[10px] font-bold text-slate-400">
                    <span>Lv {xpProgress.currentLevel}</span>
                    <span>
                      {xpProgress.progressXp} /{" "}
                      {xpProgress.nextLevelXp - xpProgress.currentLevelXp} XP
                    </span>
                    <span>Lv {xpProgress.currentLevel + 1}</span>
                  </div>
                </div>
              )}

              {/* Badges */}
              {earnedBadges.length > 0 && (
                <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-[0_6px_0_0_#cbd5e1]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100">
                      <Shield className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-800">
                        Badge Diperoleh
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        {earnedBadges.length} badge dikumpulkan
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {earnedBadges.map((b) => (
                      <div
                        key={b.id}
                        className="relative bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 text-center shadow-sm"
                      >
                        <div className="text-3xl mb-2">{b.icon}</div>
                        <p className="text-xs font-black text-slate-700 leading-tight">
                          {b.name}
                        </p>
                        <p className="text-[10px] font-medium text-slate-400 mt-1 line-clamp-2">
                          {b.description}
                        </p>
                        <p className="text-[9px] font-bold text-amber-500 mt-1.5">
                          {new Date(b.earnedAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Learning Stats */}
              {stats && (
                <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-[0_6px_0_0_#cbd5e1]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-800">
                        Statistik Pembelajaran
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Rekap aktivitas belajar
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-5 w-5 text-blue-600" />
                        <span className="text-xs font-bold text-blue-600 uppercase">
                          Quiz
                        </span>
                      </div>
                      <div className="text-2xl font-black text-slate-800">
                        {stats.quizAttemptCount}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Quiz dikerjakan
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-5 w-5 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-600 uppercase">
                          Skor
                        </span>
                      </div>
                      <div className="text-2xl font-black text-slate-800">
                        {stats.averageQuizScore}%
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Rata-rata skor
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-5 w-5 text-purple-600" />
                        <span className="text-xs font-bold text-purple-600 uppercase">
                          Program
                        </span>
                      </div>
                      <div className="text-2xl font-black text-slate-800">
                        {stats.totalEnrollments}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Materi diikuti
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-[0_6px_0_0_#cbd5e1]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800">
                      Aktivitas Terkini
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Kegiatan terbaru pengguna ini
                    </p>
                  </div>
                </div>
                {activities.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Activity className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-bold text-sm">
                      Belum ada aktivitas terbaru
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group"
                      >
                        <div
                          className={`w-10 h-10 ${getBg(a.type)} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}
                        >
                          {getIcon(a.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-700 text-sm truncate">
                            {a.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {formatDate(a.date)}
                          </p>
                        </div>
                        {a.xpEarned !== undefined && a.xpEarned > 0 && (
                          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                            <Zap className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-xs font-black text-emerald-600">
                              +{a.xpEarned}
                            </span>
                          </div>
                        )}
                        {a.score !== undefined && (
                          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 border border-amber-100">
                            <Star className="h-3.5 w-3.5 text-amber-500" />
                            <span className="text-xs font-black text-amber-600">
                              {a.score}/{a.totalScore}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
