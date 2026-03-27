import React from "react";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import {
  getXpProgress,
  getLevelTitle,
  getXpForLevel,
  getLevelFromXp,
} from "@/lib/gamification";
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  FileText,
  Flame,
  GraduationCap,
  MessageCircle,
  MessageSquare,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Zap,
  Sprout,
  Book,
  Search,
  Sparkles,
  Inbox,
  Brain,
  Lock,
  HelpCircle,
} from "lucide-react";

const LEVEL_MILESTONES = [
  {
    level: 1,
    title: "Pemula",
    icon: Sprout,
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
  {
    level: 3,
    title: "Pelajar",
    icon: Book,
    color: "bg-emerald-100 text-emerald-700 border-emerald-300",
  },
  {
    level: 6,
    title: "Pencari Ilmu",
    icon: Search,
    color: "bg-teal-50 text-teal-600 border-teal-200",
  },
  {
    level: 11,
    title: "Penuntut Ilmu",
    icon: Zap,
    color: "bg-teal-100 text-teal-700 border-teal-300",
  },
  {
    level: 16,
    title: "Ahli Ilmu",
    icon: Star,
    color: "bg-cyan-50 text-cyan-600 border-cyan-200",
  },
  {
    level: 21,
    title: "Mujtahid",
    icon: Flame,
    color: "bg-cyan-100 text-cyan-700 border-cyan-300",
  },
  {
    level: 31,
    title: "Ulama Muda",
    icon: Trophy,
    color: "bg-emerald-100 text-emerald-700 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
  },
  {
    level: 51,
    title: "Masya Allah",
    icon: Sparkles,
    color: "bg-teal-100 text-teal-700 border-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.2)]",
  },
];

const XP_GUIDE = [
  { icon: HelpCircle, label: "Selesaikan Quiz", xp: 50, bonus: "+25 jika skor ≥80%" },
  { icon: GraduationCap, label: "Ikut Program", xp: 40 },
  { icon: CheckCircle2, label: "Absensi", xp: 25 },
  { icon: Award, label: "Dapat Badge", xp: 100 },
];

function getActivityConfig(type: string): {
  bg: string;
  icon: React.ReactNode;
} {
  const map: Record<string, { bg: string; icon: React.ReactNode }> = {
    quiz_completed: {
      bg: "bg-emerald-50",
      icon: <HelpCircle className="h-4 w-4 text-emerald-600" />,
    },
    badge_earned: {
      bg: "bg-emerald-50",
      icon: <Award className="h-4 w-4 text-emerald-600" />,
    },
    forum_post: {
      bg: "bg-emerald-50",
      icon: <MessageSquare className="h-4 w-4 text-emerald-600" />,
    },
    material_read: {
      bg: "bg-emerald-50",
      icon: <BookOpen className="h-4 w-4 text-emerald-600" />,
    },
    level_up: {
      bg: "bg-emerald-50",
      icon: <Trophy className="h-4 w-4 text-emerald-600" />,
    },
    course_enrolled: {
      bg: "bg-emerald-50",
      icon: <GraduationCap className="h-4 w-4 text-emerald-600" />,
    },
    program_enrolled: {
      bg: "bg-emerald-50",
      icon: <GraduationCap className="h-4 w-4 text-emerald-600" />,
    },
    friend_added: {
      bg: "bg-emerald-50",
      icon: <Users className="h-4 w-4 text-emerald-600" />,
    },
    attendance_marked: {
      bg: "bg-emerald-50",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
    },
    streak_maintained: {
      bg: "bg-emerald-50",
      icon: <Flame className="h-4 w-4 text-emerald-600" />,
    },
    profile_completed: {
      bg: "bg-emerald-50",
      icon: <Star className="h-4 w-4 text-emerald-600" />,
    },
  };
  return (
    map[type] ?? {
      bg: "bg-emerald-50",
      icon: <Activity className="h-4 w-4 text-emerald-600" />,
    }
  );
}

function formatRelativeTime(date: Date): string {
  const ms = Date.now() - date.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "Baru saja";
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const dy = Math.floor(hr / 24);
  if (dy < 7) return `${dy} hari lalu`;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const d = new Date(date);
  if (d.toDateString() === today.toDateString()) return "Hari Ini";
  if (d.toDateString() === yesterday.toDateString()) return "Kemarin";
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default async function LevelPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  // Hanya role "user" yang bisa mengakses halaman Level & XP
  if ((session.user as any).role !== "user") redirect("/overview");

  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      points: true,
      level: true,
      streak: true,
      badges: true,
      quizzes: true,
    },
  });
  if (!user) redirect("/auth");

  // Sync level if drift
  const calculatedLevel = getLevelFromXp(user.points);
  if (calculatedLevel !== user.level) {
    await prisma.users.update({
      where: { id: session.user.id },
      data: { level: calculatedLevel },
    });
    user.level = calculatedLevel;
  }

  const xp = getXpProgress(user.points);
  const levelTitle = getLevelTitle(user.level);

  const [activities, earnedBadges, allBadges, rank] = await Promise.all([
    prisma.activity_logs.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.user_badges.findMany({
      where: { userId: session.user.id },
      include: { badges: true },
      orderBy: { earnedAt: "desc" },
    }),
    prisma.badges.findMany(),
    prisma.users.count({
      where: { points: { gt: user.points } },
    }),
  ]);

  const myRank = rank + 1;

  // ── Daily XP Summary ──────────────────────────────────────────────────
  const dailyXpMap = new Map<string, number>();
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dailyXpMap.set(d.toDateString(), 0);
  }
  for (const a of activities) {
    const key = a.createdAt.toDateString();
    if (dailyXpMap.has(key)) {
      dailyXpMap.set(key, (dailyXpMap.get(key) ?? 0) + a.xpEarned);
    }
  }
  const dailyXp = Array.from(dailyXpMap.entries())
    .map(([dateStr, xpTotal]) => {
      const d = new Date(dateStr);
      return {
        label:
          d.toDateString() === today.toDateString()
            ? "Hari Ini"
            : d.toLocaleDateString("id-ID", { weekday: "short" }),
        xp: xpTotal,
        isToday: d.toDateString() === today.toDateString(),
      };
    })
    .reverse(); // oldest on left, today on right
  const maxDailyXp = Math.max(...dailyXp.map((d) => d.xp), 1);

  // ── Group activities by day ───────────────────────────────────────────
  const grouped: { label: string; items: typeof activities }[] = [];
  let currentLabel = "";
  for (const a of activities) {
    const label = formatDateLabel(a.createdAt);
    if (label !== currentLabel) {
      grouped.push({ label, items: [] });
      currentLabel = label;
    }
    grouped[grouped.length - 1].items.push(a);
  }

  // ── Next badge to earn ────────────────────────────────────────────────
  const earnedCodes = new Set(earnedBadges.map((ub) => ub.badges.code));
  const unearnedBadges = allBadges.filter((b) => !earnedCodes.has(b.code));

  const currentMilestone =
    [...LEVEL_MILESTONES].reverse().find((m) => m.level <= user.level) ??
    LEVEL_MILESTONES[0];

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto pb-32 md:pb-8 space-y-6">
          {/* ── HERO ─────────────────────────────────────────────────────── */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-[2rem] p-6 md:p-8 shadow-[0_8px_0_0_#0f766e] text-white">
            <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
              {/* Level badge */}
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-[2rem] bg-white/20 backdrop-blur-sm border-4 border-white/40 flex flex-col items-center justify-center shadow-2xl">
                  <currentMilestone.icon className="h-10 w-10 md:h-14 md:w-14 mb-1 text-white stroke-[2.5]" />
                  <span className="text-[9px] font-black mt-0.5 opacity-80 tracking-[0.2em] uppercase">
                    LEVEL
                  </span>
                  <span className="text-3xl md:text-4xl font-black leading-none">
                    {user.level}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                  Gelar Saat Ini
                </p>
                <h1 className="text-3xl md:text-4xl font-black mb-1 leading-tight">
                  {levelTitle}
                </h1>
                <p className="text-white/70 font-bold text-sm mb-5">
                  {user.name} • Peringkat #{myRank}
                </p>

                {/* XP Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-black">
                      {user.points.toLocaleString()} XP
                    </span>
                    <span className="text-xs font-bold text-white/60">
                      {xp.progressXp.toLocaleString()} /{" "}
                      {(xp.nextLevelXp - xp.currentLevelXp).toLocaleString()} XP
                      → Lv.{xp.currentLevel + 1}
                    </span>
                  </div>
                  <div className="w-full h-4 bg-white/20 rounded-full border border-white/30 overflow-hidden">
                    <div
                      className="h-4 bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 rounded-full transition-all duration-700"
                      style={{ width: `${xp.progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-white/55">
                    <span>Lv.{xp.currentLevel}</span>
                    <span className="text-amber-300 font-black">
                      {xp.progressPercent}%
                    </span>
                    <span>Lv.{xp.currentLevel + 1}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── STATS ROW ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                icon: Zap,
                label: "Total XP",
                value: user.points.toLocaleString(),
                from: "from-emerald-50",
                to: "to-emerald-100",
                border: "border-emerald-200",
                shadow: "shadow-[0_4px_0_0_#10b981]",
                iconColor: "text-emerald-500",
              },
              {
                icon: Flame,
                label: "Streak Hari",
                value: String(user.streak),
                from: "from-emerald-50",
                to: "to-emerald-100",
                border: "border-emerald-200",
                shadow: "shadow-[0_4px_0_0_#10b981]",
                iconColor: "text-emerald-500",
              },
              {
                icon: Award,
                label: "Badge",
                value: String(user.badges),
                from: "from-emerald-50",
                to: "to-emerald-100",
                border: "border-emerald-200",
                shadow: "shadow-[0_4px_0_0_#10b981]",
                iconColor: "text-emerald-500",
              },
              {
                icon: HelpCircle,
                label: "Quiz Selesai",
                value: String(user.quizzes),
                from: "from-emerald-50",
                to: "to-emerald-100",
                border: "border-emerald-200",
                shadow: "shadow-[0_4px_0_0_#10b981]",
                iconColor: "text-emerald-500",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`bg-gradient-to-br ${s.from} ${s.to} border-2 ${s.border} rounded-2xl p-4 ${s.shadow} text-center flex flex-col items-center justify-center`}
              >
                <s.icon className={`h-8 w-8 mb-2 ${s.iconColor}`} />
                <div className="text-2xl md:text-3xl font-black text-slate-800">
                  {s.value}
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* ── DAILY XP CHART ────────────────────────────────────────────── */}
          <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-[0_6px_0_0_#cbd5e1]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800">
                  XP 7 Hari Terakhir
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Total:{" "}
                  {dailyXp.reduce((s, d) => s + d.xp, 0).toLocaleString()} XP
                  minggu ini
                </p>
              </div>
            </div>

            <div className="flex items-end gap-2 h-32">
              {dailyXp.map((d, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  {d.xp > 0 && (
                    <span className="text-[10px] font-black text-emerald-600">
                      +{d.xp}
                    </span>
                  )}
                  <div className="w-full flex justify-center">
                    <div
                      className={`w-full max-w-10 rounded-t-xl transition-all ${
                        d.isToday
                          ? "bg-gradient-to-t from-emerald-500 to-emerald-400"
                          : "bg-gradient-to-t from-slate-200 to-slate-100"
                      }`}
                      style={{
                        height: `${Math.max(8, (d.xp / maxDailyXp) * 90)}px`,
                      }}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-bold ${
                      d.isToday ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── MAIN GRID ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT col */}
            <div className="lg:col-span-2 space-y-6">
              {/* Activity Log — grouped by day */}
              <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-[0_6px_0_0_#cbd5e1]">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                    <Activity className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800">
                      Riwayat XP
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      {activities.length} aktivitas tercatat
                    </p>
                  </div>
                </div>

                {activities.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 border-2 border-slate-100 mb-3 text-slate-300">
                      <Inbox className="h-8 w-8" />
                    </div>
                    <p className="font-bold text-slate-500">
                      Belum ada aktivitas
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      Ikuti quiz atau program untuk mendapat XP!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {grouped.map((group) => (
                      <div key={group.label}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-px flex-1 bg-slate-100" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2">
                            {group.label}
                          </span>
                          <div className="h-px flex-1 bg-slate-100" />
                        </div>
                        <div className="space-y-1">
                          {group.items.map((a) => {
                            const cfg = getActivityConfig(a.type);
                            return (
                              <div
                                key={a.id}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                              >
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}
                                >
                                  {cfg.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-slate-700 text-sm truncate">
                                    {a.title}
                                  </p>
                                  <p className="text-[11px] text-slate-400 font-medium">
                                    {formatRelativeTime(a.createdAt)}
                                  </p>
                                </div>
                                {a.xpEarned > 0 && (
                                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 flex-shrink-0">
                                    <Zap className="h-3 w-3 text-emerald-500" />
                                    <span className="text-xs font-black text-emerald-600">
                                      +{a.xpEarned}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Level Roadmap */}
              <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-[0_6px_0_0_#cbd5e1]">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                    <Trophy className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800">
                      Perjalanan Level
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Milestone gelar yang bisa kamu raih
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {LEVEL_MILESTONES.map((m, i) => {
                    const isReached = user.level >= m.level;
                    const isCurrent = currentMilestone.level === m.level;
                    const nextMs = LEVEL_MILESTONES[i + 1];
                    const xpNeeded = getXpForLevel(m.level);
                    return (
                      <div
                        key={m.level}
                        className={`flex items-center gap-4 p-3 rounded-2xl border-2 transition-all ${
                          isCurrent
                            ? "border-emerald-300 bg-emerald-50"
                            : isReached
                              ? "border-slate-200 bg-slate-50"
                              : "border-dashed border-slate-200 opacity-60"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border-2 ${
                            isReached
                              ? m.color
                              : "bg-slate-100 text-slate-400 border-slate-200"
                          }`}
                        >
                          {isReached ? <m.icon className="h-5 w-5 stroke-[2.5]" /> : <Lock className="h-5 w-5 stroke-[2.5]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-800 text-sm">
                              {m.title}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black">
                                SEKARANG
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">
                            Level {m.level}
                            {nextMs ? `–${nextMs.level - 1}` : "+"} • mulai{" "}
                            {xpNeeded.toLocaleString()} XP
                          </span>
                        </div>
                        {isReached && (
                          <CheckCircle2
                            className={`h-5 w-5 flex-shrink-0 ${isCurrent ? "text-emerald-500" : "text-slate-300"}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT col */}
            <div className="space-y-6">
              {/* Next Badge Preview */}
              {unearnedBadges.length > 0 && (
                <div className="bg-white border-2 border-emerald-200 rounded-[2rem] p-5 shadow-[0_6px_0_0_#10b981]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                      <Target className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-800">
                        Badge Selanjutnya
                      </h2>
                      <p className="text-xs text-slate-500">
                        {unearnedBadges.length} badge belum didapat
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {unearnedBadges.slice(0, 4).map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/70 border border-indigo-100"
                      >
                        <span className="text-2xl flex-shrink-0 opacity-40 grayscale">
                          {b.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-700 text-sm">
                            {b.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {b.requirement}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 flex-shrink-0">
                          <Zap className="h-2.5 w-2.5 text-emerald-500" />
                          <span className="text-[10px] font-black text-emerald-600">
                            +{b.xpReward}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Earned Badges */}
              <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-5 shadow-[0_6px_0_0_#cbd5e1]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                    <Award className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-800">
                      Badge Kamu
                    </h2>
                    <p className="text-xs text-slate-500">
                      {earnedBadges.length} / {allBadges.length} diperoleh
                    </p>
                  </div>
                </div>
                {earnedBadges.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-50 border-2 border-slate-100 mb-2 text-slate-300">
                      <Award className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">
                      Belum ada badge
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Selesaikan misi untuk dapat badge!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {earnedBadges.map((ub) => (
                      <div
                        key={ub.id}
                        title={ub.badges.description}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl bg-amber-50 border border-amber-100 text-center"
                      >
                        <span className="text-2xl">{ub.badges.icon}</span>
                        <span className="text-[10px] font-black text-slate-600 leading-tight line-clamp-2">
                          {ub.badges.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* XP Guide */}
              <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-5 shadow-[0_6px_0_0_#cbd5e1]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                    <Zap className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-800">
                      Cara Dapat XP
                    </h2>
                    <p className="text-xs text-slate-500">
                      Kumpulkan XP untuk naik level
                    </p>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {XP_GUIDE.map((g) => (
                    <div
                      key={g.label}
                      className="flex items-center justify-between py-2.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100 flex-shrink-0">
                          <g.icon className="h-4 w-4 text-emerald-600 stroke-[2.5]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">
                            {g.label}
                          </p>
                          {g.bonus && (
                            <p className="text-[10px] text-emerald-600 font-bold">
                              {g.bonus}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 flex-shrink-0 ml-2">
                        <Zap className="h-3 w-3 text-emerald-500" />
                        <span className="text-xs font-black text-emerald-700">
                          +{g.xp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
