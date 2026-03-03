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
  HelpCircle,
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

  const recentUsers = [
    {
      id: 1,
      name: "Ahmad Zaki",
      email: "ahmad@irma.com",
      role: "INSTRUCTOR",
      joinedAt: "2 jam lalu",
    },
    {
      id: 2,
      name: "Fatimah Zahra",
      email: "fatimah@irma.com",
      role: "USER",
      joinedAt: "5 jam lalu",
    },
    {
      id: 3,
      name: "Muhammad Rayan",
      email: "rayan@irma.com",
      role: "USER",
      joinedAt: "1 hari lalu",
    },
  ];

  const systemAlerts = [
    {
      id: 1,
      type: "warning",
      message: "Storage mencapai 85% kapasitas",
      time: "2 jam lalu",
    },
    {
      id: 2,
      type: "info",
      message: "Backup sistem berhasil dilakukan",
      time: "6 jam lalu",
    },
    {
      id: 3,
      type: "success",
      message: "Semua sistem berjalan normal",
      time: "1 hari lalu",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center h-[calc(100vh-80px)]">
            <Loading text="Memuat dashboard administrator..." size="lg" />
          </div>
        </div>
      </div>
    );
  }

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
                Admin Dashboard
              </h1>
              <p className="text-slate-500 mt-1 font-bold text-base md:text-lg ml-1">
                Kelola ekosistem IRMA Verse dengan kontrol penuh.
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
                <span className="text-[10px] md:text-xs font-black px-2.5 py-1 md:px-3 bg-emerald-100 text-emerald-600 rounded-full border-2 border-emerald-200">User</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-3xl md:text-4xl font-black text-slate-800 leading-none">{stats.totalUsers.toLocaleString("id-ID")}</div>
                <div className="text-[10px] md:text-sm text-slate-400 font-black tracking-wide uppercase">Total Pengguna</div>
              </div>
            </div>

            {/* Stat 2 - Total Instructors (Blue) */}
            <div className="bg-white p-5 md:p-6 rounded-[2.5rem] border-2 border-blue-100 shadow-[0_8px_0_0_#dbeafe] hover:shadow-[0_4px_0_0_#dbeafe] hover:translate-y-1 hover:border-blue-200 transition-all duration-300 group flex flex-col justify-between aspect-square md:aspect-auto md:min-h-40">
              <div className="flex justify-between items-start mb-2 md:mb-5">
                <div className="p-2.5 md:p-3 bg-blue-50 border-2 border-blue-100 rounded-2xl group-hover:scale-110 transition-transform">
                  <UserCheck className="w-6 h-6 md:w-8 md:h-8 text-blue-500" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] md:text-xs font-black px-2.5 py-1 md:px-3 bg-blue-100 text-blue-600 rounded-full border-2 border-blue-200">Instruktur</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-3xl md:text-4xl font-black text-slate-800 leading-none">{stats.totalInstructors}</div>
                <div className="text-[10px] md:text-sm text-slate-400 font-black tracking-wide uppercase">Total Instruktur</div>
              </div>
            </div>

            {/* Stat 3 - Active Materials (Purple) */}
            <div className="bg-white p-5 md:p-6 rounded-[2.5rem] border-2 border-purple-100 shadow-[0_8px_0_0_#f3e8ff] hover:shadow-[0_4px_0_0_#f3e8ff] hover:translate-y-1 hover:border-purple-200 transition-all duration-300 group flex flex-col justify-between aspect-square md:aspect-auto md:min-h-40">
              <div className="flex justify-between items-start mb-2 md:mb-5">
                <div className="p-2.5 md:p-3 bg-purple-50 border-2 border-purple-100 rounded-2xl group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-purple-500" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] md:text-xs font-black px-2.5 py-1 md:px-3 bg-purple-100 text-purple-600 rounded-full border-2 border-purple-200">Aktif</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-3xl md:text-4xl font-black text-slate-800 leading-none">{stats.totalActiveMaterials}</div>
                <div className="text-[10px] md:text-sm text-slate-400 font-black tracking-wide uppercase">Kajian Ongoing</div>
              </div>
            </div>

            {/* Stat 4 - System Status (Amber) */}
            <div className="bg-white p-5 md:p-6 rounded-[2.5rem] border-2 border-amber-100 shadow-[0_8px_0_0_#fef3c7] hover:shadow-[0_4px_0_0_#fef3c7] hover:translate-y-1 hover:border-amber-200 transition-all duration-300 group flex flex-col justify-between aspect-square md:aspect-auto md:min-h-40">
              <div className="flex justify-between items-start mb-2 md:mb-5">
                <div className="p-2.5 md:p-3 bg-amber-50 border-2 border-amber-100 rounded-2xl group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6 md:w-8 md:h-8 text-amber-500" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] md:text-xs font-black px-2.5 py-1 md:px-3 bg-amber-100 text-amber-600 rounded-full border-2 border-amber-200">Bagus</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-3xl md:text-4xl font-black text-slate-800 leading-none">Healthy</div>
                <div className="text-[10px] md:text-sm text-slate-400 font-black tracking-wide uppercase">Status Sistem</div>
              </div>
            </div>
          </div>

          {/* ===== MAIN GRID ===== */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: CONTROL CENTER */}
            <div className="xl:col-span-8 space-y-10">
              <section>
                <div className="flex items-center justify-between mb-6 px-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white border-2 border-slate-200 rounded-xl shadow-[0_3px_0_0_#e2e8f0]">
                      <Sparkles className="w-5 h-5 text-slate-800" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800">Pusat Kendali Admin</h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { icon: Users, label: "Mengelola User", desc: "Manajemen akun anggota", color: "emerald", path: "/admin/users" },
                    { icon: UserPlus, label: "Mengelola Instruktur", desc: "Kelola akun instruktur", color: "blue", path: "/admin/instructors" },
                    { icon: BookMarked, label: "Rekapan Kajian", desc: "Arsip & ringkasan materi", color: "purple", path: "/materials/rekapan" },
                    { icon: HelpCircle, label: "Kuis Akademia", desc: "Kelola bank soal & nilai", color: "amber", path: "/quiz" },
                    { icon: Bell, label: "Broadcast Pesan", desc: "Kirim pengumuman massal", color: "rose", path: "/admin/broadcast" },
                    { icon: Settings, label: "Konfigurasi IRMA", desc: "Pengaturan inti platform", color: "slate", path: "/admin/settings" },
                  ].map((item, idx) => (
                    <Link
                      key={idx}
                      href={item.path}
                      className={`bg-white p-6 rounded-4xl border-2 border-slate-100 hover:border-${item.color}-400 hover:shadow-[0_8px_0_0_#cbd5e1] hover:-translate-y-1 transition-all group flex items-center gap-5`}
                    >
                      <div className={`p-4 bg-${item.color}-50 border-2 border-${item.color}-100 rounded-2xl group-hover:scale-110 transition-transform`}>
                        <item.icon className={`h-7 w-7 text-${item.color}-500`} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 text-lg group-hover:text-slate-900 transition-colors uppercase tracking-tight">{item.label}</h3>
                        <p className="text-slate-400 font-bold text-sm">{item.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Recent Users Section */}
              <section>
                <div className="flex items-center justify-between mb-6 px-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white border-2 border-slate-200 rounded-xl shadow-[0_3px_0_0_#e2e8f0]">
                      <UserPlus className="w-5 h-5 text-slate-800" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800">Pendaftaran Terbaru</h2>
                  </div>
                  <Link href="/admin/users" className="text-sm font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                    Lihat List <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                
                <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 p-6 space-y-4 shadow-sm">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 border-2 border-slate-100 hover:bg-white transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-black text-slate-700 group-hover:text-indigo-600 transition-colors">{user.name}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{user.email}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase border border-indigo-100">
                                {user.role}
                            </span>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{user.joinedAt}</p>
                        </div>
                    </div>
                  ))}
                </div>
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
                    <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest bg-emerald-600/30 px-2 py-0.5 rounded-md">IRMA Central Control</span>
                  </div>
                </div>

                <div className="bg-emerald-700/20 p-4 rounded-2xl border border-emerald-300/20 mb-6 relative z-10">
                  <p className="text-sm text-emerald-50 font-bold leading-relaxed italic">
                    "Kepemimpinan adalah tanggung jawab untuk melayani dan menjaga amanah ekosistem belajar."
                  </p>
                </div>
              </div>

              {/* System Alerts */}
              <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white border-2 border-slate-200 rounded-xl shadow-[0_3px_0_0_#e2e8f0]">
                            <Bell className="w-5 h-5 text-slate-800" />
                        </div>
                        <h4 className="font-black text-slate-800 text-lg tracking-tight">System Log</h4>
                    </div>
                </div>

                <div className="space-y-4">
                  {systemAlerts.map((alert) => (
                    <div key={alert.id} className="flex gap-4 p-4 rounded-3xl bg-slate-50 border-2 border-slate-100 hover:bg-white hover:border-indigo-100 transition-all group">
                        <div className={`mt-1 p-2 rounded-xl h-fit border-2 ${
                          alert.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-500' : 
                          alert.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : 'bg-blue-50 border-blue-100 text-blue-500'
                        }`}>
                          {alert.type === 'warning' ? <AlertCircle className="h-5 w-5" /> : 
                           alert.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-700 leading-tight mb-1 text-sm group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{alert.message}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{alert.time}</p>
                        </div>
                    </div>
                  ))}
                </div>
                
                <button className="w-full mt-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl border-2 border-dashed border-slate-200 transition-all">
                    Lihat Semua Log
                </button>
              </div>

              {/* Quick Actions */}
              <div className="bg-[#FAF9F6] p-6 rounded-[2.5rem] border-4 border-slate-200 border-dashed text-center">
                  <h4 className="font-black text-slate-400 text-xs uppercase tracking-[0.2em] mb-4">Quick Actions</h4>
                  <div className="space-y-3">
                      <button className="w-full py-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-700 hover:border-teal-400 hover:text-teal-600 transition-all shadow-sm">
                          Backup Database
                      </button>
                      <button className="w-full py-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-700 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm">
                          System Update
                      </button>
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
