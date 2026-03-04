import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET - list all quizzes for a material
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: materialId } = await params;

    const quizzes = await prisma.material_quiz.findMany({
      where: { materialId },
      include: {
        questions: {
          select: { id: true },
        },
        attempts: {
          where: { userId: session.user.id },
          orderBy: { completedAt: "desc" },
          take: 1,
          select: { score: true, totalScore: true, completedAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = quizzes.map((q) => ({
      id: q.id,
      materialId: q.materialId,
      title: q.title,
      description: q.description,
      questionCount: q.questions.length,
      createdAt: q.createdAt,
      lastAttempt: q.attempts[0] || null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get quizzes error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar quiz" },
      { status: 500 },
    );
  }
}

// POST - create a new quiz with questions and options
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id: materialId } = await params;

    // Verify material exists
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      select: { id: true },
    });
    if (!material) {
      return NextResponse.json(
        { error: "Materi tidak ditemukan" },
        { status: 404 },
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

    // Validate each question
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

    // Create quiz with nested questions and options
    const quiz = await prisma.material_quiz.create({
      data: {
        materialId,
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
    console.error("Create quiz error:", error);
    return NextResponse.json({ error: "Gagal membuat quiz" }, { status: 500 });
  }
}
