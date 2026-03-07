import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/friends/status/[userId] - Cek status pertemanan dengan user tertentu
export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId: targetUserId } = await params;
    const userId = session.user.id;

    if (targetUserId === userId) {
      return NextResponse.json({
        isOwnProfile: true,
        isFollowing: false,
        isFollowedBy: false,
        isMutual: false,
      });
    }

    // Cek apakah saya follow dia
    const myFollow = await prisma.friendship.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });

    // Cek apakah dia follow saya
    const theirFollow = await prisma.friendship.findUnique({
      where: {
        followerId_followingId: {
          followerId: targetUserId,
          followingId: userId,
        },
      },
    });

    const isFollowing = !!myFollow;
    const isFollowedBy = !!theirFollow;
    const isMutual =
      isFollowing && isFollowedBy && myFollow?.status === "accepted";

    return NextResponse.json({
      isOwnProfile: false,
      isFollowing,
      isFollowedBy,
      isMutual,
      myFollowStatus: myFollow?.status || null,
      theirFollowStatus: theirFollow?.status || null,
    });
  } catch (error: any) {
    console.error("Error checking friendship status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
