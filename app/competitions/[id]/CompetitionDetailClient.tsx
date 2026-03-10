"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import { useSession } from "next-auth/react";
import CartoonConfirmDialog from "@/components/ui/ConfirmDialog";
import Toast from "@/components/ui/Toast";
import Loading from "@/components/ui/Loading";
import ButtonEdit from "@/components/ui/ButtonEdit";
import DeleteButton from "@/components/ui/DeleteButton";
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
  Target,
  Users,
  Contact,
  Share2
} from "lucide-react";

interface Competition {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  prize: string;
  category: "Tahfidz" | "Seni" | "Bahasa" | "Lainnya";
  thumbnailUrl: string;
  requirements: string[];
  schedules: Array<{
    phase: string;
    date: string;
    description?: string;
  }>;
  judgingCriteria: string[];
  prizes: Array<{
    rank: string;
    amount: string;
    benefits?: string;
  }>;
  contactPerson: string;
  contactNumber: string;
  contactEmail: string;
  status: "upcoming" | "ongoing" | "finished";
  participants?: number;
  maxParticipants?: number;
}

export default function CompetitionDetailClient({ 
  initialCompetition, 
  competitionId 
}: { 
  initialCompetition: Competition | null;
  competitionId: string;
}) {
  const [competition, setCompetition] = useState<Competition | null>(initialCompetition);
  const [loading, setLoading] = useState(!initialCompetition);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });

  const { data: session } = useSession();
  const router = useRouter();

  const isPrivileged = session?.user?.role === "admin" || session?.user?.role === "instruktur";

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    if (!initialCompetition && competitionId) {
      fetchCompetitionDetail();
    }
  }, [competitionId, initialCompetition]);

  const fetchCompetitionDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/competitions/${competitionId}`);
      if (!response.ok) {
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

  const handleShare = async () => {
    if (!competition) return;

    const shareData = {
      title: competition.title,
      text: `${competition.title}\n\n${competition.description}\n\nHadiah: ${competition.prize}\n\nIkuti kompetisinya di IRMA Verse!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        showToast("Berhasil dibagikan!", "success");
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        showToast("Link berhasil disalin ke clipboard!", "success");
      }
    } catch (err) {
      console.error("Error sharing:", err);
      if ((err as Error).name !== 'AbortError') {
        showToast("Gagal membagikan", "error");
      }
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/competitions/${competitionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete competition');

      showToast("Kompetisi berhasil dihapus", "success");
      setTimeout(() => router.push('/competitions'), 1500);
    } catch (error) {
      console.error('Error deleting competition:', error);
      showToast("Gagal menghapus kompetisi", "error");
    } finally {
      setShowConfirmDelete(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-5xl mx-auto">
              <div className="flex flex-col items-center justify-center py-12">
                <Loading text="Memuat detail kompetisi..." />
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
          <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-[80vh]">
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
            
            {/* --- HEADER NAVIGATION & ACTIONS --- */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <button
                onClick={() => router.push('/competitions')}
                className="self-start inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 font-bold transition-colors group px-4 py-2 rounded-xl border-2 border-transparent hover:border-slate-200 hover:bg-white"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" strokeWidth={3} />
                Kembali
              </button>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                {isPrivileged && (
                  <>
                    <ButtonEdit
                      id={competitionId}
                      basePath="/competitions"
                      className="h-12 w-12"
                    />
                    <DeleteButton
                      onClick={() => setShowConfirmDelete(true)}
                      variant="icon-only"
                      className="rounded-xl h-12 w-12"
                    />
                  </>
                )}
                <button 
                  onClick={handleShare}
                  title="Bagikan kompetisi ini"
                  className="w-12 h-12 bg-white rounded-2xl border-2 border-slate-200 text-slate-400 hover:text-teal-500 hover:border-teal-400 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all shadow-md flex items-center justify-center group"
                >
                  <Share2 className="h-5 w-5 stroke-[2.5] group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>

            {/* --- HERO SECTION --- */}
            <div className="relative bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[0_8px_0_0_#cbd5e1] overflow-hidden group">
              <div className="relative h-64 md:h-80 w-full overflow-hidden border-b-2 border-slate-200">
                <img
                   src={competition.thumbnailUrl || "https://picsum.photos/seed/competition/1200/600"}
                   alt={competition.title}
                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                
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
              <div className="lg:col-span-2 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                    <div className="bg-white p-4 md:p-5 rounded-2xl md:rounded-4xl border-2 border-slate-200 shadow-[2px_2px_0_0_#cbd5e1] md:shadow-[4px_4px_0_0_#cbd5e1] flex flex-row sm:flex-col items-center gap-4 sm:gap-2 text-left sm:text-center hover:-translate-y-1 transition-transform">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 rounded-full flex items-center justify-center border-2 border-emerald-200 shrink-0">
                            <Trophy className="h-5 w-5 md:h-6 md:w-6 text-emerald-500" />
                        </div>
                        <div className="min-w-0">
                            <span className="block text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Hadiah Utama</span>
                            <span className="block text-sm md:text-sm font-black text-slate-700 line-clamp-1 sm:line-clamp-2">{competition.prize}</span>
                        </div>
                    </div>
                    <div className="bg-white p-4 md:p-5 rounded-2xl md:rounded-4xl border-2 border-slate-200 shadow-[2px_2px_0_0_#cbd5e1] md:shadow-[4px_4px_0_0_#cbd5e1] flex flex-row sm:flex-col items-center gap-4 sm:gap-2 text-left sm:text-center hover:-translate-y-1 transition-transform">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 rounded-full flex items-center justify-center border-2 border-emerald-200 shrink-0">
                            <MapPin className="h-5 w-5 md:h-6 md:w-6 text-emerald-500" />
                        </div>
                        <div className="min-w-0">
                            <span className="block text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Lokasi</span>
                            <span className="block text-sm md:text-sm font-black text-slate-700 line-clamp-1 sm:line-clamp-2">{competition.location}</span>
                        </div>
                    </div>
                    {competition.maxParticipants && (
                    <div className="bg-white p-4 md:p-5 rounded-2xl md:rounded-4xl border-2 border-slate-200 shadow-[2px_2px_0_0_#cbd5e1] md:shadow-[4px_4px_0_0_#cbd5e1] flex flex-row sm:flex-col items-center gap-4 sm:gap-2 text-left sm:text-center hover:-translate-y-1 transition-transform">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 rounded-full flex items-center justify-center border-2 border-emerald-200 shrink-0">
                            <Users className="h-5 w-5 md:h-6 md:w-6 text-emerald-500" />
                        </div>
                        <div className="min-w-0">
                            <span className="block text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Kuota</span>
                            <span className="block text-sm md:text-sm font-black text-slate-700 line-clamp-1 sm:line-clamp-2">{competition.maxParticipants} Peserta</span>
                        </div>
                    </div>
                    )}
                </div>

                {competition.requirements && competition.requirements.length > 0 && (
                  <div className="bg-white p-6 rounded-4xl border-2 border-slate-200 shadow-[0_4px_0_0_#e2e8f0]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-100 rounded-xl border-2 border-emerald-200">
                            <Clock className="h-6 w-6 text-emerald-600" strokeWidth={2.5} />
                        </div>
                        <h2 className="text-xl font-black text-slate-800">Persyaratan Peserta</h2>
                    </div>
                    <ul className="space-y-3">
                      {competition.requirements.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-colors">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-slate-200 text-slate-600 font-black text-sm shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-slate-700 font-bold text-sm md:text-base">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {competition.judgingCriteria && competition.judgingCriteria.length > 0 && (
                  <div className="bg-white p-6 rounded-4xl border-2 border-slate-200 shadow-[0_4px_0_0_#e2e8f0]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-100 rounded-xl border-2 border-emerald-200">
                            <CheckCircle2 className="h-6 w-6 text-emerald-600" strokeWidth={2.5} />
                        </div>
                        <h2 className="text-xl font-black text-slate-800">Kriteria Penilaian</h2>
                    </div>
                    <ul className="space-y-3">
                      {competition.judgingCriteria.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-colors">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-slate-200 text-slate-600 font-black text-sm shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-slate-700 font-bold text-sm md:text-base">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {competition.schedules && competition.schedules.length > 0 && (
                  <div className="bg-white p-6 rounded-4xl border-2 border-slate-200 shadow-[0_4px_0_0_#e2e8f0]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-100 rounded-xl border-2 border-emerald-200">
                            <Clock className="h-6 w-6 text-emerald-600" strokeWidth={2.5} />
                        </div>
                        <h2 className="text-xl font-black text-slate-800">Timeline Perlombaan</h2>
                    </div>
                    <ul className="space-y-3">
                      {competition.schedules.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-colors">
                          <div className="flex-1">
                            <p className="text-slate-700 font-bold text-sm md:text-base">{item.phase}</p>
                            <p className="text-slate-500 text-xs mt-1">{item.date}</p>
                            {item.description && <p className="text-slate-400 text-xs mt-1 italic">{item.description}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

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
                            {item.benefits && <p className="text-slate-500 text-xs mt-1 leading-tight">{item.benefits}</p>}
                          </div>
                          {item.amount && <span className="text-emerald-600 font-black text-base">{item.amount}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-[45px] border-4 border-slate-200 shadow-[0_10px_0_0_#cbd5e1] overflow-hidden p-8 flex flex-col items-center relative">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 bg-teal-500 rounded-full border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                      <Contact className="h-16 w-16 text-white" strokeWidth={2.5} />
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-slate-800 leading-tight mb-8 text-center">
                    {competition.contactPerson || "Panitia IRMA"}
                  </h3>

                  <div className="w-full pt-6 border-t-2 border-slate-100">
                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4 text-center">
                      — HUBUNGI NARAHUBUNG —
                    </p>
                    
                    {competition.contactNumber && (
                      <button
                        onClick={() => {
                          const phone = competition.contactNumber.replace(/\D/g, "");
                          window.open(`https://wa.me/${phone}`, "_blank", "noopener,noreferrer");
                        }}
                        className="w-full p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all group mt-2"
                      >
                        <MessageCircle className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" strokeWidth={3} />
                        <span className="font-bold text-emerald-700">WhatsApp Narahubung</span>
                      </button>
                    )}

                    {competition.contactEmail && (
                      <button
                        onClick={() => {
                          window.location.href = `mailto:${competition.contactEmail}`;
                        }}
                        className="w-full p-4 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center gap-2 hover:bg-blue-100 transition-all group mt-2"
                      >
                        <Mail className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" strokeWidth={3} />
                        <span className="font-bold text-blue-700">Email Narahubung</span>
                      </button>
                    )}
                  </div>
                </div>

                {competition.status !== "finished" && (
                    <div className="bg-linear-to-br from-teal-400 to-cyan-400 rounded-4xl p-6 text-white border-2 border-teal-600 shadow-[0_6px_0_0_#0f766e] text-center">
                        <h3 className="text-xl font-black mb-2">Tertarik Berkompetisi?</h3>
                        <p className="text-teal-50 text-sm font-medium mb-6 leading-relaxed">
                            Daftarkan diri kamu sekarang dan tunjukkan kemampuanmu!
                            {competition.maxParticipants ? ` Kuota terbatas untuk ${competition.maxParticipants} peserta!` : ""}
                        </p>
                        <button className="w-full py-4 rounded-xl bg-white text-teal-600 font-black border-2 border-teal-100 shadow-lg hover:bg-teal-50 hover:scale-105 transition-all flex items-center justify-center gap-2">
                            Daftar Sekarang
                        </button>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <ChatbotButton />
      </div>

      <CartoonConfirmDialog
        type="warning"
        title="Hapus Kompetisi?"
        message="Apakah Anda yakin ingin menghapus kompetisi ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        isOpen={showConfirmDelete}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />

      <Toast 
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}
