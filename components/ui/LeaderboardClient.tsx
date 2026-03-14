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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {[
            {
              icon: <Trophy className="h-4 w-4 text-emerald-500" />,
              label: "Peringkatmu",
              value: currentUserRank ? `#${currentUserRank}` : "—",
              bg: "bg-emerald-50/80",
              border: "border-emerald-200",
            },
            {
              icon: <Flame className="h-4 w-4 text-emerald-500" />,
              label: "Streak Tertinggi",
              value: `${stats.highestStreak} hari`,
              bg: "bg-teal-50/80",
              border: "border-teal-200",
            },
            {
              icon: <Award className="h-4 w-4 text-emerald-500" />,
              label: "Total Badge",
              value: stats.totalBadges,
              bg: "bg-emerald-50/50",
              border: "border-emerald-200",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`${s.bg} border-2 ${s.border} rounded-2xl p-3 flex items-center gap-3`}
            >
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center border border-slate-100 flex-shrink-0">
                {s.icon}
              </div>
              <div className="min-w-0">
                <div className="text-lg font-black text-slate-800 leading-none">
                  {s.value}
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PODIUM ───────────────────────────────────────────────────────── */}
      {topThree.length >= 1 && (
        <div className="flex justify-center items-end gap-1 sm:gap-3 md:gap-10 mb-12 px-1 sm:px-2 pt-10">
          {/* 2nd place */}
          {topThree[1] && (
            <div className="flex flex-col items-center group order-1 shrink-0 w-[28%] sm:w-24 md:w-36">
              <div className="relative mb-[-15px] z-20 transition-transform group-hover:-translate-y-2">
                <Avatar className="w-14 h-14 sm:w-16 sm:h-16 md:w-24 md:h-24 border-[3px] border-emerald-300 shadow-md mx-auto">
                  <AvatarImage src={avatarSrc(topThree[1])} />
                  <AvatarFallback className="bg-emerald-100 font-black text-emerald-700 text-lg">
                    {(topThree[1].name ?? "?")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-black border-2 border-white text-[10px] sm:text-xs md:text-base">
                  2
                </div>
              </div>
              <div
                onClick={() => router.push(`/u/${topThree[1].id}`)}
                className="cursor-pointer w-full h-24 sm:h-28 md:h-40 bg-emerald-50/70 rounded-t-3xl border-[3px] border-emerald-200 border-b-0 flex flex-col items-center pt-8 md:pt-10 shadow-inner relative z-10 hover:bg-emerald-100/80 transition-colors"
              >
                <p className="font-black text-emerald-800 text-[9px] sm:text-[10px] md:text-sm px-1 text-center line-clamp-1 w-full">
                  {topThree[1].name}
                </p>
                <div className="mt-1 md:mt-2 bg-white px-1 sm:px-2 py-0.5 rounded-full border border-emerald-200 w-[90%] sm:w-fit flex justify-center items-center gap-1">
                  <Zap className="h-2.5 w-2.5 text-emerald-500" />
                  <p className="text-[8px] sm:text-[9px] md:text-xs font-black text-emerald-600">
                    {topThree[1].points.toLocaleString()} XP
                  </p>
                </div>
                <span className="mt-1 text-[8px] font-bold text-emerald-600/70 uppercase">
                  Lv.{topThree[1].level} • {getRoleLabel(topThree[1].role)}
                </span>
              </div>
            </div>
          )}

          {/* 1st place */}
          {topThree[0] && (
            <div className="flex flex-col items-center group order-2 -mt-6 sm:-mt-10 z-30 shrink-0 w-[36%] sm:w-32 md:w-44">
              <div className="relative mb-3 sm:mb-5 z-20 transition-transform group-hover:-translate-y-3">
                <div className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2">
                  <Crown className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-amber-400 fill-amber-400 drop-shadow-sm" />
                </div>
                <Avatar className="w-18 h-18 sm:w-24 sm:h-24 md:w-32 md:h-32 border-4 border-emerald-400 shadow-lg mx-auto bg-white">
                  <AvatarImage src={avatarSrc(topThree[0])} />
                  <AvatarFallback className="bg-emerald-100 font-black text-emerald-800 text-2xl">
                    {(topThree[0].name ?? "?")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-600 text-white w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black border-[3px] border-white shadow-md text-xs sm:text-sm md:text-lg">
                  1
                </div>
              </div>
              <div
                onClick={() => router.push(`/u/${topThree[0].id}`)}
                className="cursor-pointer w-full h-32 sm:h-40 md:h-56 bg-emerald-50 rounded-t-[2.5rem] border-[3px] border-emerald-300 border-b-0 flex flex-col items-center pt-8 sm:pt-10 md:pt-12 shadow-inner relative z-10 hover:bg-emerald-100/60 transition-colors"
              >
                <p className="font-black text-emerald-900 text-[10px] sm:text-xs md:text-lg px-1 sm:px-2 text-center line-clamp-1 w-full">
                  {topThree[0].name}
                </p>
                <div className="mt-1 sm:mt-2 bg-emerald-500 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border-2 border-emerald-600 shadow-sm w-[90%] sm:w-fit flex justify-center items-center gap-1">
                  <Zap className="h-2.5 w-2.5 text-white" />
                  <p className="text-[8px] sm:text-[10px] md:text-sm font-black text-white">
                    {topThree[0].points.toLocaleString()} XP
                  </p>
                </div>
                <span className="mt-1 text-[8px] sm:text-[9px] font-bold text-emerald-700 uppercase">
                  Lv.{topThree[0].level} • {getRoleLabel(topThree[0].role)}
                </span>
              </div>
            </div>
          )}

          {/* 3rd place */}
          {topThree[2] && (
            <div className="flex flex-col items-center group order-3 shrink-0 w-[28%] sm:w-24 md:w-36">
              <div className="relative mb-[-15px] z-20 transition-transform group-hover:-translate-y-2">
                <Avatar className="w-14 h-14 sm:w-16 sm:h-16 md:w-24 md:h-24 border-[3px] border-emerald-200 shadow-md mx-auto">
                  <AvatarImage src={avatarSrc(topThree[2])} />
                  <AvatarFallback className="bg-emerald-50 font-black text-emerald-600 text-lg">
                    {(topThree[2].name ?? "?")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-emerald-400 text-white w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-black border-2 border-white text-[10px] sm:text-xs md:text-base">
                  3
                </div>
              </div>
              <div
                onClick={() => router.push(`/u/${topThree[2].id}`)}
                className="cursor-pointer w-full h-20 sm:h-24 md:h-32 bg-emerald-50/40 rounded-t-3xl border-[3px] border-emerald-100 border-b-0 flex flex-col items-center pt-8 md:pt-10 shadow-inner relative z-10 hover:bg-emerald-50/80 transition-colors"
              >
                <p className="font-black text-emerald-700 text-[9px] sm:text-[10px] md:text-sm px-1 text-center line-clamp-1 w-full">
                  {topThree[2].name}
                </p>
                <div className="mt-1 md:mt-2 bg-white px-1 sm:px-2 py-0.5 rounded-full border border-emerald-100 w-[90%] sm:w-fit flex justify-center items-center gap-1">
                  <Zap className="h-2.5 w-2.5 text-emerald-400" />
                  <p className="text-[8px] sm:text-[9px] md:text-xs font-black text-emerald-500">
                    {topThree[2].points.toLocaleString()} XP
                  </p>
                </div>
                <span className="mt-1 text-[8px] font-bold text-emerald-400 uppercase">
                  Lv.{topThree[2].level} • {getRoleLabel(topThree[2].role)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── FILTERS & SEARCH ─────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-2">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 bg-white border-2 border-slate-200 rounded-2xl flex items-center px-4 py-2.5 transition-all focus-within:border-emerald-400 focus-within:shadow-[0_0_0_3px_#d1fae5]">
            <Search className="w-4 h-4 md:w-5 md:h-5 text-slate-400 mr-2 flex-shrink-0" />
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
                  <Avatar className="w-10 h-10 flex-shrink-0 border border-slate-100">
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
        </div>
      </div>

      {/* ── STICKY CURRENT USER (mobile) ─────────────────────────────────── */}
      {currentUser && currentUserRole === "user" && (
        <div className="md:hidden fixed bottom-4 left-4 right-20 z-40">
          <div className="bg-slate-900 text-white rounded-4xl p-1 shadow-xl border border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 sm:px-5 sm:py-3 bg-slate-800 rounded-[1.8rem]">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-teal-500 flex items-center justify-center font-black text-sm sm:text-base shadow-lg">
                  {currentUserRank ?? "—"}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-xs sm:text-sm leading-tight truncate">
                    {currentUser.name}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Peringkat Anda
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0 pl-2 border-l border-slate-700">
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-teal-400" />
                  <span className="font-black text-sm sm:text-base text-teal-400 leading-none">
                    {currentUser.points.toLocaleString()}
                  </span>
                </div>
                <span className="text-[7px] sm:text-[8px] font-bold text-slate-500 uppercase">
                  XP
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
