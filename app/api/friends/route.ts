import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/friends - Ambil daftar teman (mutual follows = accepted)
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const tab = searchParams.get("tab") || "friends"; // friends | followers | following | suggestions

    if (tab === "followers") {
      // Orang yang mengikuti saya
      const followers = await prisma.friendship.findMany({
        where: {
          followingId: userId,
          ...(search ? { follower: { name: { contains: search } } } : {}),
        },
        include: {
          follower: {
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
      const myFollowing = await prisma.friendship.findMany({
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
          ...f.follower,
          friendshipId: f.id,
          friendshipStatus: f.status,
          iFollowBack: followingMap.has(f.followerId),
        })),
      );
    }

    if (tab === "following") {
      // Orang yang saya ikuti
      const following = await prisma.friendship.findMany({
        where: {
          followerId: userId,
          ...(search ? { following: { name: { contains: search } } } : {}),
        },
        include: {
          following: {
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
          ...f.following,
          friendshipId: f.id,
          friendshipStatus: f.status,
        })),
      );
    }

    if (tab === "suggestions") {
      // Users yang belum saya follow
      const myFollowingIds = await prisma.friendship.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      const excludeIds = [userId, ...myFollowingIds.map((f) => f.followingId)];

      const suggestions = await prisma.user.findMany({
        where: {
          id: { notIn: excludeIds },
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
    const myFollowing = await prisma.friendship.findMany({
      where: { followerId: userId, status: "accepted" },
      select: { followingId: true },
    });
    const followingIds = myFollowing.map((f) => f.followingId);

    const mutualFriends = await prisma.friendship.findMany({
      where: {
        followerId: { in: followingIds },
        followingId: userId,
        status: "accepted",
      },
      include: {
        follower: {
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
      .map((f) => f.follower)
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
