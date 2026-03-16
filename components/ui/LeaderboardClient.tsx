"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Crown,
  Search,
  Zap,
  Flame,
  Users,
  Award,
  Filter,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SuccessDataFound from "@/components/ui/SuccessDataFound";
import EmptyState from "@/components/ui/EmptyState";

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
  points: number;
  badges: number;
  level: number;
  streak: number;
  globalRank: number;
}

interface Props {
  users: LeaderboardUser[];
  currentUserId: string;
  currentUserRole: string;
}

const getRoleLabel = (role: string) => {
  if (role === "instruktur") return "Instruktur";
  if (role === "admin") return "Admin";
  if (role === "super_admin") return "Super Admin";
  return "Anggota";
};

const avatarSrc = (u: LeaderboardUser) =>
  u.avatar ||
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name ?? "user")}`;

export default function LeaderboardClient({ users, currentUserId, currentUserRole }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = users;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((u) => u.name?.toLowerCase().includes(q));
    }

    // Re-rank after filtering
    return result.map((u, i) => ({ ...u, globalRank: i + 1 }));
  }, [users, search]);

  const topThree = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  const currentUser = users.find((u) => u.id === currentUserId);
  const currentUserRank = useMemo(() => {
    const idx = filtered.findIndex((u) => u.id === currentUserId);
    return idx >= 0 ? idx + 1 : null;
  }, [filtered, currentUserId]);

  // Stats
  const stats = useMemo(() => {
    const totalXp = users.reduce((sum, u) => sum + u.points, 0);
    const highestStreak = Math.max(...users.map((u) => u.streak), 0);
    const totalBadges = users.reduce((sum, u) => sum + u.badges, 0);
    return { totalXp, highestStreak, totalBadges };
  }, [users]);

  return (
    <>
      {/* ── STATS STRIP ──────────────────────────────────────────────────── */}
      {currentUserRole === "user" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          {[
            {
              icon: <Trophy className="h-4 w-4 text-emerald-500" />,
              label: "Peringkatmu",
              value: currentUserRank ? `#${currentUserRank}` : "—",
              bg: "bg-emerald-50/80",
              border: "border-emerald-200",
              className: "col-span-1"
            },
            {
              icon: <Flame className="h-4 w-4 text-emerald-500" />,
              label: "Streak Tertinggi",
              value: `${stats.highestStreak} hari`,
              bg: "bg-teal-50/80",
              border: "border-teal-200",
              className: "col-span-1"
            },
            {
              icon: <Award className="h-4 w-4 text-emerald-500" />,
              label: "Total Badge",
              value: stats.totalBadges,
              bg: "bg-emerald-50/50",
              border: "border-emerald-200",
              className: "col-span-2 md:col-span-1 max-w-45 mx-auto w-full md:max-w-none"
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`${s.bg} border-2 ${s.border} rounded-2xl p-3 flex items-center justify-center md:justify-start gap-3 ${s.className}`}
            >
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center border border-slate-100 shrink-0">
                {s.icon}
              </div>
              <div className="min-w-0 text-center md:text-left">
                <div className="text-base sm:text-lg font-black text-slate-800 leading-none">
                  {s.value}
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PODIUM ───────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto mb-16 px-4">
        <div className="grid grid-cols-3 items-end gap-2 sm:gap-4 md:gap-8 pt-12 relative overflow-visible">
          {/* 2nd place slot */}
          <div className="flex flex-col items-center">
            {topThree[1] ? (
              <div className="flex flex-col items-center group w-full animate-in slide-in-from-bottom-4 duration-500">
                <div className="relative -mb-3 sm:-mb-3.75 z-20 transition-transform group-hover:-translate-y-2">
                  <Avatar className="w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24 border-[3px] border-emerald-300 shadow-xl mx-auto bg-white ring-4 ring-emerald-50">
                    <AvatarImage src={avatarSrc(topThree[1])} />
                    <AvatarFallback className="bg-emerald-100 font-black text-emerald-700 text-base sm:text-xl">
                      {(topThree[1].name ?? "?")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-black border-2 border-white text-[10px] sm:text-xs md:text-sm shadow-lg">
                    2
                  </div>
                </div>
                <div
                  onClick={() => router.push(`/u/${topThree[1].id}`)}
                  className="cursor-pointer w-full h-20 sm:h-32 md:h-36 bg-linear-to-b from-emerald-50/80 to-white rounded-t-3xl sm:rounded-t-[2.5rem] border-[3px] border-emerald-200 border-b-0 flex flex-col items-center pt-6 sm:pt-10 md:pt-12 shadow-sm relative z-10 hover:bg-emerald-50 transition-colors"
                >
                  <p className="font-black text-emerald-800 text-[8px] sm:text-[11px] md:text-sm px-1 text-center line-clamp-1 w-full">
                    {topThree[1].name}
                  </p>
                  <div className="mt-1 md:mt-2 bg-white px-1.5 sm:px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 shadow-xs">
                    <Zap className="h-2 w-2 sm:h-3 sm:w-3 text-emerald-500" />
                    <p className="text-[7px] sm:text-[10px] md:text-xs font-black text-emerald-600">
                      {topThree[1].points.toLocaleString()}
                    </p>
                  </div>
                  <span className="hidden sm:block mt-1 text-[7px] md:text-[8px] font-bold text-emerald-600/60 uppercase tracking-tighter">
                    Lv.{topThree[1].level} • {getRoleLabel(topThree[1].role)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full h-20 sm:h-32 md:h-44 bg-slate-50/30 rounded-t-3xl sm:rounded-t-[2.5rem] border-[3px] border-slate-100 border-b-0 border-dashed" />
            )}
          </div>

          {/* 1st place slot */}
          <div className="flex flex-col items-center">
            {topThree[0] ? (
              <div className="flex flex-col items-center group w-full z-10 -mt-6 sm:-mt-10 animate-in zoom-in duration-700">
                <div className="relative mb-3 md:mb-5 z-20 transition-transform group-hover:-translate-y-3">
                  <div className="absolute -top-6 sm:-top-10 left-1/2 -translate-x-1/2">
                    <Crown className="w-6 h-6 sm:w-10 sm:h-10 md:w-12 md:h-12 text-amber-400 fill-amber-400 drop-shadow-[0_4px_8px_rgba(251,191,36,0.5)] animate-bounce" />
                  </div>
                  <Avatar className="w-16 h-16 sm:w-28 sm:h-28 md:w-32 md:h-32 border-4 border-emerald-400 shadow-2xl mx-auto bg-white ring-8 ring-emerald-100/50">
                    <AvatarImage src={avatarSrc(topThree[0])} />
                    <AvatarFallback className="bg-emerald-200 font-black text-emerald-800 text-xl sm:text-3xl">
                      {(topThree[0].name ?? "?")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-linear-to-br from-emerald-500 to-emerald-600 text-white w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-black border-4 border-white shadow-xl text-xs sm:text-lg md:text-xl">
                    1
                  </div>
                </div>
                <div
                  onClick={() => router.push(`/u/${topThree[0].id}`)}
                  className="cursor-pointer w-full h-28 sm:h-44 md:h-56 bg-linear-to-b from-emerald-100/50 to-white rounded-t-4xl sm:rounded-t-[3.5rem] border-4 border-emerald-400 border-b-0 flex flex-col items-center pt-8 sm:pt-12 md:pt-16 shadow-lg relative z-0 hover:from-emerald-100 transition-colors"
                >
                  <p className="font-black text-emerald-900 text-[10px] sm:text-sm md:text-lg px-1 text-center line-clamp-1 w-full">
                    {topThree[0].name}
                  </p>
                  <div className="mt-1.5 sm:mt-3 bg-emerald-500 px-2 sm:px-4 py-0.5 sm:py-1.5 rounded-full border-2 border-emerald-600 shadow-lg flex items-center gap-1.5 sm:gap-2">
                    <Zap className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-white fill-white" />
                    <p className="text-[9px] sm:text-xs md:text-base font-black text-white">
                      {topThree[0].points.toLocaleString()}
                    </p>
                  </div>
                  <span className="hidden sm:block mt-1.5 sm:mt-2 text-[8px] sm:text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                    Lv.{topThree[0].level} • {getRoleLabel(topThree[0].role)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full h-28 sm:h-44 md:h-64 bg-slate-50/50 rounded-t-4xl sm:rounded-t-[3.5rem] border-4 border-slate-200 border-b-0 border-dashed" />
            )}
          </div>

          {/* 3rd place slot */}
          <div className="flex flex-col items-center">
            {topThree[2] ? (
              <div className="flex flex-col items-center group w-full animate-in slide-in-from-bottom-4 duration-500 delay-150">
                <div className="relative -mb-3 sm:-mb-3.75 z-20 transition-transform group-hover:-translate-y-2">
                  <Avatar className="w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24 border-[3px] border-emerald-200 shadow-lg mx-auto bg-white ring-4 ring-slate-50">
                    <AvatarImage src={avatarSrc(topThree[2])} />
                    <AvatarFallback className="bg-slate-100 font-black text-slate-600 text-base sm:text-xl">
                      {(topThree[2].name ?? "?")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-emerald-400 text-white w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-black border-2 border-white text-[10px] sm:text-xs md:text-sm shadow-md">
                    3
                  </div>
                </div>
                <div
                  onClick={() => router.push(`/u/${topThree[2].id}`)}
                  className="cursor-pointer w-full h-18 sm:h-28 md:h-32 bg-linear-to-b from-slate-50/80 to-white rounded-t-3xl sm:rounded-t-[2.5rem] border-[3px] border-emerald-100 border-b-0 flex flex-col items-center pt-6 sm:pt-10 md:pt-12 shadow-inner relative z-10 hover:bg-slate-50 transition-colors"
                >
                  <p className="font-black text-emerald-700 text-[8px] sm:text-[11px] md:text-sm px-1 text-center line-clamp-1 w-full">
                    {topThree[2].name}
                  </p>
                  <div className="mt-1 md:mt-2 bg-white px-1.5 sm:px-2 py-0.5 rounded-full border border-slate-100 flex items-center gap-1 shadow-xs">
                    <Zap className="h-2 w-2 sm:h-3 sm:w-3 text-emerald-400" />
                    <p className="text-[7px] sm:text-[10px] md:text-xs font-black text-emerald-500">
                      {topThree[2].points.toLocaleString()}
                    </p>
                  </div>
                  <span className="hidden sm:block mt-1 text-[7px] md:text-[8px] font-bold text-emerald-400/60 uppercase tracking-tighter">
                    Lv.{topThree[2].level} • {getRoleLabel(topThree[2].role)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full h-18 sm:h-28 md:h-32 bg-slate-50/20 rounded-t-3xl sm:rounded-t-[2.5rem] border-[3px] border-slate-50 border-b-0 border-dashed" />
            )}
          </div>
        </div>
      </div>

      {/* ── FILTERS & SEARCH ─────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-2">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 bg-white border-2 border-slate-200 rounded-2xl flex items-center px-4 py-2.5 transition-all focus-within:border-emerald-400 focus-within:shadow-[0_0_0_3px_#d1fae5]">
            <Search className="w-4 h-4 md:w-5 md:h-5 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Cari peserta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent outline-none font-bold text-sm md:text-base text-slate-600 placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* Filter active indicator */}
        {search.trim() && filtered.length > 0 && (
          <SuccessDataFound
            message={`Menampilkan ${filtered.length} dari ${users.length} peserta`}
          />
        )}

        {filtered.length === 0 && (
          <EmptyState
            icon="search"
            title="Tidak ditemukan"
            description="Coba gunakan kata kunci lain untuk mencari peserta."
            actionLabel="Reset Pencarian"
            onAction={() => setSearch("")}
          />
        )}

        {/* Column headers */}
        {rest.length > 0 && (
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            <div className="col-span-2 sm:col-span-1 text-center">Rank</div>
            <div className="col-span-7 sm:col-span-8">Peserta</div>
            <div className="col-span-3 text-right">XP</div>
          </div>
        )}

        {/* Rows */}
        <div className="space-y-2">
          {rest.map((u) => {
            const isMe = u.id === currentUserId;
            return (
              <div
                key={u.id}
                onClick={() => router.push(`/u/${u.id}`)}
                className={`cursor-pointer grid grid-cols-12 gap-2 p-3 items-center rounded-2xl border-2 transition-all hover:scale-[1.01] ${
                  isMe
                    ? "bg-teal-50 border-teal-400 shadow-[0_4px_0_0_#5eead4]"
                    : "bg-white border-slate-100 hover:border-slate-200"
                }`}
              >
                {/* Rank */}
                <div className="col-span-2 sm:col-span-1 flex justify-center">
                  <div
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-black text-sm md:text-base ${
                      isMe
                        ? "bg-teal-500 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {u.globalRank}
                  </div>
                </div>

                {/* Profile */}
                <div className="col-span-7 sm:col-span-8 flex items-center gap-2 md:gap-4">
                  <Avatar className="w-10 h-10 shrink-0 border border-slate-100">
                    <AvatarImage src={avatarSrc(u)} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 font-black text-sm">
                      {(u.name ?? "?")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p
                        className={`font-black text-xs md:text-base truncate ${isMe ? "text-teal-800" : "text-slate-700"}`}
                      >
                        {u.name}
                      </p>
                      {isMe && (
                        <span className="bg-teal-200 text-teal-700 text-[8px] md:text-[10px] font-black px-1.5 py-0.5 rounded-md border border-teal-300">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-tight">
                        {getRoleLabel(u.role)} • Lv.{u.level}
                      </p>
                      {u.streak >= 3 && (
                        <span className="flex items-center gap-0.5 text-[9px] font-black text-orange-500">
                          <Flame className="h-2.5 w-2.5" />
                          {u.streak}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Points */}
                <div className="col-span-3 flex flex-col justify-center items-end pr-1">
                  <div className="flex items-center gap-1">
                    <Zap
                      className={`h-3.5 w-3.5 ${isMe ? "text-teal-500" : "text-emerald-500"}`}
                    />
                    <span
                      className={`font-black text-sm md:text-xl leading-none ${isMe ? "text-teal-700" : "text-emerald-700"}`}
                    >
                      {u.points.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase">
                    XP
                  </span>
                </div>
              </div>
            );
          })}
          {filtered.length < 10 && 
            Array.from({ length: 10 - filtered.length }).map((_, i) => {
              const rank = filtered.length + i + 1;
              if (rank <= 3) return null; // Podium handles 1-3
              return (
                <div
                  key={`empty-${rank}`}
                  className="bg-slate-50 border-2 border-slate-100 border-dashed rounded-2xl p-4 mb-3 flex items-center justify-between transition-all group hover:border-emerald-100 hover:bg-emerald-50/30"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-8 sm:w-10 flex flex-col items-center">
                      <span className="font-black text-slate-400 text-xs sm:text-base leading-none">
                        #{rank}
                      </span>
                      <div className="h-1 w-4 bg-slate-100 rounded-full mt-1 group-hover:bg-emerald-200" />
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-slate-100 to-slate-200/50 flex items-center justify-center border border-slate-200 group-hover:from-emerald-100 group-hover:to-teal-100">
                        <Users className="h-4 w-4 text-slate-300 group-hover:text-emerald-400" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="h-3 w-32 sm:w-40 bg-slate-200/60 rounded-full overflow-hidden relative">
                          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                        </div>
                        <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">
                          Posisi Kosong
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end opacity-40 group-hover:opacity-80 transition-opacity">
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                      <div className="h-3 w-10 sm:w-14 bg-slate-200 rounded-full" />
                    </div>
                    <span className="text-[7px] sm:text-[8px] font-bold text-slate-300 uppercase mt-0.5">
                      Menunggumu
                    </span>
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>

      {/* ── STICKY CURRENT USER (mobile) ─────────────────────────────────── */}
      {currentUser && currentUserRole === "user" && (
        <div className="md:hidden fixed bottom-6 left-4 right-20 z-40 transform translate-y-0 opacity-100 transition-all duration-300">
          <div className="bg-slate-900 text-white rounded-[2.2rem] p-1.5 shadow-2xl border border-slate-700 overflow-hidden ring-4 ring-white/10">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 rounded-[1.8rem]">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-[0.9rem] bg-linear-to-br from-teal-400 to-emerald-500 flex items-center justify-center font-black text-sm sm:text-base shadow-lg text-white">
                  {currentUserRank ?? "—"}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-xs sm:text-sm leading-tight truncate text-slate-100">
                    {currentUser.name}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-teal-400 uppercase tracking-widest">
                    Peringkat Anda
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0 pl-3 border-l-2 border-slate-700/50">
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-teal-400 fill-teal-400/20" />
                  <span className="font-black text-sm sm:text-base text-teal-400 leading-none">
                    {currentUser.points.toLocaleString()}
                  </span>
                </div>
                <span className="text-[7px] sm:text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
                  EXP TERKUMPUL
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
