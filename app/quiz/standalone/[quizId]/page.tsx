"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
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
  Zap,
  BookOpen,
} from "lucide-react";
import Loading from "@/components/ui/Loading";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

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
  materialId: string | null;
  materialTitle: string | null;
  materialThumbnail: string | null;
  creatorName: string | null;
  title: string;
  description: string | null;
  questionCount: number;
  questions: QuizQuestion[];
  attempts: {
    id: string;
    score: number;
    totalScore: number;
    completedAt: string;
    answers: any;
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
  xpAwarded?: boolean;
  cooldownMinutes: number;
  retryAt: string;
}

export default function StandaloneQuizSessionPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const quizId = params.quizId as string;
  const isReviewMode = searchParams.get("review") === "true";

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
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);
  const { data: session } = useSession();
  const isStaffRole =
    session?.user?.role === "admin" ||
    session?.user?.role === "super_admin" ||
    session?.user?.role === "instruktur";

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

  useEffect(() => {
    if (quizData && isReviewMode && quizData.attempts.length > 0) {
      const latest = quizData.attempts[0];
      if (latest.answers) {
        const results = Array.isArray(latest.answers)
          ? latest.answers
          : JSON.parse(latest.answers as any);

        setFinalResult({
          score: latest.score,
          totalScore: latest.totalScore,
          percentage: Math.round((latest.score / latest.totalScore) * 100),
          results: results,
          xpAwarded: false,
          cooldownMinutes: 0,
          retryAt: new Date().toISOString(),
        });
        setIsFinished(true);
      }
    }
  }, [quizData, isReviewMode]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/quiz/${quizId}`);
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loading text="Memuat Quiz..." />
      </div>
    );
  }

  if (!quizData || quizData.questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
            <div className="w-16 h-16 mb-6 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
              <AlertCircle className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Quiz Tidak Ditemukan
            </h2>
            <button
              onClick={() => router.push("/quiz")}
              className="mt-6 h-12 px-8 rounded-xl bg-emerald-600 text-white font-bold text-base shadow-sm hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Home className="h-5 w-5" /> Kembali
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
      const nextIdx = currentQIndex + 1;
      const nextQId = quizData.questions[nextIdx].id;
      setCurrentQIndex(nextIdx);
      setSelectedAnswer(answers[nextQId] || null);
      setIsAnswerSubmitted(!!answers[nextQId]);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQIndex > 0) {
      const prevIdx = currentQIndex - 1;
      const prevQId = quizData.questions[prevIdx].id;
      setCurrentQIndex(prevIdx);
      setSelectedAnswer(answers[prevQId] || null);
      setIsAnswerSubmitted(!!answers[prevQId]);
    }
  };

  const handleFinishQuiz = async () => {
    setSubmitting(true);
    setCooldownError(null);
    try {
      const allAnswers = { ...answers, [currentQuestion.id]: selectedAnswer };
      const res = await fetch(`/api/quiz/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: allAnswers }),
      });

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
    if (cooldownError && !finalResult) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 lg:p-12 max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 shadow-sm text-slate-400">
              <Clock className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Waktu Cooldown ⏳
            </h1>
            <p className="text-slate-500 font-medium mb-8 text-sm">
              {cooldownError}
            </p>
            <div className="bg-slate-50 rounded-2xl p-8 border-2 border-slate-100 mb-8 shadow-inner">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                Sisa Waktu
              </p>
              <div className="flex items-center justify-center gap-2">
                {formatTime(cooldownRemaining)
                  .split(":")
                  .map((part, i) => (
                    <React.Fragment key={i}>
                      <div className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2 shadow-[0_4px_0_0_#e2e8f0] min-w-15">
                        <span className="text-4xl font-bold text-slate-700 font-mono tracking-tighter">
                          {part}
                        </span>
                      </div>
                      {i === 0 && (
                        <span className="text-2xl font-bold text-slate-300">
                          :
                        </span>
                      )}
                    </React.Fragment>
                  ))}
              </div>
            </div>
            <button
              onClick={() => router.push("/quiz")}
              className="w-full h-12 rounded-xl bg-emerald-600 text-white font-bold text-base shadow-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="h-5 w-5" /> Kembali
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
      <div className="min-h-screen bg-emerald-50 flex flex-col items-center p-6 relative overflow-hidden">
        {/* Sparkle background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <Sparkles
              key={i}
              className="absolute text-yellow-400 opacity-60 animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${Math.random() * 2 + 1}s`,
                width: `${Math.random() * 30 + 10}px`,
                height: `${Math.random() * 30 + 10}px`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-xl w-full space-y-6">
          {/* Score Card */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-[0_8px_0_0_#e2e8f0] p-8 lg:p-12 text-center relative overflow-hidden">
            <div className="w-20 h-20 mx-auto mb-6 bg-emerald-50 rounded-full flex items-center justify-center border-2 border-emerald-100 relative shadow-sm">
              <Trophy className="h-10 w-10 text-emerald-500" />
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              {percentage >= 70 ? "Luar Biasa! 🎉" : "Terus Semangat! 💪"}
            </h1>

            <p className="text-slate-500 font-medium mb-8">
              Kamu telah menyelesaikan{" "}
              <span className="text-emerald-600 font-bold">
                {quizData.title}
              </span>
            </p>

            <div className="bg-slate-50 rounded-2xl p-8 border-2 border-slate-100 mb-8 shadow-inner">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                SKOR AKHIR KAMU
              </p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-6xl lg:text-7xl font-bold text-slate-900 tracking-tighter">
                  {displayScore}
                </span>
                <span className="text-2xl lg:text-3xl font-bold text-slate-300">
                  / {displayTotal}
                </span>
              </div>
              <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border-2 border-slate-200 text-slate-600 text-xs font-bold">
                Akurasi: {percentage}%
              </div>
            </div>

            {/* XP Badge */}
            <div className="mb-10">
              {finalResult?.xpAwarded ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 text-yellow-900 rounded-xl text-sm font-bold border-2 border-yellow-500 shadow-[0_4px_0_0_#d97706] animate-pulse">
                  <Sparkles className="h-4 w-4" />
                  +100 XP Didapatkan
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 text-slate-400 bg-slate-100 px-4 py-1.5 rounded-lg border-2 border-slate-200 font-medium text-xs">
                  <Zap className="h-3.5 w-3.5 opacity-50" fill="currentColor" />
                  XP sudah diklaim
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              {finalResult?.results && (
                <button
                  onClick={() => setShowReview(!showReview)}
                  className="h-12 rounded-xl bg-white border-2 border-slate-200 text-slate-600 font-bold text-sm shadow-[0_4px_0_0_#e2e8f0] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#e2e8f0] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="h-5 w-5" />{" "}
                  {showReview ? "Tutup Review" : "Cek Jawaban"}
                </button>
              )}
              <button
                onClick={() => router.push("/quiz")}
                className="h-12 rounded-xl bg-emerald-600 text-white font-bold text-sm border-2 border-emerald-700 shadow-[0_4px_0_0_#065f46] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#065f46] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <Home className="h-5 w-5" /> Beranda
              </button>
            </div>
          </div>

          {/* Review Section */}
          {showReview && finalResult?.results && (
            <div className="space-y-4 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 px-2">
                <BookOpen className="h-7 w-7 text-emerald-500" /> Detail Jawaban
              </h2>
              {finalResult.results.map((result, idx) => {
                const isExpanded = expandedReviewQ === idx;
                return (
                  <div
                    key={result.questionId}
                    className={`bg-white rounded-xl border overflow-hidden transition-all shadow-sm ${
                      result.isCorrect ? "border-emerald-100" : "border-red-100"
                    }`}
                  >
                    <button
                      onClick={() =>
                        setExpandedReviewQ(isExpanded ? null : idx)
                      }
                      className="w-full flex items-center gap-4 p-4 lg:p-5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                          result.isCorrect
                            ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                            : "bg-red-50 border-red-100 text-red-600"
                        }`}
                      >
                        {result.isCorrect ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${result.isCorrect ? "text-emerald-500" : "text-red-500"}`}
                        >
                          SOAL {idx + 1}
                        </p>
                        <p className="text-base font-bold text-slate-700 truncate">
                          {result.question}
                        </p>
                      </div>
                      <div className="shrink-0 text-slate-300">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-5 pt-0 border-t border-slate-100 mt-2">
                        <p className="text-sm font-bold text-slate-800 mb-4 mt-4">
                          {result.question}
                        </p>
                        <div className="space-y-3">
                          {result.options.map((opt, oIdx) => {
                            const isSelected =
                              opt.id === result.selectedOptionId;
                            const isCorrectOpt = opt.isCorrect;

                            // Style dinamis layaknya Duolingo
                            let optClass =
                              "bg-slate-50 border-slate-200 text-slate-600 border-2";
                            let icon: React.ReactNode = null;

                            if (isCorrectOpt && isSelected) {
                              optClass =
                                "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm";
                              icon = (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                              );
                            } else if (isCorrectOpt) {
                              optClass =
                                "bg-emerald-50 border-emerald-300 text-emerald-600 border-dashed";
                              icon = (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 opacity-50" />
                              );
                            } else if (isSelected && !isCorrectOpt) {
                              optClass =
                                "bg-red-50 border-red-500 text-red-700 shadow-sm";
                              icon = (
                                <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                              );
                            }

                            return (
                              <div
                                key={opt.id}
                                className={`flex items-center gap-3 p-4 rounded-2xl font-bold ${optClass}`}
                              >
                                <span
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${isSelected ? "bg-white text-current" : "bg-slate-200 text-slate-500"}`}
                                >
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span className="flex-1">{opt.text}</span>
                                {icon}
                              </div>
                            );
                          })}
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <ConfirmDialog
        isOpen={showExitConfirm}
        title="Yakin Mau Keluar?"
        message="Progress kamu belum tersimpan. Benar-benar ingin meninggalkan quiz ini?"
        confirmText="Ya, Keluar"
        cancelText="Lanjut Main"
        type="warning"
        onConfirm={() => router.push("/quiz")}
        onCancel={() => setShowExitConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showSubmitConfirm}
        title="Kumpulkan Sekarang?"
        message="Pastikan semua jawabanmu sudah mantap! Jawaban yang dikirim tidak bisa diubah lagi."
        confirmText="Kumpulkan!"
        cancelText="Cek Lagi"
        type="warning"
        onConfirm={() => {
          setShowSubmitConfirm(false);
          handleFinishQuiz();
        }}
        onCancel={() => setShowSubmitConfirm(false)}
      />

      {/* Admin/Staff Preview Banner */}
      {isStaffRole && (
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 text-center text-amber-800 text-sm font-bold flex items-center justify-center gap-2">
          <Eye className="h-4 w-4" />
          <span>
            Mode Preview - Anda dapat melihat pertanyaan namun tidak dapat
            menyimpan progress
          </span>
        </div>
      )}

      {/* Top Bar / HUD */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button
            onClick={() => setShowExitConfirm(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="flex-1 px-2">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-700 ease-out"
                style={{
                  width: `${((currentQIndex + (isAnswerSubmitted ? 1 : 0)) / totalQuestions) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg font-bold text-sm border-2 border-emerald-400 shadow-[0_3px_0_0_#10b981]">
            <Zap className="h-4 w-4 fill-emerald-500 text-emerald-500" />
            <span>{score}</span>
          </div>
        </div>
      </div>

      {/* Strategic Question Navigator Card */}
      <div className="mt-4 px-4 w-full max-w-3xl mx-auto animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="bg-emerald-600 rounded-2xl p-4 border-2 border-emerald-500 shadow-[0_6px_0_0_#064e3b] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/50 border border-emerald-400/30 flex items-center justify-center text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest leading-none mb-1">
                Status Progress
              </p>
              <p className="text-sm font-bold text-white leading-none">
                {Object.keys(answers).length} / {totalQuestions} Terjawab
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {quizData.questions.map((q, idx) => {
              const isAnswered =
                !!answers[q.id] || (idx === currentQIndex && isAnswerSubmitted);
              const isCurrent = idx === currentQIndex;

              return (
                <div
                  key={q.id}
                  className={`
                    w-2.5 h-2.5 rounded-full transition-all duration-300
                    ${isCurrent ? "bg-yellow-400 scale-125 shadow-[0_0_8px_#facc15]" : ""}
                    ${!isCurrent && isAnswered ? "bg-white" : ""}
                    ${!isCurrent && !isAnswered ? "bg-emerald-800/40" : ""}
                  `}
                  title={`Soal ${idx + 1}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Question Area */}
      <main className="flex-1 flex flex-col items-center py-8 lg:py-12 px-4 w-full max-w-3xl mx-auto">
        {/* Question Header */}
        <div className="w-full mb-8">
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 lg:p-10 shadow-[0_6px_0_0_#e2e8f0] relative overflow-hidden transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                Pertanyaan {currentQIndex + 1}
              </span>
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-slate-800 leading-snug">
              {currentQuestion.question}
            </h2>
          </div>
        </div>

        {/* Options Grid */}
        <div className="w-full space-y-4 mb-8">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedAnswer === option.id;

            let baseStyle =
              "bg-white border-2 border-slate-200 text-slate-600 shadow-[0_6px_0_0_#e2e8f0]";
            let numberStyle =
              "border-2 border-slate-200 text-slate-400 bg-slate-50";

            if (isSelected) {
              baseStyle =
                "bg-emerald-50 border-2 border-emerald-500 text-emerald-700 shadow-[0_6px_0_0_#10b981] -translate-y-0.5";
              numberStyle =
                "border-2 border-emerald-200 text-emerald-600 bg-white";
            }

            if (isAnswerSubmitted) {
              baseStyle = isSelected
                ? "bg-emerald-50 border-2 border-emerald-500 text-emerald-700 cursor-default shadow-[0_6px_0_0_#10b981]"
                : "bg-white border-2 border-slate-100 text-slate-300 cursor-default opacity-60 shadow-[0_6px_0_0_#f1f5f9]";
            }

            return (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option.id)}
                disabled={isAnswerSubmitted}
                className={`
                  w-full relative flex items-center gap-4 p-4 lg:p-5 rounded-xl font-bold text-left transition-all duration-200
                  ${baseStyle}
                  ${!isAnswerSubmitted && !isSelected ? "hover:translate-y-0.5 hover:shadow-[0_4px_0_0_#e2e8f0] active:translate-y-1 active:shadow-none" : ""}
                  ${!isAnswerSubmitted && isSelected ? "active:translate-y-1 active:shadow-none" : ""}
                `}
              >
                <span
                  className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-sm border-2 ${numberStyle} font-bold transition-transform ${isSelected ? "scale-110" : ""}`}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-base lg:text-lg flex-1">
                  {option.text}
                </span>
                {isSelected && (
                  <div className="shrink-0 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center animate-in zoom-in duration-200 border-2 border-emerald-600">
                    <Check className="text-white w-3.5 h-3.5" strokeWidth={5} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 lg:p-6 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={handlePrevQuestion}
            disabled={currentQIndex === 0 || submitting}
            className={`
              h-12 px-6 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 border-2
              ${
                currentQIndex > 0 && !submitting
                  ? "bg-white text-slate-600 border-slate-200 shadow-[0_4px_0_0_#e2e8f0] hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_#e2e8f0] active:translate-y-0.5 active:shadow-none"
                  : "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
              }
            `}
          >
            <ArrowRight className="h-5 w-5 rotate-180" /> Kembali
          </button>

          {!isAnswerSubmitted ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer || submitting}
              className={`
                h-12 px-10 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 flex-1 max-w-xs border-2
                ${
                  selectedAnswer
                    ? "bg-emerald-600 text-white border-emerald-700 shadow-[0_4px_0_0_#065f46] hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_#065f46] active:translate-y-0.5 active:shadow-none"
                    : "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
                }
              `}
            >
              Lanjut
            </button>
          ) : currentQIndex < totalQuestions - 1 ? (
            <button
              onClick={handleNextQuestion}
              disabled={submitting}
              className="h-12 px-10 rounded-xl font-bold text-base bg-emerald-600 text-white border-2 border-emerald-700 shadow-[0_4px_0_0_#065f46] hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_#065f46] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 flex-1 max-w-xs"
            >
              Lanjut <ArrowRight className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={() => {
                if (isStaffRole) {
                  router.push("/quiz");
                } else {
                  setShowSubmitConfirm(true);
                }
              }}
              disabled={submitting}
              className="h-12 px-10 rounded-xl font-bold text-base bg-yellow-500 text-white border-2 border-yellow-600 shadow-[0_4px_0_0_#b45309] hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_#b45309] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 flex-1 max-w-xs"
            >
              {submitting
                ? "Memproses..."
                : isStaffRole
                  ? "Selesai Preview"
                  : "Selesai!"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
