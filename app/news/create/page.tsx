"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import { ArrowLeft, Eye, Edit3, Image as ImageIcon, Sparkles, Save } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import CustomDropdown from "@/components/ui/CustomDropdown";
import Toast from "@/components/ui/Toast";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const categories = ["Prestasi", "Kerjasama", "Update", "Event", "Pengumuman"];

export default function CreateNewsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [toastData, setToastData] = useState({
    show: false,
    message: "",
    type: "info" as "success" | "error" | "warning" | "info"
  });

  const showToast = (message: string, type: "success" | "error" | "warning" | "info") => {
    setToastData({ show: true, message, type });
    setTimeout(() => {
      setToastData((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const role = session?.user?.role?.toLowerCase();
  const isPrivileged = role === "admin" || role === "instruktur";

  if (status === "authenticated" && !isPrivileged) {
    router.push("/news");
    return null;
  }
  const [user, setUser] = useState<any>({
    id: "user-123",
    full_name: "Admin IRMA",
    email: "admin@irmaverse.local",
    avatar: "AI",
  });

  const [formData, setFormData] = useState({
    title: "",
    category: "Prestasi",
    content: "",
    image: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        return;
      }

      const data = await response.json();
      setFormData((prev) => ({
        ...prev,
        image: data.url,
      }));
      showToast("Gambar berhasil diupload!", "success");
    } catch (error) {
      console.error("Error uploading image:", error);
      showToast("Gagal mengupload gambar. Silakan coba lagi.", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        showToast(`Error: ${error.error}`, "error");
        return;
      }

      showToast("Berita berhasil dibuat!", "success");
      
      // Tunggu toast selesai sebelum redirect
      setTimeout(() => {
        router.push("/news");
      }, 1500);
    } catch (error) {
      console.error("Error creating news:", error);
      showToast("Gagal membuat berita. Silakan coba lagi.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader/>
      <div className="flex flex-col lg:flex-row">
        <Sidebar />
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-12 w-full max-w-[100vw] overflow-hidden">
          <div className="max-w-5xl mx-auto">
            {/* Header & Back Button */}
            <div className="flex flex-col gap-4 lg:gap-6 mb-6 lg:mb-8">
              <Link
                href="/news"
                className="self-start inline-flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-2 rounded-xl bg-white border-2 border-slate-200 text-slate-500 font-bold hover:border-teal-400 hover:text-teal-600 hover:shadow-[0_4px_0_0_#cbd5e1] active:translate-y-0.5 active:shadow-none transition-all text-sm lg:text-base"
              >
                <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5" strokeWidth={3} />
                Kembali
              </Link>
              <div>
                <h1 className="text-2xl lg:text-4xl font-black text-slate-800 tracking-tight mb-2 flex items-center gap-2 lg:gap-3">
                  Buat Berita Baru
                </h1>
                <p className="text-slate-500 font-medium text-sm lg:text-lg">
                  Buat berita terbaru menggunakan format Markdown.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* --- KOLOM KIRI: FORM UTAMA --- */}
              <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                <div className="bg-white p-5 lg:p-8 rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] lg:shadow-[0_8px_0_0_#cbd5e1]">
                  <h2 className="text-lg lg:text-xl font-black text-slate-700 mb-4 lg:mb-6 flex items-center gap-2">
                    <Edit3 className="h-5 w-5 lg:h-6 lg:w-6 text-teal-500" />{" "}
                    Informasi Berita
                  </h2>

                  <div className="space-y-4 lg:space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                      <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">
                        Judul Berita *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Masukkan judul berita..."
                        className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 sm:px-5 py-3.5 sm:py-4 text-sm sm:text-base font-medium shadow-sm transition-all focus:outline-none focus:border-teal-400 focus:shadow-[0_4px_0_0_#34d399]"
                        required
                      />
                    </div>

                    {/* Category */}
                    <CustomDropdown
                      label="Kategori *"
                      options={categories.map((cat) => ({ value: cat, label: cat }))}
                      value={formData.category}
                      onChange={(val) => setFormData((prev) => ({ ...prev, category: val }))}
                    />

                    {/* Content (Markdown) */}
                    <div className="pt-6 border-t-2 border-slate-100">
                      <div className="flex flex-row items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                          <Edit3 className="h-4 w-4 text-emerald-500" /> Konten (Markdown) *
                        </h3>
                        <button
                          type="button"
                          onClick={() => setShowPreview(!showPreview)}
                          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-teal-50 text-xs sm:text-sm font-bold text-teal-600 border border-teal-200 hover:bg-teal-100 transition-colors"
                        >
                          {showPreview ? (
                            <>
                              <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5}/>
                              Edit
                            </>
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5}/>
                              Preview
                            </>
                          )}
                        </button>
                      </div>
                      
                      <div data-color-mode="light" className="w-full">
                        <div className="rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                          <MDEditor
                            value={formData.content}
                            onChange={(val) =>
                              setFormData((prev) => ({ ...prev, content: val || "" }))
                            }
                            preview={showPreview ? "preview" : "edit"}
                            height={350}
                            visibleDragbar={false}
                            className="w-full max-w-full text-sm"
                            style={{ minHeight: '350px' }}
                          />
                        </div>
                      </div>
                      
                      <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-3 leading-relaxed ml-1">
                        Gunakan toolbar di atas untuk format teks. Mendukung: heading, bold, italic, links, lists, code blocks, dll.
                      </p>
                    </div>

                    {/* Preview Note */}
                    <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-4 sm:p-5 flex gap-3 items-start">
                      <div className="text-sky-500 mt-0.5 shrink-0 text-xl">💡</div>
                      <p className="text-xs sm:text-sm text-sky-800 font-medium leading-relaxed">
                        Deskripsi singkat akan dibuat otomatis dari 160 karakter pertama konten Anda. Slug (URL) juga dibuat otomatis berdasarkan judul berita.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- KOLOM KANAN: MEDIA & SUBMIT --- */}
              <div className="space-y-6 lg:space-y-8">
                {/* Upload Image */}
                <div className="bg-white p-5 lg:p-6 rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] lg:shadow-[0_8px_0_0_#cbd5e1] text-center">
                  <label className="block text-xs lg:text-sm font-bold text-slate-600 mb-3 lg:mb-4">
                    Gambar Berita *
                  </label>
                  <div className="relative group cursor-pointer">
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                      required={!formData.image}
                    />
                    {formData.image ? (
                      <div className="relative w-full h-40 lg:h-48 rounded-2xl lg:rounded-3xl overflow-hidden border-2 border-slate-200 group-hover:border-teal-400 transition-all shadow-sm">
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setFormData((prev) => ({
                              ...prev,
                              image: "",
                            }));
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors shadow-md"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="image-upload"
                        className={`flex flex-col items-center justify-center w-full h-40 lg:h-48 rounded-2xl lg:rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-teal-50 hover:border-teal-400 transition-all cursor-pointer ${
                          uploadingImage ? "opacity-50 pointer-events-none" : ""
                        }`}
                      >
                        {uploadingImage ? (
                           <svg className="animate-spin -ml-1 mr-3 h-6 w-6 lg:h-8 lg:w-8 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                          <>
                            <ImageIcon className="w-6 h-6 lg:w-8 lg:h-8 text-slate-400 mb-2 group-hover:text-teal-500 transition-colors" />
                            <span className="text-xs lg:text-sm font-bold text-slate-400 group-hover:text-teal-500 transition-colors">
                              Klik untuk Upload Gambar
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
                        Publikasikan Berita
                      </>
                    )}
                  </button>
                  <p className="text-xs text-teal-100 font-bold mt-4 text-center opacity-80">
                    Pastikan semua informasi berita sudah benar sebelum diterbitkan.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      <ChatbotButton />
      <Toast 
        show={toastData.show} 
        message={toastData.message} 
        type={toastData.type} 
        onClose={() => setToastData((prev) => ({ ...prev, show: false }))} 
      />
    </div>
  );
}
