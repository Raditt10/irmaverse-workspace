"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  X, 
  Newspaper, 
  GraduationCap, 
  ArrowRight, 
  SearchX,
  BookOpen,
  Trophy,
  CalendarDays,
  HelpCircle,
  Layers,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";
import debounce from "lodash/debounce";

interface SearchResult {
  id: string;
  type: "news" | "material" | "instructor" | "program" | "competition" | "schedule" | "quiz";
  title: string;
  slug?: string;
  description?: string;
  image?: string;
  category?: string;
  grade?: string;
  date?: string;
  location?: string;
  time?: string;
  pemateri?: string;
  status?: string;
  prize?: string;
  instructorName?: string;
  bidangKeahlian?: string;
  pengalaman?: string;
  materialId?: string;
  materialTitle?: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string; borderColor: string; hoverBg: string; hoverBorder: string; badgeBg: string; badgeText: string }> = {
  news:        { label: "Berita & Artikel", icon: Newspaper,    color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", hoverBg: "hover:bg-emerald-50/60", hoverBorder: "hover:border-emerald-400", badgeBg: "bg-emerald-100", badgeText: "text-emerald-700" },
  material:    { label: "Kajian",           icon: BookOpen,     color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", hoverBg: "hover:bg-emerald-50/60", hoverBorder: "hover:border-emerald-400", badgeBg: "bg-emerald-100", badgeText: "text-emerald-700" },
  instructor:  { label: "Instruktur",       icon: GraduationCap, color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", hoverBg: "hover:bg-emerald-50/60", hoverBorder: "hover:border-emerald-400", badgeBg: "bg-emerald-100", badgeText: "text-emerald-700" },
  program:     { label: "Program",          icon: Layers,       color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", hoverBg: "hover:bg-emerald-50/60", hoverBorder: "hover:border-emerald-400", badgeBg: "bg-emerald-100", badgeText: "text-emerald-700" },
  competition: { label: "Kompetisi",        icon: Trophy,       color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", hoverBg: "hover:bg-emerald-50/60", hoverBorder: "hover:border-emerald-400", badgeBg: "bg-emerald-100", badgeText: "text-emerald-700" },
  schedule:    { label: "Jadwal",           icon: CalendarDays, color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", hoverBg: "hover:bg-emerald-50/60", hoverBorder: "hover:border-emerald-400", badgeBg: "bg-emerald-100", badgeText: "text-emerald-700" },
  quiz:        { label: "Kuis",             icon: HelpCircle,   color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", hoverBg: "hover:bg-emerald-50/60", hoverBorder: "hover:border-emerald-400", badgeBg: "bg-emerald-100", badgeText: "text-emerald-700" },
};

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const performSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        setResults(data.results || []);
        setIsOpen(true);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value.length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
    performSearch(value);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case "news":
        router.push(`/news/${result.slug}`);
        break;
      case "material":
        router.push(`/materials/${result.id}`);
        break;
      case "instructor":
        router.push(`/instructors`);
        break;
      case "program":
        router.push(`/programs/${result.id}`);
        break;
      case "competition":
        router.push(`/competitions/${result.id}`);
        break;
      case "schedule":
        router.push(`/schedule/${result.id}`);
        break;
      case "quiz":
        if (result.materialId) {
          router.push(`/quiz/${result.materialId}`);
        } else {
          router.push(`/quiz/standalone`);
        }
        break;
    }
    handleClear();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Group results by type, maintaining order
  const typeOrder: SearchResult["type"][] = ["material", "news", "instructor", "program", "competition", "schedule", "quiz"];
  const groupedResults = typeOrder
    .map((type) => ({
      type,
      items: results.filter((r) => r.type === type),
    }))
    .filter((group) => group.items.length > 0);

  const totalResults = results.length;

  const getSubtext = (result: SearchResult) => {
    switch (result.type) {
      case "news":
        return result.category || "Berita";
      case "material":
        return [result.instructorName, result.category, result.location].filter(Boolean).join(" · ");
      case "instructor":
        return result.bidangKeahlian || "Instruktur";
      case "program":
        return [result.instructorName, result.category].filter(Boolean).join(" · ");
      case "competition":
        return [result.location, result.prize].filter(Boolean).join(" · ");
      case "schedule":
        return [result.pemateri, result.time, result.location].filter(Boolean).join(" · ");
      case "quiz":
        return result.materialTitle ? `Kajian: ${result.materialTitle}` : "Kuis Mandiri";
      default:
        return "";
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center group-focus-within:bg-emerald-500 group-focus-within:border-emerald-600 transition-all duration-300">
          <Search 
            className="h-4 w-4 text-emerald-500 group-focus-within:text-white transition-colors duration-300" 
            strokeWidth={2.5} 
          />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Cari kajian, berita, instruktur, program..."
          className="w-full pl-15 pr-12 py-3.5 rounded-2xl border-2 border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:bg-white focus:shadow-[0_4px_12px_rgba(52,211,153,0.15)] transition-all font-bold text-sm"
        />
        
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all"
          >
            <X className="h-3.5 w-3.5" strokeWidth={3} />
          </button>
        )}
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl border-2 border-slate-200 shadow-[0_8px_0_0_#e2e8f0] z-50 max-h-[500px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {isLoading ? (
            <div className="p-10 text-center">
              <div className="inline-flex flex-col items-center gap-3">
                <div className="relative h-12 w-12">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                  <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-emerald-500 animate-pulse" />
                </div>
                <span className="font-black text-slate-600 text-sm">Mencari...</span>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center">
              <div className="h-20 w-20 bg-slate-50 rounded-3xl border-2 border-slate-200 border-b-4 flex items-center justify-center mb-4">
                <SearchX className="h-10 w-10 text-slate-300" strokeWidth={2} />
              </div>
              <p className="text-slate-700 font-black text-lg">Ups, tidak ditemukan!</p>
              <p className="text-slate-400 text-xs mt-1 font-medium max-w-[200px]">Coba kata kunci lain atau periksa ejaan ya</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[480px] scrollbar-thin scrollbar-thumb-slate-200">
              {/* Results Header */}
              <div className="sticky top-0 z-10 px-5 py-3 bg-white/95 backdrop-blur-sm border-b-2 border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Search className="h-3 w-3 text-emerald-600" strokeWidth={3} />
                  </div>
                  <span className="text-xs font-black text-slate-500">
                    {totalResults} hasil ditemukan
                  </span>
                </div>
                <div className="flex gap-1">
                  {groupedResults.map(({ type }) => {
                    const cfg = TYPE_CONFIG[type];
                    const Icon = cfg.icon;
                    return (
                      <div key={type} className={`h-6 w-6 rounded-lg ${cfg.bgColor} flex items-center justify-center`} title={cfg.label}>
                        <Icon className={`h-3 w-3 ${cfg.color}`} strokeWidth={2.5} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Grouped Results */}
              <div className="py-2">
                {groupedResults.map(({ type, items }, groupIdx) => {
                  const cfg = TYPE_CONFIG[type];
                  const Icon = cfg.icon;
                  return (
                    <div key={type} className={groupIdx > 0 ? "mt-1" : ""}>
                      {/* Section Header */}
                      <div className="px-5 py-2 flex items-center gap-2">
                        <div className={`h-5 w-5 rounded-md ${cfg.bgColor} ${cfg.borderColor} border flex items-center justify-center`}>
                          <Icon className={`h-2.5 w-2.5 ${cfg.color}`} strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cfg.label}</span>
                        <span className={`text-[9px] font-bold ${cfg.badgeText} ${cfg.badgeBg} px-1.5 py-0.5 rounded-md`}>{items.length}</span>
                        <div className="flex-1 h-px bg-slate-100 ml-2"></div>
                      </div>

                      {/* Items */}
                      {items.map((result) => {
                        const subtext = getSubtext(result);
                        return (
                          <button
                            key={result.id}
                            onClick={() => handleResultClick(result)}
                            className={`w-full px-5 py-3 ${cfg.hoverBg} text-left transition-all flex items-center gap-3 group/item border-l-4 border-transparent ${cfg.hoverBorder}`}
                          >
                            {/* Thumbnail / Icon */}
                            {result.image ? (
                              <img
                                src={result.image}
                                alt={result.title}
                                className={`h-10 w-10 rounded-xl object-cover border-2 ${cfg.borderColor} shadow-sm shrink-0`}
                              />
                            ) : (
                              <div className={`h-10 w-10 rounded-xl ${cfg.bgColor} border-2 ${cfg.borderColor} flex items-center justify-center shrink-0`}>
                                <Icon className={`h-5 w-5 ${cfg.color}`} strokeWidth={2} />
                              </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-slate-800 leading-tight line-clamp-1 group-hover/item:text-slate-900 transition-colors">
                                {result.title}
                              </div>
                              {subtext && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  {result.type === "material" && result.location && (
                                    <MapPin className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                                  )}
                                  {result.type === "schedule" && result.time && (
                                    <Clock className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                                  )}
                                  <span className="text-[11px] text-slate-500 font-medium truncate">{subtext}</span>
                                </div>
                              )}
                            </div>

                            {/* Category badge */}
                            {result.category && (
                              <span className={`hidden sm:inline-block text-[9px] font-bold ${cfg.badgeText} ${cfg.badgeBg} px-2 py-0.5 rounded-md border ${cfg.borderColor} uppercase tracking-wide shrink-0`}>
                                {result.category}
                              </span>
                            )}

                            <ArrowRight className={`h-4 w-4 text-slate-200 group-hover/item:${cfg.color} shrink-0 -translate-x-2 opacity-0 group-hover/item:translate-x-0 group-hover/item:opacity-100 transition-all duration-300`} />
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}