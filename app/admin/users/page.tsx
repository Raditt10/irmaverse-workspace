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
import CustomDropdown from "@/components/ui/CustomDropdown";
import EmptyState from "@/components/ui/EmptyState";
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  X,
  UserCircle2,
  Mail,
  Phone,
  MapPin,
  Lock,
  Briefcase,
  Eye,
  EyeOff,
  Zap,
  Star,
} from "lucide-react";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  avatar: string | null;
  notelp: string | null;
  address: string | null;
  jabatan: string | null;
  createdAt: string;
  points: number;
  level: number;
}

const JABATAN_OPTIONS = [
  { value: "", label: "— Tidak Ada —" },
  { value: "Ketua IRMA", label: "Ketua IRMA" },
  { value: "Wakil Ketua IRMA", label: "Wakil Ketua IRMA" },
  { value: "Sekretaris", label: "Sekretaris" },
  { value: "Bendahara", label: "Bendahara" },
  { value: "Koordinator Divisi", label: "Koordinator Divisi" },
  { value: "Anggota", label: "Anggota" },
];

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    jabatan: "",
    notelp: "",
    address: "",
  });

  useEffect(() => {
    const role = session?.user?.role?.toLowerCase();
    if (status === "authenticated" && role !== "admin" && role !== "super_admin") {
      router.push("/overview");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (status === "authenticated") fetchUsers();
  }, [status]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data);
    } catch {
      setToast({ show: true, message: "Gagal memuat data anggota", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setForm({ name: "", email: "", password: "", role: "user", jabatan: "", notelp: "", address: "" });
    setShowPassword(false);
    setShowModal(true);
  };

  const openEditModal = (user: UserData) => {
    setEditingUser(user);
    setForm({
      name: user.name || "",
      email: user.email,
      password: "",
      role: user.role,
      jabatan: user.jabatan || "",
      notelp: user.notelp || "",
      address: user.address || "",
    });
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) {
      setToast({ show: true, message: "Nama dan email wajib diisi", type: "error" });
      return;
    }
    if (!editingUser && !form.password) {
      setToast({ show: true, message: "Password wajib diisi untuk akun baru", type: "error" });
      return;
    }

    setSaving(true);
    try {
      const method = editingUser ? "PUT" : "POST";
      const body = editingUser ? { id: editingUser.id, ...form } : form;
      if (editingUser && !form.password) {
        delete (body as any).password;
      }

      const res = await fetch("/api/admin/users", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setToast({ show: true, message: editingUser ? "Akun berhasil diperbarui" : "Akun berhasil dibuat", type: "success" });
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      setToast({ show: true, message: err.message || "Gagal menyimpan", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/users?id=${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setToast({ show: true, message: "Akun berhasil dihapus", type: "success" });
      setDeleteTarget(null);
      fetchUsers();
    } catch {
      setToast({ show: true, message: "Gagal menghapus akun", type: "error" });
    }
  };

  const filtered = users.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (jabatan: string | null) => {
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
        {jabatan || "Anggota"}
      </span>
    );
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center h-[calc(100vh-80px)]">
            <Loading text="Memuat data anggota..." size="lg" />
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
              <h1 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight mb-1">Kelola Akun Anggota</h1>
              <p className="text-slate-500 font-bold text-base md:text-lg ml-1">Tambah, edit, dan kelola semua akun anggota IRMA.</p>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-5 py-3 bg-linear-to-r from-emerald-400 to-teal-400 text-white rounded-2xl font-black text-sm shadow-[0_4px_0_0_#059669] hover:-translate-y-1 hover:shadow-[0_6px_0_0_#059669] active:translate-y-0 active:shadow-none transition-all border-2 border-emerald-500"
            >
              <Plus className="h-5 w-5" strokeWidth={3} />
              Tambah Anggota
            </button>
          </div>

          {/* Search + Stats */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 max-w-md">
              <SearchInput placeholder="Cari nama atau email..." value={search} onChange={setSearch} />
            </div>
            <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border-2 border-slate-100 shadow-sm">
              <Users className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-black text-slate-700">{filtered.length} Anggota</span>
            </div>
          </div>

          {/* User List */}
          <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    title="Tidak Ada Anggota"
                    description="Belum ada anggota yang terdaftar atau ditemukan dari pencarian Anda."
                    customIcon={<Users className="h-12 w-12 text-slate-400" />}
                  />
                </div>
              ) : (
                filtered.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 md:p-5 hover:bg-slate-50/50 transition-colors group">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center overflow-hidden shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name || ""} className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle2 className="w-6 h-6 text-emerald-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-slate-800 truncate text-sm md:text-base">{user.name || "—"}</h3>
                        <p className="text-xs text-slate-400 font-bold truncate">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getRoleBadge(user.jabatan)}
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <Zap className="h-3 w-3 text-emerald-400" />{user.points} XP
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-400" />Lv.{user.level}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2.5 rounded-xl bg-white border-2 border-slate-200 text-slate-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 shadow-[0_2px_0_0_#e2e8f0] hover:shadow-[0_2px_0_0_#a7f3d0] active:shadow-none active:translate-y-0.5 transition-all"
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(user)}
                        className="p-2.5 rounded-xl bg-white border-2 border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 shadow-[0_2px_0_0_#e2e8f0] hover:shadow-[0_2px_0_0_#fecaca] active:shadow-none active:translate-y-0.5 transition-all"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      

      {/* Modal Add/Edit */}
      {showModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] border-2 border-slate-200 shadow-[0_8px_0_0_rgba(0,0,0,0.08)] w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white rounded-t-[2rem] border-b-2 border-slate-100 p-5 flex items-center justify-between z-10">
                <h2 className="text-xl font-black text-slate-800">
                  {editingUser ? "Edit Akun Anggota" : "Tambah Anggota Baru"}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                  <X className="h-5 w-5" strokeWidth={3} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Nama Lengkap *</label>
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
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@example.com"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Password {editingUser ? "(kosongkan jika tidak diubah)" : "*"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder={editingUser ? "••••••••" : "Buat password"}
                      className="w-full pl-11 pr-12 py-3 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Jabatan */}
                <CustomDropdown
                  label="Jabatan Organisasi"
                  options={JABATAN_OPTIONS}
                  value={form.jabatan}
                  onChange={(val) => setForm({ ...form, jabatan: val })}
                  placeholder="Pilih jabatan..."
                />

                {/* Phone */}
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">No. Telepon</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    <input
                      type="text"
                      value={form.notelp}
                      onChange={(e) => setForm({ ...form, notelp: e.target.value })}
                      placeholder="08xxxxxxxxxx"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Alamat</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-300" />
                    <textarea
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Alamat lengkap"
                      rows={2}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white rounded-b-[2rem] border-t-2 border-slate-100 p-5 flex gap-3">
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
                  {saving ? "Menyimpan..." : editingUser ? "Simpan Perubahan" : "Buat Akun"}
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
          title="Hapus Akun Anggota?"
          message={`Anda yakin ingin menghapus akun "${deleteTarget.name || deleteTarget.email}"? Tindakan ini tidak dapat dibatalkan.`}
          confirmText="Ya, Hapus"
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
