import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    const role = session?.user?.role?.toLowerCase();

    if (
      !session ||
      (role !== "instruktur" && role !== "admin" && role !== "super_admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all programs with materials, enrollments, and instructor
    const programs = await prisma.programs.findMany({
      include: {
        users: { select: { id: true, name: true, avatar: true } },
        material: {
          select: {
            id: true,
            title: true,
            kajianOrder: true,
            date: true,
            startedAt: true,
          },
          orderBy: { kajianOrder: "asc" },
        },
        program_enrollments: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter programs for instruktur - only their own programs
    const filteredPrograms =
      role === "instruktur"
        ? programs.filter((p) => p.instructorId === session.user.id)
        : programs;

    // Fetch ALL attendance records for materials in these programs
    const allMaterialIds = filteredPrograms.flatMap((p) =>
      p.material.map((m) => m.id)
    );

    const attendances = await prisma.attendance.findMany({
      where: { materialId: { in: allMaterialIds } },
      select: { userId: true, materialId: true, status: true },
    });

    // Build attendance lookup: materialId -> Set of userIds who attended
    const attendanceMap = new Map<string, Set<string>>();
    for (const att of attendances) {
      if (!attendanceMap.has(att.materialId)) {
        attendanceMap.set(att.materialId, new Set());
      }
      attendanceMap.get(att.materialId)!.add(att.userId);
    }

    const GRADE_LABEL: Record<string, string> = {
      X: "Kelas 10",
      XI: "Kelas 11",
      XII: "Kelas 12",
    };

    const CATEGORY_LABEL: Record<string, string> = {
      Wajib: "Program Wajib",
      Extra: "Program Ekstra",
      NextLevel: "Program Susulan",
      Susulan: "Program Susulan",
    };

    // Build response
    let totalEnrollments = 0;
    let totalAttendanceCount = 0;
    let totalPossibleAttendance = 0;
    const uniqueEnrolledUserIds = new Set<string>();

    const programsData = filteredPrograms.map((p) => {
      const enrolledUsers = p.program_enrollments.map((e) => {
        const user = e.users;
        // For each user, compute attendance per material
        const materialProgress = p.material.map((m) => {
          const attended = attendanceMap.get(m.id)?.has(user.id) || false;
          return {
            materialId: m.id,
            materialTitle: m.title,
            kajianOrder: m.kajianOrder,
            attended,
          };
        });

        const attendedCount = materialProgress.filter(
          (mp) => mp.attended
        ).length;
        // Use totalKajian as the target if set, otherwise fall back to material count
        const totalTarget = p.totalKajian > 0
          ? Math.max(p.totalKajian, p.material.length)
          : p.material.length;
        const progressPercent =
          totalTarget > 0
            ? Math.round((attendedCount / totalTarget) * 100)
            : 0;

        totalAttendanceCount += attendedCount;
        totalPossibleAttendance += totalTarget;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          enrolledAt: e.enrolledAt,
          attendedCount,
          totalMaterials: totalTarget,
          progressPercent,
          materialProgress,
        };
      });

      totalEnrollments += enrolledUsers.length;
      enrolledUsers.forEach((u) => uniqueEnrolledUserIds.add(u.id));

      return {
        id: p.id,
        title: p.title,
        description: p.description,
        grade: GRADE_LABEL[p.grade] || p.grade,
        category: CATEGORY_LABEL[p.category] || p.category,
        thumbnailUrl: p.thumbnailUrl,
        instructor: p.users?.name || "Instruktur",
        instructorAvatar: p.users?.avatar,
        totalKajian: p.totalKajian,
        materialCount: p.material.length,
        enrollmentCount: enrolledUsers.length,
        materials: p.material.map((m) => ({
          id: m.id,
          title: m.title,
          kajianOrder: m.kajianOrder,
          date: m.date,
          startedAt: m.startedAt,
          attendanceCount: attendanceMap.get(m.id)?.size || 0,
        })),
        enrolledUsers,
      };
    });

    const avgAttendance =
      totalPossibleAttendance > 0
        ? Math.round((totalAttendanceCount / totalPossibleAttendance) * 100)
        : 0;

    return NextResponse.json({
      stats: {
        totalPrograms: filteredPrograms.length,
        totalEnrollments,
        uniqueEnrolledUsers: uniqueEnrolledUserIds.size,
        totalMaterials: allMaterialIds.length,
        avgAttendance,
      },
      programs: programsData,
    });
  } catch (error) {
    console.error("Kajian Progress API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
