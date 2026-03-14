import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user || (session.user.role !== "instruktur" && session.user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const instructorId = session.user.id;

  // 1. Total Siswa: Total count of users with role 'user' on the platform
  const totalStudents = await prisma.user.count({ 
    where: { role: "user" } 
  });

  // 2. Sesi Selesai & Kajian Aktif
  const instructorMaterials = await prisma.material.findMany({
    where: { instructorId },
    include: {
      materialinvite: {
        where: { status: { not: "rejected" } }
      }
    }
  });

  let completedSessions = 0;
  
  // Sesi selesai dihitung HANYA JIKA semua user yang diundang sudah absen (tidak boleh 0 yang diundang)
  for (const material of instructorMaterials) {
    const inviteCount = material.materialinvite.length;
    if (inviteCount === 0) continue; 

    const attendanceCount = await prisma.attendance.count({
      where: {
        materialId: material.id,
        userId: {
          in: material.materialinvite.map(i => i.userId)
        }
      }
    });

    if (attendanceCount >= inviteCount && inviteCount > 0) {
      completedSessions++;
    }
  }

  // Kajian aktif = Total kajian - Sesi Selesai
  const activeCourses = instructorMaterials.length - completedSessions;

  // 4. Rating Rata-rata Profesional (dari rata-rata per kajian)
  const materialRatings = await Promise.all(instructorMaterials.map(async (mat) => {
    const ratings = await prisma.attendance.findMany({
      where: { materialId: mat.id, rating: { not: null } },
      select: { rating: true }
    });
    
    if (ratings.length === 0) return null;
    
    const sum = ratings.reduce((acc, curr) => acc + (curr.rating || 0), 0);
    return sum / ratings.length;
  }));

  const validRatings = materialRatings.filter((r): r is number => r !== null);
  const averageRating = validRatings.length > 0
    ? Number((validRatings.reduce((acc, curr) => acc + curr, 0) / validRatings.length).toFixed(1))
    : 0;

  // 5. Today's Materials (Jadwal Kajian Mendatang)
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const rawTodayMaterials = await prisma.material.findMany({
    where: { 
      instructorId,
      date: {
        gte: today,
        lt: tomorrow
      }
    },
    include: {
      materialinvite: {
        where: { status: { not: "rejected" } }
      }
    },
    orderBy: { date: 'asc' }
  });

  const currentTimeStr = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');

  const upcomingClasses: any[] = [];

  for (const m of rawTodayMaterials) {
    const inviteCount = m.materialinvite.length;
    let isCompleted = false;

    // Cek apakah semua undangan sudah diabsen (dihitung Selesai)
    if (inviteCount > 0) {
      const attendanceCount = await prisma.attendance.count({
        where: {
          materialId: m.id,
          userId: {
            in: m.materialinvite.map(i => i.userId)
          }
        }
      });
      if (attendanceCount >= inviteCount) {
        isCompleted = true;
      }
    }

    const startTime = m.startedAt || "00:00";
    const isOngoingOrPast = currentTimeStr >= startTime;
    
    // Jangan tampilkan jika statusnya sudah "sedang berlangsung" ke atas, KECUALI dia sudah tuntas (supaya bisa ditag Tuntas di tampilan depan)
    // Tampilkan jika belum lewat waktu, ATAU dia tuntas hari ini.
    if (!isOngoingOrPast || isCompleted) {
      upcomingClasses.push({
        id: m.id,
        title: m.title,
        time: startTime,
        students: inviteCount,
        room: m.location || "TBA",
        status: "upcoming",
        isCompleted: isCompleted
      });
    }
  }

  // 6. Recent Activities (Heuristic from multiple models)
  const [latestMaterials, latestSchedules, latestCompetitions, latestNews] = await Promise.all([
    prisma.material.findMany({ where: { instructorId }, orderBy: { updatedAt: 'desc' }, take: 3 }),
    prisma.schedule.findMany({ where: { instructorId }, orderBy: { updatedAt: 'desc' }, take: 3 }),
    prisma.competition.findMany({ where: { instructorId }, orderBy: { updatedAt: 'desc' }, take: 3 }),
    prisma.news.findMany({ where: { authorId: instructorId }, orderBy: { updatedAt: 'desc' }, take: 3 })
  ]);

  const isNew = (created: Date, updated: Date) => Math.abs(updated.getTime() - created.getTime()) < 1000;

  const allActivities = [
    ...latestMaterials.map(m => ({
      id: `mat-${m.id}`,
      type: 'material',
      title: `${isNew(m.createdAt, m.updatedAt) ? 'Membuat' : 'Mengedit'} Kajian: ${m.title}`,
      updatedAt: m.updatedAt
    })),
    ...latestSchedules.map(s => ({
      id: `sch-${s.id}`,
      type: 'schedule',
      title: `${isNew(s.createdAt, s.updatedAt) ? 'Membuat' : 'Mengedit'} Kegiatan: ${s.title}`,
      updatedAt: s.updatedAt
    })),
    ...latestCompetitions.map(c => ({
      id: `comp-${c.id}`,
      type: 'competition',
      title: `${isNew(c.createdAt, c.updatedAt) ? 'Membuat' : 'Mengedit'} Lomba: ${c.title}`,
      updatedAt: c.updatedAt
    })),
    ...latestNews.map(n => ({
      id: `news-${n.id}`,
      type: 'news',
      title: `${isNew(n.createdAt, n.updatedAt) ? 'Menambahkan' : 'Mengedit'} Berita: ${n.title}`,
      updatedAt: n.updatedAt
    }))
  ];

  // Helper to format relative time
  const getRelativeTime = (date: Date) => {
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} hari yang lalu`;
    if (hours > 0) return `${hours} jam yang lalu`;
    if (minutes > 0) return `${minutes} menit yang lalu`;
    return "Baru saja";
  };

  const recentActivities = allActivities
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 3)
    .map(act => ({
      id: act.id,
      title: act.title,
      time: getRelativeTime(act.updatedAt),
      type: act.type
    }));

  // 7. Courses Overview
  const coursesOverview = await Promise.all(instructorMaterials.map(async (mat) => {
    const inviteCount = mat.materialinvite.length;
    const attendanceCount = await prisma.attendance.count({
      where: {
        materialId: mat.id,
        userId: {
          in: mat.materialinvite.map(i => i.userId)
        }
      }
    });

    const progress = inviteCount > 0 ? Math.round((attendanceCount / inviteCount) * 100) : 0;
    
    // Average rating for this material
    const matRatings = await prisma.attendance.findMany({
      where: { materialId: mat.id, rating: { not: null } },
      select: { rating: true }
    });
    const matRating = matRatings.length > 0
      ? (matRatings.reduce((acc, curr) => acc + (curr.rating || 0), 0) / matRatings.length).toFixed(1)
      : "0";

    return {
      id: mat.id,
      title: mat.title,
      students: inviteCount,
      sessions: attendanceCount,
      rating: matRating,
      progress: progress
    };
  }));

  // 8. Daily Achievement (Pencapaian Hari Ini)
  const dailyMaterials = await prisma.material.findMany({
    where: { 
      instructorId,
      date: {
        gte: today, // this is `now` set to 00:00:00 locally
        lt: tomorrow
      }
    }
  });
  
  // But wait! We only want to count courses that were TAUGHT today, meaning they have to have at least 1 attendance by someone, or simply matching the schedule date is enough as requested: "kajian kajian yang di hari itu dihadiri oleh instrukttur dicatat". So length is fine: 
  const dailySessions = dailyMaterials.length;

  const dailyMaterialRatings = await Promise.all(dailyMaterials.map(async (mat) => {
    const ratings = await prisma.attendance.findMany({
      where: { materialId: mat.id, rating: { not: null } },
      select: { rating: true }
    });
    if (ratings.length === 0) return null;
    return ratings.reduce((acc, curr) => acc + (curr.rating || 0), 0) / ratings.length;
  }));

  const validDailyRatings = dailyMaterialRatings.filter((r): r is number => r !== null);
  const dailyRating = validDailyRatings.length > 0
    ? Number((validDailyRatings.reduce((acc, curr) => acc + curr, 0) / validDailyRatings.length).toFixed(1))
    : 0;

  return NextResponse.json({
    stats: {
      totalStudents,
      activeCourses,
      completedSessions,
      averageRating,
    },
    upcomingClasses,
    recentActivities,
    coursesOverview,
    achievement: {
      dailySessions,
      dailyRating
    }
  });
}
