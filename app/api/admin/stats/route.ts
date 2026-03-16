import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    const role = session?.user?.role?.toLowerCase();
    if (!session || (role !== "admin" && role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalUsers, 
      totalInstructors, 
      totalActiveMaterials, 
      totalCompletedMaterials, 
      recentMaterials, 
      recentNews, 
      recentUsers,
      instructorMaterials,
      instructorSchedules,
      instructorCompetitions,
      instructorNews,
      userActivities
    ] = await Promise.all([
      prisma.users.count({
        where: {
          role: "user"
        }
      }),
      prisma.users.count({
        where: {
          role: "instruktur"
        }
      }),
      prisma.material.count({
        where: {
          rekapan: {
            is: null
          }
        }
      }),
      prisma.material.count({
        where: {
          rekapan: {
            isNot: null
          }
        }
      }),
      prisma.material.findMany({
        take: 5,
        orderBy: {
          date: 'desc'
        },
        include: {
          users: {
            select: {
              name: true
            }
          },
          rekapan: {
            select: {
              id: true
            }
          },
          materialinvite: {
            where: {
              status: { not: "rejected" }
            }
          }
        }
      }),
      prisma.news.findMany({
        take: 2,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.users.findMany({
        where: {
          role: "user"
        },
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          createdAt: true
        }
      }),
      // Instructor Activities: Fetch from all users with role 'instruktur'
      prisma.material.findMany({ orderBy: { updatedAt: 'desc' }, take: 5, include: { users: { select: { name: true } } } }),
      prisma.schedules.findMany({ orderBy: { updatedAt: 'desc' }, take: 5, include: { users: { select: { name: true } } } }),
      prisma.competitions.findMany({ orderBy: { updatedAt: 'desc' }, take: 5, include: { users: { select: { name: true } } } }),
      prisma.news.findMany({ orderBy: { updatedAt: 'desc' }, take: 5, include: { users: { select: { name: true } } } }),
      // User Activities: Fetch from all members
      prisma.activity_logs.findMany({
        where: {
          type: { not: "profile_completed" }
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { users: { select: { name: true } } }
      })
    ]);

    // Efficiently calculate total active/completed materials
    const [allMaterials, allAttendanceCounts] = await Promise.all([
      prisma.material.findMany({
        select: {
          id: true,
          materialinvite: {
            where: { status: { not: "rejected" } },
            select: { userId: true }
          }
        }
      }),
      prisma.attendance.groupBy({
        by: ['materialId'],
        _count: { _all: true }
      })
    ]);

    const attendanceMap = new Map(allAttendanceCounts.map(a => [a.materialId, a._count._all]));
    
    let activeCount = 0;
    let completedCount = 0;

    for (const m of allMaterials) {
      const inviteCount = m.materialinvite.length;
      if (inviteCount === 0) continue;

      const attendanceCount = attendanceMap.get(m.id) || 0;
      if (attendanceCount >= inviteCount) {
        completedCount++;
      } else {
        activeCount++;
      }
    }

    // Re-calculating attendance counts for recent materials precisely for invited users
    const preciseAttendanceCounts = await Promise.all(
      (recentMaterials as any[]).map(m => 
        prisma.attendance.count({ 
          where: { 
            materialId: m.id,
            userId: {
              in: m.materialinvite?.map((i: any) => i.userId) || []
            }
          } 
        })
      )
    );

    const finalFormattedMaterials = (recentMaterials as any[]).map((m, index) => {
      const inviteCount = m.materialinvite?.length || 0;
      const attendanceCount = preciseAttendanceCounts[index] || 0;
      const isCompleted = inviteCount > 0 && attendanceCount >= inviteCount;

      return {
        id: m.id,
        title: m.title,
        instructor: m.users?.name || "TBA",
        createdAt: m.createdAt,
        isCompleted: isCompleted,
        inviteCount,
        attendanceCount
      };
    });

    const formattedNews = (recentNews as any[]).map(n => ({
      id: n.id,
      title: n.title,
      slug: n.slug,
      image: n.image,
      category: n.category,
      createdAt: n.createdAt
    }));

    const formattedUsers = (recentUsers as any[]).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      createdAt: u.createdAt
    }));

    const isNew = (created: Date, updated: Date) => Math.abs(updated.getTime() - created.getTime()) < 1000;

    const allActivities = [
      ...instructorMaterials.map((m: any) => ({
        id: `mat-${m.id}`,
        type: 'material',
        title: `${isNew(m.createdAt, m.updatedAt) ? 'Membuat' : 'Mengedit'} Kajian: ${m.title}`,
        user: m.users?.name || "Instruktur",
        updatedAt: m.updatedAt
      })),
      ...instructorSchedules.map((s: any) => ({
        id: `sch-${s.id}`,
        type: 'schedule',
        title: `${isNew(s.createdAt, s.updatedAt) ? 'Membuat' : 'Mengedit'} Kegiatan: ${s.title}`,
        user: s.users?.name || "Instruktur",
        updatedAt: s.updatedAt
      })),
      ...instructorCompetitions.map((c: any) => ({
        id: `comp-${c.id}`,
        type: 'competition',
        title: `${isNew(c.createdAt, c.updatedAt) ? 'Membuat' : 'Mengedit'} Lomba: ${c.title}`,
        user: c.users?.name || "Instruktur",
        updatedAt: c.updatedAt
      })),
      ...instructorNews.map((n: any) => ({
        id: `news-${n.id}`,
        type: 'news',
        title: `${isNew(n.createdAt, n.updatedAt) ? 'Menambahkan' : 'Mengedit'} Berita: ${n.title}`,
        user: n.users?.name || "Instruktur",
        updatedAt: n.updatedAt
      }))
    ];

    const instructorActivities = allActivities
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5)
      .map(act => ({
        id: act.id,
        title: act.title,
        user: act.user,
        type: act.type,
        updatedAt: act.updatedAt
      }));

    const formattedUserActivities = (userActivities as any[]).map(act => ({
      id: act.id,
      title: act.title,
      user: act.users?.name || "Member",
      type: act.type,
      createdAt: act.createdAt
    }));

    return NextResponse.json({
      totalUsers,
      totalInstructors,
      totalActiveMaterials: activeCount,
      totalCompletedMaterials: completedCount,
      recentMaterials: finalFormattedMaterials,
      recentNews: formattedNews,
      recentUsers: formattedUsers,
      instructorActivities,
      userActivities: formattedUserActivities
    });
  } catch (error) {
    console.error("Admin Stats API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
