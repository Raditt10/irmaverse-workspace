import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getXpProgress, getLevelTitle } from "@/lib/gamification";

// GET /api/friends/profile/[userId] - Ambil profil publik user + stats
export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        level: true,
        points: true,
        badges: true,
        streak: true,
        averageScore: true,
        quizzes: true,
        role: true,
        createdAt: true,
        lastSeen: true,
        bidangKeahlian: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 },
      );
    }

    // Hitung followers & following
    const [followersCount, followingCount] = await Promise.all([
      prisma.friendship.count({ where: { followingId: userId } }),
      prisma.friendship.count({ where: { followerId: userId } }),
    ]);

    // Ambil jumlah quiz attempts
    const quizAttemptCount = await prisma.quiz_attempt.count({
      where: { userId },
    });

    // Ambil average quiz score
    const quizStats = await prisma.quiz_attempt.aggregate({
      where: { userId },
      _avg: { score: true },
      _count: { id: true },
    });

    // Ambil enrollment count (program + course)
    const [programEnrollCount, courseEnrollCount] = await Promise.all([
      prisma.program_enrollment.count({ where: { userId } }),
      prisma.courseenrollment.count({ where: { userId } }),
    ]);

    // Ambil aktivitas terkini dari ActivityLog (atau fallback ke quiz attempts)
    const recentActivityLogs = await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        xpEarned: true,
        createdAt: true,
      },
    });

    let recentActivities;
    if (recentActivityLogs.length > 0) {
      recentActivities = recentActivityLogs.map((a) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        description: a.description,
        xpEarned: a.xpEarned,
        date: a.createdAt.toISOString(),
      }));
    } else {
      // Fallback: kalau belum ada ActivityLog, tampilkan quiz attempts
      const recentQuizzes = await prisma.quiz_attempt.findMany({
        where: { userId },
        include: { quiz: { select: { title: true } } },
        orderBy: { completedAt: "desc" },
        take: 5,
      });
      recentActivities = recentQuizzes.map((qa) => ({
        id: qa.id,
        type: "quiz_completed",
        title: `Menyelesaikan quiz: ${qa.quiz.title}`,
        date: qa.completedAt.toISOString(),
        xpEarned: 50,
        score: qa.score,
        totalScore: qa.totalScore,
      }));
    }

    // Ambil badges yang dimiliki user
    const earnedBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: "desc" },
      take: 6,
    });

    const xpProgress = getXpProgress(user.points);
    const levelTitle = getLevelTitle(user.level);

    // Ambil mutual friends (untuk tampilkan "X teman yang sama")
    const mutualFriendsCount = 0; // Will be enriched in status API

    return NextResponse.json({
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        lastSeen: user.lastSeen.toISOString(),
      },
      stats: {
        followersCount,
        followingCount,
        quizAttemptCount,
        averageQuizScore: Math.round(quizStats._avg.score || 0),
        programEnrollCount,
        courseEnrollCount,
        totalEnrollments: programEnrollCount + courseEnrollCount,
      },
      recentActivities,
      earnedBadges: earnedBadges.map((ub) => ({
        id: ub.badge.id,
        code: ub.badge.code,
        name: ub.badge.name,
        description: ub.badge.description,
        icon: ub.badge.icon,
        category: ub.badge.category,
        earnedAt: ub.earnedAt.toISOString(),
      })),
      xpProgress: {
        ...xpProgress,
        levelTitle,
      },
    });
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
