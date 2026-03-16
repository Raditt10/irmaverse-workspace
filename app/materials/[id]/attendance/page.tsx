"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import Toast from "@/components/ui/Toast";
import Loading from "@/components/ui/Loading";
import {
  Users,
  Calendar,
  Clock,
  ArrowLeft,
  Search,
  Download,
  CheckCircle2,
  User,
  History,
} from "lucide-react";
import SearchInput from "@/components/ui/SearchInput";
import SuccessDataFound from "@/components/ui/SuccessDataFound";

interface AttendanceRecord {
  id: string;
  userId: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
}

interface MaterialInfo {
  id: string;
  title: string;
  date: string;
}

const AttendanceList = () => {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [material, setMaterial] = useState<MaterialInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });
  
  const router = useRouter();
  const params = useParams();
  const materialId = params.id as string;

  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      if (typeof window !== "undefined") {
        window.location.href = "/auth";
      }
    },
  });

  const role = session?.user?.role?.toLowerCase();
  const isPrivileged = role === "instruktur" || role === "admin" || role === "instructor" || role === "super_admin";

  useEffect(() => {
    if (status === "authenticated" && !isPrivileged) {
      router.push("/overview");
    }
  }, [status, isPrivileged, router]);

  useEffect(() => {
    if (materialId && isPrivileged) {
      fetchAttendance();
    }
  }, [materialId, isPrivileged]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/materials/${materialId}/attendance`);
      if (!res.ok) throw new Error("Gagal mengambil data absensi");
      const data = await res.json();
      setAttendances(data.attendances || []);
      setMaterial(data.material || null);
      if (data.material) {
        setIsAttendanceOpen(data.material.isAttendanceOpen !== false);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = async () => {
    try {
      setToggling(true);
      const res = await fetch(`/api/materials/${materialId}/attendance/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: !isAttendanceOpen })
      });
      
      if (!res.ok) throw new Error("Gagal mengubah status absensi");
      
      const data = await res.json();
      setIsAttendanceOpen(data.isAttendanceOpen);
      
      const message = data.isAttendanceOpen 
        ? "Absensi telah dibuka" 
        : "Absensi telah ditutup";
        
      setToast({ show: true, message, type: "success" });
      
    } catch (error) {
      console.error("Error toggling attendance:", error);
      setToast({ show: true, message: "Gagal mengubah status absensi", type: "error" });
    } finally {
      setToggling(false);
    }
  };

  const filteredAttendances = attendances.filter((record) =>
    (record.user.name || record.user.email)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
            <Loading text="Memuat daftar absensi..." size="lg" />
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

        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full max-w-[100vw] overflow-x-hidden">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header section with back button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-4">
                <button
                  onClick={() => router.push(`/materials/`)}
                  className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 font-bold transition-all group px-4 py-2 rounded-xl border-2 border-transparent hover:border-slate-200 hover:bg-white"
                >
                  <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                  Kembali
                </button>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    Absensi Kajian
                    {!isAttendanceOpen && (
                      <span className="text-xs bg-rose-100 text-rose-600 px-3 py-1 rounded-full border border-rose-200 uppercase tracking-widest font-black">
                        Ditutup
                      </span>
                    )}
                  </h1>
                  <p className="text-slate-500 font-bold mt-1 text-sm md:text-base">
                    {material?.title || "Daftar hadir peserta kajian"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={toggleAttendance}
                  disabled={toggling}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black transition-all shadow-sm ${
                    isAttendanceOpen 
                      ? "bg-rose-50 border-2 border-rose-200 text-rose-600 hover:bg-rose-100 hover:border-rose-300" 
                      : "bg-emerald-50 border-2 border-emerald-200 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300"
                  }`}
                >
                  {isAttendanceOpen ? (
                    <>
                      <Clock className="h-5 w-5" />
                      Tutup Absensi
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      Buka Absensi
                    </>
                  )}
                </button>
                <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-bold hover:border-teal-400 hover:text-teal-600 transition-all shadow-sm">
                  <Download className="h-5 w-5" />
                  Export Excel
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-[2.5rem] border-2 border-teal-100 shadow-[0_8px_0_0_#d1fae5] flex flex-col justify-between max-md:aspect-square">
                <div className="flex justify-between items-start md:mb-5">
                  <div className="p-2.5 md:p-3 bg-teal-50 border-2 border-teal-100 rounded-2xl">
                    <Users className="w-6 h-6 md:w-8 md:h-8 text-teal-500" strokeWidth={2.5} />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-3xl md:text-4xl font-black text-slate-800 leading-none">{attendances.length}</div>
                  <div className="text-[10px] md:text-sm text-slate-400 font-black tracking-wide uppercase">Total Hadir</div>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-[2.5rem] border-2 border-blue-100 shadow-[0_8px_0_0_#dbeafe] flex flex-col justify-between max-md:aspect-square">
                <div className="flex justify-between items-start md:mb-5">
                  <div className="p-2.5 md:p-3 bg-blue-50 border-2 border-blue-100 rounded-2xl">
                    <Calendar className="w-6 h-6 md:w-8 md:h-8 text-blue-500" strokeWidth={2.5} />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-xs md:text-sm font-black text-slate-800 leading-tight">
                    {material ? new Date(material.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' }) : "-"}
                  </div>
                  <div className="text-[10px] md:text-sm text-slate-400 font-black tracking-wide uppercase">Tanggal</div>
                </div>
              </div>

              <div className="hidden md:flex bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-[0_8px_0_0_#f1f5f9] flex-col justify-center text-center">
                <div className="text-teal-500 mb-2">
                  <CheckCircle2 className="w-10 h-10 mx-auto" />
                </div>
                <div className="text-xl font-black text-slate-800 leading-tight">Kehadiran Aktif</div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Status Sesi</div>
              </div>

              <div className="hidden md:flex bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-[0_8px_0_0_#f1f5f9] flex-col justify-center text-center">
                <div className="text-slate-400 mb-2">
                  <Clock className="w-10 h-10 mx-auto" />
                </div>
                <div className="text-xl font-black text-slate-800 leading-tight">Tercatat Link</div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Metode</div>
              </div>
            </div>

            {/* List and Search Container */}
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="w-full md:w-96">
                  <SearchInput
                    placeholder="Cari nama anggota..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    className="w-full border-2 border-teal-100 focus-within:border-teal-400 rounded-2xl shadow-none"
                  />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <span className="px-4 py-2 bg-teal-50 text-teal-600 rounded-xl text-xs font-black border-2 border-teal-100 uppercase tracking-wide">
                    {filteredAttendances.length} Siswa Ditemukan
                  </span>
                </div>
              </div>

              {searchQuery && filteredAttendances.length > 0 && (
                <SuccessDataFound
                  message={`Ditemukan ${filteredAttendances.length} siswa sesuai pencarian`}
                  icon="sparkles"
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredAttendances.length > 0 ? (
                  filteredAttendances.map((att) => (
                    <div
                      key={att.id}
                      className="bg-white p-5 rounded-3xl border-2 border-slate-100 shadow-[0_4px_0_0_#f1f5f9] hover:shadow-[0_4px_0_0_#d1fae5] hover:border-teal-200 transition-all duration-300 group flex items-center gap-4"
                    >
                      <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden border-2 border-slate-50 group-hover:border-teal-100 transition-colors shrink-0">
                        {att.user.avatar ? (
                          <img src={att.user.avatar} alt={att.user.name || ""} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-teal-500 text-white font-black text-xl">
                            {(att.user.name || att.user.email).charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-slate-800 group-hover:text-teal-600 transition-colors truncate">
                          {att.user.name || "Siswa Tanpa Nama"}
                        </h3>
                        <div className="flex flex-col gap-1 mt-0.5">
                          <p className="text-[10px] text-slate-400 font-bold truncate">
                            {att.user.email}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-100 w-fit">
                            <Clock className="w-3 h-3" />
                            {new Date(att.createdAt).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-300">
                    <div className="p-6 bg-slate-50 rounded-full mb-4">
                      <Users className="h-12 w-12 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">Belum Ada Absensi</h3>
                    <p className="text-slate-500 max-w-xs mx-auto">Siswa yang melakukan absensi pada materi ini akan muncul di sini.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ChatbotButton />

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
};

export default AttendanceList;
