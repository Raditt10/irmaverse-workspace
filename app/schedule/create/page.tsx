"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import Loading from "@/components/ui/Loading";
import DatePicker from "@/components/ui/DatePicker";
import TimePicker from "@/components/ui/TimePicker";
import { Input } from "@/components/ui/InputText";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, Clock, ArrowLeft, Upload, X, Save, Sparkles, Type, Users, Headset, Phone, Mail } from "lucide-react";
import Toast from "@/components/ui/Toast";
import CategoryFilter from "@/components/ui/CategoryFilter";

const statusMapping = {
  "Segera Hadir": "segera_hadir",
  "Sedang Berlangsung": "ongoing",
  "Kegiatan Selesai": "completed",
};

const reverseStatusMapping = {
  segera_hadir: "Segera Hadir",
  ongoing: "Sedang Berlangsung",
  completed: "Kegiatan Selesai",
};

const CreateSchedule = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
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
    pemateri: "", // Diganti dari penanggungjawab agar konsisten dengan backend
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

  // Redirect jika bukan instruktur, admin, atau super_admin
  const role = session?.user?.role;
  const isPrivileged = role === "instruktur" || role === "admin" || role === "super_admin";

  if (status === "authenticated" && !isPrivileged) {
    router.push("/schedule");
    return null;
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loading text="Memuat ..." size="lg" />
      </div>
    );
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
        const formData = new FormData();
        formData.append("file", file);
        
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!res.ok) {
          const error = await res.json();
          showToast(error.message || "Gagal mengunggah Tumbnail", "error");
          return;
        }
        
        const data = await res.json();
        setFormData((prev) => ({ ...prev, thumbnailUrl: data.url }));
        showToast("Tumbnail berhasil diunggah", "success");
      } catch (error) {
        showToast("Gagal mengunggah Tumbnail", "error");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- VALIDASI KUAT ---
    if (!formData.title.trim()) { showToast("Judul Kegiatan tidak boleh kosong", "error"); return; }
    if (formData.title.length < 5) { showToast("Judul Kegiatan minimal 5 karakter", "error"); return; }
    if (!formData.description.trim()) { showToast("Deskripsi singkat tidak boleh kosong", "error"); return; }
    if (!formData.date) { showToast("Tanggal Kegiatan harus dipilih", "error"); return; }
    if (!formData.time) { showToast("Jam Kegiatan harus dipilih", "error"); return; }
    if (!formData.location.trim()) { showToast("Lokasi Kegiatan tidak boleh kosong", "error"); return; }
    if (!formData.pemateri.trim()) { showToast("Nama pemateri/penanggung jawab tidak boleh kosong", "error"); return; }
    if (!formData.thumbnailUrl) { showToast("Tumbnail Kegiatan wajib diunggah", "error"); return; }

    setLoading(true);
    try {
      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal membuat jadwal");
      }

      const data = await response.json();
      showToast("Kegiatan berhasil dibuat. Mengalihkan...", "success");
      setTimeout(() => router.push(`/schedule`), 1500);
    } catch (error: any) {
      console.error("Error creating schedule:", error);
      showToast(error.message || "Terjadi kesalahan saat membuat jadwal", "error");
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
                <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5 text-emerald-500" strokeWidth={3} />
                Kembali
              </button>
              <div>
                <h1 className="text-2xl lg:text-4xl font-black text-slate-800 tracking-tight mb-2 flex items-center gap-2 lg:gap-3">
                  Buat Jadwal Kegiatan
                </h1>
                <p className="text-slate-500 font-medium text-sm lg:text-lg">
                  Isi detail Kegiatan dan upload gambar thumbnail.
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
                        Judul Kegiatan <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        name="title"
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
                        rows={3}
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Jelaskan tentang Jelaskan ini..."
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
                        placeholder="Deskripsi lengkap tentang Kegiatan, materi yang akan dibahas, dll."
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">Status Kegiatan</label>
                       <CategoryFilter
                         categories={["Segera Hadir", "Sedang Berlangsung", "Kegiatan Selesai"]}
                         subCategories={[]}
                         selectedCategory={reverseStatusMapping[formData.status as keyof typeof reverseStatusMapping] || "Segera Hadir"}
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
                        label="Tanggal Kegiatan *"
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
                      <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">
                        Lokasi <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <MapPin className="h-5 w-5 text-emerald-500 group-hover:text-emerald-600 transition-colors" />
                        </div>
                        <Input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          placeholder="Contoh: Aula Utama"
                          className="pl-12 lg:pl-12 border-2 border-slate-200 focus:border-emerald-400 focus:ring-emerald-100"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">
                        Pemateri <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Headset className="h-5 w-5 text-emerald-500 group-hover:text-emerald-600 transition-colors" />
                        </div>
                        <Input
                          type="text"
                          name="pemateri"
                          value={formData.pemateri}
                          onChange={handleChange}
                          placeholder="Contoh: Ustadz Ahmad Zaki"
                          className="pl-12 lg:pl-12 border-2 border-slate-200 focus:border-emerald-400 focus:ring-emerald-100"
                        />
                      </div>
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
                        <label className="text-xs lg:text-sm font-bold text-slate-600 ml-1">
                          Nomor Telepon (WA)
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-emerald-500 group-hover:text-emerald-600 transition-colors" />
                          </div>
                          <Input
                            type="tel"
                            name="contactNumber"
                            value={formData.contactNumber}
                            onChange={handleChange}
                            placeholder="Contoh: 08123456789"
                            className="pl-12 lg:pl-12 border-2 border-slate-200 focus:border-emerald-400 focus:ring-emerald-100"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs lg:text-sm font-bold text-slate-600 ml-1">
                          Email
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-emerald-500 group-hover:text-emerald-600 transition-colors" />
                          </div>
                          <Input
                            type="email"
                            name="contactEmail"
                            value={formData.contactEmail}
                            onChange={handleChange}
                            placeholder="email@example.com"
                            className="pl-12 lg:pl-12 border-2 border-slate-200 focus:border-emerald-400 focus:ring-emerald-100"
                          />
                        </div>
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
                    Thumbnail Kegiatan
                  </label>
                  <div className="relative group cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      id="upload-thumb"
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
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-white text-teal-600 font-black text-lg rounded-2xl shadow-[0_4px_0_0_#ccfbf1] border-2 border-teal-100 hover:bg-teal-50 active:translate-y-1 active:shadow-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Sparkles className="h-6 w-6 animate-spin" />{" "}
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="h-6 w-6" />
                        Buat Jadwal
                      </>
                    )}
                  </button>
                  <p className="text-xs text-teal-100 font-bold mt-4 text-center opacity-80">
                    Pastikan semua informasi jadwal sudah benar sebelum diterbitkan.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
};

export default CreateSchedule;