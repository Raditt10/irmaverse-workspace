import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  getXpProgress,
  getLevelTitle,
  getLevelFromXp,
} from "@/lib/gamification";

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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        points: true,
        badges: true,
        quizzes: true,
        streak: true,
        averageScore: true,
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
      await prisma.user.update({
        where: { id: session.user.id },
        data: { level: calculatedLevel },
      });
      user.level = calculatedLevel;
    }

    const xpProgress = getXpProgress(user.points);
    const levelTitle = getLevelTitle(user.level);

    // Hitung rank (peringkat berdasarkan poin)
    const rank = await prisma.user.count({
      where: { points: { gt: user.points }, role: "user" },
    });

    // Ambil program enrollments yang sudah selesai
    const completedPrograms = await prisma.program_enrollment.count({
      where: { userId: session.user.id },
    });

    // Total quiz attempts
    const quizAttempts = await prisma.quiz_attempt.count({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      stats: {
        points: user.points,
        badges: user.badges,
        quizzes: quizAttempts,
        streak: user.streak,
        averageScore: user.averageScore,
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
