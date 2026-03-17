import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET - get quiz detail (standalone or material-bound by quizId)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quizId } = await params;

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
    });
    const isStaffRole = user?.role === "instruktur" || user?.role === "admin" || user?.role === "super_admin";

    // If staff, fetch all attempts. Otherwise, only own attempts.
    const quiz = await prisma.material_quizzes.findUnique({
      where: { id: quizId },
      include: {
        material: { select: { id: true, title: true, instructorId: true, thumbnailUrl: true } },
        users: { select: { id: true, name: true, avatar: true } },
        quiz_questions: {
          include: { quiz_options: true },
          orderBy: { order: "asc" },
        },
        quiz_attempts: {
          where: isStaffRole ? undefined : { userId: session.user.id },
          orderBy: { completedAt: "desc" },
          select: {
            id: true,
            score: true,
            totalScore: true,
            completedAt: true,
            answers: true,
            users: { select: { id: true, name: true, avatar: true } },
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

    const questions = quiz.quiz_questions.map((q) => ({
      id: q.id,
      question: q.question,
      order: q.order,
      options: q.quiz_options.map((o) => ({
        id: o.id,
        text: o.text,
        ...(isStaffRole || quiz.quiz_attempts.some(a => a.users.id === session.user.id)
          ? { isCorrect: o.isCorrect }
          : {}),
      })),
    }));

    return NextResponse.json({
      id: quiz.id,
      materialId: quiz.materialId || null,
      materialTitle: quiz.material?.title || null,
      materialThumbnail: quiz.material?.thumbnailUrl || null,
      creatorName: quiz.users?.name || null,
      title: quiz.title,
      description: quiz.description,
      questionCount: quiz.quiz_questions.length,
      questions,
      attempts: quiz.quiz_attempts,
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
  { params }: { params: Promise<{ quizId: string }> },
) {
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

    const { quizId } = await params;
    const body = await req.json();
    const { title, description, questions } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Judul quiz tidak boleh kosong" },
        { status: 400 },
      );
    }

    // Delete old questions (cascade deletes options)
    await prisma.quiz_questions.deleteMany({ where: { quizId } });

    // Update quiz and recreate questions
    const quiz = await (prisma as any).material_quizzes.update({
      where: { id: quizId },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        quiz_questions: {
          create: (questions || []).map((q: any, idx: number) => ({
            question: q.question.trim(),
            order: idx,
            quiz_options: {
              create: (q.options || []).map((o: any) => ({
                text: o.text.trim(),
                isCorrect: o.isCorrect === true,
              })),
            },
          })),
        },
      },
      include: {
        quiz_questions: { include: { quiz_options: true }, orderBy: { order: "asc" } },
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

// DELETE - delete a standalone quiz
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> },
) {
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

    const { quizId } = await params;

    await prisma.material_quizzes.delete({ where: { id: quizId } });

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
