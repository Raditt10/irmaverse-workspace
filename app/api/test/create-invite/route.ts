import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// POST to manually create an invitation for testing
export async function POST(req: NextRequest) {
  try {
    const { materialId, userId, instructorId } = await req.json();

    // For testing, allow manual instructorId specification
    let finalInstructorId = instructorId;

    if (!finalInstructorId) {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: "Unauthorized - provide instructorId or login" },
          { status: 401 },
        );
      }
      finalInstructorId = session.user.id;
    }

    console.log("[TEST-INVITE] Creating invite:");
    console.log("  Instructor ID:", finalInstructorId);
    console.log("  Material ID:", materialId);
    console.log("  User ID:", userId);

    // Check material exists
    const material = await prisma.material.findUnique({
      where: { id: materialId },
    });
    if (!material) {
      return NextResponse.json(
        { error: "Material tidak ditemukan" },
        { status: 404 },
      );
    }

    // Check user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!targetUser) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 },
      );
    }

    // Create invitation
    const token =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    const invite = await prisma.materialinvite.create({
      data: {
        materialId,
        instructorId: finalInstructorId,
        userId,
        token,
        status: "pending",
      },
      include: {
        material: true,
        users_materialinvite_instructorIdTousers: true,
        users_materialinvite_userIdTousers: true,
      },
    });

    console.log("[TEST-INVITE] Invitation created successfully:", invite.id);

    return NextResponse.json(
      {
        success: true,
        message: "Invitation created untuk test",
        invitation: {
          id: invite.id,
          token: invite.token,
          material: invite.material.title,
          instructor: (invite as any).users_materialinvite_instructorIdTousers
            ?.name,
          user: (invite as any).users_materialinvite_userIdTousers?.name,
          status: invite.status,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[TEST-INVITE] Error:", error);
    return NextResponse.json(
      { error: "Failed to create test invitation", details: String(error) },
      { status: 500 },
    );
  }
}

// GET to fetch all users and materials for testing
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
      take: 10,
    });

    const materials = await prisma.material.findMany({
      select: {
        id: true,
        title: true,
        instructorId: true,
      },
      take: 10,
    });

    return NextResponse.json({
      users,
      materials,
      instruction:
        "POST dengan body: {materialId, userId} untuk create test invite",
    });
  } catch (error) {
    console.error("[TEST-INVITE-GET] Error:", error);
    return NextResponse.json(
      { error: "Failed", details: String(error) },
      { status: 500 },
    );
  }
}
