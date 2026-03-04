"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import Loading from "@/components/ui/Loading";
import DatePicker from "@/components/ui/DatePicker";
import TimePicker from "@/components/ui/TimePicker";
import { Input } from "@/components/ui/InputText";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, Clock, ArrowLeft, Upload, X, Save, Sparkles, Type, Users, Mic } from "lucide-react";
import Toast from "@/components/ui/Toast";

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
  });

  // Helper Toast
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  // Redirect jika bukan instruktur
  if (status === "authenticated" && session?.user?.role !== "instruktur") {
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
    if (!formData.pemateri.trim()) { showToast("Nama pemateri/penanggung jawab tidak boleh kosong", "error"); return; }

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

      showToast("Event berhasil dibuat. Mengalihkan...", "success");
      // REDIRECT KE HALAMAN UTAMA SCHEDULE
      setTimeout(() => router.push("/schedule"), 1500);
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
                <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5" strokeWidth={3} />
                Kembali
              </button>
              <div>
                <h1 className="text-2xl lg:text-4xl font-black text-slate-800 tracking-tight mb-2 flex items-center gap-2 lg:gap-3">
                  Buat Jadwal Event
                </h1>
                <p className="text-slate-500 font-medium text-sm lg:text-lg">
                  Isi detail event dan upload gambar thumbnail.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* --- KOLOM KIRI: FORM UTAMA --- */}
              <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                {/* Card Informasi Dasar */}
                <div className="bg-white p-5 lg:p-8 rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] lg:shadow-[0_8px_0_0_#cbd5e1]">
                  <h2 className="text-lg lg:text-xl font-black text-slate-700 mb-4 lg:mb-6 flex items-center gap-2">
                    <Type className="h-5 w-5 lg:h-6 lg:w-6 text-teal-500" /> Informasi Dasar
                  </h2>

                  <div className="space-y-4 lg:space-y-6">
                    <div className="space-y-2">
                      <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">Judul Event</label>
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
                      <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">Deskripsi Singkat</label>
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
                  </div>
                </div>

                {/* Card Waktu & Tempat */}
                <div className="bg-white p-5 lg:p-8 rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] lg:shadow-[0_8px_0_0_#cbd5e1]">
                  <h2 className="text-lg lg:text-xl font-black text-slate-700 mb-4 lg:mb-6 flex items-center gap-2">
                    <Calendar className="h-5 w-5 lg:h-6 lg:w-6 text-indigo-500" /> Waktu & Lokasi
                  </h2>
                  <div className="space-y-4 lg:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                      <DatePicker
                        label="Tanggal Event"
                        value={formData.date}
                        onChange={(date) =>
                          setFormData({ ...formData, date })
                        }
                        placeholder="Pilih tanggal"
                      />
                      <TimePicker
                        label="Jam Mulai"
                        value={formData.time}
                        onChange={(time) =>
                          setFormData({ ...formData, time })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex text-xs lg:text-sm font-bold text-slate-600 ml-1 items-center gap-1">
                        <MapPin className="h-4 w-4" /> Lokasi
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
                         <Mic className="h-4 w-4" /> Pemateri / Penanggung Jawab
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
                            <Upload className="w-6 h-6 lg:w-8 lg:h-8 text-slate-400 mb-2 group-hover:text-teal-500 transition-colors" />
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

export default CreateSchedule;