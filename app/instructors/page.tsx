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
  Heart,
  Contact,
  GraduationCap,
  Users
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import CategoryFilter from "@/components/ui/CategoryFilter";
import PageBanner from "@/components/ui/PageBanner";

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
  const isPrivileged = role === "admin" || role === "instruktur" || role === "super_admin";

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
        bio: u.bio || "",
        avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name || "user"}`,
        rating: u.rating ?? 0,
        studentsCount: u.studentsCount || 0,
        kajianCount: u.kajianCount ?? 0,
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
            <PageBanner
              title={showFavoritesOnly ? "Instruktur Favorit" : "Daftar Instruktur"}
              description={showFavoritesOnly 
                ? "Instruktur favorit yang telah kamu pilih" 
                : "Para instruktur terbaik kami yang siap membimbing kamu!"}
              icon={Contact}
              tag="Instruktur"
              tagIcon={Contact}
            />

            <div className="mb-6 flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="w-full max-w-md">
                  <SearchInput
                    placeholder="Cari nama instruktur atau keahlian..."
                    value={searchTerm}
                    onChange={setSearchTerm}
                    className="w-full transition-shadow duration-300 rounded-xl"
                  />
                </div>

                {/* Desktop Favorite Toggle (Aligned with Search) */}
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`hidden md:flex px-6 py-3 rounded-2xl border-2 border-b-4 font-black items-center gap-2 transition-all shadow-lg ${
                    showFavoritesOnly
                      ? 'bg-emerald-400 border-emerald-500 text-white hover:bg-emerald-500 active:border-b-2 active:translate-y-0.5'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-500 active:border-b-2 active:translate-y-0.5 shadow-[0_4px_0_0_#e2e8f0]'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${
                    showFavoritesOnly ? 'fill-white' : 'group-hover:fill-emerald-500'
                  }`} strokeWidth={2.5} />
                  <span className="text-sm lg:text-base">
                    {showFavoritesOnly ? "Lihat Semua" : "Filter Favorit"}
                  </span>
                </button>
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
                        ? 'bg-emerald-400 border-emerald-500 shadow-lg hover:bg-emerald-500 active:border-b-2 active:translate-y-0.5'
                        : 'bg-white border-slate-200 shadow-[0_4px_0_0_#e2e8f0] hover:border-emerald-300 active:border-b-2 active:translate-y-0.5'
                    }`}
                  >
                    <Heart className={`h-6 w-6 transition-colors ${
                      showFavoritesOnly ? 'fill-white text-white' : 'text-slate-400 group-hover:fill-emerald-500 group-hover:text-emerald-500'
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8 lg:gap-10">
                      {filteredInstructors.map((instructor) => (
                        <div
                          key={instructor.id}
                          className={`bg-white rounded-[2rem] border-2 transition-all duration-500 group hover:-translate-y-2 flex flex-col relative overflow-hidden ${
                            instructor.featured 
                            ? 'border-emerald-400 shadow-[0_8px_20px_rgba(52,211,153,0.12)]' 
                            : 'border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:border-emerald-200 hover:shadow-[0_12px_30px_rgba(0,0,0,0.05)]'
                          }`}
                        >
                          {/* Featured Badge & Favorite Button */}
                          {/* Favorite Button */}
                          <div className="absolute top-5 right-5 z-20">
                            <button
                              onClick={() => toggleFavorite(instructor.id)}
                              className="bg-white/80 backdrop-blur-sm border-2 border-slate-100 rounded-full p-2 shadow-sm hover:bg-emerald-50 hover:border-emerald-200 transition-all hover:scale-110 active:scale-95"
                            >
                                <Heart 
                                  className={`h-4 w-4 transition-colors ${
                                    favoriteInstructorIds.has(String(instructor.id))
                                      ? 'fill-emerald-500 text-emerald-500'
                                      : 'text-slate-300 hover:text-emerald-400'
                                  }`} 
                                  strokeWidth={2.5} 
                                />
                            </button>
                          </div>

                          <div className="p-5 sm:p-6 flex-1 flex flex-col items-center">
                            {/* Avatar Section */}
                            <div className="relative mb-4">
                              <div className="absolute inset-0 bg-emerald-100 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                              <div className={`relative w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-xl group-hover:scale-110 transition-transform duration-500 overflow-hidden ${
                                instructor.featured ? 'ring-4 ring-emerald-100' : 'ring-2 ring-slate-50'
                              }`}>
                                <img
                                  src={instructor.avatar}
                                  alt={instructor.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              
                              {instructor.featured && (
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full border-2 border-white shadow-md whitespace-nowrap z-10">
                                  TOP INSTRUCTOR
                                </div>
                              )}
                            </div>

                            {/* Name & Role */}
                            <div className="text-center mb-4">
                              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 mb-1 tracking-tight group-hover:text-emerald-600 transition-colors">
                                {instructor.name}
                              </h3>
                              <span className="px-3 py-0.5 sm:py-1 rounded-full bg-emerald-50 text-emerald-600 text-[8px] sm:text-[9px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                                {instructor.specialization || "Instruktur"}
                              </span>
                            </div>

                            {/* Premium Stats Bar - Similar to Member XP bar */}
                            <div className="w-full bg-slate-50/80 rounded-xl border-2 border-slate-100 p-3 mb-6 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all duration-300">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-white border-2 border-slate-100 flex items-center justify-center text-emerald-500 shadow-sm group-hover:border-emerald-200 transition-all">
                                    <Star className="w-4 h-4 fill-current" />
                                  </div>
                                  <div className="text-left">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0">Rating</p>
                                    <p className="font-black text-slate-700 text-sm leading-none">{instructor.rating || "5.0"}</p>
                                  </div>
                                </div>
                                <div className="h-8 w-0.5 bg-slate-200/50 group-hover:bg-emerald-200/50 transition-colors" />
                                <div className="flex items-center gap-2.5">
                                  <div className="text-right">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0 whitespace-nowrap">Total Kajian</p>
                                    <p className="font-black text-slate-700 text-sm leading-none">{instructor.kajianCount || 0}</p>
                                  </div>
                                  <div className="w-8 h-8 rounded-lg bg-white border-2 border-slate-100 flex items-center justify-center text-teal-500 shadow-sm group-hover:border-emerald-200 transition-all">
                                    <GraduationCap className="w-4 h-4" />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Description/Bio Preview */}
                            <p className="text-slate-500 text-sm text-center mb-8 line-clamp-2 font-medium px-4 leading-relaxed italic">
                              {instructor.bio && instructor.bio.trim() !== ""
                                ? `"${instructor.bio}"`
                                : instructor.description}
                            </p>

                            {/* Footer Action - Member Style Profile Button */}
                            <div className="w-full mt-auto pt-4 border-t border-slate-50 group-hover:border-emerald-50 transition-colors space-y-3">
                              <Link
                                href={`/u/${instructor.id}`}
                                className="w-full py-3 rounded-xl bg-white text-slate-600 font-black border-2 border-slate-100 shadow-[0_4px_0_0_#f1f5f9] hover:bg-slate-50 hover:border-slate-300 hover:shadow-none hover:translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2.5 text-xs group/profile"
                              >
                                <Contact className="w-4 h-4 text-slate-400 group-hover/profile:text-emerald-500 transition-colors" />
                                Profile
                              </Link>

                              {/* Secondary Chat Action - Always visible on mobile, hover on desktop */}
                              {session?.user?.id !== instructor.id && !isPrivileged && (
                                <Link
                                  href={`/instructors/chat?instructorId=${encodeURIComponent(instructor.id)}`}
                                  className="w-full py-3 rounded-xl bg-teal-50 text-teal-600 font-black border-2 border-teal-100 hover:bg-teal-100 hover:border-teal-200 transition-all flex items-center justify-center gap-2 text-xs md:opacity-0 md:group-hover:opacity-100 md:translate-y-2 md:group-hover:translate-y-0 duration-300"
                                >
                                  <MessageCircle className="w-4 h-4 text-teal-500" strokeWidth={2.5} />
                                  Kirim Pesan
                                </Link>
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