"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import Loading from "@/components/ui/Loading";
import BackButton from "@/components/ui/BackButton";
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
  Lock,
  HelpCircle,
  UserCheck
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

const MemberDetail = () => {
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
      quiz_completed: <HelpCircle className="h-5 w-5 text-emerald-600" />,
      badge_earned: <Award className="h-5 w-5 text-emerald-600" />,
      forum_post: <MessageCircle className="h-5 w-5 text-emerald-600" />,
      material_read: <BookOpen className="h-5 w-5 text-emerald-600" />,
      level_up: <Trophy className="h-5 w-5 text-emerald-600" />,
      course_enrolled: <GraduationCap className="h-5 w-5 text-emerald-600" />,
      program_enrolled: <FileText className="h-5 w-5 text-emerald-600" />,
      friend_added: <Users className="h-5 w-5 text-emerald-600" />,
      attendance_marked: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
      streak_maintained: <Flame className="h-5 w-5 text-emerald-600" />,
    };
    return map[t] || <Brain className="h-5 w-5 text-emerald-600" />;
  };

  const getBg = (t: string) => {
    return "bg-emerald-50";
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
                className="Pick inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Kembali
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  const online = isOnline(profile.lastSeen);

  // Konten privat hanya terlihat jika pertemanan mutual (saling mengikuti), profil sendiri, atau jika login sebagai admin/instruktur
  const userRole = (session?.user as any)?.role;
  const canViewPrivate =
    friendshipStatus?.isOwnProfile === true ||
    friendshipStatus?.isMutual === true ||
    userRole === "admin" ||
    userRole === "super_admin" ||
    userRole === "instruktur";

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans">
      <DashboardHeader />
      <div className="flex flex-1">
        <div className="hidden lg:block h-[calc(100vh-80px)] sticky top-20">
          <Sidebar />
        </div>
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          <div className="mb-6">
            <BackButton />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* LEFT: Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white border-2 border-slate-200 rounded-[2rem] shadow-[0_6px_0_0_#cbd5e1] overflow-hidden sticky top-24 px-6 pb-6 pt-10">
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${online ? "bg-emerald-400 animate-pulse" : "bg-slate-300"}`}
                  />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                    {formatLastSeen(profile.lastSeen)}
                  </span>
                </div>
                <div className="relative">
                  <div className="flex justify-center mb-6">
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
                      ) : profile.role === "admin" || profile.role === "super_admin" ? (
                        <Star className="h-3.5 w-3.5" />
                      ) : (
                        <Users className="h-3.5 w-3.5" />
                      )}
                      {profile.role === "super_admin" ? "Super Admin" : profile.role}
                    </div>
                    {xpProgress && (
                      <div className="mt-2 flex justify-center">
                        <span className="bg-red-500 text-white px-4 py-1 rounded-full text-[10px] font-black shadow-[0_4px_0_0_#b91c1c] border-2 border-white flex items-center justify-center uppercase tracking-wider w-fit">
                          {xpProgress.levelTitle}
                        </span>
                      </div>
                    )}
                    {profile.bidangKeahlian && (
                      <p className="text-xs text-slate-400 font-medium mt-3">
                        {profile.bidangKeahlian}
                      </p>
                    )}
                  </div>
                  {profile.bio && (
                    <p className="text-sm text-slate-600 text-center leading-relaxed mb-6 px-2">
                      {profile.bio}
                    </p>
                  )}
                  {stats && (
                    <div className="flex items-center justify-center gap-8 mb-6 border-y border-slate-50 py-4">
                      <div className="text-center">
                        <div className="text-2xl font-black text-slate-800 leading-none">
                          {stats.followersCount}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                          Pengikut
                        </div>
                      </div>
                      <div className="w-px h-10 bg-slate-100" />
                      <div className="text-center">
                        <div className="text-2xl font-black text-slate-800 leading-none">
                          {stats.followingCount}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                          Mengikuti
                        </div>
                      </div>
                    </div>
                  )}
                  {friendshipStatus && !friendshipStatus.isOwnProfile && (
                    <div className="space-y-3">
                      {friendshipStatus.isMutual && (
                        <button
                          onClick={handleStartChat}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-600 font-bold rounded-2xl border-2 border-emerald-100 hover:bg-emerald-100 transition-colors text-sm shadow-sm"
                        >
                          <MessageCircle className="h-4 w-4" /> Kirim Pesan
                        </button>
                      )}
                    </div>
                  )}
                  {friendshipStatus?.isOwnProfile && (
                    <button
                      onClick={() => router.push("/profile")}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-600 font-bold rounded-2xl border-2 border-slate-200 hover:bg-slate-100 transition-colors text-sm shadow-sm"
                    >
                      Edit Profil
                    </button>
                  )}
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-4 text-sm bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                        <Mail className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex flex-col min-w-0">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Email</span>
                         <span className="text-slate-600 font-bold truncate text-xs">{profile.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                        <Calendar className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Terdaftar</span>
                         <span className="text-slate-600 font-bold text-xs">
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
            </div>

            {/* RIGHT: Stats & Activity */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    icon: null,
                    val: profile.level,
                    lbl: "LEVEL",
                    bg: "bg-emerald-50",
                    bdr: "border-emerald-100",
                    hv: "hover:border-emerald-300 hover:shadow-[0_4px_0_0_#10b981]",
                  },
                  {
                    icon: (
                      <Zap
                        className="h-7 w-7 text-emerald-500"
                        fill="currentColor"
                      />
                    ),
                    val: canViewPrivate ? profile.points.toLocaleString() : "—",
                    lbl: "TOTAL XP",
                    bg: "bg-emerald-50",
                    bdr: "border-emerald-100",
                    hv: "hover:border-emerald-300 hover:shadow-[0_4px_0_0_#10b981]",
                  },
                  {
                    icon: <Flame className="h-7 w-7 text-emerald-500" />,
                    val: profile.streak,
                    lbl: "STREAK",
                    bg: "bg-emerald-50",
                    bdr: "border-emerald-100",
                    hv: "hover:border-emerald-300 hover:shadow-[0_4px_0_0_#10b981]",
                  },
                  {
                    icon: <Award className="h-7 w-7 text-emerald-500" />,
                    val: profile.badges,
                    lbl: "BADGE",
                    bg: "bg-emerald-50",
                    bdr: "border-emerald-100",
                    hv: "hover:border-emerald-300 hover:shadow-[0_4px_0_0_#10b981]",
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className={`flex flex-col items-center justify-center p-4 rounded-3xl ${s.bg} border-2 ${s.bdr} transition-all duration-300 ${s.hv} group cursor-default h-full min-h-[140px]`}
                  >
                    {s.icon && (
                      <div className="w-14 h-14 bg-white/50 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-white/50">
                        {s.icon}
                      </div>
                    )}
                    <div className="text-3xl font-black text-slate-800 group-hover:text-slate-900 leading-none mb-1">
                      {s.val}
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {s.lbl}
                    </div>
                  </div>
                ))}
              </div>

              {/* XP Progress — hanya untuk pertemanan mutual atau profil sendiri */}
              {canViewPrivate && xpProgress && (
                <div className="bg-white border-2 border-slate-200 rounded-[2.5rem] p-8 shadow-[0_8px_0_0_#cbd5e1]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                        <Zap className="h-6 w-6 text-emerald-500" fill="currentColor" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-xl text-slate-800 leading-none">Level {xpProgress.currentLevel}</span>
                        <span className="text-xs font-bold text-slate-400">{xpProgress.levelTitle}</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="text-xl font-black text-amber-500 block leading-none">{profile.points.toLocaleString()} XP</span>
                       <span className="text-[10px] font-black text-slate-300 uppercase">Total Pengalaman</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-4 border-2 border-slate-200 overflow-hidden p-0.5">
                    <div
                      className="bg-yellow-400 rounded-full shadow-[0_2px_0_0_#ca8a04] h-full transition-all duration-1000 ease-out relative"
                      style={{ width: `${xpProgress.progressPercent}%` }}
                    >
                      <div className="absolute top-0 right-2 w-2 h-full bg-white/40 rounded-full skew-x-[-20deg]" />
                      <div className="absolute top-0 right-5 w-1 h-full bg-white/30 rounded-full skew-x-[-20deg]" />
                    </div>
                  </div>
                  <div className="flex justify-between mt-2.5 text-[11px] font-black tracking-tight text-slate-400">
                    <span className="bg-slate-50 px-3 py-1 rounded-full">Lv {xpProgress.currentLevel}</span>
                    <span className="flex items-center gap-1 font-bold">
                       <span className="text-amber-500">{xpProgress.progressXp}</span> / <span className="text-slate-500">{xpProgress.nextLevelXp - xpProgress.currentLevelXp} XP</span>
                    </span>
                    <span className="bg-slate-50 px-3 py-1 rounded-full">Lv {xpProgress.currentLevel + 1}</span>
                  </div>
                </div>
              )}

              {/* Badges */}
              {earnedBadges.length > 0 && (
                <div className="bg-white border-2 border-slate-200 rounded-[2.5rem] p-8 shadow-[0_8px_0_0_#cbd5e1]">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center border-2 border-emerald-100">
                        <Shield className="h-8 w-8 text-emerald-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-800 leading-none mb-1">
                          Badge Diperoleh
                        </h2>
                        <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">
                          {earnedBadges.length} Badge telah terkumpul
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                    {earnedBadges.map((b) => (
                      <div
                        key={b.id}
                        className="group relative bg-slate-50/50 border-2 border-slate-200 rounded-3xl p-5 text-center transition-all hover:bg-white hover:border-emerald-300 hover:shadow-lg hover:-translate-y-1"
                      >
                        <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{b.icon}</div>
                        <h4 className="text-sm font-black text-slate-800 leading-tight mb-1">
                          {b.name}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400 mb-3 line-clamp-2">
                          {b.description}
                        </p>
                        <div className="inline-block px-3 py-1 bg-white border border-slate-100 rounded-full text-[9px] font-black text-emerald-600 shadow-sm">
                          {new Date(b.earnedAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm scale-0 group-hover:scale-100 transition-transform">
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Learning Stats — hanya untuk pertemanan mutual atau profil sendiri */}
              {canViewPrivate && stats && (
                <div className="bg-white border-2 border-slate-200 rounded-[2.5rem] p-8 shadow-[0_8px_0_0_#cbd5e1] relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 scale-150 opacity-[0.03] rotate-12 pointer-events-none">
                      <TrendingUp className="w-32 h-32 text-emerald-600" />
                   </div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center border-2 border-emerald-100">
                      <TrendingUp className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-800 leading-none mb-1">
                        Statistik Pembelajaran
                      </h2>
                      <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">
                        Ringkasan Pencapaian Utama
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-50 rounded-3xl p-6 border-2 border-slate-100 hover:border-emerald-200 transition-colors group">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <HelpCircle className="h-5 w-5 text-emerald-600" />
                        </div>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                          Quiz
                        </span>
                      </div>
                      <div className="text-4xl font-black text-slate-800 mb-1 leading-none">
                        {stats.quizAttemptCount}
                      </div>
                      <div className="text-[11px] text-slate-500 font-bold">
                        Quiz telah diselesaikan
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-3xl p-6 border-2 border-slate-100 hover:border-emerald-200 transition-colors group">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <Target className="h-5 w-5 text-emerald-600" />
                        </div>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                          Rata-Rata
                        </span>
                      </div>
                      <div className="text-4xl font-black text-slate-800 mb-1 leading-none">
                        {stats.averageQuizScore}%
                      </div>
                      <div className="text-[11px] text-slate-500 font-bold">
                        Skor quiz rata-rata
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-3xl p-6 border-2 border-slate-100 hover:border-emerald-200 transition-colors group">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <GraduationCap className="h-5 w-5 text-emerald-600" />
                        </div>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                          Materi
                        </span>
                      </div>
                      <div className="text-4xl font-black text-slate-800 mb-1 leading-none">
                        {stats.totalEnrollments}
                      </div>
                      <div className="text-[11px] text-slate-500 font-bold">
                        Program Kurikulum yang sedang diikuti
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Activity — hanya untuk pertemanan mutual atau profil sendiri */}
              {canViewPrivate && (
                <div className="bg-white border-2 border-slate-200 rounded-[2.5rem] p-8 shadow-[0_8px_0_0_#cbd5e1]">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center border-2 border-emerald-100">
                        <Activity className="h-8 w-8 text-emerald-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-800 leading-none mb-1">
                          Aktivitas Terkini
                        </h2>
                        <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">
                           Jejak belajar terbaru
                        </p>
                      </div>
                    </div>
                  </div>
                  {activities.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Activity className="h-10 w-10 text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-black text-sm uppercase tracking-wide">
                        Belum ada aktivitas
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center gap-5 p-5 rounded-3xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:border-emerald-200 hover:shadow-md transition-all group"
                        >
                          <div
                            className={`w-12 h-12 ${getBg(a.type)} rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100 group-hover:scale-105 transition-transform`}
                          >
                            {getIcon(a.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-black text-slate-700 text-sm truncate mb-0.5">
                              {a.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">
                              {formatDate(a.date)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {a.xpEarned !== undefined && a.xpEarned > 0 && (
                              <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm">
                                <Zap className="h-4 w-4 text-emerald-500" fill="currentColor" />
                                <span className="text-xs font-black text-emerald-600">
                                  +{a.xpEarned} XP
                                </span>
                              </div>
                            )}
                            {a.score !== undefined && (
                              <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm">
                                <Star className="h-4 w-4 text-emerald-500" fill="currentColor" />
                                <span className="text-xs font-black text-emerald-600">
                                  {a.score}/{a.totalScore}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Locked Card — tampil saat belum berteman */}
              {!canViewPrivate && (
                <div className="bg-white border-2 border-slate-200 rounded-[2.5rem] p-12 shadow-[0_10px_0_0_#cbd5e1] text-center relative overflow-hidden group">
                   <div className="absolute inset-0 bg-linear-to-b from-slate-50/0 via-slate-50/50 to-slate-100/80 backdrop-blur-[1px] pointer-events-none" />
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 border-4 border-slate-100 shadow-xl group-hover:rotate-12 transition-transform duration-500">
                      <Lock className="h-12 w-12 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-4">
                      Profil Ini Dikunci
                    </h3>
                    <p className="text-sm text-slate-500 font-bold leading-relaxed mb-8 max-w-sm mx-auto uppercase tracking-wide">
                      Bertemanlah dengan {" "}
                      <span className="text-emerald-600">
                        {profile.name?.split(" ")[0]}
                      </span>{" "}
                      untuk mendapatkan akses penuh ke total XP, statistik belajar, and aktivitas harian mereka.
                    </p>
                    
                    {!session?.user ? (
                      <button
                        onClick={() => router.push("/auth")}
                        className="inline-flex items-center gap-3 px-8 py-4 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 border-b-4 border-emerald-700 hover:border-b-2 transition-all shadow-lg text-sm"
                      >
                        <Users className="h-5 w-5" />
                        MULAI BERTEMAN SEKARANG
                      </button>
                    ) : friendshipStatus?.isFollowing &&
                      !friendshipStatus?.isMutual ? (
                      <div className="inline-flex items-center gap-3 px-6 py-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl text-emerald-700 font-black text-sm shadow-inner">
                        <Star className="h-5 w-5 animate-spin-slow text-emerald-500" fill="currentColor" />
                        MENUNGGU KONFIRMASI DARI {profile.name?.split(" ")[0].toUpperCase()}
                      </div>
                    ) : (
                      friendshipStatus?.isFollowedBy && (
                        <div className="bg-emerald-50 px-6 py-4 rounded-2xl border-2 border-emerald-100 text-emerald-700 font-black text-sm animate-bounce shadow-md">
                          ✨ {profile.name?.split(" ")[0].toUpperCase()} MENUNGGU KAMU FOLLOW BACK!
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <ChatbotButton />
    </div>
  );
};

export default MemberDetail;
