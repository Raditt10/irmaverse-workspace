"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import FollowButton from "@/components/ui/FollowButton";
import Loading from "@/components/ui/Loading";
import {
  Users,
  Search,
  UserPlus,
  MessageCircle,
  Trophy,
  Zap,
  User as UserIcon,
  UserCheck,
  Handshake,
  Sparkles,
} from "lucide-react";
import PageBanner from "@/components/ui/PageBanner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Tab = "friends" | "followers" | "following" | "suggestions";

interface FriendUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  level: number;
  points: number;
  lastSeen: string;
  bio: string | null;
  role: string;
  friendshipId?: string;
  friendshipStatus?: string;
  iFollowBack?: boolean;
}

interface FriendCounts {
  followers: number;
  following: number;
  friends: number;
}

export default function FriendsPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<FriendUser[]>([]);
  const [counts, setCounts] = useState<FriendCounts>({
    followers: 0,
    following: 0,
    friends: 0,
  });
  const [loading, setLoading] = useState(true);

  // Hanya role "user" yang bisa mengakses halaman Teman Belajar
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session?.user) {
      router.replace("/auth");
      return;
    }
    if ((session.user as any).role !== "user") {
      router.replace("/overview");
    }
  }, [session, sessionStatus, router]);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/friends/count");
      if (res.ok) {
        const data = await res.json();
        setCounts(data);
      }
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tab: activeTab,
        ...(searchQuery ? { search: searchQuery } : {}),
      });
      const res = await fetch(`/api/friends?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUsers();
      fetchCounts();
    }
  }, [session?.user?.id, activeTab]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (session?.user?.id) {
        fetchUsers();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isOnline = (lastSeen: string) => {
    const diff = Date.now() - new Date(lastSeen).getTime();
    return diff < 5 * 60 * 1000;
  };

  const formatLastSeen = (lastSeen: string) => {
    const diff = Date.now() - new Date(lastSeen).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    if (minutes < 5) return "Online";
    if (minutes < 60) return `${minutes}m lalu`;
    if (hours < 24) return `${hours}j lalu`;
    return `${Math.floor(hours / 24)}h lalu`;
  };

  const tabs: {
    key: Tab;
    label: string;
    icon: React.ReactNode;
    count: number;
  }[] = [
    {
      key: "friends",
      label: "Teman",
      icon: <Handshake className="h-4 w-4" />,
      count: counts.friends,
    },
    {
      key: "followers",
      label: "Pengikut",
      icon: <Users className="h-4 w-4" />,
      count: counts.followers,
    },
    {
      key: "following",
      label: "Mengikuti",
      icon: <UserCheck className="h-4 w-4" />,
      count: counts.following,
    },
    {
      key: "suggestions",
      label: "Saran",
      icon: <Sparkles className="h-4 w-4" />,
      count: 0,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans">
      <DashboardHeader />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          {/* ─── HEADER ─── */}
          <PageBanner
            title="Teman Belajar"
            description="Temukan dan berinteraksi dengan teman sesama pejuang ilmu."
            icon={Handshake}
            tag="Bestie"
            tagIcon={Handshake}
            className="mb-8"
          />

          {/* ─── TABS ─── */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-bold text-xs sm:text-sm border-2 transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-100"
                    : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-600"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      activeTab === tab.key
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ─── SEARCH ─── */}
          <div className="bg-white border-2 border-slate-200 rounded-4xl p-4 lg:p-6 mb-8 shadow-[0_6px_0_0_#cbd5e1] max-w-md">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder={
                  activeTab === "suggestions"
                    ? "Cari pengguna untuk diikuti..."
                    : "Cari nama atau email..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-400 focus:bg-white rounded-2xl transition-all font-bold text-slate-700 outline-none"
              />
            </div>
          </div>

          {/* ─── CONTENT ─── */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loading text="Memuat..." size="lg" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border-4 border-slate-100 border-dashed">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                {activeTab === "suggestions" ? (
                  <Sparkles className="h-10 w-10 text-slate-300" />
                ) : (
                  <Handshake className="h-10 w-10 text-slate-300" />
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-700 text-center px-4">
                {activeTab === "friends" && "Belum ada teman"}
                {activeTab === "followers" && "Belum ada pengikut"}
                {activeTab === "following" && "Belum mengikuti siapapun"}
                {activeTab === "suggestions" && "Tidak ada saran saat ini"}
              </h3>
              <p className="text-slate-400 font-medium mt-1 text-center px-6 text-xs sm:text-sm">
                {activeTab === "suggestions"
                  ? "Kamu sudah mengikuti semua pengguna!"
                  : "Mulai ikuti pengguna lain untuk membangun koneksi."}
              </p>
              {activeTab !== "suggestions" &&
                (activeTab as any) === "NEVER_SHOW_THIS" && (
                  <button
                    onClick={() => setActiveTab("suggestions")}
                    className="mt-4 flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    Cari Teman Baru
                  </button>
                )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-10">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-white border-2 border-slate-200 rounded-[2.5rem] p-8 shadow-[0_8px_0_0_#cbd5e1] hover:border-emerald-400 hover:shadow-[0_8px_0_0_#34d399] hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden flex flex-col"
                >
                  {/* Status Indicator */}
                  <div className="absolute top-6 right-6 flex items-center gap-1.5">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        isOnline(user.lastSeen)
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-slate-300"
                      }`}
                    />
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">
                      {formatLastSeen(user.lastSeen)}
                    </span>
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative group-hover:scale-105 transition-transform duration-500">
                      <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-slate-50 shadow-md">
                        <AvatarImage
                          src={
                            user.avatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`
                          }
                          alt={user.name || "User"}
                        />
                        <AvatarFallback className="bg-emerald-500 text-white font-black text-2xl">
                          {(user.name || "U").substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl md:text-2xl font-black text-slate-800 truncate group-hover:text-emerald-600 transition-colors leading-tight">
                        {user.name || "Pengguna"}
                      </h3>
                      <p className="text-sm font-bold text-slate-400 truncate mb-3">
                        {user.email}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl border-2 border-amber-100 text-xs font-black uppercase">
                          <Zap className="h-3.5 w-3.5" fill="currentColor" />
                          Lvl {user.level}
                        </div>
                        <span className="text-xs font-black text-slate-300 uppercase tracking-widest">
                          {user.points.toLocaleString()} XP
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bio preview */}
                  {user.bio && (
                    <p className="text-sm text-slate-500 font-bold mb-6 line-clamp-3 leading-relaxed italic border-l-4 border-emerald-100 pl-4 py-1">
                      "{user.bio}"
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 mt-auto">
                    <button
                      onClick={() => router.push(`/u/${user.id}`)}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-white text-slate-600 font-black rounded-2xl border-2 border-slate-200 border-b-4 hover:bg-slate-50 hover:border-slate-300 active:border-b-2 active:translate-y-0.5 transition-all text-sm"
                    >
                      <UserIcon className="h-5 w-5" /> Profil
                    </button>
                    {activeTab === "friends" &&
                      session?.user?.id !== user.id && (
                        <button
                          onClick={() =>
                            router.push(`/friends/chat?userId=${user.id}`)
                          }
                          className="w-full flex items-center justify-center gap-2 py-3.5 bg-teal-400 text-white font-black rounded-2xl border-2 border-teal-600 border-b-4 hover:bg-teal-500 hover:shadow-lg active:border-b-2 active:translate-y-0.5 transition-all text-sm shadow-sm"
                        >
                          <MessageCircle className="h-5 w-5" /> Chat
                        </button>
                      )}
                  </div>
                  
                  <div className="mt-4">
                    {session?.user?.id !== user.id && ( // Hide if it's ourself (rare but good check)
                      <FollowButton
                        targetUserId={user.id}
                        initialIsFollowing={
                          activeTab === "friends" ||
                          activeTab === "following" ||
                          !!user.iFollowBack
                        }
                        initialIsMutual={
                          activeTab === "friends" ||
                          (activeTab === "followers" && !!user.iFollowBack)
                        }
                        size="lg"
                        className="w-full"
                        onStatusChange={() => {
                          fetchCounts();
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
