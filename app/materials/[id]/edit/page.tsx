"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import DatePicker from "@/components/ui/DatePicker";
import TimePicker from "@/components/ui/TimePicker";
import CategoryFilter from "@/components/ui/CategoryFilter";
import SearchInput from "@/components/ui/SearchInput";
import Toast from "@/components/ui/Toast";
import Loading from "@/components/ui/Loading";
import {
  Upload,
  X,
  Plus,
  Calendar,
  Type,
  Sparkles,
  Save,
  ArrowLeft,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  BookMarked,
  ChevronRight,
  BookOpen,
  Rocket,
  Library,
  GraduationCap,
  Target,
  ChevronDown,
  FileEdit,
  Globe,
  Link,
  FileText,
  Layers,
} from "lucide-react";
import { Input } from "@/components/ui/InputText";
import { Textarea } from "@/components/ui/textarea";

const EditMaterial = () => {
  const router = useRouter();
  const params = useParams();
  const materialId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    category: "Program Wajib",
    grade: "Semua",
    thumbnailUrl: "",
    programId: "",
    kajianOrder: "",
    materialType: "editor" as "editor" | "link",
    materialContent: "",
    materialLink: "",
    location: "",
  });

  const [availablePrograms, setAvailablePrograms] = useState<
    { id: string; title: string; totalKajian?: number; usedKajianOrders?: number[] }[]
  >([]);
  const [fetchingPrograms, setFetchingPrograms] = useState(false);
  const [isProgramDropdownOpen, setIsProgramDropdownOpen] = useState(false);
  const [isKajianDropdownOpen, setIsKajianDropdownOpen] = useState(false);

  // --- Invite State ---
  const [inviteInput, setInviteInput] = useState("");
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]); // New invites (emails)
  const [existingInvites, setExistingInvites] = useState<
    {
      email: string;
      name: string | null;
      avatar: string | null;
      status: string;
    }[]
  >([]); // Already invited users with status
  const [userOptions, setUserOptions] = useState<
    { value: string; label: string; avatar?: string; email: string }[]
  >([]);
  const [searchResults, setSearchResults] = useState<
    { value: string; label: string; avatar?: string; email: string }[]
  >([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  // Fetch Users List (untuk pencarian)
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error("Gagal mengambil data user");
        const data = await res.json();
        const formattedUsers = data.map((u: any) => ({
          value: u.email,
          label: u.name || u.email,
          avatar: u.avatar,
          email: u.email,
        }));
        setUserOptions(formattedUsers);
      } catch (err) {
        console.error(err);
      }
    }
    fetchUsers();
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setFetchingPrograms(true);
      const res = await fetch("/api/programs");
      if (!res.ok) throw new Error("Gagal mengambil data program");
      const data = await res.json();
      setAvailablePrograms(
        data.map((p: any) => ({
          id: p.id,
          title: p.title,
          totalKajian: p.totalKajian,
          usedKajianOrders: p.usedKajianOrders,
        })),
      );
    } catch (err) {
      console.error("Error fetching programs:", err);
    } finally {
      setFetchingPrograms(false);
    }
  };

  // Fetch Existing Material Data
  useEffect(() => {
    async function fetchMaterial() {
      try {
        const res = await fetch(`/api/materials/${materialId}`);
        if (!res.ok) throw new Error("Gagal mengambil data kajian");
        const data = await res.json();

        // API may return either a single object or an array (older endpoints).
        const material = Array.isArray(data) ? data[0] : data;

        if (material) {
          // Normalize date to YYYY-MM-DD for the DatePicker
          let normalizedDate = "";
          if (material.date) {
            try {
              normalizedDate = String(material.date).slice(0, 10);
            } catch (e) {
              normalizedDate = material.date || "";
            }
          }

          setFormData({
            title: material.title || "",
            description: material.description || "",
            date: normalizedDate,
            time: material.startedAt || material.time || "",
            category: material.category || "Program Wajib",
            grade: material.grade || "Semua",
            thumbnailUrl: material.thumbnailUrl || "",
            programId: material.programId || material.parentId || "",
            kajianOrder: material.kajianOrder?.toString() || "",
            materialType: material.materialType || "editor",
            materialContent: (material.content || "").replace(/<[^>]*>/g, ""),
            materialLink: material.link || "",
            location: material.location || "",
          });

          // Load existing invite details with status
          if (material.inviteDetails && Array.isArray(material.inviteDetails)) {
            setExistingInvites(
              material.inviteDetails.map((inv: any) => ({
                email: inv.email || "",
                name: inv.name || null,
                avatar: inv.avatar || null,
                status: inv.status || "pending",
              })),
            );
          }
          // New invites start empty (only newly added users)
          setInvitedUsers([]);
        }
      } catch (err: any) {
        console.error(err);
        showToast(err.message || "Tidak bisa memuat data kajian", "error");
      } finally {
        setLoading(false);
      }
    }

    if (materialId) {
      fetchMaterial();
    }
  }, [materialId]);

  // --- Handlers ---
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const error = await res.json();
          showToast(error.message || "Gagal mengunggah gambar", "error");
          return;
        }

        const data = await res.json();
        setFormData((prev) => ({ ...prev, thumbnailUrl: data.url }));
        showToast("Gambar berhasil diunggah", "success");
      } catch (error) {
        showToast("Gagal mengunggah gambar", "error");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSearchInvite = (query: string) => {
    setInviteInput(query);
    if (query.trim()) {
      const existingEmails = existingInvites.map((inv) => inv.email);
      const filtered = userOptions.filter(
        (u) =>
          (u.label.toLowerCase().includes(query.toLowerCase()) ||
            u.email.toLowerCase().includes(query.toLowerCase())) &&
          !invitedUsers.includes(u.value) &&
          !existingEmails.includes(u.value),
      );
      setSearchResults(filtered);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleAddInvite = (userEmail: string) => {
    if (!invitedUsers.includes(userEmail)) {
      setInvitedUsers([...invitedUsers, userEmail]);
    }
    setInviteInput("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleRemoveInvite = (index: number) => {
    setInvitedUsers(invitedUsers.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showToast("Judul kajian tidak boleh kosong", "error");
      return;
    }
    if (!formData.description.trim()) {
      showToast("Deskripsi kajian tidak boleh kosong", "error");
      return;
    }
    if (!formData.date) {
      showToast("Tanggal kajian harus dipilih", "error");
      return;
    }
    if (!formData.time) {
      showToast("Jam kajian harus dipilih", "error");
      return;
    }
    if (!formData.location.trim()) {
      showToast("Lokasi / Platform kajian tidak boleh kosong", "error");
      return;
    }

    if (formData.materialType === "link" && !formData.materialLink.trim()) {
      showToast("Link Google Drive tidak boleh kosong", "error");
      return;
    }

    if (
      formData.materialType === "editor" &&
      !formData.materialContent.trim()
    ) {
      showToast("Materi kajian tidak boleh kosong", "error");
      return;
    }

    setSubmitting(true);
    try {
      // Only send newly added invites, existing invites are already tracked server-side
      const payload = {
        ...formData,
        invites: invitedUsers,
      };

      const res = await fetch(`/api/materials/${materialId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMessage = `HTTP Error: ${res.status}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
      }

      showToast("Kajian berhasil diperbarui. Mengalihkan...", "success");
      setTimeout(() => router.push(`/materials/${materialId}`), 1500);
    } catch (error: any) {
      console.error("Error updating material:", error);
      showToast(
        error.message || "Terjadi kesalahan saat memperbarui kajian",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loading text="Memuat data kajian..." size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex flex-col lg:flex-row">
        <Sidebar />
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-12 w-full max-w-[100vw] overflow-hidden">
          <div className="max-w-5xl mx-auto">
            {/* Header & Back Button */}
            <div className="flex flex-col gap-4 lg:gap-6 mb-6 lg:mb-8">
              <button
                onClick={() => router.back()}
                className="self-start inline-flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-2 rounded-xl bg-white border-2 border-slate-200 text-slate-500 font-bold hover:border-teal-400 hover:text-teal-600 hover:shadow-[0_4px_0_0_#cbd5e1] active:translate-y-0.5 active:shadow-none transition-all text-sm lg:text-base"
              >
                <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5" strokeWidth={3} />
                Kembali
              </button>
              <div>
                <h1 className="text-2xl lg:text-4xl font-black text-slate-800 tracking-tight mb-2 flex items-center gap-2 lg:gap-3">
                  Edit Jadwal Kajianmu
                </h1>
                <p className="text-slate-500 font-medium text-sm lg:text-lg">
                  Update detail kajian yang sudah dibuat.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold bg-rose-50 text-rose-600 px-3 py-2 rounded-xl border-2 border-rose-100">
                  <span className="text-rose-500 font-black text-lg leading-none mt-1">*</span> Wajib diisi
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8"
            >
              {/* --- KOLOM KIRI: FORM UTAMA --- */}
              <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                {/* Card 1: Informasi Dasar */}
                <div className="bg-white p-5 lg:p-8 rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] lg:shadow-[0_8px_0_0_#cbd5e1]">
                  <h2 className="text-lg lg:text-xl font-black text-slate-700 mb-4 lg:mb-6 flex items-center gap-2">
                    <Type className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-500" />{" "}
                    Informasi Dasar
                  </h2>

                  <div className="space-y-4 lg:space-y-6">
                    <div className="space-y-2">
                      <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">
                        Judul Kajian <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        name="title"
                        required
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Contoh: Tadabbur Alam & Quran"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">
                        Deskripsi Singkat <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        name="description"
                        required
                        rows={3}
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Jelaskan apa yang akan dipelajari..."
                      />
                    </div>

                    {/* --- CATEGORY SELECTOR (PREMIUM CARDS) --- */}
                    <div className="space-y-3 pt-4 border-t-2 border-slate-100">
                      <label className="block text-xs lg:text-sm font-bold text-slate-600 mb-2 ml-1">
                        Kategori Program
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Card Wajib */}
                        <div
                          onClick={() =>
                            setFormData({
                              ...formData,
                              category: "Program Wajib",
                            })
                          }
                          className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                            formData.category === "Program Wajib"
                              ? "bg-teal-50 border-teal-500 shadow-[0_4px_0_0_#14b8a6]"
                              : "bg-white border-slate-200 hover:border-teal-300 hover:bg-slate-50 relative top-1"
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className={`p-2 rounded-xl border ${formData.category === "Program Wajib" ? "bg-teal-500 border-teal-600 text-white" : "bg-slate-100 border-slate-200 text-slate-500"}`}
                            >
                              <BookOpen className="h-5 w-5" />
                            </div>
                            <span
                              className={`font-black ${formData.category === "Program Wajib" ? "text-teal-700" : "text-slate-700"}`}
                            >
                              Program Wajib
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-500 leading-tight">
                            Kurikulum inti kajian.
                          </p>
                        </div>

                        {/* Card Ekstra */}
                        <div
                          onClick={() =>
                            setFormData({
                              ...formData,
                              category: "Program Ekstra",
                            })
                          }
                          className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                            formData.category === "Program Ekstra"
                              ? "bg-amber-50 border-amber-500 shadow-[0_4px_0_0_#f59e0b]"
                              : "bg-white border-slate-200 hover:border-amber-300 hover:bg-slate-50 relative top-1"
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className={`p-2 rounded-xl border ${formData.category === "Program Ekstra" ? "bg-amber-500 border-amber-600 text-white" : "bg-slate-100 border-slate-200 text-slate-500"}`}
                            >
                              <Sparkles className="h-5 w-5" />
                            </div>
                            <span
                              className={`font-black ${formData.category === "Program Ekstra" ? "text-amber-700" : "text-slate-700"}`}
                            >
                              Program Ekstra
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-500 leading-tight">
                            Pengembangan minat.
                          </p>
                        </div>

                        {/* Card Next Level */}
                        <div
                          onClick={() =>
                            setFormData({
                              ...formData,
                              category: "Program Next Level",
                            })
                          }
                          className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                            formData.category === "Program Next Level"
                              ? "bg-indigo-50 border-indigo-500 shadow-[0_4px_0_0_#6366f1]"
                              : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 relative top-1"
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className={`p-2 rounded-xl border ${formData.category === "Program Next Level" ? "bg-indigo-500 border-indigo-600 text-white" : "bg-slate-100 border-slate-200 text-slate-500"}`}
                            >
                              <Rocket className="h-5 w-5" />
                            </div>
                            <span
                              className={`font-black ${formData.category === "Program Next Level" ? "text-indigo-700" : "text-slate-700"}`}
                            >
                              Next Level
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-500 leading-tight">
                            Materi tingkat lanjut.
                          </p>
                        </div>
                      </div>

                      {/* --- PROGRAM (KURSUS) DROPDOWN --- */}
                      <div className="mt-4">
                        <label className="block text-xs lg:text-sm font-bold text-slate-600 mb-2 ml-1 flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-emerald-500" />{" "}
                          Program Kurikulum
                          <span className="text-[11px] text-slate-400 font-medium ml-1">
                            (Opsional)
                          </span>
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setIsProgramDropdownOpen(!isProgramDropdownOpen)
                            }
                            className={`
                              w-full flex items-center justify-between rounded-2xl border-2 bg-white px-5 py-3.5 
                              font-bold text-slate-700 transition-all cursor-pointer
                              ${
                                isProgramDropdownOpen
                                  ? "border-teal-400 shadow-[0_4px_0_0_#34d399]"
                                  : "border-slate-200 shadow-[0_4px_0_0_#e2e8f0] hover:border-teal-300"
                              }
                            `}
                          >
                            <span className="truncate">
                              {availablePrograms.find(
                                (p) => p.id === formData.programId,
                              )?.title || "--- Tidak terkait program ---"}
                            </span>
                            <ChevronDown
                              className={`h-5 w-5 text-slate-400 transition-transform ${isProgramDropdownOpen ? "rotate-180" : ""}`}
                            />
                          </button>

                          {isProgramDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-white border-2 border-slate-200 rounded-2xl shadow-[0_8px_0_0_#cbd5e1] overflow-hidden max-h-60 overflow-y-auto">
                              <div className="p-1.5 space-y-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, programId: "" });
                                    setIsProgramDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                    !formData.programId
                                      ? "bg-slate-50 text-slate-700"
                                      : "text-slate-400 hover:bg-slate-50"
                                  }`}
                                >
                                  — Tanpa Program —
                                </button>
                                {fetchingPrograms ? (
                                  <div className="px-4 py-3 text-sm text-slate-500 font-bold italic">
                                    Memuat program...
                                  </div>
                                ) : availablePrograms.length === 0 ? (
                                  <div className="px-4 py-3 text-sm text-slate-500 font-bold italic">
                                    Tidak ada program tersedia
                                  </div>
                                ) : (
                                  availablePrograms.map((program) => (
                                    <button
                                      key={program.id}
                                      type="button"
                                      onClick={() => {
                                        setFormData({
                                          ...formData,
                                          programId: program.id,
                                        });
                                        setIsProgramDropdownOpen(false);
                                      }}
                                      className={`
                                        w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all
                                        ${
                                          formData.programId === program.id
                                            ? "bg-teal-50 text-teal-600"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        }
                                      `}
                                    >
                                      {program.title}
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 ml-1 italic">
                          * Pilih program jika materi ini adalah bagian dari
                          sebuah program kurikulum.
                        </p>

                        {/* KAJIAN KE- Berapa (Muncul jika ada program yang dipilih) */}
                        {availablePrograms.find((p) => p.id === formData.programId) && (
                          <div className="mt-4 pt-4 border-t-2 border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-xs lg:text-sm font-bold text-slate-600 mb-2 ml-1 flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-emerald-500" /> Kajian Ke-
                              <span className="text-red-500 ml-1 font-bold">*</span>
                            </label>
                            <div className="relative">
                              {/* Trigger Button */}
                              <button
                                type="button"
                                onClick={() => setIsKajianDropdownOpen(!isKajianDropdownOpen)}
                                className={`w-full flex items-center justify-between rounded-2xl border-2 bg-white px-5 py-3.5 font-bold transition-all shadow-[0_4px_0_0_#e2e8f0] hover:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-100 ${
                                  isKajianDropdownOpen ? "border-teal-400" : "border-slate-200"
                                } ${formData.kajianOrder ? "text-slate-700" : "text-slate-400"}`}
                              >
                                <span>
                                  {formData.kajianOrder 
                                    ? `Kajian Ke-${formData.kajianOrder}` 
                                    : "-- Pilih Urutan Kajian --"}
                                </span>
                                <ChevronDown 
                                  className={`h-5 w-5 text-slate-400 transition-transform ${isKajianDropdownOpen ? "rotate-180 text-teal-500" : ""}`} 
                                />
                              </button>

                              {/* Dropdown Menu */}
                              {isKajianDropdownOpen && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={() => setIsKajianDropdownOpen(false)} 
                                  />
                                  <div className="absolute z-50 w-full mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 p-1.5">
                                    {(() => {
                                      const selectedProgram = availablePrograms.find((p) => p.id === formData.programId);
                                      if (!selectedProgram || !selectedProgram.totalKajian) return (
                                        <div className="p-4 text-center text-sm font-bold text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                          Data program tidak ditemukan
                                        </div>
                                      );
                                      
                                      return (
                                        <div className="max-h-60 overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                          {Array.from({ length: selectedProgram.totalKajian }, (_, i) => i + 1).map((num) => {
                                            // Izinkan nomor yang sudah dipilih oleh materi INI SENDIRI, disable nomor lain yang terpakai
                                            const isUsedByOther = selectedProgram.usedKajianOrders?.includes(num) && num.toString() !== formData.kajianOrder;
                                            return (
                                              <button
                                                key={num}
                                                type="button"
                                                disabled={isUsedByOther}
                                                onClick={() => {
                                                  setFormData({ ...formData, kajianOrder: num.toString() });
                                                  setIsKajianDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-3.5 text-sm font-bold rounded-xl transition-all flex items-center justify-between border ${
                                                  isUsedByOther 
                                                    ? "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed" 
                                                    : formData.kajianOrder === num.toString()
                                                      ? "bg-teal-50 border-teal-200 text-teal-700 shadow-sm"
                                                      : "bg-white border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-200 hover:text-teal-600"
                                                }`}
                                              >
                                                <span>Kajian Ke-{num}</span>
                                                {isUsedByOther && (
                                                  <span className="text-[10px] bg-slate-200/50 text-slate-500 font-black px-2.5 py-1 rounded-lg border border-slate-200">
                                                    Sudah Terisi
                                                  </span>
                                                )}
                                                {formData.kajianOrder === num.toString() && !isUsedByOther && (
                                                  <div className="h-2 w-2 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                                                )}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                      <div className="pt-6 border-t-2 border-slate-100 mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-emerald-500" />{" "}
                            Rekapan Materi
                          <span className="text-[11px] text-slate-400 font-medium ml-1">
                            (Disarankan)
                          </span>
                          </h3>

                          {/* Toggle Switch */}
                          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  materialType: "editor",
                                }))
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                                formData.materialType === "editor"
                                  ? "bg-white text-emerald-600 shadow-sm border border-slate-100"
                                  : "text-slate-400 hover:text-slate-600"
                              }`}
                            >
                              <FileEdit className="h-3.5 w-3.5" />
                              Teks
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  materialType: "link",
                                }))
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                                formData.materialType === "link"
                                  ? "bg-white text-indigo-600 shadow-sm border border-slate-100"
                                  : "text-slate-400 hover:text-slate-600"
                              }`}
                            >
                              <Link className="h-3.5 w-3.5" />
                              Drive Link
                            </button>
                          </div>
                        </div>

                        {formData.materialType === "editor" ? (
                          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                            <Textarea
                              name="materialContent"
                              required={formData.materialType === "editor"}
                              rows={8}
                              value={formData.materialContent}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  materialContent: e.target.value,
                                })
                              }
                              placeholder="Tulis ringkasan materi kajian di sini. Rekapan ini akan bisa dibaca oleh peserta kapan saja sebagai bahan belajar mandiri..."
                              className="text-sm border-2 focus:ring-emerald-200"
                            />
                            <p className="text-[10px] font-bold text-slate-400 mt-2 ml-1 italic">
                              * Rekapan berisi ringkasan kajian agar peserta bisa membaca ulang kapan pun.
                            </p>
                          </div>
                        ) : (
                          <div className="animate-in fade-in slide-in-from-top-1 duration-200 space-y-3">
                            <div className="relative group">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Globe className="h-5 w-5 text-emerald-500" />
                              </div>
                              <Input
                                type="url"
                                name="materialLink"
                                required={formData.materialType === "link"}
                                value={formData.materialLink}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    materialLink: e.target.value,
                                  })
                                }
                                placeholder="https://drive.google.com/file/d/..."
                                className="pl-12 lg:pl-12 border-2 border-teal-100 focus:border-teal-400 focus:ring-teal-100"
                              />
                            </div>
                            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100 flex gap-3">
                              <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shrink-0 border border-teal-200">
                                <Link className="h-5 w-5 text-emerald-500" />
                              </div>
                              <div>
                                <p className="text-xs font-black text-teal-900 mb-0.5">
                                  Sertakan Link Materi
                                </p>
                                <p className="text-[10px] font-bold text-teal-700/80 leading-relaxed">
                                  Pastikan akses file Google Drive Anda sudah
                                  diatur ke "Siapa saja yang memiliki link" agar
                                  peserta dapat membacanya.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                    {/* Tingkat / Kelas selector */}
                    <div className="mt-6 border-t-2 border-slate-100 pt-6">
                      <h3 className="text-sm font-bold text-slate-700 mb-3 ml-1 flex items-center gap-2">
                        <Target className="h-4 w-4 text-emerald-500" /> Tingkat
                        Kelas / Sasaran
                      </h3>
                      <div className="flex flex-wrap gap-2 lg:gap-3">
                        {["Semua", "Kelas 10", "Kelas 11", "Kelas 12"].map(
                          (grade) => (
                            <button
                              key={grade}
                              type="button"
                              onClick={() =>
                                setFormData({ ...formData, grade })
                              }
                              className={`px-4 py-2 rounded-full font-bold transition-all border-2 text-sm ${
                                formData.grade === grade
                                  ? "bg-teal-500 text-white border-teal-600 shadow-[0_4px_0_0_#0d9488]"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:bg-slate-50 hover:-translate-y-px shadow-sm"
                              }`}
                            >
                              {grade}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Waktu & Tempat */}
                <div className="bg-white p-5 lg:p-8 rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] lg:shadow-[0_8px_0_0_#cbd5e1]">
                  <h2 className="text-lg lg:text-xl font-black text-slate-700 mb-4 lg:mb-6 flex items-center gap-2">
                    <Calendar className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-500" />{" "}
                    Teknis Pelaksanaan
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-4 lg:mb-6">
                    <DatePicker
                      label="Tanggal Pelaksanaan *"
                      value={formData.date}
                      onChange={(date) => setFormData({ ...formData, date })}
                      placeholder="Pilih tanggal"
                    />
                    <TimePicker
                      label="Jam Mulai *"
                      value={formData.time}
                      onChange={(time) => setFormData({ ...formData, time })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">
                      Lokasi / Platform <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Contoh: Masjid Irma atau Link Zoom..."
                      required
                    />
                  </div>
                </div>
              </div>

              {/* --- KOLOM KANAN: MEDIA & UNDANG PESERTA --- */}
              <div className="space-y-6 lg:space-y-8">
                {/* Upload Thumbnail */}
                <div className="bg-white p-5 lg:p-6 rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] lg:shadow-[0_8px_0_0_#cbd5e1] text-center">
                  <label className="block text-xs lg:text-sm font-bold text-slate-600 mb-3 lg:mb-4">
                    Thumbnail Kajian
                  </label>
                  <div className="relative group cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="upload-thumb"
                    />
                    {formData.thumbnailUrl ? (
                      <div className="relative w-full h-40 lg:h-48 rounded-2xl lg:rounded-3xl overflow-hidden border-2 border-slate-200 group-hover:border-teal-400 transition-all">
                        <img
                          src={formData.thumbnailUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, thumbnailUrl: "" })
                          }
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="upload-thumb"
                        className="flex flex-col items-center justify-center w-full h-40 lg:h-48 rounded-2xl lg:rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-teal-50 hover:border-teal-400 transition-all cursor-pointer"
                      >
                        {uploading ? (
                          <Sparkles className="w-6 h-6 lg:w-8 lg:h-8 text-teal-400 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6 lg:w-8 lg:h-8 text-slate-400 mb-2 group-hover:text-teal-500" />
                            <span className="text-xs lg:text-sm font-bold text-slate-400">
                              Klik untuk Upload
                            </span>
                          </>
                        )}
                      </label>
                    )}
                  </div>
                </div>

                {/* --- INVITING SECTION (BARU) --- */}
                <div className="bg-white p-5 lg:p-6 rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] lg:shadow-[0_8px_0_0_#cbd5e1]">
                  <h2 className="text-lg font-black text-slate-700 mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-amber-500" /> Kelola Peserta
                  </h2>

                  <div className="space-y-3 lg:space-y-4">
                    {/* Existing Invites with Status */}
                    {existingInvites.length > 0 && (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                          Peserta yang Sudah Diundang
                        </label>
                        <div className="bg-slate-50 rounded-2xl border-2 border-slate-100 p-3 space-y-2 max-h-48 overflow-y-auto">
                          {existingInvites.map((inv, idx) => {
                            const statusConfig: Record<
                              string,
                              {
                                label: string;
                                color: string;
                                icon: React.ReactNode;
                              }
                            > = {
                              pending: {
                                label: "Menunggu",
                                color:
                                  "bg-amber-100 text-amber-700 border-amber-200",
                                icon: <Clock className="w-3.5 h-3.5" />,
                              },
                              accepted: {
                                label: "Diterima",
                                color:
                                  "bg-emerald-100 text-emerald-700 border-emerald-200",
                                icon: <CheckCircle className="w-3.5 h-3.5" />,
                              },
                              rejected: {
                                label: "Ditolak",
                                color: "bg-red-100 text-red-700 border-red-200",
                                icon: <XCircle className="w-3.5 h-3.5" />,
                              },
                            };
                            const cfg =
                              statusConfig[inv.status] || statusConfig.pending;
                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200"
                              >
                                <div className="flex items-center gap-2">
                                  {inv.avatar ? (
                                    <img
                                      src={inv.avatar}
                                      alt={inv.name || inv.email}
                                      className="w-7 h-7 rounded-full object-cover border border-slate-200"
                                    />
                                  ) : (
                                    <span className="w-7 h-7 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 text-xs font-bold">
                                      {(inv.name || inv.email)
                                        .charAt(0)
                                        .toUpperCase()}
                                    </span>
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-700 truncate">
                                      {inv.name || inv.email}
                                    </p>
                                    {inv.name && (
                                      <p className="text-[10px] text-slate-400 truncate">
                                        {inv.email}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${cfg.color}`}
                                >
                                  {cfg.icon} {cfg.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Search for new invites */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                        Undang Peserta Baru
                      </label>
                      <div className="relative">
                        <SearchInput
                          placeholder="Cari nama atau email peserta..."
                          value={inviteInput}
                          onChange={(value) => handleSearchInvite(value)}
                          className="w-full"
                        />

                        {/* Search Results Dropdown */}
                        {showSearchResults && searchResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-amber-200 rounded-2xl shadow-lg z-10 max-h-64 overflow-y-auto">
                            {searchResults.map((user) => (
                              <button
                                key={user.value}
                                type="button"
                                onClick={() => handleAddInvite(user.value)}
                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-amber-50 border-b border-amber-100 last:border-b-0 transition-colors text-left"
                              >
                                {user.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.label}
                                    className="h-8 w-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold text-amber-700">
                                    {user.label.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="flex-1 text-left">
                                  <p className="font-bold text-slate-700 text-sm">
                                    {user.label}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {user.email}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* New Invited Chips List */}
                    <div className="min-h-16 bg-slate-50 rounded-2xl border-2 border-slate-100 p-3">
                      {invitedUsers.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 text-xs font-bold py-2 text-center">
                          <Users className="w-6 h-6 mb-1 opacity-50" />
                          Cari dan tambah peserta baru di atas
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {invitedUsers.map((userEmail, idx) => {
                            const user = userOptions.find(
                              (u) => u.value === userEmail,
                            );
                            return (
                              <div
                                key={idx}
                                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg bg-white border-2 border-teal-200 text-teal-700 text-[10px] lg:text-xs font-bold shadow-sm animate-in zoom-in duration-200 max-w-full"
                              >
                                {user?.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.label}
                                    className="w-6 h-6 rounded-full object-cover border border-teal-300"
                                  />
                                ) : (
                                  <span className="w-6 h-6 flex items-center justify-center bg-teal-100 rounded-full text-teal-500 font-bold">
                                    👤
                                  </span>
                                )}
                                <span className="truncate max-w-30">
                                  {user?.label || userEmail}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-teal-50 text-teal-600 border border-teal-200">
                                  Baru
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveInvite(idx)}
                                  className="p-0.5 hover:bg-red-100 hover:text-red-500 rounded-md transition-colors shrink-0"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Card */}
                <div className="bg-emerald-500 p-6 rounded-[2.5rem] text-white border-2 border-emerald-600 shadow-[0_6px_0_0_#059669] mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <GraduationCap
                      className="h-8 w-8 text-emerald-100"
                      strokeWidth={2.5}
                    />
                    <h3 className="text-xl font-black">Siap Terbit?</h3>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-white text-emerald-600 font-black text-lg rounded-2xl shadow-[0_4px_0_0_#d1fae5] border-2 border-emerald-100 hover:bg-emerald-50 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Sparkles className="h-6 w-6 animate-spin" />{" "}
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="h-6 w-6" />
                        Simpan Perubahan
                      </>
                    )}
                  </button>
                  <p className="text-xs text-emerald-100 font-bold mt-4 text-center opacity-80">
                    Pastikan semua data sudah benar sebelum menyimpan perubahan.
                  </p>
                </div>
              </div>
            </form>
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
    </div>
  );
};

export default EditMaterial;
