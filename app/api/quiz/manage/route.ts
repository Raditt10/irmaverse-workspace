import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET - list all quizzes created by the current instructor/admin
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
    });
    if (!user || (user.role !== "instruktur" && user.role !== "admin" && user.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // For admins, show all quizzes. For instruktur, show only their own.
    const whereClause =
      user.role === "admin" || user.role === "super_admin"
        ? {}
        : {
            OR: [
              { creatorId: session.user.id },
              { material: { instructorId: session.user.id } },
            ],
          };

    const quizzes = await prisma.material_quizzes.findMany({
      where: whereClause,
      include: {
        material: { select: { id: true, title: true } },
        users: { select: { id: true, name: true } },
        quiz_questions: { select: { id: true } },
        quiz_attempts: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = quizzes.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      materialId: q.materialId,
      materialTitle: q.material?.title ?? null,
      creatorName: q.users?.name ?? null,
      questionCount: q.quiz_questions.length,
      attemptCount: q.quiz_attempts.length,
      createdAt: q.createdAt,
      isStandalone: q.materialId === null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get manage quizzes error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data quiz" },
      { status: 500 },
    );
  }
}
