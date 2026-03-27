import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function repro(userId: string) {
  try {
    console.log("Checking user:", userId);
    const user = await prisma.users.findUnique({
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
      console.log("User not found");
      return;
    }

    console.log("Found user:", user.name);

    const [followersCount, followingCount] = await Promise.all([
      prisma.friendships.count({ where: { followingId: userId } }),
      prisma.friendships.count({ where: { followerId: userId } }),
    ]);
    console.log("Followers:", followersCount, "Following:", followingCount);

    const quizAttemptCount = await prisma.quiz_attempts.count({
      where: { userId },
    });
    console.log("Quiz attempts:", quizAttemptCount);

    const quizStats = await prisma.quiz_attempts.aggregate({
      where: { userId },
      _avg: { score: true },
      _count: { id: true },
    });
    console.log("Quiz stats:", quizStats);

    const [programEnrollCount, courseEnrollCount] = await Promise.all([
      prisma.program_enrollments.count({ where: { userId } }),
      prisma.courseenrollment.count({ where: { userId } }),
    ]);
    console.log("Program enrollments:", programEnrollCount, "Course enrollments:", courseEnrollCount);

    const recentActivityLogs = await prisma.activity_logs.findMany({
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
    console.log("Recent activity logs count:", recentActivityLogs.length);

    if (recentActivityLogs.length === 0) {
        console.log("Fetching fallback quiz attempts...");
        const recentQuizzes = await prisma.quiz_attempts.findMany({
            where: { userId },
            include: { material_quizzes: { select: { title: true } } },
            orderBy: { completedAt: "desc" },
            take: 5,
        });
        console.log("Fallback quizzes count:", recentQuizzes.length);
    }

    const earnedBadges = await prisma.user_badges.findMany({
      where: { userId },
      include: { badges: true }, // Corrected name
      orderBy: { earnedAt: "desc" },
      take: 6,
    });
    console.log("Earned badges count:", earnedBadges.length);

  } catch (err) {
    console.error("REPRO ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
    const u = await prisma.users.findFirst();
    if (u) {
        await repro(u.id);
    } else {
        console.log("No users in DB");
    }
}

run();
