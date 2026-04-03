import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { grantXp } from "@/lib/gamification";

// POST: Enroll current user in program
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const program = await prisma.programs.findUnique({ where: { id } });
    if (!program) {
      return NextResponse.json(
        { error: "Program tidak ditemukan" },
        { status: 404 },
      );
    }

    // Sequential enrollment validation
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    const isPrivileged = user?.role === "instruktur" || user?.role === "admin" || user?.role === "super_admin";

    if (program.stageOrder && program.stageOrder > 1 && !isPrivileged) {
      // Find prerequisite program (same grade + category, previous stageOrder)
      const prereq = await prisma.programs.findFirst({
        where: {
          grade: program.grade,
          category: program.category,
          stageOrder: program.stageOrder - 1,
        },
        select: { id: true, title: true, totalKajian: true, material: { select: { id: true } } },
      });

      if (prereq) {
        const prereqMaterialIds = prereq.material.map((m) => m.id);
        const prereqAttendanceCount = prereqMaterialIds.length > 0
          ? await prisma.attendance.count({
              where: { userId: session.user.id, materialId: { in: prereqMaterialIds }, status: "hadir" },
            })
          : 0;
        const prereqTotal = prereq.totalKajian > 0 ? prereq.totalKajian : prereqMaterialIds.length;
        const prereqCompleted = prereqTotal > 0 && prereqAttendanceCount >= prereqTotal;

        if (!prereqCompleted) {
          return NextResponse.json(
            { error: `Kamu harus menyelesaikan "${prereq.title}" terlebih dahulu sebelum mendaftar program ini.` },
            { status: 403 },
          );
        }
      }
    }

    // Check if already enrolled
    const existing = await prisma.program_enrollments.findUnique({
      where: { programId_userId: { programId: id, userId: session.user.id } },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Sudah terdaftar di program ini" },
        { status: 200 },
      );
    }

    await prisma.program_enrollments.create({
      data: {
        id: crypto.randomUUID(),
        programId: id,
        userId: session.user.id,
      },
    });

    // Grant XP for program enrollment
    try {
      await grantXp({
        userId: session.user.id,
        type: "program_enrolled",
        title: `Mendaftar Program: ${program.title}`,
        description: `Berhasil mendaftar di program ${program.title}`,
        metadata: { programId: id, programName: program.title },
      });
    } catch (e) {
      console.error("Gagal grant XP program enroll:", e);
    }

    return NextResponse.json(
      { message: "Berhasil mendaftar di program" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error enrolling in program:", error);
    return NextResponse.json({ error: "Gagal mendaftar" }, { status: 500 });
  }
}
