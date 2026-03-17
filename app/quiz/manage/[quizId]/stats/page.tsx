"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import Loading from "@/components/ui/Loading";
import BackButton from "@/components/ui/BackButton";
import {
  Users,
  HelpCircle,
  Trophy,
  Calendar,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  Pencil,
  BookOpen,
  AlertCircle,
} from "lucide-react";

interface Participant {
  id: string;
  score: number;
  totalScore: number;
  completedAt: string;
  users: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  order: number;
  options: QuizOption[];
}

interface QuizDetail {
  id: string;
  title: string;
  description: string | null;
  materialId: string | null;
  materialTitle: string | null;
  creatorName: string | null;
  questionCount: number;
  questions: QuizQuestion[];
  attempts: Participant[];
}

export default function QuizStatsPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId as string;
  const { data: session, status: authStatus } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/auth");
    },
  });

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"questions" | "participants">("participants");

  useEffect(() => {
    if (authStatus === "authenticated" && quizId) {
      fetchQuizData();
    }
  }, [authStatus, quizId]);

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/quiz/${quizId}`);
      if (!res.ok) throw new Error("Gagal mengambil data quiz");
      const data = await res.json();
      setQuiz(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const role = session?.user?.role?.toLowerCase();
  const isStaffRole = role === "admin" || role === "super_admin" || role === "instruktur" || role === "instructor";

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loading text="Memuat data statistik..." />
      </div>
    );
  }

  if (!isStaffRole) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4 text-center">
        <XCircle className="h-16 w-16 text-red-400 mb-4" />
        <h2 className="text-xl font-black text-slate-800 mb-2">Akses Dibatasi</h2>
        <p className="text-slate-500 mb-6">Halaman ini hanya dapat diakses oleh Instruktur dan Admin.</p>
        <button
          onClick={() => router.push("/quiz")}
          className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-black border-b-4 border-emerald-700 hover:bg-emerald-600 active:translate-y-1 transition-all"
        >
          Kembali ke Quiz
        </button>
      </div>
    );
  }

  if (!quiz) return null;

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex flex-col lg:flex-row">
        <Sidebar />
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          <div className="max-w-5xl mx-auto">
            {/* Header Area */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div className="space-y-4">
                <BackButton 
                  label="Kembali" 
                  onClick={() => router.push("/quiz")} 
                />
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">
                      {quiz.title}
                    </h1>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border-2 ${
                      quiz.materialId 
                        ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                        : "bg-blue-50 border-blue-100 text-blue-600"
                    }`}>
                      {quiz.materialId ? "Kajian" : "Mandiri"}
                    </span>
                  </div>
                  <p className="text-slate-500 font-medium max-w-2xl">
                    {quiz.description || "Tidak ada deskripsi."}
                  </p>
                  {quiz.materialTitle && (
                    <div className="flex items-center gap-2 mt-3 text-sm font-bold text-emerald-600">
                      <BookOpen className="h-4 w-4" />
                      Materi: {quiz.materialTitle}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => router.push(`/quiz/manage/${quiz.id}`)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-black border-b-4 shadow-sm hover:border-emerald-300 hover:text-emerald-600 transition-all"
              >
                <Pencil className="h-4 w-4" /> Edit Quiz
              </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-[0_4px_0_0_#e2e8f0]">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
                  <HelpCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-2xl font-black text-slate-800">{quiz.questionCount}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pertanyaan</p>
              </div>
              <div className="bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-[0_4px_0_0_#e2e8f0]">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-2xl font-black text-slate-800">{quiz.attempts.length}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Peserta</p>
              </div>
              <div className="bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-[0_4px_0_0_#e2e8f0]">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
                  <Trophy className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-2xl font-black text-slate-800">
                  {quiz.attempts.length > 0
                    ? Math.round(quiz.attempts.reduce((a, b) => a + (b.score / b.totalScore) * 100, 0) / quiz.attempts.length)
                    : 0}%
                </p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rata-rata Skor</p>
              </div>
              <div className="bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-[0_4px_0_0_#e2e8f0]">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
                  <AlertCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-2xl font-black text-slate-800">Aktif</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Kuis</p>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-2 mb-6 p-1.5 bg-slate-100 rounded-2xl w-fit">
              <button
                onClick={() => setActiveTab("participants")}
                className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                  activeTab === "participants"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" /> Daftar Peserta
              </button>
              <button
                onClick={() => setActiveTab("questions")}
                className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                  activeTab === "questions"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <HelpCircle className="h-4 w-4 inline mr-2" /> Detail Soal
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "participants" ? (
              <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-[0_4px_0_0_#e2e8f0] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b-2 border-slate-100">
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Nama Peserta</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Skor</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Waktu Selesai</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-50">
                      {quiz.attempts.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-bold">
                            Belum ada peserta yang mengerjakan kuis ini.
                          </td>
                        </tr>
                      ) : (
                        quiz.attempts.map((attempt) => (
                          <tr key={attempt.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {attempt.users.avatar ? (
                                  <img src={attempt.users.avatar} alt="" className="w-10 h-10 rounded-xl object-cover border-2 border-slate-100" />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400">
                                    {attempt.users.name.charAt(0)}
                                  </div>
                                )}
                                <span className="font-bold text-slate-700">{attempt.users.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 font-black text-sm border border-emerald-100">
                                {attempt.score} / {attempt.totalScore}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-sm font-medium">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-slate-300" />
                                {new Date(attempt.completedAt).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <span className="text-xs font-bold text-slate-300 italic">No Action Available</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {quiz.questions.map((q, idx) => (
                  <div key={q.id} className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-[0_4px_0_0_#e2e8f0]">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-sm font-black text-emerald-600">
                        {idx + 1}
                      </div>
                      <h4 className="font-bold text-slate-800 pt-1 leading-relaxed">
                        {q.question}
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12 font-medium">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                            opt.isCorrect 
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                              : "bg-slate-50 border-slate-100 text-slate-500 opacity-80"
                          }`}
                        >
                          {opt.isCorrect ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0" />
                          )}
                          <span className="text-sm">{opt.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
