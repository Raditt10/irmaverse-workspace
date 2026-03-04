"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import { Input } from "@/components/ui/InputText";
import { Textarea } from "@/components/ui/textarea";
import Toast from "@/components/ui/Toast";
import Loading from "@/components/ui/Loading";
import CartoonConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  Sparkles,
  HelpCircle,
  ListChecks,
  Pencil,
  BookOpen,
  Zap,
  AlertCircle,
} from "lucide-react";

interface QuizOption {
  id?: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id?: string;
  question: string;
  options: QuizOption[];
}

interface QuizMeta {
  id: string;
  title: string;
  description: string | null;
  materialId: string | null;
  materialTitle: string | null;
  isStandalone: boolean;
  questionCount: number;
  questions: {
    id: string;
    question: string;
    order: number;
    options: { id: string; text: string; isCorrect: boolean }[];
  }[];
}

export default function EditQuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId as string;

  const { data: session, status: authStatus } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/auth");
    },
  });

  const [quizMeta, setQuizMeta] = useState<QuizMeta | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const role = session?.user?.role?.toLowerCase();
  const isPrivileged =
    role === "instruktur" || role === "admin" || role === "instructor";

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    if (authStatus === "authenticated" && quizId) {
      fetchQuiz();
    }
  }, [authStatus, quizId]);

  const fetchQuiz = async () => {
    try {
      setFetchLoading(true);
      const res = await fetch(`/api/quiz/${quizId}`);
      if (!res.ok) throw new Error("Quiz tidak ditemukan");
      const data = await res.json();

      setQuizMeta({
        id: data.id,
        title: data.title,
        description: data.description,
        materialId: data.materialId,
        materialTitle: data.materialTitle,
        isStandalone: !data.materialId,
        questionCount: data.questionCount,
        questions: data.questions,
      });

      setTitle(data.title);
      setDescription(data.description || "");
      setQuestions(
        data.questions.map((q: any) => ({
          id: q.id,
          question: q.question,
          options: q.options.map((o: any) => ({
            id: o.id,
            text: o.text,
            isCorrect: o.isCorrect ?? false,
          })),
        })),
      );
    } catch (error) {
      showToast("Gagal memuat data quiz", "error");
    } finally {
      setFetchLoading(false);
    }
  };

  /* ─── Question / Option Helpers ─── */
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        options: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
        ],
      },
    ]);
    // Scroll to bottom after state update
    setTimeout(
      () =>
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        }),
      50,
    );
  };

  const removeQuestion = (qIdx: number) => {
    if (questions.length <= 1) {
      showToast("Minimal harus ada 1 soal", "error");
      return;
    }
    setQuestions(questions.filter((_, i) => i !== qIdx));
  };

  const updateQuestion = (qIdx: number, value: string) => {
    const u = [...questions];
    u[qIdx].question = value;
    setQuestions(u);
  };

  const addOption = (qIdx: number) => {
    if (questions[qIdx].options.length >= 6) {
      showToast("Maksimal 6 opsi per soal", "error");
      return;
    }
    const u = [...questions];
    u[qIdx].options.push({ text: "", isCorrect: false });
    setQuestions(u);
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    if (questions[qIdx].options.length <= 2) {
      showToast("Minimal harus ada 2 opsi", "error");
      return;
    }
    const u = [...questions];
    const wasCorrect = u[qIdx].options[oIdx].isCorrect;
    u[qIdx].options.splice(oIdx, 1);
    if (wasCorrect && u[qIdx].options.length > 0)
      u[qIdx].options[0].isCorrect = true;
    setQuestions(u);
  };

  const updateOptionText = (qIdx: number, oIdx: number, value: string) => {
    const u = [...questions];
    u[qIdx].options[oIdx].text = value;
    setQuestions(u);
  };

  const setCorrectOption = (qIdx: number, oIdx: number) => {
    const u = [...questions];
    u[qIdx].options = u[qIdx].options.map((o, i) => ({
      ...o,
      isCorrect: i === oIdx,
    }));
    setQuestions(u);
  };

  /* ─── Submit ─── */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("Judul quiz tidak boleh kosong", "error");
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        showToast(`Soal ${i + 1} belum diisi`, "error");
        return;
      }
      const filled = q.options.filter((o) => o.text.trim());
      if (filled.length < 2) {
        showToast(`Soal ${i + 1} harus memiliki minimal 2 opsi`, "error");
        return;
      }
      const hasCorrect = q.options.some((o) => o.isCorrect && o.text.trim());
      if (!hasCorrect) {
        showToast(`Soal ${i + 1} harus memiliki 1 jawaban benar`, "error");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        questions: questions.map((q) => ({
          question: q.question.trim(),
          options: q.options
            .filter((o) => o.text.trim())
            .map((o) => ({
              text: o.text.trim(),
              isCorrect: o.isCorrect,
            })),
        })),
      };

      const res = await fetch(`/api/quiz/${quizId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: "Gagal menyimpan" }));
        throw new Error(err.error || "Gagal menyimpan");
      }

      showToast("Quiz berhasil diperbarui!", "success");
      setTimeout(() => router.push("/quiz/manage"), 1500);
    } catch (error: any) {
      showToast(error.message || "Gagal menyimpan quiz", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ─── Loading / Guard States ─── */
  if (authStatus === "loading" || fetchLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loading text="Memuat quiz..." />
      </div>
    );
  }

  if (!isPrivileged) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
            <HelpCircle className="h-16 w-16 text-slate-300 mb-4" />
            <h2 className="text-xl font-black text-slate-700 mb-2">
              Akses Ditolak
            </h2>
            <p className="text-slate-500 mb-4">
              Hanya instruktur atau admin yang bisa mengedit quiz.
            </p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 rounded-xl bg-teal-400 text-white font-black border-2 border-teal-600 border-b-4 hover:bg-teal-500 active:border-b-2 active:translate-y-0.5 transition-all"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!quizMeta) {
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
              onClick={() => router.push("/quiz/manage")}
              className="mt-4 px-6 py-3 rounded-xl bg-teal-400 text-white font-black border-2 border-teal-600 border-b-4 hover:bg-teal-500 active:border-b-2 active:translate-y-0.5 transition-all"
            >
              Kembali ke Kelola Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex flex-col lg:flex-row">
        <Sidebar />
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-12 w-full max-w-[100vw] overflow-hidden">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-4 mb-8">
              <button
                onClick={() => setShowDiscardConfirm(true)}
                className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-200 text-slate-500 font-bold hover:border-teal-400 hover:text-teal-600 transition-all text-sm"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={3} /> Kembali
              </button>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl lg:text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <Pencil className="h-7 w-7 text-amber-500" /> Edit Quiz
                  </h1>
                </div>
                {/* Quiz type badge */}
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border-2 mt-1 ${
                    quizMeta.isStandalone
                      ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                      : "bg-teal-50 text-teal-600 border-teal-200"
                  }`}
                >
                  {quizMeta.isStandalone ? (
                    <>
                      <Zap className="h-3.5 w-3.5" /> Quiz Mandiri
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-3.5 w-3.5" /> Quiz Materi ·{" "}
                      {quizMeta.materialTitle}
                    </>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6 lg:space-y-8">
              {/* Quiz Info Card */}
              <div className="bg-white p-6 lg:p-8 rounded-3xl border-2 border-slate-200 shadow-[0_6px_0_0_#cbd5e1]">
                <h2 className="text-lg font-black text-slate-700 mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" /> Info Quiz
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-600 ml-1">
                      Judul Quiz <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Judul quiz..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-600 ml-1">
                      Deskripsi{" "}
                      <span className="text-slate-400">(opsional)</span>
                    </label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Deskripsi singkat..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-5">
                {questions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="bg-white p-5 lg:p-7 rounded-3xl border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1]"
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between mb-4 gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-2xl bg-amber-100 border-2 border-amber-200 flex items-center justify-center shrink-0">
                          <span className="text-sm font-black text-amber-600">
                            {qIdx + 1}
                          </span>
                        </div>
                        <span className="text-sm font-black text-slate-600 uppercase tracking-wide">
                          Soal {qIdx + 1}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIdx)}
                        className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 border-2 border-transparent hover:border-red-200 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Question Text */}
                    <div className="mb-5">
                      <Textarea
                        value={q.question}
                        onChange={(e) => updateQuestion(qIdx, e.target.value)}
                        placeholder="Tulis pertanyaan di sini..."
                        rows={2}
                        required
                      />
                    </div>

                    {/* Options */}
                    <div className="space-y-2.5">
                      <span className="text-xs font-bold text-slate-500 ml-1">
                        Opsi Jawaban{" "}
                        <span className="text-teal-500">
                          (klik ✓ untuk menandai jawaban benar)
                        </span>
                      </span>
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCorrectOption(qIdx, oIdx)}
                            className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${
                              opt.isCorrect
                                ? "bg-emerald-500 border-emerald-600 text-white shadow-[0_3px_0_0_#059669]"
                                : "bg-white border-slate-200 text-slate-300 hover:border-emerald-300 hover:text-emerald-400"
                            }`}
                          >
                            <CheckCircle2 className="h-4 w-4" strokeWidth={3} />
                          </button>
                          <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-500 shrink-0">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <Input
                            type="text"
                            value={opt.text}
                            onChange={(e) =>
                              updateOptionText(qIdx, oIdx, e.target.value)
                            }
                            placeholder={`Opsi ${String.fromCharCode(65 + oIdx)}...`}
                            className="flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(qIdx, oIdx)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOption(qIdx)}
                        className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-xs font-bold hover:border-teal-300 hover:text-teal-500 hover:bg-teal-50/50 transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" /> Tambah Opsi
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Question Button */}
              <button
                type="button"
                onClick={addQuestion}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-amber-200 text-amber-500 font-black hover:border-amber-400 hover:bg-amber-50 transition-all"
              >
                <Plus className="h-5 w-5" /> Tambah Soal Baru
              </button>

              {/* Save Button Panel */}
              <div className="bg-amber-500 p-6 rounded-[2.5rem] text-white border-2 border-amber-600 shadow-[0_6px_0_0_#d97706]">
                <div className="flex items-center gap-3 mb-4">
                  <ListChecks className="h-8 w-8 text-amber-100" />
                  <div>
                    <h3 className="text-xl font-black">Simpan Perubahan</h3>
                    <p className="text-sm text-amber-100 font-medium">
                      {questions.length} soal ·{" "}
                      {questions.reduce(
                        (s, q) =>
                          s + q.options.filter((o) => o.text.trim()).length,
                        0,
                      )}{" "}
                      opsi
                    </p>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-white text-amber-600 font-black text-lg rounded-2xl shadow-[0_4px_0_0_#fef3c7] border-2 border-amber-100 hover:bg-amber-50 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Sparkles className="h-6 w-6 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-6 w-6" /> Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Discard Changes Confirm */}
      <CartoonConfirmDialog
        isOpen={showDiscardConfirm}
        title="Buang perubahan?"
        message="Perubahan yang belum disimpan akan hilang. Yakin ingin kembali?"
        confirmText="Ya, Kembali"
        cancelText="Tetap di sini"
        type="warning"
        onConfirm={() => router.push("/quiz/manage")}
        onCancel={() => setShowDiscardConfirm(false)}
      />

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}
