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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isPrivileged = user.role === "instruktur" || user.role === "admin";

    // 1. Standalone quizzes (materialId is null) — visible to everyone
    const standaloneQuizzes = await prisma.materialQuiz.findMany({
      where: { materialId: null },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        questions: { select: { id: true } },
        attempts: {
          where: { userId: session.user.id },
          orderBy: { completedAt: "desc" },
          take: 1,
          select: { score: true, totalScore: true, completedAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Material-bound quizzes — only from materials user has access to
    let materialQuizzes: any[] = [];

    if (isPrivileged) {
      // Instructors/admins can see all material quizzes
      materialQuizzes = await prisma.materialQuiz.findMany({
        where: { materialId: { not: null } },
        include: {
          material: { select: { id: true, title: true } },
          questions: { select: { id: true } },
          attempts: {
            where: { userId: session.user.id },
            orderBy: { completedAt: "desc" },
            take: 1,
            select: { score: true, totalScore: true, completedAt: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Regular users: only quizzes from materials they have accepted invites for
      const acceptedInvites = await prisma.materialInvite.findMany({
        where: { userId: session.user.id, status: "accepted" },
        select: { materialId: true },
      });
      const materialIds = acceptedInvites.map((i) => i.materialId);

      if (materialIds.length > 0) {
        materialQuizzes = await prisma.materialQuiz.findMany({
          where: { materialId: { in: materialIds } },
          include: {
            material: { select: { id: true, title: true } },
            questions: { select: { id: true } },
            attempts: {
              where: { userId: session.user.id },
              orderBy: { completedAt: "desc" },
              take: 1,
              select: { score: true, totalScore: true, completedAt: true },
            },
          },
          orderBy: { createdAt: "desc" },
        });
      }
    }

    // Format results
    const result = [
      ...standaloneQuizzes.map((q: any) => ({
        id: q.id,
        materialId: null,
        materialTitle: null,
        title: q.title,
        description: q.description,
        questionCount: q.questions.length,
        creatorName: q.creator?.name || "Unknown",
        creatorAvatar: q.creator?.avatar || null,
        isStandalone: true,
        createdAt: q.createdAt,
        lastAttempt: q.attempts[0] || null,
      })),
      ...materialQuizzes.map((q: any) => ({
        id: q.id,
        materialId: q.materialId,
        materialTitle: q.material?.title || "Materi",
        title: q.title,
        description: q.description,
        questionCount: q.questions.length,
        creatorName: null,
        creatorAvatar: null,
        isStandalone: false,
        createdAt: q.createdAt,
        lastAttempt: q.attempts[0] || null,
      })),
    ];

    return NextResponse.json(result);
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user || (user.role !== "instruktur" && user.role !== "admin")) {
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

    const quiz = await prisma.materialQuiz.create({
      data: {
        materialId: null,
        creatorId: session.user.id,
        title: title.trim(),
        description: description?.trim() || null,
        questions: {
          create: questions.map((q: any, idx: number) => ({
            question: q.question.trim(),
            order: idx,
            options: {
              create: q.options.map((o: any) => ({
                text: o.text.trim(),
                isCorrect: o.isCorrect === true,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: { options: true },
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
