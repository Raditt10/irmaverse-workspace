"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import Loading from "@/components/ui/Loading";
import DatePicker from "@/components/ui/DatePicker";
import TimePicker from "@/components/ui/TimePicker";
import { Input } from "@/components/ui/InputText";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, Clock, ArrowLeft, Upload, X, Save, Sparkles, Type, Users, Headset, Phone, Mail } from "lucide-react";
import Toast from "@/components/ui/Toast";
import CategoryFilter from "@/components/ui/CategoryFilter";

const statusMapping = {
  "Segera hadir": "segera_hadir",
  "Sedang berlangsung": "ongoing",
  "Kegiatan telah selesai": "completed",
};

const reverseStatusMapping = {
  segera_hadir: "Segera hadir",
  ongoing: "Sedang berlangsung",
  completed: "Kegiatan telah selesai",
};

const EditSchedule = () => {
  const router = useRouter();
  const params = useParams();
  const scheduleId = params.id as string;
  const { data: session, status } = useSession();
  
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
    fullDescription: "",
    date: "",
    time: "",
    location: "",
    pemateri: "", 
    thumbnailUrl: "",
    contactNumber: "",
    contactEmail: "",
    status: "segera_hadir",
  });

  // Helper Toast
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  // Fetch existing schedule data
  useEffect(() => {
    if (scheduleId && status === "authenticated") {
      fetchScheduleData();
    }
  }, [scheduleId, status]);

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/schedules/${scheduleId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch schedule");
      }

      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (!data) {
        throw new Error("Data event tidak ditemukan");
      }

      if (
        status === "authenticated" &&
        session?.user?.id !== data.instructorId &&
        session?.user?.role !== "admin" &&
        session?.user?.role !== "super_admin"
      ) {
        showToast("Anda tidak memiliki akses untuk mengedit event ini", "error");
        setTimeout(() => router.push("/schedule"), 2000);
        return;
      }

      const dateObj = new Date(data.date);
      const formattedDate = dateObj.toISOString().split("T")[0];

      setFormData({
        title: data.title || "",
        description: data.description || "",
        fullDescription: data.fullDescription || "",
        date: formattedDate,
        time: data.time || "",
        location: data.location || "",
        pemateri: data.pemateri || "",
        thumbnailUrl: data.thumbnailUrl || "",
        contactNumber: data.contactNumber || "",
        contactEmail: data.contactEmail || "",
        status: data.status || "segera_hadir",
      });
    } catch (error: any) {
      console.error("Error fetching schedule:", error);
      showToast("Gagal memuat data event", "error");
    } finally {
      setLoading(false);
    }
  };

  // Redirect jika bukan instruktur, admin, atau super_admin
  const role = session?.user?.role;
  const isPrivileged = role === "instruktur" || role === "admin" || role === "super_admin";

  if (
    status === "authenticated" &&
    !isPrivileged
  ) {
    router.push("/schedule");
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const uploadData = new FormData();
        uploadData.append("file", file);
        
        const res = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- VALIDASI KUAT ---
    if (!formData.title.trim()) { showToast("Judul event tidak boleh kosong", "error"); return; }
    if (formData.title.length < 5) { showToast("Judul event minimal 5 karakter", "error"); return; }
    if (!formData.description.trim()) { showToast("Deskripsi singkat tidak boleh kosong", "error"); return; }
    if (!formData.date) { showToast("Tanggal event harus dipilih", "error"); return; }
    if (!formData.time) { showToast("Jam event harus dipilih", "error"); return; }
    if (!formData.location.trim()) { showToast("Lokasi event tidak boleh kosong", "error"); return; }
    if (!formData.pemateri.trim()) { showToast("Narahubung tidak boleh kosong", "error"); return; }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorMessage = `HTTP Error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
      }

      showToast("Event berhasil diperbarui. Mengalihkan...", "success");
      setTimeout(() => router.push(`/schedule/${scheduleId}`), 1500);
    } catch (error: any) {
      console.error("Error updating schedule:", error);
      showToast(error.message || "Terjadi kesalahan saat memperbarui event", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loading text="Memuat data event..." size="lg" />
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
                <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5 text-emerald-500" strokeWidth={3} />
                Kembali
              </button>
              <div>
                <h1 className="text-2xl lg:text-4xl font-black text-slate-800 tracking-tight mb-2 flex items-center gap-2 lg:gap-3">
                  Edit Jadwal Event
                </h1>
                <p className="text-slate-500 font-medium text-sm lg:text-lg">
                  Update detail event dan gambar thumbnail.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold bg-rose-50 text-rose-600 px-3 py-2 rounded-xl border-2 border-rose-100">
                  <span className="text-rose-500 font-black text-lg leading-none mt-1">*</span> Wajib diisi
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* --- KOLOM KIRI: FORM UTAMA --- */}
              <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                {/* Card Informasi Dasar */}
                <div className="bg-white p-5 lg:p-8 rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] lg:shadow-[0_8px_0_0_#cbd5e1]">
                  <h2 className="text-lg lg:text-xl font-black text-slate-700 mb-4 lg:mb-6 flex items-center gap-2">
                    <Type className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-500" /> Informasi Dasar
                  </h2>

                  <div className="space-y-4 lg:space-y-6">
                    <div className="space-y-2">
                      <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">
                        Judul Event <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        name="title"
                        required
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Contoh: Seminar Akhlak Pemuda"
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
                        onChange={handleChange}
                        placeholder="Jelaskan tentang event ini..."
                        maxLength={200}
                      />
                      <p className="text-xs text-slate-500 ml-1">{formData.description.length}/200 karakter</p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">Deskripsi Lengkap</label>
                      <Textarea
                        name="fullDescription"
                        rows={5}
                        value={formData.fullDescription}
                        onChange={handleChange}
                        placeholder="Deskripsi lengkap tentang event, materi yang akan dibahas, dll."
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">Status Kegiatan</label>
                       <CategoryFilter
                         categories={["Segera hadir", "Sedang berlangsung", "Kegiatan telah selesai"]}
                         subCategories={[]}
                         selectedCategory={reverseStatusMapping[formData.status as keyof typeof reverseStatusMapping] || "Segera hadir"}
                         selectedSubCategory=""
                         onCategoryChange={(cat) => setFormData(prev => ({ ...prev, status: statusMapping[cat as keyof typeof statusMapping] }))}
                         onSubCategoryChange={() => {}}
                       />
                    </div>
                  </div>
                </div>

                {/* Card Waktu & Tempat */}
                <div className="bg-white p-5 lg:p-8 rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] lg:shadow-[0_8px_0_0_#cbd5e1]">
                  <h2 className="text-lg lg:text-xl font-black text-slate-700 mb-4 lg:mb-6 flex items-center gap-2">
                    <Calendar className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-500" /> Waktu & Lokasi
                  </h2>
                  <div className="space-y-4 lg:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                      <DatePicker
                        label="Tanggal Event *"
                        value={formData.date}
                        onChange={(date) =>
                          setFormData({ ...formData, date })
                        }
                        placeholder="Pilih tanggal"
                      />
                      <TimePicker
                        label="Jam Mulai *"
                        value={formData.time}
                        onChange={(time) =>
                          setFormData({ ...formData, time })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex text-xs lg:text-sm font-bold text-slate-600 ml-1 items-center gap-1">
                        <MapPin className="h-4 w-4 text-emerald-500" /> Lokasi <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        name="location"
                        required
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Contoh: Aula Utama"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex text-xs lg:text-sm font-bold text-slate-600 ml-1 items-center gap-1">
                         <Headset className="h-4 w-4 text-emerald-500" /> Narahubung <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        name="pemateri"
                        required
                        value={formData.pemateri}
                        onChange={handleChange}
                        placeholder="Contoh: Ustadz Ahmad Zaki"
                      />
                    </div>
                  </div>
                </div>

                {/* Card Kontak */}
                <div className="bg-white p-5 lg:p-8 rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] lg:shadow-[0_8px_0_0_#cbd5e1]">
                  <h2 className="text-lg lg:text-xl font-black text-slate-700 mb-4 lg:mb-6 flex items-center gap-2">
                    <Users className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-500" /> Kontak Person
                  </h2>
                  <div className="space-y-4 lg:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                      <div className="space-y-2">
                        <label className="text-xs lg:text-sm font-bold text-slate-600 ml-1 flex items-center gap-1.5 justify-start">
                          <Phone className="w-4 h-4 text-emerald-600" strokeWidth={2.5}/> Nomor Telepon (WA)
                        </label>
                        <Input
                          type="tel"
                          name="contactNumber"
                          value={formData.contactNumber}
                          onChange={handleChange}
                          placeholder="Contoh: 08123456789"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs lg:text-sm font-bold text-slate-600 ml-1 flex items-center gap-1.5 justify-start">
                          <Mail className="w-4 h-4 text-emerald-600" strokeWidth={2.5}/> Email
                        </label>
                        <Input
                          type="email"
                          name="contactEmail"
                          value={formData.contactEmail}
                          onChange={handleChange}
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- KOLOM KANAN: MEDIA --- */}
              <div className="lg:col-span-1 space-y-6 lg:space-y-8">
                {/* Thumbnail Card */}
                <div className="bg-white p-5 lg:p-6 rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] lg:shadow-[0_8px_0_0_#cbd5e1] text-center">
                  <label className="block text-xs lg:text-sm font-bold text-slate-600 mb-3 lg:mb-4">
                    Thumbnail Event
                  </label>
                  <div className="relative group cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                      id="upload-thumb"
                      required={!formData.thumbnailUrl}
                    />
                    {formData.thumbnailUrl ? (
                      <div className="relative w-full h-40 lg:h-48 rounded-2xl lg:rounded-3xl overflow-hidden border-2 border-slate-200 group-hover:border-teal-400 transition-all shadow-sm">
                        <img
                          src={formData.thumbnailUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setFormData((prev) => ({ ...prev, thumbnailUrl: "" }));
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors shadow-md"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="upload-thumb"
                        className={`flex flex-col items-center justify-center w-full h-40 lg:h-48 rounded-2xl lg:rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-teal-400 hover:bg-teal-50 transition-all cursor-pointer ${
                          uploading ? "opacity-50 pointer-events-none" : ""
                        }`}
                      >
                        {uploading ? (
                          <svg className="animate-spin -ml-1 mr-3 h-6 w-6 lg:h-8 lg:w-8 text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 lg:w-8 lg:h-8 text-emerald-500 mb-2 group-hover:text-emerald-600 transition-colors" />
                            <span className="text-xs lg:text-sm font-bold text-slate-400 group-hover:text-teal-500 transition-colors">
                              Klik untuk Upload Thumbnail
                            </span>
                            <span className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">
                              JPG, PNG, WebP (Max 5MB)
                            </span>
                          </>
                        )}
                      </label>
                    )}
                  </div>
                </div>

                {/* Submit Card */}
                <div className="bg-teal-500 p-6 rounded-[2.5rem] text-white border-2 border-teal-600 shadow-[0_6px_0_0_#0d9488] mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="h-8 w-8 text-teal-100" strokeWidth={2.5} />
                    <h3 className="text-xl font-black">Siap Terbit?</h3>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-white text-teal-600 font-black text-lg rounded-2xl shadow-[0_4px_0_0_#ccfbf1] border-2 border-teal-100 hover:bg-teal-50 active:translate-y-1 active:shadow-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <p className="text-xs text-teal-100 font-bold mt-4 text-center opacity-80">
                    Pastikan semua informasi jadwal sudah benar sebelum diperbarui.
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

export default EditSchedule;