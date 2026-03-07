import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

    // Ambil aktivitas terkini (quiz attempts, course enrollments)
    const recentQuizzes = await prisma.quiz_attempt.findMany({
      where: { userId },
      include: {
        quiz: { select: { title: true } },
      },
      orderBy: { completedAt: "desc" },
      take: 5,
    });

    const recentActivities = recentQuizzes.map((qa) => ({
      id: qa.id,
      type: "quiz" as const,
      title: `Menyelesaikan quiz: ${qa.quiz.title}`,
      date: qa.completedAt.toISOString(),
      score: qa.score,
      totalScore: qa.totalScore,
    }));

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
    });
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
