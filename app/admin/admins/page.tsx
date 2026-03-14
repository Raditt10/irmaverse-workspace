"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import Loading from "@/components/ui/Loading";
import SearchInput from "@/components/ui/SearchInput";
import Toast from "@/components/ui/Toast";
import CartoonConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import {
  Shield,
  Plus,
  Edit3,
  Trash2,
  X,
  UserCircle2,
  Mail,
  Phone,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Crown,
  History,
  Activity,
  User,
  Clock3,
  CheckCircle2,
  Award,
  Zap,
  BookOpen,
  Calendar,
  MessageSquare,
  TrendingUp,
  UserPlus,
  Search,
  Book,
  HelpCircle,
} from "lucide-react";

interface AdminData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  avatar: string | null;
  notelp: string | null;
  address: string | null;
  createdAt: string;
}

interface ActivityLog {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
  user: {
    name: string | null;
    avatar: string | null;
    role: string;
  };
}

export default function AdminAdminsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminData | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    notelp: "",
    address: "",
  });

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role?.toLowerCase() !== "super_admin") {
      router.push("/overview");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAdmins();
      fetchActivities();
    }
  }, [status]);

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admin/admins");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAdmins(data);
    } catch {
      setToast({ show: true, message: "Gagal memuat data admin", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await fetch("/api/admin/activities?limit=10");
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error("Failed to fetch admin activities:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "quiz_completed":
        return <HelpCircle className="h-5 w-5 text-emerald-600" />;
      case "badge_earned":
        return <Award className="h-5 w-5 text-emerald-600" />;
      case "forum_post":
        return <MessageSquare className="h-5 w-5 text-emerald-600" />;
      case "material_read":
        return <BookOpen className="h-5 w-5 text-emerald-600" />;
      case "level_up":
        return <TrendingUp className="h-5 w-5 text-emerald-600" />;
      case "course_enrolled":
        return <Book className="h-5 w-5 text-emerald-600" />;
      case "program_enrolled":
        return <Zap className="h-5 w-5 text-emerald-600" />;
      case "friend_added":
        return <UserPlus className="h-5 w-5 text-emerald-600" />;
      case "attendance_marked":
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      // Generic/Admin types
      case "admin_login":
        return <Shield className="h-5 w-5 text-emerald-600" />;
      case "material":
        return <BookOpen className="h-5 w-5 text-emerald-600" />;
      case "schedule":
        return <Calendar className="h-5 w-5 text-emerald-600" />;
      case "competition":
        return <Award className="h-5 w-5 text-emerald-600" />;
      case "news":
        return <History className="h-5 w-5 text-emerald-600" />;
      default:
        return <Activity className="h-5 w-5 text-emerald-600" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return "Baru saja";
    if (diffMin < 60) return `${diffMin} menit lalu`;
    if (diffHour < 24) return `${diffHour} jam lalu`;
    if (diffDay < 7) return `${diffDay} hari lalu`;
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const openAddModal = () => {
    setEditingAdmin(null);
    setForm({ name: "", email: "", password: "", notelp: "", address: "" });
    setShowPassword(false);
    setShowModal(true);
  };

  const openEditModal = (admin: AdminData) => {
    setEditingAdmin(admin);
    setForm({
      name: admin.name || "",
      email: admin.email,
      password: "",
      notelp: admin.notelp || "",
      address: admin.address || "",
    });
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) {
      setToast({ show: true, message: "Nama dan email wajib diisi", type: "error" });
      return;
    }
    if (!editingAdmin && !form.password) {
      setToast({ show: true, message: "Password wajib diisi untuk akun baru", type: "error" });
      return;
    }

    setSaving(true);
    try {
      const method = editingAdmin ? "PUT" : "POST";
      const body = editingAdmin ? { id: editingAdmin.id, ...form } : form;
      if (editingAdmin && !form.password) {
        delete (body as any).password;
      }

      const res = await fetch("/api/admin/admins", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setToast({
        show: true,
        message: editingAdmin ? "Admin berhasil diperbarui" : "Admin berhasil dibuat",
        type: "success",
      });
      setShowModal(false);
      fetchAdmins();
    } catch (err: any) {
      setToast({ show: true, message: err.message || "Gagal menyimpan", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/admins?id=${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setToast({ show: true, message: "Admin berhasil dihapus", type: "success" });
      setDeleteTarget(null);
      fetchAdmins();
    } catch (err: any) {
      setToast({ show: true, message: err.message || "Gagal menghapus admin", type: "error" });
    }
  };

  const filtered = admins.filter(
    (a) =>
      (a.name || "").toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
  );

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center h-[calc(100vh-80px)]">
            <Loading text="Memuat data admin..." size="lg" />
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
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2.5 bg-emerald-100 rounded-2xl border-2 border-emerald-200 shadow-sm">
                  <Shield className="h-8 w-8 text-emerald-600" strokeWidth={2.5} />
                </div>
                <h1 className="text-2xl md:text-5xl font-black text-slate-800 tracking-tight">Kelola Akun Admin</h1>
              </div>
              <p className="text-slate-500 font-bold text-base md:text-xl ml-1 mt-2">
                Kontrol penuh untuk manajemen administrator sistem IRMA Verse.
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-[2rem] font-black text-base shadow-[0_6px_0_0_#047857] hover:-translate-y-1 hover:shadow-[0_8px_0_0_#047857] active:translate-y-0 active:shadow-none transition-all border-2 border-emerald-400 group"
            >
              <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" strokeWidth={3} />
              Tambah Admin Baru
            </button>
          </div>

          {/* Search + Stats */}
          <div className="flex flex-col md:flex-row gap-4 mb-10 items-center">
            <div className="flex-1 w-full md:max-w-xl">
              <SearchInput placeholder="Cari nama atau email admin..." value={search} onChange={setSearch} />
            </div>
            <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-[2rem] border-2 border-slate-100 shadow-sm">
              <div className="p-1.5 bg-emerald-50 rounded-lg">
                <Shield className="h-5 w-5 text-emerald-500" strokeWidth={3} />
              </div>
              <span className="text-base font-black text-slate-700 tracking-tight">{filtered.length} Administrator Aktif</span>
            </div>
          </div>

          {/* Admin List - WIDER CARDS (2 cols on large screen) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {filtered.length === 0 ? (
              <div className="col-span-full bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-16 text-center">
                <EmptyState
                  title="Tidak Ada Admin"
                  description="Belum ada admin yang terdaftar atau ditemukan dari pencarian Anda."
                  customIcon={<Shield className="h-16 w-16 text-slate-200" />}
                />
              </div>
            ) : (
              filtered.map((admin) => (
                <div
                  key={admin.id}
                  className="bg-white rounded-[3rem] border-2 border-slate-100 shadow-[0_4px_0_0_#f1f5f9] hover:border-emerald-300 hover:shadow-[0_8px_0_0_#ecfdf5] hover:-translate-y-1 transition-all duration-300 overflow-hidden group flex flex-col md:flex-row h-full"
                >
                  {/* Left part - Profile */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 flex flex-col items-center justify-center md:w-56 shrink-0 border-r-2 border-slate-50">
                    <div className="w-24 h-24 rounded-3xl bg-white border-[4px] border-emerald-100 shadow-lg overflow-hidden mb-4 group-hover:scale-110 transition-transform duration-500">
                      {admin.avatar ? (
                        <img src={admin.avatar} alt={admin.name || ""} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-emerald-50">
                          <User className="h-12 w-12 text-emerald-200" />
                        </div>
                      )}
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white border-2 border-emerald-400 shadow-sm">
                      ADMIN
                    </span>
                  </div>

                  {/* Right part - Details */}
                  <div className="p-8 flex-1 flex flex-col justify-between relative">
                    <div className="absolute top-6 right-6 flex gap-2">
                       <button
                        onClick={() => openEditModal(admin)}
                        className="p-2.5 rounded-2xl bg-white border-2 border-slate-100 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all shadow-sm"
                        title="Edit Admin"
                      >
                        <Edit3 className="h-5 w-5" strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(admin)}
                        className="p-2.5 rounded-2xl bg-white border-2 border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm"
                        title="Hapus Admin"
                      >
                        <Trash2 className="h-5 w-5" strokeWidth={2.5} />
                      </button>
                    </div>

                    <div className="mt-2 pr-12">
                      <h3 className="font-black text-slate-800 text-2xl tracking-tight mb-1 group-hover:text-emerald-600 transition-colors uppercase leading-tight">{admin.name || "Anonim"}</h3>
                      <div className="flex items-center gap-2 text-slate-400 font-bold mb-4">
                        <Mail className="h-4 w-4" />
                        <span className="truncate text-sm">{admin.email}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                         <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-emerald-50 transition-all">
                            <div className="p-1.5 bg-white rounded-lg border border-slate-200 group-hover:border-emerald-100">
                             <Phone className="h-4 w-4 text-emerald-500" />
                            </div>
                            <span className="text-xs font-black text-slate-600 tracking-wide">{admin.notelp || "Belum ada telepon"}</span>
                         </div>
                         <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-emerald-50 transition-all">
                            <div className="p-1.5 bg-white rounded-lg border border-slate-200 group-hover:border-emerald-100">
                             <Clock3 className="h-4 w-4 text-emerald-500" />
                            </div>
                            <div className="text-[10px] font-black uppercase text-slate-400 leading-none">
                              Terdaftar Sejak<br/>
                              <span className="text-xs text-slate-600 mt-0.5 inline-block">{new Date(admin.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ===== LOG AKTIVITAS ADMIN SECTION ===== */}
          <section className="mb-12">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-2">
                <div>
                   <div className="flex items-center gap-4 mb-1">
                      <div className="p-3 bg-white border-2 border-emerald-100 rounded-[1.5rem] shadow-[4px_4px_0_0_#ecfdf5]">
                        <Activity className="h-8 w-8 text-emerald-500" strokeWidth={2.5} />
                      </div>
                      <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter uppercase">Log Aktivitas Admin</h2>
                   </div>
                   <p className="text-slate-500 font-bold text-lg md:text-xl ml-1 mt-1">
                      Pantau tindakan terbaru yang dilakukan oleh administrator sistem.
                   </p>
                </div>
                <button 
                  onClick={fetchActivities}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-emerald-500 border-2 border-emerald-100 rounded-2xl font-black text-sm hover:bg-emerald-50 transition-all shadow-sm"
                >
                  <History className="h-4 w-4" />
                  Refresh Log
                </button>
             </div>

             <div className="bg-white rounded-[3rem] border-2 border-slate-100 p-8 shadow-[0_8px_0_0_#f8fafc]">
                {loadingLogs ? (
                   <div className="py-20 flex flex-col items-center justify-center text-center">
                      <Loading text="Memuat riwayat aktivitas administrator..." />
                   </div>
                ) : activities.length === 0 ? (
                   <div className="py-20 flex flex-col items-center justify-center text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                        <History className="h-16 w-16 text-slate-200 mb-4" />
                        <p className="text-slate-400 font-black text-xl italic uppercase tracking-widest">Belum ada riwayat aktivitas</p>
                        <p className="text-slate-400 font-bold mt-2">Semua tindakan admin akan tercatat otomatis di sini.</p>
                   </div>
                ) : (
                   <div className="space-y-4">
                      {activities.map((activity) => (
                         <div 
                          key={activity.id} 
                          className="flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-[2rem] border-2 border-slate-50 bg-slate-50/30 hover:bg-white hover:border-emerald-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
                         >
                            {/* Admin Info */}
                            <div className="flex items-center gap-4 md:w-64 shrink-0 border-b-2 md:border-b-0 md:border-r-2 border-slate-100 pb-4 md:pb-0 md:pr-4">
                               <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-emerald-100 bg-emerald-50 shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                                  {activity.user.avatar ? (
                                     <img src={activity.user.avatar} alt={activity.user.name || ""} className="w-full h-full object-cover" />
                                  ) : (
                                     <div className="w-full h-full flex items-center justify-center">
                                        <User className="h-6 w-6 text-emerald-300" />
                                     </div>
                                  )}
                               </div>
                               <div className="min-w-0">
                                  <p className="font-black text-slate-800 text-sm truncate uppercase tracking-tight group-hover:text-emerald-600 transition-colors">{activity.user.name || "Administrator"}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest text-white ${
                                        activity.user.role?.toLowerCase() === 'super_admin' ? 'bg-amber-400' : 'bg-emerald-400'
                                      }`}>
                                        {activity.user.role?.replace('_', ' ') || 'Admin'}
                                      </span>
                                  </div>
                               </div>
                            </div>

                            {/* Activity Detail */}
                            <div className="flex-1 min-w-0 flex items-center gap-4">
                               <div className="h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center border-2 bg-white border-emerald-50 text-emerald-600 shadow-sm group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-400 transition-colors">
                                  {getActivityIcon(activity.type)}
                               </div>
                               <div className="flex-1 min-w-0">
                                  <p className="font-black text-slate-800 text-lg md:text-xl truncate leading-tight tracking-tight uppercase group-hover:text-emerald-600 transition-colors">
                                     {activity.title}
                                  </p>
                                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
                                     <Clock3 className="h-3.5 w-3.5" />
                                     {formatDate(activity.createdAt)}
                                  </p>
                               </div>
                            </div>

                            {/* Info Tag */}
                            <div className="shrink-0 hidden lg:block">
                               <span className="px-5 py-2 rounded-full text-[10px] font-black bg-slate-100 text-slate-500 border-2 border-slate-200 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-colors uppercase tracking-[0.2em] shadow-sm">
                                  Verified Session
                               </span>
                            </div>
                         </div>
                      ))}
                   </div>
                )}
                
                <div className="mt-8 pt-8 border-t-2 border-slate-50 text-center">
                   <p className="text-slate-400 font-bold text-sm tracking-wide italic">
                      Riwayat log aktivitas ini hanya dapat diakses oleh administrator tingkat tinggi sistem IRMA Verse.
                   </p>
                </div>
             </div>
          </section>
        </main>
      </div>

      <ChatbotButton />

      {/* Modal Add/Edit */}
      {showModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] border-2 border-slate-200 shadow-[0_15px_30px_-5px_rgba(0,0,0,0.1)] w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white/80 backdrop-blur-md rounded-t-[3rem] border-b-2 border-slate-100 p-8 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md">
                    <Shield className="h-6 w-6 text-white" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                    {editingAdmin ? "Edit Admin" : "Tambah Admin"}
                  </h2>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2.5 rounded-2xl hover:bg-slate-100 text-slate-400 transition-all hover:rotate-90">
                  <X className="h-6 w-6" strokeWidth={3} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-6">
                {/* Name */}
                <div className="group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">Nama Lengkap Admin</label>
                  <div className="relative">
                    <UserCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Masukkan nama lengkap"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 text-base font-bold text-slate-700 placeholder:text-slate-300 focus:border-emerald-400 focus:bg-emerald-50/30 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">Alamat Email Resmi</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="admin@irmaverse.com"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 text-base font-bold text-slate-700 placeholder:text-slate-300 focus:border-emerald-400 focus:bg-emerald-50/30 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">
                    Password Akun {editingAdmin ? "(Opsional)" : ""}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder={editingAdmin ? "Tetap gunakan yang lama" : "Minimal 8 karakter"}
                      className="w-full pl-12 pr-14 py-4 rounded-2xl border-2 border-slate-100 text-base font-bold text-slate-700 placeholder:text-slate-300 focus:border-emerald-400 focus:bg-emerald-50/30 transition-all outline-none"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-500 transition-colors">
                      {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                    </button>
                  </div>
                </div>

                {/* Phone */}
                <div className="group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">Nomor Telepon/WA</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      type="text"
                      value={form.notelp}
                      onChange={(e) => setForm({ ...form, notelp: e.target.value })}
                      placeholder="Contoh: 081234567890"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 text-base font-bold text-slate-700 placeholder:text-slate-300 focus:border-emerald-400 focus:bg-emerald-50/30 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">Alamat Tinggal</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <textarea
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Masukkan alamat lengkap admin"
                      rows={3}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 text-base font-bold text-slate-700 placeholder:text-slate-300 focus:border-emerald-400 focus:bg-emerald-50/30 transition-all outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white/80 backdrop-blur-md rounded-b-[3rem] border-t-2 border-slate-100 p-8 flex gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 rounded-[2rem] font-black text-base bg-slate-50 text-slate-500 border-2 border-slate-200 shadow-[0_4px_0_0_#e2e8f0] hover:-translate-y-1 hover:shadow-[0_6px_0_0_#e2e8f0] active:translate-y-0 active:shadow-none transition-all uppercase tracking-widest"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-4 rounded-[2rem] font-black text-base text-white bg-gradient-to-r from-emerald-500 to-teal-500 border-2 border-emerald-400 shadow-[0_4px_0_0_#047857] hover:-translate-y-1 hover:shadow-[0_6px_0_0_#047857] active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 uppercase tracking-widest"
                >
                  {saving ? "Proses..." : "Simpan Akun"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <CartoonConfirmDialog
          type="warning"
          title="Konfirmasi Hapus Admin"
          message={`Apakah Anda yakin ingin menghapus akun administrator "${deleteTarget.name || deleteTarget.email}" secara permanen? Data yang telah dihapus tidak dapat dipulihkan kembali.`}
          confirmText="Ya, Hapus Permanen"
          cancelText="Batal"
          isOpen={true}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
