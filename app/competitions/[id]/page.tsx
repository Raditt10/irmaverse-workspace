"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin,
  Clock,
  Trophy,
  User,
  MessageCircle,
  Mail,
  CheckCircle2,
  Sparkles,
  Target
} from "lucide-react";

interface Competition {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  prize: string;
  category: "Tahfidz" | "Seni" | "Bahasa" | "Lainnya";
  image: string;
  requirements: string[];
  timeline: Array<{
    phase: string;
    date: string;
  }>;
  judging_criteria: string[];
  prizes: Array<{
    rank: string;
    amount: string;
  }>;
  contact_person: string;
  contact_number: string;
  contact_email: string;
  status: "upcoming" | "ongoing" | "finished";
  participants?: number;
  max_participants?: number;
}

const CompetitionDetail = () => {
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const params = useParams();
  const competitionId = params.id as string;

  useEffect(() => {
    loadUser();
    if (competitionId) {
      fetchCompetitionDetail();
    }
  }, [competitionId]);

  const loadUser = async () => {
    setUser({
      id: "user-123",
      full_name: "Rafaditya Syahputra",
      email: "rafaditya@irmaverse.local",
      avatar: "RS"
    });
  };

  const fetchCompetitionDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/competitions/${competitionId}`);
      
      if (!response.ok) {
        console.error("Failed to fetch competition:", response.status);
        setCompetition(null);
        return;
      }

      const data = await response.json();
      setCompetition(data);
    } catch (error) {
      console.error("Error fetching competition:", error);
      setCompetition(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Competition["status"]) => {
    const statusConfig: Record<Competition["status"], { label: string; color: string }> = {
      "upcoming": { label: "Akan Datang", color: "bg-blue-100 text-blue-700 border-blue-200" },
      "ongoing": { label: "Sedang Berlangsung", color: "bg-amber-100 text-amber-700 border-amber-200" },
      "finished": { label: "Selesai", color: "bg-emerald-100 text-emerald-700 border-emerald-200" }
    };

    const config = statusConfig[status] || statusConfig["upcoming"];
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <p className="text-slate-500">Memuat...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-5xl mx-auto">
              <div className="flex flex-col items-center justify-center py-12">
                <Sparkles className="h-10 w-10 text-teal-400 animate-spin" />
                <p className="text-slate-500 font-bold mt-2">Memuat detail kompetisi...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 p-8 flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center border-4 border-dashed border-slate-300 mb-6">
                <Target className="h-10 w-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-700 mb-2">Kompetisi Tidak Ditemukan</h2>
            <button
              onClick={() => router.push('/competitions')}
              className="mt-4 px-6 py-3 rounded-xl bg-teal-400 text-white font-black border-2 border-teal-600 border-b-4 hover:bg-teal-500 active:border-b-2 active:translate-y-0.5 transition-all"
            >
              Kembali ke Daftar Kompetisi
            </button>
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
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 lg:ml-0">
          <div className="max-w-5xl mx-auto space-y-8">
            
            {/* Back Button */}
            <button
              onClick={() => router.push('/competitions')}
              className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 font-bold transition-colors group px-4 py-2 rounded-xl border-2 border-transparent hover:border-slate-200 hover:bg-white"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" strokeWidth={3} />
              Kembali
            </button>

            {/* --- HERO SECTION --- */}
            <div className="relative bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[0_8px_0_0_#cbd5e1] overflow-hidden group">
              {/* Image Banner */}
              <div className="relative h-64 md:h-80 w-full overflow-hidden border-b-2 border-slate-200">
                <img
                   src={competition.image || "https://picsum.photos/seed/competition/1200/600"}
                   alt={competition.title}
                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                     {getStatusBadge(competition.status)}
                     <span className="px-4 py-1.5 rounded-full text-xs font-black bg-white text-slate-800 border-2 border-slate-200 uppercase tracking-wide">
                       Kategori: {competition.category}
                     </span>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black text-white mb-3 drop-shadow-md leading-tight">
                    {competition.title}
                  </h1>
                  <p className="text-slate-100 text-sm md:text-lg font-medium max-w-2xl line-clamp-2">
                    {competition.description}
                  </p>
                </div>
              </div>
            </div>

            {/* --- GRID LAYOUT --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* LEFT COLUMN (Details) */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Quick Stats Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
                        <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center mb-2 border-2 border-teal-100">
                            <Calendar className="h-5 w-5 text-teal-500" strokeWidth={2.5} />
                        </div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tanggal</span>
                        <span className="text-slate-800 font-black text-sm">{competition.date}</span>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-2 border-2 border-indigo-100">
                            <Trophy className="h-5 w-5 text-indigo-500" strokeWidth={2.5} />
                        </div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hadiah 1</span>
                        <span className="text-slate-800 font-black text-sm truncate">{competition.prize}</span>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
                        <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center mb-2 border-2 border-rose-100">
                            <MapPin className="h-5 w-5 text-rose-500" strokeWidth={2.5} />
                        </div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Lokasi</span>
                        <span className="text-slate-800 font-black text-sm">{competition.location}</span>
                    </div>
                </div>

                {/* Requirements */}
                {competition.requirements && competition.requirements.length > 0 && (
                  <div className="bg-white p-6 rounded-4xl border-2 border-slate-200 shadow-[0_4px_0_0_#e2e8f0]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-100 rounded-xl border-2 border-amber-200">
                            <Clock className="h-6 w-6 text-amber-600" strokeWidth={2.5} />
                        </div>
                        <h2 className="text-xl font-black text-slate-800">Persyaratan Peserta</h2>
                    </div>
                    <ul className="space-y-3">
                      {competition.requirements.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 hover:border-amber-200 hover:bg-amber-50 transition-colors">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-slate-200 text-slate-600 font-black text-sm shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-slate-700 font-bold text-sm md:text-base">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Timeline */}
                {competition.timeline && competition.timeline.length > 0 && (
                  <div className="bg-white p-6 rounded-4xl border-2 border-slate-200 shadow-[0_4px_0_0_#e2e8f0]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-100 rounded-xl border-2 border-purple-200">
                            <Clock className="h-6 w-6 text-purple-600" strokeWidth={2.5} />
                        </div>
                        <h2 className="text-xl font-black text-slate-800">Jadwal Pelaksanaan</h2>
                    </div>
                    <ul className="space-y-3">
                      {competition.timeline.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 hover:border-purple-200 hover:bg-purple-50 transition-colors">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-slate-200 text-slate-600 font-black text-sm shrink-0 mt-0.5">
                            ✓
                          </span>
                          <div className="flex-1">
                            <p className="text-slate-700 font-bold text-sm md:text-base">{item.phase}</p>
                            <p className="text-slate-500 text-xs mt-1">{item.date}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Prizes */}
                {competition.prizes && competition.prizes.length > 0 && (
                  <div className="bg-white p-6 rounded-4xl border-2 border-slate-200 shadow-[0_4px_0_0_#e2e8f0]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-100 rounded-xl border-2 border-emerald-200">
                            <Trophy className="h-6 w-6 text-emerald-600" strokeWidth={2.5} />
                        </div>
                        <h2 className="text-xl font-black text-slate-800">Hadiah Pemenang</h2>
                    </div>
                    <ul className="space-y-3">
                      {competition.prizes.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-100 transition-colors">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-emerald-200 text-emerald-600 font-black text-sm shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-slate-700 font-bold text-sm">{item.rank}</p>
                          </div>
                          <span className="text-emerald-600 font-black text-base">{item.amount}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN (Contact & CTA) */}
              <div className="space-y-6">
                
                {/* Contact Card */}
                <div className="bg-white rounded-4xl border-2 border-slate-200 shadow-[0_6px_0_0_#cbd5e1] overflow-hidden p-6 text-center">
                    <div className="w-24 h-24 mx-auto bg-slate-100 rounded-full mb-4 border-4 border-teal-100 overflow-hidden relative">
                         <div className="absolute inset-0 flex items-center justify-center bg-teal-500 text-white">
                             <Trophy className="h-10 w-10" />
                         </div>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 leading-tight mb-1">{competition.contact_person}</h3>
                    <p className="text-teal-600 text-xs font-bold uppercase tracking-wider mb-6 bg-teal-50 inline-block px-3 py-1 rounded-full border border-teal-100">
                        Narahubung Kompetisi
                    </p>

                    <div className="space-y-3">
                        <a href={`mailto:${competition.contact_email}`} className="flex items-center gap-3 p-3 rounded-xl border-2 border-sky-400 bg-sky-500 text-white shadow-[0_4px_0_0_#0284c7] hover:-translate-y-1 hover:shadow-[0_6px_0_0_#0284c7] active:translate-y-0 active:shadow-none transition-all">
                           <Mail className="w-5 h-5" strokeWidth={2} />
                           <span className="font-black flex-1 text-left text-sm">Email</span>
                        </a>

                        <a href={`tel:${competition.contact_number}`} className="flex items-center gap-3 p-3 rounded-xl border-2 border-green-500 bg-green-500 text-white shadow-[0_4px_0_0_#15803d] hover:-translate-y-1 hover:shadow-[0_6px_0_0_#15803d] active:translate-y-0 active:shadow-none transition-all">
                           <div className="bg-white/20 p-1 rounded-lg">
                                <Clock className="w-5 h-5" />
                           </div>
                           <span className="font-bold flex-1 text-left text-sm">Hubungi</span>
                        </a>
                    </div>
                </div>

                {/* Registration CTA */}
                {competition.status !== "finished" && (
                    <div className="bg-linear-to-br from-teal-400 to-cyan-400 rounded-4xl p-6 text-white border-2 border-teal-600 shadow-[0_6px_0_0_#0f766e] text-center">
                        <h3 className="text-xl font-black mb-2">Tertarik Berkompetisi?</h3>
                        <p className="text-teal-50 text-sm font-medium mb-6 leading-relaxed">
                            Daftarkan diri kamu sekarang dan tunjukkan kemampuanmu! Kuota terbatas!
                        </p>
                        <button className="w-full py-4 rounded-xl bg-white text-teal-600 font-black border-2 border-teal-100 shadow-lg hover:bg-teal-50 hover:scale-105 transition-all flex items-center justify-center gap-2">
                            Daftar Sekarang
                        </button>
                    </div>
                )}

                {/* Disclaimer */}
                <div className="bg-amber-50 border-2 border-amber-200 border-dashed rounded-2xl p-4">
                    <p className="text-xs text-amber-800 font-bold leading-relaxed text-center">
                        💡 Hubungi panitia untuk detail materi dan persiapan sebelum kompetisi dimulai.
                    </p>
                </div>

              </div>

            </div>
          </div>
        </div>
        <ChatbotButton />
      </div>
    </div>
  );
};

export default CompetitionDetail;
