"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import Loading from "@/components/ui/Loading";
import SearchInput from "@/components/ui/SearchInput";
import CartoonNotification from "@/components/ui/Notification";
import Toast from "@/components/ui/Toast";
import EmptyState from "@/components/ui/EmptyState";
import { 
  UserCircle2, 
  UserPlus, 
  Sparkles, 
  Search, 
  Trophy
} from "lucide-react";

interface Member {
  id: string;
  name: string;
  role: string;
  class: string;
  avatar: string;
  points: number;
  status: "Aktif" | "Tidak Aktif";
}

const Members = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Notification State
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  } | null>(null);
  // Toast state for quick toasts
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null);

  // Auto-hide toast after 3s
  useEffect(() => {
    if (toast?.show) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const router = useRouter();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/members");
      if (!res.ok) throw new Error("Gagal mengambil data anggota");
      const data = await res.json();
      const mapped = data.map((u: any) => ({
        id: u.id,
        name: u.name || "-",
        role: u.role || "-",
        class: u.class || "-",
        avatar: u.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + (u.name || "user"),
        points: u.points || 0,
        status: u.status || "Aktif",
      }));
      setMembers(mapped);
    } catch (error) {
      console.error("Error fetching members:", error);
      setNotification({
        type: "error",
        title: "Gagal",
        message: "Gagal memuat data anggota.",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = search
    ? members.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    : members;

  const handleAddFriend = (name: string) => {
    setToast({ show: true, message: `Permintaan pertemanan dikirim ke ${name}`, type: 'success' });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 w-full max-w-[100vw] overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
          <div className="max-w-7xl mx-auto">
            
            {/* Header Section */}
            <div className="mb-8 lg:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight mb-2">
                  Daftar Anggota
                </h1>
                <p className="text-slate-500 font-medium text-sm lg:text-lg">
                  Temukan teman dan lihat siapa saja anggota aktif IRMA.
                </p>
              </div>
            </div>

            {/* Search & Suggestions */}
            <div className="space-y-6 mb-8 lg:mb-10">
              <div className="w-full md:max-w-md">
                <SearchInput
                  placeholder="Cari nama anggota..."
                  value={search}
                  onChange={setSearch}
                />
              </div>

              {/* Suggestion Box */}
              {search && filteredMembers.length > 0 && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border-2 border-teal-100 rounded-xl text-teal-700 animate-in fade-in slide-in-from-left-2">
                    <Sparkles className="h-4 w-4 text-teal-500 fill-teal-500" />
                    <p className="text-xs md:text-sm font-bold">
                        Menemukan: <span className="underline decoration-2 underline-offset-2">{filteredMembers[0].name}</span>
                        {filteredMembers.length > 1 && <span className="font-normal opacity-80"> +{filteredMembers.length - 1} lainnya</span>}
                    </p>
                </div>
              )}
            </div>

            {loading ? (
              <div className="text-center py-20">
                <Loading text="Sedang memanggil anggota..." />
              </div>
            ) : (
              <>
                {/* --- GRID ANGGOTA --- */}
                {filteredMembers.length > 0 ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {filteredMembers.map((member) => (
                      <div
                        key={member.id}
                        className="bg-white rounded-3xl lg:rounded-4xl border-2 border-slate-200 shadow-[2px_2px_0_0_#cbd5e1] md:shadow-[4px_4px_0_0_#cbd5e1] hover:border-teal-400 hover:shadow-[2px_2px_0_0_#34d399] md:hover:shadow-[4px_4px_0_0_#34d399] transition-all duration-300 overflow-hidden group hover:-translate-y-1 flex flex-col"
                      >
                        {/* Header Card (Banner & Avatar) */}
                        <div className="pt-4 md:pt-6 px-4 md:px-6 flex flex-col items-center">
                            {/* Avatar Wrapper (Tanpa Badge Status) */}
                            <div className="relative mb-2 md:mb-3 group-hover:scale-105 transition-transform duration-500">
                                <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full p-1 bg-white border-[3px] md:border-4 border-slate-100 shadow-md overflow-hidden">
                                    <img
                                        src={member.avatar}
                                        alt={member.name}
                                        className="w-full h-full object-cover rounded-full bg-slate-50"
                                    />
                                </div>
                            </div>
                            
                            {/* Name & Role */}
                            <div className="text-center w-full">
                                <h3 className="text-sm md:text-lg lg:text-xl font-black text-slate-800 truncate px-1 md:px-2">
                                    {member.name}
                                </h3>
                                <p className="text-[8px] md:text-[10px] font-bold text-teal-600 bg-teal-50 px-2 md:px-3 py-0.5 rounded-full inline-block border border-teal-100 mt-1">
                                    {member.role}
                                </p>
                                <p className="text-[8px] md:text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                                    {member.class}
                                </p>
                            </div>
                        </div>

                        {/* Points Section */}
                        <div className="mt-3 md:mt-4 px-3 md:px-6">
                            <div className="bg-amber-50 rounded-xl md:rounded-2xl p-2 md:p-3 border-2 border-amber-100 flex items-center justify-between">
                                <div className="flex items-center gap-1 md:gap-2">
                                    <div className="p-1 md:p-1.5 bg-amber-100 rounded-[0.4rem] md:rounded-lg text-amber-600">
                                        <Trophy className="h-3 w-3 md:h-4 md:w-4" />
                                    </div>
                                    <span className="text-[10px] md:text-xs font-bold text-amber-800">Poin Keaktifan</span>
                                </div>
                                <span className="text-sm md:text-lg font-black text-amber-600">{member.points}</span>
                            </div>
                        </div>

                        {/* Spacer */}
                        <div className="flex-1 min-h-4"></div>

                        {/* Action Buttons */}
                        <div className="p-3 md:p-4 bg-slate-50 border-t-2 border-slate-100 grid grid-cols-2 gap-2 md:gap-3">
                            <button
                                onClick={() => router.push(`/members/${member.id}`)}
                                className="flex items-center justify-center gap-1 md:gap-2 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-white border-2 border-slate-200 text-slate-600 font-bold text-[10px] md:text-sm shadow-[0_2px_0_0_#cbd5e1] hover:border-teal-400 hover:text-teal-600 hover:shadow-[0_4px_0_0_#34d399] active:border-b-2 active:translate-y-0.5 transition-all"
                            >
                                <UserCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                Profile
                            </button>

                            <button
                                onClick={() => handleAddFriend(member.name)}
                                className="flex items-center justify-center gap-1 md:gap-2 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-teal-400 border-2 border-teal-600 text-white font-bold text-[10px] md:text-sm shadow-[0_2px_0_0_#0f766e] hover:bg-teal-500 active:border-b-2 active:translate-y-0.5 transition-all"
                            >
                                <UserPlus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                Add
                            </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* --- EMPTY STATE --- */
                  <EmptyState
                    icon="search"
                    title="Anggota Tidak Ditemukan"
                    description={`Kami tidak dapat menemukan anggota dengan nama "${search}".`}
                    actionLabel="Hapus Pencarian"
                    onAction={() => setSearch("")}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <ChatbotButton />

      {/* --- TOAST --- */}
      {toast && (
        <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* --- NOTIFIKASI (Cartoon) --- */}
      {notification && (
        <CartoonNotification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          duration={3000}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default Members;