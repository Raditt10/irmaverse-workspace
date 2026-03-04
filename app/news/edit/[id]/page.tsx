"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import { ArrowLeft, Eye, Edit3, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Toaster, toast } from "sonner";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const categories = ["Prestasi", "Kerjasama", "Update", "Event", "Pengumuman"];

export default function EditNewsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { data: session, status } = useSession();
  
  const [loading, setLoading] = useState(false);
  const [fetchingNews, setFetchingNews] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const role = session?.user?.role?.toLowerCase();
  const isPrivileged = role === "admin" || role === "instruktur";

  if (status === "authenticated" && !isPrivileged) {
    router.push("/news");
    return null;
  }

  const [formData, setFormData] = useState({
    title: "",
    category: "Prestasi",
    content: "",
    image: "",
  });
  
  const [oldImage, setOldImage] = useState<string>("");

  useEffect(() => {
    fetchNewsDetail();
  }, [id]);

  const fetchNewsDetail = async () => {
    try {
      const response = await fetch(`/api/news?id=${id}`);
      if (!response.ok) throw new Error("Failed to fetch news");
      const data = await response.json();
      
      setFormData({
        title: data.title,
        category: data.category,
        content: data.content,
        image: data.image || "",
      });
      setOldImage(data.image || "");
    } catch (error) {
      console.error("Error fetching news:", error);
      toast.error("Gagal memuat berita");
    } finally {
      setFetchingNews(false);
    }
  };

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
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(`Error: ${error.error}`);
        return;
      }

      const data = await response.json();
      setFormData((prev) => ({
        ...prev,
        image: data.url,
      }));
      toast.success("Gambar berhasil diupload!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Gagal mengupload gambar. Silakan coba lagi.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/news", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          ...formData,
          oldImage: oldImage !== formData.image ? oldImage : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(`Error: ${error.error}`);
        return;
      }

      const news = await response.json();
      toast.success("Berita berhasil diupdate!");
      router.push(`/news/${news.slug}`);
    } catch (error) {
      console.error("Error updating news:", error);
      toast.error("Gagal mengupdate berita. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingNews) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <p className="text-slate-500">Memuat berita...</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100"
      style={{

      }}
    >
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold mb-8"
            >
              <ArrowLeft className="h-5 w-5" />
              Kembali ke daftar berita
            </Link>

            {/* Form Container */}
            <div className="bg-white rounded-3xl shadow-lg p-8 lg:p-12">
              <h1 className="text-4xl font-black text-slate-800 mb-2">
                Edit Berita
              </h1>
              <p className="text-slate-600 text-lg mb-8">
                Edit berita menggunakan Markdown format
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Judul Berita *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Masukkan judul berita..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Kategori *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Gambar Berita *
                  </label>

                  <div className="space-y-4">
                    {/* Upload Button */}
                    <label
                      htmlFor="image-upload"
                      className={`flex flex-col items-center justify-center gap-3 w-full px-6 py-8 rounded-xl border-2 border-dashed border-slate-300 hover:border-teal-500 cursor-pointer transition-colors ${
                        uploadingImage ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <ImageIcon className="h-8 w-8 text-slate-400" />
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-700">
                          {uploadingImage
                            ? "Mengupload..."
                            : "Klik untuk upload gambar baru"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Format: JPG, PNG, GIF, WebP (Max 5MB)
                        </p>
                      </div>
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />

                    {/* Image Preview */}
                    {formData.image && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-slate-700 mb-2">
                          Preview Gambar:
                        </p>
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="w-full max-w-md h-48 object-cover rounded-lg border border-slate-200"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Content (Markdown) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Konten (Markdown) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                    >
                      {showPreview ? (
                        <>
                          <Edit3 className="h-4 w-4" />
                          Edit
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          Preview
                        </>
                      )}
                    </button>
                  </div>

                  <div data-color-mode="light">
                    <MDEditor
                      value={formData.content}
                      onChange={(val) =>
                        setFormData((prev) => ({ ...prev, content: val || "" }))
                      }
                      preview={showPreview ? "preview" : "edit"}
                      height={400}
                      visibleDragbar={false}
                    />
                  </div>

                  <p className="text-xs text-slate-500 mt-2">
                    Gunakan toolbar di atas untuk format teks. Mendukung: heading,
                    bold, italic, links, lists, code blocks, dll.
                  </p>
                </div>

                {/* Preview Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Catatan:</strong> Deskripsi singkat akan diperbarui
                    otomatis dari 160 karakter pertama konten Anda.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold hover:from-teal-600 hover:to-cyan-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                  <Link
                    href="/news"
                    className="px-6 py-3 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition-all duration-300"
                  >
                    Batal
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <ChatbotButton />
      <Toaster position="top-right" richColors />
    </div>
  );
}
