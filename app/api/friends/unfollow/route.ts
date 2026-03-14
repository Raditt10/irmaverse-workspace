import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/friends/unfollow - Unfollow seorang user
// Hanya role "user" yang boleh unfollow
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Guard: Hanya role "user"
    if ((session.user as any).role !== "user") {
      return NextResponse.json(
        { error: "Hanya pengguna biasa yang dapat berhenti mengikuti pengguna lain" },
        { status: 403 },
      );
    }

    const { targetUserId } = await req.json();
    const userId = session.user.id;

    if (!targetUserId) {
      return NextResponse.json(
        { error: "targetUserId diperlukan" },
        { status: 400 },
      );
    }

    // Hapus friendship
    const deleted = await prisma.friendship.deleteMany({
      where: {
        followerId: userId,
        followingId: targetUserId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Kamu tidak mengikuti user ini" },
        { status: 404 },
      );
    }

    // Jika ada reverse follow, set ke pending (bukan mutual lagi)
    await prisma.friendship.updateMany({
      where: {
        followerId: targetUserId,
        followingId: userId,
        status: "accepted",
      },
      data: { status: "pending" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error unfollow user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
