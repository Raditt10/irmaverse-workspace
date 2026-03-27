"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import BackButton from "@/components/ui/BackButton";
import ChatbotButton from "@/components/ui/Chatbot";
import DatePicker from "@/components/ui/DatePicker";
import TimePicker from "@/components/ui/TimePicker";
import { Input } from "@/components/ui/InputText";
import { Textarea } from "@/components/ui/textarea";
import CategoryFilter from "@/components/ui/CategoryFilter";
import SearchInput from "@/components/ui/SearchInput";
import Toast from "@/components/ui/Toast"; // Menggunakan Toast baru
import {
  Upload,
  X,
  Plus,
  Calendar,
  Type,
  Users,
  Sparkles,
  Save,
  ArrowLeft,
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
  CheckSquare,
  Square,
  Layers,
  MapPin,
} from "lucide-react";
import Loading from "@/components/ui/Loading";

const CreateMaterial = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryProgramId = searchParams.get("programId") || "";
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [availablePrograms, setAvailablePrograms] = useState<
    { id: string; title: string; totalKajian?: number; usedKajianOrders?: number[]; usedKajianDetails?: { order: number; title: string; materialId: string; attendeeEmails?: string[] }[] }[]
  >([]);
  const [fetchingPrograms, setFetchingPrograms] = useState(false);
  const [availableInstructors, setAvailableInstructors] = useState<
    { id: string; name: string; avatar?: string; email: string }[]
  >([]);
  const [fetchingInstructors, setFetchingInstructors] = useState(false);
  const [isProgramDropdownOpen, setIsProgramDropdownOpen] = useState(false);
  const [isKajianDropdownOpen, setIsKajianDropdownOpen] = useState(false);
  const [isInstructorDropdownOpen, setIsInstructorDropdownOpen] = useState(false);
  const { data: session } = useSession();

  const userRole = session?.user?.role?.toLowerCase();
  const isAdmin = userRole === "admin" || userRole === "super_admin";

  // Toast State
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
    programId: queryProgramId,
    kajianOrder: "",
    materialType: "editor" as "editor" | "link",
    materialContent: "",
    materialLink: "",
    location: "",
    instructorId: "",
  });

  const [inviteInput, setInviteInput] = useState("");
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);
  const [userOptions, setUserOptions] = useState<
    { value: string; label: string; avatar?: string; email: string }[]
  >([]);
  const [searchResults, setSearchResults] = useState<
    { value: string; label: string; avatar?: string; email: string }[]
  >([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showAllUsersModal, setShowAllUsersModal] = useState(false);
  const [searchModalInput, setSearchModalInput] = useState("");

  // Helper Toast
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

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

    async function fetchInstructors() {
      if (!isAdmin) return;
      try {
        setFetchingInstructors(true);
        const res = await fetch("/api/admin/instructors");
        if (!res.ok) throw new Error("Gagal mengambil data instruktur");
        const data = await res.json();
        setAvailableInstructors(data);
      } catch (err) {
        console.error("Error fetching instructors:", err);
      } finally {
        setFetchingInstructors(false);
      }
    }

    fetchUsers();
    fetchPrograms();
    fetchInstructors();
  }, [isAdmin]);

  const fetchPrograms = async () => {
    try {
      setFetchingPrograms(true);
      const res = await fetch("/api/programs");
      if (!res.ok) {
        let errMessage = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          errMessage = errData.error || errMessage;
        } catch {
          errMessage = await res.text();
        }
        throw new Error(`Gagal mengambil data program: ${errMessage}`);
      }
      const data = await res.json();
      setAvailablePrograms(
        data.map((p: any) => ({ 
          id: p.id, 
          title: p.title, 
          totalKajian: p.totalKajian, 
          usedKajianOrders: p.usedKajianOrders,
          usedKajianDetails: p.usedKajianDetails,
        })),
      );
    } catch (err) {
      console.error("Error fetching programs:", err);
    } finally {
      setFetchingPrograms(false);
    }
  };

  const handleSearchInvite = (query: string) => {
    setInviteInput(query);
    if (query.trim()) {
      const filtered = userOptions.filter(
        (u) =>
          (u.label.toLowerCase().includes(query.toLowerCase()) ||
            u.email.toLowerCase().includes(query.toLowerCase())) &&
          !invitedUsers.includes(u.value),
      );
      setSearchResults(filtered);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

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
          showToast(error.error || "Gagal mengunggah Tumbnail", "error");
          return;
        }

        const data = await res.json();
        setFormData((prev) => ({ ...prev, thumbnailUrl: data.url }));
        showToast("Tumbnail berhasil diunggah", "success");
      } catch (error: any) {
        showToast("Terjadi kesalahan saat mengunggah Tumbnail", "error");
      } finally {
        setUploading(false);
      }
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

  const handleToggleUserSelect = (userEmail: string) => {
    setInvitedUsers(prev => 
      prev.includes(userEmail)
        ? prev.filter(e => e !== userEmail)
        : [...prev, userEmail]
    );
  };

  const isAllUsersSelected = userOptions.length > 0 && 
    userOptions.every(u => invitedUsers.includes(u.email));

  const handleSelectAllUsers = () => {
    if (isAllUsersSelected) {
      setInvitedUsers([]);
    } else {
      setInvitedUsers(userOptions.map(u => u.email));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Frontend validation
    if (!formData.title.trim()) {
      showToast("Judul kajian tidak boleh kosong", "error");
      return;
    }
    if (formData.title.trim().length < 3) {
      showToast("Judul kajian minimal 3 karakter", "error");
      return;
    }
    if (!formData.description.trim()) {
      showToast("Deskripsi kajian tidak boleh kosong", "error");
      return;
    }
    if (formData.description.trim().length < 10) {
      showToast("Deskripsi kajian minimal 10 karakter", "error");
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
    if (isAdmin && !formData.instructorId) {
      showToast("Silakan pilih instruktur kajian", "error");
      return;
    }

    if (!formData.thumbnailUrl) {
      showToast("Tumbnail kajian wajib diunggah", "error");
      return;
    }

    if (invitedUsers.length === 0) {
      showToast("Minimal 1 anggota harus diundang ke dalam kajian", "error");
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

    // Cek apakah ada anggota yang diundang tapi sudah pernah hadir di kajian ke-N ini
    const selProgram = availablePrograms.find((p) => p.id === formData.programId);
    if (selProgram && formData.kajianOrder) {
      const selectedOrder = parseInt(formData.kajianOrder);
      const existingDetail = selProgram.usedKajianDetails?.find((d) => d.order === selectedOrder);
      
      if (existingDetail && existingDetail.attendeeEmails && existingDetail.attendeeEmails.length > 0) {
        const overlappingUsers = invitedUsers.filter(email => existingDetail.attendeeEmails?.includes(email));
        if (overlappingUsers.length > 0) {
          showToast(`Ada anggota yang sudah mengikuti Kajian Ke-${selectedOrder}, mohon tinjau ulang`, "error");
          return;
        }
      }
    }

    setLoading(true);
    try {
      const payload = { ...formData, invites: invitedUsers };

      const res = await fetch("/api/materials", {
        method: "POST",
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

      const result = await res.json();

      // Save rekapan if content is provided OR it's a link material
      const finalRekapanContent = formData.materialType === "link"
        ? formData.materialLink.trim()
        : formData.materialContent.trim();
        
      if (finalRekapanContent && result.id) {
        try {
          await fetch(`/api/materials/${result.id}/rekapan`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: finalRekapanContent }),
          });
        } catch (rekapanErr) {
          console.error("Error saving rekapan:", rekapanErr);
          // Non-blocking: material is already created
        }
      }

      showToast("Kajian berhasil dibuat. Mengalihkan...", "success");

      // PERUBAHAN DI SINI: Redirect ke /materials
      setTimeout(() => router.push("/materials"), 1500);
    } catch (error: any) {
      console.error("Error creating material:", error);
      showToast(
        error.message || "Terjadi kesalahan saat membuat kajian",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

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
                  Buat Jadwal Kajianmu
                </h1>
                <p className="text-slate-500 font-medium text-sm lg:text-lg">
                  Isi detail kajian kamu dan undang peserta kajian.
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
                <div className="bg-white p-5 lg:p-8 rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] lg:shadow-[0_8px_0_0_#cbd5e1]">
                  <h2 className="text-lg lg:text-xl font-black text-slate-700 mb-4 lg:mb-6 flex items-center gap-2">
                    <Type className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-500" />{" "}
                    Informasi Dasar
                  </h2>

                  <div className="space-y-4 lg:space-y-6">
                    {/* --- INSTRUCTOR SELECTOR (Admin only) --- */}
                    {isAdmin && (
                      <div className="space-y-2">
                        <label className="text-xs lg:text-sm font-bold text-slate-600 ml-1 flex items-center gap-2">
                          <Plus className="h-4 w-4 text-emerald-500" />{" "}
                          Instruktur Kajian <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setIsInstructorDropdownOpen(!isInstructorDropdownOpen)
                            }
                            className={`
                              w-full flex items-center justify-between rounded-2xl border-2 bg-white px-5 py-3.5 
                              font-bold text-slate-700 transition-all cursor-pointer
                              ${
                                isInstructorDropdownOpen
                                  ? "border-teal-400 shadow-[0_4px_0_0_#34d399]"
                                  : "border-slate-200 shadow-[0_4px_0_0_#e2e8f0] hover:border-teal-300"
                              }
                            `}
                          >
                            <div className="flex items-center gap-3 truncate">
                              {formData.instructorId ? (
                                <>
                                  <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                                    <img 
                                      src={availableInstructors.find(i => i.id === formData.instructorId)?.avatar || "/img/icons/default-avatar.png"} 
                                      alt="avatar"
                                      className="w-full h-full object-cover"
                                      onError={(e) => (e.currentTarget.src = "/img/icons/default-avatar.png")}
                                    />
                                  </div>
                                  <span className="truncate">
                                    {availableInstructors.find(i => i.id === formData.instructorId)?.name}
                                  </span>
                                </>
                              ) : (
                                <span className="text-slate-400 italic font-medium">— Pilih Instruktur —</span>
                              )}
                            </div>
                            <ChevronDown
                              className={`h-5 w-5 text-slate-400 transition-transform ${isInstructorDropdownOpen ? "rotate-180" : ""}`}
                            />
                          </button>

                          {isInstructorDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-white border-2 border-slate-200 rounded-2xl shadow-[0_8px_0_0_#cbd5e1] overflow-hidden max-h-60 overflow-y-auto">
                              <div className="p-1.5 space-y-1">
                                {fetchingInstructors ? (
                                  <div className="px-4 py-3 text-sm text-slate-500 font-bold italic">
                                    Memuat instruktur...
                                  </div>
                                ) : availableInstructors.length === 0 ? (
                                  <div className="px-4 py-3 text-sm text-slate-500 font-bold italic">
                                    Tidak ada instruktur tersedia
                                  </div>
                                ) : (
                                  availableInstructors.map((inst) => (
                                    <button
                                      key={inst.id}
                                      type="button"
                                      onClick={() => {
                                        setFormData({
                                          ...formData,
                                          instructorId: inst.id,
                                        });
                                        setIsInstructorDropdownOpen(false);
                                      }}
                                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                        formData.instructorId === inst.id
                                          ? "bg-teal-50 text-teal-700"
                                          : "text-slate-600 hover:bg-slate-50"
                                      }`}
                                    >
                                      <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                                        <img 
                                          src={inst.avatar || "/img/icons/default-avatar.png"} 
                                          alt={inst.name}
                                          className="w-full h-full object-cover"
                                          onError={(e) => (e.currentTarget.src = "/img/icons/default-avatar.png")}
                                        />
                                      </div>
                                      <div className="flex flex-col items-start leading-tight truncate">
                                        <span className="truncate">{inst.name}</span>
                                        <span className="text-[10px] text-slate-400 font-medium truncate">{inst.email}</span>
                                      </div>
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">
                        Judul Kajian <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Contoh: Tadabbur Alam & Quran"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">
                        Deskripsi Kajian <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        name="description"
                        rows={5}
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Jelaskan apa yang akan dipelajari..."
                      />
                    </div>

                    {/* --- PROGRAM KURIKULUM SELECTOR --- */}
                    <div className="pt-6 border-t-2 border-slate-100">
                      <div className="mb-4">
                        <h3 className="text-sm font-bold text-slate-700 mb-3 ml-1 flex items-center gap-2">
                          <Library className="h-4 w-4 text-emerald-500" />{" "}
                          Kategori Program
                        </h3>
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

                          {/* Card Susulan */}
                          <div
                            onClick={() =>
                              setFormData({
                                ...formData,
                                category: "Program Susulan",
                              })
                            }
                            className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                              formData.category === "Program Susulan"
                                ? "bg-indigo-50 border-indigo-500 shadow-[0_4px_0_0_#6366f1]"
                                : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 relative top-1"
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div
                                className={`p-2 rounded-xl border ${formData.category === "Program Susulan" ? "bg-indigo-500 border-indigo-600 text-white" : "bg-slate-100 border-slate-200 text-slate-500"}`}
                              >
                                <Rocket className="h-5 w-5" />
                              </div>
                              <span
                                className={`font-black ${formData.category === "Program Susulan" ? "text-indigo-700" : "text-slate-700"}`}
                              >
                                Susulan
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-500 leading-tight">
                              Materi untuk kajian susulan.
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
                                      setFormData({
                                        ...formData,
                                        programId: "",
                                      });
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
                                              const isUsed = selectedProgram.usedKajianOrders?.includes(num);
                                              const existingDetail = selectedProgram.usedKajianDetails?.find((d: any) => d.order === num);
                                              return (
                                                <button
                                                  key={num}
                                                  type="button"
                                                  onClick={() => {
                                                    setFormData({ ...formData, kajianOrder: num.toString() });
                                                    setIsKajianDropdownOpen(false);
                                                  }}
                                                  className={`w-full text-left px-4 py-3.5 text-sm font-bold rounded-xl transition-all flex items-center justify-between border ${
                                                    formData.kajianOrder === num.toString()
                                                      ? "bg-teal-50 border-teal-200 text-teal-700 shadow-sm"
                                                      : isUsed
                                                        ? "bg-amber-50/50 border-amber-100 text-slate-600 hover:bg-amber-50 hover:border-amber-200"
                                                        : "bg-white border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-200 hover:text-teal-600"
                                                  }`}
                                                >
                                                  <div className="flex flex-col gap-0.5">
                                                    <span>Kajian Ke-{num}</span>
                                                    {isUsed && existingDetail && (
                                                      <span className="text-[10px] font-medium text-amber-500 leading-tight">
                                                        Sebelumnya: {existingDetail.title}
                                                      </span>
                                                    )}
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    {isUsed && (
                                                      <span className="text-[10px] bg-amber-100 text-amber-600 font-black px-2.5 py-1 rounded-lg border border-amber-200">
                                                        Sudah Ada
                                                      </span>
                                                    )}
                                                    {formData.kajianOrder === num.toString() && (
                                                      <div className="h-2 w-2 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                                                    )}
                                                  </div>
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

                      {/* --- REKAPAN / RINGKASAN MATERI SECTION --- */}
                      <div className="pt-6 border-t-2 border-slate-100">
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
                              rows={8}
                              value={formData.materialContent}
                              onChange={handleInputChange}
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
                                value={formData.materialLink}
                                onChange={handleInputChange}
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
                      <div className="mt-6">
                        <h3 className="text-sm font-bold text-slate-700 mb-3 ml-1 flex items-center gap-2">
                          <Target className="h-4 w-4 text-emerald-500" />{" "}
                          Tingkat Kelas / Sasaran
                        </h3>
                        <CategoryFilter
                          categories={["Semua", "Kelas 10", "Kelas 11", "Kelas 12"]}
                          subCategories={[]}
                          selectedCategory={formData.grade}
                          selectedSubCategory=""
                          onCategoryChange={(grade) =>
                            setFormData({ ...formData, grade })
                          }
                          onSubCategoryChange={() => {}}
                        />
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
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-emerald-500 group-hover:text-emerald-600 transition-colors" />
                      </div>
                      <Input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="Contoh: Masjid Irma atau Link Zoom..."
                        className="pl-12 lg:pl-12 border-2 border-slate-200 focus:border-emerald-400 focus:ring-emerald-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* --- KOLOM KANAN: MEDIA & INVITE --- */}
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
                          onClick={(e) => {
                            e.preventDefault();
                            setFormData((prev) => ({
                              ...prev,
                              thumbnailUrl: "",
                            }));
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3 lg:w-4 lg:h-4" />
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

                {/* --- INVITING SECTION --- */}
                <div className="bg-white p-5 lg:p-6 rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] lg:shadow-[0_8px_0_0_#cbd5e1]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-black text-slate-700 flex items-center gap-2">
                      <Users className="h-5 w-5 text-amber-500" /> Undang Peserta{" "}
                      <span className="text-red-400 text-sm hidden sm:inline">(wajib min. 1)</span>
                    </h2>
                    <button 
                      type="button" 
                      onClick={() => setShowAllUsersModal(true)}
                      className="text-amber-600 hover:text-amber-700 text-sm font-bold flex items-center gap-1"
                    >
                      Lihat Semua <ChevronDown className="w-4 h-4 -rotate-90" />
                    </button>
                  </div>

                  <div className="space-y-3 lg:space-y-4">
                    <div className="relative">
                      <SearchInput
                        placeholder="Cari nama atau email peserta..."
                        value={inviteInput}
                        onChange={(value) => {
                          handleSearchInvite(value);
                        }}
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

                      {showSearchResults &&
                        inviteInput &&
                        searchResults.length === 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-amber-200 rounded-2xl shadow-lg z-10 p-4 text-center">
                            <p className="text-sm text-slate-500 font-semibold">
                              Tidak ada peserta yang cocok
                            </p>
                          </div>
                        )}
                    </div>

                    {/* Invited Chips List */}
                    <div className="min-h-20 lg:min-h-25 bg-slate-50 rounded-2xl border-2 border-slate-100 p-3">
                      {invitedUsers.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 text-xs lg:text-sm font-bold py-2 lg:py-4 text-center">
                          <Users className="w-6 h-6 lg:w-8 lg:h-8 mb-1 opacity-50" />
                          Belum ada peserta
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
                                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg bg-white border-2 border-amber-200 text-amber-700 text-[10px] lg:text-xs font-bold shadow-sm animate-in zoom-in duration-200 max-w-full"
                              >
                                {user?.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.label}
                                    className="w-6 h-6 rounded-full object-cover border border-amber-300"
                                  />
                                ) : (
                                  <span className="w-6 h-6 flex items-center justify-center bg-amber-100 rounded-full text-amber-500 font-bold">
                                    👤
                                  </span>
                                )}
                                <span className="truncate max-w-30">
                                  {user?.label || userEmail}
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
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-white text-emerald-600 font-black text-lg rounded-2xl shadow-[0_4px_0_0_#d1fae5] border-2 border-emerald-100 hover:bg-emerald-50 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Sparkles className="h-6 w-6 animate-spin" />{" "}
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="h-6 w-6" />
                        Terbitkan Kajian
                      </>
                    )}
                  </button>
                  <p className="text-xs text-emerald-100 font-bold mt-4 text-center opacity-80">
                    Pastikan semua data sudah benar sebelum menerbitkan.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      <ChatbotButton />

      <ChatbotButton />

      {/* Modal Lihat Semua User */}
      {showAllUsersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] md:max-h-[80vh] border-2 border-slate-200 overflow-hidden animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <h2 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" /> Pilih Peserta
              </h2>
              <button
                type="button"
                onClick={() => setShowAllUsersModal(false)}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6 space-y-4 relative">
              <div className="sticky top-0 z-10 bg-slate-50 pb-2">
                <SearchInput
                  placeholder="Cari user (nama / email)..."
                  value={searchModalInput}
                  onChange={setSearchModalInput}
                  className="w-full bg-white"
                />
              </div>

              <div className="flex items-center justify-between pt-2 pb-1">
                <p className="text-xs font-bold text-slate-500">
                  Terpilih: <span className="text-amber-600">{invitedUsers.length}</span> dari {userOptions.length}
                </p>
                <button
                  type="button"
                  onClick={handleSelectAllUsers}
                  className="flex items-center gap-1.5 text-xs font-black text-amber-600 hover:text-amber-700 transition-colors"
                >
                  {isAllUsersSelected ? (
                    <><CheckSquare className="w-4 h-4" /> Batal Pilih Semua</>
                  ) : (
                    <><Square className="w-4 h-4" /> Pilih Semua</>
                  )}
                </button>
              </div>

              <div className="space-y-2">
                {userOptions
                  .filter(u => 
                     u.label.toLowerCase().includes(searchModalInput.toLowerCase()) || 
                     u.email.toLowerCase().includes(searchModalInput.toLowerCase())
                  )
                  .map((user) => {
                    const isSelected = invitedUsers.includes(user.email);
                    return (
                      <div 
                        key={user.email}
                        onClick={() => handleToggleUserSelect(user.email)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                          isSelected 
                            ? "bg-amber-50 border-amber-300 shadow-[0_2px_0_0_#fcd34d]" 
                            : "bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm"
                        }`}
                      >
                         <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${isSelected ? "bg-amber-500 border-amber-600" : "bg-white border-slate-300"}`}>
                           {isSelected && <CheckSquare className="w-4 h-4 text-white" />}
                         </div>
                         
                         {user.avatar ? (
                            <img src={user.avatar} alt={user.label} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                         ) : (
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-xs uppercase">
                              {user.label.charAt(0)}
                            </div>
                         )}
                         
                         <div className="flex-1 min-w-0">
                           <p className={`font-bold text-sm truncate ${isSelected ? "text-amber-900" : "text-slate-700"}`}>{user.label}</p>
                           <p className="text-xs text-slate-400 truncate">{user.email}</p>
                         </div>
                      </div>
                    );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 md:p-6 border-t border-slate-100 bg-white shrink-0">
               <button 
                 type="button" 
                 onClick={() => setShowAllUsersModal(false)}
                 className="w-full py-3 md:py-4 bg-amber-500 text-white font-black rounded-2xl border-b-4 border-amber-600 hover:bg-amber-400 active:border-b-0 active:translate-y-1 transition-all"
               >
                 Selesai ({invitedUsers.length} Peserta)
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
};

export default function CreateMaterialPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
          <Loading text="Memuat..." size="lg" />
        </div>
      }
    >
      <CreateMaterial />
    </Suspense>
  );
}
