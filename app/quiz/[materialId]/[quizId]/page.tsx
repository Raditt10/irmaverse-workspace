"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  X,
  Check,
  ArrowRight,
  Trophy,
  Home,
  Sparkles,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  BookOpen,
} from "lucide-react";
import Loading from "@/components/ui/Loading";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import CartoonConfirmDialog from "@/components/ui/ConfirmDialog";

const OPTION_STYLES = [
  {
    base: "bg-red-50 border-red-200 text-red-700",
    hover: "hover:bg-red-100 hover:border-red-300 shadow-[0_4px_0_0_#fca5a5]",
  },
  {
    base: "bg-blue-50 border-blue-200 text-blue-700",
    hover: "hover:bg-blue-100 hover:border-blue-300 shadow-[0_4px_0_0_#93c5fd]",
  },
  {
    base: "bg-amber-50 border-amber-200 text-amber-700",
    hover:
      "hover:bg-amber-100 hover:border-amber-300 shadow-[0_4px_0_0_#fcd34d]",
  },
  {
    base: "bg-emerald-50 border-emerald-200 text-emerald-700",
    hover:
      "hover:bg-emerald-100 hover:border-emerald-300 shadow-[0_4px_0_0_#6ee7b7]",
  },
];

interface QuizOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  order: number;
  options: QuizOption[];
}

interface QuizData {
  id: string;
  materialId: string;
  materialTitle: string;
  title: string;
  description: string | null;
  questionCount: number;
  questions: QuizQuestion[];
  attempts: {
    id: string;
    score: number;
    totalScore: number;
    completedAt: string;
  }[];
}

interface ReviewResult {
  questionId: string;
  question: string;
  selectedOptionId: string | null;
  selectedOptionText: string | null;
  correctOptionId: string;
  correctOptionText: string;
  isCorrect: boolean;
  options: { id: string; text: string; isCorrect: boolean }[];
}

interface FinalResult {
  score: number;
  totalScore: number;
  percentage: number;
  results: ReviewResult[];
  cooldownMinutes: number;
  retryAt: string;
}

export default function QuizSessionPage() {
  const router = useRouter();
  const params = useParams();
  const materialId = params.materialId as string;
  const quizId = params.quizId as string;

  const { status: authStatus } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/auth");
    },
  });

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);

  // Review state
  const [showReview, setShowReview] = useState(false);
  const [expandedReviewQ, setExpandedReviewQ] = useState<number | null>(null);

  // Cooldown state
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [cooldownError, setCooldownError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "authenticated" && quizId) {
      fetchQuiz();
    }
  }, [authStatus, quizId]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/materials/${materialId}/quiz/${quizId}`);
      if (!res.ok) throw new Error("Quiz tidak ditemukan");
      const data = await res.json();
      setQuizData(data);
    } catch (error) {
      console.error("Error loading quiz:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  if (loading || authStatus === "loading") {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loading text="Memuat Quiz..." />
      </div>
    );
  }

  if (!quizData || quizData.questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
            <AlertCircle className="h-16 w-16 text-slate-300 mb-4" />
            <h2 className="text-xl font-black text-slate-700 mb-2">
              Quiz Tidak Ditemukan
            </h2>
            <button
              onClick={() => router.push("/quiz")}
              className="mt-4 px-6 py-3 rounded-xl bg-teal-400 text-white font-black border-2 border-teal-600 border-b-4 hover:bg-teal-500 active:border-b-2 active:translate-y-0.5 transition-all"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quizData.questions[currentQIndex];
  const totalQuestions = quizData.questions.length;

  const handleSelectOption = (optionId: string) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(optionId);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: selectedAnswer }));

    const selectedOpt = currentQuestion.options.find(
      (o) => o.id === selectedAnswer,
    );
    if (selectedOpt?.isCorrect) {
      setScore((prev) => prev + 1);
    }
    setIsAnswerSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (currentQIndex < totalQuestions - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      handleFinishQuiz();
    }
  };

  const handleFinishQuiz = async () => {
    setSubmitting(true);
    setCooldownError(null);
    try {
      const allAnswers = { ...answers, [currentQuestion.id]: selectedAnswer };
      const res = await fetch(
        `/api/materials/${materialId}/quiz/${quizId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: allAnswers }),
        },
      );

      if (res.status === 429) {
        const data = await res.json();
        setCooldownRemaining(data.remainingSeconds || 60);
        setCooldownError(data.message);
        setCurrentQIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setIsAnswerSubmitted(false);
        setAnswers({});
        setIsFinished(true);
        return;
      }

      if (!res.ok) throw new Error("Gagal mengirim jawaban");
      const data = await res.json();
      setFinalResult(data);
      setCooldownRemaining(data.cooldownMinutes * 60);
      setIsFinished(true);
    } catch (error) {
      console.error("Submit error:", error);
      setIsFinished(true);
    } finally {
      setSubmitting(false);
    }
  };

  // --- FINISHED STATE ---
  if (isFinished) {
    // Cooldown-blocked state (429)
    if (cooldownError && !finalResult) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] to-amber-50 flex flex-col items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] border-4 border-amber-200 shadow-[0_12px_0_0_#fcd34d] p-8 lg:p-12 max-w-lg w-full text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center border-4 border-amber-300">
              <Clock className="h-10 w-10 text-amber-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 mb-2">
              Cooldown Aktif ⏳
            </h1>
            <p className="text-slate-500 font-medium mb-6">{cooldownError}</p>
            <div className="bg-amber-50 rounded-2xl p-6 border-2 border-amber-100 mb-6">
              <p className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-1">
                Tersisa
              </p>
              <p className="text-4xl font-black text-amber-600 font-mono">
                {formatTime(cooldownRemaining)}
              </p>
            </div>
            <button
              onClick={() => router.push("/quiz")}
              className="px-8 py-3.5 rounded-xl bg-teal-400 text-white font-black border-2 border-teal-600 shadow-[0_4px_0_0_#0d9488] hover:bg-teal-500 active:translate-y-0.5 active:shadow-none transition-all"
            >
              <Home className="inline h-5 w-5 mr-2" /> Kembali
            </button>
          </div>
        </div>
      );
    }

    const displayScore = finalResult?.score ?? score;
    const displayTotal = finalResult?.totalScore ?? totalQuestions;
    const percentage =
      finalResult?.percentage ??
      Math.round((displayScore / displayTotal) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] to-teal-50 flex flex-col items-center p-6 relative overflow-hidden">
        {/* Sparkle background */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <Sparkles
              key={i}
              className="absolute text-yellow-300/60 animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                width: `${Math.random() * 20 + 12}px`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-2xl w-full space-y-6 mt-8">
          {/* Score Card */}
          <div className="bg-white rounded-[3rem] border-4 border-slate-200 shadow-[0_12px_0_0_#cbd5e1] p-8 lg:p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full flex items-center justify-center border-4 border-yellow-500 shadow-[0_6px_0_0_#d97706] animate-bounce">
              <Trophy className="h-12 w-12 text-white" fill="currentColor" />
            </div>

            <h1 className="text-3xl font-black text-slate-800 mb-1">
              {percentage >= 70 ? "Luar Biasa! 🎉" : "Tetap Semangat! 💪"}
            </h1>
            <p className="text-slate-500 font-medium mb-2 flex items-center justify-center gap-2">
              <BookOpen className="h-4 w-4 text-teal-400" />
              {quizData.title}
            </p>
            {quizData.materialTitle && (
              <p className="text-xs text-slate-400 font-medium mb-6">
                Materi: {quizData.materialTitle}
              </p>
            )}

            <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-100 mb-6">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                Skor Kamu
              </p>
              <p className="text-5xl font-black text-teal-500">
                {displayScore}
                <span className="text-2xl text-slate-400">/{displayTotal}</span>
              </p>
              <p className="text-lg font-bold text-slate-600 mt-1">
                {percentage}%
              </p>
            </div>

            {/* Cooldown timer */}
            {cooldownRemaining > 0 && (
              <div className="bg-amber-50 rounded-2xl p-4 border-2 border-amber-200 mb-6 flex items-center justify-center gap-3">
                <Clock className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-xs font-bold text-amber-700 uppercase">
                    Cooldown sebelum mengulang
                  </p>
                  <p className="text-2xl font-black text-amber-600 font-mono">
                    {formatTime(cooldownRemaining)}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {finalResult?.results && (
                <button
                  onClick={() => setShowReview(!showReview)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-50 border-2 border-indigo-200 text-indigo-600 font-bold hover:bg-indigo-100 hover:border-indigo-300 transition-all shadow-[0_4px_0_0_#c7d2fe] active:translate-y-0.5 active:shadow-none"
                >
                  <Eye className="h-5 w-5" />{" "}
                  {showReview ? "Sembunyikan Review" : "Review Jawaban"}
                </button>
              )}
              <button
                onClick={() => router.push("/quiz")}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-teal-400 text-white font-black border-2 border-teal-600 shadow-[0_4px_0_0_#0d9488] hover:bg-teal-500 active:translate-y-0.5 active:shadow-none transition-all"
              >
                <Home className="h-5 w-5" /> Quiz Lainnya
              </button>
            </div>
          </div>

          {/* Review Section */}
          {showReview && finalResult?.results && (
            <div className="space-y-4 pb-12">
              <h2 className="text-xl font-black text-slate-700 flex items-center gap-2">
                <Eye className="h-6 w-6 text-indigo-500" /> Review Jawaban
              </h2>
              {finalResult.results.map((result, idx) => {
                const isExpanded = expandedReviewQ === idx;
                return (
                  <div
                    key={result.questionId}
                    className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${
                      result.isCorrect ? "border-emerald-200" : "border-red-200"
                    }`}
                  >
                    {/* Question header */}
                    <button
                      onClick={() =>
                        setExpandedReviewQ(isExpanded ? null : idx)
                      }
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          result.isCorrect
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {result.isCorrect ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-400 uppercase">
                          Soal {idx + 1}
                        </p>
                        <p className="text-sm font-bold text-slate-700 truncate">
                          {result.question}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-2.5 border-t border-slate-100 pt-3">
                        <p className="text-sm font-bold text-slate-700 mb-3">
                          {result.question}
                        </p>
                        {result.options.map((opt, oIdx) => {
                          const isSelected = opt.id === result.selectedOptionId;
                          const isCorrectOpt = opt.isCorrect;
                          let optClass =
                            "bg-slate-50 border-slate-200 text-slate-600";
                          let icon = null;

                          if (isCorrectOpt && isSelected) {
                            optClass =
                              "bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-200";
                            icon = (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            );
                          } else if (isCorrectOpt) {
                            optClass =
                              "bg-emerald-50 border-emerald-300 text-emerald-700";
                            icon = (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            );
                          } else if (isSelected && !isCorrectOpt) {
                            optClass =
                              "bg-red-50 border-red-300 text-red-700 ring-2 ring-red-200";
                            icon = (
                              <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                            );
                          }

                          return (
                            <div
                              key={opt.id}
                              className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-sm font-medium ${optClass}`}
                            >
                              <span className="w-6 h-6 rounded-lg bg-white/80 flex items-center justify-center text-xs font-black border border-current/20 shrink-0">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span className="flex-1">{opt.text}</span>
                              {icon}
                              {isSelected && (
                                <span className="text-[10px] font-black uppercase tracking-wider bg-white/80 px-2 py-0.5 rounded-full">
                                  Pilihanmu
                                </span>
                              )}
                            </div>
                          );
                        })}
                        <div className="mt-2 text-xs font-bold text-slate-400">
                          Jawaban benar:{" "}
                          <span className="text-emerald-600">
                            {result.correctOptionText}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- QUIZ SESSION ---
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      <CartoonConfirmDialog
        isOpen={showExitConfirm}
        title="Keluar dari Quiz?"
        message="Progressmu belum tersimpan. Yakin mau keluar?"
        confirmText="Ya, Keluar"
        cancelText="Lanjut Quiz"
        type="warning"
        onConfirm={() => router.push("/quiz")}
        onCancel={() => setShowExitConfirm(false)}
      />

      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b-2 border-slate-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setShowExitConfirm(true)}
            className="p-2 rounded-xl border-2 border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300 transition-all"
          >
            <X className="h-5 w-5" strokeWidth={3} />
          </button>

          <div className="flex-1 mx-4">
            <div className="flex items-center justify-between text-xs font-black text-slate-500 mb-1.5">
              <span>
                Soal {currentQIndex + 1}/{totalQuestions}
              </span>
              <span>Skor: {score}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden border border-slate-300">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${((currentQIndex + (isAnswerSubmitted ? 1 : 0)) / totalQuestions) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question Area */}
      <main className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="max-w-2xl w-full space-y-6 lg:space-y-8">
          {/* Question Text */}
          <div className="bg-white rounded-[2rem] border-2 border-slate-200 shadow-[0_6px_0_0_#cbd5e1] p-6 lg:p-8 text-center">
            <p className="text-xs font-black text-teal-500 uppercase tracking-wider mb-3">
              {quizData.title}
            </p>
            <h2 className="text-lg lg:text-2xl font-black text-slate-800 leading-snug">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            {currentQuestion.options.map((option, idx) => {
              const style = OPTION_STYLES[idx % OPTION_STYLES.length];
              const isSelected = selectedAnswer === option.id;

              let stateClass = "";
              if (isAnswerSubmitted && isSelected) {
                stateClass = "ring-4 ring-offset-2 ring-slate-400 scale-[1.02]";
              }

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectOption(option.id)}
                  disabled={isAnswerSubmitted}
                  className={`
                    relative flex items-center gap-3 p-4 lg:p-5 rounded-2xl border-2 font-bold text-left transition-all duration-200
                    ${style.base} ${!isAnswerSubmitted ? style.hover : ""}
                    ${isSelected && !isAnswerSubmitted ? "ring-4 ring-offset-2 ring-teal-300 scale-[1.02]" : ""}
                    ${stateClass}
                    ${isAnswerSubmitted ? "cursor-default" : "cursor-pointer active:translate-y-0.5 active:shadow-none"}
                  `}
                >
                  <span className="w-8 h-8 shrink-0 rounded-lg bg-white/80 flex items-center justify-center text-sm font-black border border-current/20">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm lg:text-base">{option.text}</span>
                </button>
              );
            })}
          </div>

          {/* Action Button */}
          <div className="flex justify-center pt-2">
            {!isAnswerSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer || submitting}
                className={`
                  px-10 py-4 rounded-2xl font-black text-lg transition-all border-b-4 active:border-b-0 active:translate-y-1
                  ${
                    selectedAnswer
                      ? "bg-teal-400 text-white border-teal-600 shadow-[0_4px_0_0_#0d9488] hover:bg-teal-500"
                      : "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
                  }
                `}
              >
                <Check className="inline h-5 w-5 mr-2 -mt-0.5" /> Jawab
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                disabled={submitting}
                className="px-10 py-4 rounded-2xl font-black text-lg bg-indigo-500 text-white border-b-4 border-indigo-700 shadow-[0_4px_0_0_#4338ca] hover:bg-indigo-600 active:border-b-0 active:translate-y-1 transition-all"
              >
                {submitting ? (
                  "Mengirim..."
                ) : currentQIndex < totalQuestions - 1 ? (
                  <>
                    Lanjut <ArrowRight className="inline h-5 w-5 ml-1" />
                  </>
                ) : (
                  <>
                    Selesai <Trophy className="inline h-5 w-5 ml-1" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
