import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/friends - Ambil daftar teman (mutual follows = accepted)
// Hanya role "user" yang boleh mengakses fitur pertemanan
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Guard: Hanya role "user"
    if ((session.user as any).role !== "user") {
      return NextResponse.json(
        { error: "Fitur pertemanan hanya untuk pengguna biasa" },
        { status: 403 },
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const tab = searchParams.get("tab") || "friends"; // friends | followers | following | suggestions

    if (tab === "followers") {
      // Orang yang mengikuti saya
      const followers = await prisma.friendships.findMany({
        where: {
          followingId: userId,
          ...(search ? { users_friendships_followerIdTousers: { name: { contains: search } } } : {}),
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
              bio: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Cek apakah saya juga follow mereka balik
      const myFollowing = await prisma.friendships.findMany({
        where: {
          followerId: userId,
          followingId: { in: followers.map((f) => f.followerId) },
        },
        select: { followingId: true, status: true },
      });
      const followingMap = new Map(
        myFollowing.map((f) => [f.followingId, f.status]),
      );

      return NextResponse.json(
        followers.map((f) => ({
          ...f.users_friendships_followerIdTousers,
          friendshipId: f.id,
          friendshipStatus: f.status,
          iFollowBack: followingMap.has(f.followerId),
        })),
      );
    }

    if (tab === "following") {
      // Orang yang saya ikuti
      const following = await prisma.friendships.findMany({
        where: {
          followerId: userId,
          ...(search ? { users_friendships_followingIdTousers: { name: { contains: search } } } : {}),
        },
        include: {
          users_friendships_followingIdTousers: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              level: true,
              points: true,
              lastSeen: true,
              bio: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(
        following.map((f) => ({
          ...f.users_friendships_followingIdTousers,
          friendshipId: f.id,
          friendshipStatus: f.status,
        })),
      );
    }

    if (tab === "suggestions") {
      // Users yang belum saya follow
      const myFollowingIds = await prisma.friendships.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      const excludeIds = [userId, ...myFollowingIds.map((f) => f.followingId)];

      const suggestions = await prisma.users.findMany({
        where: {
          id: { notIn: excludeIds },
          role: "user", // Hanya tampilkan user biasa sebagai saran
          ...(search ? { name: { contains: search } } : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          level: true,
          points: true,
          lastSeen: true,
          bio: true,
          role: true,
        },
        take: 20,
        orderBy: { points: "desc" },
      });

      return NextResponse.json(suggestions);
    }

    // Default: tab === "friends" → mutual follows (both accepted)
    const myFollowing = await prisma.friendships.findMany({
      where: { followerId: userId, status: "accepted" },
      select: { followingId: true },
    });
    const followingIds = myFollowing.map((f) => f.followingId);

    const mutualFriends = await prisma.friendships.findMany({
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
            bio: true,
            role: true,
          },
        },
      },
    });

    const friends = mutualFriends
      .map((f) => f.users_friendships_followerIdTousers)
      .filter((f) =>
        search ? f.name?.toLowerCase().includes(search.toLowerCase()) : true,
      );

    return NextResponse.json(friends);
  } catch (error: any) {
    console.error("Error fetching friends:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
