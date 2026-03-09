"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import ButtonEdit from "@/components/ui/ButtonEdit";
import DeleteButton from "@/components/ui/DeleteButton";
import Loading from "@/components/ui/Loading";
import Toast from "@/components/ui/Toast"; // Import Toast
import CartoonConfirmDialog from "@/components/ui/ConfirmDialog"; // Import Confirm Dialog
import { 
  Calendar, 
  MapPin, 
  ArrowLeft,
  Phone, 
  Mail, 
  Info,
  SearchX,
  Share2,
  User,
  Clock,
  CheckCircle2,
  Contact,
  MessageCircle
} from "lucide-react";
import Image from "next/image";

interface Schedule {
  id: string;
  title: string;
  description: string | null;
  fullDescription?: string | null;
  date: string;
  time?: string;
  location: string | null;
  pemateri: string | null;
  pemateriAvatar?: string | null;
  pemateriSpecialization?: string | null;
  status?: string;
  image?: string;
  contactNumber?: string | null;
  contactEmail?: string | null;
  instructorId?: string;
}

const ScheduleDetail = () => {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const scheduleId = params.id as string;

  const isInstructor = session?.user?.role === "instruktur" || session?.user?.role === "admin";

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    if (scheduleId) {
      fetchScheduleDetail();
    }
  }, [scheduleId]);

  const fetchScheduleDetail = async () => {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch schedule");
      }
      const data = await response.json();
      
      const mappedSchedule = {
        ...data,
        instructorId: data.instructorId,
        status: data.status === "segera_hadir" 
          ? "Segera hadir" 
          : data.status === "ongoing" 
          ? "Sedang berlangsung" 
          : "Acara telah dilaksanakan",
        pemateriAvatar: data.instructor?.name 
          ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.instructor.name}`
          : null,
        pemateriSpecialization: data.instructor?.bidangKeahlian || "Instruktur",
        image: data.thumbnailUrl || `https://picsum.photos/seed/event${data.id}/800/400`,
      };
      
      setSchedule(mappedSchedule);
    } catch (error) {
      console.error("Error loading schedule:", error);
      showToast("Gagal memuat detail event", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
        const response = await fetch(`/api/schedules/${scheduleId}`, {
            method: "DELETE",
        });

        if (!response.ok) throw new Error("Gagal menghapus event");

        showToast("Event berhasil dihapus", "success");
        setTimeout(() => router.push("/schedule"), 1500);
    } catch (error) {
        console.error("Error deleting schedule:", error);
        showToast("Gagal menghapus event", "error");
    } finally {
        setShowConfirmDelete(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, string> = {
      "Segera hadir": "bg-emerald-400 text-white border-emerald-600 shadow-[2px_2px_0_0_#065f46] md:shadow-[4px_4px_0_0_#065f46]",
      "Sedang berlangsung": "bg-blue-400 text-white border-blue-600 shadow-[2px_2px_0_0_#1e40af] md:shadow-[4px_4px_0_0_#1e40af]",
      "Acara telah dilaksanakan": "bg-slate-400 text-white border-slate-600 shadow-[2px_2px_0_0_#475569] md:shadow-[4px_4px_0_0_#475569]"
    };

    const style = statusConfig[status] || statusConfig["Segera hadir"];
    return (
      <span className={`inline-flex items-center px-3 py-1 md:px-4 md:py-1.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black border-2 uppercase tracking-wide transform -rotate-2 ${style}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
         <DashboardHeader />
         <div className="flex">
            <Sidebar />
            <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
               <Loading text="Sedang mengambil data event..." size="lg" />
            </div>
         </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 px-4 md:px-6 py-12 flex justify-center items-center">
            <div className="max-w-md text-center py-12 bg-white rounded-3xl border-2 border-slate-200">
                <div className="inline-block p-4 rounded-full bg-slate-50 border-2 border-slate-100 mb-6">
                    <SearchX className="h-10 w-10 text-slate-300" />
                </div>
                <h2 className="text-2xl font-black text-slate-700 mb-2">Event Tidak Ditemukan</h2>
                <p className="text-slate-500 font-medium mb-8 px-4">Sepertinya event ini sudah dihapus atau link-nya salah.</p>
                <button
                  onClick={() => router.push('/schedule')}
                  className="px-6 py-3 bg-teal-400 text-white font-black rounded-xl border-2 border-teal-600 hover:translate-y-0.5 transition-all"
                >
                  Kembali ke Jadwal
                </button>
            </div>
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
        <ChatbotButton />
        
        <div className="flex-1 w-full max-w-[100vw] overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
          <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
            
            {/* --- HEADER NAVIGATION & ACTIONS --- */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <button
                  onClick={() => router.back()}
                  className="self-start inline-flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-xl bg-white border-2 border-slate-200 text-slate-500 font-bold hover:border-teal-400 hover:text-teal-600 hover:shadow-[0_4px_0_0_#cbd5e1] active:translate-y-0.5 active:shadow-none transition-all text-sm lg:text-base"
                >
                  <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" strokeWidth={3} />
                  Kembali
                </button>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-end sm:self-auto">
                    {isInstructor && (
                        <>
                            <ButtonEdit 
                                id={schedule.id} 
                                basePath="/schedule" 
                                className="h-12 w-12" 
                            />
                            
                            <DeleteButton 
                                onClick={() => setShowConfirmDelete(true)}
                                variant="icon-only"
                                className="rounded-xl h-12 w-12"
                            />
                        </>
                    )}

                    <button className="w-12 h-12 bg-white rounded-2xl border-2 border-slate-200 text-slate-400 hover:text-teal-500 hover:border-teal-400 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all shadow-md flex items-center justify-center group">
                        <Share2 className="h-5 w-5 stroke-[2.5] group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>

            {/* --- HERO SECTION --- */}
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] overflow-hidden border-2 border-slate-200 shadow-[4px_4px_0_0_#cbd5e1] md:shadow-[8px_8px_0_0_#cbd5e1] group">
              <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden">
                <img
                  src={schedule.image || "https://picsum.photos/seed/event1/1200/600"}
                  alt={schedule.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 md:p-10">
                  <div className="mb-3 md:mb-4">
                    {getStatusBadge(schedule.status || "")}
                  </div>
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-2 md:mb-3 leading-tight drop-shadow-md text-balance">
                    {schedule.title}
                  </h1>
                  <p className="text-slate-200 text-sm md:text-lg font-medium max-w-3xl line-clamp-2 leading-relaxed">
                    {schedule.description}
                  </p>
                </div>
              </div>
            </div>

            {/* --- GRID LAYOUT --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              
              {/* LEFT COLUMN: DETAILS */}
              <div className="lg:col-span-2 space-y-6 md:space-y-8">
                
                {/* Info Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-sm flex items-center gap-4 hover:-translate-y-1 transition-transform">
                        <div className="w-12 h-12 shrink-0 rounded-full bg-emerald-50 flex items-center justify-center border-2 border-emerald-100">
                            <Calendar className="h-6 w-6 text-emerald-500" strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col flex-1 overflow-hidden">
                           <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Tanggal</span>
                           <span className="text-slate-800 font-black text-sm md:text-base truncate">
                               {new Date(schedule.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                           </span>
                        </div>
                    </div>

                    {schedule.time && (
                        <div className="bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-sm flex items-center gap-4 hover:-translate-y-1 transition-transform">
                            <div className="w-12 h-12 shrink-0 rounded-full bg-emerald-50 flex items-center justify-center border-2 border-emerald-100">
                                <Clock className="h-6 w-6 text-emerald-500" strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col flex-1 overflow-hidden">
                                <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Waktu</span>
                                <span className="text-slate-800 font-black text-sm md:text-base truncate">{schedule.time} WIB</span>
                            </div>
                        </div>
                    )}

                    {schedule.location && (
                        <div className="bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-sm flex items-center gap-4 hover:-translate-y-1 transition-transform">
                            <div className="w-12 h-12 shrink-0 rounded-full bg-emerald-50 flex items-center justify-center border-2 border-emerald-100">
                                <MapPin className="h-6 w-6 text-emerald-500" strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col flex-1 overflow-hidden">
                                <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Lokasi</span>
                                <span className="text-slate-800 font-black text-sm md:text-base truncate">{schedule.location}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Full Description */}
                {schedule.fullDescription && (
                  <div className="bg-white p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] border-2 border-slate-200 shadow-[4px_4px_0_0_#cbd5e1] md:shadow-[6px_6px_0_0_#cbd5e1]">
                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                        <div className="w-10 h-10 md:w-14 md:h-14 bg-emerald-100 rounded-2xl flex items-center justify-center border-4 border-emerald-200">
                            <Info className="h-5 w-5 md:h-7 md:w-7 text-emerald-600" strokeWidth={3} />
                        </div>
                        <h3 className="text-lg md:text-2xl font-black text-slate-800">Deskripsi Kegiatan</h3>
                    </div>
                    <div className="prose prose-slate max-w-none">
                        <p className="text-slate-600 font-medium leading-relaxed text-sm md:text-lg whitespace-pre-line text-justify md:text-left">
                            {schedule.fullDescription}
                        </p>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: INSTRUCTOR & CONTACT */}
              <div className="space-y-6 md:space-y-8">
                
                {/* Uploader / Contact Person Card */}
                <div className="bg-white rounded-[45px] border-4 border-slate-200 shadow-[0_10px_0_0_#cbd5e1] overflow-hidden p-8 flex flex-col items-center relative">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 bg-teal-500 rounded-full border-4 border-white shadow-xl overflow-hidden">
                      {schedule.pemateriAvatar && schedule.pemateriAvatar.includes("avatar") && !schedule.pemateriAvatar.includes("dicebear") ? (
                        <img
                          src={schedule.pemateriAvatar}
                          alt={schedule.pemateri || "Narahubung"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white">
                          <Contact className="h-16 w-16" strokeWidth={2.5} />
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-slate-800 leading-tight mb-8">
                    {schedule.pemateri || "Narahubung Event"}
                  </h3>

                  <div className="w-full pt-6 border-t-2 border-slate-100">
                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4 text-center">
                      — HUBUNGI NARAHUBUNG —
                    </p>
                    
                    {schedule.contactNumber && (
                      <button
                        onClick={() => {
                          const phone = schedule.contactNumber?.replace(/\D/g, "");
                          window.open(`https://wa.me/${phone}`, "_blank");
                        }}
                        className="w-full p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all group mt-2"
                      >
                        <MessageCircle className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" strokeWidth={3} />
                        <span className="font-bold text-emerald-700">WhatsApp Narahubung</span>
                      </button>
                    )}

                    {schedule.contactEmail && (
                      <button
                        onClick={() => {
                          window.location.href = `mailto:${schedule.contactEmail}`;
                        }}
                        className="w-full p-4 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center gap-2 hover:bg-blue-100 transition-all group mt-2"
                      >
                        <Mail className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" strokeWidth={3} />
                        <span className="font-bold text-blue-700">Email Narahubung</span>
                      </button>
                    )}

                    {!schedule.contactNumber && !schedule.contactEmail && (
                      <button
                        onClick={() =>
                          router.push(
                            `/instructors/chat?name=${encodeURIComponent(schedule.pemateri || "Narahubung")}`,
                          )
                        }
                        className="w-full p-4 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-center gap-2 hover:border-teal-400 hover:bg-teal-50 transition-all group mt-2"
                      >
                        <MessageCircle className="w-5 h-5 text-teal-500 group-hover:scale-110 transition-transform" strokeWidth={3} />
                        <span className="font-bold text-slate-600">Kirim Pesan</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Important Note */}
                <div className="p-4 md:p-5 bg-amber-50 border-2 border-amber-200 rounded-2xl md:rounded-4xl shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-amber-500 rounded-full animate-ping"></div>
                    </div>
                    <div>
                        <p className="text-xs md:text-sm font-black text-amber-800 mb-1">Penting!</p>
                        <p className="text-[10px] md:text-xs font-bold text-amber-700/80 leading-relaxed">
                            Pastikan Anda hadir 15 menit sebelum acara dimulai untuk registrasi ulang.
                        </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
      <ChatbotButton />

      {/* Confirm Delete Dialog */}
      <CartoonConfirmDialog
        type="warning"
        title="Hapus Event?"
        message="Apakah Anda yakin ingin menghapus event ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        isOpen={showConfirmDelete}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
};

export default ScheduleDetail;