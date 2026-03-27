"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import SearchInput from "@/components/ui/SearchInput";
import CategoryFilter from "@/components/ui/CategoryFilter";
import {
  ArrowRight,
  Calendar,
  Eye,
  Share2,
  Bookmark,
  Filter,
  Plus,
  Pencil,
  Trash2,
  Search,
  HelpCircle,
  Sparkles,
  Newspaper
} from "lucide-react";
import PageBanner from "@/components/ui/PageBanner";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Toast from "@/components/ui/Toast";
import EmptyState from "@/components/ui/EmptyState";
import AddButton from "@/components/ui/AddButton";
import SuccessDataFound from "@/components/ui/SuccessDataFound";
import Loading from "@/components/ui/Loading";

interface NewsItem {
  id: string;
  title: string;
  deskripsi: string;
  content: string;
  category: "Prestasi" | "Kerjasama" | "Update" | "Event" | "Pengumuman";
  createdAt: string;
  image: string | null;
  slug: string;
  author: {
    id: string;
    name: string | null;
    email: string;
    avatar?: string | null;
  };
  isSaved?: boolean;
}

const categoryStyles: Record<NewsItem["category"], string> = {
  Prestasi: "bg-emerald-500 text-white",
  Kerjasama: "bg-cyan-500 text-white",
  Update: "bg-blue-500 text-white",
  Event: "bg-purple-500 text-white",
  Pengumuman: "bg-amber-500 text-white",
};

// Algoritma Levenshtein untuk mengecek kemiripan string (Typos)
const getLevenshteinDistance = (a: string, b: string) => {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1),
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const News = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const role = session?.user?.role?.toLowerCase();
  const isPrivileged =
    role === "admin" || role === "instruktur" || role === "super_admin";
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // State untuk Suggestion / "Mungkin maksud Anda"
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    filterNews();
  }, [selectedCategory, searchTerm, news]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchNews = async () => {
    try {
      const response = await fetch("/api/news");
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.error || "Failed to fetch news");
      }
      const data = await response.json();
      setNews(data);
      setFilteredNews(data);
    } catch (error: any) {
      console.error("Error fetching news:", error);
      setNotification({
        type: "error",
        title: "Gagal",
        message: `Gagal memuat berita: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const filterNews = () => {
    let filtered = news;
    setSuggestion(null); // Reset suggestion awal

    // Filter by Category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Filter by Search Term
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      const exactMatches = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(lowerTerm) ||
          item.deskripsi.toLowerCase().includes(lowerTerm),
      );

      filtered = exactMatches;

      // Logika "Did you mean..." hanya jalan jika hasil sedikit atau 0
      if (filtered.length === 0 && news.length > 0) {
        let bestMatch = "";
        let lowestDistance = Infinity;

        // Cek kemiripan dengan semua Judul Berita
        news.forEach((item) => {
          const titleDistance = getLevenshteinDistance(
            lowerTerm,
            item.title.toLowerCase(),
          );

          // Normalisasi jarak berdasarkan panjang string (agar kata pendek vs panjang fair)
          const relativeDistance =
            titleDistance -
            Math.abs(item.title.length - lowerTerm.length) * 0.5;

          // Threshold toleransi typo (bisa disesuaikan)
          if (
            relativeDistance < lowestDistance &&
            titleDistance < item.title.length * 0.6
          ) {
            lowestDistance = relativeDistance;
            bestMatch = item.title;
          }
        });

        // Jika ditemukan match yang cukup dekat (tapi bukan exact match)
        if (bestMatch && bestMatch.toLowerCase() !== lowerTerm) {
          setSuggestion(bestMatch);
        }
      }
    }

    setFilteredNews(filtered);
  };

  const handleSuggestionClick = () => {
    if (suggestion) {
      setSearchTerm(suggestion);
    }
  };

  const handleDelete = (id: string) => {
    setSelectedNewsId(id);
    setDeleteDialogOpen(true);
  };

  const handleToggleSave = async (e: React.MouseEvent, newsId: string) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await fetch("/api/news/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsId }),
      });

      if (!response.ok) throw new Error("Gagal menyimpan berita");

      const data = await response.json();

      // Update local state and re-sort
      setNews((prev) => {
        const updated = prev.map((item) =>
          item.id === newsId ? { ...item, isSaved: data.isSaved } : item,
        );
        return [...updated].sort((a, b) => {
          if (a.isSaved && !b.isSaved) return -1;
          if (!a.isSaved && b.isSaved) return 1;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
      });

      setNotification({
        type: data.isSaved ? "success" : "info",
        title: data.isSaved ? "Tersimpan" : "Dihapus",
        message: data.message,
      });
    } catch (error) {
      console.error("Error toggling save:", error);
      setNotification({
        type: "error",
        title: "Gagal",
        message: "Gagal menyimpan berita",
      });
    }
  };

  const confirmDelete = async () => {
    if (!selectedNewsId) return;

    setDeleteDialogOpen(false);

    try {
      const response = await fetch(`/api/news?id=${selectedNewsId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        setNotification({
          type: "error",
          title: "Gagal",
          message: error.error,
        });
        return;
      }

      setNotification({
        type: "success",
        title: "Berhasil!",
        message: "Berita berhasil dihapus!",
      });
      setSelectedNewsId(null);
      fetchNews();
    } catch (error) {
      console.error("Error deleting news:", error);
      setNotification({
        type: "error",
        title: "Gagal",
        message: "Gagal menghapus berita. Silakan coba lagi.",
      });
    }
  };

  const categories = [
    "Semua",
    "Prestasi",
    "Kerjasama",
    "Update",
    "Event",
    "Pengumuman",
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 w-full max-w-[100vw] overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <PageBanner
              title="Berita IRMA"
              description="Berita terkini seputar kegiatan dan perkembangan IRMA Verse"
              icon={Newspaper}
              tag="Berita"
              tagIcon={Newspaper}
              action={
                isPrivileged && (
                  <button
                    onClick={() => router.push("/news/create")}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-white text-emerald-600 font-black text-sm border-2 border-white/80 shadow-[0_4px_0_0_#0f766e] hover:shadow-[0_2px_0_0_#0f766e] hover:translate-y-0.5 active:translate-y-1 active:shadow-none transition-all w-full max-w-[240px] md:w-auto mx-auto md:mx-0"
                  >
                    <Plus className="h-5 w-5" strokeWidth={3} /> Buat Berita Baru
                  </button>
                )
              }
            />

            {/* Search & Filter */}
            <div className="mb-6 lg:mb-8 flex flex-col gap-4">
              <div className="w-full">
                <SearchInput
                  placeholder="Cari judul berita..."
                  value={searchTerm}
                  onChange={setSearchTerm}
                  className="w-full transition-shadow duration-300"
                />
              </div>

              {/* --- PROFESSIONAL "DID YOU MEAN" SUGGESTION UI --- */}
              {suggestion && filteredNews.length === 0 && (
                <div className="flex items-center gap-2 px-2 animate-[fadeIn_0.5s_ease-out]">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <p className="text-slate-500 text-sm">
                    Mungkin maksud Anda:{" "}
                    <button
                      onClick={handleSuggestionClick}
                      className="font-bold text-teal-600 hover:text-teal-700 hover:underline italic transition-colors"
                    >
                      &quot;{suggestion}&quot;
                    </button>
                    ?
                  </p>
                </div>
              )}
              {/* --- SUCCESS DATA FOUND --- */}
              {searchTerm && filteredNews.length > 0 && !suggestion && (
                <div className="mb-2">
                  <SuccessDataFound
                    message={`Ditemukan ${filteredNews.length} berita sesuai pencarian`}
                    icon="sparkles"
                  />
                </div>
              )}
              <div className="relative min-w-0 pr-1 overflow-hidden">
                <CategoryFilter
                  categories={categories}
                  subCategories={[]}
                  selectedCategory={selectedCategory}
                  selectedSubCategory=""
                  onCategoryChange={setSelectedCategory}
                  onSubCategoryChange={() => {}}
                />
              </div>
            </div>

            {loading ? (
              <div className="py-12">
                <Loading text="Memuat berita..." size="lg" />
              </div>
            ) : filteredNews.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <EmptyState
                  icon="search"
                  title="Tidak ada berita ditemukan"
                  description="Coba kata kunci lain atau ubah filter kategori."
                  actionLabel={
                    suggestion
                      ? `Cari &quot;${suggestion}&quot; saja`
                      : undefined
                  }
                  onAction={suggestion ? handleSuggestionClick : undefined}
                />
              </div>
            ) : (
              <div className="space-y-6">
                {filteredNews.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border-2 border-slate-200 shadow-[0_6px_0_0_#cbd5e1] hover:border-teal-400 hover:shadow-[0_6px_0_0_#34d399] transition-all duration-300 overflow-hidden group"
                  >
                    <div className="flex flex-col sm:flex-row relative sm:h-48 h-full">
                      {/* Image Area */}
                      <div className="w-full sm:w-60 h-44 sm:h-full shrink-0 relative overflow-hidden bg-slate-100">
                        <img
                          src={
                            item.image ||
                            "https://images.unsplash.com/photo-1633613286991-611bcfb63dba?auto=format&fit=crop&w=800&q=80"
                          }
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 via-transparent to-transparent sm:hidden" />
                        <span
                          className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black shadow-lg tracking-wider border-2 border-white/20 backdrop-blur-sm ${categoryStyles[item.category] || "bg-emerald-500 text-white"}`}
                        >
                          {item.category}
                        </span>
                        {item.isSaved && (
                          <div className="absolute top-3 right-3 bg-amber-400 text-white p-1.5 rounded-full shadow-lg border-2 border-amber-600">
                            <Bookmark className="h-3 w-3 fill-current" />
                          </div>
                        )}
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 p-4 sm:p-5 lg:p-6 flex flex-col min-h-0">
                        {/* Text part - Centered in remaining space */}
                        <div className="flex-1 flex flex-col justify-center min-h-0">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(item.createdAt).toLocaleDateString(
                                "id-ID",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )}
                            </span>
                          </div>

                          <h2 className="text-lg sm:text-xl font-black text-slate-800 mb-1 group-hover:text-teal-600 transition-colors line-clamp-1 leading-tight">
                            {item.title}
                          </h2>

                          <p className="text-slate-500 font-medium text-xs sm:text-sm line-clamp-2 leading-relaxed pr-2">
                            {item.deskripsi}
                          </p>
                        </div>

                        {/* Footer Info - Pinned to bottom */}
                        <div className="flex items-center justify-between pt-3 border-t-2 border-slate-50 mt-auto">
                          <div className="flex items-center gap-2.5 min-w-0 mr-4">
                            {item.author.avatar ? (
                              <img
                                src={item.author.avatar}
                                alt={item.author.name || "Author"}
                                className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-teal-400 border-2 border-teal-500 flex shrink-0 items-center justify-center text-xs text-white font-black shadow-sm">
                                {(item.author.name || "A")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            )}
                            <span className="text-sm font-bold text-slate-600 truncate">
                              {item.author.name || "Admin IRMA"}
                            </span>
                          </div>

                          <div className="flex shrink-0 gap-2 items-center">
                            {isPrivileged && (
                              <>
                                <Link
                                  href={`/news/edit/${item.id}`}
                                  className="p-2 sm:p-2.5 rounded-xl border-2 border-slate-200 bg-white hover:bg-teal-50 hover:text-teal-600 hover:border-teal-300 transition-all text-slate-400 shadow-sm hover:shadow active:-translate-y-0.5"
                                  title="Edit berita"
                                >
                                  <Pencil
                                    className="h-4 w-4"
                                    strokeWidth={2.5}
                                  />
                                </Link>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="p-2 sm:p-2.5 rounded-xl border-2 border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition-all text-slate-400 shadow-sm hover:shadow active:-translate-y-0.5"
                                  title="Hapus berita"
                                >
                                  <Trash2
                                    className="h-4 w-4"
                                    strokeWidth={2.5}
                                  />
                                </button>
                              </>
                            )}

                            <button
                              onClick={(e) => handleToggleSave(e, item.id)}
                              className={`p-2 sm:p-2.5 rounded-xl border-2 border-b-4 transition-all ${
                                item.isSaved
                                  ? "bg-amber-400 border-amber-600 text-white shadow-inner active:border-b-2 translate-y-0.5"
                                  : "bg-white border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-400 active:border-b-2 active:translate-y-0.5 shadow-sm"
                              }`}
                              title={
                                item.isSaved
                                  ? "Hapus dari simpanan"
                                  : "Simpan berita"
                              }
                            >
                              <Bookmark
                                className={`h-4 w-4 ${item.isSaved ? "fill-current" : ""}`}
                                strokeWidth={2.5}
                              />
                            </button>

                            <Link
                              href={`/news/${item.slug}`}
                              className="px-4 py-2 sm:py-2.5 rounded-xl bg-teal-50 text-teal-600 font-black border-2 border-teal-200 hover:bg-teal-400 hover:text-white hover:border-teal-500 hover:shadow-md transition-all flex items-center gap-1.5 text-xs sm:text-sm group/btn active:translate-y-0.5"
                            >
                              <span className="hidden sm:inline">Baca</span>
                              <ArrowRight
                                className="h-4 w-4 group-hover/btn:translate-x-0.5 transition-transform"
                                strokeWidth={3}
                              />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <ChatbotButton />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        type="warning"
        title="Hapus Berita"
        message="Apakah Anda yakin ingin menghapus berita ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
      />

      {/* Notification */}
      <Toast
        show={!!notification}
        type={notification?.type || "info"}
        message={notification ? notification.message : ""}
        onClose={() => setNotification(null)}
      />
    </div>
  );
};

export default News;
