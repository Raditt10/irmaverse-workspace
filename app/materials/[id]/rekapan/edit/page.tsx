"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import Loading from "@/components/ui/Loading";
import Toast from "@/components/ui/Toast";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, FileText, Sparkles, Trash2 } from "lucide-react";
import CartoonConfirmDialog from "@/components/ui/ConfirmDialog";

const RekapanEditPage = () => {
  const router = useRouter();
  const params = useParams();
  const materialId = params.id as string;

  const [content, setContent] = useState("");
  const [materialTitle, setMaterialTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isExisting, setIsExisting] = useState(false);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      if (typeof window !== "undefined") {
        window.location.href = "/auth";
      }
    },
  });

  const role = session?.user?.role?.toLowerCase();
  const isPrivileged =
    role === "instruktur" || role === "admin" || role === "instructor";

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    if (status === "authenticated" && materialId) {
      fetchData();
    }
  }, [status, materialId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch material info
      const matRes = await fetch(`/api/materials/${materialId}`);
      if (matRes.ok) {
        const mat = await matRes.json();
        setMaterialTitle(mat.title || "");
      }

      // Fetch existing rekapan
      const rekapanRes = await fetch(`/api/materials/${materialId}/rekapan`);
      if (rekapanRes.ok) {
        const data = await rekapanRes.json();
        // Strip HTML tags for editing in plain textarea
        const plainText = (data.content || "").replace(/<[^>]*>/g, "");
        setContent(plainText);
        setIsExisting(true);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      showToast("Konten rekapan tidak boleh kosong", "error");
      return;
    }
    setSaving(true);
    try {
      // Wrap in simple <p> tags per line for HTML storage
      const htmlContent = content
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => `<p>${line}</p>`)
        .join("\n");

      const res = await fetch(`/api/materials/${materialId}/rekapan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: htmlContent }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan rekapan");
      }

      showToast("Rekapan berhasil disimpan!", "success");
      setTimeout(() => router.push(`/materials/${materialId}/rekapan`), 1200);
    } catch (error: any) {
      showToast(error.message || "Gagal menyimpan rekapan", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/materials/${materialId}/rekapan`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menghapus rekapan");
      }
      showToast("Rekapan berhasil dihapus", "success");
      setTimeout(() => router.push(`/materials/rekapan`), 1200);
    } catch (error: any) {
      showToast(error.message || "Gagal menghapus rekapan", "error");
    } finally {
      setShowDeleteDialog(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
            <Loading text="Memuat editor rekapan..." size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!isPrivileged) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
            <h2 className="text-2xl font-black text-slate-700 mb-4">
              Akses Ditolak
            </h2>
            <p className="text-slate-500 mb-6">
              Hanya instruktur atau admin yang bisa mengedit rekapan.
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
      <div className="flex">
        <Sidebar />
        <div className="flex-1 w-full max-w-[100vw] overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 font-bold transition-all group px-4 py-2 rounded-xl border-2 border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm mb-6"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform stroke-3" />
              Kembali
            </button>

            {/* Header */}
            <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[0_6px_0_0_#cbd5e1] overflow-hidden mb-8">
              <div className="bg-gradient-to-br from-amber-400 to-orange-400 p-6 lg:p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl border-2 border-white/30 flex items-center justify-center shrink-0">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-white/70 text-sm font-bold uppercase tracking-widest mb-1">
                      {isExisting ? "Edit" : "Buat"} Rekapan
                    </p>
                    <h1 className="text-xl lg:text-2xl font-black leading-tight">
                      {materialTitle || "Rekapan Materi"}
                    </h1>
                  </div>
                </div>
              </div>

              {/* Editor */}
              <div className="p-6 lg:p-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-amber-50 rounded-xl border-2 border-amber-100">
                    <Sparkles className="h-5 w-5 text-amber-600" />
                  </div>
                  <h2 className="text-xl font-black text-slate-800">
                    Ringkasan Materi
                  </h2>
                </div>

                <p className="text-sm text-slate-500 font-medium mb-4 leading-relaxed">
                  Tulis ringkasan kajian di sini. Rekapan ini dapat dibaca
                  peserta kapan saja sebagai bahan belajar mandiri.
                </p>

                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Konten Rekapan
                </label>
                <Textarea
                  name="rekapanContent"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tulis ringkasan materi kajian di sini. Gunakan baris baru untuk memisahkan paragraf..."
                  className="min-h-[320px] resize-y"
                />

                <p className="text-xs text-slate-400 font-medium mt-2">
                  Tips: Gunakan Enter untuk memisahkan paragraf. Setiap paragraf
                  akan tampil terpisah saat dibaca peserta.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              {isExisting && (
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-red-600 font-bold border-2 border-red-200 hover:bg-red-50 hover:border-red-400 transition-all shadow-sm text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus Rekapan
                </button>
              )}

              <div className="flex gap-3 ml-auto">
                <button
                  onClick={() => router.back()}
                  className="px-6 py-3.5 rounded-2xl bg-white text-slate-600 font-bold border-2 border-slate-200 hover:border-slate-300 transition-all text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !content.trim()}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-400 text-white font-black border-2 border-amber-600 shadow-[0_4px_0_0_#d97706] hover:bg-amber-500 hover:shadow-[0_4px_0_0_#b45309] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {saving ? (
                    <Sparkles className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? "Menyimpan..." : "Simpan Rekapan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ChatbotButton />

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />

      <CartoonConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Hapus Rekapan?"
        message="Apakah Anda yakin ingin menghapus rekapan ini? Tindakan ini tidak dapat dibatalkan."
        type="warning"
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />
    </div>
  );
};

export default RekapanEditPage;
