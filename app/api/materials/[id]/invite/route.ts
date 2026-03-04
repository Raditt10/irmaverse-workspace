import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { createBulkNotifications } from "@/lib/notifications";
import { emitNotificationsToUsers } from "@/lib/socket-emit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const { userIds } = await req.json();
    const { id: materialId } = await params;

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 },
      );
    }

    const User = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!User) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 },
      );
    }

    if (User.role !== "instruktur" && User.role !== "admin") {
      return NextResponse.json(
        { error: "Hanya instruktur yang bisa mengundang peserta!" },
        { status: 403 },
      );
    }

    // Check which users already have pending or accepted invitations
    const existingInvites = await (prisma as any).materialinvite.findMany({
      where: {
        materialId,
        userId: { in: userIds },
        status: { in: ["pending", "accepted"] },
      },
      select: { userId: true },
    });

    const alreadyInvitedIds = existingInvites.map(
      (invite: any) => invite.userId,
    );
    const newUserIds = userIds.filter(
      (id: string) => !alreadyInvitedIds.includes(id),
    );

    // Create invitations for new users
    if (newUserIds.length > 0) {
      const generateToken = () =>
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      const inviteData = newUserIds.map((userId: string) => ({
        id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        materialId,
        instructorId: session.user.id,
        userId,
        token: generateToken(),
        status: "pending" as const,
        updatedAt: new Date(),
      }));

      await (prisma as any).materialinvite.createMany({
        data: inviteData,
      });

      const material = await (prisma as any).material.findUnique({
        where: { id: materialId },
        include: {
          users: true,
        },
      });

      const notifications = await createBulkNotifications(
        inviteData.map((inv: any) => ({
          userId: inv.userId,
          type: "invitation" as const,
          title: material?.title || "Undangan Kajian",
          message: `${User.name || "Instruktur"} mengundang Anda untuk bergabung ke kajian "${material?.title || "Materi"}"`,
          icon: "book",
          resourceType: "material",
          resourceId: materialId,
          actionUrl: `/materials/${materialId}`,
          inviteToken: inv.token,
          senderId: session.user.id,
        })),
      );

      await emitNotificationsToUsers(
        notifications.map((n) => ({
          userId: n.userId,
          notification: n,
        })),
      );
    }

    return NextResponse.json({
      success: true,
      newInvites: newUserIds.length,
      newUserIds: newUserIds,
      alreadyInvited: alreadyInvitedIds,
      totalAttempted: userIds.length,
      materialId: materialId,
    });
  } catch (error) {
    console.error("Error inviting users to material:", error);
    return NextResponse.json(
      { error: "Gagal mengundang peserta" },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 },
      );
    }

    const User = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!User) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 },
      );
    }

    if (User.role !== "instruktur" && User.role !== "admin") {
      return NextResponse.json(
        {
          error: "Hanya instruktur dan admin yang bisa mengakses halaman ini!",
        },
        { status: 403 },
      );
    }
    const query = req.nextUrl.searchParams.get("q") || "";
    const { id: materialId } = await params;

    const users = await prisma.user.findMany({
      where: {
        OR: [{ name: { contains: query } }, { email: { contains: query } }],
        NOT: {
          courseenrollment: { some: { materialId } },
        },
      },
      take: 10,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error searching users for invitation:", error);
    return NextResponse.json(
      { error: "Gagal mencari pengguna untuk undangan" },
      { status: 500 },
    );
  }
}
