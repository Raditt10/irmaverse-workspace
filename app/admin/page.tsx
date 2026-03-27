"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  BookOpen,
  Calendar,
  Settings,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserPlus,
  Shield,
  Activity,
  Bell,
  Sparkles,
  ArrowRight,
  UserCheck,
  LayoutGrid,
  BookMarked,
  Zap,
  Book,
  Award,
  TrendingUp,
  HelpCircle,
  Contact,
  Newspaper,
  History,
  FileText,
  MessageSquare,
} from "lucide-react";
import Sidebar from "@/components/ui/Sidebar";
import DashboardHeader from "@/components/ui/Header";
import ChatbotButton from "@/components/ui/Chatbot";
import Loading from "@/components/ui/Loading";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInstructors: 0,
    totalActiveMaterials: 0,
    totalCompletedMaterials: 0,
    recentMaterials: [] as any[],
    recentNews: [] as any[],
    recentUsers: [] as any[],
    instructorActivities: [] as any[],
    userActivities: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
    } finally {
      setLoading(false);
    }
  };


  if (loading) return <Loading fullScreen text="Membuat dashboard..." />;

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
                Pusat Admin
              </h1>
              <p className="text-slate-500 mt-1 font-bold text-base md:text-lg ml-1">
                Kelola aplikasi IRMA Verse ini dengan kontrol penuh, dan bertanggung jawab.
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
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
            {/* Stat 1 - Total Users (Emerald) */}
            <div className="bg-white p-5 md:p-6 rounded-[2.5rem] border-2 border-emerald-100 shadow-[0_8px_0_0_#d1fae5] hover:shadow-[0_4px_0_0_#d1fae5] hover:translate-y-1 hover:border-emerald-200 transition-all duration-300 group flex flex-col justify-between aspect-square md:aspect-auto md:min-h-40">
              <div className="flex justify-between items-start mb-2 md:mb-5">
                <div className="p-2.5 md:p-3 bg-emerald-50 border-2 border-emerald-100 rounded-2xl group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] md:text-xs font-black px-2.5 py-1 md:px-3 bg-emerald-100 text-emerald-600 rounded-full border-2 border-emerald-200">Anggota</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-3xl md:text-4xl font-black text-slate-800 leading-none">
                  {(stats.totalUsers ?? 0).toLocaleString("id-ID")}
                </div>
                <div className="text-[10px] md:text-sm text-slate-400 font-black tracking-wide">Total Anggota IRMA</div>
              </div>
            </div>

            {/* Stat 2 - Total Instructors */}
            <div className="bg-white p-5 md:p-6 rounded-[2.5rem] border-2 border-emerald-100 shadow-[0_8px_0_0_#d1fae5] hover:shadow-[0_4px_0_0_#d1fae5] hover:translate-y-1 hover:border-emerald-200 transition-all duration-300 group flex flex-col justify-between aspect-square md:aspect-auto md:min-h-40">
              <div className="flex justify-between items-start mb-2 md:mb-5">
                <div className="p-2.5 md:p-3 bg-emerald-50 border-2 border-emerald-100 rounded-2xl group-hover:scale-110 transition-transform">
                  <Contact className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] md:text-xs font-black px-2.5 py-1 md:px-3 bg-emerald-100 text-emerald-600 rounded-full border-2 border-emerald-200">Instruktur</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-3xl md:text-4xl font-black text-slate-800 leading-none">
                  {(stats.totalInstructors ?? 0).toLocaleString("id-ID")}
                </div>
                <div className="text-[10px] md:text-sm text-slate-400 font-black tracking-wide">Total Instruktur</div>
              </div>
            </div>

            {/* Stat 3 - Active Materials (Amber if > 0, Emerald if 0) */}
            <div className={`bg-white p-5 md:p-6 rounded-[2.5rem] border-2 ${
              (stats.totalActiveMaterials ?? 0) > 0 
                ? 'border-amber-100 shadow-[0_8px_0_0_#fef3c7] hover:shadow-[0_4px_0_0_#fef3c7] hover:border-amber-200' 
                : 'border-emerald-100 shadow-[0_8px_0_0_#d1fae5] hover:shadow-[0_4px_0_0_#d1fae5] hover:border-emerald-200'
            } hover:translate-y-1 transition-all duration-300 group flex flex-col justify-between aspect-square md:aspect-auto md:min-h-40`}>
              <div className="flex justify-between items-start mb-2 md:mb-5">
                <div className={`p-2.5 md:p-3 border-2 rounded-2xl group-hover:scale-110 transition-transform ${
                  (stats.totalActiveMaterials ?? 0) > 0 
                    ? 'bg-amber-50 border-amber-100' 
                    : 'bg-emerald-50 border-emerald-100'
                }`}>
                  <BookOpen className={`w-6 h-6 md:w-8 md:h-8 ${
                    (stats.totalActiveMaterials ?? 0) > 0 ? 'text-amber-500' : 'text-emerald-500'
                  }`} strokeWidth={2.5} />
                </div>
                <span className={`text-[10px] md:text-xs font-black px-2.5 py-1 md:px-3 rounded-full border-2 ${
                  (stats.totalActiveMaterials ?? 0) > 0 
                    ? 'bg-amber-100 text-amber-600 border-amber-200' 
                    : 'bg-emerald-100 text-emerald-600 border-emerald-200'
                }`}>
                  Ongoing
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-3xl md:text-4xl font-black text-slate-800 leading-none">
                  {(stats.totalActiveMaterials ?? 0).toLocaleString("id-ID")}
                </div>
                <div className="text-[10px] md:text-sm text-slate-400 font-black tracking-wide">Kajian Ongoing</div>
              </div>
            </div>

            {/* Stat 4 - Completed Materials */}
            <div className="bg-white p-5 md:p-6 rounded-[2.5rem] border-2 border-emerald-100 shadow-[0_8px_0_0_#d1fae5] hover:shadow-[0_4px_0_0_#d1fae5] hover:translate-y-1 hover:border-emerald-200 transition-all duration-300 group flex flex-col justify-between aspect-square md:aspect-auto md:min-h-40">
              <div className="flex justify-between items-start mb-2 md:mb-5">
                <div className="p-2.5 md:p-3 bg-emerald-50 border-2 border-emerald-100 rounded-2xl group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] md:text-xs font-black px-2.5 py-1 md:px-3 bg-emerald-100 text-emerald-600 rounded-full border-2 border-emerald-200">Tuntas</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-3xl md:text-4xl font-black text-slate-800 leading-none">
                  {(stats.totalCompletedMaterials ?? 0).toLocaleString("id-ID")}
                </div>
                <div className="text-[10px] md:text-sm text-slate-400 font-black tracking-wide">Total Kajian Tuntas</div>
              </div>
            </div>
          </div>

          {/* ===== MAIN GRID ===== */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: CONTROL CENTER */}
            <div className="xl:col-span-8 space-y-10">

              {/* Material Overview Section */}
              <section>
                <div className="flex items-center justify-between mb-6 px-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white border-2 border-slate-200 rounded-xl shadow-[0_3px_0_0_#e2e8f0]">
                      <BookOpen className="w-5 h-5 text-slate-800" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800">Overview Kajian</h2>
                  </div>
                  <Link href="/materials" className="text-sm font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                    Lihat Semua <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                
                  {stats.recentMaterials && stats.recentMaterials.length > 0 ? (
                    <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 p-6 space-y-4 shadow-sm">
                      {stats.recentMaterials.map((material) => (
                        <div key={material.id} className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 hover:bg-white transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform shadow-sm shrink-0">
                                    {material.thumbnailUrl ? (
                                      <img
                                        src={material.thumbnailUrl}
                                        alt={material.title}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xl">
                                        {material.title.charAt(0)}
                                      </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-black text-slate-700 group-hover:text-emerald-600 transition-colors truncate uppercase tracking-tight">{material.title}</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate">Oleh: {material.instructor}</p>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                                  material.isCompleted 
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                  : 'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                    {material.isCompleted ? 'Tuntas' : 'Belum Tuntas'}
                                </span>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                                  {new Date(material.createdAt).toLocaleDateString('id-ID', {
                                    day: '2-digit',
                                    month: 'short'
                                  })}
                                </p>
                            </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center h-full min-h-40">
                      <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 mb-3 block">
                        <BookOpen className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.5} />
                      </div>
                      <p className="text-sm text-slate-500 font-bold">Belum ada kajian terbaru</p>
                      <p className="text-xs text-slate-400 mt-1">Tambahkan sesi kajian baru untuk anggota</p>
                    </div>
                  )}
              </section>

              {/* News Section */}
              <section>
                <div className="flex items-center gap-3 mb-6 px-2">
                  <div className="p-2 bg-white border-2 border-slate-200 rounded-xl shadow-[0_3px_0_0_#e2e8f0]">
                    <Newspaper className="w-5 h-5 text-slate-800" />
                  </div>
                  <h2 className="text-xl font-black text-slate-800">
                    Kabar IRMA Terkini
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
                  {!stats.recentNews || stats.recentNews.length === 0 ? (
                    <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-center h-full min-h-40">
                      <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 mb-3 block">
                        <Newspaper className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.5} />
                      </div>
                      <p className="text-sm text-slate-500 font-bold">Belum ada kabar terbaru</p>
                      <p className="text-xs text-slate-400 mt-1">Buat berita untuk menyampaikan informasi ke anggota</p>
                    </div>
                  ) : (
                    stats.recentNews.map((news) => (
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
                        <div className="flex flex-col justify-center min-w-0">
                          <span className="inline-block w-fit px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-black border border-emerald-600 shadow-sm mb-2 uppercase tracking-wide">
                            {news.category}
                          </span>
                          <h3 className="font-bold text-slate-800 leading-snug mb-2 text-base group-hover:text-emerald-600 transition-colors line-clamp-2 uppercase">
                            {news.title}
                          </h3>
                          <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5 uppercase">
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

              {/* Recent Users Section */}
              <section>
                <div className="flex items-center gap-3 mb-6 px-2">
                  <div className="p-2 bg-white border-2 border-slate-200 rounded-xl shadow-[0_3px_0_0_#e2e8f0]">
                    <UserPlus className="w-5 h-5 text-slate-800" />
                  </div>
                  <h2 className="text-xl font-black text-slate-800">
                    Pendaftaran Anggota Terbaru
                  </h2>
                </div>

                {!stats.recentUsers || stats.recentUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] mb-10 text-center h-full min-h-40">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 mb-3 block">
                      <Users className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm text-slate-500 font-bold">Belum ada anggota baru</p>
                    <p className="text-xs text-slate-400 mt-1">Anggota yang baru mendaftar akan tampil di sini</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 p-6 space-y-4 shadow-sm mb-10 transition-all hover:shadow-md">
                      {stats.recentUsers.map((user: any) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 hover:bg-white hover:border-emerald-200 transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform shadow-sm">
                                {user.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Users className="w-6 h-6 text-emerald-500" />
                                )}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-[0_0_0_2px_#ecfdf5]" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-black text-slate-800 group-hover:text-emerald-600 transition-colors uppercase tracking-tight truncate">
                                {user.name}
                              </h3>
                              <p className="text-xs text-slate-400 font-bold lowercase tracking-wide truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 shadow-sm group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-colors">
                              Joined
                            </span>
                            <span className="text-[10px] text-slate-400 font-black uppercase">
                              {new Date(user.createdAt).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </section>
            </div>

            {/* RIGHT COLUMN: ADMIN PROFILE & ALERTS */}
            <div className="xl:col-span-4 space-y-8">
              {/* Admin Profile Details */}
              <div className="bg-linear-to-br from-emerald-400 to-teal-500 p-6 rounded-4xl text-white shadow-[0_6px_0_0_#047857] border-2 border-emerald-600 relative overflow-hidden group transition-transform hover:scale-[1.02]">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10 blur-sm group-hover:scale-125 transition-transform" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8 blur-sm" />
                
                <div className="flex items-center gap-4 mb-6 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center shrink-0">
                    <Shield className="w-9 h-9 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="font-black text-2xl block drop-shadow-md">Administrator</span>
                    <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest bg-emerald-600/30 px-2 py-0.5 rounded-md">IRMA Administrator</span>
                  </div>
                </div>

                <div className="bg-emerald-700/20 p-4 rounded-2xl border border-emerald-300/20 mb-6 relative z-10">
                  <p className="text-sm text-emerald-50 font-bold leading-relaxed italic">
                    "Kepemimpinan adalah tanggung jawab untuk melayani dan menjaga amanah ekosistem belajar."
                  </p>
                </div>
              </div>

              {/* Instructor Activity Section */}
              <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white border-2 border-slate-200 rounded-xl shadow-[0_3px_0_0_#e2e8f0]">
                            <History className="w-5 h-5 text-slate-800" />
                        </div>
                        <h4 className="font-black text-slate-800 text-lg tracking-tight">Log Aktivitas Instruktur</h4>
                    </div>
                </div>

                <div className="space-y-4">
                  {!stats.instructorActivities || stats.instructorActivities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-slate-200 rounded-3xl text-center h-full min-h-40">
                      <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 mb-3 block">
                        <History className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.5} />
                      </div>
                      <p className="text-sm text-slate-500 font-bold">Belum ada aktivitas</p>
                      <p className="text-xs text-slate-400 mt-1">Aktivitas instruktur terbaru akan tercatat di sini</p>
                    </div>
                  ) : (
                    stats.instructorActivities.slice(0, 4).map((act: any) => (
                      <div key={act.id} className="flex items-center gap-4 p-4 rounded-4xl bg-emerald-50/50 border border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-all group">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 bg-white border-emerald-100 text-emerald-500 shadow-sm group-hover:scale-110 transition-transform`}>
                            {act.type === 'material' && <BookOpen className="h-5 w-5" />}
                            {act.type === 'schedule' && <Calendar className="h-5 w-5" />}
                            {act.type === 'competition' && <Award className="h-5 w-5" />}
                            {act.type === 'news' && <Newspaper className="h-5 w-5" />}
                            {(!['material', 'schedule', 'competition', 'news'].includes(act.type)) && <History className="h-5 w-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-emerald-700 leading-tight mb-1 text-[13.5px] group-hover:text-emerald-600 transition-colors line-clamp-2">
                              {act.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-100/50 px-2 py-0.5 rounded-md">{act.user}</span>
                              <span className="w-1 h-1 bg-emerald-200 rounded-full" />
                              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-300" />
                                {new Date(act.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* User Activity Section */}
              <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white border-2 border-slate-200 rounded-xl shadow-[0_3px_0_0_#e2e8f0]">
                            <History className="w-5 h-5 text-slate-800" />
                        </div>
                        <h4 className="font-black text-slate-800 text-lg tracking-tight">Log Aktivitas Anggota</h4>
                    </div>
                </div>

                <div className="space-y-4">
                  {!stats.userActivities || stats.userActivities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-slate-200 rounded-3xl text-center h-full min-h-40">
                      <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 mb-3 block">
                        <Activity className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.5} />
                      </div>
                      <p className="text-sm text-slate-500 font-bold">Belum ada aktivitas</p>
                      <p className="text-xs text-slate-400 mt-1">Aktivitas anggota terbaru akan tercatat di sini</p>
                    </div>
                  ) : (
                    stats.userActivities.slice(0, 4).map((act: any) => (
                      <div key={act.id} className="flex items-center gap-4 p-4 rounded-4xl bg-emerald-50/50 border border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-all group">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 bg-white border-emerald-100 text-emerald-500 shadow-sm group-hover:scale-110 transition-transform`}>
                            {act.type === 'quiz_completed' && <Zap className="h-5 w-5" />}
                            {act.type === 'material_read' && <Book className="h-5 w-5" />}
                            {act.type === 'badge_earned' && <Award className="h-5 w-5" />}
                            {act.type === 'forum_post' && <MessageSquare className="h-5 w-5" />}
                            {act.type === 'level_up' && <TrendingUp className="h-5 w-5" />}
                            {act.type === 'friend_added' && <UserPlus className="h-5 w-5" />}
                            {act.type === 'attendance_marked' && <CheckCircle2 className="h-5 w-5" />}
                            {(!['quiz_completed', 'material_read', 'badge_earned', 'forum_post', 'level_up', 'friend_added', 'attendance_marked'].includes(act.type)) && <History className="h-5 w-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-emerald-700 leading-tight mb-1 text-[13.5px] group-hover:text-emerald-600 transition-colors line-clamp-2">
                              {act.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-100/50 px-2 py-0.5 rounded-md">{act.user}</span>
                              <span className="w-1 h-1 bg-emerald-200 rounded-full" />
                              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-300" />
                                {new Date(act.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <ChatbotButton />
    </div>
  );
}
