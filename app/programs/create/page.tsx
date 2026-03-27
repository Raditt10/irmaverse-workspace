"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import { Input } from "@/components/ui/InputText";
import { Textarea } from "@/components/ui/textarea";
import Toast from "@/components/ui/Toast";
import {
  Upload,
  Plus,
  Type,
  Sparkles,
  ArrowLeft,
  Rocket,
  GraduationCap,
  Clock,
  Trash2,
  Target,
  Layers,
} from "lucide-react";
import CategoryFilter from "@/components/ui/CategoryFilter";

const CreateProgram = () => {
  const router = useRouter();
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
    category: "Program Wajib",
    grade: "Semua",
    thumbnailUrl: "",
    duration: "",
    totalKajian: "",
    syllabus: [] as string[],
    requirements: [] as string[],
    benefits: [] as string[],
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (
    name: "syllabus" | "requirements" | "benefits",
    index: number,
    value: string,
  ) => {
    const newArray = [...formData[name]];
    newArray[index] = value;
    setFormData((prev) => ({ ...prev, [name]: newArray }));
  };

  const addArrayItem = (name: "syllabus" | "requirements" | "benefits") => {
    setFormData((prev) => ({ ...prev, [name]: [...prev[name], ""] }));
  };

  const removeArrayItem = (
    name: "syllabus" | "requirements" | "benefits",
    index: number,
  ) => {
    const newArray = formData[name].filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, [name]: newArray }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const error = await res.json();
          showToast(error.error || "Gagal mengunggah Tumbnail", "error");
          return;
        }
        const data = await res.json();
        setFormData((prev) => ({ ...prev, thumbnailUrl: data.url }));
        showToast("Tumbnail Program berhasil diunggah", "success");
      } catch {
        showToast("Terjadi kesalahan saat mengunggah Tumbnail", "error");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast("Judul Program wajib diisi", "error");
      return;
    }
    if (formData.title.length < 5) {
      showToast("Judul Program minimal 5 karakter", "error");
      return;
    }
    if (!formData.thumbnailUrl) {
      showToast("Tumbnail Program wajib diunggah", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal membuat Program");
      }
      showToast("Program berhasil diterbitkan! Mengalihkan..", "success");
      setTimeout(() => router.push("/programs"), 1500);
    } catch (error: any) {
      showToast(error.message, "error");
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
            {/* Header */}
            <div className="flex flex-col gap-4 mb-8">
              <button
                onClick={() => router.back()}
                className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-200 text-slate-500 font-bold hover:border-emerald-400 hover:text-emerald-600 hover:shadow-[0_4px_0_0_#cbd5e1] active:translate-y-0.5 active:shadow-none transition-all"
              >
                <ArrowLeft className="h-5 w-5" strokeWidth={3} />
                Kembali
              </button>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight mb-2">
                  Buat Program Baru
                </h1>
                <p className="text-slate-500 font-medium text-lg">
                  Rancang Program terbaik untuk santri IRMA. Materi dapat
                  ditambahkan setelah Program dibuat.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold bg-rose-50 text-rose-600 px-3 py-2 rounded-xl border-2 border-rose-100">
                  <span className="text-rose-500 font-black text-lg leading-none mt-1">*</span> Wajib diisi
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* LEFT COLUMN */}
              <div className="lg:col-span-2 space-y-8">
                {/* Detail */}
                <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-[0_8px_0_0_#cbd5e1]">
                  <h2 className="text-xl font-black text-slate-700 mb-6 flex items-center gap-2">
                    <Type className="h-6 w-6 text-emerald-500" /> Detail Program
                  </h2>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-600 ml-1">
                        Nama Program <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Contoh: Tahfizh Akhir Pekan (Juz 30)"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-600 ml-1">
                        Deskripsi Program <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        name="description"
                        rows={6}
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Jelaskan visi dan materi yang akan dipelajari..."
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t-2 border-slate-50">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-600 ml-1">
                          Durasi
                        </label>
                        <div className="relative flex items-center group">
                          <Clock className="absolute left-4 lg:left-5 h-5 w-5 text-emerald-500 group-hover:text-emerald-600 transition-colors pointer-events-none" />
                          <Input
                            type="text"
                            name="duration"
                            value={formData.duration}
                            onChange={handleInputChange}
                            placeholder="e.g. 12 Sesi / 3 Bulan"
                            className="pl-12 lg:pl-14"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-600 ml-1">
                          Total Kajian <span className="text-red-500">*</span>
                        </label>
                        <div className="relative flex items-center group">
                          <Layers className="absolute left-4 lg:left-5 h-5 w-5 text-emerald-500 group-hover:text-emerald-600 transition-colors pointer-events-none" />
                          <Input
                            type="number"
                            name="totalKajian"
                            min="1"
                            value={formData.totalKajian}
                            onChange={handleInputChange}
                            placeholder="Berapa banyak pertemuan/kajian?"
                            className="pl-12 lg:pl-14"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Silabus */}
                <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-[0_8px_0_0_#cbd5e1]">
                  <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-purple-500 rounded-full" />
                    Silabus
                  </h2>
                  <div className="space-y-4">
                    {formData.syllabus.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-50 border-2 border-purple-100 text-purple-600 font-black text-sm shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) =>
                            handleArrayChange("syllabus", idx, e.target.value)
                          }
                          placeholder="e.g. Pengenalan Tajwid Dasar"
                          className="flex-1 rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem("syllabus", idx)}
                          className="p-3 rounded-xl bg-red-50 text-red-500 border-2 border-transparent hover:border-red-200 transition-all shrink-0"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem("syllabus")}
                      className="w-full py-3.5 rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/50 text-purple-600 font-bold text-sm hover:bg-purple-100/50 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" /> Tambah Item Silabus
                    </button>
                  </div>
                </div>

                {/* Persyaratan & Manfaat */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-[0_8px_0_0_#cbd5e1]">
                    <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                      <div className="w-1.5 h-8 bg-amber-400 rounded-full" />
                      Persyaratan
                    </h2>
                    <div className="space-y-3">
                      {formData.requirements.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) =>
                              handleArrayChange(
                                "requirements",
                                idx,
                                e.target.value,
                              )
                            }
                            placeholder="e.g. Lancar membaca Quran"
                            className="flex-1 rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => removeArrayItem("requirements", idx)}
                            className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem("requirements")}
                        className="w-full py-3 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/50 text-amber-600 font-bold text-sm hover:bg-amber-100/50 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" /> Tambah Syarat
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-[0_8px_0_0_#cbd5e1]">
                    <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                      <div className="w-1.5 h-8 bg-emerald-400 rounded-full" />
                      Manfaat
                    </h2>
                    <div className="space-y-3">
                      {formData.benefits.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) =>
                              handleArrayChange("benefits", idx, e.target.value)
                            }
                            placeholder="e.g. Sertifikat resmi"
                            className="flex-1 rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => removeArrayItem("benefits", idx)}
                            className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem("benefits")}
                        className="w-full py-3 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 text-emerald-600 font-bold text-sm hover:bg-emerald-100/50 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" /> Tambah Manfaat
                      </button>
                    </div>
                  </div>
                </div>

                {/* Kategori Program */}
                <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-[0_8px_0_0_#cbd5e1]">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 ml-1 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-emerald-500" /> Kategori Program
                  </h3>
                  <CategoryFilter
                    categories={["Program Wajib", "Program Ekstra", "Susulan"]}
                    subCategories={[]}
                    selectedCategory={formData.category}
                    selectedSubCategory=""
                    onCategoryChange={(cat) => setFormData({ ...formData, category: cat })}
                    onSubCategoryChange={() => {}}
                  />
                </div>

                {/* Target Kelas */}
                <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-[0_8px_0_0_#cbd5e1]">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 ml-1 flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-500" /> Target Kelas
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

              {/* RIGHT COLUMN */}
              <div className="lg:col-span-1 space-y-6 lg:space-y-8">
                {/* Thumbnail Card */}
                <div className="bg-white p-5 lg:p-6 rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] lg:shadow-[0_8px_0_0_#cbd5e1] text-center">
                  <label className="block text-xs lg:text-sm font-bold text-slate-600 mb-3 lg:mb-4">
                    TUmbnail Program
                  </label>
                  <div className="relative group cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                      id="upload-comp"
                    />
                    {formData.thumbnailUrl ? (
                      <div className="relative w-full h-40 lg:h-48 rounded-2xl lg:rounded-3xl overflow-hidden border-2 border-slate-200 group-hover:border-emerald-400 transition-all shadow-sm">
                        <img
                          src={formData.thumbnailUrl}
                          alt="Banner Preview"
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
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors shadow-md"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="upload-comp"
                        className={`flex flex-col items-center justify-center w-full h-40 lg:h-48 rounded-2xl lg:rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-400 transition-all cursor-pointer ${
                          uploading ? "opacity-50 pointer-events-none" : ""
                        }`}
                      >
                        {uploading ? (
                          <svg
                            className="animate-spin -ml-1 mr-3 h-6 w-6 lg:h-8 lg:w-8 text-emerald-500"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 lg:w-8 lg:h-8 text-slate-400 mb-2 group-hover:text-emerald-500 transition-colors" />
                            <span className="text-xs lg:text-sm font-bold text-slate-400 group-hover:text-emerald-500 transition-colors">
                              Klik untuk Upload Banner
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

                {/* Info Card */}
                <div className="bg-blue-50 p-5 rounded-[2rem] border-2 border-blue-200 border-dashed">
                  <p className="text-xs text-blue-700 font-bold leading-relaxed text-center">
                    💡 Setelah Program dibuat, Anda dapat menambahkan materi ke
                    dalam Program melalui halaman <strong>Buat Kajian</strong>.
                  </p>
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
                    className="w-full flex items-center justify-center gap-2 py-4 bg-white text-emerald-600 font-black text-lg rounded-2xl shadow-[0_4px_0_0_#d1fae5] border-2 border-emerald-100 hover:bg-emerald-50 active:translate-y-1 active:shadow-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Sparkles className="h-6 w-6 animate-spin" />{" "}
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Rocket className="h-6 w-6" />
                        Terbitkan Program
                      </>
                    )}
                  </button>
                  <p className="text-xs text-emerald-100 font-bold mt-4 text-center opacity-80">
                    Pastikan semua kurikulum program sudah benar sebelum
                    diterbitkan.
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

export default CreateProgram;
