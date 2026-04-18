import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getLevelFromXp, getXpProgress, getLevelTitle } from "@/lib/gamification";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const role = session.user.role;

    // 1. Get Gamification & Stats
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { points: true, level: true, badges: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    let currentLevel = user.level;
    const calculatedLevel = getLevelFromXp(user.points);
    if (calculatedLevel !== user.level) {
      await prisma.users.update({
        where: { id: userId },
        data: { level: calculatedLevel },
      });
      currentLevel = calculatedLevel;
    }

    const xpProgress = getXpProgress(user.points);
    const levelTitle = getLevelTitle(currentLevel);

    const rank = await prisma.users.count({
      where: { points: { gt: user.points }, role: "user" },
    });

    const completedPrograms = await prisma.program_enrollments.count({
      where: { userId },
    });

    const quizAttempts = await prisma.quiz_attempts.count({
      where: { userId },
    });

    const attendances = await prisma.attendance.findMany({
      where: { userId },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    let streak = 0;
    if (attendances.length > 0) {
      const uniqueDates = new Set<string>();
      for (const att of attendances) {
        uniqueDates.add(new Date(att.createdAt).toLocaleDateString("en-CA"));
      }

      const sortedDates = Array.from(uniqueDates).sort((a, b) => b.localeCompare(a));
      const today = new Date();
      const todayStr = today.toLocaleDateString("en-CA");
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString("en-CA");

      let checkDate: Date;
      if (sortedDates[0] === todayStr) {
        checkDate = new Date(today);
      } else if (sortedDates[0] === yesterdayStr) {
        checkDate = new Date(yesterday);
      } else {
        streak = 0;
        checkDate = new Date(0); // won't hit the loop
      }

      if (streak !== 0 || sortedDates[0] === todayStr || sortedDates[0] === yesterdayStr) {
         while (true) {
          const checkStr = checkDate.toLocaleDateString("en-CA");
          if (uniqueDates.has(checkStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    // Gamification data matching old API
    const gamificationData = {
      stats: {
        points: user.points,
        badges: user.badges,
        quizzes: quizAttempts,
        streak,
        level: currentLevel,
        rank: rank + 1,
      },
      xpProgress: { ...xpProgress, levelTitle },
      completedPrograms,
    };

    // 2. Fetch Activities, Badges, and Enrollments in parallel
    const [activitiesRaw, allBadges, earnedBadges, enrollmentsRaw] = await Promise.all([
      prisma.activity_logs.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, type: true, title: true, description: true, xpEarned: true, createdAt: true, metadata: true },
      }),
      prisma.badges.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
      prisma.user_badges.findMany({
        where: { userId },
        select: { badgeId: true, earnedAt: true },
      }),
      prisma.program_enrollments.findMany({
        where: { userId },
        include: {
          programs: { select: { id: true, title: true, description: true, thumbnailUrl: true, totalKajian: true } }
        },
        orderBy: { enrolledAt: "desc" },
      })
    ]);

    // Process Badges
    const earnedMap = new Map(earnedBadges.map((eb) => [eb.badgeId, eb.earnedAt]));
    const badges = allBadges.map((badge) => ({
      id: badge.id,
      code: badge.code,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      requirement: badge.requirement,
      xpReward: badge.xpReward,
      earned: earnedMap.has(badge.id),
      earnedAt: earnedMap.get(badge.id) || null,
    }));

    // Process Enrollments
    const enrollments = await Promise.all(
      enrollmentsRaw.map(async (e) => {
        const materialRawQuery = await prisma.material.findMany({
          where: { programId: e.programId },
          select: { id: true }
        });
        const materialCount = materialRawQuery.length;
        const materialIds = materialRawQuery.map(m => m.id);

        const attendanceCount = await prisma.attendance.count({
          where: { userId, status: "hadir", materialId: { in: materialIds } },
        });

        const totalKajian = (e as any).programs.totalKajian > 0 ? (e as any).programs.totalKajian : materialCount;

        return {
          id: e.id,
          program: (e as any).programs,
          enrolledAt: e.enrolledAt.toISOString(),
          isCompleted: materialCount > 0 && attendanceCount >= totalKajian,
        };
      })
    );

    // 3. Optional: Academy Overview for Instructor
    let academyOverview: any = null;
    if (role === "instruktur") {
      const activeCourses = await prisma.courseenrollment.count({
        where: { userId, role: "instructor", material: { date: { gte: new Date() } } }
      });

      const instructorMaterials = await prisma.material.findMany({
        where: { instructorId: userId, date: { lt: new Date() } },
        select: { id: true }
      });
      const completedSessions = instructorMaterials.length;

      const agg = await prisma.attendance.aggregate({
        where: { materialId: { in: instructorMaterials.map(m => m.id) } },
        _avg: { rating: true }
      });
      const averageRating = agg._avg.rating ? agg._avg.rating.toFixed(1) : "0.0";

      // Reformat admin/academy activities which are mixed
      const recentRaw = await prisma.activity_logs.findMany({
        where: { userId, type: { in: ["admin_user_managed", "admin_program_managed", "admin_news_managed", "admin_schedule_managed", "admin_competition_managed", "admin_admin_managed", "admin_material_managed"] } },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      const formatDateAcademy = (date: Date) => {
        const diffMs = new Date().getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        if (diffMin < 1) return "Baru saja";
        if (diffMin < 60) return `${diffMin} menit yang lalu`;
        if (diffHour < 24) return `${diffHour} jam yang lalu`;
        return `${diffDay} hari yang lalu`;
      };

      const recentActivities = recentRaw.map(a => ({
        id: a.id,
        type: a.type,
        title: a.description || a.title,
        time: formatDateAcademy(a.createdAt),
      }));

      academyOverview = {
        stats: { activeCourses, completedSessions, averageRating },
        recentActivities
      };
    }

    return NextResponse.json({
      gamification: gamificationData,
      activities: activitiesRaw,
      badges: { badges: badges, earnedCount: earnedBadges.length, totalCount: allBadges.length },
      enrollments: enrollments,
      academyData: academyOverview
    });

  } catch (error: any) {
    console.error("Profile Summary API Error:", error);
    return NextResponse.json({ error: "Failed to fetch profile summary" }, { status: 500 });
  }
}
