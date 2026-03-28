"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";

import Loading from "@/components/ui/Loading";
import Toast from "@/components/ui/Toast";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Save, FileText, Sparkles, Trash2,
  Link as LinkIcon, Type, AlertCircle, Globe,
} from "lucide-react";
import CartoonConfirmDialog from "@/components/ui/ConfirmDialog";

const RekapanEditPage = () => {
  const router = useRouter();
  const params = useParams();
  const materialId = params.id as string;

  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [rekapanType, setRekapanType] = useState<"text" | "link">("text");
  const [materialTitle, setMaterialTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isExisting, setIsExisting] = useState(false);

  const [toast, setToast] = useState<{
    show: boolean; message: string; type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      if (typeof window !== "undefined") window.location.href = "/auth";
    },
  });

  const role = session?.user?.role?.toLowerCase();
  const isPrivileged =
    role === "instruktur" || role === "admin" || role === "instructor" || role === "super_admin";

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    if (status === "authenticated" && materialId) fetchData();
  }, [status, materialId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const matRes = await fetch(`/api/materials/${materialId}`);
      if (matRes.ok) {
        const mat = await matRes.json();
        setMaterialTitle(mat.title || "");
      }
      const rekapanRes = await fetch(`/api/materials/${materialId}/rekapan`);
      if (rekapanRes.ok) {
        const data = await rekapanRes.json();
        const plainText = (data.content || "").replace(/<[^>]*>/g, "");
        setContent(plainText);
        setLink(data.link || "");
        setRekapanType(data.link && !data.content ? "link" : "text");
        setIsExisting(true);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const isText = rekapanType === "text";
    if (isText && !content.trim()) { showToast("Konten rekapan tidak boleh kosong", "error"); return; }
    if (!isText && !link.trim()) { showToast("Link rekapan tidak boleh kosong", "error"); return; }

    setSaving(true);
    try {
      const payload = isText
        ? { content: content.split("\n").filter(l => l.trim()).map(l => `<p>${l}</p>`).join("\n"), link: null }
        : { content: null, link: link.trim() };

      const res = await fetch(`/api/materials/${materialId}/rekapan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      const res = await fetch(`/api/materials/${materialId}/rekapan`, { method: "DELETE" });
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
          <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-80px)]">
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
            <div className="text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-100">
                <AlertCircle className="h-9 w-9 text-red-400" />
              </div>
              <h2 className="text-2xl font-black text-slate-700 mb-2">Akses Ditolak</h2>
              <p className="text-slate-500 mb-6">Hanya instruktur atau admin yang bisa mengedit rekapan.</p>
              <button onClick={() => router.back()} className="px-6 py-3 rounded-xl bg-teal-500 text-white font-black hover:bg-teal-600 transition-all">
                Kembali
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isSaveDisabled = saving || (rekapanType === "text" ? !content.trim() : !link.trim());

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 w-full max-w-[100vw] overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
          <div className="max-w-3xl mx-auto">

            {/* --- TOP NAV --- */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 font-bold transition-all group px-4 py-2 rounded-xl border-2 border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Kembali
              </button>
              <div className="flex items-center gap-2 text-sm text-slate-500 font-semibold">
                <FileText className="h-4 w-4" />
                {isExisting ? "Edit Rekapan" : "Buat Rekapan Baru"}
              </div>
            </div>

            {/* --- PAGE TITLE AREA --- */}
            <div className="mb-8">
              <h1 className="text-2xl lg:text-3xl font-black text-slate-800 leading-tight">
                {materialTitle || "Rekapan Kajian"}
              </h1>
              <p className="text-slate-500 font-medium mt-1 text-sm">
                Tulis ringkasan materi kajian untuk membantu peserta belajar mandiri.
              </p>
            </div>

            {/* --- TYPE SELECTOR --- */}
            <div className="flex gap-3 mb-8 p-1 bg-slate-100 rounded-2xl">
              <button
                onClick={() => setRekapanType("text")}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl transition-all text-sm font-black ${
                  rekapanType === "text"
                    ? "bg-white text-amber-700 shadow-sm border-2 border-amber-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Type className="h-4 w-4" />
                Ringkasan Teks
              </button>
              <button
                onClick={() => setRekapanType("link")}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl transition-all text-sm font-black ${
                  rekapanType === "link"
                    ? "bg-white text-emerald-700 shadow-sm border-2 border-emerald-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <LinkIcon className="h-4 w-4" />
                Link Materi Luar
              </button>
            </div>

            {/* --- CONTENT EDITOR --- */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden mb-6">
              {rekapanType === "text" ? (
                <div className="p-6 lg:p-8">
                  <label className="block text-sm font-black text-slate-700 mb-3">
                    Isi Rekapan
                  </label>
                  <Textarea
                    name="rekapanContent"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Mulai menulis ringkasan kajian di sini...&#10;&#10;Contoh:&#10;Pada kajian kali ini, kita membahas tentang ...&#10;&#10;Poin penting yang disampaikan:&#10;- Poin pertama&#10;- Poin kedua"
                    className="min-h-[400px] resize-y border-2 border-slate-100 focus:border-amber-300 focus:ring-4 focus:ring-amber-50 rounded-2xl transition-all text-slate-800 font-medium leading-relaxed bg-[#FDFBF7]"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-slate-400 font-medium">
                      Gunakan baris baru untuk memisahkan paragraf
                    </p>
                    <span className="text-xs font-bold text-slate-400">
                      {content.length} karakter
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 lg:p-8">
                  <label className="block text-sm font-black text-slate-700 mb-3">
                    Link Materi (Google Drive / Canva / Lainnya)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-emerald-500" />
                    </div>
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      className="w-full pl-11 pr-4 py-4 rounded-2xl border-2 border-teal-100 focus:border-teal-400 focus:ring-4 focus:ring-teal-50 outline-none font-medium text-slate-800 transition-all"
                    />
                  </div>

                  {/* Link preview */}
                  {link && (
                    <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                        <LinkIcon className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-emerald-700 uppercase tracking-wide mb-0.5">Pratinjau Link</p>
                        <p className="text-sm text-emerald-800 font-medium truncate">{link}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                    <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                      Pastikan link bisa diakses oleh <strong>siapa saja yang memiliki tautan</strong>. Google Drive: klik kanan file → Bagikan → Siapa saja yang memiliki link.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* --- ACTION BUTTONS --- */}
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              {isExisting && (
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-red-500 font-bold border-2 border-red-100 hover:bg-red-50 hover:border-red-200 transition-all text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus Rekapan
                </button>
              )}

              <div className="flex gap-3 ml-auto">
                <button
                  onClick={() => router.back()}
                  className="px-6 py-3 rounded-2xl bg-white text-slate-600 font-bold border-2 border-slate-200 hover:border-slate-300 transition-all text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaveDisabled}
                  className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-white font-black shadow-[0_4px_0_0] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm active:translate-y-1 active:shadow-none ${
                    rekapanType === "text"
                      ? "bg-amber-500 border-2 border-amber-700 shadow-amber-600 hover:bg-amber-600"
                      : "bg-emerald-500 border-2 border-emerald-700 shadow-emerald-700 hover:bg-emerald-600"
                  }`}
                >
                  {saving ? <Sparkles className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Menyimpan..." : "Simpan Rekapan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>


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
