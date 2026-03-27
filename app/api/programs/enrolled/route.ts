import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/programs/enrolled
 * Ambil program yang diikuti oleh user yang sedang login
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const enrollments = await prisma.program_enrollments.findMany({
      where: { userId: session.user.id },
      include: {
        programs: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnailUrl: true,
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    const enrollmentDetails = await Promise.all(
      enrollments.map(async (e) => {
        const materialCount = await prisma.material.count({
          where: { programId: e.programId },
        });

        const materials = await prisma.material.findMany({
          where: { programId: e.programId },
          select: { id: true },
        });
        const materialIds = materials.map((m) => m.id);

        const attendanceCount = await prisma.attendance.count({
          where: {
            userId: session.user.id,
            status: "hadir",
            materialId: { in: materialIds },
          },
        });

        const totalKajian =
          (e as any).programs.totalKajian > 0
            ? (e as any).programs.totalKajian
            : materialCount;

        return {
          id: e.id,
          program: (e as any).programs,
          enrolledAt: e.enrolledAt.toISOString(),
          isCompleted: materialCount > 0 && attendanceCount >= totalKajian,
        };
      }),
    );

    return NextResponse.json({
      enrollments: enrollmentDetails,
    });
  } catch (error: any) {
    console.error("🔥 Error GET /api/programs/enrolled:", error.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
