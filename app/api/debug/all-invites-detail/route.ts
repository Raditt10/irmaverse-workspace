import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get all invitations with full user details
    const invitations = await prisma.materialinvite.findMany({
      include: {
        users_materialinvite_userIdTousers: {
          select: { id: true, email: true, name: true },
        },
        users_materialinvite_instructorIdTousers: {
          select: { id: true, email: true, name: true },
        },
        material: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true },
      take: 20,
    });

    return NextResponse.json({
      totalInvitations: invitations.length,
      invitations: invitations.map((inv) => ({
        id: inv.id,
        token: inv.token.substring(0, 8) + "...",
        status: inv.status,
        createdAt: inv.createdAt,
        material: inv.material.title,
        instructor:
          inv.users_materialinvite_instructorIdTousers.name +
          " (" +
          inv.users_materialinvite_instructorIdTousers.email +
          ")",
        user:
          inv.users_materialinvite_userIdTousers.name +
          " (" +
          inv.users_materialinvite_userIdTousers.email +
          ")",
        userId: inv.users_materialinvite_userIdTousers.id,
        instructorId: inv.users_materialinvite_instructorIdTousers.id,
      })),
      allUsers: users,
    });
  } catch (error) {
    console.error("[DEBUG-ALL-INVITES] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
