import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    const users = await prisma.users.findMany({
      where: {
        NOT: { role: "instruktur" },
      },
      select: {
        id: true,
        name: true,
        role: true,
        avatar: true,
        points: true,
        // Assuming class and status might be needed or handled by default avatar seed if missing
      },
      orderBy: { name: "asc" },
    });

    // If session exists, fetch mutual follow status
    let mutualIds: Set<string> = new Set();
    if (currentUserId) {
      const friendships = await prisma.friendships.findMany({
        where: {
          OR: [
            { followerId: currentUserId, status: "accepted" },
            { followingId: currentUserId, status: "accepted" },
          ],
        },
      });

      const followingIds = friendships
        .filter((f) => f.followerId === currentUserId)
        .map((f) => f.followingId);
      const followerIds = friendships
        .filter((f) => f.followingId === currentUserId)
        .map((f) => f.followerId);

      followingIds.forEach((id) => {
        if (followerIds.includes(id)) {
          mutualIds.add(id);
        }
      });
    }

    // Fetch jabatan via raw query since prisma client may not be regenerated yet
    let jabatanMap: Record<string, string> = {};
    try {
      const raw: any[] = await prisma.$queryRaw`SELECT id, jabatan FROM users WHERE jabatan IS NOT NULL`;
      for (const r of raw) {
        jabatanMap[r.id] = r.jabatan;
      }
    } catch (e) {
      // jabatan column may not exist yet, ignore
    }

    const membersWithContext = users.map((user) => ({
      ...user,
      isMutual: mutualIds.has(user.id),
      jabatan: jabatanMap[user.id] || null,
    }));

    return NextResponse.json(membersWithContext);
  } catch (error) {
    console.error("[MEMBERS_GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
