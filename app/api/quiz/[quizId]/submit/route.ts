import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { grantXp } from "@/lib/gamification";
import { NextRequest, NextResponse } from "next/server";

// POST - submit quiz answers with cooldown enforcement
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quizId } = await params;

    // Block admins and super admins from submitting
    const userRole = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (userRole?.role === "admin" || userRole?.role === "super_admin" || userRole?.role === "instruktur") {
      return NextResponse.json(
        { error: "Staff tidak diperbolehkan mengerjakan kuis" },
        { status: 403 },
      );
    }

    const quiz = await prisma.material_quizzes.findUnique({
      where: { id: quizId },
      include: {
        quiz_questions: {
          include: { quiz_options: true },
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
    const lastAttempt = await prisma.quiz_attempts.findFirst({
      where: { quizId, userId: session.user.id },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true },
    });

    if (lastAttempt) {
      const questionCount = quiz.quiz_questions.length;
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

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Jawaban tidak valid" },
        { status: 400 },
      );
    }

    // Calculate score
    let score = 0;
    const totalScore = quiz.quiz_questions.length;
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

    for (const question of quiz.quiz_questions) {
      const correctOption = question.quiz_options.find((o) => o.isCorrect);
      const selectedOptionId = answers[question.id] || null;
      const selectedOption = question.quiz_options.find(
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
        options: question.quiz_options.map((o) => ({
          id: o.id,
          text: o.text,
          isCorrect: o.isCorrect,
        })),
      });
    }

    // Save attempt
    const attempt = await (prisma as any).quiz_attempts.create({
      data: {
        id: crypto.randomUUID(),
        quizId,
        userId: session.user.id,
        score,
        totalScore,
        answers: detailedResults,
      },
    });

    // Grant XP only on the first attempt
    let xpAwarded = false;
    if (!lastAttempt) {
      try {
        const percentage = Math.round((score / totalScore) * 100);
        const bonusXp = percentage >= 80 ? 25 : 0;
        await grantXp({
          userId: session.user.id,
          type: "quiz_completed",
          title: `Menyelesaikan Quiz: ${quiz.title || "Quiz"}`,
          description: `Skor: ${score}/${totalScore} (${percentage}%)`,
          xpOverride: 50 + bonusXp,
          metadata: {
            quizId,
            score,
            totalScore,
            percentage,
            attemptId: attempt.id,
          },
        });
        xpAwarded = true;
      } catch (e) {
        console.error("Gagal grant XP quiz:", e);
      }
    }

    // Calculate cooldown for the response
    const questionCount = quiz.quiz_questions.length;
    const cooldownMinutes = questionCount < 10 ? 1 : 5;

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      score,
      totalScore,
      percentage: Math.round((score / totalScore) * 100),
      results: detailedResults,
      xpAwarded,
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
