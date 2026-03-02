"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import SearchInput from "@/components/ui/SearchInput";
import { 
  Calendar, 
  Clock, 
  Download, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  TrendingUp,
  FileText,
  Eye
} from "lucide-react";

// Tipe Data Rekapan
interface RecapRecord {
  id: string;
  title: string;
  date: string;
  instructor: string;
  status: "hadir" | "tidak";
  timeSpent: string; 
  notes?: string;
}

const RekapanMateri = () => {
  const router = useRouter();
  
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      if (typeof window !== "undefined") {
        window.location.href = "/auth";
      }
    },
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"semua" | "hadir" | "tidak">("semua");

  // Data Mockup (Nantinya diganti dengan fetch dari API database Anda)
  const [records, setRecords] = useState<RecapRecord[]>([
    {
      id: "1",
      title: "Kedudukan Akal dan Wahyu",
      date: "2024-12-15",
      instructor: "Ust. Abdullah",
      status: "hadir",
      timeSpent: "2 Jam",
    },
    {
      id: "2",
      title: "Adab Menuntut Ilmu di Era Digital",
      date: "2024-12-08",
      instructor: "Ust. Fulan",
      status: "hadir",
      timeSpent: "1.5 Jam",
    },
    {
      id: "3",
      title: "Sejarah Perkembangan Islam Nusantara",
      date: "2024-12-01",
      instructor: "Ust. Abdurrahman",
      status: "tidak",
      timeSpent: "0 Jam",
    },
  ]);

  // Kalkulasi Statistik
  const totalKajian = records.length;
  const totalHadir = records.filter((r) => r.status === "hadir").length;
  const persentaseKehadiran = totalKajian > 0 ? Math.round((totalHadir / totalKajian) * 100) : 0;

  // Filter Data
  const filteredRecords = records.filter((record) => {
    const matchSearch = record.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        record.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "semua" || record.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Instructor data mockup (akan diganti fetch ke API `/api/materials` untuk instruktur)
  // Atau fetch rekapan list dari API `/api/materials` yang berisi content dan link
  const [instructorMaterials, setInstructorMaterials] = useState<any[]>([
    {
      id: "m1",
      title: "Kedudukan Akal dan Wahyu",
      date: "2024-12-15",
      content: "Isi PDF Rekapan...",
      link: "https://drive.google.com/file/d/...",
    },
    {
      id: "m2",
      title: "Adab Menuntut Ilmu di Era Digital",
      date: "2024-12-08",
      content: "",
      link: "",
    }
  ]);

  if (status === "loading") return null;
  const isInstructor = session?.user?.role === "instruktur" || session?.user?.role === "admin";

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 w-full max-w-[100vw] overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
          <div className="max-w-6xl mx-auto">
            
            {/* --- HEADER SECTION --- */}
            <div className="mb-8 lg:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight mb-2 flex items-center gap-3">
                  {isInstructor ? "Kelola Rekapan Materi" : "Rekapan Kajian"}
                </h1>
                <p className="text-slate-500 font-medium text-sm lg:text-lg">
                  {isInstructor 
                    ? "Kelola semua rekapan materi dan link drive kajian yang kamu ajarkan."
                    : "Pantau riwayat kehadiran dan materi kajian yang telah kamu ikuti."}
                </p>
              </div>
              {!isInstructor && (
                <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-400 text-white font-bold border-2 border-teal-600 border-b-4 hover:bg-teal-500 hover:border-b-4 active:border-b-2 active:translate-y-0.5 transition-all">
                  <Download className="h-5 w-5" />
                  Cetak Laporan
                </button>
              )}
            </div>

            {isInstructor ? (
              /* --- INSTRUCTOR VIEW --- */
              <div className="space-y-6">
                {/* --- FILTER & SEARCH BAR INSTRUKTUR --- */}
                <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div className="w-full md:w-96">
                    <SearchInput
                      placeholder="Cari materi kajian..."
                      value={searchQuery}
                      onChange={setSearchQuery}
                      className="w-full border-2 border-emerald-400 focus-within:border-emerald-500 rounded-2xl shadow-none"
                    />
                  </div>
                </div>

                {/* --- LIST DATA REKAPAN INSTRUKTUR --- */}
                <div className="space-y-4">
                  {instructorMaterials.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-300">
                      <FileText className="h-16 w-16 text-slate-300 mb-4" />
                      <h3 className="text-xl font-black text-slate-800 mb-2">Belum ada kajian</h3>
                      <p className="text-slate-500">Kajian yang kamu cari tidak ditemukan.</p>
                    </div>
                  ) : (
                    instructorMaterials.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase())).map((material) => (
                      <div 
                        key={material.id}
                        className="bg-white rounded-3xl border-2 border-slate-200 p-5 lg:p-6 hover:border-emerald-400 hover:shadow-[0_4px_0_0_#34d399] transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-5 group"
                      >
                        {/* Info Kiri */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {material.content || material.link ? (
                              <span className="px-3 py-1 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-wide border bg-emerald-50 text-emerald-600 border-emerald-200">
                                Tersedia
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-wide border bg-red-50 text-red-600 border-red-200">
                                Belum Ada
                              </span>
                            )}
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              {new Date(material.date).toLocaleDateString("id-ID", {
                                day: "numeric", month: "long", year: "numeric"
                              })}
                            </div>
                          </div>
                          
                          <h3 className="text-lg md:text-xl font-black text-slate-800 leading-tight group-hover:text-emerald-600 transition-colors">
                            {material.title}
                          </h3>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500 mt-3">
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-xs">
                                👤
                              </div>
                              Anda (Instruktur)
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 hidden sm:block"></div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4 text-slate-400" />
                              -
                            </div>
                          </div>
                        </div>

                        {/* Tombol Kanan */}
                        <div className="flex flex-col md:items-end justify-center shrink-0 border-t-2 border-dashed border-slate-200 md:border-none pt-4 md:pt-0 gap-3">
                          <button className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-emerald-600 font-bold border-2 border-emerald-200 border-b-4 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 active:border-b-2 active:translate-y-0.5 transition-all text-sm w-full md:w-auto">
                            {material.content || material.link ? "Edit Rekapan" : "Tambah Rekapan"}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* --- USER VIEW (LAMA) --- */
              <>
            {/* --- STATISTIK CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10">
              <div className="bg-white rounded-xl md:rounded-3xl border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] p-4 md:p-6 flex items-center gap-4 md:gap-5">
                <div className="p-3 md:p-4 bg-emerald-100 rounded-xl md:rounded-2xl border border-emerald-200">
                  <CheckCircle2 className="h-6 w-6 md:h-8 md:w-8 text-emerald-600" />
                </div>
                <div>
                  <p className="text-slate-500 font-bold text-xs md:text-sm uppercase tracking-wider">Total Hadir</p>
                  <p className="text-2xl md:text-3xl font-black text-slate-800">{totalHadir} <span className="text-sm md:text-base text-slate-500 font-semibold">Kajian</span></p>
                </div>
              </div>

              <div className="bg-white rounded-xl md:rounded-3xl border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] p-4 md:p-6 flex items-center gap-4 md:gap-5">
                <div className="p-3 md:p-4 bg-amber-100 rounded-xl md:rounded-2xl border border-amber-200">
                  <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-amber-600" />
                </div>
                <div>
                  <p className="text-slate-500 font-bold text-xs md:text-sm uppercase tracking-wider">Persentase</p>
                  <p className="text-2xl md:text-3xl font-black text-slate-800">{persentaseKehadiran}%</p>
                </div>
              </div>

              <div className="bg-white rounded-xl md:rounded-3xl border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] p-4 md:p-6 flex items-center gap-4 md:gap-5">
                <div className="p-3 md:p-4 bg-red-100 rounded-xl md:rounded-2xl border border-red-200">
                  <XCircle className="h-6 w-6 md:h-8 md:w-8 text-red-600" />
                </div>
                <div>
                  <p className="text-slate-500 font-bold text-xs md:text-sm uppercase tracking-wider">Tidak Hadir</p>
                  <p className="text-2xl md:text-3xl font-black text-slate-800">{totalKajian - totalHadir} <span className="text-sm md:text-base text-slate-500 font-semibold">Kajian</span></p>
                </div>
              </div>
            </div>

            {/* --- FILTER & SEARCH BAR --- */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                {(["semua", "hadir", "tidak"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all capitalize whitespace-nowrap ${
                      filterStatus === status
                        ? "bg-emerald-100 text-emerald-800 border-2 border-emerald-400"
                        : "bg-slate-50 text-slate-600 border-2 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {status === "semua" ? "Semua Riwayat" : status}
                  </button>
                ))}
              </div>
              
              <div className="w-full md:w-72">
                <div className="flex justify-end w-full">
                  <SearchInput
                    placeholder="Cari materi atau ustaz..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    className="w-full md:w-80 border-2 border-emerald-400 focus-within:border-emerald-500 rounded-2xl shadow-none"
                  />
                </div>
              </div>
            </div>

            {/* --- LIST DATA REKAPAN --- */}
            <div className="space-y-4">
              {filteredRecords.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-300">
                  <FileText className="h-16 w-16 text-slate-300 mb-4" />
                  <h3 className="text-xl font-black text-slate-800 mb-2">Belum ada riwayat</h3>
                  <p className="text-slate-500">Kajian yang kamu cari tidak ditemukan atau kamu belum mengikuti kajian.</p>
                </div>
              ) : (
                filteredRecords.map((record) => (
                  <div 
                    key={record.id}
                    className="bg-white rounded-3xl border-2 border-slate-200 p-5 lg:p-6 hover:border-emerald-400 hover:shadow-[0_4px_0_0_#34d399] transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-5 group"
                  >
                    {/* Info Kiri */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-wide border ${
                          record.status === "hadir" 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                            : "bg-red-50 text-red-600 border-red-200"
                        }`}>
                          {record.status}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {new Date(record.date).toLocaleDateString("id-ID", {
                            day: "numeric", month: "long", year: "numeric"
                          })}
                        </div>
                      </div>
                      
                      <h3 className="text-lg md:text-xl font-black text-slate-800 leading-tight mb-3 group-hover:text-emerald-600 transition-colors">
                        {record.title}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-xs">
                            👤
                          </div>
                          {record.instructor}
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 hidden sm:block"></div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-slate-400" />
                          {record.timeSpent}
                        </div>
                      </div>
                    </div>

                    {/* Catatan & Tombol Kanan */}
                    <div className="flex flex-col md:items-end justify-center shrink-0 border-t-2 border-dashed border-slate-200 md:border-none pt-4 md:pt-0 gap-3">
                      {record.notes && (
                        <div className="bg-amber-50 px-4 py-2 rounded-xl border border-amber-200 text-sm font-medium text-amber-800 italic max-w-xs truncate w-full md:w-auto">
                          "{record.notes}"
                        </div>
                      )}
                      
                      {/* Tombol Lihat Materi */}
                      <button 
                        onClick={() => router.push(`/materials/${record.id}`)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-emerald-600 font-bold border-2 border-emerald-200 border-b-4 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 active:border-b-2 active:translate-y-0.5 transition-all text-sm w-full md:w-auto"
                      >
                        <Eye className="h-4 w-4" strokeWidth={2.5} />
                        Lihat Materi
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
        </div>
      </div>
    </div>
    <ChatbotButton />
  </div>
  );
};

export default RekapanMateri;