import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// POST - submit quiz answers and get score (with cooldown)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quizId } = await params;

    // Get quiz with correct answers
    const quiz = await prisma.material_quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: { options: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: "Quiz tidak ditemukan" },
        { status: 404 },
      );
    }

    // --- COOLDOWN CHECK ---
    const lastAttempt = await prisma.quiz_attempt.findFirst({
      where: { quizId, userId: session.user.id },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true },
    });

    if (lastAttempt) {
      const questionCount = quiz.questions.length;
      const cooldownMinutes = questionCount < 10 ? 1 : 5;
      const cooldownMs = cooldownMinutes * 60 * 1000;
      const timeSinceLastAttempt =
        Date.now() - new Date(lastAttempt.completedAt).getTime();

      if (timeSinceLastAttempt < cooldownMs) {
        const remainingMs = cooldownMs - timeSinceLastAttempt;
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        return NextResponse.json(
          {
            error: "cooldown",
            message: `Kamu harus menunggu ${cooldownMinutes} menit sebelum mengulang quiz ini`,
            cooldownMinutes,
            remainingSeconds,
            retryAt: new Date(
              new Date(lastAttempt.completedAt).getTime() + cooldownMs,
            ).toISOString(),
          },
          { status: 429 },
        );
      }
    }

    const body = await req.json();
    const { answers } = body;
    // answers format: { [questionId]: selectedOptionId }

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Jawaban tidak valid" },
        { status: 400 },
      );
    }

    // Calculate score
    let score = 0;
    const totalScore = quiz.questions.length;
    const detailedResults: {
      questionId: string;
      question: string;
      selectedOptionId: string | null;
      selectedOptionText: string | null;
      correctOptionId: string;
      correctOptionText: string;
      isCorrect: boolean;
      options: { id: string; text: string; isCorrect: boolean }[];
    }[] = [];

    for (const question of quiz.questions) {
      const correctOption = question.options.find((o) => o.isCorrect);
      const selectedOptionId = answers[question.id] || null;
      const selectedOption = question.options.find(
        (o) => o.id === selectedOptionId,
      );
      const isCorrect = selectedOptionId === correctOption?.id;

      if (isCorrect) score++;

      detailedResults.push({
        questionId: question.id,
        question: question.question,
        selectedOptionId,
        selectedOptionText: selectedOption?.text || null,
        correctOptionId: correctOption?.id || "",
        correctOptionText: correctOption?.text || "",
        isCorrect,
        options: question.options.map((o) => ({
          id: o.id,
          text: o.text,
          isCorrect: o.isCorrect,
        })),
      });
    }

    // Save attempt
    const attempt = await prisma.quiz_attempt.create({
      data: {
        quizId,
        userId: session.user.id,
        score,
        totalScore,
        answers: detailedResults,
      },
    });

    // Calculate cooldown for the response
    const questionCount = quiz.questions.length;
    const cooldownMinutes = questionCount < 10 ? 1 : 5;

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      score,
      totalScore,
      percentage: Math.round((score / totalScore) * 100),
      results: detailedResults,
      cooldownMinutes,
      retryAt: new Date(Date.now() + cooldownMinutes * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error("Submit quiz error:", error);
    return NextResponse.json(
      { error: "Gagal mengirim jawaban quiz" },
      { status: 500 },
    );
  }
}
