"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import Loading from "@/components/ui/Loading";
import {
  Bug,
  Lightbulb,
  Send,
  ClipboardList,
  Clock3,
  CircleCheck,
  Eye,
  XCircle,
} from "lucide-react";

type FeedbackType = "bug" | "feature";
type FeedbackStatus = "open" | "in_review" | "done" | "rejected";

interface FeedbackItem {
  id: string;
  type: FeedbackType;
  title: string;
  description: string;
  status: FeedbackStatus;
  adminNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_META: Record<
  FeedbackStatus,
  { label: string; className: string; icon: any }
> = {
  open: {
    label: "Menunggu Ditinjau",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock3,
  },
  in_review: {
    label: "Sedang Ditinjau",
    className: "bg-sky-50 text-sky-700 border-sky-200",
    icon: Eye,
  },
  done: {
    label: "Selesai",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CircleCheck,
  },
  rejected: {
    label: "Ditolak",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    icon: XCircle,
  },
};

export default function FeedbackPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/auth");
    },
  });

  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    type: "bug" as FeedbackType,
    title: "",
    description: "",
  });

  const role = session?.user?.role?.toLowerCase();
  const isAdmin = role === "admin" || role === "super_admin";

  const summary = useMemo(() => {
    return {
      total: items.length,
      open: items.filter((i) => i.status === "open").length,
      review: items.filter((i) => i.status === "in_review").length,
      done: items.filter((i) => i.status === "done").length,
    };
  }, [items]);

  async function fetchMyReports() {
    try {
      setLoading(true);
      const res = await fetch("/api/feedback");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat laporan");
      setItems(data.reports || []);
    } catch (e: any) {
      setError(e.message || "Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      fetchMyReports();
    }
  }, [status]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.title.trim().length < 5) {
      setError("Judul minimal 5 karakter");
      return;
    }
    if (form.description.trim().length < 15) {
      setError("Deskripsi minimal 15 karakter");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim laporan");

      setSuccess("Laporan berhasil dikirim. Terima kasih!");
      setForm({ type: "bug", title: "", description: "" });
      fetchMyReports();
    } catch (e: any) {
      setError(e.message || "Gagal mengirim laporan");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading" || loading) {
    return <Loading fullScreen text="Memuat halaman laporan..." />;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <section className="bg-linear-to-r from-teal-500 to-emerald-500 rounded-[2.5rem] border-2 border-teal-700 shadow-[0_8px_0_0_#0f766e] p-6 md:p-8 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  Lapor Bug & Request Fitur
                </h1>
                <p className="text-teal-50 font-bold mt-1">
                  Bantu kami meningkatkan IRMA Verse dengan masukan kamu.
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => router.push("/admin/feedback")}
                  className="px-4 py-2 rounded-xl bg-white text-teal-600 font-black border-2 border-white shadow-[0_4px_0_0_#0f766e] hover:translate-y-0.5 transition-all"
                >
                  Lihat Semua Laporan
                </button>
              )}
            </div>
          </section>

          {role !== "user" && (
            <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 text-amber-800 font-bold">
              Halaman kirim laporan ditujukan untuk role anggota (user). Kamu
              tetap bisa melihat laporan dari panel admin.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-[2rem] border-2 border-slate-200 shadow-[0_6px_0_0_#e2e8f0] p-5 md:p-6">
              <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-teal-500" />
                Form Laporan
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-1">
                    Tipe
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, type: "bug" }))}
                      className={`p-3 rounded-xl border-2 font-black text-sm flex items-center justify-center gap-2 transition-all ${
                        form.type === "bug"
                          ? "bg-rose-50 border-rose-300 text-rose-700"
                          : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      <Bug className="h-4 w-4" /> Bug
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((p) => ({ ...p, type: "feature" }))
                      }
                      className={`p-3 rounded-xl border-2 font-black text-sm flex items-center justify-center gap-2 transition-all ${
                        form.type === "feature"
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                          : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      <Lightbulb className="h-4 w-4" /> Feature
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-700 mb-1">
                    Judul
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, title: e.target.value }))
                    }
                    placeholder="Contoh: Tombol submit tidak berfungsi di halaman quiz"
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 font-medium text-slate-700 focus:border-teal-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-700 mb-1">
                    Deskripsi detail
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                    rows={6}
                    placeholder="Jelaskan langkah kejadian bug / ide fitur yang diinginkan"
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 font-medium text-slate-700 focus:border-teal-400 outline-none resize-y"
                  />
                </div>

                {error && (
                  <div className="rounded-xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || role !== "user"}
                  className="w-full md:w-auto px-5 py-3 rounded-xl bg-teal-500 text-white font-black border-2 border-teal-600 shadow-[0_4px_0_0_#0f766e] hover:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Mengirim..." : "Kirim Laporan"}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-[2rem] border-2 border-slate-200 shadow-[0_6px_0_0_#e2e8f0] p-5 md:p-6 space-y-3 h-fit">
              <h3 className="font-black text-slate-800">Ringkasan Laporanmu</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border-2 border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-black text-slate-400 uppercase">
                    Total
                  </p>
                  <p className="text-2xl font-black text-slate-800">
                    {summary.total}
                  </p>
                </div>
                <div className="rounded-xl border-2 border-amber-100 bg-amber-50 p-3">
                  <p className="text-xs font-black text-amber-500 uppercase">
                    Open
                  </p>
                  <p className="text-2xl font-black text-amber-700">
                    {summary.open}
                  </p>
                </div>
                <div className="rounded-xl border-2 border-sky-100 bg-sky-50 p-3">
                  <p className="text-xs font-black text-sky-500 uppercase">
                    Review
                  </p>
                  <p className="text-2xl font-black text-sky-700">
                    {summary.review}
                  </p>
                </div>
                <div className="rounded-xl border-2 border-emerald-100 bg-emerald-50 p-3">
                  <p className="text-xs font-black text-emerald-500 uppercase">
                    Done
                  </p>
                  <p className="text-2xl font-black text-emerald-700">
                    {summary.done}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <section className="bg-white rounded-[2rem] border-2 border-slate-200 shadow-[0_6px_0_0_#e2e8f0] p-5 md:p-6">
            <h2 className="text-xl font-black text-slate-800 mb-4">
              Riwayat Laporan
            </h2>

            {items.length === 0 ? (
              <p className="text-slate-500 font-bold">
                Belum ada laporan yang kamu kirim.
              </p>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const statusMeta = STATUS_META[item.status];
                  const StatusIcon = statusMeta.icon;
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border-2 border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-slate-100 border border-slate-200 text-slate-700 uppercase">
                          {item.type === "bug" ? "Bug" : "Feature"}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-black border inline-flex items-center gap-1 ${statusMeta.className}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />{" "}
                          {statusMeta.label}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 ml-auto">
                          {new Date(item.createdAt).toLocaleString("id-ID")}
                        </span>
                      </div>
                      <h3 className="font-black text-slate-800 text-lg">
                        {item.title}
                      </h3>
                      <p className="text-slate-600 font-medium mt-1 whitespace-pre-line">
                        {item.description}
                      </p>

                      {item.adminNote && (
                        <div className="mt-3 rounded-xl border-2 border-teal-100 bg-teal-50 p-3">
                          <p className="text-xs font-black text-teal-600 uppercase">
                            Catatan Admin
                          </p>
                          <p className="text-sm font-bold text-teal-800 mt-1 whitespace-pre-line">
                            {item.adminNote}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
