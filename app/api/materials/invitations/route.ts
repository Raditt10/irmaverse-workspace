import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get pending invitations for this user
    console.log("Fetching invitations for user:", user.id, user.email);

    const invitations = await prisma.materialinvite.findMany({
      where: {
        userId: user.id,
        status: "pending",
      },
      include: {
        material: true,
        users_materialinvite_instructorIdTousers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format for frontend (instructor mapping)
    const formattedInvitations = invitations.map((inv) => ({
      ...inv,
      instructor: inv.users_materialinvite_instructorIdTousers,
    }));

    return NextResponse.json({
      success: true,
      invitations: formattedInvitations,
      total: invitations.length,
    });
  } catch (error) {
    console.error("Get invitations error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch invitations",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { token, status, reason, materialId } = body; // status: accepted or rejected

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 },
      );
    }

    // Attempt to find the invitation
    let invite = null;
    if (token) {
      invite = await prisma.materialinvite.findUnique({
        where: { token },
        include: { material: true },
      });
    }

    // SELF-HEALING FALLBACK: If token lookup fails, try finding by materialId + userId
    if (!invite && materialId && user.id) {
      console.log(
        "[POST /api/materials/invitations] Token failed or missing, trying fallback with materialId:",
        materialId,
      );
      invite = await prisma.materialinvite.findFirst({
        where: {
          materialId: materialId,
          userId: user.id,
        },
        include: { material: true },
      });
    }

    if (!invite) {
      return NextResponse.json(
        { error: "Undangan tidak ditemukan. Silakan refresh halaman." },
        { status: 404 },
      );
    }

    // Verify invitation is for this user
    if (invite.userId !== user.id) {
      return NextResponse.json(
        { error: "This invitation is not for you" },
        { status: 403 },
      );
    }

    // Update invitation status
    const updatedInvite = await prisma.materialinvite.update({
      where: { id: invite.id },
      data: {
        status,
        reason: status === "rejected" ? reason : null,
        updatedAt: new Date(),
      } as any,
    });

    // Sync with notifications
    try {
      await prisma.notifications.updateMany({
        where: {
          OR: [
            { inviteToken: invite.token },
            {
              userId: user.id,
              resourceId: invite.materialId,
              type: "invitation",
            },
          ],
        },
        data: { status } as any,
      });
    } catch (error) {
      console.warn("Failed to sync notification status:", error);
    }

    // If accepted, create course enrollment + auto-enroll in program
    if (status === "accepted") {
      await prisma.courseenrollment.upsert({
        where: {
          materialId_userId: {
            materialId: invite.materialId,
            userId: user.id,
          },
        },
        update: {
          role: "user",
          enrolledAt: new Date(),
        },
        create: {
          id: `enr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          materialId: invite.materialId,
          userId: user.id,
          role: "user",
          enrolledAt: new Date(),
        },
      });

      // Auto-enroll in parent program if material belongs to one
      const materialWithProgram = await prisma.material.findUnique({
        where: { id: invite.materialId },
        select: { programId: true },
      });

      if (materialWithProgram?.programId) {
        await prisma.program_enrollments.upsert({
          where: {
            programId_userId: {
              programId: materialWithProgram.programId,
              userId: user.id,
            },
          },
          update: {},
          create: {
            programId: materialWithProgram.programId,
            userId: user.id,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Invitation ${status}`,
      invite: updatedInvite,
    });
  } catch (error) {
    console.error("Update invitation error:", error);
    return NextResponse.json(
      { error: "Failed to update invitation" },
      { status: 500 },
    );
  }
}
