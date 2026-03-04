"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import { Input } from "@/components/ui/InputText";
import { Textarea } from "@/components/ui/textarea";
import Toast from "@/components/ui/Toast";
import Loading from "@/components/ui/Loading";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  Sparkles,
  HelpCircle,
  ListChecks,
  Zap,
} from "lucide-react";

interface QuizOption {
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  question: string;
  options: QuizOption[];
}

export default function CreateStandaloneQuizPage() {
  const router = useRouter();

  const { data: session, status: authStatus } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/auth");
    },
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      question: "",
      options: [
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
      ],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const role = session?.user?.role?.toLowerCase();
  const isPrivileged =
    role === "instruktur" || role === "admin" || role === "instructor";

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
  };

  const removeQuestion = (qIdx: number) => {
    if (questions.length <= 1) {
      showToast("Minimal harus ada 1 soal", "error");
      return;
    }
    setQuestions(questions.filter((_, i) => i !== qIdx));
  };

  const updateQuestion = (qIdx: number, value: string) => {
    const updated = [...questions];
    updated[qIdx].question = value;
    setQuestions(updated);
  };

  const addOption = (qIdx: number) => {
    if (questions[qIdx].options.length >= 6) {
      showToast("Maksimal 6 opsi per soal", "error");
      return;
    }
    const updated = [...questions];
    updated[qIdx].options.push({ text: "", isCorrect: false });
    setQuestions(updated);
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    if (questions[qIdx].options.length <= 2) {
      showToast("Minimal harus ada 2 opsi per soal", "error");
      return;
    }
    const updated = [...questions];
    const wasCorrect = updated[qIdx].options[oIdx].isCorrect;
    updated[qIdx].options.splice(oIdx, 1);
    if (wasCorrect && updated[qIdx].options.length > 0) {
      updated[qIdx].options[0].isCorrect = true;
    }
    setQuestions(updated);
  };

  const updateOptionText = (qIdx: number, oIdx: number, value: string) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx].text = value;
    setQuestions(updated);
  };

  const setCorrectOption = (qIdx: number, oIdx: number) => {
    const updated = [...questions];
    updated[qIdx].options = updated[qIdx].options.map((o, i) => ({
      ...o,
      isCorrect: i === oIdx,
    }));
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      const filledOptions = q.options.filter((o) => o.text.trim());
      if (filledOptions.length < 2) {
        showToast(
          `Soal ${i + 1} harus memiliki minimal 2 opsi yang diisi`,
          "error",
        );
        return;
      }
      const hasCorrect = q.options.some((o) => o.isCorrect && o.text.trim());
      if (!hasCorrect) {
        showToast(`Soal ${i + 1} harus memiliki 1 jawaban benar`, "error");
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        questions: questions.map((q) => ({
          question: q.question.trim(),
          options: q.options
            .filter((o) => o.text.trim())
            .map((o) => ({ text: o.text.trim(), isCorrect: o.isCorrect })),
        })),
      };

      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: "Gagal membuat quiz" }));
        throw new Error(err.error || "Gagal membuat quiz");
      }

      showToast("Quiz berhasil dibuat!", "success");
      setTimeout(() => router.push("/quiz"), 1500);
    } catch (error: any) {
      showToast(error.message || "Gagal membuat quiz", "error");
    } finally {
      setLoading(false);
    }
  };

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loading text="Memuat..." />
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
              Hanya instruktur atau admin yang bisa membuat quiz.
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
                onClick={() => router.back()}
                className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-200 text-slate-500 font-bold hover:border-teal-400 hover:text-teal-600 transition-all text-sm"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={3} /> Kembali
              </button>
              <div>
                <h1 className="text-2xl lg:text-4xl font-black text-slate-800 tracking-tight mb-2 flex items-center gap-3">
                  <Zap className="h-8 w-8 text-indigo-500" /> Buat Quiz Mandiri
                </h1>
                <p className="text-slate-500 font-medium text-sm lg:text-lg">
                  Quiz ini tidak terhubung ke materi tertentu. Semua pengguna
                  bisa mengerjakannya.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
              {/* Quiz Info */}
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
                      placeholder="Contoh: Quiz Pengetahuan Umum Islam"
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
                      placeholder="Deskripsi singkat tentang quiz ini..."
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
                    className="bg-white p-5 lg:p-7 rounded-3xl border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] relative group"
                  >
                    <div className="flex items-start justify-between mb-4 gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center shrink-0">
                          <span className="text-sm font-black text-indigo-600">
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

                    <div className="mb-5">
                      <Textarea
                        value={q.question}
                        onChange={(e) => updateQuestion(qIdx, e.target.value)}
                        placeholder="Tulis pertanyaan di sini..."
                        rows={2}
                        required
                      />
                    </div>

                    <div className="space-y-2.5">
                      <span className="text-xs font-bold text-slate-500 ml-1">
                        Opsi Jawaban{" "}
                        <span className="text-teal-500">
                          (klik untuk menandai jawaban benar)
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
                            title={
                              opt.isCorrect
                                ? "Jawaban benar"
                                : "Tandai sebagai benar"
                            }
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

              <button
                type="button"
                onClick={addQuestion}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-indigo-200 text-indigo-500 font-black hover:border-indigo-400 hover:bg-indigo-50 transition-all"
              >
                <Plus className="h-5 w-5" /> Tambah Soal Baru
              </button>

              {/* Submit */}
              <div className="bg-emerald-500 p-6 rounded-[2.5rem] text-white border-2 border-emerald-600 shadow-[0_6px_0_0_#059669]">
                <div className="flex items-center gap-3 mb-4">
                  <ListChecks className="h-8 w-8 text-emerald-100" />
                  <div>
                    <h3 className="text-xl font-black">Siap Publish?</h3>
                    <p className="text-sm text-emerald-100 font-medium">
                      {questions.length} soal ·{" "}
                      {questions.reduce(
                        (sum, q) =>
                          sum + q.options.filter((o) => o.text.trim()).length,
                        0,
                      )}{" "}
                      total opsi
                    </p>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-white text-emerald-600 font-black text-lg rounded-2xl shadow-[0_4px_0_0_#d1fae5] border-2 border-emerald-100 hover:bg-emerald-50 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Sparkles className="h-6 w-6 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-6 w-6" /> Terbitkan Quiz
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}
