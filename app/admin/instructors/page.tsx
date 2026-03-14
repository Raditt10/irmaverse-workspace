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
  Users,
  Plus,
  Edit3,
  Trash2,
  X,
  UserCircle2,
  Mail,
  Phone,
  Lock,
  BookOpen,
  Star,
  Briefcase,
  FileText,
  Eye,
  EyeOff,
  Contact,
} from "lucide-react";

interface InstructorData {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  bidangKeahlian: string | null;
  pengalaman: string | null;
  bio: string | null;
  notelp: string | null;
  createdAt: string;
  kajianCount: number;
  rating: number;
}

export default function AdminInstructorsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [instructors, setInstructors] = useState<InstructorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<InstructorData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InstructorData | null>(null);
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
    bidangKeahlian: "",
    pengalaman: "",
    bio: "",
    notelp: "",
  });

  useEffect(() => {
    const role = session?.user?.role?.toLowerCase();
    if (status === "authenticated" && role !== "admin" && role !== "super_admin") {
      router.push("/overview");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (status === "authenticated") fetchInstructors();
  }, [status]);

  const fetchInstructors = async () => {
    try {
      const res = await fetch("/api/admin/instructors");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setInstructors(data);
    } catch {
      setToast({ show: true, message: "Gagal memuat data instruktur", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingInstructor(null);
    setForm({ name: "", email: "", password: "", bidangKeahlian: "", pengalaman: "", bio: "", notelp: "" });
    setShowPassword(false);
    setShowModal(true);
  };

  const openEditModal = (inst: InstructorData) => {
    setEditingInstructor(inst);
    setForm({
      name: inst.name || "",
      email: inst.email,
      password: "",
      bidangKeahlian: inst.bidangKeahlian || "",
      pengalaman: inst.pengalaman || "",
      bio: inst.bio || "",
      notelp: inst.notelp || "",
    });
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) {
      setToast({ show: true, message: "Nama dan email wajib diisi", type: "error" });
      return;
    }
    if (!editingInstructor && !form.password) {
      setToast({ show: true, message: "Password wajib diisi untuk akun baru", type: "error" });
      return;
    }

    setSaving(true);
    try {
      const method = editingInstructor ? "PUT" : "POST";
      const body = editingInstructor ? { id: editingInstructor.id, ...form } : form;
      if (editingInstructor && !form.password) {
        delete (body as any).password;
      }

      const res = await fetch("/api/admin/instructors", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setToast({
        show: true,
        message: editingInstructor ? "Instruktur berhasil diperbarui" : "Instruktur berhasil dibuat",
        type: "success",
      });
      setShowModal(false);
      fetchInstructors();
    } catch (err: any) {
      setToast({ show: true, message: err.message || "Gagal menyimpan", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/instructors?id=${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setToast({ show: true, message: "Instruktur berhasil dihapus", type: "success" });
      setDeleteTarget(null);
      fetchInstructors();
    } catch {
      setToast({ show: true, message: "Gagal menghapus instruktur", type: "error" });
    }
  };

  const filtered = instructors.filter(
    (i) =>
      (i.name || "").toLowerCase().includes(search.toLowerCase()) ||
      i.email.toLowerCase().includes(search.toLowerCase())
  );

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center h-[calc(100vh-80px)]">
            <Loading text="Memuat data instruktur..." size="lg" />
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
              <h1 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight mb-1">Kelola Akun Instruktur</h1>
              <p className="text-slate-500 font-bold text-base md:text-lg ml-1">Tambah, edit, dan kelola semua akun instruktur IRMA.</p>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-5 py-3 bg-linear-to-r from-emerald-400 to-teal-400 text-white rounded-2xl font-black text-sm shadow-[0_4px_0_0_#059669] hover:-translate-y-1 hover:shadow-[0_6px_0_0_#059669] active:translate-y-0 active:shadow-none transition-all border-2 border-emerald-500"
            >
              <Plus className="h-5 w-5" strokeWidth={3} />
              Tambah Instruktur
            </button>
          </div>

          {/* Search + Stats */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 max-w-md">
              <SearchInput placeholder="Cari nama atau email instruktur..." value={search} onChange={setSearch} />
            </div>
            <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border-2 border-slate-100 shadow-sm">
              <Contact className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-black text-slate-700">{filtered.length} Instruktur</span>
            </div>
          </div>

          {/* Instructor Cards Grid */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 p-8">
              <EmptyState
                title="Tidak Ada Instruktur"
                description="Belum ada instruktur yang terdaftar atau ditemukan dari pencarian Anda."
                customIcon={<Contact className="h-12 w-12 text-slate-400" />}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((inst) => (
                <div
                  key={inst.id}
                  className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all duration-300 overflow-hidden group"
                >
                  {/* Card Header */}
                  <div className="bg-linear-to-br from-emerald-50 to-teal-50 p-6 text-center relative">
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      <button
                        onClick={() => openEditModal(inst)}
                        className="p-2 rounded-xl bg-white/80 border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-300 transition-all shadow-sm"
                        title="Edit"
                      >
                        <Edit3 className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(inst)}
                        className="p-2 rounded-xl bg-white/80 border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300 transition-all shadow-sm"
                        title="Hapus"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                    </div>

                    <div className="w-20 h-20 mx-auto rounded-2xl bg-white border-[3px] border-emerald-100 shadow-md overflow-hidden mb-3 group-hover:scale-105 transition-transform">
                      {inst.avatar ? (
                        <img src={inst.avatar} alt={inst.name || ""} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-emerald-50">
                          <UserCircle2 className="h-10 w-10 text-emerald-300" />
                        </div>
                      )}
                    </div>

                    <h3 className="font-black text-slate-800 text-lg truncate">{inst.name || "—"}</h3>
                    <p className="text-xs text-slate-400 font-bold truncate">{inst.email}</p>
                    {inst.bidangKeahlian && (
                      <span className="inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
                        {inst.bidangKeahlian}
                      </span>
                    )}
                  </div>

                  {/* Card Body - Stats */}
                  <div className="p-5 grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                      <BookOpen className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                      <p className="text-lg font-black text-slate-800">{inst.kajianCount}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kajian</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                      <Star className="h-5 w-5 text-amber-400 mx-auto mb-1" />
                      <p className="text-lg font-black text-slate-800">{inst.rating || "—"}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rating</p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  {inst.pengalaman && (
                    <div className="px-5 pb-5">
                      <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100">
                        <p className="text-xs text-slate-500 font-bold line-clamp-2">
                          <span className="text-emerald-600 font-black">Pengalaman: </span>{inst.pengalaman}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <ChatbotButton />

      {/* Modal Add/Edit */}
      {showModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] border-2 border-slate-200 shadow-[0_8px_0_0_rgba(0,0,0,0.08)] w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white rounded-t-[2rem] border-b-2 border-slate-100 p-5 flex items-center justify-between z-10">
                <h2 className="text-xl font-black text-slate-800">
                  {editingInstructor ? "Edit Instruktur" : "Tambah Instruktur Baru"}
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
                      placeholder="Nama instruktur"
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
                    Password {editingInstructor ? "(kosongkan jika tidak diubah)" : "*"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder={editingInstructor ? "••••••••" : "Buat password"}
                      className="w-full pl-11 pr-12 py-3 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Bidang Keahlian */}
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Bidang Keahlian</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    <input
                      type="text"
                      value={form.bidangKeahlian}
                      onChange={(e) => setForm({ ...form, bidangKeahlian: e.target.value })}
                      placeholder="Contoh: Fiqih, Hadist, Al-Quran"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Pengalaman */}
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Pengalaman</label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-300" />
                    <textarea
                      value={form.pengalaman}
                      onChange={(e) => setForm({ ...form, pengalaman: e.target.value })}
                      placeholder="Pengalaman mengajar atau keahlian"
                      rows={2}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Bio</label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-300" />
                    <textarea
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      placeholder="Deskripsi singkat tentang instruktur"
                      rows={2}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none resize-none"
                    />
                  </div>
                </div>

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
                  {saving ? "Menyimpan..." : editingInstructor ? "Simpan Perubahan" : "Buat Instruktur"}
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
          title="Hapus Akun Instruktur?"
          message={`Anda yakin ingin menghapus akun instruktur "${deleteTarget.name || deleteTarget.email}"? Semua data terkait juga akan terhapus.`}
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
