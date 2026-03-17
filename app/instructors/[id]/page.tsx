"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import Loading from "@/components/ui/Loading";
import BackButton from "@/components/ui/BackButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Mail,
  Calendar,
  BookOpen,
  Star,
  Activity,
  Users,
  MessageCircle,
  GraduationCap,
  Shield,
  Clock
} from "lucide-react";

interface InstructorProfile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  role: string;
  bidangKeahlian: string | null;
  pengalaman: string | null;
  createdAt: string;
  lastSeen: string;
}

interface Material {
  id: string;
  title: string;
  description: string | null;
  date: string;
  thumbnailUrl: string | null;
  category: string;
  grade: string;
}

interface InstructorStats {
  kajianCount: number;
  totalParticipants: number;
  averageRating: number;
}

const InstructorDetail = () => {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const instructorId = params?.id as string;

  const [instructor, setInstructor] = useState<InstructorProfile | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stats, setStats] = useState<InstructorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (instructorId) {
      fetchInstructorDetail();
    }
  }, [instructorId]);

  const fetchInstructorDetail = async () => {
    try {
      const res = await fetch(`/api/instructors/${instructorId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setInstructor(data.instructor);
      setMaterials(data.materials);
      setStats(data.stats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isOnline = (ls: string) => Date.now() - new Date(ls).getTime() < 300000;
  
  const formatLastSeen = (ls: string) => {
    const m = Math.floor((Date.now() - new Date(ls).getTime()) / 60000);
    if (m < 5) return "Online";
    if (m < 60) return `${m} menit yang lalu`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} jam yang lalu`;
    return `${Math.floor(h / 24)} hari yang lalu`;
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loading text="Memuat profil instruktur..." size="lg" />
      </div>
    );

  if (!instructor)
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
        <DashboardHeader />
        <div className="flex flex-1">
          <div className="hidden lg:block h-[calc(100vh-80px)] sticky top-20">
            <Sidebar />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="h-12 w-12 text-slate-300" />
              </div>
              <h2 className="text-2xl font-black text-slate-700 mb-2">
                Instruktur Tidak Ditemukan
              </h2>
              <p className="text-slate-500 mb-6">
                Profil instruktur yang kamu cari tidak tersedia.
              </p>
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Kembali
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  const online = isOnline(instructor.lastSeen);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans">
      <DashboardHeader />
      <div className="flex flex-1">
        <div className="hidden lg:block h-[calc(100vh-80px)] sticky top-20">
          <Sidebar />
        </div>
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          <div className="mb-6">
            <BackButton />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* LEFT: Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white border-2 border-slate-200 rounded-4xl shadow-[0_6px_0_0_#cbd5e1] overflow-hidden sticky top-24 px-6 pb-6 pt-10">
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${online ? "bg-emerald-400 animate-pulse" : "bg-slate-300"}`}
                  />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                    {formatLastSeen(instructor.lastSeen)}
                  </span>
                </div>
                <div className="relative">
                  <div className="flex justify-center mb-6">
                    <Avatar className="h-28 w-28 border-4 border-white shadow-xl">
                      <AvatarImage
                        src={
                          instructor.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${instructor.name}`
                        }
                        alt={instructor.name || "Instructor"}
                      />
                      <AvatarFallback className="bg-emerald-500 text-white font-black text-3xl">
                        {(instructor.name || "I").substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="text-center mb-4">
                    <h1 className="text-2xl font-black text-slate-800 mb-1">
                      {instructor.name}
                    </h1>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-black text-emerald-700 uppercase tracking-wider">
                      <GraduationCap className="h-3.5 w-3.5" />
                      Instruktur
                    </div>
                    {instructor.bidangKeahlian && (
                      <p className="text-xs text-slate-400 font-black mt-3 uppercase tracking-widest">
                        {instructor.bidangKeahlian}
                      </p>
                    )}
                  </div>
                  
                  {instructor.bio && (
                    <div className="bg-slate-50/50 rounded-2xl p-4 mb-6 border border-slate-100 italic">
                      <p className="text-sm text-slate-600 text-center leading-relaxed">
                        "{instructor.bio}"
                      </p>
                    </div>
                  )}

                  {instructor.pengalaman && (
                    <div className="mb-6 px-2">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Pengalaman</h4>
                       <p className="text-sm text-slate-700 font-medium leading-relaxed bg-white border-l-4 border-emerald-500 pl-3 py-1">
                        {instructor.pengalaman}
                       </p>
                    </div>
                  )}

                  <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-4 text-sm bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                        <Mail className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex flex-col min-w-0">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Email</span>
                         <span className="text-slate-600 font-bold truncate text-xs">{instructor.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                        <Calendar className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Bergabung</span>
                         <span className="text-slate-600 font-bold text-xs">
                          {new Date(instructor.createdAt).toLocaleDateString(
                            "id-ID",
                            { year: "numeric", month: "long", day: "numeric" },
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                     <button 
                        onClick={() => router.push(`/chat-rooms?userId=${instructor.id}`)}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 border-b-4 border-emerald-700 hover:border-b-2 active:border-b-0 transition-all shadow-lg text-sm uppercase tracking-wide"
                     >
                        <MessageCircle className="h-5 w-5" />
                        HUBUNGI INSTRUKTUR
                     </button>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Stats & Materials */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: <BookOpen className="h-7 w-7 text-emerald-500" />,
                    val: stats?.kajianCount || 0,
                    lbl: "TOTAL KAJIAN",
                    bg: "bg-emerald-50",
                    bdr: "border-emerald-100",
                    hv: "hover:border-emerald-300 hover:shadow-[0_4px_0_0_#10b981]",
                  },
                  {
                    icon: <Star className="h-7 w-7 text-emerald-500" fill="currentColor" />,
                    val: stats?.averageRating || 0,
                    lbl: "RATA-RATA RATING",
                    bg: "bg-emerald-50",
                    bdr: "border-emerald-100",
                    hv: "hover:border-emerald-300 hover:shadow-[0_4px_0_0_#10b981]",
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className={`flex flex-col items-center justify-center p-6 rounded-3xl ${s.bg} border-2 ${s.bdr} transition-all duration-300 ${s.hv} group cursor-default h-full`}
                  >
                    <div className="w-14 h-14 bg-white/50 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-white/50">
                      {s.icon}
                    </div>
                    <div className="text-3xl font-black text-slate-800 group-hover:text-slate-900 leading-none mb-1">
                      {s.val}
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {s.lbl}
                    </div>
                  </div>
                ))}
              </div>

              {/* Materials Section */}
              <div className="bg-white border-2 border-slate-200 rounded-[2.5rem] p-8 shadow-[0_8px_0_0_#cbd5e1]">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center border-2 border-emerald-100">
                      <GraduationCap className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-800 leading-none mb-1">
                        Daftar Kajian
                      </h2>
                      <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">
                         Kajian yang dibawakan oleh {instructor.name?.split(" ")[0]}
                      </p>
                    </div>
                  </div>
                </div>

                {materials.length === 0 ? (
                  <div className="text-center py-20 bg-slate-50 rounded-4xl border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <BookOpen className="h-10 w-10 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-black text-sm uppercase tracking-wide">
                      Belum ada kajian yang dibuat
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {materials.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => router.push(`/materials/${m.id}`)}
                        className="flex items-center gap-5 p-5 rounded-3xl bg-slate-50/50 border-2 border-slate-100 hover:bg-white hover:border-emerald-200 hover:shadow-lg transition-all group cursor-pointer"
                      >
                        <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border-2 border-white shadow-md group-hover:scale-105 transition-transform bg-slate-200">
                           {m.thumbnailUrl ? (
                              <img 
                                src={m.thumbnailUrl} 
                                alt={m.title} 
                                className="w-full h-full object-cover"
                              />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center bg-emerald-50">
                                 <BookOpen className="h-8 w-8 text-emerald-200" />
                              </div>
                           )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 text-[9px] font-black uppercase tracking-widest">
                             <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">
                                {m.category}
                             </span>
                             <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                                Kelas {m.grade}
                             </span>
                          </div>
                          <h4 className="font-black text-slate-700 text-lg truncate mb-1 group-hover:text-emerald-600 transition-colors">
                            {m.title}
                          </h4>
                          <div className="flex items-center gap-3 text-slate-400">
                             <div className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                <span className="text-[11px] font-bold uppercase tracking-tight">
                                   {formatDate(m.date)}
                                </span>
                             </div>
                          </div>
                        </div>
                        <div className="hidden sm:flex flex-col items-end gap-2">
                           <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-emerald-500 shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-all">
                              <ArrowLeft className="h-5 w-5 rotate-180" />
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      <ChatbotButton />
    </div>
  );
};

export default InstructorDetail;
