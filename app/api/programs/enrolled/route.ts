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

    const enrollments = await prisma.program_enrollment.findMany({
      where: { userId: session.user.id },
      include: {
        program: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    return NextResponse.json({
      enrollments: enrollments.map((e) => ({
        id: e.id,
        program: e.program,
        enrolledAt: e.enrolledAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error("🔥 Error GET /api/programs/enrolled:", error.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
