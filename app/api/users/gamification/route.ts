import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  getXpProgress,
  getLevelTitle,
  getLevelFromXp,
} from "@/lib/gamification";

/**
 * Hitung streak berdasarkan hari berturut-turut user mengikuti kajian (absen).
 * Streak dihitung mundur dari hari ini — jika hari ini ada absen, cek kemarin, dst.
 * Jika hari ini belum ada absen, cek dari kemarin.
 */
async function calculateStreak(userId: string): Promise<number> {
  // Ambil semua tanggal unik attendance user, urut terbaru dulu
  const attendances = await prisma.attendance.findMany({
    where: { userId },
    select: { createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  if (attendances.length === 0) return 0;

  // Kumpulkan tanggal unik (YYYY-MM-DD) dalam Set
  const uniqueDates = new Set<string>();
  for (const att of attendances) {
    const dateStr = new Date(att.createdAt).toLocaleDateString("en-CA"); // YYYY-MM-DD
    uniqueDates.add(dateStr);
  }

  // Sort tanggal descending
  const sortedDates = Array.from(uniqueDates).sort((a, b) => b.localeCompare(a));

  const today = new Date();
  const todayStr = today.toLocaleDateString("en-CA");
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString("en-CA");

  // Mulai hitung dari hari ini atau kemarin
  let streak = 0;
  let checkDate: Date;

  if (sortedDates[0] === todayStr) {
    checkDate = new Date(today);
  } else if (sortedDates[0] === yesterdayStr) {
    checkDate = new Date(yesterday);
  } else {
    // Terakhir absen lebih dari kemarin, streak = 0
    return 0;
  }

  // Hitung streak berturut-turut
  while (true) {
    const checkStr = checkDate.toLocaleDateString("en-CA");
    if (uniqueDates.has(checkStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * GET /api/users/gamification
 * Ambil data gamifikasi lengkap untuk user yang sedang login
 * (stats, XP progress, level info, badge summary)
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        points: true,
        badges: true,
        quizzes: true,
        level: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 },
      );
    }

    // Sync level jika ada ketidakcocokan
    const calculatedLevel = getLevelFromXp(user.points);
    if (calculatedLevel !== user.level) {
      await prisma.users.update({
        where: { id: session.user.id },
        data: { level: calculatedLevel },
      });
      user.level = calculatedLevel;
    }

    const xpProgress = getXpProgress(user.points);
    const levelTitle = getLevelTitle(user.level);

    // Hitung rank (peringkat berdasarkan poin)
    const rank = await prisma.users.count({
      where: { points: { gt: user.points }, role: "user" },
    });

    // Hitung streak dari data attendance (hari berturut-turut mengikuti kajian)
    const streak = await calculateStreak(session.user.id);

    // Ambil program enrollments yang sudah selesai
    const completedPrograms = await prisma.program_enrollments.count({
      where: { userId: session.user.id },
    });

    // Total quiz attempts
    const quizAttempts = await prisma.quiz_attempts.count({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      stats: {
        points: user.points,
        badges: user.badges,
        quizzes: quizAttempts,
        streak,
        level: user.level,
        rank: rank + 1, // 1-indexed
      },
      xpProgress: {
        ...xpProgress,
        levelTitle,
      },
      completedPrograms,
    });
  } catch (error: any) {
    console.error("🔥 Error GET /api/users/gamification:", error.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
