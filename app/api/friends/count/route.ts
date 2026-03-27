import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/friends/count - Ambil jumlah followers/following/friends user saat ini
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [followersCount, followingCount] = await Promise.all([
      prisma.friendships.count({ where: { followingId: userId } }),
      prisma.friendships.count({ where: { followerId: userId } }),
    ]);

    // Hitung mutual friends (accepted di kedua sisi)
    const myFollowing = await prisma.friendships.findMany({
      where: { followerId: userId, status: "accepted" },
      select: { followingId: true },
    });
    const followingIds = myFollowing.map((f) => f.followingId);

    const mutualCount = await prisma.friendships.count({
      where: {
        followerId: { in: followingIds },
        followingId: userId,
        status: "accepted",
      },
    });

    return NextResponse.json({
      followers: followersCount,
      following: followingCount,
      friends: mutualCount,
    });
  } catch (error: any) {
    console.error("Error fetching friend counts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
