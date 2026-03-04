import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get ALL invitations with all details
    const invitations = await prisma.materialinvite.findMany({
      include: {
        material: true,
        users_materialinvite_instructorIdTousers: true,
        users_materialinvite_userIdTousers: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      total: invitations.length,
      invitations: invitations.map((inv) => ({
        id: inv.id,
        token: inv.token,
        status: inv.status,
        materialId: inv.materialId,
        material: {
          id: inv.material?.id,
          title: inv.material?.title,
        },
        instructorId: inv.instructorId,
        instructor: {
          id: inv.users_materialinvite_instructorIdTousers?.id,
          name: inv.users_materialinvite_instructorIdTousers?.name,
          email: inv.users_materialinvite_instructorIdTousers?.email,
        },
        userId: inv.userId,
        user: {
          id: inv.users_materialinvite_userIdTousers?.id,
          name: inv.users_materialinvite_userIdTousers?.name,
          email: inv.users_materialinvite_userIdTousers?.email,
        },
        createdAt: inv.createdAt,
      })),
    });
  } catch (error) {
    console.error("Debug invitations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations", details: String(error) },
      { status: 500 },
    );
  }
}
