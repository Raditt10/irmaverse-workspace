"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import SearchInput from "@/components/ui/SearchInput";
import CategoryFilter from "@/components/ui/CategoryFilter";
import { ArrowRight, Calendar, Eye, Share2, Bookmark, Filter, Plus, Pencil, Trash2, Search, HelpCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import CartoonNotification from "@/components/ui/Notification";
import EmptyState from "@/components/ui/EmptyState";
import AddButton from "@/components/ui/AddButton";

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
  };
}

const categoryStyles: Record<NewsItem["category"], string> = {
  Prestasi: "bg-emerald-500 text-white",
  Kerjasama: "bg-cyan-500 text-white",
  Update: "bg-blue-500 text-white",
  Event: "bg-purple-500 text-white",
  Pengumuman: "bg-amber-500 text-white"
};

// Algoritma Levenshtein untuk mengecek kemiripan string (Typos)
const getLevenshteinDistance = (a: string, b: string) => {
  const matrix = [];
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
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
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
  const isPrivileged = role === "admin" || role === "instruktur";
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
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    // Filter by Search Term
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      const exactMatches = filtered.filter(item =>
        item.title.toLowerCase().includes(lowerTerm) ||
        item.deskripsi.toLowerCase().includes(lowerTerm)
      );
      
      filtered = exactMatches;

      // Logika "Did you mean..." hanya jalan jika hasil sedikit atau 0
      if (filtered.length === 0 && news.length > 0) {
        let bestMatch = "";
        let lowestDistance = Infinity;

        // Cek kemiripan dengan semua Judul Berita
        news.forEach((item) => {
          const titleDistance = getLevenshteinDistance(lowerTerm, item.title.toLowerCase());
          
          // Normalisasi jarak berdasarkan panjang string (agar kata pendek vs panjang fair)
          const relativeDistance = titleDistance - (Math.abs(item.title.length - lowerTerm.length) * 0.5);

          // Threshold toleransi typo (bisa disesuaikan)
          if (relativeDistance < lowestDistance && titleDistance < item.title.length * 0.6) {
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

  const categories = ["Semua", "Prestasi", "Kerjasama", "Update", "Event", "Pengumuman"];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100">
      <DashboardHeader/>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 w-full max-w-[100vw] overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 lg:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-2xl lg:text-4xl font-black text-slate-800 tracking-tight mb-1.5 leading-tight">
                  Berita IRMA
                </h1>
                <p className="text-slate-500 font-medium text-xs lg:text-lg">
                  Berita terkini seputar kegiatan dan perkembangan IRMA Verse
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                {isPrivileged && (
                  <AddButton
                    label="Buat Berita"
                    onClick={() => router.push("/news/create")}
                    icon={<Plus className="h-5 w-5" />}
                    color="emerald"
                    hideIcon={false}
                  />
                )}
              </div>
            </div>

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
              <div className="text-center py-12">
                <p className="text-slate-500">Memuat berita...</p>
              </div>
            ) : filteredNews.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <EmptyState
                  icon="search"
                  title="Tidak ada berita ditemukan"
                  description="Coba kata kunci lain atau ubah filter kategori."
                  actionLabel={suggestion ? `Cari &quot;${suggestion}&quot; saja` : undefined}
                  onAction={suggestion ? handleSuggestionClick : undefined}
                />
              </div>
            ) : (
              <div className="space-y-6">
                {filteredNews.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[0_8px_0_0_#cbd5e1] hover:border-teal-400 hover:shadow-[0_8px_0_0_#34d399] transition-all duration-300 overflow-hidden group"
                  >
                    <div className="flex flex-col sm:flex-row relative">
                      {/* Image Area */}
                      <div className="w-full sm:w-72 h-48 sm:h-auto shrink-0 relative overflow-hidden bg-slate-100">
                        <img
                          src={item.image || "https://images.unsplash.com/photo-1633613286991-611bcfb63dba?auto=format&fit=crop&w=800&q=80"}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 via-transparent to-transparent sm:hidden" />
                        <span
                          className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] uppercase font-black shadow-lg tracking-wider border-2 border-white/20 backdrop-blur-sm ${categoryStyles[item.category] || "bg-emerald-500 text-white"}`}
                        >
                          {item.category}
                        </span>
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 p-5 sm:p-6 lg:p-8 flex flex-col justify-between overflow-hidden">
                        <div className="mb-4">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{new Date(item.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</span>
                          </div>

                          <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-2 group-hover:text-teal-600 transition-colors line-clamp-2 leading-tight">
                            {item.title}
                          </h2>

                          <p className="text-slate-500 font-medium text-sm line-clamp-2 md:line-clamp-3 leading-relaxed pr-2">
                            {item.deskripsi}
                          </p>
                        </div>

                        {/* Footer Info */}
                        <div className="flex items-center justify-between pt-4 mt-auto border-t-2 border-slate-100">
                          <div className="flex items-center gap-2 min-w-0 mr-4">
                             <div className="w-8 h-8 rounded-full bg-teal-400 border-2 border-teal-500 flex shrink-0 items-center justify-center text-xs text-white font-black shadow-sm">
                                {(item.author.name || "A").charAt(0).toUpperCase()}
                             </div>
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
                                  <Pencil className="h-4 w-4" strokeWidth={2.5}/>
                                </Link>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="p-2 sm:p-2.5 rounded-xl border-2 border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition-all text-slate-400 shadow-sm hover:shadow active:-translate-y-0.5"
                                  title="Hapus berita"
                                >
                                  <Trash2 className="h-4 w-4" strokeWidth={2.5}/>
                                </button>
                              </>
                            )}
                            
                            <Link
                              href={`/news/${item.slug}`}
                              className="px-4 py-2 sm:py-2.5 rounded-xl bg-teal-50 text-teal-600 font-black border-2 border-teal-200 hover:bg-teal-400 hover:text-white hover:border-teal-500 hover:shadow-md transition-all flex items-center gap-1.5 text-xs sm:text-sm group/btn active:translate-y-0.5"
                            >
                              <span className="hidden sm:inline">Baca</span>
                              <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-0.5 transition-transform" strokeWidth={3}/>
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
      {notification && (
        <CartoonNotification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          duration={3000}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default News;