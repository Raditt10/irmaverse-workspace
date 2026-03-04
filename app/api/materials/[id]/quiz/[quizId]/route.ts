import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET - get quiz detail with questions and options
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quizId } = await params;

    const quiz = await prisma.material_quiz.findUnique({
      where: { id: quizId },
      include: {
        material: {
          select: { id: true, title: true, instructorId: true },
        },
        questions: {
          include: { options: true },
          orderBy: { order: "asc" },
        },
        attempts: {
          where: { userId: session.user.id },
          orderBy: { completedAt: "desc" },
          select: {
            id: true,
            score: true,
            totalScore: true,
            completedAt: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: "Quiz tidak ditemukan" },
        { status: 404 },
      );
    }

    // Check if user is instructor/admin; if not, hide isCorrect in options
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    const isPrivileged = user?.role === "instruktur" || user?.role === "admin";

    const questions = quiz.questions.map((q) => ({
      id: q.id,
      question: q.question,
      order: q.order,
      options: q.options.map((o) => ({
        id: o.id,
        text: o.text,
        // Only show correct answer to instructors (for editing),
        // or after user has made an attempt
        ...(isPrivileged || quiz.attempts.length > 0
          ? { isCorrect: o.isCorrect }
          : {}),
      })),
    }));

    return NextResponse.json({
      id: quiz.id,
      materialId: quiz.material?.id ?? quiz.materialId,
      materialTitle: quiz.material?.title ?? null,
      title: quiz.title,
      description: quiz.description,
      questionCount: quiz.questions.length,
      questions,
      attempts: quiz.attempts,
      createdAt: quiz.createdAt,
    });
  } catch (error) {
    console.error("Get quiz detail error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil detail quiz" },
      { status: 500 },
    );
  }
}

// PUT - update a quiz (title, description, questions, options)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> },
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { quizId } = await params;
    const body = await req.json();
    const { title, description, questions } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Judul quiz tidak boleh kosong" },
        { status: 400 },
      );
    }

    // Delete old questions (cascade deletes options too)
    await prisma.quiz_question.deleteMany({
      where: { quizId },
    });

    // Update quiz and recreate questions
    const quiz = await prisma.material_quiz.update({
      where: { id: quizId },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        questions: {
          create: (questions || []).map((q: any, idx: number) => ({
            question: q.question.trim(),
            order: idx,
            options: {
              create: (q.options || []).map((o: any) => ({
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

    return NextResponse.json({ success: true, quiz });
  } catch (error) {
    console.error("Update quiz error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui quiz" },
      { status: 500 },
    );
  }
}

// DELETE - delete a quiz
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> },
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { quizId } = await params;

    await prisma.material_quiz.delete({
      where: { id: quizId },
    });

    return NextResponse.json({
      success: true,
      message: "Quiz berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete quiz error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus quiz" },
      { status: 500 },
    );
  }
}
