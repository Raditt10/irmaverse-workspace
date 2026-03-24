"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/ui/Sidebar";
import DashboardHeader from "@/components/ui/Header";
import Loading from "@/components/ui/Loading";
import { Search, RefreshCw, ClipboardList, Bug, Lightbulb } from "lucide-react";

type FeedbackType = "bug" | "feature";
type FeedbackStatus = "open" | "in_review" | "done" | "rejected";

interface FeedbackReport {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  userRole: string;
  type: FeedbackType;
  title: string;
  description: string;
  status: FeedbackStatus;
  adminNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS: FeedbackStatus[] = [
  "open",
  "in_review",
  "done",
  "rejected",
];

const STATUS_LABEL: Record<FeedbackStatus, string> = {
  open: "Open",
  in_review: "In Review",
  done: "Done",
  rejected: "Rejected",
};

export default function AdminFeedbackPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/auth");
    },
  });

  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | FeedbackStatus>(
    "all",
  );
  const [typeFilter, setTypeFilter] = useState<"all" | FeedbackType>("all");

  const role = session?.user?.role?.toLowerCase();

  useEffect(() => {
    if (status === "authenticated") {
      if (role !== "admin" && role !== "super_admin") {
        router.replace("/overview");
        return;
      }
      fetchReports();
    }
  }, [status, role]);

  async function fetchReports() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (search.trim()) params.set("q", search.trim());

      const res = await fetch(`/api/admin/feedback?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat laporan");
      setReports(data.reports || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function updateReport(
    id: string,
    status: FeedbackStatus,
    adminNote: string,
  ) {
    try {
      setSavingId(id);
      const res = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, adminNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui laporan");
      await fetchReports();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingId(null);
    }
  }

  const summary = useMemo(() => {
    return {
      total: reports.length,
      open: reports.filter((r) => r.status === "open").length,
      review: reports.filter((r) => r.status === "in_review").length,
      done: reports.filter((r) => r.status === "done").length,
    };
  }, [reports]);

  if (status === "loading" || loading) {
    return <Loading fullScreen text="Memuat laporan user..." />;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <section className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[0_8px_0_0_#e2e8f0] p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <ClipboardList className="h-6 w-6 text-teal-500" />
                  Laporan Bug & Request User
                </h1>
                <p className="text-slate-500 font-bold mt-1">
                  Tinjau, ubah status, dan beri catatan untuk setiap laporan.
                </p>
              </div>

              <button
                onClick={fetchReports}
                className="px-4 py-2 rounded-xl bg-teal-500 text-white font-black border-2 border-teal-600 shadow-[0_4px_0_0_#0f766e] hover:translate-y-0.5 transition-all flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
              <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-black text-slate-400 uppercase">
                  Total
                </p>
                <p className="text-2xl font-black text-slate-800">
                  {summary.total}
                </p>
              </div>
              <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-black text-amber-500 uppercase">
                  Open
                </p>
                <p className="text-2xl font-black text-amber-700">
                  {summary.open}
                </p>
              </div>
              <div className="rounded-xl border-2 border-sky-200 bg-sky-50 p-3">
                <p className="text-xs font-black text-sky-500 uppercase">
                  Review
                </p>
                <p className="text-2xl font-black text-sky-700">
                  {summary.review}
                </p>
              </div>
              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs font-black text-emerald-500 uppercase">
                  Done
                </p>
                <p className="text-2xl font-black text-emerald-700">
                  {summary.done}
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-[2rem] border-2 border-slate-200 shadow-[0_6px_0_0_#e2e8f0] p-5 md:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari judul, deskripsi, email..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 font-medium text-slate-700 focus:border-teal-400 outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-xl border-2 border-slate-200 px-3 py-2.5 font-bold text-slate-700"
              >
                <option value="all">Semua Status</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="rounded-xl border-2 border-slate-200 px-3 py-2.5 font-bold text-slate-700"
              >
                <option value="all">Semua Tipe</option>
                <option value="bug">Bug</option>
                <option value="feature">Feature</option>
              </select>
            </div>

            <button
              onClick={fetchReports}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-black border-2 border-slate-200 hover:bg-slate-200 transition-all"
            >
              Terapkan Filter
            </button>
          </section>

          <section className="space-y-4">
            {reports.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 text-slate-500 font-bold">
                Tidak ada laporan.
              </div>
            ) : (
              reports.map((report) => (
                <article
                  key={report.id}
                  className="bg-white rounded-[2rem] border-2 border-slate-200 shadow-[0_6px_0_0_#e2e8f0] p-5"
                >
                  <div className="flex flex-wrap items-start gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-black uppercase bg-slate-100 border border-slate-200 text-slate-700 inline-flex items-center gap-1">
                      {report.type === "bug" ? (
                        <Bug className="h-3.5 w-3.5" />
                      ) : (
                        <Lightbulb className="h-3.5 w-3.5" />
                      )}
                      {report.type}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-teal-50 border border-teal-200 text-teal-700">
                      {report.userName || "Tanpa Nama"} · {report.userEmail}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 ml-auto">
                      {new Date(report.createdAt).toLocaleString("id-ID")}
                    </span>
                  </div>

                  <h3 className="mt-3 text-xl font-black text-slate-800">
                    {report.title}
                  </h3>
                  <p className="mt-1 text-slate-600 font-medium whitespace-pre-line">
                    {report.description}
                  </p>

                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
                    <select
                      value={report.status}
                      onChange={(e) => {
                        const nextStatus = e.target.value as FeedbackStatus;
                        setReports((prev) =>
                          prev.map((r) =>
                            r.id === report.id
                              ? { ...r, status: nextStatus }
                              : r,
                          ),
                        );
                      }}
                      className="rounded-xl border-2 border-slate-200 px-3 py-2.5 font-black text-slate-700"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>

                    <textarea
                      value={report.adminNote || ""}
                      onChange={(e) => {
                        const note = e.target.value;
                        setReports((prev) =>
                          prev.map((r) =>
                            r.id === report.id ? { ...r, adminNote: note } : r,
                          ),
                        );
                      }}
                      rows={3}
                      placeholder="Catatan admin (opsional)"
                      className="lg:col-span-2 rounded-xl border-2 border-slate-200 px-3 py-2.5 font-medium text-slate-700 focus:border-teal-400 outline-none"
                    />
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      disabled={savingId === report.id}
                      onClick={() =>
                        updateReport(
                          report.id,
                          report.status,
                          report.adminNote || "",
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-teal-500 text-white font-black border-2 border-teal-600 shadow-[0_4px_0_0_#0f766e] hover:translate-y-0.5 transition-all disabled:opacity-60"
                    >
                      {savingId === report.id
                        ? "Menyimpan..."
                        : "Simpan Perubahan"}
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
