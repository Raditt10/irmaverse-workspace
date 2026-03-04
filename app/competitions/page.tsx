"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import Loading from "@/components/ui/Loading";
import SuccessDataFound from "@/components/ui/SuccessDataFound";
import SearchInput from "@/components/ui/SearchInput";
import EmptyState from "@/components/ui/EmptyState";
import { Trophy, Calendar, Target, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import DetailButton from "@/components/ui/DetailButton";
import Toast from "@/components/ui/Toast";
import AddButton from "@/components/ui/AddButton";

interface CompetitionItem {
  id: string;
  title: string;
  date: string;
  prize: string;
  category: "Tahfidz" | "Seni" | "Bahasa" | "Lainnya";
  image: string;
  instructor: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

const badgeStyles: Record<CompetitionItem["category"], string> = {
  Tahfidz: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Seni: "bg-purple-100 text-purple-700 border-purple-200",
  Bahasa: "bg-blue-100 text-blue-700 border-blue-200",
  Lainnya: "bg-slate-100 text-slate-700 border-slate-200",
};

const Competitions = () => {
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Toast State
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const router = useRouter();
  const { data: session } = useSession();

  // Helper Toast
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/competitions");
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch");
      }
      
      setCompetitions(data);
    } catch (error) {
      console.error("Error fetching competitions:", error);
      // Optional: showToast("Gagal memuat data kompetisi", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompetition = async (competitionId: string) => {
    try {
      const response = await fetch(`/api/competitions/${competitionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let errorMessage = "Gagal menghapus kompetisi";
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      setCompetitions(competitions.filter((c) => c.id !== competitionId));
      showToast("Kompetisi berhasil dihapus", "success");
    } catch (error: any) {
      console.error("Error deleting competition:", error);
      showToast(error.message || "Gagal menghapus kompetisi", "error");
    }
  };

  const filteredCompetitions = competitions.filter((comp) =>
    comp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 px-6 lg:px-8 py-12 lg:ml-0">
          <div className="max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="mb-8 lg:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-2xl lg:text-4xl font-black text-slate-800 tracking-tight mb-1.5 leading-tight">
                  Info Perlombaan
                </h1>
                <p className="text-slate-500 font-medium text-xs lg:text-lg">
                  Tunjukkan bakatmu di ajang bergengsi ini!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                {session?.user?.role === "instruktur" && (
                  <AddButton
                    label="Tambah Lomba"
                    onClick={() => router.push("/competitions/create")}
                    icon={<Plus className="h-5 w-5" />}
                    color="emerald"
                    hideIcon={false}
                  />
                )}
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <SearchInput
                placeholder="Cari lomba..."
                value={searchTerm}
                onChange={setSearchTerm}
                className="w-full md:w-96"
              />
            </div>

            {/* Content */}
            {loading ? (
              <div className="text-center py-20">
                <Loading text="Memuat data lomba..." />
              </div>
            ) : filteredCompetitions.length === 0 ? (
              <EmptyState
                icon={competitions.length === 0 ? "calendar" : "search"}
                title={competitions.length === 0 ? "Belum Ada Informasi Lomba" : "Lomba Tidak Ditemukan"}
                description={
                  competitions.length === 0
                    ? "Tidak ada kompetisi yang tersedia saat ini. Silakan kembali lagi kemudian."
                    : `Kami tidak menemukan kompetisi dengan "${searchTerm}". Coba gunakan kata kunci lain.`
                }
                actionLabel={searchTerm ? "Hapus Pencarian" : undefined}
                onAction={searchTerm ? () => setSearchTerm("") : undefined}
              />
            ) : (
              <>
                {searchTerm && (
                  <div className="mb-8">
                    <SuccessDataFound 
                      message={`Hore! Ditemukan ${filteredCompetitions.length} lomba`}
                    />
                  </div>
                )}

                <div className="grid gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-2">
                  {filteredCompetitions.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_6px_0_0_#cbd5e1] sm:shadow-[0_8px_0_0_#cbd5e1] hover:border-emerald-400 hover:shadow-[0_8px_0_0_#34d399] transition-all duration-300 overflow-hidden group hover:-translate-y-2 flex flex-col"
                    >
                      {/* Image Section */}
                      <div className="relative h-40 md:h-60 border-b-2 border-slate-100 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
                      </div>

                      {/* Content Section */}
                      <div className="p-4 sm:p-6 flex flex-col flex-1">
                        <h3 className="text-lg sm:text-xl font-black text-slate-800 leading-tight mb-3 sm:mb-4 group-hover:text-emerald-600 transition-colors line-clamp-2">
                          {item.title}
                        </h3>

                        <div className="space-y-2.5 sm:space-y-3 mb-5 sm:mb-6 bg-slate-50 p-3.5 sm:p-4 rounded-xl border-2 border-slate-100">
                          <div className="flex items-center justify-between text-[11px] sm:text-sm">
                            <div className="flex items-center gap-2 text-slate-500 font-bold">
                              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                              <span>Tanggal</span>
                            </div>
                            <span className="text-slate-800 font-black">{item.date}</span>
                          </div>
                          
                          <div className="w-full h-px bg-slate-200 dashed"></div>

                          <div className="flex items-center justify-between text-[11px] sm:text-sm">
                            <div className="flex items-center gap-2 text-slate-500 font-bold">
                              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                              <span>Hadiah</span>
                            </div>
                            <span className="text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                              {item.prize}
                            </span>
                          </div>
                        </div>

                        {/* Action Row: Category on Left, Buttons on Right */}
                        <div className="mt-auto pt-5 border-t-2 border-slate-50 flex items-center justify-between gap-2">
                          <div className="flex-1">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold ${badgeStyles[item.category]}`}>
                              <Target className="h-3 w-3" strokeWidth={3} />
                              <span className="text-[9px] uppercase tracking-widest whitespace-nowrap">
                                {item.category}
                              </span>
                            </div>
                          </div>
                      
                          <div className="flex items-center gap-2">
                            <DetailButton
                              role={session?.user?.role as any}
                              onClick={() => router.push(`/competitions/${item.id}`)}
                              onEdit={() => router.push(`/competitions/${item.id}/edit`)}
                              onDelete={() => handleDeleteCompetition(item.id)}
                              label="Detail"
                              className="w-auto!"
                              showConfirm={true}
                              iconOnly={true}
                              confirmTitle="Hapus Kompetisi?"
                              confirmMessage="Apakah Anda yakin ingin menghapus kompetisi ini?"
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

export default Competitions;