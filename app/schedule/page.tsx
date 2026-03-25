"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import SearchInput from "@/components/ui/SearchInput";
import EmptyState from "@/components/ui/EmptyState";
import Loading from "@/components/ui/Loading";
import DetailButton from "@/components/ui/DetailButton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import SuccessDataFound from "@/components/ui/SuccessDataFound";
import Toast from "@/components/ui/Toast";
import CategoryFilter from "@/components/ui/CategoryFilter";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users,
  Plus
} from "lucide-react";
import AddButton from "@/components/ui/AddButton";
import PageBanner from "@/components/ui/PageBanner";

interface Schedule {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time?: string;
  location: string | null;
  pemateri: string | null;
  registeredCount?: number;
  status?: string;
  image?: string;
  category?: string;
  instructor?: {
    id: string;
    name: string;
    email: string;
  };
}

const Schedule = () => {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Semua");

  const statusOptions = ["Semua", "Segera hadir", "Sedang berlangsung", "Kegiatan telah selesai"];

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    filterSchedules();
  }, [schedules, searchQuery, selectedStatus]);
  
  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/schedules");
      if (!response.ok) {
        throw new Error("Failed to fetch schedules");
      }
      const data = await response.json();
      
      const mappedSchedules = data.map((schedule: any) => ({
        ...schedule,
        status: schedule.status === "segera_hadir" 
          ? "Segera hadir" 
          : schedule.status === "ongoing" 
          ? "Sedang berlangsung" 
          : "Kegiatan telah selesai",
        thumbnail: schedule.thumbnailUrl || `https://picsum.photos/seed/event${schedule.id}/200/200`,
      }));
      
      setSchedules(mappedSchedules);
      setFilteredSchedules(mappedSchedules);
    } catch (error: any) {
      console.error("Error loading schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterSchedules = () => {
    let filtered = schedules;

    if (searchQuery) {
      filtered = filtered.filter(schedule =>
        schedule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedStatus !== "Semua") {
      filtered = filtered.filter(schedule => schedule.status === selectedStatus);
    }

    setFilteredSchedules(filtered);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    setScheduleToDelete(scheduleId);
    setShowConfirmDelete(true);
  };

  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return;

    setDeletingId(scheduleToDelete);
    try {
      const response = await fetch(`/api/schedules/${scheduleToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let errorMessage = "Gagal menghapus jadwal";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      showToast("Jadwal berhasil dihapus", "success");
      setSchedules(schedules.filter(s => s.id !== scheduleToDelete));
      setShowConfirmDelete(false);
      setScheduleToDelete(null);
    } catch (error: any) {
      console.error("Error deleting schedule:", error);
      showToast(error.message || "Terjadi kesalahan saat menghapus jadwal", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const { data: session } = useSession({
    required: false,
    onUnauthenticated() {
      window.location.href = "/auth";
    }
  });


  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 px-6 lg:px-8 py-12 lg:ml-0">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <PageBanner
              title="Kegiatan IRMA"
              description="Daftar kegiatan IRMA yang akan datang dan sedang berlangsung"
              icon={Calendar}
              tag="Jadwal"
              tagIcon={Calendar}
              action={
                (session?.user?.role === "instruktur" || session?.user?.role === "admin" || session?.user?.role === "super_admin") ? (
                  <AddButton
                    label="Buat Kegiatan"
                    onClick={() => router.push("/schedule/create")}
                    icon={<Plus className="h-5 w-5" />}
                    color="emerald"
                    hideIcon={false}
                  />
                ) : undefined
              }
            />

            {/* Filter & Search Bar */}
            {!loading && schedules.length > 0 && (
              <div className="grid gap-6 mb-8 lg:grid-cols-[1fr_auto]">
                <div className="space-y-4 min-w-0 pr-1">
                  {/* Status Filter Buttons */}
                  <CategoryFilter
                    categories={statusOptions}
                    subCategories={[]}
                    selectedCategory={selectedStatus}
                    selectedSubCategory=""
                    onCategoryChange={setSelectedStatus}
                    onSubCategoryChange={() => {}}
                  />
                </div>

                <div className="relative w-full lg:w-80 self-start">
                  <SearchInput
                    placeholder="Cari Kegiatan seru atau topik..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                  />
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-20">
                <Loading text="Memuat jadwal..." />
              </div>
            ) : schedules.length === 0 ? (
               <EmptyState
                 icon="calendar"
                 title="Yah, tidak ada Kegiatan IRMA tersedia sekarang"
                 description="Belum ada kegiatan yang dijadwalkan. Cek lagi nanti ya!"
               />
            ) : filteredSchedules.length === 0 ? (
              <EmptyState
                icon="search"
                title="Yah, Kegiatan tidak ditemukan..."
                description="Coba cari dengan kata kunci lain atau ubah filternya ya!"
                actionLabel="Reset Filter"
                onAction={() => {
                  setSearchQuery("");
                  setSelectedStatus("Semua");
                }}
              />
            ) : (
              <>
                {searchQuery && (
                  <div className="mb-8">
                    <SuccessDataFound
                      message={`Ditemukan ${filteredSchedules.length} Kegiatan sesuai pencarian`}
                      icon="sparkles"
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="bg-white rounded-4xl border-2 border-slate-200 shadow-[0_6px_0_0_#cbd5e1] hover:border-teal-400 hover:shadow-[0_6px_0_0_#34d399] transition-all duration-300 overflow-hidden group hover:-translate-y-2"
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-5 mb-5">
                        {/* Event Image */}
                        <div className="shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm group-hover:scale-105 transition-transform">
                          <img 
                            src={(schedule as any).thumbnail} 
                            alt={schedule.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {/* Status Badge */}
                          {schedule.status && (
                            <span className={`inline-block px-3 py-1 mb-2 rounded-lg text-[10px] font-black uppercase tracking-wide border-2 ${
                                schedule.status === "Segera hadir" || schedule.status === "Sedang berlangsung"
                                ? "bg-amber-100 text-amber-700 border-amber-200" 
                                : "bg-emerald-100 text-emerald-700 border-emerald-200"
                            }`}>
                              {schedule.status}
                            </span>
                          )}
                          
                          <h3 className="text-xl font-black text-slate-800 leading-tight group-hover:text-teal-600 transition-colors line-clamp-2">
                            {schedule.title}
                          </h3>
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border-2 border-slate-100">
                        <div className="flex items-center gap-3 text-sm text-slate-600 font-bold">
                          <Calendar className="h-4 w-4 text-teal-500" />
                          <span>
                            {new Date(schedule.date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        
                        {schedule.time && (
                          <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                            <Clock className="h-4 w-4 text-teal-500" />
                            <span>{schedule.time}</span>
                          </div>
                        )}
                        
                        {schedule.location && (
                          <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                            <MapPin className="h-4 w-4 text-teal-500" />
                            <span className="truncate">{schedule.location}</span>
                          </div>
                        )}
                        
                      {/* Bottom Row: Actions & Info aligned to fill space professionally */}
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-2">
                        {/* Instructor info on the left to balance the icon-only buttons as requested */}
                        {schedule.instructor && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-xl border border-teal-100">
                            <span className="text-[10px] font-black uppercase tracking-wider">
                               Di Upload oleh {schedule.instructor.name}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <DetailButton
                            role={session?.user?.role as any}
                            onClick={() => router.push(`/schedule/${schedule.id}`)}
                            onEdit={() => router.push(`/schedule/${schedule.id}/edit`)}
                            onDelete={() => handleDeleteSchedule(schedule.id)}
                            iconOnly
                            showConfirm={false}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}
          </div>
        </div>
      </div>
      <ChatbotButton />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        type="warning"
        title="Hapus Data?"
        message="Apakah Anda yakin ingin menghapus jadwal ini?"
        confirmText="Ya, Hapus"
        cancelText="Batal"
        isOpen={showConfirmDelete}
        onConfirm={confirmDeleteSchedule}
        onCancel={() => {
          setShowConfirmDelete(false);
          setScheduleToDelete(null);
        }}
      />

      {/* Notification */}
      {toast.show && (
        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
};

export default Schedule;