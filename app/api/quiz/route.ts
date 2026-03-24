import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET - list all quizzes (material + standalone) the user can access
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isPrivileged =
      user.role === "instruktur" ||
      user.role === "admin" ||
      user.role === "super_admin";

    // Build a set of INACTIVE quiz IDs to exclude (non-privileged users only)
    let inactiveQuizIdSet: Set<string> = new Set();
    if (!isPrivileged) {
      try {
        const inactiveRows: any[] =
          await prisma.$queryRaw`SELECT id FROM material_quizzes WHERE isActive = 0`;
        inactiveQuizIdSet = new Set(inactiveRows.map((q) => String(q.id)));
      } catch (e) {
        // If column doesn't exist yet, show all quizzes (safe fallback)
        console.warn("isActive column query failed, showing all quizzes:", e);
      }
    }

    // 1. Standalone quizzes (materialId is null) — fetch all, filter later
    const allStandaloneQuizzes = await prisma.material_quizzes.findMany({
      where: { materialId: null },
      include: {
        users: { select: { id: true, name: true, avatar: true } },
        quiz_questions: { select: { id: true } },
        quiz_attempts: {
          where: { userId: session.user.id },
          orderBy: { completedAt: "desc" },
          take: 1,
          select: { score: true, totalScore: true, completedAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter inactive quizzes for regular users
    const standaloneQuizzes = isPrivileged
      ? allStandaloneQuizzes
      : allStandaloneQuizzes.filter((q) => !inactiveQuizIdSet.has(q.id));

    // 2. Material-bound quizzes
    let materialQuizzes: any[] = [];

    if (isPrivileged) {
      // Instructors/admins see all
      materialQuizzes = await prisma.material_quizzes.findMany({
        where: { materialId: { not: null } },
        include: {
          material: { select: { id: true, title: true, thumbnailUrl: true } },
          quiz_questions: { select: { id: true } },
          quiz_attempts: {
            where: { userId: session.user.id },
            orderBy: { completedAt: "desc" },
            take: 1,
            select: { score: true, totalScore: true, completedAt: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Regular users: only active quizzes from accepted materials
      const acceptedInvites = await prisma.materialinvite.findMany({
        where: { userId: session.user.id, status: "accepted" },
        select: { materialId: true },
      });
      const materialIds = acceptedInvites.map((i) => i.materialId);

      if (materialIds.length > 0) {
        const allMaterialQuizzes = await prisma.material_quizzes.findMany({
          where: { materialId: { in: materialIds } },
          include: {
            material: { select: { id: true, title: true, thumbnailUrl: true } },
            quiz_questions: { select: { id: true } },
            quiz_attempts: {
              where: { userId: session.user.id },
              orderBy: { completedAt: "desc" },
              take: 1,
              select: { score: true, totalScore: true, completedAt: true },
            },
          },
          orderBy: { createdAt: "desc" },
        });
        // Filter inactive quizzes
        materialQuizzes = allMaterialQuizzes.filter(
          (q) => !inactiveQuizIdSet.has(q.id),
        );
      }
    }

    const visibleQuizIds = new Set<string>([
      ...standaloneQuizzes.map((q) => q.id),
      ...materialQuizzes.map((q: any) => q.id),
    ]);

    // 3. Total XP earned from quizzes shown on this page only
    const quizLogs = await prisma.activity_logs.findMany({
      where: {
        userId: session.user.id,
        type: "quiz_completed",
      },
      select: {
        xpEarned: true,
        metadata: true,
      },
    });

    const totalQuizXp = quizLogs.reduce((sum, log: any) => {
      const quizId = log?.metadata?.quizId as string | undefined;
      if (!quizId) return sum;
      if (!visibleQuizIds.has(quizId)) return sum;
      return sum + (log.xpEarned || 0);
    }, 0);

    // Format results
    const quizzes = [
      ...standaloneQuizzes.map((q) => ({
        id: q.id,
        materialId: null,
        materialTitle: null,
        title: q.title,
        description: q.description,
        questionCount: q.quiz_questions.length,
        creatorName: q.users?.name || "Unknown",
        creatorAvatar: q.users?.avatar || null,
        isStandalone: true,
        createdAt: q.createdAt,
        lastAttempt: q.quiz_attempts[0] || null,
      })),
      ...materialQuizzes.map((q: any) => ({
        id: q.id,
        materialId: q.materialId,
        materialTitle: q.material?.title || "Materi",
        materialThumbnail: q.material?.thumbnailUrl || null,
        title: q.title,
        description: q.description,
        questionCount: q.quiz_questions?.length || 0,
        creatorName: null,
        creatorAvatar: null,
        isStandalone: false,
        createdAt: q.createdAt,
        lastAttempt: q.quiz_attempts?.[0] || null,
      })),
    ];

    return NextResponse.json({
      quizzes,
      totalQuizXp,
    });
  } catch (error) {
    console.error("Get all quizzes error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar quiz" },
      { status: 500 },
    );
  }
}

// POST - create a standalone quiz (not tied to material)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
    });
    if (
      !user ||
      (user.role !== "instruktur" &&
        user.role !== "admin" &&
        user.role !== "super_admin")
    ) {
      return NextResponse.json(
        { error: "Hanya instruktur atau admin yang bisa membuat quiz" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { title, description, questions } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Judul quiz tidak boleh kosong" },
        { status: 400 },
      );
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Quiz harus memiliki minimal 1 soal" },
        { status: 400 },
      );
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question?.trim()) {
        return NextResponse.json(
          { error: `Soal ke-${i + 1} tidak boleh kosong` },
          { status: 400 },
        );
      }
      if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
        return NextResponse.json(
          { error: `Soal ke-${i + 1} harus memiliki minimal 2 opsi` },
          { status: 400 },
        );
      }
      const hasCorrect = q.options.some((o: any) => o.isCorrect === true);
      if (!hasCorrect) {
        return NextResponse.json(
          { error: `Soal ke-${i + 1} harus memiliki 1 jawaban benar` },
          { status: 400 },
        );
      }
    }

    const quiz = await prisma.material_quizzes.create({
      data: {
        id: crypto.randomUUID(),
        materialId: null,
        creatorId: session.user.id,
        title: title.trim(),
        description: description?.trim() || null,
        updatedAt: new Date(),
        quiz_questions: {
          create: questions.map((q: any, idx: number) => ({
            id: crypto.randomUUID(),
            question: q.question.trim(),
            order: idx,
            quiz_options: {
              create: q.options.map((o: any) => ({
                id: crypto.randomUUID(),
                text: o.text.trim(),
                isCorrect: o.isCorrect === true,
              })),
            },
          })),
        },
      },
      include: {
        quiz_questions: {
          include: { quiz_options: true },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({ success: true, quiz }, { status: 201 });
  } catch (error) {
    console.error("Create standalone quiz error:", error);
    return NextResponse.json({ error: "Gagal membuat quiz" }, { status: 500 });
  }
}
