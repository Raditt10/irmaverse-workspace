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
  GraduationCap,
  Newspaper,
  BookMarked,
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
import ChatbotButton from "@/components/ui/Chatbot";

export default function InstructorAcademy() {
  const [stats, setStats] = React.useState<any>(null);
  const [upcomingClasses, setUpcomingClasses] = React.useState<any[]>([]);
  const [recentActivities, setRecentActivities] = React.useState<any[]>([]);
  const [coursesOverview, setCoursesOverview] = React.useState<any[]>([]);
  const [achievement, setAchievement] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/academy/overview")
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setUpcomingClasses(data.upcomingClasses);
        setRecentActivities(data.recentActivities);
        setCoursesOverview(data.coursesOverview);
        setAchievement(data.achievement);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);



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
                Kelola kajian dan bimbing siswa dengan penuh dedikasi.
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
            {/* Stat 1 - Total Siswa (Emerald) */}
            <div className="bg-white p-5 md:p-6 rounded-[2.5rem] border-2 border-emerald-100 shadow-[0_8px_0_0_#d1fae5] hover:shadow-[0_4px_0_0_#d1fae5] hover:translate-y-1 hover:border-emerald-200 transition-all duration-300 group relative max-md:aspect-square flex flex-col justify-between">
              <div className="flex justify-between items-start md:mb-5">
                <div className="p-2.5 md:p-3 bg-emerald-50 border-2 border-emerald-100 rounded-2xl group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] md:text-xs font-black px-2.5 py-1 md:px-3 bg-emerald-100 text-emerald-600 rounded-full border-2 border-emerald-200">+15</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-3xl md:text-4xl font-black text-slate-800 leading-none">{stats ? stats.totalStudents : "0"}</div>
                <div className="text-[10px] md:text-sm text-slate-400 font-black tracking-wide">Total Siswa</div>
              </div>
            </div>

            {/* Stat 2 - Kajian Aktif (Blue) */}
            <div className="bg-white p-5 md:p-6 rounded-[2.5rem] border-2 border-emerald-100 shadow-[0_8px_0_0_#d1fae5] hover:shadow-[0_4px_0_0_#d1fae5] hover:translate-y-1 hover:border-emerald-200 transition-all duration-300 group relative max-md:aspect-square flex flex-col justify-between">
              <div className="flex justify-between items-start md:mb-5">
                <div className="p-2.5 md:p-3 bg-emerald-50 border-2 border-emerald-100 rounded-2xl group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] md:text-xs font-black px-2.5 py-1 md:px-3 bg-emerald-100 text-emerald-600 rounded-full border-2 border-emerald-200">Aktif</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-3xl md:text-4xl font-black text-slate-800 leading-none">{stats ? stats.activeCourses : "0"}</div>
                <div className="text-[10px] md:text-sm text-slate-400 font-black tracking-wide">Kajian Aktif</div>
              </div>
            </div>

            {/* Stat 3 - Sesi Selesai (Purple) */}
            <div className="bg-white p-5 md:p-6 rounded-[2.5rem] border-2 border-emerald-100 shadow-[0_8px_0_0_#d1fae5] hover:shadow-[0_4px_0_0_#d1fae5] hover:translate-y-1 hover:border-emerald-200 transition-all duration-300 group relative max-md:aspect-square flex flex-col justify-between">
              <div className="flex justify-between items-start md:mb-5">
                <div className="p-2.5 md:p-3 bg-emerald-50 border-2 border-emerald-100 rounded-2xl group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] md:text-xs font-black px-2.5 py-1 md:px-3 bg-emerald-100 text-emerald-600 rounded-full border-2 border-emerald-200">Selesai</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-3xl md:text-4xl font-black text-slate-800 leading-none">{stats ? stats.completedSessions : "0"}</div>
                <div className="text-[10px] md:text-sm text-slate-400 font-black tracking-wide">Sesi Selesai</div>
              </div>
            </div>

            {/* Stat 4 - Rating (Amber) */}
            <div className="bg-white p-5 md:p-6 rounded-[2.5rem] border-2 border-emerald-100 shadow-[0_8px_0_0_#d1fae5] hover:shadow-[0_4px_0_0_#d1fae5] hover:translate-y-1 hover:border-emerald-200 transition-all duration-300 group relative max-md:aspect-square flex flex-col justify-between">
              <div className="flex justify-between items-start md:mb-5">
                <div className="p-2.5 md:p-3 bg-emerald-50 border-2 border-emerald-100 rounded-2xl group-hover:scale-110 transition-transform">
                  <Star className="w-6 h-6 md:w-8 md:h-8 text-emerald-500 fill-emerald-400" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] md:text-xs font-black px-2.5 py-1 md:px-3 bg-emerald-100 text-emerald-600 rounded-full border-2 border-emerald-200">Bagus!</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-3xl md:text-4xl font-black text-slate-800 leading-none">{stats ? stats.averageRating : "0"}</div>
                <div className="text-[10px] md:text-sm text-slate-400 font-black tracking-wide">Rating Rata-rata</div>
              </div>
            </div>
          </div>

          {/* ===== MAIN GRID ===== */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">

            {/* ===== LEFT COLUMN ===== */}
            <div className="xl:col-span-8 space-y-8">



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
                    <div className="bg-white p-8 rounded-4xl border-2 border-slate-100 text-center">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
                    <p className="text-slate-400 font-bold">Belum ada kajian yang mendatang</p>
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
                          <div className={`px-3 py-1 rounded-full text-xs font-black border ${
                            kls.status === "upcoming"
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : "bg-emerald-50 text-emerald-600 border-emerald-200"
                          }`}>
                            {kls.status === "upcoming" ? "Segera" : "Pending"}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500 font-bold">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> {kls.time}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" /> {kls.students} siswa
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
                      <BookMarked className="w-5 h-5 text-slate-800" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800">Overview Kajian</h2>
                  </div>

                </div>

                {coursesOverview.length === 0 ? (
                    <div className="bg-white p-8 rounded-4xl border-2 border-slate-100 text-center">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
                    <p className="text-slate-400 font-bold">Belum ada kajian aktif</p>
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
                            <span className="text-slate-500 font-bold flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Siswa</span>
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
                            <span className="text-slate-500 font-bold">Progress</span>
                            <span className="font-black text-emerald-600">{course.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className="bg-linear-to-r from-emerald-400 to-teal-400 h-2 rounded-full transition-all"
                              style={{ width: `${course.progress}%` }}
                            />
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
              <div className="bg-linear-to-br from-emerald-400 to-teal-500 p-5 rounded-4xl text-white shadow-[0_6px_0_0_#047857] border-2 border-emerald-600 relative overflow-hidden group transition-transform hover:scale-[1.02]">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10 blur-sm" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8 blur-sm" />

                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-8 h-8 text-white" strokeWidth={2} />
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
                  <p className="text-xs text-slate-400 font-bold text-center py-4">Belum ada aktivitas</p>
                ) : (
                  <div className="space-y-3">
                    {recentActivities.map((activity) => {
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
                          className="flex items-start gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all group cursor-pointer"
                        >
                          <div className={`p-2.5 ${bgColor} border-2 ${borderColor} rounded-2xl shrink-0 mt-0.5 group-hover:scale-110 transition-transform shadow-sm`}>
                            <ActivityIcon className={`w-4 h-4 ${iconColor}`} strokeWidth={2.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 text-[13px] leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2">
                              {activity.title}
                            </p>
                            <p className="text-[11px] text-slate-400 font-black mt-1.5 flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-slate-300" /> {activity.time}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Motivational Card */}
              <div className="bg-white p-5 rounded-4xl border-2 border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
                <div className="flex items-center gap-3 mb-3 relative z-10">
                  <div className="p-2 bg-white border-2 border-slate-200 rounded-xl shadow-[0_3px_0_0_#e2e8f0]">
                    <Award className="w-5 h-5 text-emerald-500" strokeWidth={2.5} />
                  </div>
                  <h4 className="font-black text-base text-slate-800">Pencapaian Minggu Ini</h4>
                </div>
                <p className="text-sm text-slate-500 font-bold relative z-10 leading-relaxed mb-4">
                  Kamu telah mengajar <span className="text-emerald-600">{achievement?.weeklySessions || 0} sesi</span> dan mendapatkan rating rata-rata <span className="text-emerald-500 font-black">{achievement?.weeklyRating || 0} ⭐</span> minggu ini!
                </p>
                <Link
                  href="/instructor-dashboard"
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-emerald-500 text-white text-sm font-black rounded-2xl hover:bg-emerald-400 transition-colors relative z-10 shadow-[0_4px_0_0_#047857] border border-emerald-400 active:shadow-none active:translate-y-1"
                >
                  Lihat Laporan Lengkap <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

            </div>
          </div>
        </main>
      </div>

      <ChatbotButton />
    </div>
  );
}
