"use client";
import React from "react";
import Link from "next/link";
import {
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
  Award,
  MessageCircle,
  Clock,
  Star,
  CheckCircle,
  BarChart3,
  Video,
  FileText,
  Activity,
  ArrowRight,
  Sparkles,
  Contact,
  Newspaper,
  Info,
  Target,
  Zap,
  ChevronRight,
  PenSquare,
  LayoutDashboard,
  ListChecks,
  MapPin,
  History,
} from "lucide-react";
import Sidebar from "@/components/ui/Sidebar";
import DashboardHeader from "@/components/ui/Header";
import AcademyLoading from "@/components/ui/Loading";

export default function InstructorAcademy() {
  const [stats, setStats] = React.useState<any>(null);
  const [upcomingClasses, setUpcomingClasses] = React.useState<any[]>([]);
  const [recentActivities, setRecentActivities] = React.useState<any[]>([]);
  const [coursesOverview, setCoursesOverview] = React.useState<any[]>([]);
  const [achievement, setAchievement] = React.useState<any>(null);
  const [latestNews, setLatestNews] = React.useState<any[]>([]);
  const [loadingNews, setLoadingNews] = React.useState(true);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Fetch overview data
    fetch("/api/academy/overview")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (data) {
          setStats(data.stats || null);
          setUpcomingClasses(data.upcomingClasses || []);
          setRecentActivities(data.recentActivities || []);
          setCoursesOverview(data.coursesOverview || []);
          setAchievement(data.achievement || null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Academy Overview Error:", err);
        setLoading(false);
      });

    // Fetch news data
    fetch("/api/news")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const sortedNews = Array.isArray(data)
          ? data.sort(
              (a: any, b: any) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
          : [];
        setLatestNews(sortedNews.slice(0, 2));
        setLoadingNews(false);
      })
      .catch((err) => {
        console.error("News fetch error:", err);
        setLoadingNews(false);
      });
  }, []);



  if (loading) return <AcademyLoading fullScreen text="Membuat dashboard..." />;

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">

          {/* ===== HEADER ===== */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight mb-1">
                Pusat Instruktur
              </h1>
              <p className="text-slate-500 mt-1 font-bold text-base md:text-lg ml-1">
                Kelola kajian dan bimbing anggota IRMA dengan penuh dedikasi.
              </p>
            </div>

            <div className="hidden md:flex items-center gap-2 bg-white px-5 py-3 rounded-full border-2 border-slate-200 shadow-[0_4px_0_0_#e2e8f0] transform hover:-translate-y-1 transition-transform">
              <Calendar className="w-5 h-5 text-emerald-600" strokeWidth={3} />
              <span className="text-sm font-black text-slate-700">
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* ===== STATS GRID ===== */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-10">
            {/* Stat 1 - Kajian Aktif */}
            <div className="bg-white p-5 md:p-6 rounded-[2.5rem] border-2 border-emerald-100 shadow-[0_8px_0_0_#d1fae5] hover:shadow-[0_4px_0_0_#d1fae5] hover:translate-y-1 hover:border-emerald-200 transition-all duration-300 group relative max-md:aspect-square flex flex-col justify-between">
              <div className="flex justify-between items-start md:mb-5">
                <div className="p-2.5 md:p-3 bg-emerald-50 border-2 border-emerald-100 rounded-2xl group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] md:text-xs font-black px-2.5 py-1 md:px-3 bg-emerald-100 text-emerald-600 rounded-full border-2 border-emerald-200">Aktif</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-3xl md:text-4xl font-black text-slate-800 leading-none">{stats ? stats.activeCourses : "0"}</div>
                <div className="text-[10px] md:text-sm text-slate-400 font-black tracking-wide">Kajian Ongoing</div>
              </div>
            </div>

            {/* Stat 2 - Sesi Selesai */}
            <div className="bg-white p-5 md:p-6 rounded-[2.5rem] border-2 border-emerald-100 shadow-[0_8px_0_0_#d1fae5] hover:shadow-[0_4px_0_0_#d1fae5] hover:translate-y-1 hover:border-emerald-200 transition-all duration-300 group relative max-md:aspect-square flex flex-col justify-between">
              <div className="flex justify-between items-start md:mb-5">
                <div className="p-2.5 md:p-3 bg-emerald-50 border-2 border-emerald-100 rounded-2xl group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] md:text-xs font-black px-2.5 py-1 md:px-3 bg-emerald-100 text-emerald-600 rounded-full border-2 border-emerald-200">Selesai</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-3xl md:text-4xl font-black text-slate-800 leading-none">{stats ? stats.completedSessions : "0"}</div>
                <div className="text-[10px] md:text-sm text-slate-400 font-black tracking-wide">Kajian Selesai</div>
              </div>
            </div>

            {/* Stat 3 - Rating */}
            <div className="bg-white p-5 md:p-6 rounded-[2.5rem] border-2 border-emerald-100 shadow-[0_8px_0_0_#d1fae5] hover:shadow-[0_4px_0_0_#d1fae5] hover:translate-y-1 hover:border-emerald-200 transition-all duration-300 group relative max-md:aspect-square flex flex-col justify-between">
              <div className="flex justify-between items-start md:mb-5">
                <div className="p-2.5 md:p-3 bg-emerald-50 border-2 border-emerald-100 rounded-2xl group-hover:scale-110 transition-transform">
                  <Star className="w-6 h-6 md:w-8 md:h-8 text-emerald-500 fill-emerald-400" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] md:text-xs font-black px-2.5 py-1 md:px-3 bg-emerald-100 text-emerald-600 rounded-full border-2 border-emerald-200">Pertahankan!</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-3xl md:text-4xl font-black text-slate-800 leading-none">{stats ? stats.averageRating : "0"}</div>
                <div className="text-[10px] md:text-sm text-slate-400 font-black tracking-wide">Rating Rata-rata</div>
              </div>
            </div>
          </div>

          {/* Mobile: Instructor Profile Card (place above upcoming classes) */}
          <div className="xl:hidden mb-8">
            <div className="bg-linear-to-br from-emerald-400 to-teal-500 p-5 rounded-4xl text-white shadow-[0_6px_0_0_#047857] border-2 border-emerald-600 relative overflow-hidden group transition-transform hover:scale-[1.02]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10 blur-sm" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8 blur-sm" />

              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center shrink-0">
                  <Contact className="w-8 h-8 text-white" strokeWidth={2} />
                </div>
                <div>
                  <span className="font-black text-xl block drop-shadow-md">Instruktur</span>
                  <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest bg-emerald-600/30 px-2 py-0.5 rounded-md">IRMA Academy</span>
                </div>
              </div>

              <p className="text-sm text-emerald-50 font-bold relative z-10 leading-relaxed bg-emerald-700/20 p-3 rounded-xl border border-emerald-300/20">
                "Mendidik adalah amanah. Setiap ilmu yang ditransfer adalah ladang pahala."
              </p>
            </div>
          </div>

          {/* ===== MAIN GRID ===== */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">

            {/* ===== LEFT COLUMN ===== */}
            <div className="xl:col-span-8 space-y-8">



              {/* Kabar IRMA Terkini */}
              <section>
                <div className="flex items-center gap-3 mb-5 px-2">
                  <div className="p-2 bg-white border-2 border-slate-200 rounded-xl shadow-[0_3px_0_0_#e2e8f0]">
                    <Newspaper className="w-5 h-5 text-slate-800" />
                  </div>
                  <h2 className="text-xl font-black text-slate-800">
                    Kabar IRMA Terkini
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {loadingNews ? (
                    // Loading skeletons
                    [1, 2].map((i) => (
                      <div
                        key={i}
                        className="animate-pulse flex gap-4 p-4 bg-white rounded-4xl border-2 border-slate-100 h-32"
                      >
                        <div className="w-24 h-24 rounded-2xl bg-slate-100 shrink-0" />
                        <div className="flex-1 space-y-3 py-1">
                          <div className="h-2 bg-slate-100 rounded w-1/4" />
                          <div className="h-4 bg-slate-100 rounded w-3/4" />
                          <div className="h-2 bg-slate-100 rounded w-1/2" />
                        </div>
                      </div>
                    ))
                  ) : latestNews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl col-span-1 md:col-span-2 text-center h-full min-h-40">
                      <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 mb-3">
                        <Newspaper
                          className="w-8 h-8 text-slate-300"
                          strokeWidth={1.5}
                        />
                      </div>
                      <p className="text-sm text-slate-500 font-bold">
                        Belum ada kabar terbaru
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Nantikan informasi menarik seputar IRMA
                      </p>
                    </div>
                  ) : (
                    latestNews.map((news) => (
                      <Link
                        href={`/news/${news.slug}`}
                        key={news.id}
                        className="flex gap-4 p-4 bg-white rounded-4xl border-2 border-slate-100 hover:border-emerald-400 hover:shadow-[0_6px_0_0_#10b981] hover:-translate-y-1 transition-all cursor-pointer group"
                      >
                        <div className="w-24 h-24 rounded-2xl bg-slate-200 overflow-hidden shrink-0 border-2 border-slate-100 group-hover:border-emerald-200">
                          <img
                            src={
                              news.image ||
                              `https://images.unsplash.com/photo-1633613286991-611bcfb63dba?auto=format&fit=crop&w=800&q=80`
                            }
                            alt={news.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="inline-block w-fit px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-black border border-emerald-600 shadow-sm mb-2 uppercase tracking-wide">
                            {news.category}
                          </span>
                          <h3 className="font-bold text-slate-800 leading-snug mb-2 text-base group-hover:text-emerald-600 transition-colors line-clamp-2">
                            {news.title}
                          </h3>
                          <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />{" "}
                            {new Date(news.createdAt).toLocaleDateString(
                              "id-ID",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </section>

              {/* Upcoming Classes */}
              <section>
                <div className="flex items-center justify-between mb-5 px-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white border-2 border-slate-200 rounded-xl shadow-[0_3px_0_0_#e2e8f0]">
                      <Calendar className="w-5 h-5 text-slate-800" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800">Jadwal Kajian Mendatang</h2>
                  </div>
                  <Link href="/materials" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                    Lihat Semua <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {upcomingClasses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-center h-full min-h-40">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 mb-3 block">
                      <Calendar className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm text-slate-500 font-bold">Belum ada kajian yang mendatang</p>
                    <p className="text-xs text-slate-400 mt-1">Jadwal kajian yang akan datang akan muncul di sini</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingClasses.map((kls) => (
                      <div
                        key={kls.id}
                        className="bg-white p-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-400 hover:shadow-[0_4px_0_0_#10b981] transition-all group cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-black text-slate-800 group-hover:text-emerald-600 transition-colors">{kls.title}</h3>
                          </div>
                          <div className="flex gap-2">
                            {kls.isCompleted !== undefined && (
                              <div className={`px-3 py-1 rounded-full text-xs font-black border ${
                                kls.isCompleted
                                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                  : "bg-teal-50 text-teal-700 border-teal-200"
                              }`}>
                                {kls.isCompleted ? "Tuntas" : "Belum Tuntas"}
                              </div>
                            )}
                            <div className={`px-3 py-1 rounded-full text-xs font-black border ${
                              kls.status === "upcoming"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                : "bg-slate-50 text-slate-500 border-slate-200"
                            }`}>
                              {kls.status === "upcoming" ? "Segera" : "Selesai"}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500 font-bold">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> {kls.time}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" /> {kls.students} anggota yang akan hadir
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" /> {kls.room}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Courses Overview */}
              <section>
                <div className="flex items-center justify-between mb-5 px-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white border-2 border-slate-200 rounded-xl shadow-[0_3px_0_0_#e2e8f0]">
                      <Info className="w-5 h-5 text-slate-800" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800">Overview Kajian</h2>
                  </div>

                </div>

                {coursesOverview.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-center h-full min-h-40">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 mb-3 block">
                      <BookOpen className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm text-slate-500 font-bold">Belum ada kajian aktif</p>
                    <p className="text-xs text-slate-400 mt-1">Buat kajian baru untuk mulai membagikan ilmu Anda</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {coursesOverview.map((course) => (
                      <div
                        key={course.id}
                        className="bg-white p-5 rounded-4xl border-2 border-slate-100 hover:border-emerald-400 hover:shadow-[0_4px_0_0_#10b981] hover:-translate-y-1 transition-all group"
                      >
                        <h3 className="font-black text-slate-800 mb-4 group-hover:text-emerald-600 transition-colors">{course.title}</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-bold flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Peserta Kajian</span>
                            <span className="font-black text-slate-800">{course.students}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-bold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Sesi</span>
                            <span className="font-black text-slate-800">{course.sessions}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-bold flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> Rating</span>
                            <span className="font-black text-emerald-500">⭐ {course.rating}</span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-slate-500 font-bold">Status</span>
                            <span className={`font-black uppercase px-2 py-0.5 rounded-md ${
                              course.progress === 100 
                                ? "bg-emerald-100 text-emerald-600" 
                                : "bg-teal-50 text-teal-600"
                            }`}>
                              {course.progress === 100 ? "Tuntas" : "Belum Tuntas"}
                            </span>
                          </div>
                        </div>

                        <Link
                          href={`/instructor/kajian/${course.id}`}
                          className="flex items-center justify-center gap-1 mt-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 font-black text-sm hover:bg-emerald-100 transition-colors"
                        >
                          Kelola <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* ===== RIGHT COLUMN ===== */}
            <div className="xl:col-span-4 space-y-6">

              {/* Instructor Profile Card */}
              <div className="hidden xl:block bg-linear-to-br from-emerald-400 to-teal-500 p-5 rounded-4xl text-white shadow-[0_6px_0_0_#047857] border-2 border-emerald-600 relative overflow-hidden group transition-transform hover:scale-[1.02]">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10 blur-sm" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8 blur-sm" />

                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center shrink-0">
                    <Contact className="w-8 h-8 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <span className="font-black text-xl block drop-shadow-md">Instruktur</span>
                    <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest bg-emerald-600/30 px-2 py-0.5 rounded-md">IRMA Academy</span>
                  </div>
                </div>

                <p className="text-sm text-emerald-50 font-bold relative z-10 leading-relaxed bg-emerald-700/20 p-3 rounded-xl border border-emerald-300/20">
                  "Mendidik adalah amanah. Setiap ilmu yang ditransfer adalah ladang pahala."
                </p>
              </div>

              {/* Recent Activities */}
              <div className="bg-white p-5 rounded-4xl border-2 border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white border-2 border-slate-200 rounded-xl shadow-[0_3px_0_0_#e2e8f0]">
                    <History className="w-5 h-5 text-slate-800" />
                  </div>
                  <h4 className="font-black text-slate-800 text-base">Aktivitas Terkini</h4>
                </div>

                {recentActivities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-slate-200 rounded-3xl text-center h-full min-h-40">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 mb-3 block">
                      <History className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm text-slate-500 font-bold">Belum ada aktivitas</p>
                    <p className="text-xs text-slate-400 mt-1">Aktivitas terbaru Anda akan tercatat di sini</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivities.slice(0, 3).map((activity) => {
                      // Activity Type mapping
                      const config: Record<string, { icon: any, bgColor: string, iconColor: string, borderColor: string }> = {
                        material: { icon: BookOpen, bgColor: 'bg-emerald-50', iconColor: 'text-emerald-600', borderColor: 'border-emerald-100' },
                        schedule: { icon: Calendar, bgColor: 'bg-emerald-50', iconColor: 'text-emerald-600', borderColor: 'border-emerald-100' },
                        competition: { icon: Award, bgColor: 'bg-emerald-50', iconColor: 'text-emerald-600', borderColor: 'border-emerald-100' },
                        news: { icon: Newspaper, bgColor: 'bg-emerald-50', iconColor: 'text-emerald-600', borderColor: 'border-emerald-100' },
                      };
                      const { icon: ActivityIcon, bgColor, iconColor, borderColor } = config[activity.type] || config.material;

                      return (
                        <div
                          key={activity.id}
                          className="flex items-center gap-4 p-4 rounded-4xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all group cursor-pointer"
                        >
                          <div className={`w-12 h-12 rounded-full ${bgColor} border-2 flex items-center justify-center ${borderColor} shrink-0 group-hover:scale-110 transition-transform shadow-sm`}>
                            <ActivityIcon className={`w-5 h-5 ${iconColor}`} strokeWidth={2.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 text-[13px] leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2">
                              {activity.title}
                            </p>
                            <p className="text-[11px] text-slate-400 font-bold mt-1.5 flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-slate-300" /> {activity.time}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Motivational Card - Only show if there's at least 1 session today AND at least 1 student attended */}
              {achievement?.dailySessions > 0 && achievement?.dailyAttendance > 0 && (
                <div className="bg-white p-5 rounded-4xl border-2 border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
                  <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="p-2 bg-white border-2 border-slate-200 rounded-xl shadow-[0_3px_0_0_#e2e8f0]">
                      <Award className="w-5 h-5 text-emerald-500" strokeWidth={2.5} />
                    </div>
                    <h4 className="font-black text-base text-slate-800">Pencapaian Hari Ini</h4>
                  </div>
                  <p className="text-sm text-slate-500 font-bold relative z-10 leading-relaxed mb-4">
                    Kamu telah mengajar <span className="text-emerald-600">{achievement.dailySessions} sesi</span> dan mendapatkan rating rata-rata <span className="text-emerald-500 font-black">{achievement.dailyRating || 0} ⭐</span> hari ini!
                  </p>
                  <Link
                    href="/instructor-dashboard"
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-emerald-500 text-white text-sm font-black rounded-2xl hover:bg-emerald-400 transition-colors relative z-10 shadow-[0_4px_0_0_#047857] border border-emerald-400 active:shadow-none active:translate-y-1"
                  >
                    Lihat Laporan Lengkap <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

            </div>
          </div>
        </main>
      </div>

      
    </div>
  );
}
