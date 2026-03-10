import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";
import DashboardHeader from "@/components/ui/Header";
import ChatbotButton from "@/components/ui/Chatbot";
import LeaderboardClient from "@/components/ui/LeaderboardClient";
import type { LeaderboardUser } from "@/components/ui/LeaderboardClient";
import { Trophy } from "lucide-react";

const LeaderboardPage = async () => {
  const session = await auth();
  if (!session?.user) redirect("/auth");

  const rawUsers = await prisma.user.findMany({
    where: { role: "user" },
    orderBy: { points: "desc" },
    select: {
      id: true,
      name: true,
      avatar: true,
      role: true,
      points: true,
      badges: true,
      level: true,
      streak: true,
    },
    take: 100,
  });

  const users: LeaderboardUser[] = rawUsers.map((u, i) => ({
    id: u.id,
    name: u.name ?? "Pengguna",
    avatar: u.avatar,
    role: u.role,
    points: u.points,
    badges: u.badges,
    level: u.level,
    streak: u.streak,
    globalRank: i + 1,
  }));

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto pb-32 md:pb-8">
          <div className="text-center mb-8 md:mb-12 space-y-2">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Trophy className="w-8 h-8 md:w-10 md:h-10 text-amber-500 fill-amber-400" />
              <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight">
                Peringkat XP
              </h1>
              <Trophy className="w-8 h-8 md:w-10 md:h-10 text-amber-500 fill-amber-400" />
            </div>
            <p className="text-slate-500 font-bold text-sm md:text-lg">
              Pantau pencapaian terbaik • {users.length} peserta
            </p>
          </div>
          <LeaderboardClient users={users} currentUserId={session.user.id} />
        </main>
      </div>
      <ChatbotButton />
    </div>
  );
};

export default LeaderboardPage;
