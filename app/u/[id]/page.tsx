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
  UserCheck,
  MessageCircle,
  Zap,
  Target,
  TrendingUp,
  GraduationCap,
  Brain,
  Flame,
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
  date: string;
  score?: number;
  totalScore?: number;
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
  const [friendshipStatus, setFriendshipStatus] =
    useState<FriendshipStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchProfile();
      if (session?.user?.id) {
        fetchFriendshipStatus();
      }
    }
  }, [userId, session?.user?.id]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/friends/profile/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data.user);
      setStats(data.stats);
      setActivities(data.recentActivities || []);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendshipStatus = async () => {
    try {
      const res = await fetch(`/api/friends/status/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setFriendshipStatus(data);
      }
    } catch (error) {
      console.error("Error fetching friendship status:", error);
    }
  };

  const handleStartChat = () => {
    // Navigasi ke halaman chat dengan user ini
    router.push(`/chat-rooms?userId=${userId}`);
  };

  const isOnline = (lastSeen: string) => {
    const diff = Date.now() - new Date(lastSeen).getTime();
    return diff < 5 * 60 * 1000; // 5 menit
  };

  const formatLastSeen = (lastSeen: string) => {
    const diff = Date.now() - new Date(lastSeen).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 5) return "Online";
    if (minutes < 60) return `${minutes} menit yang lalu`;
    if (hours < 24) return `${hours} jam yang lalu`;
    return `${days} hari yang lalu`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loading text="Memuat profil..." size="lg" />
      </div>
    );
  }

  if (!profile) {
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
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const online = isOnline(profile.lastSeen);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans">
      <DashboardHeader />

      <div className="flex flex-1">
        <div className="hidden lg:block h-[calc(100vh-80px)] sticky top-20">
          <Sidebar />
        </div>

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 mb-6 transition-colors font-bold text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* ─── LEFT COLUMN: Profile Card ─── */}
            <div className="lg:col-span-1">
              <div className="bg-white border-2 border-slate-200 rounded-[2rem] shadow-[0_6px_0_0_#cbd5e1] overflow-hidden sticky top-24">
                {/* Banner gradient */}
                <div className="h-28 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 relative">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M0%2030%20Q15%200%2030%2030%20T60%2030%22%20fill%3D%22none%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.15)%22%20stroke-width%3D%222%22/%3E%3C/svg%3E')] opacity-50" />
                  {/* Online Status */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        online ? "bg-emerald-400 animate-pulse" : "bg-slate-300"
                      }`}
                    />
                    <span className="text-[10px] font-black text-white uppercase tracking-tight">
                      {formatLastSeen(profile.lastSeen)}
                    </span>
                  </div>
                </div>

                {/* Avatar */}
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

                  {/* Name & Role */}
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
                    {profile.bidangKeahlian && (
                      <p className="text-xs text-slate-400 font-medium mt-2">
                        {profile.bidangKeahlian}
                      </p>
                    )}
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-sm text-slate-600 text-center leading-relaxed mb-4 px-2">
                      {profile.bio}
                    </p>
                  )}

                  {/* Followers / Following */}
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

                  {/* Action Buttons */}
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
                          <MessageCircle className="h-4 w-4" />
                          Kirim Pesan
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

                  {/* Info Items */}
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
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── RIGHT COLUMN: Stats & Activity ─── */}
            <div className="lg:col-span-2 space-y-6">
              {/* Gamification Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-[0_4px_0_0_#cbd5e1] text-center hover:border-amber-300 hover:shadow-[0_4px_0_0_#fbbf24] transition-all">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-3 border border-amber-100">
                    <Zap
                      className="h-6 w-6 text-amber-500"
                      fill="currentColor"
                    />
                  </div>
                  <div className="text-2xl font-black text-slate-800">
                    {profile.level}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Level
                  </div>
                </div>

                <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-[0_4px_0_0_#cbd5e1] text-center hover:border-emerald-300 hover:shadow-[0_4px_0_0_#34d399] transition-all">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                    <Star
                      className="h-6 w-6 text-emerald-500"
                      fill="currentColor"
                    />
                  </div>
                  <div className="text-2xl font-black text-slate-800">
                    {profile.points.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Poin
                  </div>
                </div>

                <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-[0_4px_0_0_#cbd5e1] text-center hover:border-orange-300 hover:shadow-[0_4px_0_0_#fb923c] transition-all">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-3 border border-orange-100">
                    <Flame className="h-6 w-6 text-orange-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-800">
                    {profile.streak}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Streak
                  </div>
                </div>

                <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-[0_4px_0_0_#cbd5e1] text-center hover:border-purple-300 hover:shadow-[0_4px_0_0_#a855f7] transition-all">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-3 border border-purple-100">
                    <Trophy className="h-6 w-6 text-purple-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-800">
                    {profile.badges}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Badge
                  </div>
                </div>
              </div>

              {/* Statistik Pembelajaran */}
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

              {/* Aktivitas Terkini */}
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
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                          <Brain className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-700 text-sm truncate">
                            {activity.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {new Date(activity.date).toLocaleDateString(
                              "id-ID",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </p>
                        </div>
                        {activity.score !== undefined && (
                          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 border border-amber-100">
                            <Star className="h-3.5 w-3.5 text-amber-500" />
                            <span className="text-xs font-black text-amber-600">
                              {activity.score}/{activity.totalScore}
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
