import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";
import DashboardHeader from "@/components/ui/Header";
import ChatbotButton from "@/components/ui/Chatbot";
import {
  Trophy,
  Medal,
  Crown,
  Search,
  Filter,
  ArrowUp,
  Minus,
  ArrowDown,
  ShieldCheck,
} from "lucide-react";

// Helper components tetap sama
const TrendIcon = ({ type }: { type: string }) => {
  if (type === "up") return <div className="p-1 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200"><ArrowUp className="w-3 h-3 stroke-3" /></div>;
  if (type === "down") return <div className="p-1 rounded-full bg-rose-100 text-rose-600 border border-rose-200"><ArrowDown className="w-3 h-3 stroke-3" /></div>;
  return <div className="p-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200"><Minus className="w-3 h-3 stroke-3" /></div>;
};

const MOCK_LEADERBOARD = [
  { id: "1", name: "Ahmad Syarif", role: "Ketua", points: 5240, avatarId: 10, badges: 15, trend: "up" },
  { id: "2", name: "Fatimah Zahra", role: "Sekretaris", points: 4950, avatarId: 22, badges: 12, trend: "up" },
  { id: "3", name: "Rizki Pratama", role: "Anggota", points: 4100, avatarId: 35, badges: 10, trend: "down" },
  { id: "4", name: "Siti Aminah", role: "Anggota", points: 3850, avatarId: 41, badges: 9, trend: "stable" },
  { id: "5", name: "Budi Santoso", role: "Anggota", points: 3200, avatarId: 55, badges: 8, trend: "up" },
  { id: "6", name: "Dewi Sartika", role: "Bendahara", points: 2900, avatarId: 64, badges: 7, trend: "down" },
  { id: "7", name: "Rafaditya S.", role: "Admin", points: 2450, avatarId: 70, badges: 8, trend: "up" },
  { id: "8", name: "Hendra Gunawan", role: "Anggota", points: 2100, avatarId: 82, badges: 5, trend: "stable" },
  { id: "9", name: "Maya Putri", role: "Anggota", points: 1800, avatarId: 91, badges: 4, trend: "down" },
  { id: "10", name: "Eko Kurniawan", role: "Anggota", points: 1500, avatarId: 100, badges: 3, trend: "stable" },
];

const LeaderboardPage = async () => {
  const session = await auth();
  if (!session?.user) redirect("/auth");

  const topThree = MOCK_LEADERBOARD.slice(0, 3);
  const restOfUsers = MOCK_LEADERBOARD.slice(3);

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto pb-32 md:pb-8">
          
          {/* Header Page */}
          <div className="text-center mb-8 md:mb-12 space-y-2">
            <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight">
              Peringkat EXP
            </h1>
            <p className="text-slate-500 font-bold text-sm md:text-lg">Pantau pencapaian terbaik minggu ini!</p>
          </div>

          {/* --- TOP 3 PODIUM (MOBILE OPTIMIZED) --- */}
          <div className="flex justify-center items-end gap-1 sm:gap-2 md:gap-10 mb-12 px-1 sm:px-2 md:px-4 pt-10 origin-bottom">
            
            {/* JUARA 2 */}
            <div className="flex flex-col items-center group order-1 shrink-0 w-[28%] sm:w-24 md:w-36">
               <div className="relative mb-[-15px] z-20 transition-transform group-hover:-translate-y-2">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-24 md:h-24 rounded-full border-[3px] border-slate-400 bg-slate-200 overflow-hidden shadow-md mx-auto">
                     <img src={`https://picsum.photos/200/200?random=${topThree[1].avatarId}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-slate-500 text-white w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-black border-2 border-white text-[10px] sm:text-xs md:text-base">2</div>
               </div>
               <div className="w-full h-24 sm:h-28 md:h-40 bg-slate-100 rounded-t-3xl border-[3px] border-slate-300 border-b-0 flex flex-col items-center pt-8 md:pt-10 shadow-inner relative z-10 transition-all">
                  <p className="font-black text-slate-700 text-[9px] sm:text-[10px] md:text-sm px-1 text-center line-clamp-1 w-full">{topThree[1].name}</p>
                  <div className="mt-1 md:mt-2 bg-white px-1 sm:px-2 py-0.5 rounded-full border border-slate-200 w-[90%] sm:w-fit flex justify-center">
                    <p className="text-[8px] sm:text-[9px] md:text-xs font-black text-slate-500 truncate">{topThree[1].points} XP</p>
                  </div>
               </div>
            </div>

            {/* JUARA 1 */}
            <div className="flex flex-col items-center group order-2 -mt-6 sm:-mt-10 z-30 shrink-0 w-[36%] sm:w-32 md:w-44">
               <div className="relative mb-3 sm:mb-5 z-20 transition-transform group-hover:-translate-y-3">
                  {/* Animasi 'animate-bounce' telah dihapus di baris bawah ini */}
                  <div className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2">
                    <Crown className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-amber-400 fill-amber-400" />
                  </div>
                  <div className="w-18 h-18 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full border-4 border-amber-400 bg-amber-100 overflow-hidden shadow-lg mx-auto">
                     <img src={`https://picsum.photos/200/200?random=${topThree[0].avatarId}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black border-[3px] border-white shadow-md text-xs sm:text-sm md:text-lg">1</div>
               </div>
               <div className="w-full h-32 sm:h-40 md:h-56 bg-amber-50 rounded-t-[2.5rem] border-[3px] border-amber-300 border-b-0 flex flex-col items-center pt-8 sm:pt-10 md:pt-12 shadow-inner relative z-10 transition-all">
                  <p className="font-black text-amber-900 text-[10px] sm:text-xs md:text-lg px-1 sm:px-2 text-center line-clamp-1 w-full">{topThree[0].name}</p>
                  <div className="mt-1 sm:mt-2 bg-amber-400 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border-2 border-amber-500 shadow-sm w-[90%] sm:w-fit flex justify-center">
                    <p className="text-[8px] sm:text-[10px] md:text-sm font-black text-white truncate">{topThree[0].points} XP</p>
                  </div>
               </div>
            </div>

            {/* JUARA 3 */}
            <div className="flex flex-col items-center group order-3 shrink-0 w-[28%] sm:w-24 md:w-36">
               <div className="relative mb-[-15px] z-20 transition-transform group-hover:-translate-y-2">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-24 md:h-24 rounded-full border-[3px] border-orange-300 bg-orange-100 overflow-hidden shadow-md mx-auto">
                     <img src={`https://picsum.photos/200/200?random=${topThree[2].avatarId}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-black border-2 border-white text-[10px] sm:text-xs md:text-base">3</div>
               </div>
               <div className="w-full h-20 sm:h-24 md:h-32 bg-orange-50 rounded-t-3xl border-[3px] border-orange-200 border-b-0 flex flex-col items-center pt-8 md:pt-10 shadow-inner relative z-10 transition-all">
                  <p className="font-black text-orange-900 text-[9px] sm:text-[10px] md:text-sm px-1 text-center line-clamp-1 w-full">{topThree[2].name}</p>
                  <div className="mt-1 md:mt-2 bg-white px-1 sm:px-2 py-0.5 rounded-full border border-orange-100 w-[90%] sm:w-fit flex justify-center">
                    <p className="text-[8px] sm:text-[9px] md:text-xs font-black text-orange-500 truncate">{topThree[2].points} XP</p>
                  </div>
               </div>
            </div>
          </div>

          {/* --- MAIN LIST --- */}
          <div className="max-w-4xl mx-auto px-2">
            
            {/* Search & Filter */}
            <div className="flex gap-3 mb-6">
              <div className="relative flex-1 group">
                  <div className="relative bg-white border-2 border-slate-200 rounded-2xl flex items-center px-4 py-2.5 md:py-3 transition-all">
                    <Search className="w-4 h-4 md:w-5 md:h-5 text-slate-400 mr-2" />
                    <input 
                      type="text" 
                      placeholder="Cari teman..." 
                      className="w-full bg-transparent outline-none font-bold text-sm md:text-base text-slate-600"
                    />
                  </div>
              </div>
              <button className="bg-white border-2 border-slate-200 rounded-2xl p-2.5 md:p-3 flex items-center justify-center hover:bg-slate-50 transition-all">
                  <Filter className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Header List */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
               <div className="col-span-2 sm:col-span-1 text-center">Rank</div>
               <div className="col-span-7 sm:col-span-8">Peserta</div>
               <div className="col-span-3 text-right">Points</div>
            </div>

            {/* List Items */}
            <div className="space-y-2">
              {restOfUsers.map((user, index) => {
                const rank = index + 4;
                const isCurrentUser = user.name.includes("Rafaditya"); 

                return (
                  <div key={user.id} className="relative group">
                    <div className={`
                        relative grid grid-cols-12 gap-2 p-3 items-center rounded-2xl border-2 transition-all
                        ${isCurrentUser ? 'bg-teal-50 border-teal-400' : 'bg-white border-slate-100'}
                    `}>
                      {/* Rank */}
                      <div className="col-span-2 sm:col-span-1 flex justify-center">
                          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-black text-sm md:text-lg ${isCurrentUser ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {rank}
                          </div>
                      </div>

                      {/* Profile */}
                      <div className="col-span-7 sm:col-span-8 flex items-center gap-2 md:gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-100">
                             <img src={`https://picsum.photos/200/200?random=${user.avatarId}`} alt={user.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <p className={`font-black text-xs md:text-base truncate ${isCurrentUser ? 'text-teal-800' : 'text-slate-700'}`}>
                                  {user.name}
                                </p>
                                {isCurrentUser && (
                                  <span className="bg-teal-200 text-teal-700 text-[8px] md:text-[10px] font-black px-1.5 py-0.5 rounded-md border border-teal-300">YOU</span>
                                )}
                            </div>
                            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-tight">{user.role}</p>
                          </div>
                      </div>

                      {/* Points */}
                      <div className="col-span-3 flex flex-col justify-center items-end pr-1">
                        <span className={`font-black text-sm md:text-xl leading-none ${isCurrentUser ? 'text-teal-700' : 'text-slate-700'}`}>
                          {user.points.toLocaleString()}
                        </span>
                        <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase">Points</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* --- STICKY USER RANK (MOBILE) --- */}
          <div className="md:hidden fixed bottom-4 left-4 right-20 z-40">
             <div className="bg-slate-900 text-white rounded-4xl p-1 shadow-xl border border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 sm:px-5 sm:py-3 bg-slate-800 rounded-[1.8rem]">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-teal-500 flex items-center justify-center font-black text-sm sm:text-base shadow-lg cursor-default">
                            7
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-bold text-xs sm:text-sm leading-tight truncate">Rafaditya S.</span>
                            <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">Peringkat Anda</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 pl-2 border-l border-slate-700">
                        <span className="font-black text-sm sm:text-base text-teal-400 leading-none">2,450</span>
                        <span className="text-[7px] sm:text-[8px] font-bold text-slate-500 uppercase">EXP</span>
                    </div>
                </div>
             </div>
          </div>

        </main>
      </div>

      <ChatbotButton />
    </div>
  );
};

export default LeaderboardPage;