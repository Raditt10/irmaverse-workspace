"use client"
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/ui/SearchBar";
import {
  ArrowRight,
  Award,
  BookMarked,
  Calendar,
  CalendarDays,
  Camera,
  MessageCircleQuestion,
  ChevronLeft,
  ChevronRight,
  Clock,
  Contact,
  Facebook,
  GraduationCap,
  Heart,
  HelpCircle,
  Instagram,
  LayoutGrid,
  Mail,
  MapPin,
  MessageSquare,
  Newspaper,
  Phone,
  Shield,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Youtube,
  Zap,
} from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [latestNews, setLatestNews] = useState<Array<{ id: string; title: string; category: string | null; deskripsi?: string; slug: string; image?: string | null }>>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [stats, setStats] = useState({ totalMembers: 0, totalInstructors: 0 });
  // State untuk Galeri
  const [currentSlide, setCurrentSlide] = useState(0);

  // Redirect instruktur ke /academy
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "instruktur") {
      router.replace("/academy");
    }
  }, [status, session, router]);

  // Data Gambar Galeri
  const galleryItems = [
    {
      src: "https://picsum.photos/seed/kegiatan1/800/400",
      title: "Kajian Akbar Bulanan",
      description: "Serunya belajar bersama ustadz tamu di Masjid Sekolah."
    },
    {
      src: "https://picsum.photos/seed/kegiatan2/800/400",
      title: "Rihlah Alam Terbuka",
      description: "Mentadaburi alam sambil mempererat ukhuwah antar anggota."
    },
    {
      src: "https://picsum.photos/seed/kegiatan3/800/400",
      title: "Latihan Marawis",
      description: "Persiapan penampilan untuk acara perpisahan sekolah."
    },
    {
      src: "https://picsum.photos/seed/kegiatan4/800/400",
      title: "Bakti Sosial IRMA",
      description: "Berbagi kebahagiaan dengan masyarakat sekitar sekolah."
    }
  ];

  // Auto slide logic
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setGalleryLoading(true);
      setCurrentSlide((prev) => (prev + 1) % galleryItems.length);
    }, 5000);
    return () => clearInterval(slideInterval);
  }, [galleryItems.length]);

  const nextSlide = () => {
    setGalleryLoading(true);
    setCurrentSlide((prev) => (prev + 1) % galleryItems.length);
  };

  const prevSlide = () => {
    setGalleryLoading(true);
    setCurrentSlide((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
  };

  const features = [
    {
      icon: LayoutGrid,
      title: "Dashboard",
      description: "Pantau seluruh aktivitas dan progres IRMA Anda",
      gradient: "from-emerald-400 to-teal-500",
    },
    {
      icon: Calendar,
      title: "Jadwal Kajian",
      description: "Lihat jadwal kajian mingguan per kelas",
      gradient: "from-green-400 to-emerald-500",
    },
    {
      icon: BookMarked,
      title: "Rekapan Materi",
      description: "Akses rangkuman materi yang telah dipelajari",
      gradient: "from-teal-400 to-green-500",
    },
    {
      icon: HelpCircle,
      title: "Kuis",
      description: "Uji pemahaman materi dengan kuis interaktif",
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      icon: MessageSquare,
      title: "Forum Diskusi",
      description: "Diskusikan topik kajian bersama anggota",
      gradient: "from-green-500 to-emerald-600",
    },
    {
      icon: Award,
      title: "Peringkat",
      description: "Lihat papan peringkat anggota terbaik",
      gradient: "from-teal-500 to-green-600",
    },
    {
      icon: CalendarDays,
      title: "Kegiatan",
      description: "Info jadwal event dan kegiatan IRMA",
      gradient: "from-emerald-400 to-green-400",
    },
    {
      icon: GraduationCap,
      title: "Program Kurikulum",
      description: "Kurikulum pembelajaran yang terstruktur",
      gradient: "from-green-400 to-teal-400",
    },
    {
      icon: Trophy,
      title: "Info Perlombaan",
      description: "Informasi lomba dan kompetisi terbaru",
      gradient: "from-teal-500 to-emerald-500",
    },
    {
      icon: Contact,
      title: "Instruktur",
      description: "Kenali instruktur dan pemateri kajian",
      gradient: "from-emerald-600 to-green-600",
    },
    {
      icon: Users,
      title: "Daftar Anggota",
      description: "Lihat seluruh daftar anggota IRMA",
      gradient: "from-green-500 to-teal-500",
    },
    {
      icon: Newspaper,
      title: "Berita IRMA",
      description: "Baca berita dan artikel terbaru",
      gradient: "from-teal-400 to-emerald-600",
    },
  ];

  const benefits = [
    {
      icon: Shield,
      title: "Terorganisir dengan Baik",
      description:
        "Sistem yang terstruktur untuk mengelola seluruh kegiatan IRMA dengan efisien",
    },
    {
      icon: Clock,
      title: "Hemat Waktu",
      description:
        "Akses informasi kapan saja, di mana saja tanpa perlu hadir secara fisik",
    },
    {
      icon: TrendingUp,
      title: "Tracking Progress",
      description:
        "Pantau perkembangan pembelajaran dan pencapaian pribadi secara real-time",
    },
    {
      icon: Heart,
      title: "Komunitas Solid",
      description: "Membangun ikatan yang kuat dengan sesama anggota IRMA",
    },
  ];

  const today = new Date();
  const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const bulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const tanggalStr = `${hari[today.getDay()]}, ${today.getDate()} ${
    bulan[today.getMonth()]
  } ${today.getFullYear()}`;

  const [userLocation, setUserLocation] = useState<string>("Lokasi tidak diketahui");
  
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await res.json();
            setUserLocation(
              data.address.city ||
                data.address.town ||
                data.address.village ||
                data.address.state ||
                data.display_name ||
                "Lokasi ditemukan"
            );
          } catch {
            setUserLocation("Lokasi ditemukan");
          }
        },
        () => setUserLocation("Lokasi tidak diketahui")
      );
    }
  }, []);

  useEffect(() => {
    const fetchNews = async () => {
      setNewsLoading(true);
      try {
        const res = await fetch("/api/news");
        const data = await res.json();
        if (Array.isArray(data)) {
          setLatestNews(data.slice(0, 4));
        }
      } catch (error) {
        console.error("Failed to load news", error);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchNews();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/public/stats");
        const data = await res.json();
        if (data.totalMembers !== undefined) {
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats", error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-700 via-teal-600 to-cyan-500 text-white relative">
      {/* Background patterns */}
      <div
        className="absolute inset-0 opacity-35 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.22), transparent 38%), radial-gradient(circle at 78% 12%, rgba(59,130,246,0.28), transparent 32%), radial-gradient(circle at 68% 72%, rgba(16,185,129,0.42), transparent 32%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      <div className="relative w-full">
        {/* Top Info Bar */}
        <div className="flex items-center justify-between py-2 sm:py-4 px-3 sm:px-6 lg:px-8 text-sm text-white/80 max-w-7xl mx-auto">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-[10px] sm:text-sm font-semibold">{tanggalStr}</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-white/70">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{userLocation}</span>
          </div>
        </div>

        {/* Header & Hero Section */}
        <div className="flex flex-col gap-3 sm:gap-4 pb-8 sm:pb-12">
          {/* Navbar */}
          <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 sm:gap-3 hover:scale-105 transition-transform duration-300">
              {/* LOGO CARD */}
              <img 
                src="/logo.webp" 
                alt="IRMA Verse" 
                className="h-9 w-9 sm:h-12 sm:w-12 object-contain drop-shadow-md" 
              />
              <div>
                <p className="text-[9px] sm:text-xs uppercase tracking-[0.15em] text-white/70 font-bold">Platform Rohis</p>
                <h1 className="text-base sm:text-2xl font-extrabold leading-tight" style={{ textShadow: "2px 2px 0px rgba(0,0,0,0.1)" }}>IrmaVerse</h1>
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-white/90">
              {['Beranda', 'Fitur', 'Galeri', 'FAQ', 'Kontak'].map((item) => {
                const sectionId = item.toLowerCase();
                const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  if (sectionId === 'beranda') {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  } else {
                    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
                  }
                };
                return (
                  <Link 
                    key={item} 
                    href={`#${sectionId}`} 
                    onClick={handleClick}
                    className="hover:text-white hover:scale-110 transition-all hover:drop-shadow-[0_2px_0_rgba(0,0,0,0.2)]"
                  >
                    {item}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-2 text-white/70">
                <Instagram className="h-5 w-5 hover:scale-125 transition-transform cursor-pointer hover:text-white" />
                <Youtube className="h-5 w-5 hover:scale-125 transition-transform cursor-pointer hover:text-white" />
                <Facebook className="h-5 w-5 hover:scale-125 transition-transform cursor-pointer hover:text-white" />
              </div>
              <Link href="/auth">
                <button className="relative overflow-hidden px-4 sm:px-7 py-2 text-xs sm:text-sm font-bold rounded-2xl border-b-4 border-emerald-600 bg-white text-emerald-700 shadow-xl group transition-all duration-300 active:translate-y-1 hover:scale-105">
                  <span className="flex items-center gap-1.5 sm:gap-2 z-10 relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 stroke-[3px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span>Login</span>
                  </span>
                </button>
              </Link>
            </div>
          </div>

          {/* Hero Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center pt-4 sm:pt-8 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8">
            <div className="space-y-4 sm:space-y-6 z-10">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white/20 border-2 border-white/30 text-white text-[10px] sm:text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] transform -rotate-1 hover:rotate-0 transition-all">
                Official Website <span className="text-emerald-100 bg-emerald-600 px-1 rounded text-[10px] sm:text-sm">IrmaVerse</span>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-base font-bold text-white/80 tracking-wide">ROHIS DIGITAL SEKOLAH</p>
                <h2 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold leading-tight drop-shadow-[4px_4px_0px_rgba(0,0,0,0.15)]">
                  IRMA <span className="bg-linear-to-r from-emerald-200 via-white to-cyan-200 bg-clip-text text-transparent">VERSE</span>
                </h2>
              </div>

              <p className="text-xs sm:text-base text-white/90 font-medium leading-relaxed max-w-lg drop-shadow-sm">
                Platform digital yang menghubungkan seluruh anggota IRMA dengan sistem terorganisir, modern, dan efisien untuk pembelajaran Islami yang lebih baik.
              </p>

              <div className="w-full max-w-md bg-white/20 rounded-2xl p-1.5 sm:p-2 border-2 border-white/20 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] backdrop-blur-sm">
                <SearchBar limitTypes={["news", "schedule"]} />
              </div>

              <div className="bg-white border-[3px] border-emerald-200 rounded-2xl sm:rounded-3xl shadow-[5px_5px_0px_0px_rgba(0,0,0,0.12)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] p-3 sm:p-4 max-w-60 sm:max-w-xs transform hover:scale-105 hover:-rotate-1 transition-all duration-300 cursor-pointer">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-1.5 sm:p-2 bg-slate-50 rounded-xl sm:rounded-2xl border-2 border-slate-100">
                    <img src="/logo.webp" alt="Logo" className="h-8 sm:h-10 w-auto object-contain" />
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-extrabold text-emerald-600 uppercase tracking-tight">Platform Rohis</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800">IrmaVerse</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mt-8 lg:mt-0 hidden lg:flex justify-center lg:justify-end">
               <div className="absolute inset-0 bg-emerald-400/20 blur-[80px] rounded-full pointer-events-none" />
               <img
                src="/model.webp"
                alt="Role model IRMA"
                className="relative h-75 sm:h-100 lg:h-150 w-auto object-contain z-0 hover:scale-105 transition-transform duration-500"
                style={{ 
                  filter: "drop-shadow(5px 5px 0px #ffffff) drop-shadow(15px 15px 0px rgba(0,0,0,0.25))" 
                }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Menu Icons Section - Cartoon Style */}
      <section id="fitur" className="py-14 sm:py-20 relative bg-white overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-100/40 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-teal-100/40 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-emerald-50/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-8 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 sm:mb-6 bg-emerald-50 border-[3px] border-emerald-200 rounded-2xl shadow-[4px_4px_0px_0px_rgba(16,185,129,0.25)] transform -rotate-2 hover:rotate-0 transition-all duration-300">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 stroke-[3px]" />
              <span className="text-xs sm:text-sm font-extrabold text-emerald-700 uppercase tracking-wider">Menu Utama</span>
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent mb-2 sm:mb-4 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)] relative z-10">Fitur Tersedia</h2>
            <p className="text-sm sm:text-lg text-slate-500 font-bold max-w-md mx-auto">Semua yang kamu butuhkan untuk aktivitas IRMA 🚀</p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-5 lg:gap-6">
            {features.map((feature, index) => {
              const hoverRotate = index % 2 === 0 ? "hover:-rotate-3" : "hover:rotate-3";
              return (
                <div
                  key={index}
                  className={`group cursor-pointer flex flex-col items-center bg-white rounded-2xl sm:rounded-3xl border-[3px] border-slate-100 hover:border-emerald-300 p-2.5 sm:p-4 transition-all duration-300 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.08)] hover:shadow-[6px_6px_0px_0px_rgba(16,185,129,0.25)] hover:-translate-y-2 ${hoverRotate}`}
                >
                  <div className={`w-11 h-11 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-linear-to-br ${feature.gradient} flex items-center justify-center border-b-[3px] sm:border-b-4 border-black/15 mb-1.5 sm:mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-5 w-5 sm:h-7 sm:w-7 text-white stroke-[2.5px] drop-shadow-[1px_1px_0px_rgba(0,0,0,0.3)]" />
                  </div>
                  <p className="text-[10px] sm:text-[13px] font-extrabold text-slate-700 text-center leading-tight group-hover:text-emerald-600 transition-colors duration-300">
                    {feature.title}
                  </p>
                  <p className="hidden sm:block text-[10px] text-slate-400 font-semibold mt-1 leading-snug text-center line-clamp-2">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-white/5" />
        <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 mb-4 sm:mb-6 bg-white/20 border-2 border-white/30 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] backdrop-blur-md transform rotate-2">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-300 animate-pulse stroke-[3px]" />
              <span className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">Keunggulan</span>
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-3 sm:mb-6 leading-tight drop-shadow-md">
              Mengapa Memilih <span className="bg-linear-to-r from-emerald-200 to-cyan-200 bg-clip-text text-transparent">IRMAVerse?</span>
            </h2>
            <p className="text-sm sm:text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed font-medium">
              Rasakan pengalaman berbeda dalam mengelola kegiatan organisasi Islami
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="group relative p-4 sm:p-8 rounded-3xl sm:rounded-4xl bg-white/10 backdrop-blur-md border-[3px] border-white/20 hover:border-emerald-300 hover:bg-white/20 transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.12)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)] sm:hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.15)] hover:-translate-y-1 sm:hover:-translate-y-2 hover:rotate-1">
                <div className="relative">
                  <div className="inline-flex p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/20 mb-3 sm:mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 border-2 border-white/10">
                    <benefit.icon className="h-5 w-5 sm:h-8 sm:w-8 text-emerald-300 stroke-[2.5px]" />
                  </div>
                  <h3 className="text-sm sm:text-xl font-bold text-white mb-1.5 sm:mb-3 group-hover:text-emerald-200 transition-colors duration-300 leading-tight">
                    {benefit.title}
                  </h3>
                  <p className="text-[10px] sm:text-base text-white/80 leading-relaxed font-medium">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CARTOON GALLERY SECTION */}
      <section id="galeri" className="py-14 sm:py-24 relative">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 mb-4 sm:mb-6 bg-white/10 border-2 border-white/20 rounded-2xl backdrop-blur-md shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] transform -rotate-2 hover:rotate-0 transition-all duration-300">
              <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-300 stroke-[3px]" />
              <span className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">Dokumentasi</span>
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-3 sm:mb-6 leading-tight drop-shadow-[3px_3px_0px_rgba(0,0,0,0.15)]">
               <span className="bg-linear-to-r from-yellow-200 to-amber-300 bg-clip-text text-transparent" style={{ textShadow: "2px 2px 0px rgba(0,0,0,0.2)" }}>Kegiatan</span> Kami
            </h2>
            <p className="text-sm sm:text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed font-bold">
               Lihat kegiatan IRMA yang penuh warna dan bersemangat! 🎉
            </p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            {/* Frame Kartun */}
            <div className="relative aspect-video md:aspect-21/9 rounded-3xl sm:rounded-4xl border-4 sm:border-8 border-white/40 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)] sm:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] bg-black/20 backdrop-blur-sm overflow-hidden transform hover:scale-[1.01] transition-transform duration-500 group">
              {/* Slides */}
              {galleryItems.map((item, index) => (
                <div 
                  key={index} 
                  className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                >
                  <img src={item.src} alt={item.title} className="w-full h-full object-cover" />
                  {/* TEXT OVERLAY */}
                  <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 via-black/50 to-transparent px-4 py-3 sm:p-6 md:p-10 text-white">
                    <h3 className="text-sm sm:text-2xl md:text-3xl font-extrabold mb-0.5 sm:mb-2 text-yellow-300 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)] leading-tight">{item.title}</h3>
                    <p className="text-[10px] sm:text-sm md:text-lg text-white font-bold max-w-2xl drop-shadow-md line-clamp-1 sm:line-clamp-none">{item.description}</p>
                  </div>
                </div>
              ))}

              {/* Navigation Buttons */}
              <button onClick={prevSlide} className="absolute left-1.5 sm:left-4 top-1/2 -translate-y-1/2 bg-white text-emerald-700 p-2 sm:p-4 rounded-xl sm:rounded-2xl border-b-3 sm:border-b-4 border-emerald-800 shadow-lg hover:bg-gray-100 active:border-b-0 active:translate-y-1 transition-all z-10">
                <ChevronLeft className="h-4 w-4 sm:h-8 sm:w-8 stroke-[4px]" />
              </button>
              
              <button onClick={nextSlide} className="absolute right-1.5 sm:right-4 top-1/2 -translate-y-1/2 bg-white text-emerald-700 p-2 sm:p-4 rounded-xl sm:rounded-2xl border-b-3 sm:border-b-4 border-emerald-800 shadow-lg hover:bg-gray-100 active:border-b-0 active:translate-y-1 transition-all z-10">
                <ChevronRight className="h-4 w-4 sm:h-8 sm:w-8 stroke-[4px]" />
              </button>
            </div>

            {/* Decoration Dots */}
            <div className="flex justify-center gap-2 sm:gap-3 mt-5 sm:mt-8">
              {galleryItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-3 sm:h-4 md:h-5 rounded-full transition-all duration-300 border-2 sm:border-[3px] border-white/40 shadow-sm ${
                    currentSlide === index ? "w-8 sm:w-10 md:w-12 bg-yellow-400 scale-110" : "w-3 sm:w-4 md:w-5 bg-white/40 hover:bg-white/60"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
            
            <div className="absolute -top-10 -left-10 w-24 h-24 bg-yellow-400 rounded-full blur-xl opacity-60 animate-bounce hidden sm:block"></div>
            <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-cyan-400 rounded-full blur-2xl opacity-60 animate-pulse delay-700 hidden sm:block"></div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-14 sm:py-24 relative">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 sm:mb-6 bg-white/10 border-2 border-white/20 rounded-xl backdrop-blur-md shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] transform rotate-2 hover:rotate-0 transition-all duration-300">
              <span className="text-[10px] sm:text-xs font-extrabold text-white uppercase tracking-wider">Tanya Jawab</span>
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-3 sm:mb-6 leading-tight drop-shadow-[3px_3px_0px_rgba(0,0,0,0.15)]">
               FAQ <span className="bg-linear-to-r from-emerald-200 to-cyan-200 bg-clip-text text-transparent" style={{ textShadow: "2px 2px 0px rgba(0,0,0,0.2)" }}>Terkait</span>
            </h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {[
              {
                q: "Apa itu IrmaVerse?",
                a: "IrmaVerse adalah platform digital khusus untuk mendukung seluruh kegiatan, informasi, dan komunikasi anggota IRMA secara terorganisir dan modern."
              },
              {
                q: "Bagaimana cara mengakses fitur di IRMAVerse?",
                a: "Klik tombol 'Login', lalu masuk menggunakan akun yang telah didaftarkan. Anda dapat menikmati fitur Presensi, Event, hingga Jadwal Kajian secara mudah."
              },
              {
                q: "Apakah alumni bisa gabung ke IRMAVerse?",
                a: "Saat ini fokus utama IRMAVerse adalah untuk anggota aktif. Namun, alumni dapat melihat galeri dan artikel seputar IRMA di bagian yang bersifat publik."
              },
              {
                q: "Bagaimana jika ada kendala penggunaan?",
                a: "Silakan kirimkan laporan Anda melalui form di bagian 'Kontak Kami' di bawah, tim kami akan segera membalas email Anda."
              }
            ].map((faq, i) => (
              <div key={i} className="group p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white/10 backdrop-blur-md border-[3px] border-white/20 hover:border-emerald-300 hover:bg-white/20 transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)]">
                <h3 className="text-sm sm:text-lg md:text-xl font-bold text-white mb-2 sm:mb-3 group-hover:text-emerald-200 transition-colors duration-300 flex items-start gap-2 sm:gap-3">
                  <span className="text-emerald-300 mt-0.5 shrink-0">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 stroke-[3px]" />
                  </span>
                  {faq.q}
                </h3>
                <p className="text-[11px] sm:text-sm md:text-base text-white/80 font-medium leading-relaxed ml-6 sm:ml-8">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="kontak" className="py-14 sm:py-24 relative">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 mb-4 sm:mb-6 bg-white/10 border-2 border-white/20 rounded-2xl backdrop-blur-md shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] transform rotate-2 hover:rotate-0 transition-all duration-300">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-300 stroke-[3px]" />
              <span className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">Kontak Kami</span>
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-3 sm:mb-6 leading-tight drop-shadow-[3px_3px_0px_rgba(0,0,0,0.15)]">
               Mari <span className="bg-linear-to-r from-emerald-200 to-cyan-200 bg-clip-text text-transparent" style={{ textShadow: "2px 2px 0px rgba(0,0,0,0.2)" }}>Berkomunikasi</span>
            </h2>
            <p className="text-sm sm:text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed font-bold">
               Punya pertanyaan? Jangan ragu untuk menghubungi kami 💬
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8 max-w-5xl mx-auto items-center">
            {/* Contact Info Cards */}
            <div className="space-y-3 sm:space-y-6 z-10">
              <div className="group flex items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/10 backdrop-blur-md border-[3px] border-white/20 hover:border-emerald-300 hover:bg-white/20 transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] hover:-translate-y-1 sm:hover:-translate-y-2">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center border-2 border-white/10 shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <MapPin className="h-5 w-5 sm:h-8 sm:w-8 text-emerald-300 stroke-[2.5px]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-xl font-bold text-white mb-0.5 sm:mb-1">Alamat</h3>
                  <p className="text-[11px] sm:text-base text-white/80 font-medium leading-relaxed">Jl. SMK Negeri 13 Bandung<br />Kota Bandung, Jawa Barat</p>
                </div>
              </div>

              <div className="group flex items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/10 backdrop-blur-md border-[3px] border-white/20 hover:border-emerald-300 hover:bg-white/20 transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] hover:-translate-y-1 sm:hover:-translate-y-2">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center border-2 border-white/10 shrink-0 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                  <Mail className="h-5 w-5 sm:h-8 sm:w-8 text-yellow-300 stroke-[2.5px]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-xl font-bold text-white mb-0.5 sm:mb-1">Email</h3>
                  <p className="text-[11px] sm:text-base text-white/80 font-medium leading-relaxed">1CtJ3@example.com</p>
                </div>
              </div>

              <div className="group flex items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/10 backdrop-blur-md border-[3px] border-white/20 hover:border-emerald-300 hover:bg-white/20 transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] hover:-translate-y-1 sm:hover:-translate-y-2">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center border-2 border-white/10 shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <Phone className="h-5 w-5 sm:h-8 sm:w-8 text-emerald-300 stroke-[2.5px]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-xl font-bold text-white mb-0.5 sm:mb-1">Telepon & WhatsApp</h3>
                  <p className="text-[11px] sm:text-base text-white/80 font-medium leading-relaxed">0812-3456-7890</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-3xl sm:rounded-4xl p-5 sm:p-8 md:p-10 border-[3px] sm:border-4 border-emerald-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] sm:shadow-[16px_16px_0px_0px_rgba(0,0,0,0.15)] transform hover:-translate-y-1 sm:hover:-translate-y-2 transition-transform duration-500 z-10">
              <h3 className="text-lg sm:text-2xl font-extrabold text-slate-800 mb-4 sm:mb-6 drop-shadow-sm">Kirim Pesan ✉️</h3>
              <form className="space-y-3 sm:space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5 sm:mb-2">Nama Lengkap</label>
                  <input type="text" placeholder="Masukkan nama Anda" className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-medium text-slate-700 placeholder-slate-400 text-sm sm:text-base" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5 sm:mb-2">Email</label>
                  <input type="email" placeholder="contoh@email.com" className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-medium text-slate-700 placeholder-slate-400 text-sm sm:text-base" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5 sm:mb-2">Pesan</label>
                  <textarea rows={3} placeholder="Tuliskan pesan Anda..." className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-medium text-slate-700 placeholder-slate-400 resize-none text-sm sm:text-base"></textarea>
                </div>
                <button type="button" className="w-full py-3 sm:py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl sm:rounded-2xl border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group text-sm sm:text-base">
                  <span>Kirim Pesan Sekarang</span>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 stroke-[3px] group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-emerald-600/40 via-teal-600/40 to-cyan-600/40" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-125 h-125 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(white 2px, transparent 2px), linear-gradient(90deg, white 2px, transparent 2px)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 mb-5 sm:mb-8 bg-white/20 border-[3px] border-white/30 rounded-2xl backdrop-blur-md shadow-[4px_4px_0px_0px_rgba(0,0,0,0.08)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)]">
            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white animate-pulse stroke-[3px]" />
            <span className="text-[10px] sm:text-sm font-extrabold text-white uppercase tracking-wider">Bergabung Sekarang</span>
          </div>

          <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white mb-3 sm:mb-8 leading-tight drop-shadow-lg">
            Siap Memulai Perjalanan <br className="hidden sm:block" />
            <span className="relative inline-block mt-1 sm:mt-2 transform -rotate-1">
              <span className="relative z-10">Pembelajaran Islami?</span>
              <div className="absolute bottom-0.5 sm:bottom-1 left-0 w-full h-2.5 sm:h-4 bg-emerald-500/50 rounded-full z-0" />
            </span>
          </h2>

          <p className="text-sm sm:text-xl md:text-2xl text-white/90 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed font-bold drop-shadow-md">
            Daftar sekarang dan dapatkan akses ke semua fitur untuk pengalaman yang lebih terorganisir, modern, dan menyenangkan
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2 sm:px-4">
            <Link href="/auth?mode=signup" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-6 sm:px-12 py-4 sm:py-6 text-sm sm:text-lg group font-extrabold bg-white text-emerald-800 rounded-2xl border-b-6 sm:border-b-8 border-emerald-900 active:border-b-0 active:translate-y-2 transition-all duration-150 flex items-center justify-center gap-2 sm:gap-3 hover:brightness-105 shadow-2xl">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 stroke-[3px]" />
                <span>Daftar Sekarang Gratis!</span>
                <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 stroke-[3px] group-hover:translate-x-2 transition-transform duration-300" />
              </button>
            </Link>
          </div>

          <div className="mt-8 sm:mt-16 flex flex-wrap justify-center items-center gap-3 sm:gap-8 text-white/90 font-bold">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border-2 border-white/10">
              <Shield className="h-4 w-4 sm:h-6 sm:w-6 stroke-[2.5px]" />
              <span className="text-xs sm:text-base">100% Data Aman</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border-2 border-white/10">
              <Users className="h-4 w-4 sm:h-6 sm:w-6 stroke-[2.5px]" />
              <span className="text-xs sm:text-base">{stats.totalMembers} Anggota Aktif</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border-2 border-white/10">
              <Contact className="h-4 w-4 sm:h-6 sm:w-6 stroke-[2.5px]" />
              <span className="text-xs sm:text-base">{stats.totalInstructors} Instruktur</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-black/20 backdrop-blur-sm border-t-4 border-white/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-8 sm:gap-12 mb-8 sm:mb-12">
            <div className="flex-1 flex flex-col gap-3 sm:gap-4 min-w-55">
              <div className="flex items-center gap-3 mb-1 sm:mb-2">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-linear-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] border-2 border-white/20">
                  <img src="/logo.webp" alt="IRMA" className="w-7 h-7 sm:w-9 sm:h-9 object-contain" />
                </div>
                <div>
                  <div className="font-extrabold text-lg sm:text-xl md:text-2xl text-white drop-shadow-md">IRMAVerse</div>
                  <div className="text-[10px] sm:text-xs text-white/80 font-bold bg-white/20 px-2 py-0.5 rounded-md inline-block mt-0.5 sm:mt-1">Platform Digital IRMA</div>
                </div>
              </div>
              <p className="text-white/80 leading-relaxed text-xs sm:text-sm mb-1 sm:mb-2 max-w-xs font-medium">
                Menghubungkan anggota IRMA dengan teknologi modern untuk pengalaman pembelajaran Islami yang lebih baik.
              </p>
              <div className="flex gap-3 mt-1 sm:mt-2">
                <a href="https://facebook.com" target="_blank" rel="noopener" className="text-white/70 hover:text-white hover:scale-110 transition-all"><Facebook className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.5px]" /></a>
                <a href="https://instagram.com" target="_blank" rel="noopener" className="text-white/70 hover:text-white hover:scale-110 transition-all"><Instagram className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.5px]" /></a>
                <a href="https://youtube.com" target="_blank" rel="noopener" className="text-white/70 hover:text-white hover:scale-110 transition-all"><Youtube className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.5px]" /></a>
              </div>
            </div>
            <div className="flex-1 min-w-45">
              <h3 className="font-extrabold text-white text-base sm:text-lg mb-3 sm:mb-4 drop-shadow-sm">Quick Links</h3>
              <ul className="space-y-2 sm:space-y-3">
                {[
                  { name: 'Halaman utama', id: 'beranda' },
                  { name: 'Fitur Aplikasi', id: 'fitur' },
                  { name: 'Keunggulan', id: 'keunggulan' },
                  { name: 'Galeri Kegiatan', id: 'galeri' },
                  { name: 'Pertanyaan Umum', id: 'faq' },
                  { name: 'Hubungi Kami', id: 'kontak' },
                ].map((link, i) => {
                  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    if (link.id === 'beranda') {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    } else {
                      const element = document.getElementById(link.id);
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth" });
                      }
                    }
                  };
                  return (
                    <li key={i}>
                      <Link 
                        href={`#${link.id}`} 
                        onClick={handleClick}
                        className="text-white/80 hover:text-white font-bold transition-all duration-300 text-xs sm:text-sm flex items-center gap-2.5 group hover:translate-x-1"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 group-hover:bg-white group-hover:scale-125 transition-all shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                        <span>{link.name}</span>
                        <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex-1 min-w-50">
              <h3 className="font-extrabold text-white text-base sm:text-lg mb-3 sm:mb-4 drop-shadow-sm">Contact Us</h3>
              <p className="text-xs sm:text-sm text-white/80 font-medium mb-1.5 sm:mb-2">Jl. SMK Negeri 13 Bandung, Kota Bandung, Jawa Barat</p>
              <p className="text-xs sm:text-sm text-white/80 font-medium mb-1.5 sm:mb-2">Email: 1CtJ3@example.com</p>
              <p className="text-xs sm:text-sm text-white/80 font-medium">Telepon: 0812-3456-7890</p>
            </div>
          </div>
          <p className="text-center text-white/60 text-xs mt-8 border-t-2 border-white/10 pt-6 font-bold">
            &copy; {new Date().getFullYear()} <span className="text-white">IRMAVerse</span>. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}