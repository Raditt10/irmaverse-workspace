import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - list mutual friends eligible for user-to-user chat
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "user") {
      return NextResponse.json(
        { error: "Fitur chat antar user hanya untuk role user" },
        { status: 403 },
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();

    const myFollowing = await prisma.friendships.findMany({
      where: {
        followerId: userId,
        status: "accepted",
      },
      select: {
        followingId: true,
      },
    });

    const followingIds = myFollowing.map((f) => f.followingId);
    if (followingIds.length === 0) return NextResponse.json([]);

    const mutualRows = await prisma.friendships.findMany({
      where: {
        followerId: { in: followingIds },
        followingId: userId,
        status: "accepted",
      },
      include: {
        users_friendships_followerIdTousers: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            level: true,
            points: true,
            lastSeen: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const users = mutualRows
      .map((row) => row.users_friendships_followerIdTousers)
      .filter((u) =>
        search
          ? (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
            (u.email || "").toLowerCase().includes(search.toLowerCase())
          : true,
      );

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching mutual users for chat:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar mutual" },
      { status: 500 },
    );
  }
}
