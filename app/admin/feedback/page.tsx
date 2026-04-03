"use client";

const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f8fafc;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #10b981 0%, #14b8a6 100%);
    border-radius: 10px;
    border: 2px solid #f8fafc;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #059669 0%, #0d9488 100%);
  }
`;

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/ui/Sidebar";
import DashboardHeader from "@/components/ui/Header";
import Loading from "@/components/ui/Loading";
import { Search, RefreshCw, ClipboardList, Bug, Lightbulb, MessageSquare, ShieldCheck, User, Clock, CheckCircle2 } from "lucide-react";
import PageBanner from "@/components/ui/PageBanner";
import CustomDropdown from "@/components/ui/CustomDropdown";

type FeedbackType = "bug" | "feature";
type FeedbackStatus = "open" | "in_review" | "done" | "rejected";

interface FeedbackUser {
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
}

interface FeedbackReport {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  userRole: string;
  userAvatar: string | null;
  type: FeedbackType;
  title: string;
  description: string;
  screenshotUrl?: string | null;
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
  open: "Menunggu Ditinjau",
  in_review: "Sedang Ditinjau",
  done: "Selesai",
  rejected: "Ditolak",
};

const STATUS_CONFIG: Record<FeedbackStatus, { color: string; icon: any; border: string; bg: string }> = {
  open: { 
    color: "text-amber-600", 
    border: "border-amber-200", 
    bg: "bg-amber-50", 
    icon: Clock 
  },
  in_review: { 
    color: "text-sky-600", 
    border: "border-sky-200", 
    bg: "bg-sky-50", 
    icon: Search 
  },
  done: { 
    color: "text-emerald-600", 
    border: "border-emerald-200", 
    bg: "bg-emerald-50", 
    icon: CheckCircle2 
  },
  rejected: { 
    color: "text-rose-600", 
    border: "border-rose-200", 
    bg: "bg-rose-50", 
    icon: ShieldCheck 
  },
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
  const [users, setUsers] = useState<FeedbackUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | FeedbackStatus>(
    "all",
  );
  const [typeFilter, setTypeFilter] = useState<"all" | FeedbackType>("all");
  const [userIdFilter, setUserIdFilter] = useState("all");

  const role = session?.user?.role?.toLowerCase();

  useEffect(() => {
    if (status === "authenticated") {
      if (role !== "super_admin") {
        router.replace("/overview");
        return;
      }
      fetchReports();
      fetchUniqueUsers();
    }
  }, [status, role]);

  async function fetchUniqueUsers() {
    try {
      const res = await fetch("/api/admin/feedback/users");
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
    } catch (e) {
      console.error("Gagal memuat daftar user", e);
    }
  }

  async function fetchReports() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (userIdFilter !== "all") params.set("userId", userIdFilter);
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
      <style>{scrollbarStyles}</style>
      <DashboardHeader />
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <PageBanner
            title="Laporan Bug & Request User"
            description="Tinjau, ubah status, dan beri catatan untuk setiap laporan dari anggota."
            icon={ClipboardList}
            tag="Laporan"
            tagIcon={ClipboardList}
            action={
              <button
                onClick={() => {
                  fetchReports();
                  fetchUniqueUsers();
                }}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-white text-emerald-600 font-black text-sm border-2 border-white/80 shadow-[0_4px_0_0_#0f766e] hover:shadow-[0_2px_0_0_#0f766e] hover:translate-y-0.5 active:translate-y-1 active:shadow-none transition-all w-full max-w-60 md:w-auto mx-auto md:mx-0"
              >
                <RefreshCw className="h-4 w-4" strokeWidth={3} /> Refresh Data
              </button>
            }
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-[0_4px_0_0_#e2e8f0] p-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">
                Total Laporan
              </p>
              <p className="text-3xl font-black text-slate-800">
                {summary.total}
              </p>
            </div>
            <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-[0_4px_0_0_#fef3c7] p-4 text-amber-700">
              <p className="text-xs font-black text-amber-500 uppercase tracking-wider mb-1">
                Menunggu Ditinjau
              </p>
              <p className="text-3xl font-black">
                {summary.open}
              </p>
            </div>
            <div className="bg-white rounded-2xl border-2 border-sky-200 shadow-[0_4px_0_0_#e0f2fe] p-4 text-sky-700">
              <p className="text-xs font-black text-sky-500 uppercase tracking-wider mb-1">
                Sedang Ditinjau
              </p>
              <p className="text-3xl font-black">
                {summary.review}
              </p>
            </div>
            <div className="bg-white rounded-2xl border-2 border-emerald-200 shadow-[0_4px_0_0_#d1fae5] p-4 text-emerald-700">
              <p className="text-xs font-black text-emerald-500 uppercase tracking-wider mb-1">
                Selesai
              </p>
              <p className="text-3xl font-black">
                {summary.done}
              </p>
            </div>
          </div>

          <section className="bg-white rounded-4xl border-2 border-slate-200 shadow-[0_6px_0_0_#e2e8f0] p-5 md:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1 space-y-2">
                <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">
                  Cari Laporan
                </label>
                <div className="relative h-13 lg:h-15">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Judul, email, deskripsi..."
                    className="w-full pl-10 pr-4 py-3 lg:py-4 rounded-xl border-2 border-slate-200 font-medium text-slate-700 focus:border-teal-400 outline-none h-full transition-all"
                  />
                </div>
              </div>

              <CustomDropdown
                label="Status Laporan"
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as any)}
                options={[
                  { value: "all", label: "Semua Status" },
                  ...STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
                ]}
                placeholder="Pilih Status"
              />

              <CustomDropdown
                label="Tipe Laporan"
                value={typeFilter}
                onChange={(val) => setTypeFilter(val as any)}
                options={[
                  { value: "all", label: "Semua Tipe" },
                  { value: "bug", label: "Bug" },
                  { value: "feature", label: "Feature" },
                ]}
                placeholder="Pilih Tipe"
              />

              <CustomDropdown
                label="Akun User"
                value={userIdFilter}
                onChange={(val) => setUserIdFilter(val)}
                options={[
                  { value: "all", label: "Semua Akun" },
                  ...users.map((u) => ({ 
                    value: u.userId, 
                    label: u.name || u.email,
                    image: u.avatar || undefined
                  })),
                ]}
                placeholder="Pilih Akun"
              />
            </div>

            <button
              onClick={fetchReports}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-black border-2 border-slate-200 hover:bg-slate-200 transition-all"
            >
              Terapkan Filter
            </button>
          </section>

          <section className="bg-white rounded-4xl border-2 border-slate-200 shadow-[0_6px_0_0_#e2e8f0] overflow-hidden">
            <div className="max-h-[60vh] md:max-h-[70vh] overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
              {reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4">
                  <div className="w-20 h-20 rounded-3xl bg-slate-50 border-2 border-slate-200 shadow-[0_8px_0_0_#f1f5f9] flex items-center justify-center mb-6">
                    <ClipboardList className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-black text-slate-800">Belum Ada Laporan</h3>
                  <p className="text-slate-500 font-bold max-w-sm mt-2 text-center text-sm md:text-base">
                    Daftar laporan akan muncul di sini setelah ada kiriman dari user atau sesuai dengan filter yang kamu pilih.
                  </p>
                </div>
              ) : (
                reports.map((report) => (
                  <article
                    key={report.id}
                    className="bg-white rounded-4xl border-2 border-slate-200 shadow-[0_4px_0_0_#e2e8f0] p-5 hover:border-teal-300 transition-all"
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
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase border inline-flex items-center gap-1 ${STATUS_CONFIG[report.status].bg} ${STATUS_CONFIG[report.status].border} ${STATUS_CONFIG[report.status].color}`}>
                        {(() => {
                          const Icon = STATUS_CONFIG[report.status].icon;
                          return <Icon className="h-3.5 w-3.5" />;
                        })()}
                        {STATUS_LABEL[report.status]}
                      </span>
                      <div className="flex items-center gap-2 px-2 py-1 rounded-xl bg-teal-50 border border-teal-200 text-teal-700">
                        {report.userAvatar ? (
                          <img
                            src={report.userAvatar}
                            alt={report.userName || "Avatar"}
                            className="w-5 h-5 rounded-full object-cover border border-teal-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center border border-teal-200 shadow-sm">
                            <User className="w-3 h-3 text-teal-600" />
                          </div>
                        )}
                        <span className="text-[11px] font-black">
                          {report.userName || "Tanpa Nama"} · {report.userEmail}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 ml-auto">
                        {new Date(report.createdAt).toLocaleString("id-ID")}
                      </span>
                    </div>

                    <h3 className="mt-3 text-xl font-black text-slate-800">
                      {report.title}
                    </h3>
                    <p className="mt-1 text-slate-600 font-medium whitespace-pre-line text-sm md:text-base">
                      {report.description}
                    </p>

                    {report.screenshotUrl && (
                      <a
                        href={report.screenshotUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 block group"
                      >
                        <div className="relative overflow-hidden rounded-xl border-2 border-slate-200 group-hover:border-teal-400 transition-all max-w-sm">
                          <img
                            src={report.screenshotUrl}
                            alt="Screenshot laporan"
                            className="h-auto w-full object-contain"
                          />
                          <div className="absolute inset-0 bg-teal-600/0 group-hover:bg-teal-600/5 transition-all flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 bg-white px-3 py-1.5 rounded-lg text-xs font-black text-teal-600 shadow-lg">Lihat Gambar</span>
                          </div>
                        </div>
                      </a>
                    )}

                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
                      <CustomDropdown
                        value={report.status}
                        onChange={(nextStatus) => {
                          setReports((prev) =>
                            prev.map((r) =>
                              r.id === report.id
                                ? { ...r, status: nextStatus as FeedbackStatus }
                                : r,
                            ),
                          );
                        }}
                        options={STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
                        label="Update Status"
                      />

                      <div className="lg:col-span-2 space-y-2">
                        <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">
                          Catatan Admin
                        </label>
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
                          className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 font-medium text-slate-700 focus:border-teal-400 outline-none transition-all"
                        />
                      </div>
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
                        className="px-4 py-2 rounded-xl bg-teal-500 text-white font-black border-2 border-teal-600 shadow-[0_4px_0_0_#0f766e] hover:translate-y-0.5 active:translate-y-1 active:shadow-none transition-all disabled:opacity-60"
                      >
                        {savingId === report.id
                          ? "Menyimpan..."
                          : "Simpan Perubahan"}
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
