import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";
import DashboardHeader from "@/components/ui/Header";
import LeaderboardClient from "@/components/ui/LeaderboardClient";
import type { LeaderboardUser } from "@/components/ui/LeaderboardClient";
import PageBanner from "@/components/ui/PageBanner";
import { Trophy } from "lucide-react";

const LeaderboardPage = async () => {
  const session = await auth();
  if (!session?.user) redirect("/auth");

  const currentUserId = session.user.id;

  // Get current user's followers and followings to determine mutuals
  const [followers, following] = await Promise.all([
    prisma.friendships.findMany({
      where: { followingId: currentUserId, status: "accepted" },
      select: { followerId: true },
    }),
    prisma.friendships.findMany({
      where: { followerId: currentUserId, status: "accepted" },
      select: { followingId: true },
    }),
  ]);

  const followerIds = new Set(followers.map((f) => f.followerId));
  const followingIds = new Set(following.map((f) => f.followingId));

  // A mutual friend is someone who follows the user AND the user follows them back
  const mutualUserIds = new Set<string>();
  for (const id of followingIds) {
    if (followerIds.has(id)) {
      mutualUserIds.add(id);
    }
  }

  const rawUsers = await prisma.users.findMany({
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
    take: 10, // Limit to Top 10 per user request
  });

  const viewerRole = (session.user as any).role;
  const isPrivileged = viewerRole === "admin" || viewerRole === "instruktur" || viewerRole === "super_admin";

  const users: LeaderboardUser[] = rawUsers.map((u, i) => {
    const isMe = u.id === currentUserId;
    const isMutual = mutualUserIds.has(u.id);

    // Apply privacy rules: Hide name and avatar if not me, not mutual, and not privileged
    const displayName = isMe || isMutual || isPrivileged ? (u.name ?? "Pengguna") : "Hamba Allah";
    const displayAvatar = isMe || isMutual || isPrivileged ? u.avatar : null;

    return {
      id: u.id,
      name: displayName,
      avatar: displayAvatar,
      role: u.role,
      points: u.points,
      badges: u.badges,
      level: u.level,
      streak: u.streak,
      globalRank: i + 1,
    };
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto pb-32 md:pb-8">
          <PageBanner
            title="Peringkat XP"
            description="Pantau pencapaian 10 EXP terbaik disini"
            icon={Trophy}
            tag="Leaderboard"
            tagIcon={Trophy}
          />
          <LeaderboardClient 
            users={users} 
            currentUserId={session.user.id} 
            currentUserRole={(session.user as any).role}
          />
        </main>
      </div>
      
    </div>
  );
};

export default LeaderboardPage;
