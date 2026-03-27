import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/friends/follow - Follow seorang user
// Hanya role "user" yang boleh follow
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Guard: Hanya role "user"
    if ((session.user as any).role !== "user") {
      return NextResponse.json(
        { error: "Hanya pengguna biasa yang dapat mengikuti pengguna lain" },
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

    if (targetUserId === userId) {
      return NextResponse.json(
        { error: "Tidak bisa follow diri sendiri" },
        { status: 400 },
      );
    }

    // Cek apakah target user ada
    const targetUser = await prisma.users.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 },
      );
    }

    // Cek apakah sudah follow
    const existing = await prisma.friendships.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Sudah mengikuti user ini" },
        { status: 409 },
      );
    }

    // Cek apakah target user sudah follow kita → jika iya, langsung accepted (mutual)
    const reverseFollow = await prisma.friendships.findUnique({
      where: {
        followerId_followingId: {
          followerId: targetUserId,
          followingId: userId,
        },
      },
    });

    const status = reverseFollow ? "accepted" : "pending";

    // Buat friendship baru
    const friendship = await prisma.friendships.create({
      data: {
        id: crypto.randomUUID(),
        followerId: userId,
        followingId: targetUserId,
        status,
        updatedAt: new Date(),
      },
    });

    // Jika mutual, update kedua sisi jadi accepted
    if (reverseFollow && reverseFollow.status === "pending") {
      await prisma.friendships.update({
        where: { id: reverseFollow.id },
        data: { status: "accepted", updatedAt: new Date() },
      });
    }

    // Kirim notifikasi ke target user
    try {
      await prisma.notifications.create({
        data: {
          id: crypto.randomUUID(),
          userId: targetUserId,
          senderId: userId,
          type: "basic",
          title: "Pengikut Baru",
          message: `${session.user.name || "Seseorang"} mulai mengikuti kamu!`,
          actionUrl: `/u/${userId}`,
          updatedAt: new Date(),
        },
      });
    } catch (e) {
      // Notifikasi gagal tidak boleh block follow action
      console.error("Gagal kirim notifikasi:", e);
    }

    return NextResponse.json({
      success: true,
      friendship,
      isMutual: status === "accepted",
    });
  } catch (error: any) {
    console.error("Error follow user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
