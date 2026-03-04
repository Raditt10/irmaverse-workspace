"use client";
import { useEffect, useState, useRef } from "react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import SuccessDataFound from "@/components/ui/SuccessDataFound";
import SearchInput from "@/components/ui/SearchInput";
import { 
  Star, 
  BookOpen, 
  MessageCircle, 
  SearchX, 
  RefreshCcw, 
  Heart
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import CategoryFilter from "@/components/ui/CategoryFilter";

interface Instructor {
  id: string;
  name: string;
  specialization: string;
  description: string;
  bio?: string;
  avatar: string;
  rating: number;
  studentsCount: number;
  kajianCount: number;
  tags: string[];
  verified: boolean;
  featured?: boolean;
}

const Instructors = () => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteInstructorIds, setFavoriteInstructorIds] = useState<Set<string>>(new Set());
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // State untuk Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { data: session } = useSession();
  
  const role = session?.user?.role?.toLowerCase();
  const isPrivileged = role === "admin" || role === "instruktur";

  // Menutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load instruktur & favorit dari database
  useEffect(() => {
    fetchInstructors();
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await fetch("/api/instructors/favorites");
      if (!res.ok) return;
      const data = await res.json();
      const ids = Array.isArray(data.favoriteIds) ? data.favoriteIds.map((id: any) => String(id)) : [];
      setFavoriteInstructorIds(new Set(ids));
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  const fetchInstructors = async () => {
    try {
      const res = await fetch("/api/instructors");
      if (!res.ok) throw new Error("Gagal mengambil data instruktur");
      const data = await res.json();
      
      const mapped = data.map((u: any) => ({
        id: u.id,
        name: u.name || "-",
        specialization: u.bidangKeahlian || "Umum",
        description: u.pengalaman || "Belum ada deskripsi.",
        bio: u.bio || u.bioProfile || "",
        avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name || "user"}`,
        rating: u.rating || 5.0,
        studentsCount: u.studentsCount || 0,
        kajianCount: u.kajianCount || 0,
        tags: u.tags || ["Fiqih", "Tafsir", "Hadits"],
        verified: true,
        featured: u.featured || false,
      }));
      setInstructors(mapped);
    } catch (error) {
      console.error("Error fetching instructors:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mendapatkan list spesialisasi unik untuk dropdown
  const uniqueSpecializations = ["all", ...Array.from(new Set(instructors.map(i => i.specialization)))];

  // Toggle favorite instruktur — simpan ke database
  const toggleFavorite = async (instructorId: string) => {
    const idStr = String(instructorId);
    if (togglingId === idStr) return; // prevent double click
    setTogglingId(idStr);

    // Optimistic UI update
    const newFavorites = new Set(favoriteInstructorIds);
    if (newFavorites.has(idStr)) {
      newFavorites.delete(idStr);
    } else {
      newFavorites.add(idStr);
    }
    setFavoriteInstructorIds(newFavorites);

    try {
      await fetch("/api/instructors/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructorId: idStr }),
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Rollback jika gagal
      setFavoriteInstructorIds(favoriteInstructorIds);
    } finally {
      setTogglingId(null);
    }
  };

  // Logic Filtering
  const filteredInstructors = instructors.filter((instructor) => {
    const matchesSearch = instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          instructor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = specializationFilter === "all" || instructor.specialization === specializationFilter;
    const matchesFavorite = !showFavoritesOnly || favoriteInstructorIds.has(String(instructor.id));
    
    return matchesSearch && matchesFilter && matchesFavorite;
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 w-full max-w-[100vw] overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
          <div className="max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="mb-8 lg:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight mb-2">
                  {showFavoritesOnly ? "Instruktur Favorit" : "Daftar Instruktur"}
                </h1>
                <p className="text-slate-500 font-medium text-sm lg:text-lg">
                  {showFavoritesOnly 
                    ? "Instruktur favorit yang telah kamu pilih" 
                    : "Para instruktur terbaik kami yang siap membimbing kamu!"}
                </p>
              </div>
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`hidden md:flex px-4 lg:px-6 py-3 rounded-2xl border-2 border-b-4 font-bold items-center gap-2 transition-all ${
                  showFavoritesOnly
                    ? 'bg-rose-400 border-rose-500 text-white shadow-lg hover:bg-rose-500 active:border-b-2 active:translate-y-0.5'
                    : 'bg-white border-slate-200 text-slate-600 shadow-[0_4px_0_0_#e2e8f0] hover:border-rose-300 hover:text-rose-500 active:border-b-2 active:translate-y-0.5'
                }`}
              >
                <Heart className={`h-5 w-5 ${
                  showFavoritesOnly ? 'fill-white' : 'group-hover:fill-rose-500'
                }`} strokeWidth={2.5} />
                <span className="hidden sm:inline text-sm lg:text-base">
                  {showFavoritesOnly ? "Semua Instruktur" : "Favorit"}
                </span>
              </button>
            </div>

            {/* Filter & Search Section */}
            <div className="mb-8 flex flex-col gap-4">
              <div className="w-full">
                <SearchInput
                  placeholder="Cari nama instruktur atau keahlian..."
                  value={searchTerm}
                  onChange={setSearchTerm}
                  className="w-full transition-shadow duration-300"
                />
              </div>

              {/* Porsi Kategori dan Tombol Favorit */}
              <div className="flex flex-row gap-4 items-center">
                <div className="w-full flex-1 min-w-0 pr-1 overflow-hidden">
                  <CategoryFilter
                    categories={uniqueSpecializations.map((spec) => spec === "all" ? "Semua Keahlian" : spec)}
                    subCategories={[]}
                    selectedCategory={specializationFilter === "all" ? "Semua Keahlian" : specializationFilter}
                    selectedSubCategory=""
                    onCategoryChange={(label) => {
                      const value = label === "Semua Keahlian" ? "all" : label;
                      setSpecializationFilter(value);
                    }}
                    onSubCategoryChange={() => {}}
                  />
                </div>

                {/* Mobile Favorite Button (Next to Category) */}
                <div className="md:hidden flex shrink-0">
                  <button
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className={`group p-3.5 rounded-2xl border-2 border-b-4 flex items-center justify-center transition-all ${
                      showFavoritesOnly
                        ? 'bg-rose-400 border-rose-500 shadow-lg hover:bg-rose-500 active:border-b-2 active:translate-y-0.5'
                        : 'bg-white border-slate-200 shadow-[0_4px_0_0_#e2e8f0] hover:border-rose-300 active:border-b-2 active:translate-y-0.5'
                    }`}
                  >
                    <Heart className={`h-6 w-6 transition-colors ${
                      showFavoritesOnly ? 'fill-white text-white' : 'text-slate-400 group-hover:fill-rose-500 group-hover:text-rose-500'
                    }`} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
               <div className="text-center py-20">
                 <Loading text="Memuat data instruktur..." />
               </div>
            ) : (
              <>
                {filteredInstructors.length === 0 ? (
                  /* ---- EMPTY STATE ---- */
                  <EmptyState
                    icon="search"
                    title="Yah, instruktur tidak ditemukan..."
                    description="Coba cari dengan kata kunci lain atau ubah filter keahliannya ya!"
                    actionLabel="Reset Pencarian"
                    onAction={() => { setSearchTerm(""); setSpecializationFilter("all"); }}
                  />
                ) : (
                  <>
                    {/* ---- SUCCESS HEADER ---- */}
                    {(searchTerm || specializationFilter !== "all" || showFavoritesOnly) && (
                      <div className="mb-8">
                        <SuccessDataFound 
                          message={`Hore! Ditemukan ${filteredInstructors.length} instruktur yang cocok!`}
                        />
                      </div>
                    )}

                    {/* ---- GRID CONTENT ---- */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                      {filteredInstructors.map((instructor) => (
                        <div
                          key={instructor.id}
                          className={`bg-white rounded-3xl md:rounded-[2.5rem] border-2 transition-all duration-300 overflow-hidden group hover:-translate-y-2 flex flex-col relative ${
                            instructor.featured 
                            ? 'border-amber-400 shadow-[0_4px_0_0_#fbbf24] md:shadow-[0_8px_0_0_#fbbf24]' 
                            : 'border-slate-200 shadow-[0_4px_0_0_#cbd5e1] md:shadow-[0_8px_0_0_#cbd5e1] hover:border-emerald-400 hover:shadow-[0_4px_0_0_#34d399] md:hover:shadow-[0_8px_0_0_#34d399]'
                          }`}
                        >
                          {/* Featured Badge & Favorite Button */}
                          <div className="absolute top-5 right-5 z-10 flex gap-2 items-center">
                            {instructor.featured && (
                              <div className="bg-amber-400 text-white text-[10px] font-black px-3 py-1 rounded-full border-2 border-amber-500 shadow-sm flex items-center gap-1 animate-pulse">
                                <Star className="w-3 h-3 fill-white" strokeWidth={3} />
                                <span>POPULER</span>
                              </div>
                            )}
                            <button
                              onClick={() => toggleFavorite(instructor.id)}
                              className="bg-white border-2 border-slate-200 rounded-full p-1.5 md:p-2.5 shadow-sm md:shadow-md hover:bg-rose-50 hover:border-rose-300 transition-all hover:-translate-y-1"
                            >
                                <Heart 
                                  className={`h-5 w-5 transition-colors ${
                                    favoriteInstructorIds.has(String(instructor.id))
                                      ? 'fill-rose-500 text-rose-500'
                                      : 'text-slate-400 hover:text-rose-400'
                                  }`} 
                                  strokeWidth={2.5} 
                                />
                            </button>
                          </div>

                          <div className="p-4 md:p-6 lg:p-8 flex-1 flex flex-col">
                            {/* Avatar Section */}
                            <div className="flex justify-center mb-4 mt-2">
                              <div className="relative group-hover:scale-105 transition-transform duration-500">
                                <div className={`w-16 h-16 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden border-[3px] md:border-4 shadow-lg mx-auto ${
                                   instructor.featured ? 'border-amber-200' : 'border-teal-100'
                                }`}>
                                  <img
                                    src={instructor.avatar}
                                    alt={instructor.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Name & Specialization */}
                            <div className="text-center mb-3">
                              <h3 className="text-sm md:text-lg lg:text-xl font-black text-slate-800 mb-1 leading-tight line-clamp-1">
                                {instructor.name}
                              </h3>
                              <p className="text-teal-600 text-[8px] md:text-[10px] font-bold uppercase tracking-wider bg-teal-50 px-2 py-0.5 md:px-3 md:py-1 rounded-full inline-block border border-teal-100">
                                {instructor.specialization}
                              </p>
                            </div>

                            {/* Description */}
                            <p className="text-slate-500 text-[10px] md:text-sm text-center mb-4 md:mb-6 line-clamp-2 font-medium px-1 md:px-2 leading-relaxed">
                              {instructor.description}
                            </p> 

                            {/* Stats Widget */}
                            <div className="grid grid-cols-2 gap-0 mb-4 md:mb-6 bg-slate-50 rounded-xl md:rounded-2xl border-2 border-slate-100 overflow-hidden">
                              <div className="py-2 md:py-3 text-center border-r-2 border-slate-200 hover:bg-slate-100 transition-colors">
                                <div className="flex items-center justify-center gap-1 text-amber-500 mb-0.5">
                                  <Star className="h-3 w-3 md:h-4 md:w-4 fill-current" />
                                  <span className="font-black text-xs md:text-lg text-slate-700">{instructor.rating}</span>
                                </div>
                                <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rating</p>
                              </div>
                              <div className="py-2 md:py-3 text-center hover:bg-slate-100 transition-colors">
                                <div className="flex items-center justify-center gap-1 mb-0.5">
                                  <span className="font-black text-xs md:text-lg text-slate-700">{instructor.kajianCount}</span>
                                </div>
                                <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kajian</p>
                              </div>
                            </div>

                            {/* Bio Section */}
                            <div className="mb-4 md:mb-6 p-2 md:p-4 rounded-xl md:rounded-2xl bg-slate-50 border border-slate-200 min-h-12 md:min-h-20 flex items-center justify-center">
                              <p className="text-slate-500 text-[8px] md:text-sm font-medium text-center leading-relaxed">
                                {instructor.bio && instructor.bio.trim() !== ""
                                  ? instructor.bio
                                  : "Instruktur ini belum membuat bio profile di akun nya"}
                              </p>
                            </div>

                            {/* Buttons */}
                            <div className="space-y-2 md:space-y-3 mt-auto">
                              {session?.user?.id !== instructor.id ? (
                                <>
                                  {!isPrivileged && (
                                    <Link
                                      href={`/instructors/chat?instructorId=${encodeURIComponent(instructor.id)}`}
                                      className="w-full py-2 md:py-3.5 rounded-xl md:rounded-2xl bg-teal-400 text-white font-black border-2 border-teal-600 border-b-4 hover:bg-teal-500 hover:shadow-lg hover:shadow-teal-200 active:border-b-2 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 md:gap-2 group/btn shadow-sm md:shadow-lg text-[10px] md:text-base"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5 md:w-5 md:h-5 group-hover/btn:animate-bounce" strokeWidth={2.5} />
                                      Mulai Chat
                                    </Link>
                                  )}
                                  
                                  <button className="w-full py-2 md:py-3.5 rounded-xl md:rounded-2xl bg-white text-slate-600 font-bold border-2 border-slate-200 border-b-4 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 active:border-b-2 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 md:gap-2 text-[10px] md:text-base">
                                    <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={2.5} />
                                    Lihat Kajian
                                  </button>
                                </>
                              ) : (
                                <button className="w-full py-2 md:py-3.5 rounded-xl md:rounded-2xl bg-teal-400 text-white font-black border-2 border-teal-600 border-b-4 hover:bg-teal-500 active:border-b-2 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 text-[10px] md:text-base">
                                  Lihat Profile Saya
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <ChatbotButton />
    </div>
  );
};

export default Instructors;