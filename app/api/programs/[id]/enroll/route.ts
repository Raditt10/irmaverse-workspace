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
