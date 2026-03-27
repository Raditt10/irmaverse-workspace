"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
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
  User,
  Clock3,
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



export default function AdminAdminsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [loading, setLoading] = useState(true);
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
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Kelola Akun Admin</h1>
              <p className="text-slate-400 font-bold text-sm md:text-base ml-0.5">Tambah, edit, dan kelola semua akun administrator sistem IRMA Verse.</p>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-5 py-3 bg-linear-to-r from-emerald-400 to-teal-400 text-white rounded-2xl font-black text-sm shadow-[0_4px_0_0_#059669] hover:-translate-y-1 hover:shadow-[0_6px_0_0_#059669] active:translate-y-0 active:shadow-none transition-all border-2 border-emerald-500"
            >
              <Plus className="h-5 w-5" strokeWidth={3} />
              Tambah Admin Baru
            </button>
          </div>

          {/* Search + Stats */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 max-w-md">
              <SearchInput placeholder="Cari nama atau email admin..." value={search} onChange={setSearch} />
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border-2 border-slate-100 shadow-sm">
              <span className="text-xs font-black text-slate-700">{filtered.length} Administrator</span>
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
                         className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-300 transition-all shadow-sm"
                         title="Edit Admin"
                       >
                         <Edit3 className="h-3.5 w-3.5" strokeWidth={2.5} />
                       </button>
                       <button
                         onClick={() => setDeleteTarget(admin)}
                         className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300 transition-all shadow-sm"
                         title="Hapus Admin"
                       >
                         <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
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


        </main>
      </div>

      

      {/* Modal Add/Edit */}
      {showModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-4xl border-2 border-slate-200 shadow-[0_8px_0_0_rgba(0,0,0,0.08)] w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white rounded-t-4xl border-b-2 border-slate-100 p-5 flex items-center justify-between z-10">
                <h2 className="text-xl font-black text-slate-800">
                  {editingAdmin ? "Edit Admin" : "Tambah Admin Baru"}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                  <X className="h-5 w-5" strokeWidth={3} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Nama Lengkap Admin *</label>
                  <div className="relative">
                    <UserCircle2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Masukkan nama lengkap"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Alamat Email Resmi *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="admin@irmaverse.com"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Password Akun {editingAdmin ? "(kosongkan jika tidak diubah)" : "*"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder={editingAdmin ? "••••••••" : "Minimal 8 karakter"}
                      className="w-full pl-11 pr-12 py-3 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Nomor Telepon/WA</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    <input
                      type="text"
                      value={form.notelp}
                      onChange={(e) => setForm({ ...form, notelp: e.target.value })}
                      placeholder="Contoh: 081234567890"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Alamat Tinggal</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-300" />
                    <textarea
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Masukkan alamat lengkap admin"
                      rows={3}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white rounded-b-4xl border-t-2 border-slate-100 p-5 flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-white text-slate-600 border-2 border-slate-200 shadow-[0_4px_0_0_#e2e8f0] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#e2e8f0] active:translate-y-0.5 active:shadow-none transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-linear-to-r from-emerald-400 to-teal-400 border-2 border-emerald-500 shadow-[0_4px_0_0_#059669] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#059669] active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
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
