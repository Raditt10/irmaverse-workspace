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

    // 1. Get User Baseline & Gamification
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { points: true, level: true },
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

    const levelData = {
      level: currentLevel,
      levelTitle,
      points: user.points,
      currentLevelXp: xpProgress.currentLevelXp,
      nextLevelXp: xpProgress.nextLevelXp,
      progressPercent: xpProgress.progressPercent,
    };

    // 2. Data Fetching
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const [
      favoriteInstructorsRel,
      allMaterials,
      attendanceRecords,
      allQuizzesData,
      allNewsData,
    ] = await Promise.all([
      // Favorites
      prisma.favorite_instructors.findMany({
        where: { userId },
        select: { instructorId: true },
      }),
      // Materials (top 5 later, but need all for today and quizzes filtering)
      // Getting recent materials first
      prisma.material.findMany({
        orderBy: { date: 'desc' },
        take: 50,
        include: {
          courseenrollment: {
            where: { userId }
          },
          users: { 
            select: { name: true }
          }
        }
      }),
      // Attendance
      prisma.attendance.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      // Quizzes attempts
      prisma.quiz_attempts.findMany({
        where: { userId },
      }),
      // Latest News
      prisma.news.findMany({
        where: {
          createdAt: {
            gte: threeDaysAgo
          }
        },
        orderBy: { createdAt: "desc" },
        take: 2,
        select: { id: true, title: true, deskripsi: true, image: true, category: true, slug: true, createdAt: true }
      })
    ]);

    // 3. Process Favorite Instructors
    const favoriteIds = favoriteInstructorsRel.map((f) => f.instructorId);
    let favoriteInstructors: any[] = [];
    if (favoriteIds.length > 0) {
      const instructors = await prisma.users.findMany({
        where: { id: { in: favoriteIds }, role: "instruktur" },
        select: {
          id: true,
          name: true,
          avatar: true,
          bidangKeahlian: true,
          pengalaman: true,
          bio: true,
          material: { select: { id: true, date: true } },
        },
      });

      const now = new Date();
      favoriteInstructors = await Promise.all(
        instructors.map(async (instructor) => {
          const completedKajianCount = instructor.material.filter(
            (m) => new Date(m.date) < now
          ).length;

          const mIds = instructor.material.map((m) => m.id);
          let avgRating = 0;
          if (mIds.length > 0) {
            const ratingResult = await prisma.attendance.aggregate({
              where: { materialId: { in: mIds }, rating: { not: null } },
              _avg: { rating: true },
            });
            avgRating = ratingResult._avg.rating ?? 0;
          }

          const { material, ...rest } = instructor;
          return {
            ...rest,
            rating: Math.round(avgRating * 10) / 10,
            kajianCount: completedKajianCount,
          };
        })
      );
    }

    // 4. Process Materials
    const formattedMaterials = allMaterials.map(m => ({
      ...m,
      isJoined: m.courseenrollment.length > 0,
      instructor: m.users?.name || "TBA",
    }));
    
    // Recent 5 materials
    const materials = formattedMaterials.slice(0, 5);

    // Today's materials
    const todayStr = new Date().toLocaleDateString("en-CA");
    const todayMaterials = formattedMaterials.filter((m) => {
      const mDate = new Date(m.date).toLocaleDateString("en-CA");
      return mDate === todayStr && m.isJoined;
    });

    // 5. Process Finished Materials & Rekapan
    const attendedMaterialIds = attendanceRecords.map(a => a.materialId);
    
    // We only need top 2 from the last 24 hours for the dashboard summary
    const oneDayAgoRecap = new Date();
    oneDayAgoRecap.setDate(oneDayAgoRecap.getDate() - 1);

    const top2Attendance = attendanceRecords
      .filter(a => new Date(a.createdAt) >= oneDayAgoRecap)
      .slice(0, 2);

    let finishedMaterials: any[] = [];
    
    if (top2Attendance.length > 0) {
      const top2MaterialIds = top2Attendance.map(a => a.materialId);
      const rekapans = await prisma.rekapan.findMany({
        where: { materialId: { in: top2MaterialIds } }
      });
      
      finishedMaterials = top2Attendance.map(att => {
        const mData = formattedMaterials.find(m => m.id === att.materialId);
        const recData = rekapans.find(r => r.materialId === att.materialId);
        
        let plainText = "";
        if (recData?.content) {
          plainText = recData.content.replace(/<[^>]*>?/gm, "").substring(0, 120);
          if (recData.content.length > 120) plainText += "...";
        }
        
        return {
          ...att,
          attendedAt: att.createdAt, // Fix for "Invalid Date" in frontend
          grade: mData?.grade || "KELAS 10",
          category: mData?.category || "PROGRAM WAJIB",
          materialTitle: mData?.title || "Kajian",
          instructor: mData?.instructor || "TBA",
          contentPreview: plainText,
          link: recData?.link || "",
        };
      });
    }

    // 6. Quizzes and Dynamic Stats
    // Map quizzes
    const allQuizzes = await prisma.material_quizzes.findMany({
      where: {
        OR: [
          { materialId: { in: attendedMaterialIds } }
        ]
      },
      select: { 
        id: true, 
        title: true, 
        materialId: true, 
        quiz_questions: { select: { id: true } },
        material: { select: { title: true } }
      }
    });

    const enrichedQuizzes = allQuizzes.map(q => {
      const attempts = allQuizzesData.filter(a => a.quizId === q.id);
      const lastAttempt = attempts.length > 0 ? attempts.sort((a,b) => b.completedAt.getTime() - a.completedAt.getTime())[0] : null;
      return {
        ...q,
        questionCount: q.quiz_questions.length,
        materialTitle: q.material?.title || "Materi Terkait",
        isStandalone: false,
        lastAttempt
      };
    });

    const completedQuizzes = enrichedQuizzes.filter((q: any) => q.lastAttempt);
    const pendingQuizzes = enrichedQuizzes.filter((q: any) => !q.lastAttempt && !q.isStandalone && q.materialId && attendedMaterialIds.includes(q.materialId));

    let avgScore = 0;
    if (completedQuizzes.length > 0) {
      const totalPct = completedQuizzes.reduce((sum: number, q: any) => {
        const pct = q.lastAttempt.totalScore > 0 ? Math.round((q.lastAttempt.score / q.lastAttempt.totalScore) * 100) : 0;
        return sum + pct;
      }, 0);
      avgScore = Math.round(totalPct / completedQuizzes.length);
    }

    const dynamicStats = {
      totalAttended: attendanceRecords.length,
      quizCompleted: completedQuizzes.length,
      quizPending: pendingQuizzes.length,
      avgScore,
    };

    const upcomingQuizzes = pendingQuizzes.slice(0, 3);

    return NextResponse.json({
      levelData,
      favoriteInstructors,
      materials,
      todayMaterials,
      finishedMaterials,
      dynamicStats,
      upcomingQuizzes,
      latestNews: allNewsData,
    });
  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
